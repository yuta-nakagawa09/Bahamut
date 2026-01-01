/**
 * CONTROLLER: ゲーム進行制御
 * ゲームループ、ユーザー入力の処理、ゲーム状態の更新を管理する。
 * Model(データ)とView(表示)の橋渡し役。
 * @namespace
 */
window.Controller = {
    // -------------------------------------------------------------------------
    // 初期化・ゲームループ
    // -------------------------------------------------------------------------
    /**
     * アプリケーションの初期化
     */
    /**
     * アプリケーションの初期化
     */
    init() {
        // ゲームループの開始 (RequestAnimationFrame)
        this.lastTime = performance.now();
        requestAnimationFrame(() => this.gameLoop());
        View.renderMasterSelect();
    },

    /**
     * メインゲームループ
     */
    gameLoop() {
        const now = performance.now();
        // 経過時間 (ms)
        const dt = now - this.lastTime;
        this.lastTime = now;

        // ロジック更新 (最大100ms程度にキャップして、タブ非アクティブ復帰時の急激な動作を防ぐ)
        this.updateLogic(Math.min(dt, 100));

        requestAnimationFrame(() => this.gameLoop());
    },

    /**
     * ゲームロジック更新 (可変フレームレート対応)
     * @param {number} dtDelta - 前フレームからの経過時間(ms)
     */
    updateLogic(dtDelta) {
        if (Model.state.currentScreen !== 'map') return;

        // 基準更新間隔 (50ms) に対する比率
        // これまでのバランス(UnitSpeed=10/50ms)を維持するため
        const tickRatio = dtDelta / 50;

        // 1. ユニット位置更新 (移動アニメーション)
        Model.state.mapUnits.forEach(u => {
            if (!u.isMoving) return; // 動いていないならスキップ（ターゲット到達済みも含む）

            const dx = u.targetX - u.x;
            const dy = u.targetY - u.y;
            const dist = Math.hypot(dx, dy);

            // 今回のフレームでの移動距離
            const moveStep = Data.UNIT_SPEED * tickRatio;

            if (dist > moveStep) {
                u.x += dx / dist * moveStep;
                u.y += dy / dist * moveStep;
            } else {
                u.x = u.targetX;
                u.y = u.targetY;
                u.isMoving = false;
            }
        });

        // 2. 戦闘判定 (クールダウン管理含む)
        if (Model.state.globalBattleCooldown > 0) {
            Model.state.globalBattleCooldown -= tickRatio;
        }

        if (Model.state.globalBattleCooldown <= 0 && !Model.state.gameCleared) {
            for (let i = 0; i < Model.state.mapUnits.length; i++) {
                for (let j = i + 1; j < Model.state.mapUnits.length; j++) {
                    const u1 = Model.state.mapUnits[i], u2 = Model.state.mapUnits[j];
                    if (u1.owner !== u2.owner && Math.hypot(u1.x - u2.x, u1.y - u2.y) < Data.UI.BATTLE_TRIGGER_PIXELS) {
                        // 戦闘開始処理
                        const attacker = u1.isMoving ? u1 : (u2.isMoving ? u2 : null);
                        u1.isMoving = false; u2.isMoving = false;

                        const playerFaction = Model.state.factions.find(f => f.isPlayer);
                        if (u1.owner === playerFaction.id || u2.owner === playerFaction.id) {
                            // プレイヤー関与 -> バトル画面へ遷移
                            Model.state.battleUnitA = (u1.owner === playerFaction.id) ? u1 : u2;
                            Model.state.battleUnitB = (u1.owner === playerFaction.id) ? u2 : u1;
                            this.startBattle();
                        } else {
                            // CPU同士 -> オート解決
                            BattleSystem.autoResolve(u1, u2, attacker);
                            Model.state.globalBattleCooldown = 60; // オート戦闘後も少しウェイト (3秒相当)
                        }
                        return;
                    }
                }
            }
        }

        // 3. 拠点相互作用 (制圧, HQ陥落)
        Model.state.castles.forEach(c => {
            const unitsOnCastle = Model.state.mapUnits.filter(u => Math.hypot(u.x - c.x, u.y - c.y) < 40);

            unitsOnCastle.forEach(u => {
                if (u.owner !== c.owner) {
                    // 攻城戦ロジック（簡易版：敵がいなければ制圧）
                    const defenders = unitsOnCastle.filter(d => d.owner === c.owner);
                    if (defenders.length === 0) {
                        c.owner = u.owner;
                        const f = Model.state.factions.find(fac => fac.id === u.owner);

                        // 制圧ボーナス処理
                        if (c.captureBonus > 0 && f) {
                            f.gold += c.captureBonus;
                            if (f.isPlayer) View.showMessage(`${c.name}を制圧！ ボーナス ${c.captureBonus}G`);
                            c.captureBonus = 0;
                        } else if (f.isPlayer) {
                            View.showMessage(`${c.name}を制圧！`);
                        }

                        // HQ制圧による勢力滅亡判定
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

        // 4. 勝敗判定
        const p = Model.state.factions.find(f => f.isPlayer);
        const aliveEnemies = Model.state.factions.filter(f => !f.isPlayer && f.isAlive);
        if (aliveEnemies.length === 0 && !Model.state.gameCleared) {
            Model.state.gameCleared = true;
            setTimeout(() => View.showEnding(true), 1000);
        } else if (!p.isAlive && !Model.state.gameCleared) {
            Model.state.gameCleared = true;
            setTimeout(() => View.showEnding(false), 1000);
        }

        // 5. 基本情報のDOM更新 (Viewへの反映)
        const castleCountEl = document.getElementById('castle-count-display');
        const armyCountEl = document.getElementById('army-total-display');
        const goldEl = document.getElementById('gold-amount');
        const incomeEl = document.getElementById('income-display'); // New
        const powerEl = document.getElementById('power-display'); // New
        const turnDisplayEl = document.getElementById('turn-display');
        const turnTextMapEl = document.getElementById('turn-text-map');

        if (castleCountEl) castleCountEl.innerText = `${Model.state.castles.filter(c => c.owner === p.id).length}/${Model.state.castles.length}`;
        if (armyCountEl) armyCountEl.innerText = `${Model.state.mapUnits.filter(u => u.owner === p.id).length}/${Data.MAX_ARMIES}`;
        if (goldEl) goldEl.innerText = `${p.gold}G`;

        // Update new stats
        if (incomeEl) {
            const income = Model.calculateFactionIncome(p.id);
            incomeEl.innerText = `${income}G`;
        }
        if (powerEl) {
            const power = Model.getFactionTotalPower(p.id);
            powerEl.innerText = `${power}`;
        }

        if (turnDisplayEl) turnDisplayEl.innerText = `第${Model.state.turnCount}ターン`;
        if (turnTextMapEl) {
            turnTextMapEl.innerText = (Model.state.strategicTurn === 'player') ? "自軍フェーズ" : "敵軍フェーズ";
            turnTextMapEl.style.color = (Model.state.strategicTurn === 'player') ? "#fbbf24" : "#f87171";
        }
    },

    // -------------------------------------------------------------------------
    // 画面・データ管理 (Save/Load, Map Select)
    // -------------------------------------------------------------------------
    /**
     * マップを選択し、次の画面（マスター選択）へ
     * @param {string} mapId - 選択されたマップID
     */
    selectMapAndNext(mapId) {
        this.setMap(mapId);
        View.changeScreen('master-select');
    },

    /**
     * 内部ステートにマップIDをセット
     * @param {string} id - マップID
     */
    setMap(id) {
        Model.state.selectedMapId = id;
        View.renderSettings();
    },

    /**
     * ゲームの新規作成と開始
     * @param {string} masterId - 選択されたマスターID
     */
    createGame(masterId) {
        const playerMaster = Data.MASTERS.find(m => m.id === masterId);
        const mapData = Data.MAP_TEMPLATES.find(m => m.id === Model.state.selectedMapId);

        // マップデータの拠点をディープコピーして、所有者を変更可能にする
        const currentCastles = JSON.parse(JSON.stringify(mapData.castles));

        // プレイヤーが選んだマスターをデフォルトとする敵勢力がいるか確認
        const targetFactionDef = Data.FACTIONS.find(f => f.masterId === masterId && f.id !== 'player');

        if (targetFactionDef) {
            // スワップ対象の勢力がいる場合、拠点の所有権を入れ替える
            const playerCastle = currentCastles.find(c => c.owner === 'player');
            const targetCastle = currentCastles.find(c => c.owner === targetFactionDef.id);

            if (playerCastle && targetCastle) {
                playerCastle.owner = targetFactionDef.id; // 元のプレイヤー拠点を敵へ
                targetCastle.owner = 'player';            // 敵の拠点をプレイヤーへ
            }
        }

        // 使用済みマスターID管理 (プレイヤーの選択を確保)
        const usedMasterIds = new Set([masterId]);

        Model.state.factions = Data.FACTIONS.map(f => {
            const isPlayer = (f.id === 'player');
            // 変更された currentCastles から HQ を探す
            const hq = currentCastles.find(c => c.owner === f.id);

            let master;
            let color;

            if (isPlayer) {
                master = playerMaster;
                color = playerMaster.color;
            } else {
                // 敵勢力のマスター決定ロジック
                // 1. デフォルト設定が未使用ならそれを使う
                if (!usedMasterIds.has(f.masterId)) {
                    master = Data.MASTERS.find(m => m.id === f.masterId);
                    usedMasterIds.add(f.masterId);
                } else {
                    // 2. 使われていたら、未使用のマスターから探して割り当てる
                    master = Data.MASTERS.find(m => !usedMasterIds.has(m.id));
                    // 万が一すべて埋まっていたらデフォルト(重複許容)
                    if (!master) master = Data.MASTERS.find(m => m.id === f.masterId);

                    usedMasterIds.add(master.id);
                }

                // 敵のカラー
                color = master.color;
            }

            return {
                id: f.id,
                name: f.name,
                color: color,
                master: master,
                isPlayer: isPlayer,
                gold: 1000,
                isAlive: !!hq,
                hqId: hq ? hq.id : f.defaultHq
            };
        });

        Model.state.castles = currentCastles;
        Model.state.mapUnits = [];
        Model.state.turnCount = 1;
        Model.state.strategicTurn = 'player';
        Model.state.gameCleared = false;
        Model.state.globalBattleCooldown = 0;

        this.startGame();
    },

    /**
     * 初期ユニットを配置し、マップ画面へ遷移
     */
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

    /**
     * ローカルストレージからゲームデータをロード
     */
    /**
     * ローカルストレージからゲームデータをロード
     */
    loadGame() {
        View.openModal("ロード確認", "ゲームをロードしますか？\n（現在の進行状況は失われます）", [
            {
                label: "はい", action: () => {
                    const d = localStorage.getItem('bahamut_save_v2');
                    if (d) {
                        const save = JSON.parse(d);
                        Model.state = save;
                        // Battle中のgridなどDOM要素を持たないデータの復元が必要
                        View.changeScreen(Model.state.currentScreen);
                        if (Model.state.currentScreen === 'battle') {
                            View.initBattleGrid();
                        }
                        View.showMessage("ロードしました");
                    } else {
                        View.showMessage("セーブデータがありません");
                    }
                }
            },
            { label: "キャンセル", action: () => { } }
        ]);
    },

    /**
     * 現在の状態をローカルストレージにセーブ
     */
    saveGame() {
        View.openModal("セーブ確認", "現在の状態をセーブしますか？\n（既存のセーブデータは上書きされます）", [
            {
                label: "はい", action: () => {
                    // DOM要素や循環参照を除く等の処置が必要だが、現在のModel構造はシリアライズ可能と仮定
                    // battle.grid内のelは保存しないように除外するか、再開時に再生成する
                    const save = JSON.parse(JSON.stringify(Model.state, (key, value) => {
                        if (key === 'el' || key === 'ctx' || key === 'canvas') return undefined; // DOM関連除外
                        if (key === 'movedUnits') return Array.from(value); // Set -> Array
                        return value;
                    }));
                    localStorage.setItem('bahamut_save_v2', JSON.stringify(save));
                    View.showMessage("セーブしました");
                }
            },
            { label: "キャンセル", action: () => { } }
        ]);
    },

    /**
     * タイトルに戻る確認モーダルを表示
     */
    confirmReturnToTitle() {
        View.openModal("確認", "タイトル画面に戻りますか？\n（保存されていない進行状況は失われます）", [
            { label: "はい", action: () => location.reload() },
            { label: "いいえ", action: () => { } }
        ]);
    },

    // -------------------------------------------------------------------------
    // ゲーム進行 (Turn, Battle)
    // -------------------------------------------------------------------------
    /**
     * バトルからの撤退確認モーダルを表示
     */
    showEscapeConfirm() {
        View.openModal("撤退しますか？", "撤退すると部隊は大きなダメージを受け、本拠地に戻されます。", [
            {
                label: "撤退する", action: () => {
                    const unit = Model.state.battleUnitA;
                    const faction = Model.state.factions.find(f => f.id === unit.owner);
                    const currentCastle = Model.state.castles.find(c => Math.hypot(c.x - unit.x, c.y - unit.y) < Data.UI.CASTLE_DETECT_RADIUS);
                    let escaped = false;

                    if (currentCastle && currentCastle.neighbors) {
                        const potentialRetreats = currentCastle.neighbors
                            .map(nid => Model.state.castles.find(c => c.id === nid))
                            .filter(c => c && c.owner === faction.id);

                        if (potentialRetreats.length > 0) {
                            const target = potentialRetreats[0];
                            unit.x = target.x;
                            unit.y = target.y;
                            unit.targetX = target.x;
                            unit.targetY = target.y;
                            unit.hasActed = true; // 行動済みにする

                            // 撤退時も全回復（仕様都合）
                            unit.army.forEach(u => u.currentHp = u.hp);
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

    /**
     * プレイヤーの戦略ターン終了処理
     * 敵AIターンの開始をトリガーする
     */
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

    /**
     * プレイヤーターン開始処理
     * 収入加算、行動フラグリセットを行う
     */
    startPlayerTurn() {
        Model.state.turnCount++;
        Model.state.strategicTurn = 'player';
        View.showMessage(`ターン開始：収入計算中...`);

        const player = Model.state.factions.find(f => f.isPlayer);
        const income = Model.calculateFactionIncome(player.id);
        player.gold += income;

        Model.state.mapUnits.forEach(u => u.hasActed = false);
        View.showMessage(`ターン開始：収入 ${income}G`);

        // UI更新
        document.getElementById('turn-text-map').innerText = "自軍フェーズ";
        document.getElementById('turn-text-map').style.color = "#fbbf24";
        const menuGroup = document.getElementById('menu-group');
        if (menuGroup) menuGroup.classList.remove('hidden');
    },

    /**
     * バトルを開始する（委譲メソッド）
     */
    startBattle() {
        BattleSystem.start();
    },

    // -------------------------------------------------------------------------
    // アクション (Recruit, Enhance, Map Click)
    // -------------------------------------------------------------------------
    /**
     * 新しい部隊を作成（雇用）する
     * @param {Object} castle - 作成元の拠点
     */
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

    /**
     * ユニットを追加雇用する
     * @param {string} aId - 部隊ID
     * @param {string} utId - ユニットタイプID
     * @param {string} cId - 拠点ID
     */
    recruitUnit(aId, utId, cId) {
        const result = Model.recruitUnit(aId, utId);
        if (result === true) {
            View.renderBaseMenu(Model.state.castles.find(c => c.id === cId), aId);
        } else {
            View.showMessage(result);
        }
    },

    /**
     * ユニットを強化する
     * @param {string} aId - 部隊ID
     * @param {number} idx - ユニットインデックス
     * @param {string} type - 強化タイプ('hp'|'atk')
     * @param {string} cId - 拠点ID
     */
    enhanceUnit(aId, idx, type, cId) {
        const result = Model.enhanceUnit(aId, idx, type);
        if (result === true) {
            View.renderBaseMenu(Model.state.castles.find(c => c.id === cId), aId);
        } else {
            View.showMessage(result);
        }
    },

    /**
     * マップクリック時のハンドラ
     * ユニット選択、移動指示などを制御
     * @param {MouseEvent} e
     */
    handleMapClick(e) {
        if (Model.state.strategicTurn !== 'player') return;

        let x, y;
        if (e.customX !== undefined && e.customY !== undefined) {
            // Viewから渡された補正済み座標を使用
            x = e.customX;
            y = e.customY;
        } else {
            // fallback (非推奨だが念のため)
            const rect = View.canvas.getBoundingClientRect();
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }

        const targetCastle = Model.state.castles.find(c => Math.hypot(c.x - x, c.y - y) < Data.UI.CASTLE_DETECT_RADIUS);
        const u = Model.state.selectedMapUnit;

        // 1. 移動ロジック（ユニット選択中かつ未行動）
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
        }

        // 2. ユニット選択ロジック (クリック地点付近のユニットを探す)
        const clickedUnits = Model.state.mapUnits.filter(u => Math.hypot(u.x - x, u.y - y) < Data.UI.CLICK_RADIUS);
        let targetUnit = null;
        const playerUnits = clickedUnits.filter(u => u.owner === Model.state.factions.find(f => f.isPlayer).id);

        if (playerUnits.length > 0) {
            // 既に選択中のユニットが含まれる場合、次のユニットを選択（サイクリック選択）
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

    /**
     * マップ右クリック時のハンドラ
     * 拠点メニューの表示など
     * @param {MouseEvent} e
     */
    handleMapRightClick(e) {
        e.preventDefault();
        if (Model.state.strategicTurn !== 'player') return;

        let x, y;
        if (e.customX !== undefined && e.customY !== undefined) {
            x = e.customX;
            y = e.customY;
        } else {
            const rect = View.canvas.getBoundingClientRect();
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }

        // 右クリックで拠点メニューを開く
        const clickedCastle = Model.state.castles.find(c => Math.hypot(c.x - x, c.y - y) < Data.UI.CLICK_RADIUS);
        if (clickedCastle) {
            View.toggleBaseMenu(clickedCastle);
            return;
        }

        // それ以外なら選択解除
        Model.state.selectedMapUnit = null;
        View.clearBaseMenu();
    }
};

window.Controller = Controller;

// Initialize
window.onload = () => {
    Controller.init();
    View.renderSettings(); // 初期画面（マップ選択）の描画
};

window.onresize = () => View.initCanvas();

