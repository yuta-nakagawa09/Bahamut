/**
 * STRATEGIC AI: 戦略フェーズの敵思考ロジック
 * 敵勢力のターン進行、部隊の雇用・移動・攻撃などの意思決定を行う。
 * @namespace
 */
window.StrategicAI = {
    aiTimer: null,

    // -------------------------------------------------------------------------
    // メインループ
    // -------------------------------------------------------------------------
    /**
     * 敵AIターンの実行 (Controllerから呼ばれる)
     * 全敵勢力を順番に処理する。
     */
    async runEnemyTurn() {
        if (Model.state.currentScreen !== 'map') return; // 戦闘中などは中断

        const enemies = Model.state.factions.filter(f => !f.isPlayer && f.isAlive);

        for (const faction of enemies) {
            View.showMessage(`${faction.name}軍 フェーズ`);
            await this.processFaction(faction);
            // 演出待ち
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        View.showMessage("自軍ターン");
        if (Model.state.currentScreen === 'map' && window.Controller) {
            Controller.startPlayerTurn();
        }
    },

    // -------------------------------------------------------------------------
    // 意思決定プロセス
    // -------------------------------------------------------------------------
    /**
     * 特定の勢力のターン処理を実行
     * 支配下の全ユニットに対して移動・行動を決定する。
     * @param {Object} faction - 処理対象の勢力データ
     */
    async processFaction(faction) {
        // 収入処理
        const income = Model.calculateFactionIncome(faction.id);
        faction.gold += income;
        const hq = Model.state.castles.find(c => c.id === faction.hqId);

        // ---------------------------------------------------------------------
        // 1. 既存部隊の移動・攻撃 (Move & Attack)
        // ---------------------------------------------------------------------
        // まずは盤面を動かすことを最優先する
        let myUnits = Model.state.mapUnits.filter(u => u.owner === faction.id);

        for (const enemy of myUnits) {
            enemy.hasActed = false; // ターン開始リセット

            // 死んでるユニットはスキップ
            if (!Model.state.mapUnits.includes(enemy)) continue;

            // 移動先決定：最も優先度の高い隣接拠点へ
            const current = Model.state.castles.reduce((prev, curr) => Math.hypot(curr.x - enemy.x, curr.y - enemy.y) < Math.hypot(prev.x - enemy.x, prev.y - enemy.y) ? curr : prev);

            // 防衛ロジック優先
            // 本拠地周辺に敵がいるか？
            const enemiesNearHQ = Model.state.mapUnits.filter(u => u.owner !== faction.id && Math.hypot(u.x - hq.x, u.y - hq.y) < Data.AI.DEFENSE.DIST);
            const alliesAtHQ = Model.state.mapUnits.filter(u => u.owner === faction.id && Math.hypot(u.x - hq.x, u.y - hq.y) < Data.AI.DEFENSE.RADIUS_HQ);
            const distFromHQ = Math.hypot(enemy.x - hq.x, enemy.y - hq.y);

            // 自分が本拠地にいない、かつ 本拠地が危ない(敵がいて味方が少ない)なら戻る
            if (distFromHQ > Data.AI.DEFENSE.SAFE_DIST && enemiesNearHQ.length > 0 && alliesAtHQ.length < Data.AI.DEFENSE.ALLY_THRESHOLD) {
                enemy.targetX = hq.x;
                enemy.targetY = hq.y;
                enemy.isMoving = true;
                await this.waitForAction(enemy);
                continue;
            }

            // 以下、通常の侵攻ロジック
            // 防衛待機: 本拠地にいて特に危機がないなら、確率で待機
            // if (current === hq && alliesAtHQ.length < Data.AI.DEFENSE.ALLY_THRESHOLD && Math.random() < 0.7) continue;

            // 侵攻判断
            // -----------------------------------------------------------------
            // 2. 増援ロジック (Reinforce)
            // 安全な後方から、脅威のある空の前線へ移動する
            // -----------------------------------------------------------------
            // 現在地が「安全」（周辺に敵がいない）かチェック
            const currentCastles = Model.state.castles.filter(c => Math.hypot(c.x - enemy.x, enemy.y - c.y) < 10); // ほぼ真上
            const atCastle = currentCastles.length > 0 ? currentCastles[0] : null;

            if (atCastle) {
                // 現在地の周辺に敵がいるか？
                const isThreatened = Model.state.mapUnits.some(u =>
                    u.owner !== faction.id &&
                    Math.hypot(u.x - atCastle.x, u.y - atCastle.y) < Data.AI.DEFENSE.DIST
                );

                if (!isThreatened && atCastle.neighbors) {
                    // 安全なら、隣接する「危機にある空き拠点」を探す
                    const needyNeighbors = atCastle.neighbors
                        .map(nid => Model.state.castles.find(c => c.id === nid))
                        .filter(c => {
                            if (!c || c.owner !== faction.id) return false;

                            // 既に味方がいるか？
                            const hasAlly = Model.state.mapUnits.some(u =>
                                u.owner === faction.id &&
                                Math.hypot(u.x - c.x, u.y - c.y) < Data.UI.UNIT_DETECT_RADIUS
                            );
                            if (hasAlly) return false;

                            // 敵に隣接しているか？（脅威があるか）
                            const hasEnemyNeighbor = c.neighbors.some(nnid => {
                                const neighbor = Model.state.castles.find(nc => nc.id === nnid);
                                return neighbor && neighbor.owner !== faction.id && neighbor.owner !== 'neutral';
                            });

                            return hasEnemyNeighbor;
                        });

                    if (needyNeighbors.length > 0) {
                        const target = needyNeighbors[0];
                        enemy.targetX = target.x;
                        enemy.targetY = target.y;
                        enemy.isMoving = true;
                        View.showMessage(`${faction.name}: 前線増援`);
                        await this.waitForAction(enemy);
                        continue;
                    }
                }

                // -----------------------------------------------------------------
                // 3. 侵攻判断 (Invade)
                // -----------------------------------------------------------------
                // 防衛優先: 現在地が脅威下にある場合、中立や安全な敵拠点への攻撃（逃亡）はしない
                // 本当に敵を攻撃する場合のみ許可する（カウンター）
                if (isThreatened) {
                    // 攻撃以外の移動は禁止
                    // ただし、この後のロジックで targets をフィルタリングすることで制御する
                }
            }

            if (current.neighbors && current.neighbors.length > 0 && Math.random() > Data.AI.INVADE_CHANCE) {
                // 自軍戦力計算
                const myPower = enemy.army.reduce((sum, u) => sum + Model.getUnitPower(u), 0);
                // 弱小部隊かどうかの判定 (概ね初期ユニット2体分以下なら弱小とみなす)
                const isWeak = myPower < 300;

                // 現在地が脅威下にあるか再取得（変数スコープ都合）
                const isUnderThreat = atCastle && Model.state.mapUnits.some(u =>
                    u.owner !== faction.id &&
                    Math.hypot(u.x - enemy.x, u.y - enemy.y) < Data.AI.DEFENSE.DIST
                );

                const targets = current.neighbors
                    .map(id => Model.state.castles.find(c => c.id === id))
                    .filter(target => {
                        if (!target) return false;
                        // 自勢力の拠点は攻撃対象外
                        if (target.owner === faction.id) return false;

                        // 【防衛優先】脅威下にある場合、中立への攻撃はしない
                        // ただし、拠点に十分な戦力（2部隊以上）があるなら拡大を許可する
                        const alliesAtBase = Model.state.mapUnits.filter(u =>
                            u.owner === faction.id &&
                            Math.hypot(u.x - enemy.x, u.y - enemy.y) < Data.UI.UNIT_DETECT_RADIUS
                        ).length;

                        if (isUnderThreat && target.owner === 'neutral' && alliesAtBase < 2) return false;

                        // 敵拠点の戦力チェック (やみくもな攻撃の防止)
                        // 目標地点にいる敵勢力の部隊を取得
                        const enemiesAtTarget = Model.state.mapUnits.filter(u =>
                            u.owner !== faction.id &&
                            Math.hypot(u.x - target.x, u.y - target.y) < Data.UI.UNIT_DETECT_RADIUS
                        );

                        if (enemiesAtTarget.length > 0) {
                            // 駐留している最も強い部隊の戦力を取得
                            const maxEnemyPower = enemiesAtTarget.reduce((max, army) => {
                                const p = army.army.reduce((s, u) => s + Model.getUnitPower(u), 0);
                                return Math.max(max, p);
                            }, 0);

                            // 自分の戦力が敵の最強部隊の 70% 未満なら攻撃しない (安易な特攻を防ぐ)
                            if (myPower < maxEnemyPower * 0.7) {
                                return false;
                            }
                        } else {
                            // 敵部隊がいない場合でも、脅威下なら「敵領土」への深入りも避けるべきだが、
                            // 「敵部隊への攻撃」ならカウンターとして成立するのでOKとする。
                            // ただし、単なる空き地への移動なら防衛放棄になる可能性がある。
                            // ここでは「中立不可」だけで一旦十分とする。
                        }
                        return true;
                    })
                    .sort((a, b) => {
                        // 基本スコア: 敵(Player)=2, その他(Neutral/Enemy2)=1, 味方=0 (ただし味方は除外済み)
                        // ここでは「倒すべき敵（プレイヤー）」を高く評価する傾向がデフォルト
                        let scoreA = (a.owner === 'player') ? 2 : 1;
                        let scoreB = (b.owner === 'player') ? 2 : 1;

                        // 戦力が低い場合は、安全地帯（中立）＞他勢力＞プレイヤー の順で優先する
                        if (isWeak) {
                            const isNeutralA = (a.owner === 'neutral');
                            const isNeutralB = (b.owner === 'neutral');
                            const isPlayerA = (a.owner === 'player');
                            const isPlayerB = (b.owner === 'player');

                            // 中立は最優先 (+20点)
                            if (isNeutralA) scoreA += 20;
                            if (isNeutralB) scoreB += 20;

                            // プレイヤーは避ける (-10点) -> 結果的に 他勢力(Enemy2など) がプレイヤーよりマシな選択肢になる
                            if (isPlayerA) scoreA -= 10;
                            if (isPlayerB) scoreB -= 10;
                        }

                        // スコアが高い順
                        return scoreB - scoreA;
                    });

                if (targets.length > 0) {
                    const target = targets[0];
                    enemy.targetX = target.x;
                    enemy.targetY = target.y;
                    enemy.isMoving = true;
                    await this.waitForAction(enemy);
                    // 行動後のウェイト（視認性向上）
                    await new Promise(resolve => setTimeout(resolve, 600));
                }
            }
        }

        // ---------------------------------------------------------------------
        // 2. 既存部隊の補充 (Replenish)
        // ---------------------------------------------------------------------
        // 移動・戦闘後、生存している部隊に対して補充を行う
        // 再取得（戦闘で減っている可能性があるため）
        myUnits = Model.state.mapUnits.filter(u => u.owner === faction.id);

        for (const enemy of myUnits) {
            // 金があるなら確率高めで実行
            if (faction.gold >= Data.AI.RECRUIT.MIN_GOLD && enemy.army.length < Data.MAX_UNITS) {
                const ut = Data.FACTION_UNITS[faction.master.id][0];
                const chance = (faction.gold > Data.AI.RECRUIT.RICH_GOLD) ? Data.AI.RECRUIT.CHANCE_HIGH : Data.AI.RECRUIT.CHANCE_LOW;

                // Model.recruitUnit を使用して整合性を保つ
                if (Math.random() < chance) {
                    // recruitUnit は内部でコストチェックと引き落としを行う
                    Model.recruitUnit(enemy.id, ut.id);
                }
            }
        }

        // ---------------------------------------------------------------------
        // 3. 新規部隊編成 (Create Army)
        // ---------------------------------------------------------------------
        // 既存部隊の行動・補充で資金が使われた後に行う

        // 部隊数は減っている可能性は低いが増えている可能性もない（この処理の後に追加されるので）。
        // 一応最新の状態を取得。
        const currentUnits = Model.state.mapUnits.filter(u => u.owner === faction.id);

        // 最大部隊数制限 (MAX_ARMIES)
        if (currentUnits.length < Data.MAX_ARMIES && faction.gold >= Data.ARMY_COST) {
            // 本拠地または所有拠点に空きがあるか確認 (重複可とする)
            const spawnPoints = Model.state.castles
                .filter(c => c.owner === faction.id);

            if (spawnPoints.length > 0) {
                // スポーン地点の優先度付け
                // 1. 敵に隣接していて（脅威）、かつ部隊がいない拠点 (緊急防衛)
                // 2. 本拠地 (HQ)
                // 3. その他

                spawnPoints.sort((a, b) => {
                    const getPriority = (c) => {
                        // 部隊が既にいるか？
                        const hasUnit = Model.state.mapUnits.some(u =>
                            u.owner === faction.id &&
                            Math.hypot(u.x - c.x, u.y - c.y) < Data.UI.UNIT_DETECT_RADIUS
                        );

                        // 敵隣接チェック
                        const hasEnemyNeighbor = c.neighbors && c.neighbors.some(nid => {
                            const n = Model.state.castles.find(nc => nc.id === nid);
                            return n && n.owner !== faction.id && n.owner !== 'neutral';
                        });

                        // 優先度スコア計算
                        if (!hasUnit && hasEnemyNeighbor) return 100; // 最優先：空の前線
                        if (c.id === faction.hqId) return 50;         // 次点：HQ
                        return 10;                                    // その他
                    };

                    return getPriority(b) - getPriority(a);
                });

                let spawn = spawnPoints[0];

                // Controller経由だとUI依存があるので、Model経由で直接作成する
                const newUnit = Model.createNewArmy(faction.id, spawn.x, spawn.y);
                if (newUnit) {
                    // 基本ユニットを1体追加
                    const basicUnit = Data.FACTION_UNITS[faction.master.id][0];
                    Model.recruitUnit(newUnit.id, basicUnit.id);
                    faction.gold -= Data.ARMY_COST;
                    // 新規部隊はこのターンは行動しない（isMovingセットしない）
                }
            }
        }

        // ---------------------------------------------------------------------
        // 4. 既存部隊の強化 (Enhance)
        // ---------------------------------------------------------------------
        // 資金に余裕がある場合、部隊の強化を行う
        // 条件緩和: 常に最大数(MAX_ARMIES)でなくても、ある程度部隊が揃っていて金があれば強化する

        const isRich = faction.gold >= Data.AI.ENHANCE.RICH_GOLD;
        const hasEnoughArmies = currentUnits.length >= Data.AI.ENHANCE.MIN_ARMY_COUNT; // 少なくとも2部隊はいれば強化検討

        if ((isRich || (hasEnoughArmies && faction.gold >= Data.AI.ENHANCE.NORMAL_GOLD))) {
            for (const unit of currentUnits) {
                // ユニット数が最大の部隊、または精鋭部隊(Rank持ちが多いなど)を優先したいが
                // シンプルに「全ユニットに対してチャンスがある」ようにする

                for (let i = 0; i < unit.army.length; i++) {
                    if (faction.gold < Data.AI.ENHANCE.MIN_GOLD) break; // 資金切れ

                    // 確率で強化実行 (金持ちなら高確率)
                    const enhanceChance = isRich ? Data.AI.ENHANCE.CHANCE_RICH : Data.AI.ENHANCE.CHANCE_NORMAL;

                    if (Math.random() < enhanceChance) {
                        // 攻撃かHPかランダム
                        const type = Math.random() < Data.AI.ENHANCE.TYPE_RATIO_ATK ? 'atk' : 'hp';
                        const cost = (type === 'atk') ? Data.ENHANCEMENT.ATK.COST : Data.ENHANCEMENT.HP.COST;

                        if (faction.gold >= cost) {
                            Model.enhanceUnit(unit.id, i, type);
                            // 連続強化を防ぐため、1回強化したらこのユニットのこの兵士はスキップ...しない（金があればガンガン強化してほしい）
                        }
                    }
                }
            }
        }
    },

    // -------------------------------------------------------------------------
    // ユーティリティ
    // -------------------------------------------------------------------------
    /**
     * ユニットの行動（移動およびそれに伴う戦闘）の完了を待機する
     * pollingを用いて非同期に待つ単純な実装
     * @param {Object} unit - 監視対象のユニット
     */
    async waitForAction(unit) {
        return new Promise(resolve => {
            const check = () => {
                // ユニットが消滅していたら終了
                if (!Model.state.mapUnits.includes(unit)) {
                    resolve();
                    return;
                }

                // 戦闘中なら戦闘終了まで待つ
                if (Model.state.battle && Model.state.battle.active) {
                    // 戦闘が終わるまで polling
                    if (!Model.state.battle.active) {
                        // 戦闘終了直後、少しウェイトを入れる
                        setTimeout(resolve, 500);
                        return;
                    }
                }
                // 移動中なら完了まで待つ
                else if (unit.isMoving) {
                    // まだ移動中
                }
                // 移動も戦闘もしていないなら完了
                else {
                    // 少し待ってから完了とする（連続行動時の視認性確保と、Battle発生のラグ対策）
                    setTimeout(resolve, 200);
                    return;
                }

                requestAnimationFrame(check);
            };
            check();
        });
    }
};


