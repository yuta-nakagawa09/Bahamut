/**
 * BATTLE SYSTEM: 戦闘ロジック
 */
window.BattleSystem = {
    start() {
        if (this.aiTimer) clearTimeout(this.aiTimer);
        // Note: window.gameState is used in some places, sync it just in case
        window.gameState = Model.state;
        View.changeScreen('battle');
        this.initGrid();
    },

    initGrid() {
        const cols = 7, rows = 6;
        Model.state.battle.grid = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                // DOM要素(el)はView.renderBattleGridCoreで生成される
                Model.state.battle.grid.push({ r, c, el: null });
            }
        }

        // Viewに描画依頼
        View.renderBattleGridCore(Model.state.battle.grid);

        const pU = Model.state.battleUnitA.army.map((u, i) => ({ ...u, r: 1 + i, c: 0, owner: 'player' }));
        const eU = Model.state.battleUnitB.army.map((u, i) => ({ ...u, r: 1 + i, c: 6, owner: 'enemy' }));

        Model.state.battle.units = [...pU, ...eU];
        Model.state.battle.movedUnits = new Set();
        Model.state.battle.selectedUnit = null;
        Model.state.battle.tempMoved = false;
        Model.state.battle.turn = 'player';
        Model.state.battle.active = true;

        View.updateBattleUI();
    },

    // View.jsのdrawHexから呼ばれる
    handleClick(r, c) {
        // console.log(`Battle Click: ${r}, ${c}`);
        const b = Model.state.battle;

        if (b.turn !== 'player' || !b.active) return;

        const target = b.units.find(u => u.r === r && u.c === c);

        // 移動後の攻撃または待機
        if (b.selectedUnit && b.tempMoved) {
            const s = b.selectedUnit;
            const d = Model.getHexDist(s.r, s.c, r, c);

            // 敵をクリック：攻撃
            if (target && target.owner === 'enemy' && d <= s.range) {
                if (s.range > 1) {
                    // 遠距離ユニットは移動後に攻撃できない仕様の場合、ここで制限可能
                    this.attack(s, target);
                } else {
                    this.attack(s, target);
                }
            } else if (s.r === r && s.c === c) {
                // 自分自身をクリック：待機
                b.movedUnits.add(s);
                b.selectedUnit = null;
                b.tempMoved = false;
            } else {
                // 攻撃範囲外をクリック：移動して待機（行動終了）とする
                b.movedUnits.add(s);
                b.selectedUnit = null;
                b.tempMoved = false;
                View.showMessage("待機しました");
            }
            View.updateBattleUI();
            return;
        }

        // 未行動の味方を選択
        if (target && target.owner === 'player') {
            if (!b.movedUnits.has(target)) {
                b.selectedUnit = target;
                b.tempMoved = false;
            }
            View.updateBattleUI();
            return;
        }

        // 移動または遠距離攻撃
        if (b.selectedUnit) {
            const s = b.selectedUnit, d = Model.getHexDist(s.r, s.c, r, c);
            if (target && target.owner === 'enemy') {
                if (d <= s.range) this.attack(s, target);
            }
            else if (!target && d <= s.move) {
                // 移動 (仮移動)
                // 移動先に誰もいない場合のみ
                const existing = b.units.find(u => u.r === r && u.c === c);
                if (!existing) {
                    s.r = r; s.c = c; b.tempMoved = true;
                } else {
                    View.showMessage("そこには移動できません");
                }
            }
            else {
                b.selectedUnit = null;
            }
        }
        View.updateBattleUI();
        this.checkEnd();
    },

    attack(atk, def) {
        // ダメージ計算
        // 基本: ATK - 0 (防御概念なし) * ランダム要素
        const dmg = Math.floor(atk.atk * (0.8 + Math.random() * 0.4));
        def.currentHp -= dmg;
        View.showMessage(`${atk.name}の攻撃！ ${def.name}に${dmg}ダメージ！`);

        // 攻撃経験値 (とどめ以外でも入る)
        atk.xp = (atk.xp || 0) + 10;
        if (atk.xp >= Data.RANK_UP_XP && atk.rank < 5) {
            atk.rank++; atk.xp = 0; atk.hp += 10; atk.atk += 2; atk.currentHp += 10;
            View.showMessage(`${atk.name}はランクアップした！`);
        }

        // 反撃 (射程内なら)
        const dist = Model.getHexDist(atk.r, atk.c, def.r, def.c);
        if (def.currentHp > 0 && dist <= def.range) {
            const counterDmg = Math.floor(def.atk * 0.7 * (0.8 + Math.random() * 0.4));
            atk.currentHp -= counterDmg;
            setTimeout(() => View.showMessage(`反撃！ ${atk.name}に${counterDmg}ダメージ！`), 500);

            // 反撃経験値
            def.xp = (def.xp || 0) + 5;
            if (def.xp >= Data.RANK_UP_XP && def.rank < 5) {
                def.rank++; def.xp = 0; def.hp += 10; def.atk += 2; def.currentHp += 10;
            }
        }

        // 死亡判定
        if (def.currentHp <= 0) {
            Model.state.battle.units = Model.state.battle.units.filter(u => u !== def);
            // 撃破経験値ボーナス
            atk.xp = (atk.xp || 0) + 20;
            if (atk.xp >= Data.RANK_UP_XP && atk.rank < 5) {
                atk.rank++; atk.xp = 0; atk.hp += 10; atk.atk += 2; atk.currentHp += 10;
                View.showMessage(`${atk.name}はランクアップした！`);
            }
        }
        if (atk.currentHp <= 0) {
            Model.state.battle.units = Model.state.battle.units.filter(u => u !== atk);
        }

        Model.state.battle.movedUnits.add(atk);
        Model.state.battle.selectedUnit = null;
        Model.state.battle.tempMoved = false;

        View.updateBattleUI();
        this.checkEnd();
    },

    checkEnd() {
        const pUnits = Model.state.battle.units.filter(u => u.owner === 'player');
        const eUnits = Model.state.battle.units.filter(u => u.owner === 'enemy');

        if (pUnits.length === 0 || eUnits.length === 0) {
            Model.state.battle.active = false;
            // 結果反映
            if (eUnits.length === 0) {
                View.showMessage("戦闘勝利！");
                if (Model.state.battleUnitB) Model.state.battleUnitB.army = []; // 全滅
                Model.state.mapUnits = Model.state.mapUnits.filter(u => u !== Model.state.battleUnitB);
            } else {
                View.showMessage("戦闘敗北...");
                if (Model.state.battleUnitA) Model.state.battleUnitA.army = []; // 全滅
                Model.state.mapUnits = Model.state.mapUnits.filter(u => u !== Model.state.battleUnitA);
            }

            // 戦闘結果（経験値、ランク、HPなど）を元のArmyデータに書き戻す
            // 生存ユニットを再構築する
            if (Model.state.battleUnitA) {
                const aliveA = Model.state.battle.units.filter(u => u.owner === 'player');
                Model.state.battleUnitA.army = aliveA.map(u => {
                    const { r, c, owner, ...rest } = u;
                    rest.currentHp = rest.hp; // 全回復
                    return rest;
                });
            }
            if (Model.state.battleUnitB) {
                const aliveB = Model.state.battle.units.filter(u => u.owner === 'enemy');
                Model.state.battleUnitB.army = aliveB.map(u => {
                    const { r, c, owner, ...rest } = u;
                    rest.currentHp = rest.hp; // 全回復
                    return rest;
                });
            }

            Model.state.globalBattleCooldown = 150;
            setTimeout(() => {
                View.changeScreen('map');
                // 敵ターン中に戦闘が終わった場合、プレイヤーターンへ移行（復帰）
                if (Model.state.strategicTurn !== 'player') {
                    if (window.Controller) {
                        setTimeout(() => Controller.startPlayerTurn(), 1000);
                    }
                }
            }, 1500);
        }
    },

    endTurn() {
        // ターン終了時に選択解除
        Model.state.battle.selectedUnit = null;
        Model.state.battle.tempMoved = false;
        View.updateBattleUI();

        Model.state.battle.turn = 'enemy';
        View.showMessage("敵のターン");
        this.runAI();
    },

    runAI() {
        // 簡易AI
        const aiUnits = Model.state.battle.units.filter(u => u.owner === 'enemy');
        let delay = 0;

        aiUnits.forEach(u => {
            setTimeout(() => {
                if (u.currentHp <= 0) return;

                // ターゲット選定
                const targets = Model.state.battle.units.filter(t => t.owner === 'player');
                if (targets.length === 0) return;

                // 1. 攻撃可能な敵がいるか
                let done = false;
                for (let t of targets) {
                    const d = Model.getHexDist(u.r, u.c, t.r, t.c);
                    if (d <= u.range) {
                        this.attack(u, t);
                        done = true;
                        break;
                    }
                }

                if (!done) {
                    // 2. 移動：一番近い敵へ近づく
                    const target = targets.reduce((p, c) => Model.getHexDist(u.r, u.c, c.r, c.c) < Model.getHexDist(u.r, u.c, p.r, p.c) ? c : p);

                    let nextR = u.r, nextC = u.c;
                    if (target.r > u.r) nextR++; else if (target.r < u.r) nextR--;
                    if (target.c > u.c) nextC++; else if (target.c < u.c) nextC--;

                    // 移動先に誰かいないかチェック
                    const occupied = Model.state.battle.units.find(unit => unit.r === nextR && unit.c === nextC);
                    if (!occupied) {
                        u.r = nextR;
                        u.c = nextC;
                    }

                    // 移動後攻撃確認
                    const d = Model.getHexDist(u.r, u.c, target.r, target.c);
                    if (d <= u.range) {
                        this.attack(u, target);
                    } else {
                        View.updateBattleUI();
                    }
                }
            }, delay);
            delay += 1000;
        });

        setTimeout(() => {
            Model.state.battle.turn = 'player';
            Model.state.battle.movedUnits.clear();
            View.showMessage("自軍ターン");
            View.updateBattleUI();
        }, delay + 1000);
    },

    autoResolve(u1, u2, attacker) {
        // オート戦闘計算
        let dmg1 = 0, dmg2 = 0;
        u1.army.forEach(u => dmg1 += u.atk);
        u2.army.forEach(u => dmg2 += u.atk);

        u1.army.forEach(u => u.currentHp -= Math.floor(dmg2 / u1.army.length * 0.5));
        u2.army.forEach(u => u.currentHp -= Math.floor(dmg1 / u2.army.length * 0.5));

        u1.army = u1.army.filter(u => u.currentHp > 0);
        u2.army = u2.army.filter(u => u.currentHp > 0);

        // 生存者は全回復
        if (u1.army.length > 0) u1.army.forEach(u => u.currentHp = u.hp);
        if (u2.army.length > 0) u2.army.forEach(u => u.currentHp = u.hp);

        // 引き分け時の撤退処理 (攻撃側を最寄りの自軍拠点へ戻す)
        if (u1.army.length > 0 && u2.army.length > 0 && attacker && attacker.army.length > 0) {
            const faction = Model.state.factions.find(f => f.id === attacker.owner);
            if (faction) {
                const castles = Model.state.castles.filter(c => c.owner === faction.id);
                if (castles.length > 0) {
                    const nearest = castles.reduce((p, c) => {
                        const d1 = Math.hypot(c.x - attacker.x, c.y - attacker.y);
                        const d2 = Math.hypot(p.x - attacker.x, p.y - attacker.y);
                        return d1 < d2 ? c : p;
                    });

                    attacker.x = nearest.x;
                    attacker.y = nearest.y;
                    attacker.targetX = nearest.x;
                    attacker.targetY = nearest.y;
                    // View.showMessage(`${faction.name}軍は撤退しました`); // 頻繁に出るとうざいのでコメントアウト推奨だが、動作確認のため出す？
                }
            }
        }

        if (u1.army.length === 0) Model.state.mapUnits = Model.state.mapUnits.filter(u => u !== u1);
        if (u2.army.length === 0) Model.state.mapUnits = Model.state.mapUnits.filter(u => u !== u2);
    }
};
