/**
 * VIEW: 表示制御
 */
window.UI = {
    // 基本的なボタンスタイル
    Button: (label, onclick, type = 'primary', extraClass = '') => {
        const base = "px-10 py-4 border-2 transition-all font-bold shadow-xl hover:scale-105 active:translate-y-1 text-white disabled:opacity-50 disabled:cursor-not-allowed";
        const types = {
            primary: "bg-red-900 hover:bg-red-700 border-white text-3xl",
            secondary: "bg-blue-900 hover:bg-blue-700 border-white text-2xl",
            neutral: "bg-gray-900 hover:bg-gray-700 border-gray-500 text-xl",
            battle: "bg-blue-800 hover:bg-blue-600 border-white text-2xl rounded-lg",
            action: "bg-purple-900 hover:bg-purple-700 border-purple-400 text-xl",
            menu: "bg-green-900 hover:bg-green-700 border-white text-lg"
        };
        return `<button onclick="${onclick}" class="${base} ${types[type]} ${extraClass}">${label}</button>`;
    },

    // 選択用カード（マップ用・マスター用共通）
    Card: (title, desc, icon, onclick, subtext = '', extraClass = '') => {
        return `
            <div onclick="${onclick}" 
                 class="group p-10 border-4 border-gray-700 hover:border-yellow-500 transition-all cursor-pointer rounded-2xl bg-gray-900/80 shadow-2xl hover:scale-105 flex flex-col items-center w-[400px] shrink-0 relative z-50 pointer-events-auto ${extraClass}">
                ${icon ? `<div class="text-9xl mb-8 transition-transform group-hover:scale-110">${icon}</div>` : ''}
                <div class="text-4xl font-bold mb-4 text-white text-center group-hover:text-yellow-500 transition-colors">${title}</div>
                <p class="text-xl text-gray-400 text-center leading-relaxed mb-6">${desc}</p>
                ${subtext ? `<div class="text-yellow-500 font-bold uppercase tracking-widest text-sm animate-pulse">${subtext}</div>` : ''}
            </div>`;
    },

    // 各種パネル
    Panel: (content, extraClass = '') => {
        return `<div class="bg-gray-800/80 border-2 border-gray-700 p-8 rounded-2xl shadow-2xl mb-4 text-white ${extraClass}">${content}</div>`;
    },

    // 部隊カード (BaseMenu内などで使用)
    ArmyCard: (unit, isPlayer, factionName, extraContent = '') => {
        const colorClass = isPlayer ? 'text-blue-300' : 'text-red-400';
        const bgClass = isPlayer ? 'bg-gray-800/80 border-gray-700' : 'bg-red-900/20 border-red-700/50';
        return `
            <div class="${bgClass} border-2 p-8 rounded-2xl shadow-2xl mb-4 text-white">
                <div class="flex justify-between items-center mb-8 border-b border-gray-600 pb-4">
                    <div class="flex items-center gap-6">
                        <span class="text-6xl">${unit.emoji}</span>
                        <span class="text-3xl font-bold ${colorClass}">${factionName}</span>
                    </div>
                    <span class="text-xl font-bold font-mono">構成: ${unit.army.length} / ${Data.MAX_UNITS}</span>
                </div>
                ${extraContent}
            </div>`;
    },

    // ユニット詳細行
    UnitListItem: (u, i, enhanceActions = null) => {
        return `
            <div class="bg-gray-800/80 border border-gray-600 rounded p-2 flex items-center gap-3 relative z-50 pointer-events-auto">
                <div class="text-2xl">${u.emoji}</div>
                <div class="flex-1">
                    <div class="flex justify-between items-baseline mb-1">
                        <span class="font-bold text-sm">${u.name}</span>
                        <span class="text-xs text-gray-400">RANK ${Data.RANKS[u.rank || 0]}</span>
                    </div>
                    <div class="flex items-center gap-2 text-xs font-mono text-gray-300">
                        <span>HP:${u.currentHp}/${u.hp}</span>
                        <span>ATK:${u.atk}</span>
                    </div>
                </div>
                ${enhanceActions ? `
                <div class="flex flex-col gap-1">
                    <button onclick="${enhanceActions.hp}" class="bg-green-900 hover:bg-green-700 text-[10px] px-2 py-1 rounded border border-green-600 text-green-200 pointer-events-auto">HP+10 (100G)</button>
                    <button onclick="${enhanceActions.atk}" class="bg-red-900 hover:bg-red-700 text-[10px] px-2 py-1 rounded border border-red-600 text-red-200 pointer-events-auto">ATK+3 (150G)</button>
                </div>` : ''}
            </div>`;
    },

    // 部隊選択タブボタン (Elementを返す)
    createTabButton: (unit, isActive, faction, onclick) => {
        const color = faction ? faction.color : '#aaaaaa';
        const count = unit.army.length;
        const max = Data.MAX_UNITS;

        const btn = document.createElement('button');
        btn.className = `flex-shrink-0 w-20 h-24 border-2 rounded-xl flex flex-col items-center justify-center transition-all shadow-lg relative ${isActive ? 'bg-gray-700/80 border-white scale-105 z-10' : 'bg-gray-900/60 border-gray-700 hover:bg-gray-800 opacity-70'} relative z-50 pointer-events-auto`;
        btn.innerHTML = `
            <div class="text-3xl mb-1">${unit.emoji}</div>
            <div class="text-[10px] font-bold uppercase truncate w-full text-center px-1 mb-1" style="color:${color}">${unit.isMaster ? '主軍' : '部隊'}</div>
            <div class="text-[10px] font-mono font-bold ${count >= max ? 'text-red-400' : 'text-cyan-400'}">${count}/${max}</div>
            ${isActive ? '<div class="absolute -bottom-2 text-yellow-500 text-xs">▲</div>' : ''}
        `;
        btn.onclick = onclick;
        return btn;
    },

    // ユニット雇用パネル
    RecruitPanel: (options, activeUnit, castle, recruitItemHTML) => {
        return `
            <div class="bg-black/40 p-4 rounded-xl border border-blue-900/30 mb-6">
                <p class="text-xl text-blue-400 mb-4 font-bold border-b border-blue-900/50 pb-2 uppercase tracking-widest text-center">ユニット雇用</p>
                <div class="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto custom-scrollbar p-1">
                    ${options.map(ut => recruitItemHTML(ut, activeUnit, castle)).join('')}
                </div>
            </div>`;
    },

    // ユニットリストパネル
    UnitListPanel: (unit, castle, unitListItemCallback) => {
        return `
            <p class="text-sm text-gray-400 mb-2 font-bold uppercase tracking-widest text-center">部隊編成・強化</p>
            <div class="flex flex-col gap-3">
                ${unit.army.map((u, i) => unitListItemCallback(u, i, castle)).join('')}
            </div>`;
    }
};

