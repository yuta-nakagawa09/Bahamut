/**
 * VIEW: 表示制御
 * 画面の描画、DOM操作、Canvas描画を担当。
 * Modelのデータを元に画面を更新する。UIコンポーネント(UI.js)を使用。
 * @namespace
 */
window.View = {
    canvas: null,
    ctx: null,
    Components: UI,
    mapOffsetX: 0,
    mapOffsetY: 0,

    // -------------------------------------------------------------------------
    // 初期化
    // -------------------------------------------------------------------------
    // スケーリング管理
    scale: 1,

    init() {
        this.ctx = null;
        this.canvas = null;
        this.initScaling();
        window.addEventListener('resize', () => this.initScaling());
    },

    /**
     * 画面スケーリングの計算と適用
     * ウィンドウサイズに合わせてゲーム画面を拡大縮小する
     */
    initScaling() {
        const container = document.getElementById('game-container');
        if (!container) return;

        const baseWidth = Data.UI.BASE_WIDTH;
        const baseHeight = Data.UI.BASE_HEIGHT;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // Contain (画面内に収める)
        const scaleX = windowWidth / baseWidth;
        const scaleY = windowHeight / baseHeight;
        this.scale = Math.min(scaleX, scaleY);

        container.style.transform = `scale(${this.scale})`;
    },

    /**
     * スケーリングを考慮した座標変換
     * @param {MouseEvent} e
     * @returns {Object} {x, y} ゲーム内座標(1280x720基準)
     */
    getScaledCoordinates(e) {
        const container = document.getElementById('game-container');
        if (!container) return { x: e.clientX, y: e.clientY };

        const rect = container.getBoundingClientRect();

        // コンテナ内の相対座標を計算
        const relX = e.clientX - rect.left;
        const relY = e.clientY - rect.top;

        // スケールで割って元の解像度に戻す
        return {
            x: relX / this.scale,
            y: relY / this.scale
        };
    },

    /**
     * 画面切り替え
     * @param {string} screenId - 切り替える画面ID ('title', 'settings', 'map', 'battle', 'ending')
     */
    changeScreen(screenId) {
        document.querySelectorAll('div[id^="screen-"]').forEach(el => el.classList.add('hidden'));
        const target = document.getElementById(`screen-${screenId}`);
        if (target) target.classList.remove('hidden');
        Model.state.currentScreen = screenId;

        const turnIndicator = document.getElementById('turn-indicator');
        const isPlayerTurn = Model.state.strategicTurn === 'player';

        if (screenId === 'map') {
            turnIndicator.classList.remove('hidden'); // マップ画面ではヘッダーに表示する
            this.initCanvas();
            const sideMenu = document.getElementById('menu-group');
            const menu = document.getElementById('base-menu');
            menu.classList.add('hidden'); // 初期状態ではメニューを隠す
            this.clearBaseMenu();

            // マップ背景の動的設定
            const mapCanvas = document.getElementById('map-canvas');
            const mapData = Data.MAP_TEMPLATES.find(m => m.id === Model.state.selectedMapId);
            const bgImage = mapData ? mapData.backgroundImage : 'assets/img/map_bg_continent.png';

            if (mapCanvas) {
                mapCanvas.style.backgroundImage = `url('${bgImage}')`;
            }

            if (isPlayerTurn) {
                sideMenu.classList.remove('hidden');
            } else {
                sideMenu.classList.add('hidden');
            }
        } else if (screenId === 'battle') {
            turnIndicator.classList.add('hidden');
        } else {
            turnIndicator.classList.add('hidden');
        }
    },

    // -------------------------------------------------------------------------
    // マスター・マップ選択画面
    // -------------------------------------------------------------------------
    /**
     * マスター選択画面を描画する
     */
    renderMasterSelect() {
        const container = document.getElementById('master-select-container');
        if (!container) return;
        container.innerHTML = Data.MASTERS.map(m => UI.MasterSelectionCard(m)).join('');
    },

    /**
     * 設定モーダル（マップ選択）の表示切り替え
     */
    toggleSettings() {
        const el = document.getElementById('screen-settings');
        if (el.classList.contains('hidden')) {
            this.renderSettings();
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    },

    /**
     * 設定画面（マップ選択リスト）の描画
     */
    renderSettings() {
        const list = document.getElementById('map-select-list');
        if (!list) return;
        list.innerHTML = Data.MAP_TEMPLATES.map(t => UI.MapSelectionCard(t)).join('');
    },

    // -------------------------------------------------------------------------
    // 汎用メッセージ・モーダル
    // -------------------------------------------------------------------------
    /**
     * 画面下部にメッセージを表示する
     * @param {string} text - メッセージ内容
     */
    showMessage(text) {
        const box = document.getElementById('message-box');
        const txt = document.getElementById('message-text');
        txt.innerText = text;
        box.style.opacity = '1';
        if (window.msgTimer) clearTimeout(window.msgTimer);
        window.msgTimer = setTimeout(() => { box.style.opacity = '0'; }, 3000);
    },

    /**
     * モーダルウィンドウを表示する
     * @param {string} title - タイトル
     * @param {string} body - メッセージ本文
     * @param {Array<{label:string, action:function}>} buttons - ボタン定義リスト
     */
    openModal(title, body, buttons = []) {
        const modal = document.getElementById('modal-layer');
        // Restore generic modal structure if needed (e.g. after Info Modal)
        if (!document.getElementById('modal-title')) {
            modal.innerHTML = UI.GenericModalTemplate();
        }

        document.getElementById('modal-title').innerText = title;
        document.getElementById('modal-body').innerHTML = body; // Use innerHTML for rich content
        const footer = document.getElementById('modal-footer');
        footer.innerHTML = '';
        if (buttons) {
            buttons.forEach(btn => {
                if (!btn || !btn.label) return;
                const b = UI.createModalButton(btn.label, () => { modal.classList.add('hidden'); btn.action(); });
                footer.appendChild(b);
            });
        }
        modal.classList.remove('hidden');
    },

    /**
     * エンディング画面を表示する
     * @param {boolean} isWin - 勝利フラグ
     */
    showEnding(isWin) {
        const screen = document.getElementById('screen-ending');
        const title = document.getElementById('ending-title');
        const body = document.getElementById('ending-body');

        const styles = UI.EndingStyles(isWin);
        title.innerText = styles.titleText;
        title.className = styles.titleClass;
        body.innerText = styles.bodyText;

        this.changeScreen('ending');
    },

    // -------------------------------------------------------------------------
    // マップ画面 (Canvas描画)
    // -------------------------------------------------------------------------
    /**
     * マップ描画用のCanvasを初期化する
     */
    initCanvas() {
        const canvas = document.getElementById('map-canvas');
        if (!canvas) return;

        // Canvasの解像度を固定(1080x540)
        // CSSでの表示サイズと一致させることで、描画とクリック判定のズレを防ぐ
        const fixedWidth = 1080;
        const fixedHeight = 540;

        // 既存のCanvasを置換（イベントリスナー重複防止のため）
        const newCanvas = canvas.cloneNode(true);
        canvas.parentNode.replaceChild(newCanvas, canvas);

        newCanvas.width = fixedWidth;
        newCanvas.height = fixedHeight;

        this.ctx = newCanvas.getContext('2d');
        this.canvas = newCanvas;

        // マップのセンタリング計算（廃止：左上原点絶対座標へ変更）
        this.mapOffsetX = 0;
        this.mapOffsetY = 0;

        // ループ開始
        if (this.animationId) cancelAnimationFrame(this.animationId);
        const loop = () => {
            this.renderMapLoop();
            this.animationId = requestAnimationFrame(loop);
        };
        loop();

        // イベントリスナーの登録
        this.canvas.addEventListener('click', (e) => {
            // Screen Scaleを考慮した補正
            // getBoundingClientRectは画面上のスケーリングされた座標を返す
            const rect = this.canvas.getBoundingClientRect();

            // 画面上のクリック位置とCanvas左上の差分
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;

            // スケールで割って、Canvas内部(論理)座標に変換
            const canvasX = screenX / this.scale;
            const canvasY = screenY / this.scale;

            // mapOffsetX等の補正は不要になったため、canvasX/Yをそのまま使用
            // Controllerへの互換性維持のため customX/Y に入れる
            const simulatedEvent = {
                clientX: 0, clientY: 0,
                customX: canvasX,
                customY: canvasY
            };

            // const dataX = canvasX;
            // const dataY = canvasY;
            // console.log(`Map Click (Data): x=${Math.round(dataX)}, y=${Math.round(dataY)}`);
            console.log(`Map Click (Scaled): x=${Math.round(canvasX)}, y=${Math.round(canvasY)}`);
            Controller.handleMapClick(simulatedEvent);
        });

        this.canvas.addEventListener('contextmenu', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            const canvasX = screenX / this.scale;
            const canvasY = screenY / this.scale;

            const simulatedEvent = {
                preventDefault: () => e.preventDefault(),
                customX: canvasX,
                customY: canvasY
            };
            Controller.handleMapRightClick(simulatedEvent);
        });
    },

    /**
     * マップ画面の描画ループ（Canvas）
     * 拠点、ルート、ユニットを描画する。
     */
    renderMapLoop() {
        if (!this.ctx || Model.state.currentScreen !== 'map') return;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // オフセット廃止のため、そのまま描画
        // const ox = this.mapOffsetX || 0;
        // const oy = this.mapOffsetY || 0;

        // ルート（道）の描画
        ctx.save();
        // ctx.translate(ox, oy); // 廃止
        Model.state.castles.forEach(c => {
            if (c.neighbors) {
                c.neighbors.forEach(nid => {
                    const n = Model.state.castles.find(x => x.id === nid);
                    if (n) {
                        ctx.beginPath();
                        ctx.moveTo(c.x, c.y);
                        ctx.lineTo(n.x, n.y);
                        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
                        ctx.lineWidth = 8;
                        ctx.stroke();
                    }
                });
            }
        });

        // 拠点の描画
        Model.state.castles.forEach(c => {
            const owner = Model.state.factions.find(f => f.id === c.owner);
            const color = owner ? owner.color : '#888';
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(c.x, c.y, 25, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            if (c.id === owner?.hqId) {
                ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 4; ctx.stroke();
            }

            ctx.fillStyle = 'white';
            ctx.font = 'bold 20px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(c.name, c.x, c.y + 45);
        });

        // ユニットの描画
        // 選択中の部隊を最前面に描画するため、ソートして描画
        const unitsToRender = [...Model.state.mapUnits].sort((a, b) => {
            if (a === Model.state.selectedMapUnit) return 1;
            if (b === Model.state.selectedMapUnit) return -1;
            return 0;
        });

        unitsToRender.forEach(u => {
            const faction = Model.state.factions.find(f => f.id === u.owner);
            const color = faction ? faction.color : '#fff';
            const isSelected = u === Model.state.selectedMapUnit;

            ctx.save();
            ctx.translate(u.x, u.y);

            // 選択マーカー
            if (isSelected) {
                ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
                ctx.beginPath();
                ctx.arc(0, 0, 35, 0, Math.PI * 2);
                ctx.fill();

                // 頭上に▼とタイプ
                ctx.fillStyle = '#FFD700';
                ctx.textAlign = 'center';
                ctx.font = '20px monospace';
                const yOffset = Math.sin(Date.now() / 200) * 5; // アニメーション
                ctx.fillText('▼', 0, -50 + yOffset);

                ctx.font = '20px monospace';
                ctx.fillStyle = 'white';
                ctx.fillText(`部隊 ${Model.state.mapUnits.filter(m => m.owner === u.owner).indexOf(u) + 1}`, 0, -75 + yOffset);
            }

            // 本体
            ctx.fillStyle = color;
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 10;
            ctx.font = '36px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(u.emoji, 0, 0);

            ctx.restore();
        });

        ctx.restore();
    },


    /**
     * 観戦モードの切り替え
     */
    toggleSpectatorMode() {
        Model.state.spectateCPUBattles = !Model.state.spectateCPUBattles;
        const btn = document.getElementById('spectator-toggle-btn');
        if (btn) {
            if (Model.state.spectateCPUBattles) {
                btn.innerHTML = '<span>👁️</span> 観戦: ON';
                btn.classList.remove('bg-gray-800', 'text-gray-500', 'border-gray-600');
                btn.classList.add('bg-green-900', 'text-green-400', 'border-green-600');
            } else {
                btn.innerHTML = '<span>👁️</span> 観戦: OFF';
                btn.classList.remove('bg-green-900', 'text-green-400', 'border-green-600');
                btn.classList.add('bg-gray-800', 'text-gray-500', 'border-gray-600');
            }
        }
    },

    // -------------------------------------------------------------------------
    // 拠点メニュー (Base Menu)
    // -------------------------------------------------------------------------
    /**
     * 拠点メニューを表示する
     * @param {Object} castle - 拠点データ
     */
    /**
     * 拠点メニューを表示する
     * @param {Object} castle - 拠点データ
     */
    toggleBaseMenu(castle = null) {
        const menu = document.getElementById('base-menu');
        const mapSidebar = document.getElementById('command-sidebar');

        if (!castle) {
            menu.classList.add('hidden');
            mapSidebar.classList.remove('hidden'); // Show sidebar when menu closed
            // Clear selection
            if (Model.state.selectedCastle) {
                Model.state.selectedCastle = null;
                // Redraw to remove selection ring
            }
            return;
        }

        // Set state
        Model.state.selectedCastle = castle;
        menu.classList.remove('hidden');
        // mapSidebar.classList.add('hidden'); // Removed strict hiding to allow parallel viewing

        // Reset Tab State on Open
        this.baseMenuTab = 'enhance';

        this.renderBaseMenu(castle);
    },

    clearBaseMenu() {
        this.toggleBaseMenu(null);
    },

    /**
     * 拠点メニューのタブ切り替え
     * @param {string} tabId 
     */
    switchBaseTab(tabId) {
        this.baseMenuTab = tabId;
        if (Model.state.selectedCastle) {
            this.renderBaseMenu(Model.state.selectedCastle);
        }
    },

    /**
     * 拠点メニューの内容を描画する
     * @param {Object} castle - 拠点データ
     * @param {string} [targetUnitId=null] - 表示対象の部隊ID
     */
    renderBaseMenu(castle, targetUnitId = null) {
        const playerFaction = Model.state.factions.find(f => f.isPlayer);

        // 1. 部隊情報の取得とアクティブ部隊の決定
        const allUnits = Model.state.mapUnits.filter(u => Math.hypot(u.x - castle.x, u.y - castle.y) < Data.UI.UNIT_DETECT_RADIUS);
        let activeUnit = null;
        if (allUnits.length > 0) {
            activeUnit = allUnits.find(u => u.id === targetUnitId);
            if (!activeUnit) {
                if (Model.state.selectedMapUnit && allUnits.includes(Model.state.selectedMapUnit)) {
                    activeUnit = Model.state.selectedMapUnit;
                } else {
                    activeUnit = allUnits.find(u => u.owner === playerFaction.id) || allUnits[0];
                }
            }
        }

        // 2. タイトル設定（拠点名 + HQ + アクティブ部隊情報）
        const isHQ = Model.state.factions.some(f => f.hqId === castle.id && f.isAlive);
        const faction = Model.state.factions.find(f => f.id === castle.owner);
        const color = faction ? faction.color : '#fff';
        const ownerName = faction ? faction.master.name : '中立';
        const ownerEmoji = faction ? faction.master.emoji : '';

        let infoText = '';
        if (castle.owner === 'neutral') {
            infoText = UI.MenuBonus('bonus', castle.captureBonus);
        } else {
            infoText = UI.MenuBonus('income', castle.income || 0);
        }
        const totalPower = Model.getCastleTotalPower(castle);
        infoText += UI.MenuPower(totalPower);

        document.getElementById('base-menu-title').innerHTML = UI.MenuTitle(castle.name, isHQ, ownerName, ownerEmoji, color, infoText);


        // 3. メインタブの描画
        const tabsContainer = document.getElementById('base-menu-tabs');
        tabsContainer.innerHTML = '';

        const isPlayerCastle = (castle.owner === playerFaction.id);

        if (isPlayerCastle) {
            tabsContainer.appendChild(UI.BaseMenuTabs(this.baseMenuTab, (t) => this.switchBaseTab(t)));
        }

        // 4. タブごとのコンテンツ描画
        const contentContainer = document.getElementById('base-menu-tab-content');
        contentContainer.innerHTML = '';
        const noMsg = document.getElementById('no-unit-message');
        noMsg.classList.add('hidden');

        // タブ分岐
        if (!isPlayerCastle) {
            // -----------------------------------------------------------
            // 敵拠点 / 中立拠点
            // -----------------------------------------------------------
            contentContainer.appendChild(UI.TabContentEnemy(allUnits, activeUnit, (u) => {
                this.renderBaseMenu(castle, u.id);
            }));

        } else {
            // -----------------------------------------------------------
            // 自軍拠点 (3タブ制御)
            // -----------------------------------------------------------
            if (this.baseMenuTab === 'create') {
                const currentArmies = Model.state.mapUnits.filter(u => u.owner === playerFaction.id).length;

                contentContainer.appendChild(UI.TabContentCreate(
                    playerFaction.gold,
                    currentArmies,
                    Data.ARMY_COST,
                    Data.MAX_ARMIES,
                    () => {
                        Controller.createNewArmy(castle);
                        this.baseMenuTab = 'recruit';
                    }
                ));

            } else if (this.baseMenuTab === 'recruit') {
                contentContainer.appendChild(UI.TabContentRecruit(
                    allUnits,
                    activeUnit,
                    castle,
                    playerFaction,
                    (u) => { // onSelectUnit
                        if (u.owner === playerFaction.id) Model.state.selectedMapUnit = u;
                        this.renderBaseMenu(castle, u.id);
                    }
                ));

            } else if (this.baseMenuTab === 'enhance') {
                contentContainer.appendChild(UI.TabContentEnhance(
                    allUnits,
                    activeUnit,
                    castle,
                    playerFaction,
                    (u) => { // onSelectUnit
                        if (u.owner === playerFaction.id) Model.state.selectedMapUnit = u;
                        this.renderBaseMenu(castle, u.id);
                    }
                ));
            }
        }
    },

    // -------------------------------------------------------------------------
    // バトル画面 (Grid & UI)
    // -------------------------------------------------------------------------
    /**
     * ユニット詳細確認モーダルを表示
     * @param {string} unitId 
     */
    showUnitDetail(unitId) {
        // Find unit definition
        let unit = null;

        // Search in Faction Units (Player)
        if (Data.FACTION_UNITS) {
            Object.values(Data.FACTION_UNITS).forEach(arr => {
                if (!arr) return;
                const found = arr.find(u => u.id === unitId);
                if (found) unit = found;
            });
        }

        // Search in Special Units
        if (!unit && Data.SPECIAL_UNITS && Data.SPECIAL_UNITS[unitId]) {
            unit = Data.SPECIAL_UNITS[unitId];
        }

        if (unit) {
            this.openModal('ユニット詳細', UI.UnitDetailModal(unit));
        } else {
            console.error('Unit detail not found for:', unitId);
        }
    },

    /**
     * 動的ユニット（個別インスタンス）の詳細を表示
     * @param {string} armyId - 部隊ID
     * @param {number} unitIndex - ユニットインデックス
     */
    showUnitInstanceDetail(armyId, unitIndex) {
        const army = Model.state.mapUnits.find(u => u.id === armyId);
        if (army && army.army[unitIndex]) {
            const unit = army.army[unitIndex];
            this.openModal('ユニット詳細', UI.UnitDetailModal(unit));
        } else {
            console.error('Unit instance not found:', armyId, unitIndex);
        }
    },

    /**
     * バトルグリッドDOMを初期化する
     * Controllerでデータ生成後に呼び出される
     */
    initBattleGrid() {
        const grid = document.getElementById('battle-grid');
        grid.innerHTML = '';

        // 既存のgridデータがあるか確認
        if (!Model.state.battle.grid || Model.state.battle.grid.length === 0) {
            return;
        }

        // 既存データの再描画
        View.renderBattleGridCore(Model.state.battle.grid);
        View.updateBattleUI();
        View.updateBattleHeader();
    },

    /**
     * バトル画面のヘッダー（対戦勢力名）を更新する
     */
    updateBattleHeader() {
        const u1 = Model.state.battleUnitA;
        const u2 = Model.state.battleUnitB;
        // 観戦モードなどで片方がnullの場合も考慮するが、基本はstartBattleでセットされる
        if (!u1 || !u2) return;

        const f1 = Model.state.factions.find(f => f.id === u1.owner);
        const f2 = Model.state.factions.find(f => f.id === u2.owner);

        const p1El = document.getElementById('p1-stats');
        const p2El = document.getElementById('p2-stats');

        if (p1El && f1) {
            p1El.innerHTML = `<span style="color:${f1.color}">${f1.master.emoji} ${f1.name}</span>`;
        } else if (p1El) {
            p1El.innerText = "不明な部隊";
        }

        if (p2El && f2) {
            p2El.innerHTML = `<span style="color:${f2.color}">${f2.master.emoji} ${f2.name}</span>`;
        } else if (p2El) {
            p2El.innerText = "不明な部隊";
        }
    },

    /**
     * バトルUI（ユニット位置、移動範囲、選択状態など）を更新する
     */
    updateBattleUI() {
        const b = Model.state.battle;
        const grid = document.getElementById('battle-grid');
        // グリッドが初期化されていない場合は何もしない
        if (!b.grid || b.grid.length === 0) return;


        b.grid.forEach(cell => {
            if (cell.el) {
                cell.el.innerHTML = '';
                cell.el.classList.remove(UI.BattleStyles.gridSelectedClass, UI.BattleStyles.gridMoveClass, UI.BattleStyles.gridAttackClass);
                cell.el.style.backgroundColor = '';
            }
        });
        b.units.forEach(u => {
            const cell = b.grid.find(g => g.r === u.r && g.c === u.c);
            if (cell && cell.el) {
                const div = document.createElement('div'); div.className = "relative flex flex-col items-center justify-center pointer-events-none w-full h-full";
                const hpPct = u.currentHp / u.hp;
                div.innerHTML = UI.BattleUnitHTML(u, u.rank || 0, hpPct);
                if (b.movedUnits.has(u)) div.classList.add(UI.BattleStyles.movedUnitClass);
                cell.el.appendChild(div);
            }
        });
        if (b.selectedUnit) {
            const s = b.selectedUnit;
            const sc = b.grid.find(g => g.r === s.r && g.c === s.c);
            if (sc && sc.el) sc.el.classList.add(UI.BattleStyles.gridSelectedClass);
            b.grid.forEach(cell => {
                const d = Model.getHexDist(s.r, s.c, cell.r, cell.c);
                if (cell.el) {
                    if (!b.tempMoved && d > 0 && d <= s.move && !b.units.some(u => u.r === cell.r && u.c === cell.c)) {
                        cell.el.classList.add(UI.BattleStyles.gridMoveClass);
                    }
                    if (!(s.range > 1 && b.tempMoved) && d > 0 && d <= s.range) {
                        cell.el.classList.add(UI.BattleStyles.gridAttackClass);
                    }
                }
            });
        }

        // Turn Indicator & Buttons
        const indicator = document.getElementById('battle-turn-indicator');
        const endBtn = document.getElementById('battle-end-turn-btn');
        const retreatBtn = document.getElementById('battle-retreat-btn');

        if (indicator) {
            const styles = UI.TurnIndicatorStyles(b.turn);

            // 観戦モード判定 (Side AがAI)
            const playerFaction = Model.state.factions.find(f => f.isPlayer);
            const isSpectating = Model.state.spectateCPUBattles && Model.state.battleUnitA.owner !== playerFaction.id;

            if (isSpectating) {
                indicator.innerText = "CPU対戦中";
                indicator.className = "text-xl font-bold text-gray-500 animate-pulse mb-2"; // サイズ調整とマージン
                if (endBtn) endBtn.disabled = true;

                const autoBtn = document.getElementById('battle-auto-btn');
                if (autoBtn) autoBtn.disabled = true;

                if (retreatBtn) retreatBtn.disabled = true;
            } else {
                indicator.innerText = styles.text;
                indicator.className = styles.className;
                if (endBtn) endBtn.disabled = styles.endBtnDisabled;

                const autoBtn = document.getElementById('battle-auto-btn');
                if (autoBtn) autoBtn.disabled = styles.endBtnDisabled;

                if (retreatBtn) retreatBtn.disabled = styles.retreatBtnDisabled;
            }
        }
    },

    /**
     * バトルグリッドのベースDOM生成処理
     * @param {Array} gridData - グリッドデータの配列
     */
    renderBattleGridCore(gridData) {
        const grid = document.getElementById('battle-grid');
        grid.innerHTML = '';

        gridData.forEach(cell => {
            const r = cell.r; const c = cell.c;
            const hexSize = Data.BATTLE.GRID_SIZE;
            const px = c * hexSize + (r % 2 ? hexSize / 2 : 0);
            const py = r * hexSize * 0.75;

            const el = UI.BattleHex(px, py, r, c, (r, c) => {
                if (window.BattleSystem) window.BattleSystem.handleClick(r, c);
            });
            cell.el = el;
            grid.appendChild(el);
        });

        // コンテナサイズ調整
        const cols = 7; const rows = 6; const hexSize = Data.BATTLE.GRID_SIZE;
        grid.style.height = `${(rows * 0.75 + 0.25) * hexSize}px`;
        grid.style.width = `${(cols * 1.0 + 0.5) * hexSize}px`; // 幅を指定してFlex中央寄せを機能させる
    },
    /**
     * モーダルを閉じる
     */
    closeModal() {
        document.getElementById('modal-layer').classList.add('hidden');
    },

    /**
     * 情報ウィンドウ（モーダル）を開く
     */
    openInfoModal() {
        const modalHtml = UI.InfoModalTemplate();
        const modalLayer = document.getElementById('modal-layer');
        modalLayer.innerHTML = modalHtml;
        modalLayer.classList.remove('hidden');

        // Initial render
        this.renderInfoFactionList();
    },

    /**
     * 情報タブ切り替え
     * @param {string} tabId 
     */
    switchInfoTab(tabId) {
        document.querySelectorAll('.info-tab').forEach(el => el.classList.remove('active'));
        document.getElementById(`tab-${tabId}`).classList.add('active');

        if (tabId === 'faction') this.renderInfoFactionList();
        else if (tabId === 'castle') this.renderInfoCastleList();
    },

    /**
     * 勢力一覧を描画
     */
    renderInfoFactionList() {
        const factions = Model.state.factions;
        const rows = [];

        factions.forEach(f => {
            if (!f.isAlive) return;
            const castleCount = Model.state.castles.filter(c => c.owner === f.id).length;
            const armyCount = Model.state.mapUnits.filter(u => u.owner === f.id).length;
            const income = Model.calculateFactionIncome(f.id);
            const power = Model.getFactionTotalPower(f.id);

            rows.push({
                color: f.color,
                emoji: f.master.emoji,
                name: f.name,
                castleCount: castleCount,
                armyCount: armyCount,
                gold: f.gold,
                income: income,
                power: power
            });
        });

        const html = UI.InfoFactionTable(rows);
        document.getElementById('info-content-area').innerHTML = html;
    },

    /**
     * 拠点一覧を描画
     */
    renderInfoCastleList() {
        const castles = Model.state.castles;
        const rows = [];

        castles.forEach(c => {
            const owner = Model.state.factions.find(f => f.id === c.owner);
            const isNeutral = !owner;
            const ownerNameDisplay = owner
                ? `<span style="color:${owner.color}">${owner.master.emoji} ${owner.name}</span>`
                : '<span style="color:#9ca3af">中立</span>';
            const type = (c.id === 'c1' || c.id === 'c2' || c.id === 'c6') ? '★本拠地' : '拠点';

            let incomeText = '';
            if (c.owner === 'neutral') {
                incomeText = `制圧: ${c.captureBonus}G`;
            } else {
                incomeText = `収入: ${c.income}G`;
            }

            const power = Model.getCastleTotalPower(c);
            const uniqueUnitName = c.uniqueUnit ? Data.SPECIAL_UNITS[c.uniqueUnit].name : '-';
            const uniqueUnitId = c.uniqueUnit || null;

            rows.push({
                name: c.name,
                type: type,
                ownerNameDisplay: ownerNameDisplay,
                incomeText: incomeText,
                power: power,
                uniqueUnitName: uniqueUnitName,
                uniqueUnitId: uniqueUnitId
            });
        });

        const html = UI.InfoCastleTable(rows);
        document.getElementById('info-content-area').innerHTML = html;
    }
}; window.UI = UI; window.View = View;
