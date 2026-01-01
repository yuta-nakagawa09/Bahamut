/**
 * BATTLE SYSTEM: 戦闘ロジック
 * バトル画面のゲームロジック、ターン進行、ダメージ計算、AI思考を担当する。
 * @namespace
 */
window.BattleSystem = {
    // -------------------------------------------------------------------------
    // 初期化・セットアップ
    // -------------------------------------------------------------------------
    /**
     * バトルを開始する
     * Controllerから呼び出される。
     */
    start() {
        if (this.aiTimer) clearTimeout(this.aiTimer);
        // Note: window.gameState is used in some places, sync it just in case
        window.gameState = Model.state;
        View.changeScreen('battle');
        this.initGrid();
    },

    /**
     * バトルフィールド（グリッド）とユニットの初期配置を行う
     */
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

        // 自軍は左端(0列)、敵軍は右端(6列)に配置
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

    // -------------------------------------------------------------------------
    // ユーザー入力処理
    // -------------------------------------------------------------------------
    /**
     * ヘックスクリック時の処理
     * Viewから呼び出される
     * @param {number} r - Row index
     * @param {number} c - Column index
     */
    handleClick(r, c) {
        // console.log(`Battle Click: ${r}, ${c}`);
        const b = Model.state.battle;

        if (b.turn !== 'player' || !b.active) return;

        const target = b.units.find(u => u.r === r && u.c === c);

        // 1. ユニット選択中：移動後の攻撃または待機
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

        // 2. 未行動の味方を選択
        if (target && target.owner === 'player') {
            if (!b.movedUnits.has(target)) {
                b.selectedUnit = target;
                b.tempMoved = false;
            }
            View.updateBattleUI();
            return;
        }

        // 3. 移動または遠距離攻撃指示
        if (b.selectedUnit) {
            const s = b.selectedUnit, d = Model.getHexDist(s.r, s.c, r, c);
            if (target && target.owner === 'enemy') {
                // 攻撃
                if (b.tempMoved && s.range >= 2) {
                    View.showMessage("遠距離ユニットは移動後に攻撃できません");
                    return;
                }
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
                // 選択解除
                b.selectedUnit = null;
            }
        }
        View.updateBattleUI();
        this.checkEnd();
    },

    // -------------------------------------------------------------------------
    // アクション (攻撃, 判定)
    // -------------------------------------------------------------------------
    /**
     * 攻撃を実行する
     * @param {Object} atk - 攻撃ユニット
     * @param {Object} def - 防御ユニット
     */
    attack(atk, def) {
        // ダメージ計算
        // 基本: ATK - 0 (防御概念なし) * ランダム要素
        const dmg = Math.floor(atk.atk * (Data.BATTLE.DAMAGE_BASE + Math.random() * Data.BATTLE.DAMAGE_RANDOM));
        def.currentHp -= dmg;
        View.showMessage(`${atk.name}の攻撃！ ${def.name}に${dmg}ダメージ！`);

        // 攻撃経験値 (とどめ以外でも入る)
        atk.xp = (atk.xp || 0) + Data.BATTLE.XP.ATTACK;
        if (Model.processRankUp(atk)) {
            View.showMessage(`${atk.name}はランクアップした！`);
        }

        // 反撃 (射程内なら)
        const dist = Model.getHexDist(atk.r, atk.c, def.r, def.c);
        if (def.currentHp > 0 && dist <= def.range) {
            const counterDmg = Math.floor(def.atk * Data.BATTLE.COUNTER_RATE * (Data.BATTLE.DAMAGE_BASE + Math.random() * Data.BATTLE.DAMAGE_RANDOM));
            atk.currentHp -= counterDmg;
            setTimeout(() => View.showMessage(`反撃！ ${atk.name}に${counterDmg}ダメージ！`), 500);

            // 反撃経験値
            def.xp = (def.xp || 0) + Data.BATTLE.XP.COUNTER;
            if (Model.processRankUp(def)) {
                // 反撃側のランクアップ表示はタイミングが難しいが、反撃メッセージの後に出す
                setTimeout(() => View.showMessage(`${def.name}はランクアップした！`), 1000);
            }
        }

        // 死亡判定
        if (def.currentHp <= 0) {
            Model.state.battle.units = Model.state.battle.units.filter(u => u !== def);
            // 撃破経験値ボーナス
            atk.xp = (atk.xp || 0) + Data.BATTLE.XP.KILL;
            if (Model.processRankUp(atk)) {
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

    /**
     * 戦闘終了判定
     * どちらかの全滅を確認する
     */
    checkEnd() {
        const pUnits = Model.state.battle.units.filter(u => u.owner === 'player');
        const eUnits = Model.state.battle.units.filter(u => u.owner === 'enemy');

        if (pUnits.length === 0 || eUnits.length === 0) {
            Model.state.battle.active = false;
            // 結果反映
            if (eUnits.length === 0) {
                View.showMessage("戦闘勝利");
                if (Model.state.battleUnitB) {
                    Model.state.battleUnitB.army = []; // 全滅
                    Model.state.mapUnits = Model.state.mapUnits.filter(u => u.id !== Model.state.battleUnitB.id);
                }
            } else {
                View.showMessage("戦闘敗北...");
                if (Model.state.battleUnitA) {
                    Model.state.battleUnitA.army = []; // 全滅
                    Model.state.mapUnits = Model.state.mapUnits.filter(u => u.id !== Model.state.battleUnitA.id);
                }
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

            Model.state.globalBattleCooldown = 30;
            setTimeout(() => {
                // 勝者（生き残っている方）が移動中だった場合（攻撃側）、目的地へ移動させる（制圧判定のため）
                const winner = (eUnits.length === 0) ? Model.state.battleUnitA : Model.state.battleUnitB;
                if (winner && winner.army.length > 0) {
                    // 移動中だったか判定 (ターゲットとの距離がある程度ある)
                    const distToTarget = Math.hypot(winner.x - winner.targetX, winner.y - winner.targetY);
                    if (distToTarget > 10) {
                        winner.x = winner.targetX;
                        winner.y = winner.targetY;
                        // 制圧ロジックはControllerの次のループでjudgeされる
                    }
                }

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

    // -------------------------------------------------------------------------
    // ターン管理
    // -------------------------------------------------------------------------
    /**
     * プレイヤーターンを終了し、敵AIターンへ
     */
    endTurn() {
        // ターン終了時に選択解除
        Model.state.battle.selectedUnit = null;
        Model.state.battle.tempMoved = false;
        View.updateBattleUI();

        Model.state.battle.turn = 'enemy';
        View.showMessage("敵のターン");
        this.runAI();
    },

    // -------------------------------------------------------------------------
    // AIロジック
    // -------------------------------------------------------------------------
    /**
     * 敵AIの行動を実行する
     */
    /**
     * AIの行動を実行する
     * @param {string} side - 行動させる側 ('enemy' or 'player')
     */
    /**
     * AIの行動を実行する
     * @param {string} side - 行動させる側 ('enemy' or 'player')
     */
    async runAI(side = 'enemy') {
        try {
            const aiUnits = Model.state.battle.units.filter(u => u.owner === side);

            // 処理中の操作ブロック用フラグなどが必要ならここで設定

            for (const u of aiUnits) {
                // バトルが終了していたら中断
                if (!Model.state.battle.active) break;

                // 死亡確認
                if (u.currentHp <= 0) continue;

                // プレイヤーターンAIで、既に手動で移動・行動済みの場合はスキップ
                if (side === 'player' && Model.state.battle.movedUnits.has(u)) continue;

                // ターゲット選定 (自分以外の勢力)
                const targets = Model.state.battle.units.filter(t => t.owner !== side);
                if (targets.length === 0) break;

                // -----------------------------------------------------------------
                // 1. 攻撃可能な敵がいるか確認して攻撃
                // -----------------------------------------------------------------
                let done = false;
                for (let t of targets) {
                    const d = Model.getHexDist(u.r, u.c, t.r, t.c);
                    if (d <= u.range) {
                        this.attack(u, t);
                        done = true;
                        // 行動後のウェイト（視認性向上）
                        await new Promise(r => setTimeout(r, 600));
                        break;
                    }
                }

                if (done) continue; // 攻撃したら次のユニットへ

                // -----------------------------------------------------------------
                // 2. 移動：一番近い敵へ近づく
                // -----------------------------------------------------------------
                const target = targets.reduce((p, c) => Model.getHexDist(u.r, u.c, c.r, c.c) < Model.getHexDist(u.r, u.c, p.r, p.c) ? c : p);
                const startR = u.r;
                const startC = u.c;
                const moveRange = u.move || 3;

                // BFSによる移動範囲計算
                const reachable = [];
                const queue = [{ r: u.r, c: u.c, dist: 0 }];
                const visited = new Set([`${u.r},${u.c}`]);

                while (queue.length > 0) {
                    const curr = queue.shift();
                    if (curr.dist < moveRange) {
                        for (let dr = -1; dr <= 1; dr++) {
                            for (let dc = -1; dc <= 1; dc++) {
                                if (dr === 0 && dc === 0) continue;
                                const nr = curr.r + dr, nc = curr.c + dc;
                                if (nr < 0 || nc < 0 || nr >= 6 || nc >= 7) continue;
                                if (Model.getHexDist(curr.r, curr.c, nr, nc) !== 1) continue;

                                if (!visited.has(`${nr},${nc}`)) {
                                    const occupiedUnit = Model.state.battle.units.find(unit => unit.r === nr && unit.c === nc);
                                    const canPass = !occupiedUnit || occupiedUnit.owner === side;

                                    if (canPass) {
                                        visited.add(`${nr},${nc}`);
                                        queue.push({ r: nr, c: nc, dist: curr.dist + 1 });
                                        if (!occupiedUnit) {
                                            reachable.push({ r: nr, c: nc });
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // 移動先決定
                let bestDest = null;
                let bestDist = Model.getHexDist(u.r, u.c, target.r, target.c);

                reachable.forEach(pos => {
                    const d = Model.getHexDist(pos.r, pos.c, target.r, target.c);
                    if (d < bestDist) {
                        bestDist = d;
                        bestDest = pos;
                    } else if (bestDest === null && d <= bestDist) {
                        bestDist = d;
                        bestDest = pos;
                    }
                });

                if (bestDest) {
                    u.r = bestDest.r;
                    u.c = bestDest.c;
                }

                // 移動後攻撃確認
                const hasMoved = (u.r !== startR || u.c !== startC);
                const distAfterMove = Model.getHexDist(u.r, u.c, target.r, target.c);

                if (hasMoved && u.range >= 2) {
                    // 遠距離ユニットは移動攻撃不可
                    Model.state.battle.movedUnits.add(u);
                    View.updateBattleUI();
                    await new Promise(r => setTimeout(r, 600));
                } else if (distAfterMove <= u.range) {
                    // 移動後攻撃
                    View.updateBattleUI();
                    // 移動アニメーションの描画を待つ
                    await new Promise(r => requestAnimationFrame(r));
                    await new Promise(r => setTimeout(r, 600)); // 少し待ってから攻撃
                    this.attack(u, target);
                    await new Promise(r => setTimeout(r, 600));
                } else {
                    // 待機
                    Model.state.battle.movedUnits.add(u);
                    View.updateBattleUI();
                    await new Promise(r => setTimeout(r, 600));
                }

                // 次のユニットの処理へ行く前に描画更新サイクルを回す
                await new Promise(r => requestAnimationFrame(r));
            }

            // ターン終了処理
            if (side === 'enemy') {
                Model.state.battle.turn = 'player';
                Model.state.battle.movedUnits.clear();
                View.showMessage("自軍ターン");
                View.updateBattleUI();
            } else {
                // プレイヤーAI終了後は自動でターン終了へ
                this.endTurn();
            }
        } catch (e) {
            console.error("AI Error:", e);
            View.showMessage("AI Error: " + e.message);
        }
    },

    /**
     * マップ画面でのオート戦闘解決 (CPU vs CPU)
     * @param {Object} u1 - 部隊1
     * @param {Object} u2 - 部隊2
     * @param {Object} attacker - 攻撃を仕掛けた部隊
     */
    autoResolve(u1, u2, attacker) {
        // オート戦闘計算
        let dmg1 = 0, dmg2 = 0;
        u1.army.forEach(u => dmg1 += u.atk);
        u2.army.forEach(u => dmg2 += u.atk);

        u1.army.forEach(u => u.currentHp -= Math.floor(dmg2 / u1.army.length * Data.BATTLE.AUTO_DAMAGE_RATE));
        u2.army.forEach(u => u.currentHp -= Math.floor(dmg1 / u2.army.length * Data.BATTLE.AUTO_DAMAGE_RATE));

        u1.army = u1.army.filter(u => u.currentHp > 0);
        u2.army = u2.army.filter(u => u.currentHp > 0);

        // 生存者は全回復 & 経験値獲得
        if (u1.army.length > 0) {
            const bonus = (u2.army.length === 0) ? Data.BATTLE.XP.AUTO_WIN : 0;
            u1.army.forEach(u => {
                u.currentHp = u.hp;
                u.xp = (u.xp || 0) + Data.BATTLE.XP.AUTO_BASE + bonus;
                Model.processRankUp(u);
            });
        }
        if (u2.army.length > 0) {
            const bonus = (u1.army.length === 0) ? Data.BATTLE.XP.AUTO_WIN : 0;
            u2.army.forEach(u => {
                u.currentHp = u.hp;
                u.xp = (u.xp || 0) + Data.BATTLE.XP.AUTO_BASE + bonus;
                Model.processRankUp(u);
            });
        }

        // 引き分け時の撤退処理 (攻撃側またはu1を最寄りの自軍拠点へ戻す)
        if (u1.army.length > 0 && u2.army.length > 0) {
            let retreatUnit = attacker;

            // 1. 拠点防衛戦の場合、防衛側が優先して残る (テリトリー判定)
            const nearbyCastle = Model.state.castles.find(c => Math.hypot(c.x - u1.x, c.y - u1.y) < Data.UI.CASTLE_DETECT_RADIUS * 1.5);
            if (nearbyCastle) {
                if (nearbyCastle.owner === u1.owner && nearbyCastle.owner !== u2.owner) {
                    retreatUnit = u2; // u1が持ち主 -> u2が退く
                } else if (nearbyCastle.owner === u2.owner && nearbyCastle.owner !== u1.owner) {
                    retreatUnit = u1; // u2が持ち主 -> u1が退く
                }
            }

            // fallback: attacker特定できない場合は u1 を退かす (仮)
            if (!retreatUnit) retreatUnit = u1;

            const faction = Model.state.factions.find(f => f.id === retreatUnit.owner);
            if (faction) {
                // 自軍の拠点リスト (今いる場所を除く... としたいが、もしここが自軍拠点なら「ここ」に戻るのは変だが、drawならそもそもここが自軍拠点でないはず(invader retreats) or 自軍拠点ならstay?)
                // Draw時のルール: "Invader retreats to their base". "Defender stays".
                // RetreatUnit is the Invader. So they should find a valid base that is NOT the current location (if they are at a base).
                // Actually, logic is: Find *nearest* friendly castle.
                // If Invader is at Enemy Castle C1. Nearest Friendly is C2. Move to C2. Correct.

                const castles = Model.state.castles.filter(c => c.owner === faction.id);
                if (castles.length > 0) {
                    const nearest = castles.reduce((p, c) => {
                        const d1 = Math.hypot(c.x - retreatUnit.x, c.y - retreatUnit.y);
                        const d2 = Math.hypot(p.x - retreatUnit.x, p.y - retreatUnit.y);
                        return d1 < d2 ? c : p;
                    });

                    retreatUnit.x = nearest.x;
                    retreatUnit.y = nearest.y;
                    retreatUnit.targetX = nearest.x;
                    retreatUnit.targetY = nearest.y;
                }
            }
        }

        // 結果表示
        const f1 = Model.state.factions.find(f => f.id === u1.owner);
        const f2 = Model.state.factions.find(f => f.id === u2.owner);
        const n1 = f1 ? f1.name : '不明';
        const n2 = f2 ? f2.name : '不明';

        if (u1.army.length > 0 && u2.army.length > 0) {
            View.showMessage(`[戦闘] ${n1} vs ${n2} : 引き分け`);
        } else if (u1.army.length > 0) {
            View.showMessage(`[戦闘] ${n1} が ${n2} を撃破！`);
        } else if (u2.army.length > 0) {
            View.showMessage(`[戦闘] ${n2} が ${n1} を撃破！`);
        } else {
            View.showMessage(`[戦闘] ${n1} と ${n2} は相打ちで全滅...`);
        }

        // 勝者が攻撃側だった場合、敗者の位置へ移動（制圧のため）
        if (attacker) {
            if (u1.army.length === 0 && u2 === attacker) {
                u2.x = u1.x; u2.y = u1.y; u2.targetX = u1.x; u2.targetY = u1.y;
            } else if (u2.army.length === 0 && u1 === attacker) {
                u1.x = u2.x; u1.y = u2.y; u1.targetX = u2.x; u1.targetY = u2.y;
            }
        }

        if (u1.army.length === 0) Model.state.mapUnits = Model.state.mapUnits.filter(u => u !== u1);
        if (u2.army.length === 0) Model.state.mapUnits = Model.state.mapUnits.filter(u => u !== u2);
    }
};