window.View = {
    canvas: null, ctx: null,
    Components: UI,
    mapOffsetX: 0,
    mapOffsetY: 0,

    changeScreen(screenId) {
        document.querySelectorAll('div[id^="screen-"]').forEach(el => el.classList.add('hidden'));
        const target = document.getElementById(`screen-${screenId}`);
        if (target) target.classList.remove('hidden');
        Model.state.currentScreen = screenId;

        const turnIndicator = document.getElementById('turn-indicator');
        const player = Model.state.factions.find(f => f.isPlayer);
        const isPlayerTurn = Model.state.strategicTurn === 'player';

        if (screenId === 'map') {
            turnIndicator.classList.remove('hidden'); // マップ画面ではヘッダーに表示する
            this.initCanvas();
            const endBtn = document.getElementById('btn-end-strategic-turn');
            const saveLoad = document.getElementById('save-load-group');
            const menu = document.getElementById('base-menu');
            menu.classList.add('hidden'); // 初期状態ではメニューを隠す
            this.clearBaseMenu();

            if (isPlayerTurn) {
                endBtn.classList.remove('hidden');
                saveLoad.classList.remove('hidden');
            } else {
                endBtn.classList.add('hidden');
                saveLoad.classList.add('hidden');
            }
        } else if (screenId === 'battle') {
            turnIndicator.classList.add('hidden');
        } else {
            turnIndicator.classList.add('hidden');
        }
    },

    toggleSettings() {
        const el = document.getElementById('screen-settings');
        if (el.classList.contains('hidden')) {
            this.renderSettings();
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    },

    renderSettings() {
        const list = document.getElementById('map-select-list');
        list.innerHTML = Data.MAP_TEMPLATES.map(t => `
            <div onclick="Controller.selectMapAndNext('${t.id}')" 
                    class="p-6 border-2 transition-all cursor-pointer rounded-xl ${Model.state.selectedMapId === t.id ? 'border-yellow-500 bg-yellow-900/20' : 'border-gray-700 hover:border-gray-500 bg-black/40'} relative z-50 pointer-events-auto">
                <div class="text-2xl font-bold mb-2 ${Model.state.selectedMapId === t.id ? 'text-yellow-500' : 'text-white'}">${t.name}</div>
                <p class="text-sm text-gray-400">${t.desc}</p>
            </div>
        `).join('');
    },

    renderMapFlow() {
        const list = document.getElementById('map-flow-list');
        list.innerHTML = Data.MAP_TEMPLATES.map(t =>
            UI.Card(t.name, t.desc, '', `Controller.selectMapAndNext('${t.id}')`, 'Click to Select')
        ).join('');
    },

    showMessage(text) {
        const box = document.getElementById('message-box');
        const txt = document.getElementById('message-text');
        txt.innerText = text;
        box.style.opacity = '1';
        if (window.msgTimer) clearTimeout(window.msgTimer);
        window.msgTimer = setTimeout(() => { box.style.opacity = '0'; }, 3500);
    },

    openModal(title, body, buttons) {
        const modal = document.getElementById('modal-layer');
        document.getElementById('modal-title').innerText = title;
        document.getElementById('modal-body').innerText = body;
        const footer = document.getElementById('modal-footer');
        footer.innerHTML = '';
        buttons.forEach(btn => {
            const b = document.createElement('button');
            b.className = "px-10 py-4 bg-blue-700 hover:bg-blue-600 border-2 border-white text-2xl transition-colors font-bold rounded-lg shadow-lg text-white pointer-events-auto cursor-pointer";
            b.innerText = btn.label;
            b.onclick = () => { modal.classList.add('hidden'); btn.action(); };
            footer.appendChild(b);
        });
        modal.classList.remove('hidden');
    },

    showEnding(isWin) {
        const screen = document.getElementById('screen-ending');
        const title = document.getElementById('ending-title');
        const body = document.getElementById('ending-body');

        if (isWin) {
            title.innerText = "VICTORY";
            title.className = "text-8xl font-bold mb-12 text-yellow-500 uppercase tracking-tighter drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]";
            body.innerText = "敵勢力の拠点をすべて制圧し、バハムート大陸に真の平和が訪れた。あなたの名は伝説となり、永く語り継がれるだろう。";
        } else {
            title.innerText = "DEFEAT";
            title.className = "text-8xl font-bold mb-12 text-red-600 uppercase tracking-tighter drop-shadow-[0_0_30px_rgba(220,38,38,0.5)]";
            body.innerText = "全ての拠点を失い、希望は潰えた。大陸の歴史は勝者によって書き換えられ、あなたの名は闇へと消えていく...";
        }

        this.changeScreen('ending');
    },

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
            const padding = 100;
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

        // Event Listeners for Map Interaction
        this.canvas.addEventListener('click', (e) => Controller.handleMapClick(e));
        this.canvas.addEventListener('contextmenu', (e) => Controller.handleMapRightClick(e));
    },

    renderMapLoop() {
        if (!this.ctx || Model.state.currentScreen !== 'map') return;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const ox = this.mapOffsetX || 0;
        const oy = this.mapOffsetY || 0;

        // Path connections
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

        // Castles
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
            ctx.font = 'bold 16px DotGothic16';
            ctx.textAlign = 'center';
            ctx.fillText(c.name, c.x, c.y + 45);
        });

        // Units
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
                ctx.font = '16px monospace';
                const yOffset = Math.sin(Date.now() / 200) * 5; // アニメーション
                ctx.fillText('▼', 0, -50 + yOffset);

                ctx.font = 'bold 12px DotGothic16';
                ctx.fillStyle = 'white';
                ctx.fillText(u.isMaster ? '★主軍' : `部隊 ${Model.state.mapUnits.filter(m => m.owner === u.owner).indexOf(u) + 1}`, 0, -65 + yOffset);
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

    toggleBaseMenu(castle = null) {
        if (castle) {
            this.renderBaseMenu(castle);
            document.getElementById('base-menu').classList.remove('hidden');
        }
    },

    clearBaseMenu() {
        document.getElementById('base-menu').classList.add('hidden');
        document.getElementById('base-menu-title').innerText = "拠点を選択してください";
        document.getElementById('base-menu-content').innerHTML = "";
    },

    renderBaseMenu(castle, targetUnitId = null) {
        // Model.state と Data オブジェクトを使用
        const castleOwner = Model.state.factions.find(f => f.id === castle.owner);
        const playerFaction = Model.state.factions.find(f => f.isPlayer);

        // 1. 部隊情報の取得とアクティブ部隊の決定
        const allUnits = Model.state.mapUnits.filter(u => Math.hypot(u.x - castle.x, u.y - castle.y) < 45);
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
        let titleHTML = castle.name + (isHQ ? ' <span class="bg-yellow-600 text-white text-sm px-3 py-1 rounded-full align-middle ml-4 border border-yellow-400 font-bold shadow-lg">👑本拠地</span>' : '');

        const faction = Model.state.factions.find(f => f.id === castle.owner);
        const color = faction ? faction.color : '#fff';
        const ownerName = faction ? faction.master.name : '中立';
        const ownerEmoji = faction ? faction.master.emoji : '';

        titleHTML += `
                <span class="ml-6 inline-flex items-center gap-3 align-middle bg-gray-900/50 px-4 py-1 rounded-lg border border-gray-600 shadow-inner">
            <span class="text-3xl">${ownerEmoji}</span>
                    <span class="text-lg font-bold" style="color:${color}">${ownerName}</span>
                </span>
            `;

        if (activeUnit) {
            // タイトルへの部隊情報追記は削除 (ユーザー要望)
        }
        document.getElementById('base-menu-title').innerHTML = titleHTML;

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
        tabContainer.className = "flex gap-3 overflow-x-auto pb-2 mb-2 custom-scrollbar";

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
            const faction = Model.state.factions.find(f => f.id === activeUnit.owner);

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
                    return `
                        <div onclick="View.showMessage('【${ut.name}】 HP:${ut.hp} / ATK:${ut.atk} / RNG:${ut.range} / MOVE:${ut.move}')" 
                             class="recruit-item flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/10 cursor-pointer transition-colors relative z-50 pointer-events-auto hover:bg-white/10">
                            <div class="flex items-center gap-3">
                                <span class="text-4xl shadow-md p-1 bg-black/20 rounded">${ut.emoji}</span>
                                <div>
                                    <div class="text-lg font-bold text-white">${ut.name}</div>
                                    <div class="text-xs text-blue-400 font-bold uppercase">スペック確認</div>
                                </div>
                            </div>
                            <button onclick="event.stopPropagation(); Controller.recruitUnit('${activeUnit.id}', '${ut.id}', '${castle.id}')" 
                                class="px-5 py-2 min-w-[100px] bg-blue-900 border border-blue-400 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-bold shadow-md active:translate-y-1 text-white" 
                                ${!canAfford || isFull ? 'disabled' : ''}>${isFull ? "満員" : `${ut.cost}G`}</button>
                        </div>`;
                });

                const unitsHTML = UI.UnitListPanel(activeUnit, castle, (u, i, castle) => UI.UnitListItem(u, i, {
                    hp: `Controller.enhanceUnit('${activeUnit.id}', ${i}, 'hp', '${castle.id}')`,
                    atk: `Controller.enhanceUnit('${activeUnit.id}', ${i}, 'atk', '${castle.id}')`
                }));

                contentHTML = recruitHTML + unitsHTML;
            } else {
                // 敵軍: 部隊リストのみ
                contentHTML = `<div class="flex flex-col gap-3">${activeUnit.army.map((u, i) => UI.UnitListItem(u, i)).join('')}</div>`;
            }

            // コンテンツのみ追加 (カードヘッダーなし)
            const contentWrapper = document.createElement('div');
            contentWrapper.innerHTML = contentHTML;
            menuContent.appendChild(contentWrapper);
        }
    },

    recruitItemHTML(ut, unit, castle) {
        const playerFaction = Model.state.factions.find(f => f.isPlayer);
        const can = playerFaction.gold >= ut.cost;
        const isFull = unit.army.length >= Data.MAX_UNITS;
        const dis = isFull || !can || castle.owner !== playerFaction.id;
        const lbl = isFull ? "満員" : `${ut.cost}G`;
        return `<div class="recruit-item flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10 cursor-pointer transition-colors" 
            onclick="View.showMessage('【${ut.name}】 HP:${ut.hp} / ATK:${ut.atk} / RNG:${ut.range} / MOVE:${ut.move}')">
            <div class="flex items-center gap-6">
                <span class="text-6xl">${ut.emoji}</span>
                <div>
                    <div class="text-3xl font-bold text-white">${ut.name}</div>
                    <div class="text-sm text-blue-400 font-bold uppercase font-mono">スペックを表示 (Click)</div>
                </div>
            </div>
            <button onclick="event.stopPropagation(); Controller.recruitUnit('${unit.id}', '${ut.id}', '${castle.id}')" 
                class="px-10 py-4 bg-blue-900 border-2 border-blue-400 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-2xl font-bold shadow-2xl active:translate-y-1 text-white" 
                ${dis ? 'disabled' : ''}>${lbl}</button>
        </div>`;
    },

    // バトル画面関連
    initBattleGrid() {
        // Model側でGridデータを生成済みであることを前提に、ViewがDOM生成を行う
        // ここではController.initBattleGridがDataを生成して呼び出した後、あるいはLoadGame後に呼ばれる
        // GridデータのDOM参照が切れている場合（Load直後など）の再構築も兼ねる

        const grid = document.getElementById('battle-grid');
        grid.innerHTML = '';

        // 既存のgridデータがあるか確認
        if (!Model.state.battle.grid || Model.state.battle.grid.length === 0) {
            // データがなければControllerが作るべきだが、View主導で再描画するなら空のまま帰るか、
            // 空コンテナを表示する
            return;
        }

        // 既存データの再描画
        View.renderBattleGridCore(Model.state.battle.grid);
        View.updateBattleUI();
    },

    updateBattleUI() {
        const b = Model.state.battle;
        const grid = document.getElementById('battle-grid');
        // グリッドが初期化されていない場合は何もしない
        if (!b.grid || b.grid.length === 0) return;

        b.grid.forEach(cell => {
            if (cell.el) {
                cell.el.innerHTML = '';
                cell.el.classList.remove('ring-4', 'ring-white');
                cell.el.style.backgroundColor = "rgba(30, 41, 59, 0.6)"; // Reset to base color
            }
        });
        b.units.forEach(u => {
            const cell = b.grid.find(g => g.r === u.r && g.c === u.c);
            if (cell && cell.el) {
                const div = document.createElement('div'); div.className = "relative flex flex-col items-center justify-center pointer-events-none w-full h-full";
                div.innerHTML = `
                    <div class="flex items-center gap-1 mb-1">
                        <span class="text-4xl shadow-black drop-shadow-md">${u.emoji}</span>
                        <span class="text-[10px] text-yellow-500 font-bold bg-black/50 px-1 rounded">${Data.RANKS[u.rank || 0]}</span>
                    </div>
                    <div class="w-12 h-1.5 bg-gray-900 border border-gray-600 rounded-full overflow-hidden shadow-sm">
                        <div class="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-300" style="width:${Math.max(0, (u.currentHp / u.hp) * 100)}%"></div>
                    </div>`;
                if (b.movedUnits.has(u)) div.style.opacity = "0.4";
                cell.el.appendChild(div);
            }
        });
        if (b.selectedUnit) {
            const s = b.selectedUnit;
            const sc = b.grid.find(g => g.r === s.r && g.c === s.c);
            if (sc && sc.el) sc.el.classList.add('ring-4', 'ring-white');
            b.grid.forEach(cell => {
                const d = Model.getHexDist(s.r, s.c, cell.r, cell.c);
                if (cell.el) {
                    if (!b.tempMoved && d > 0 && d <= s.move && !b.units.some(u => u.r === cell.r && u.c === cell.c)) {
                        cell.el.style.backgroundColor = "rgba(30, 58, 138, 0.6)"; // Blue
                    }
                    if (!(s.range > 1 && b.tempMoved) && d > 0 && d <= s.range) {
                        // 赤（攻撃範囲）は青（移動範囲）を上書きするかもしれないが、今回は別々に表示
                        // もし射程内なら赤優先
                        cell.el.style.backgroundColor = "rgba(127, 29, 29, 0.6)"; // Red
                    }
                }
            });
        }

        // Turn Indicator & Buttons
        const indicator = document.getElementById('battle-turn-indicator');
        const endBtn = document.getElementById('battle-end-turn-btn');
        const retreatBtn = document.getElementById('battle-retreat-btn');

        if (indicator) {
            if (b.turn === 'player') {
                indicator.innerText = "PLAYER TURN";
                indicator.className = "mb-4 text-3xl font-black tracking-widest text-yellow-500 animate-pulse bg-black/50 px-4 py-1 rounded shadow-lg border border-yellow-500/30";
                if (endBtn) endBtn.disabled = false;
                if (retreatBtn) retreatBtn.disabled = false;
            } else {
                indicator.innerText = "ENEMY TURN";
                indicator.className = "mb-4 text-3xl font-black tracking-widest text-red-500 animate-pulse bg-black/50 px-4 py-1 rounded shadow-lg border border-red-500/30";
                if (endBtn) endBtn.disabled = true;
                if (retreatBtn) retreatBtn.disabled = true;
            }
        }
    },

    // バトルのグリッド描画用のヘルパー (Controllerから分割)
    drawHex(x, y, r, c) {
        const div = document.createElement('div');
        div.className = "absolute w-24 h-24 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors clip-hex z-50 pointer-events-auto";
        div.style.left = `${x}px`;
        div.style.top = `${y}px`;
        // クリップパスはCSSで定義するか、スタイルで直接書く
        div.style.clipPath = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";
        div.style.backgroundColor = "rgba(30, 41, 59, 0.6)"; // slate-800/60
        div.addEventListener('click', (e) => {
            console.log(`Hex Clicked: ${r}, ${c}`);
            e.stopPropagation();
            if (window.Controller) {
                window.Controller.handleBattleClick(r, c);
            }
        });
        return div;
    },

    // バトルの初期グリッド構築 (Controllerから移動)
    renderBattleGridCore(gridData) {
        const grid = document.getElementById('battle-grid');
        grid.innerHTML = '';

        gridData.forEach(cell => {
            const r = cell.r; const c = cell.c;
            // ヘクス配置計算 (size=50)
            const size = 50;
            // HexLayout: q=c, r=r
            // pixel_x = size * (3/2 * q)
            // pixel_y = size * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r)
            // しかしController.initBattleGridで使われていたロジック（rが奇数でズレる）とは異なる可能性がある
            // ここでは一般的な奇数行ズレ配置（pointy topped）を採用する場合:
            // x = size * sqrt(3) * (c + 0.5 * (r&1))
            // y = size * 3/2 * r

            // 以前のController.initBattleGridのロジック:
            // const x = c * hexSize + (r % 2 ? hexSize / 2 : 0);
            // const y = r * hexSize * 0.75;
            const hexSize = 90;
            const px = c * hexSize + (r % 2 ? hexSize / 2 : 0);
            const py = r * hexSize * 0.75;

            const el = this.drawHex(px, py, r, c);
            cell.el = el;
            grid.appendChild(el);
        });

        // コンテナサイズ調整
        const cols = 7; const rows = 6; const hexSize = 90;
        grid.style.width = `${(cols + 0.5) * hexSize}px`;
        grid.style.height = `${(rows * 0.75 + 0.25) * hexSize}px`;
    }

};
window.UI = UI; window.View = View;
