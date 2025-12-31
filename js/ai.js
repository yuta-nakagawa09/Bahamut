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

        // 1. 既存部隊の行動AI (補充・強化・移動)
        // ここを先に実行することで、新規部隊作成よりも既存部隊の強化を優先させる
        const myUnitsSnapshot = Model.state.mapUnits.filter(u => u.owner === faction.id);

        for (const enemy of myUnitsSnapshot) {
            enemy.hasActed = false; // ターン開始リセット

            // 死んでるユニットはスキップ
            if (!Model.state.mapUnits.includes(enemy)) continue;

            // 1-1. 回復・補充
            // 金があるなら確率高めで実行 (300G以上、かつ確率50%〜90%)
            if (faction.gold >= Data.AI.RECRUIT.MIN_GOLD && enemy.army.length < Data.MAX_UNITS) {
                const ut = Data.FACTION_UNITS[faction.master.id][0];
                const chance = (faction.gold > Data.AI.RECRUIT.RICH_GOLD) ? Data.AI.RECRUIT.CHANCE_HIGH : Data.AI.RECRUIT.CHANCE_LOW;

                // Model.recruitUnit を使用して整合性を保つ
                if (Math.random() < chance) {
                    // recruitUnit は内部でコストチェックと引き落としを行う
                    Model.recruitUnit(enemy.id, ut.id);
                }
            }

            // 1-2. 移動先決定：最も優先度の高い隣接拠点へ
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

            // 侵攻
            if (current.neighbors && current.neighbors.length > 0 && Math.random() > Data.AI.INVADE_CHANCE) {
                const targets = current.neighbors
                    .map(id => Model.state.castles.find(c => c.id === id))
                    .sort((a, b) => {
                        // 優先順位： 敵の拠点 > 中立 > 味方（通過）
                        const scoreA = (a.owner !== faction.id) ? (a.owner === 'player' ? 2 : 1) : 0;
                        const scoreB = (b.owner !== faction.id) ? (b.owner === 'player' ? 2 : 1) : 0;
                        return scoreB - scoreA;
                    });

                if (targets.length > 0) {
                    const target = targets[0];
                    enemy.targetX = target.x;
                    enemy.targetY = target.y;
                    enemy.isMoving = true;
                    await this.waitForAction(enemy);
                }
            }
        }

        // 2. 新規部隊編成 (Create Army)
        // 既存部隊の行動（特に補充）で資金が使われた後に行う

        // 部隊数は減っている可能性は低いが増えている可能性もない（この処理の後に追加されるので）。
        // 一応最新の状態を取得。
        const currentUnits = Model.state.mapUnits.filter(u => u.owner === faction.id);

        // 最大部隊数制限 (MAX_ARMIES)
        if (currentUnits.length < Data.MAX_ARMIES && faction.gold >= Data.ARMY_COST) {
            // 本拠地または所有拠点に空きがあるか確認
            const spawnPoints = Model.state.castles
                .filter(c => c.owner === faction.id)
                .filter(c => !Model.state.mapUnits.some(u => Math.hypot(u.x - c.x, u.y - c.y) < Data.UI.CASTLE_DETECT_RADIUS));

            if (spawnPoints.length > 0) {
                // 本拠地優先、なければランダム
                let spawn = spawnPoints.find(c => c.id === faction.hqId);
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
                    resolve();
                    return;
                }

                requestAnimationFrame(check);
            };
            check();
        });
    }
};


