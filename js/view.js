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
    // 画面切り替え・表示
    // -------------------------------------------------------------------------
    /**
     * 指定された画面IDに切り替える
     * @param {string} screenId - 画面ID ('title', 'map', 'battle', 'ending' etc.)
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

    /**
     * マップフローリスト（詳細選択）を描画
     */
    renderMapFlow() {
        const list = document.getElementById('map-flow-list');
        list.innerHTML = Data.MAP_TEMPLATES.map(t =>
            UI.Card(t.name, t.desc, '', `Controller.selectMapAndNext('${t.id}')`, 'Click to Select')
        ).join('');
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
    openModal(title, body, buttons) {
        const modal = document.getElementById('modal-layer');
        document.getElementById('modal-title').innerText = title;
        document.getElementById('modal-body').innerText = body;
        const footer = document.getElementById('modal-footer');
        footer.innerHTML = '';
        buttons.forEach(btn => {
            if (!btn || !btn.label) return;
            const b = UI.createModalButton(btn.label, () => { modal.classList.add('hidden'); btn.action(); });
            footer.appendChild(b);
        });
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
        const container = canvas.parentElement;
        const newCanvas = canvas.cloneNode(true);
        canvas.parentNode.replaceChild(newCanvas, canvas);
        newCanvas.width = container.clientWidth;
        newCanvas.height = container.clientHeight;
        this.ctx = newCanvas.getContext('2d');
        this.canvas = newCanvas;

        // マップのセンタリング計算
        if (Model.state.castles.length > 0) {
            const minX = Math.min(...Model.state.castles.map(c => c.x));
            const maxX = Math.max(...Model.state.castles.map(c => c.x));
            const minY = Math.min(...Model.state.castles.map(c => c.y));
            const maxY = Math.max(...Model.state.castles.map(c => c.y));

            const mapWidth = maxX - minX;
            const mapHeight = maxY - minY;
            const centerX = minX + mapWidth / 2;
            const centerY = minY + mapHeight / 2;

            this.mapOffsetX = (this.canvas.width / 2) - centerX;
            this.mapOffsetY = (this.canvas.height / 2) - centerY;
        }

        requestAnimationFrame(() => this.renderMapLoop());

        // イベントリスナーの登録
        this.canvas.addEventListener('click', (e) => Controller.handleMapClick(e));
        this.canvas.addEventListener('contextmenu', (e) => Controller.handleMapRightClick(e));
    },

    /**
     * マップ画面の描画ループ（Canvas）
     * 拠点、ルート、ユニットを描画する。
     */
    renderMapLoop() {
        if (!this.ctx || Model.state.currentScreen !== 'map') return;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const ox = this.mapOffsetX || 0;
        const oy = this.mapOffsetY || 0;

        // ルート（道）の描画
        ctx.save();
        ctx.translate(ox, oy);
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
            ctx.font = 'bold 24px DotGothic16';
            ctx.textAlign = 'center';
            ctx.fillText(c.name, c.x, c.y + 60);
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
                ctx.font = '24px monospace';
                const yOffset = Math.sin(Date.now() / 200) * 5; // アニメーション
                ctx.fillText('▼', 0, -50 + yOffset);

                ctx.font = '24px DotGothic16';
                ctx.fillStyle = 'white';
                ctx.fillText(u.isMaster ? '★主軍' : `部隊 ${Model.state.mapUnits.filter(m => m.owner === u.owner).indexOf(u) + 1}`, 0, -75 + yOffset);
            }

            // 本体
            ctx.fillStyle = color;
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 10;
            ctx.font = '36px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(u.emoji, 0, 0);

            // HP Bar
            const hpPct = u.army.reduce((a, b) => a + b.currentHp, 0) / u.army.reduce((a, b) => a + b.hp, 0);
            ctx.fillStyle = 'red';
            ctx.fillRect(-20, 25, 40, 6);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(-20, 25, 40 * hpPct, 6);

            ctx.restore();
        });

        ctx.restore();
        requestAnimationFrame(() => this.renderMapLoop());
    },

    // -------------------------------------------------------------------------
    // 拠点メニュー (Base Menu)
    // -------------------------------------------------------------------------
    /**
     * 拠点メニューを表示する
     * @param {Object} castle - 拠点データ
     */
    toggleBaseMenu(castle = null) {
        if (castle) {
            this.renderBaseMenu(castle);
            document.getElementById('base-menu').classList.remove('hidden');
        }
    },

    /**
     * 拠点メニューをクリアして非表示にする
     */
    clearBaseMenu() {
        document.getElementById('base-menu').classList.add('hidden');
        document.getElementById('base-menu-title').innerText = "拠点を選択してください";
        document.getElementById('base-menu-content').innerHTML = "";
    },

    /**
     * 拠点メニューの内容を描画する
     * @param {Object} castle - 拠点データ
     * @param {string} [targetUnitId=null] - 表示対象の部隊ID
     */
    renderBaseMenu(castle, targetUnitId = null) {
        // Model.state と Data オブジェクトを使用
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

        document.getElementById('base-menu-title').innerHTML = UI.MenuTitle(castle.name, isHQ, ownerName, ownerEmoji, color, infoText);

        const createBtn = document.getElementById('btn-create-army');
        createBtn.disabled = castle.owner !== playerFaction.id || playerFaction.gold < Data.ARMY_COST || Model.state.mapUnits.filter(u => u.owner === playerFaction.id).length >= Data.MAX_ARMIES;
        createBtn.onclick = () => Controller.createNewArmy(castle);

        const menuContent = document.getElementById('base-menu-content');
        menuContent.innerHTML = '';

        // 部隊がいない場合のメッセージ
        const noMsg = document.getElementById('no-unit-message');
        if (allUnits.length === 0) {
            noMsg.classList.remove('hidden');
            return;
        }
        noMsg.classList.add('hidden');

        // 1. 部隊選択タブ
        const tabContainer = document.createElement('div');
        tabContainer.className = "flex gap-3 pb-1 mb-1";

        allUnits.forEach(u => {
            const isActive = (u === activeUnit);
            const isPlayerUnit = (u.owner === playerFaction.id);
            const faction = Model.state.factions.find(f => f.id === u.owner);

            const btn = UI.createTabButton(u, isActive, faction, () => {
                // 自軍部隊なら選択状態も更新
                if (isPlayerUnit) {
                    Model.state.selectedMapUnit = u;
                }
                this.renderBaseMenu(castle, u.id);
            });
            tabContainer.appendChild(btn);
        });
        menuContent.appendChild(tabContainer);

        // 2. 詳細表示 (activeUnitの内容)
        if (activeUnit) {
            const isPlayerUnit = (activeUnit.owner === playerFaction.id);

            let contentHTML = '';

            if (isPlayerUnit) {
                // 自軍: 雇用パネル + 部隊リスト
                const factionUnits = Data.FACTION_UNITS[playerFaction.master.id];
                let options = [...factionUnits];
                if (castle.uniqueUnit) {
                    const spec = Data.SPECIAL_UNITS[castle.uniqueUnit];
                    if (spec) options.push(spec);
                }

                const recruitHTML = UI.RecruitPanel(options, activeUnit, castle, (ut, activeUnit, castle) => {
                    const canAfford = playerFaction.gold >= ut.cost;
                    const isFull = activeUnit.army.length >= Data.MAX_UNITS;
                    return UI.RecruitItem(ut, activeUnit.id, castle.id, canAfford, isFull);
                });

                const unitsHTML = UI.UnitListPanel(activeUnit, castle, (u, i) => UI.UnitListItem(u, i, {
                    hp: `Controller.enhanceUnit('${activeUnit.id}', ${i}, 'hp', '${castle.id}')`,
                    atk: `Controller.enhanceUnit('${activeUnit.id}', ${i}, 'atk', '${castle.id}')`
                }));

                contentHTML = recruitHTML + unitsHTML;
            } else {
                // 敵軍: 部隊リストのみ
                contentHTML = UI.EnemyUnitListContainer(activeUnit.army.map((u, i) => UI.UnitListItem(u, i)).join(''));
            }

            // コンテンツのみ追加 (カードヘッダーなし)
            const contentWrapper = document.createElement('div');
            contentWrapper.innerHTML = contentHTML;
            menuContent.appendChild(contentWrapper);
        }
    },

    // -------------------------------------------------------------------------
    // バトル画面 (Grid & UI)
    // -------------------------------------------------------------------------
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
            indicator.innerText = styles.text;
            indicator.className = styles.className;
            if (endBtn) endBtn.disabled = styles.endBtnDisabled;

            const autoBtn = document.getElementById('battle-auto-btn');
            if (autoBtn) autoBtn.disabled = styles.endBtnDisabled;

            if (retreatBtn) retreatBtn.disabled = styles.retreatBtnDisabled;
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
        grid.style.width = `${(cols + 0.5) * hexSize}px`;
        grid.style.height = `${(rows * 0.75 + 0.25) * hexSize}px`;
    }
}; window.UI = UI; window.View = View;
