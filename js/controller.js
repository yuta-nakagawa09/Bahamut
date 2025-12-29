/**
 * CONTROLLER: ゲーム進行制御
 */
window.Controller = {
    init() {
        setInterval(() => this.updateLogic(), 50);
        View.renderMasterSelect();
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
                    if (u1.owner !== u2.owner && Math.hypot(u1.x - u2.x, u1.y - u2.y) < Data.UI.BATTLE_TRIGGER_PIXELS) {
                        // 戦闘開始 (アニメーション開始)
                        const attacker = u1.isMoving ? u1 : (u2.isMoving ? u2 : null);
                        u1.isMoving = false; u2.isMoving = false;

                        const playerFaction = Model.state.factions.find(f => f.isPlayer);
                        if (u1.owner === playerFaction.id || u2.owner === playerFaction.id) {
                            Model.state.battleUnitA = (u1.owner === playerFaction.id) ? u1 : u2;
                            Model.state.battleUnitB = (u1.owner === playerFaction.id) ? u2 : u1;
                            this.startBattle();
                        } else {
                            BattleSystem.autoResolve(u1, u2, attacker);
                            Model.state.globalBattleCooldown = 60; // オート戦闘後も少しウェイトを入れる
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

                            // ユニット消滅
                            Model.state.mapUnits = Model.state.mapUnits.filter(mu => mu.owner !== defeatedFaction.id);

                            // 拠点併合
                            Model.state.castles.forEach(castle => {
                                if (castle.owner === defeatedFaction.id) {
                                    castle.owner = u.owner;
                                }
                            });

                            View.openModal("勢力滅亡", `${defeatedFaction.name} は ${f.name} によって滅ぼされました。\n残存拠点は全て ${f.name} に併合されました。`, [
                                { label: "確認", action: () => { } }
                            ]);
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
        const hqPlayer = mapData.castles.find(c => c.owner === 'player');
        const hqEnemy = mapData.castles.find(c => c.owner === 'enemy');
        const hqEnemy2 = mapData.castles.find(c => c.owner === 'enemy2');

        Model.state.factions = [
            { id: 'player', name: 'プレイヤー王国', color: playerMaster.color, master: playerMaster, isPlayer: true, gold: 1000, isAlive: true, hqId: hqPlayer ? hqPlayer.id : 'c1' },
            { id: 'enemy', name: '暗黒帝国', color: '#ff0000', master: Data.MASTERS[2], isPlayer: false, gold: 1000, isAlive: !!hqEnemy, hqId: hqEnemy ? hqEnemy.id : 'c2' },
            { id: 'enemy2', name: '東方同盟', color: '#aa00aa', master: Data.MASTERS[1], isPlayer: false, gold: 1000, isAlive: !!hqEnemy2, hqId: hqEnemy2 ? hqEnemy2.id : 'c6' }
        ];

        Model.state.castles = JSON.parse(JSON.stringify(mapData.castles));
        Model.state.mapUnits = [];
        Model.state.turnCount = 1;
        Model.state.strategicTurn = 'player';
        Model.state.gameCleared = false;
        Model.state.globalBattleCooldown = 0;

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
                    const unit = Model.state.battleUnitA;
                    const faction = Model.state.factions.find(f => f.id === unit.owner);

                    // 現在地の拠点を特定
                    const currentCastle = Model.state.castles.find(c => Math.hypot(c.x - unit.x, c.y - unit.y) < Data.UI.CASTLE_DETECT_RADIUS);
                    let escaped = false;

                    if (currentCastle && currentCastle.neighbors) {
                        // 隣接する自軍拠点を探す
                        const potentialRetreats = currentCastle.neighbors
                            .map(nid => Model.state.castles.find(c => c.id === nid))
                            .filter(c => c && c.owner === faction.id);

                        // 候補があれば移動
                        if (potentialRetreats.length > 0) {
                            const target = potentialRetreats[0]; // 最初に見つかった所に逃げる
                            unit.x = target.x;
                            unit.y = target.y;
                            unit.targetX = target.x;
                            unit.targetY = target.y;
                            unit.hasActed = true; // 行動済みにする

                            // 撤退時も全回復（戦闘終了ロジックに準拠）
                            unit.army.forEach(u => u.currentHp = u.hp);
                            // 敵部隊も回復
                            if (Model.state.battleUnitB) {
                                Model.state.battleUnitB.army.forEach(u => u.currentHp = u.hp);
                            }

                            if (unit.army.length > 0) {
                                escaped = true;
                                View.showMessage(`"${target.name}" へ撤退しました`);
                            }
                        }
                    }

                    Model.state.battle.active = false;
                    Model.state.globalBattleCooldown = 60;
                    View.changeScreen('map');

                    if (!escaped) {
                        // 撤退先なし -> 部隊消滅
                        Model.state.mapUnits = Model.state.mapUnits.filter(u => u !== unit);
                        View.showMessage("撤退先がなく、部隊は壊滅しました...");
                    }
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
        const menuGroup = document.getElementById('menu-group');
        if (menuGroup) menuGroup.classList.add('hidden');

        // 拠点メニューが開いていたら閉じる
        View.clearBaseMenu();
        Model.state.selectedMapUnit = null;

        setTimeout(() => StrategicAI.runEnemyTurn(), 1000);
    },

    // AI Logic moved to ai.js

    startPlayerTurn() {
        Model.state.turnCount++;
        Model.state.strategicTurn = 'player';
        View.showMessage(`ターン開始：収入計算中...`);

        const player = Model.state.factions.find(f => f.isPlayer);
        const castleIncome = Model.state.castles.filter(c => c.owner === player.id).reduce((sum, c) => sum + (c.income || 0), 0);
        const income = 100 + castleIncome;
        player.gold += income;

        Model.state.mapUnits.forEach(u => u.hasActed = false);
        View.showMessage(`ターン開始：収入 ${income}G`);

        // UI更新
        document.getElementById('turn-text-map').innerText = "自軍フェーズ";
        document.getElementById('turn-text-map').style.color = "#fbbf24";
        const menuGroup = document.getElementById('menu-group');
        if (menuGroup) menuGroup.classList.remove('hidden');
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
        const result = Model.recruitUnit(aId, utId);
        if (result === true) {
            View.renderBaseMenu(Model.state.castles.find(c => c.id === cId), aId);
        } else {
            View.showMessage(result);
        }
    },

    enhanceUnit(aId, idx, type, cId) {
        const result = Model.enhanceUnit(aId, idx, type);
        if (result === true) {
            View.renderBaseMenu(Model.state.castles.find(c => c.id === cId), aId);
        } else {
            View.showMessage(result);
        }
    },

    handleMapClick(e) {
        if (Model.state.strategicTurn !== 'player') return;

        const rect = View.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left - View.mapOffsetX;
        const y = e.clientY - rect.top - View.mapOffsetY;

        // 優先順位変更：
        // 1. 移動可能な拠点への移動（自軍ユニットがいても移動優先）
        // 2. ユニット選択

        const targetCastle = Model.state.castles.find(c => Math.hypot(c.x - x, c.y - y) < Data.UI.CASTLE_DETECT_RADIUS);
        const u = Model.state.selectedMapUnit;

        // 移動ロジック（ユニット選択中かつ未行動）
        if (u && !u.isMoving && !u.hasActed && targetCastle) {
            const currentCastle = Model.state.castles.find(c => Math.hypot(c.x - u.x, c.y - u.y) < Data.UI.CASTLE_DETECT_RADIUS);

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
        const clickedUnits = Model.state.mapUnits.filter(u => Math.hypot(u.x - x, u.y - y) < Data.UI.CLICK_RADIUS);
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
        if (Model.state.strategicTurn !== 'player') return;

        const rect = View.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left - View.mapOffsetX;
        const y = e.clientY - rect.top - View.mapOffsetY;

        // 右クリックで拠点メニューを開く
        const clickedCastle = Model.state.castles.find(c => Math.hypot(c.x - x, c.y - y) < Data.UI.CLICK_RADIUS);
        if (clickedCastle) {
            View.toggleBaseMenu(clickedCastle);
            return;
        }

        // それ以外なら選択解除
        Model.state.selectedMapUnit = null;
        View.clearBaseMenu();
    },

    startBattle() {
        BattleSystem.start();
    },

    startBattle() {
        BattleSystem.start();
    }
};

window.Controller = Controller;

// Initialize
window.onload = () => {
    Controller.init();
    View.renderSettings(); // 初期画面（マップ選択）の描画
    // Controller.loadGame(); // オートロードはしない方が安全
};

window.onresize = () => View.initCanvas();
