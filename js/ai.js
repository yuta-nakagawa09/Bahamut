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
            if (current.neighbors && current.neighbors.length > 0 && Math.random() > Data.AI.INVADE_CHANCE) {
                // 自軍戦力計算
                const myPower = enemy.army.reduce((sum, u) => sum + Model.getUnitPower(u), 0);
                // 弱小部隊かどうかの判定 (概ね初期ユニット2体分以下なら弱小とみなす)
                const isWeak = myPower < 300;

                const targets = current.neighbors
                    .map(id => Model.state.castles.find(c => c.id === id))
                    .filter(target => {
                        if (!target) return false;
                        // 自勢力の拠点は攻撃対象外（移動だけならありだが、ここはInvadeロジックなので）
                        if (target.owner === faction.id) return false;

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
                // 本拠地優先、なければランダム
                let spawn = spawnPoints.find(c => c.id === faction.hqId);
                // 本拠地に既に部隊がいる場合でも、本拠地優先なら spawn は設定される
                // もし本拠地以外も含めてランダムにしたい場合はロジック調整が必要だが、
                // 基本的には本拠地防衛・出撃が重要なので本拠地優先で良い。

                if (!spawn) spawn = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];

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

        const isRich = faction.gold >= 800;
        const hasEnoughArmies = currentUnits.length >= 2; // 少なくとも2部隊はいれば強化検討

        if ((isRich || (hasEnoughArmies && faction.gold >= 500))) {
            for (const unit of currentUnits) {
                // ユニット数が最大の部隊、または精鋭部隊(Rank持ちが多いなど)を優先したいが
                // シンプルに「全ユニットに対してチャンスがある」ようにする

                for (let i = 0; i < unit.army.length; i++) {
                    if (faction.gold < 200) break; // 資金切れ

                    // 確率で強化実行 (金持ちなら高確率)
                    const enhanceChance = isRich ? 0.6 : 0.3;

                    if (Math.random() < enhanceChance) {
                        // 攻撃かHPかランダム
                        const type = Math.random() < 0.5 ? 'atk' : 'hp';
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


