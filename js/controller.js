/**
 * CONTROLLER: ゲーム進行制御
 */
window.Controller = {
    init() {
        setInterval(() => this.updateLogic(), 50);
    },

    updateLogic() {
        if (Model.state.currentScreen !== 'map') return;

        Model.state.mapUnits.forEach(u => {
            const dx = u.targetX - u.x, dy = u.targetY - u.y, dist = Math.hypot(dx, dy);
            if (dist > Data.UNIT_SPEED) {
                u.x += dx / dist * Data.UNIT_SPEED;
                u.y += dy / dist * Data.UNIT_SPEED;
            } else {
                u.x = u.targetX;
                u.y = u.targetY;
                u.isMoving = false;
            }
        });

        if (Model.state.globalBattleCooldown > 0) Model.state.globalBattleCooldown--;
        if (Model.state.globalBattleCooldown <= 0 && !Model.state.gameCleared) {
            for (let i = 0; i < Model.state.mapUnits.length; i++) {
                for (let j = i + 1; j < Model.state.mapUnits.length; j++) {
                    const u1 = Model.state.mapUnits[i], u2 = Model.state.mapUnits[j];
                    if (u1.owner !== u2.owner && Math.hypot(u1.x - u2.x, u1.y - u2.y) < 30) {
                        u1.isMoving = false; u2.isMoving = false;

                        const playerFaction = Model.state.factions.find(f => f.isPlayer);
                        if (u1.owner === playerFaction.id || u2.owner === playerFaction.id) {
                            Model.state.battleUnitA = (u1.owner === playerFaction.id) ? u1 : u2;
                            Model.state.battleUnitB = (u1.owner === playerFaction.id) ? u2 : u1;
                            this.startBattle();
                        } else {
                            this.autoResolveBattle(u1, u2);
                        }
                        return;
                    }
                }
            }
        }

        Model.state.castles.forEach(c => {
            const unitsOnCastle = Model.state.mapUnits.filter(u => Math.hypot(u.x - c.x, u.y - c.y) < 40);
            const playerFaction = Model.state.factions.find(f => f.isPlayer);

            unitsOnCastle.forEach(u => {
                if (u.owner !== c.owner) {
                    // 攻城戦ロジック（簡易版：敵がいなければ制圧）
                    const defenders = unitsOnCastle.filter(d => d.owner === c.owner);
                    if (defenders.length === 0) {
                        c.owner = u.owner;
                        const f = Model.state.factions.find(fac => fac.id === u.owner);
                        if (c.captureBonus > 0 && f) {
                            f.gold += c.captureBonus;
                            if (f.isPlayer) View.showMessage(`${c.name}を制圧！ ボーナス ${c.captureBonus}G`);
                            c.captureBonus = 0;
                        } else if (f.isPlayer) {
                            View.showMessage(`${c.name}を制圧！`);
                        }

                        // HQ制圧判定
                        const defeatedFaction = Model.state.factions.find(fac => fac.hqId === c.id);
                        if (defeatedFaction && defeatedFaction.isAlive) {
                            defeatedFaction.isAlive = false;
                            Model.state.mapUnits = Model.state.mapUnits.filter(mu => mu.owner !== defeatedFaction.id);
                            if (f.isPlayer) View.showMessage(`${defeatedFaction.name} を滅ぼした！`);
                        }
                    }
                }
            });
        });

        // 勝利判定
        const p = Model.state.factions.find(f => f.isPlayer);
        const aliveEnemies = Model.state.factions.filter(f => !f.isPlayer && f.isAlive);
        if (aliveEnemies.length === 0 && !Model.state.gameCleared) {
            Model.state.gameCleared = true;
            setTimeout(() => View.showEnding(true), 1000);
        } else if (!p.isAlive && !Model.state.gameCleared) {
            Model.state.gameCleared = true;
            setTimeout(() => View.showEnding(false), 1000);
        }

        // 基本情報のDOM更新 (頻繁な更新が必要なもの)
        const castleCountEl = document.getElementById('castle-count-display');
        const armyCountEl = document.getElementById('army-total-display');
        const goldEl = document.getElementById('gold-amount');
        const turnDisplayEl = document.getElementById('turn-display');
        const turnTextMapEl = document.getElementById('turn-text-map');

        if (castleCountEl) castleCountEl.innerText = `${Model.state.castles.filter(c => c.owner === p.id).length}/${Model.state.castles.length}`;
        if (armyCountEl) armyCountEl.innerText = `${Model.state.mapUnits.filter(u => u.owner === p.id).length}/${Data.MAX_ARMIES}`;
        if (goldEl) goldEl.innerText = `${p.gold}G`;
        if (turnDisplayEl) turnDisplayEl.innerText = `第${Model.state.turnCount}ターン`;
        if (turnTextMapEl) {
            turnTextMapEl.innerText = (Model.state.strategicTurn === 'player') ? "自軍フェーズ" : "敵軍フェーズ";
            turnTextMapEl.style.color = (Model.state.strategicTurn === 'player') ? "#fbbf24" : "#f87171";
        }
    },

    selectMapAndNext(mapId) {
        this.setMap(mapId);
        View.changeScreen('master-select');
    },

    setMap(id) {
        Model.state.selectedMapId = id;
        View.renderSettings();
    },

    createGame(masterId) {
        const playerMaster = Data.MASTERS.find(m => m.id === masterId);
        const mapData = Data.MAP_TEMPLATES.find(m => m.id === Model.state.selectedMapId);

        Model.state.factions = [
            { id: 'player', name: 'プレイヤー王国', color: playerMaster.color, master: playerMaster, isPlayer: true, gold: 1000, isAlive: true, hqId: 'c1' },
            { id: 'enemy', name: '暗黒帝国', color: '#ff0000', master: Data.MASTERS[2], isPlayer: false, gold: 1000, isAlive: true, hqId: 'c2' },
            { id: 'enemy2', name: '東方同盟', color: '#aa00aa', master: Data.MASTERS[1], isPlayer: false, gold: 1000, isAlive: true, hqId: 'c6' }
        ];

        Model.state.castles = JSON.parse(JSON.stringify(mapData.castles));
        Model.state.mapUnits = [];
        Model.state.turnCount = 1;
        Model.state.strategicTurn = 'player';
        Model.state.gameCleared = false;

        this.startGame();
    },

    startGame() {
        const player = Model.state.factions.find(f => f.isPlayer);
        const hq = Model.state.castles.find(c => c.id === player.hqId);
        // 初期ユニット生成
        Model.state.mapUnits.push({
            id: 'p-main', owner: player.id, x: hq.x, y: hq.y, targetX: hq.x, targetY: hq.y,
            emoji: player.master.emoji, isMaster: true,
            army: Data.FACTION_UNITS[player.master.id].map(u => ({ ...u, currentHp: u.hp, rank: 0, xp: 0 })),
            hasActed: false, isMoving: false
        });

        // 敵ユニット初期生成(各本拠地に)
        Model.state.factions.filter(f => !f.isPlayer).forEach(e => {
            const ehq = Model.state.castles.find(c => c.id === e.hqId);
            if (ehq) {
                Model.state.mapUnits.push({
                    id: e.id + '-main', owner: e.id, x: ehq.x, y: ehq.y, targetX: ehq.x, targetY: ehq.y,
                    emoji: e.master.emoji, isMaster: true,
                    army: Data.FACTION_UNITS[e.master.id].map(u => ({ ...u, currentHp: u.hp, rank: 0, xp: 0 })),
                    hasActed: true, isMoving: false
                });
            }
        });

        View.changeScreen('map');
    },

    loadGame() {
        const d = localStorage.getItem('bahamut_save_v2');
        if (d) {
            const save = JSON.parse(d);
            Model.state = save;
            // Battle中のgridなどDOM要素を持たないデータの復元が必要な場合への対応（今回はGrid再生成）
            View.changeScreen(Model.state.currentScreen);
            if (Model.state.currentScreen === 'battle') {
                this.initBattleGrid();
            }
            View.showMessage("ロードしました");
        } else {
            View.showMessage("セーブデータがありません");
        }
    },

    saveGame() {
        // DOM要素や循環参照を除く等の処置が必要だが、現在のModel構造はシリアライズ可能と仮定
        // battle.grid内のelは保存しないように除外するか、再開時に再生成する
        const save = JSON.parse(JSON.stringify(Model.state, (key, value) => {
            if (key === 'el' || key === 'ctx' || key === 'canvas') return undefined; // DOM関連除外
            if (key === 'movedUnits') return Array.from(value); // Set -> Array
            return value;
        }));
        localStorage.setItem('bahamut_save_v2', JSON.stringify(save));
        View.showMessage("セーブしました");
    },

    showEscapeConfirm() {
        View.openModal("撤退しますか？", "撤退すると部隊は大きなダメージを受け、本拠地に戻されます。", [
            {
                label: "撤退する", action: () => {
                    Model.state.battle.active = false;
                    Model.state.globalBattleCooldown = 100;
                    View.changeScreen('map');
                    View.showMessage("撤退しました...");
                }
            },
            { label: "戦い続ける", action: () => { } }
        ]);
    },

    endStrategicTurn() {
        const p = Model.state.factions.find(f => f.isPlayer);
        Model.state.mapUnits.filter(u => u.owner === p.id).forEach(u => u.hasActed = true);
        Model.state.strategicTurn = 'enemy';
        document.getElementById('turn-text-map').innerText = "敵軍フェーズ";
        document.getElementById('turn-text-map').style.color = "#f87171";
        document.getElementById('btn-end-strategic-turn').classList.add('hidden');
        document.getElementById('save-load-group').classList.add('hidden');

        // 拠点メニューが開いていたら閉じる
        View.clearBaseMenu();
        Model.state.selectedMapUnit = null;

        setTimeout(() => this.enemyTurn(), 1000);
    },

    async enemyTurn() {
        if (Model.state.currentScreen !== 'map') return; // 戦闘中などは中断

        const enemies = Model.state.factions.filter(f => !f.isPlayer && f.isAlive);

        for (const faction of enemies) {
            View.showMessage(`${faction.name}軍 フェーズ`);
            this.processFactionAI(faction);
            // 演出待ち
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // 全敵の思考・移動完了を待ってプレイヤーターンへ (簡易的にsetTimeout)
        this.aiTimer = setTimeout(() => {
            if (Model.state.currentScreen === 'map') this.startPlayerTurn();
        }, 1000);
    },

    processFactionAI(faction) {
        // 収入
        const income = 100 + Model.state.castles.filter(c => c.owner === faction.id).length * 200;
        faction.gold += income;

        const hq = Model.state.castles.find(c => c.id === faction.hqId);

        // 0. 新規部隊編成 (Create Army)
        const myUnits = Model.state.mapUnits.filter(u => u.owner === faction.id); // 現在の部隊リスト

        // 本拠地があり、部隊枠があり、金が十分なら作成
        if (hq && myUnits.length < Data.MAX_ARMIES && faction.gold >= (Data.ARMY_COST + 300)) {
            const isHqOccupied = Model.state.mapUnits.some(u => Math.hypot(u.x - hq.x, u.y - hq.y) < 20);
            // 部隊数が0なら必ず作る、そうでなければ50%
            const urge = (myUnits.length === 0) ? 1.0 : 0.5;

            if (!isHqOccupied && Math.random() < urge) {
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

        // ユニット行動AI (新規作成ユニットはこのターンの行動対象外=myUnitsに含まれないのでOK)
        myUnits.forEach(enemy => {
            enemy.hasActed = false; // ターン開始リセット

            // 1. 回復・補充
            // 金があるなら確率高めで実行 (300G以上、かつ確率50%〜90%)
            if (faction.gold >= 300 && enemy.army.length < Data.MAX_UNITS) {
                const ut = Data.FACTION_UNITS[faction.master.id][0];
                const chance = (faction.gold > 1000) ? 0.9 : 0.5;
                if (faction.gold >= ut.cost && Math.random() < chance) {
                    faction.gold -= ut.cost;
                    enemy.army.push({ ...ut, currentHp: ut.hp, rank: 0, xp: 0 });
                }
            }

            // 2. 移動：一番近い敵拠点または敵ユニットを目指す
            const current = Model.state.castles.reduce((prev, curr) => Math.hypot(curr.x - enemy.x, curr.y - enemy.y) < Math.hypot(prev.x - enemy.x, prev.y - enemy.y) ? curr : prev);
            const unitsAtHQ = Model.state.mapUnits.filter(u => Math.hypot(u.x - hq.x, u.y - hq.y) < 20 && u.owner === faction.id);

            // 防衛ロジック: 本拠地が危ないなら戻る
            if (current === hq && unitsAtHQ.length < 2 && Math.random() < 0.7) return;

            // 侵攻ロジック
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
    },

    startPlayerTurn() {
        Model.state.turnCount++;
        Model.state.strategicTurn = 'player';
        View.showMessage(`ターン開始：収入計算中...`);

        const player = Model.state.factions.find(f => f.isPlayer);
        const income = 100 + Model.state.castles.filter(c => c.owner === player.id).length * 200;
        player.gold += income;

        Model.state.mapUnits.forEach(u => u.hasActed = false);
        View.showMessage(`ターン開始：収入 ${income}G`);

        // UI更新
        document.getElementById('turn-text-map').innerText = "自軍フェーズ";
        document.getElementById('turn-text-map').style.color = "#fbbf24";
        document.getElementById('btn-end-strategic-turn').classList.remove('hidden');
        document.getElementById('save-load-group').classList.remove('hidden');
    },

    createNewArmy(castle) {
        const player = Model.state.factions.find(f => f.isPlayer);
        if (player.gold < Data.ARMY_COST) return;
        if (Model.state.mapUnits.filter(u => u.owner === player.id).length >= Data.MAX_ARMIES) {
            View.showMessage("部隊数が上限に達しています");
            return;
        }
        player.gold -= Data.ARMY_COST;
        const newUnit = {
            id: 'army-' + Date.now(),
            owner: player.id,
            x: castle.x, y: castle.y, targetX: castle.x, targetY: castle.y,
            emoji: player.master.emoji,
            army: [{ ...Data.FACTION_UNITS[player.master.id][0], currentHp: Data.FACTION_UNITS[player.master.id][0].hp, rank: 0, xp: 0 }],
            isMaster: false, hasActed: true, isMoving: false
        };
        Model.state.mapUnits.push(newUnit);
        View.renderBaseMenu(castle, newUnit.id);
    },

    recruitUnit(aId, utId, cId) {
        const player = Model.state.factions.find(f => f.isPlayer);
        const army = Model.state.mapUnits.find(u => u.id === aId);
        const ut = Data.FACTION_UNITS[player.master.id].find(x => x.id === utId) || Data.SPECIAL_UNITS[utId];
        if (army && ut && army.army.length < Data.MAX_UNITS && player.gold >= ut.cost) {
            player.gold -= ut.cost;
            army.army.push({ ...ut, currentHp: ut.hp, rank: 0, xp: 0 });
            View.renderBaseMenu(Model.state.castles.find(c => c.id === cId), aId);
        }
    },

    enhanceUnit(aId, idx, type, cId) {
        const player = Model.state.factions.find(f => f.isPlayer);
        const army = Model.state.mapUnits.find(u => u.id === aId);
        if (!army) return;
        const unit = army.army[idx];
        if (type === 'hp' && player.gold >= 100) {
            if (unit.currentHp >= unit.hp) { View.showMessage("HPは既に満タンです"); return; }
            player.gold -= 100; unit.hp += 10; unit.currentHp += 10;
        } else if (type === 'atk' && player.gold >= 150) {
            player.gold -= 150; unit.atk += 3;
        }
        View.renderBaseMenu(Model.state.castles.find(c => c.id === cId), aId);
    },

    handleMapClick(e) {
        if (Model.state.strategicTurn !== 'player') return;

        const rect = View.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left - View.mapOffsetX;
        const y = e.clientY - rect.top - View.mapOffsetY;

        // 優先順位変更：
        // 1. 移動可能な拠点への移動（自軍ユニットがいても移動優先）
        // 2. ユニット選択

        const targetCastle = Model.state.castles.find(c => Math.hypot(c.x - x, c.y - y) < 40);
        const u = Model.state.selectedMapUnit;

        // 移動ロジック（ユニット選択中かつ未行動）
        if (u && !u.isMoving && !u.hasActed && targetCastle) {
            const currentCastle = Model.state.castles.find(c => Math.hypot(c.x - u.x, c.y - u.y) < 40);

            let canMove = false;
            // 現在地があり、隣接している場合のみ移動可
            if (currentCastle && currentCastle.neighbors.includes(targetCastle.id)) {
                canMove = true;
            } else if (currentCastle && currentCastle.id === targetCastle.id) {
                // 自分自身のいる拠点をクリック -> 移動ではなく選択処理へ流す
                canMove = false;
            }

            if (canMove) {
                u.targetX = targetCastle.x;
                u.targetY = targetCastle.y;
                u.isMoving = true;
                u.hasActed = true; // 移動したら行動済み
                View.showMessage("移動開始");
                Model.state.selectedMapUnit = null; // 選択解除
                return;
            }
            // canMoveがfalseの場合（移動不可な拠点クリック）は、ユニット選択判定へ進む
        }

        // ユニット選択ロジック
        const clickedUnits = Model.state.mapUnits.filter(u => Math.hypot(u.x - x, u.y - y) < 30);
        let targetUnit = null;
        const playerUnits = clickedUnits.filter(u => u.owner === Model.state.factions.find(f => f.isPlayer).id);

        if (playerUnits.length > 0) {
            if (Model.state.selectedMapUnit && playerUnits.includes(Model.state.selectedMapUnit)) {
                const currentIndex = playerUnits.indexOf(Model.state.selectedMapUnit);
                const nextIndex = (currentIndex + 1) % playerUnits.length;
                targetUnit = playerUnits[nextIndex];
            } else {
                targetUnit = playerUnits[0];
            }
        }

        if (targetUnit) {
            Model.state.selectedMapUnit = targetUnit;
            View.showMessage(`${targetUnit.isMaster ? '主軍' : '部隊'}を選択 (${playerUnits.indexOf(targetUnit) + 1}/${playerUnits.length})`);
            return;
        }

        // 選択解除
        Model.state.selectedMapUnit = null;
    },

    handleMapRightClick(e) {
        e.preventDefault();

        const rect = View.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left - View.mapOffsetX;
        const y = e.clientY - rect.top - View.mapOffsetY;

        // 右クリックで拠点メニューを開く
        const clickedCastle = Model.state.castles.find(c => Math.hypot(c.x - x, c.y - y) < 30);
        if (clickedCastle) {
            View.toggleBaseMenu(clickedCastle);
            return;
        }

        // それ以外なら選択解除
        Model.state.selectedMapUnit = null;
        View.clearBaseMenu();
    },

    startBattle() {
        if (this.aiTimer) clearTimeout(this.aiTimer);
        window.gameState = Model.state;
        View.changeScreen('battle');
        this.initBattleGrid();
    },

    initBattleGrid() {
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
    handleBattleClick(r, c) {
        console.log(`Battle Click: ${r} (type:${typeof r}), ${c} (type:${typeof c})`);
        const b = Model.state.battle;
        console.log(`Turn: ${b.turn}, Active: ${b.active}`);

        if (b.turn !== 'player' || !b.active) return;

        const target = b.units.find(u => u.r === r && u.c === c);
        console.log('Target unit:', target);

        // 移動後の攻撃または待機
        if (b.selectedUnit && b.tempMoved) {
            const s = b.selectedUnit;
            const d = Model.getHexDist(s.r, s.c, r, c);

            // 敵をクリック：攻撃
            if (target && target.owner === 'enemy' && d <= s.range) {
                if (s.range > 1) {
                    // 遠距離ユニットは移動後に攻撃できない仕様の場合
                    // View.showMessage("遠距離攻撃は移動前のみ可能です");
                    // ここでは移動後攻撃可とするか、仕様による
                    this.battleAttack(s, target);
                } else {
                    this.battleAttack(s, target);
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
                if (d <= s.range) this.battleAttack(s, target);
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
        this.checkBattleEnd();
    },

    // 右クリックなど（必要なら）
    handleBattleUnitRightClick(r, c) {
        // キャンセル処理など
    },

    battleAttack(atk, def) {
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
        this.checkBattleEnd();
    },

    checkBattleEnd() {
        const pUnits = Model.state.battle.units.filter(u => u.owner === 'player');
        const eUnits = Model.state.battle.units.filter(u => u.owner === 'enemy');

        if (pUnits.length === 0 || eUnits.length === 0) {
            Model.state.battle.active = false;
            // 結果反映
            if (eUnits.length === 0) {
                View.showMessage("戦闘勝利！");
                Model.state.battleUnitB.army = []; // 全滅
                Model.state.mapUnits = Model.state.mapUnits.filter(u => u !== Model.state.battleUnitB);
            } else {
                View.showMessage("戦闘敗北...");
                Model.state.battleUnitA.army = []; // 全滅
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
                    setTimeout(() => this.startPlayerTurn(), 1000);
                }
            }, 1500);
        }
    },

    battleEndTurnOrder() {
        // ターン終了時に選択解除
        Model.state.battle.selectedUnit = null;
        Model.state.battle.tempMoved = false;
        View.updateBattleUI();

        Model.state.battle.turn = 'enemy';
        View.showMessage("敵のターン");
        this.battleEnemyAI();
    },

    battleEnemyAI() {
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
                        this.battleAttack(u, t);
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
                        this.battleAttack(u, target);
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

    autoResolveBattle(u1, u2) {
        // オート戦闘計算
        let dmg1 = 0, dmg2 = 0;
        u1.army.forEach(u => dmg1 += u.atk);
        u2.army.forEach(u => dmg2 += u.atk);

        u1.army.forEach(u => u.currentHp -= Math.floor(dmg2 / u1.army.length * 0.5));
        u2.army.forEach(u => u.currentHp -= Math.floor(dmg1 / u2.army.length * 0.5));

        u1.army = u1.army.filter(u => u.currentHp > 0);
        u2.army = u2.army.filter(u => u.currentHp > 0);

        if (u1.army.length === 0) Model.state.mapUnits = Model.state.mapUnits.filter(u => u !== u1);
        if (u2.army.length === 0) Model.state.mapUnits = Model.state.mapUnits.filter(u => u !== u2);
    }
};

/**
 * TEST: 動作確認用テストスイート
 */
window.TestSuite = {
    runAll() {
        console.log("Running Tests...");
        try {
            this.testDataIntegrity();
            this.testModelHelpers();
            this.testBattleCreation();
            console.log("All Tests Passed!");
            View.showMessage("システムチェック完了: 正常");
        } catch (e) {
            console.error("Test Failed:", e);
            View.showMessage("エラー検出: " + e.message);
        }
    },
    testDataIntegrity() {
        if (!Data.MASTERS || Data.MASTERS.length === 0) throw new Error("Masters data missing");
        if (!Data.MAP_TEMPLATES) throw new Error("Map templates missing");
    },
    testModelHelpers() {
        const d = Model.getHexDist(0, 0, 1, 1);
        if (typeof d !== 'number') throw new Error("Hex dist calc failed");
    },
    testBattleCreation() {
        // Mock battle setup if needed
    }
};

// Window Global Assigns (HTMLからの呼び出し用)
window.Controller = Controller;
window.TestSuite = TestSuite;

// Initialize
window.onload = () => {
    Controller.init();
    View.renderSettings(); // 初期画面（マップ選択）の描画
    // Controller.loadGame(); // オートロードはしない方が安全
};

window.onresize = () => View.initCanvas();
