/**
 * STRATEGIC AI: 戦略フェーズの敵思考ロジック
 */
window.StrategicAI = {
    aiTimer: null,

    async runEnemyTurn() {
        if (Model.state.currentScreen !== 'map') return; // 戦闘中などは中断

        const enemies = Model.state.factions.filter(f => !f.isPlayer && f.isAlive);

        for (const faction of enemies) {
            View.showMessage(`${faction.name}軍 フェーズ`);
            this.processFaction(faction);
            // 演出待ち
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // 全敵の思考・移動完了を待ってプレイヤーターンへ (簡易的にsetTimeout)
        this.aiTimer = setTimeout(() => {
            if (Model.state.currentScreen === 'map' && window.Controller) {
                Controller.startPlayerTurn();
            }
        }, 1000);
    },

    processFaction(faction) {
        // 収入
        const income = 100 + Model.state.castles.filter(c => c.owner === faction.id).length * 200;
        faction.gold += income;
        const hq = Model.state.castles.find(c => c.id === faction.hqId);

        // 1. 既存部隊の行動AI (補充・強化・移動)
        // ここを先に実行することで、新規部隊作成よりも部隊強化を優先させる
        const myUnitsSnapshot = Model.state.mapUnits.filter(u => u.owner === faction.id);

        myUnitsSnapshot.forEach(enemy => {
            enemy.hasActed = false; // ターン開始リセット

            // 1-1. 回復・補充
            // 金があるなら確率高めで実行 (300G以上、かつ確率50%〜90%)
            if (faction.gold >= 300 && enemy.army.length < Data.MAX_UNITS) {
                const ut = Data.FACTION_UNITS[faction.master.id][0];
                const chance = (faction.gold > 1000) ? 0.9 : 0.5;

                // Model.recruitUnit を使用して整合性を保つ
                if (Math.random() < chance) {
                    // recruitUnit は内部でコストチェックと引き落としを行う
                    Model.recruitUnit(enemy.id, ut.id);
                }
            }

            // 1-2. 移動：一番近い敵拠点または敵ユニットを目指す
            const current = Model.state.castles.reduce((prev, curr) => Math.hypot(curr.x - enemy.x, curr.y - enemy.y) < Math.hypot(prev.x - enemy.x, prev.y - enemy.y) ? curr : prev);

            // 防衛ロジック優先
            // 本拠地周辺(200px以内)に敵がいるか？
            const enemiesNearHQ = Model.state.mapUnits.filter(u => u.owner !== faction.id && Math.hypot(u.x - hq.x, u.y - hq.y) < 200);
            const alliesAtHQ = Model.state.mapUnits.filter(u => u.owner === faction.id && Math.hypot(u.x - hq.x, u.y - hq.y) < 50);
            const distFromHQ = Math.hypot(enemy.x - hq.x, enemy.y - hq.y);

            // 自分が本拠地にいない、かつ 本拠地が危ない(敵がいて味方が少ない)なら戻る
            if (distFromHQ > 50 && enemiesNearHQ.length > 0 && alliesAtHQ.length < 2) {
                enemy.targetX = hq.x;
                enemy.targetY = hq.y;
                enemy.isMoving = true;
                return;
            }

            // 以下、通常の侵攻ロジック
            // 防衛待機: 本拠地にいて特に危機がないなら、確率で待機
            if (current === hq && alliesAtHQ.length < 2 && Math.random() < 0.7) return;

            // 侵攻
            if (current.neighbors && current.neighbors.length > 0 && Math.random() > 0.3) {
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
                }
            }
        });

        // 2. 新規部隊編成 (Create Army)
        // 既存部隊の行動（特に補充）で資金が使われた後に行う

        // 部隊数は減っている可能性は低いが増えている可能性もない（この処理の後に追加されるので）。
        // 一応最新の状態を取得。
        const currentUnits = Model.state.mapUnits.filter(u => u.owner === faction.id);

        // 本拠地があり、部隊枠があり、金が十分なら作成
        if (hq && currentUnits.length < Data.MAX_ARMIES && faction.gold >= (Data.ARMY_COST + 300)) {
            // isHqOccupied チェックを削除: 重なっても部隊を作成する
            // 資金に余裕があれば積極的に作る
            const urge = (currentUnits.length === 0) ? 1.0 : (faction.gold > 2000 ? 0.9 : 0.7);

            if (Math.random() < urge) {
                // 基本ユニット
                const ut = Data.FACTION_UNITS[faction.master.id][0];
                if (faction.gold >= Data.ARMY_COST + ut.cost) {
                    faction.gold -= (Data.ARMY_COST + ut.cost);
                    const newUnit = {
                        id: `e-${faction.id}-${Date.now()}`,
                        owner: faction.id,
                        x: hq.x, y: hq.y,
                        targetX: hq.x, targetY: hq.y,
                        emoji: ut.emoji,
                        army: [{ ...ut, currentHp: ut.hp, rank: 0, xp: 0 }],
                        isMaster: false, hasActed: true, isMoving: false, // 作成ターンは行動終了
                    };
                    Model.state.mapUnits.push(newUnit);
                    View.showMessage(`${faction.name}軍が増援部隊を編成しました`);
                }
            }
        }
    }
};
