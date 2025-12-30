/**
 * UI: UIコンポーネント定義
 */
window.UI = {
    // 基本的なボタンスタイル
    Button: (label, onclick, type = 'primary', extraClass = '') => {
        const base = "px-10 py-4 border-2 transition-all font-bold shadow-xl hover:scale-105 active:translate-y-1 text-white disabled:opacity-50 disabled:cursor-not-allowed";
        const types = {
            primary: "bg-red-900 hover:bg-red-700 border-white text-3xl",
            secondary: "bg-blue-900 hover:bg-blue-700 border-white text-2xl",
            neutral: "bg-gray-900 hover:bg-gray-700 border-gray-500 text-xl",
            menu: "bg-green-900 hover:bg-green-700 border-white text-lg"
        };
        return `<button onclick="${onclick}" class="${base} ${types[type]} ${extraClass}">${label}</button>`;
    },

    // モーダル用ボタン (DOM要素を返す)
    createModalButton: (label, onclick, extraClass = '') => {
        const btn = document.createElement('button');
        btn.className = `px-10 py-4 bg-blue-700 hover:bg-blue-600 border-2 border-white text-2xl transition-colors font-bold rounded-lg shadow-lg text-white pointer-events-auto cursor-pointer ${extraClass}`;
        btn.innerText = label;
        btn.onclick = onclick;
        return btn;
    },

    // マスター選択カード
    MasterSelectionCard: (m) => {
        let colorName = 'blue';
        if (m.id === 'mage') colorName = 'green';
        if (m.id === 'demon') colorName = 'red';

        return `
        <div onclick="Controller.createGame('${m.id}')"
            class="group p-10 border-4 border-gray-700 hover:border-${colorName}-500 transition-all cursor-pointer rounded-2xl bg-gray-800/80 shadow-2xl hover:scale-105 flex flex-col items-center w-[300px] shrink-0 relative z-50 pointer-events-auto">
            <div class="text-9xl mb-8 transition-transform group-hover:scale-110">${m.emoji}</div>
            <div class="text-4xl font-bold mb-4 text-white group-hover:text-${colorName}-400">${m.name}</div>
            <p class="text-center text-gray-400">${m.desc}</p>
        </div>`;
    },

    // マップ選択カード
    MapSelectionCard: (t) => {
        let emoji = '🗺️';
        if (t.id === 'islands') emoji = '🏝️';
        if (t.id === 'ring') emoji = '⭕';

        return `
        <div onclick="Controller.selectMapAndNext('${t.id}')"
            class="group p-10 border-4 border-gray-700 hover:border-yellow-500 transition-all cursor-pointer rounded-2xl bg-gray-800/80 shadow-2xl hover:scale-105 flex flex-col items-center w-[300px] shrink-0 relative z-50 pointer-events-auto">
            <div class="text-9xl mb-8 transition-transform group-hover:scale-110">${emoji}</div>
            <div class="text-4xl font-bold mb-4 text-white group-hover:text-yellow-400">${t.name}</div>
            <p class="text-center text-gray-400">${t.desc}</p>
        </div>`;
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

    // メニュータイトル
    MenuTitle: (name, isHQ, ownerName, ownerEmoji, color, extraInfo = '') => {
        return `
            <span>${name}</span>
            <span class="ml-2">${isHQ ? '👑本拠地' : ''}</span>
            <span style="color:${color}" class="ml-2">${ownerEmoji}${ownerName}</span>
            ${extraInfo}
        `;
    },

    // メニューボーナス表示
    MenuBonus: (type, amount) => {
        if (type === 'bonus') {
            return `<span class="text-yellow-400 ml-4">💰ボーナス: ${amount}G</span>`;
        } else {
            return `<span class="text-green-400 ml-4">💰収入: ${amount}G</span>`;
        }
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
        <div class="flex justify-between items-center bg-white/5 p-1 rounded-lg border border-white/10 pointer-events-auto relative z-50 gap-3 ">
            <div class="flex items-center gap-3">
                <div class="text-4xl">${u.emoji}</div>
                <div class="font-bold text-xl">${u.name}</div>
                <div class="text-xl text-gray-300">
                    HP:${u.currentHp}/${u.hp} ATK:${u.atk} XP:${u.xp} RANK ${Data.RANKS[u.rank || 0]}</div>
            </div>
            ${enhanceActions ? `
            <div class="flex flex-row gap-1">
                <button onclick="${enhanceActions.hp}" class="font-bold bg-green-900 hover:bg-green-700 text-base px-2 py-1 rounded-lg border border-green-600 text-green-200 pointer-events-auto">HP+(100G)</button>
                <button onclick="${enhanceActions.atk}" class="font-bold bg-red-900 hover:bg-red-700 text-base px-2 py-1 rounded-lg border border-red-600 text-red-200 pointer-events-auto">ATK+(150G)</button>
            </div>` : ''}
        </div>`;
    },

    // 部隊選択タブボタン (Elementを返す)
    createTabButton: (unit, isActive, faction, onclick) => {
        const color = faction ? faction.color : '#aaaaaa';
        const count = unit.army.length;
        const max = Data.MAX_UNITS;

        const btn = document.createElement('button');
        btn.className = `flex-shrink-0 w-20 h-16 border-2 rounded-xl flex flex-col items-center justify-center transition-all shadow-lg relative ${isActive ? 'bg-gray-700/80 border-white scale-105 z-10' : 'bg-gray-900/60 border-gray-700 hover:bg-gray-800 opacity-70'} relative z-50 pointer-events-auto`;
        btn.innerHTML = `
            <div class="text-xl font-bold uppercase truncate w-full text-center px-1 mb-1" style="color:${color}">${unit.isMaster ? '主軍' : '部隊'}</div>
            <div class="text-xl font-mono font-bold ${count >= max ? 'text-red-400' : 'text-cyan-400'}">${count}/${max}</div>
            ${isActive ? '<div class="absolute -bottom-2 text-yellow-500 text-xs">▲</div>' : ''}
        `;
        btn.onclick = onclick;
        return btn;
    },

    // ユニット雇用パネル
    // ユニット雇用アイテム
    RecruitItem: (ut, activeUnitId, castleId, canAfford, isFull) => {
        return `
            <div class="recruit-item flex justify-between items-center bg-white/5 p-1 rounded-lg border border-white/10 pointer-events-auto relative z-50 gap-3">
                <div class="flex items-center gap-3">
                    <div class="text-4xl">${ut.emoji}</div>
                    <div class="flex gap-3">
                        <div class="text-xl font-bold text-white">${ut.name}
                        </div>
                        <div class="text-xl text-gray-300">
                            HP:${ut.hp} / ATK:${ut.atk} / RNG:${ut.range} / MOVE:${ut.move}</div>
                    </div>
                </div>
                <button onclick="event.stopPropagation(); Controller.recruitUnit('${activeUnitId}', '${ut.id}', '${castleId}')" 
                    class="px-5 py-1 min-w-[100px] bg-blue-900 border border-blue-400 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-bold shadow-md active:translate-y-1 text-white rounded-lg" 
                    ${!canAfford || isFull ? 'disabled' : ''}>${isFull ? "満員" : `${ut.cost}G`}</button>
            </div>`;
    },

    RecruitPanel: (options, activeUnit, castle, recruitItemHTML) => {
        return `
            <p class="text-xl text-gray-400 mb-2 mt-2 font-bold uppercase tracking-widest text-center">ユニット雇用</p>
            <div class="flex flex-col gap-3">
                ${options.map(ut => recruitItemHTML(ut, activeUnit, castle)).join('')}
            </div>`;
    },

    // ユニットリストパネル
    UnitListPanel: (unit, castle, unitListItemHTML) => {
        return `
            <p class="text-xl text-gray-400 mb-2 mt-2 font-bold uppercase tracking-widest text-center">部隊編成・強化</p>
            <div class="flex flex-col gap-3">
                ${unit.army.map((u, i) => unitListItemHTML(u, i)).join('')}
            </div>`;
    },

    // バトル用ヘックス
    BattleHex: (x, y, r, c, onClick) => {
        const div = document.createElement('div');
        div.className = "absolute w-24 h-24 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors clip-hex z-50 pointer-events-auto";
        div.style.left = `${x}px`;
        div.style.top = `${y}px`;
        div.style.clipPath = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";
        div.style.backgroundColor = UI.BattleStyles.gridBase;

        div.addEventListener('click', (e) => {
            e.stopPropagation();
            if (onClick) onClick(r, c);
        });
        return div;
    },

    // バトルユニット表示
    BattleUnitHTML: (u, rankIndex = 0, hpPct = 1) => {
        return `
            <div class="flex items-center gap-1 mb-1">
                <span class="text-4xl shadow-black drop-shadow-md">${u.emoji}</span>
                <span class="text-[10px] text-yellow-500 font-bold bg-black/50 px-1 rounded">${Data.RANKS[rankIndex]}</span>
            </div>
            <div class="w-12 h-1.5 bg-gray-900 border border-gray-600 rounded-full overflow-hidden shadow-sm">
                <div class="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-300" style="width:${Math.max(0, hpPct * 100)}%"></div>
            </div>`;
    },

    // 敵軍部隊リストコンテナ
    EnemyUnitListContainer: (content) => {
        return `<div class="flex flex-col gap-3">${content}</div>`;
    },

    // ターン表示スタイル
    TurnIndicatorStyles: (turn) => {
        if (turn === 'player') {
            return {
                text: "自軍ターン",
                className: "mb-4 text-3xl font-black tracking-widest text-yellow-500 animate-pulse bg-black/50 px-4 py-1 rounded shadow-lg border border-yellow-500/30",
                endBtnDisabled: false,
                retreatBtnDisabled: false
            };
        } else {
            return {
                text: "敵軍ターン",
                className: "mb-4 text-3xl font-black tracking-widest text-red-500 animate-pulse bg-black/50 px-4 py-1 rounded shadow-lg border border-red-500/30",
                endBtnDisabled: true,
                retreatBtnDisabled: true
            };
        }
    },

    // エンディング画面スタイル
    EndingStyles: (isWin) => {
        if (isWin) {
            return {
                titleText: "完全制覇",
                titleClass: "text-8xl font-bold mb-12 text-yellow-500 uppercase tracking-tighter drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]",
                bodyText: "敵勢力の拠点をすべて制圧し、バハムート大陸に真の平和が訪れた。あなたの名は伝説となり、永く語り継がれるだろう。"
            };
        } else {
            return {
                titleText: "敗北...",
                titleClass: "text-8xl font-bold mb-12 text-red-600 uppercase tracking-tighter drop-shadow-[0_0_30px_rgba(220,38,38,0.5)]",
                bodyText: "全ての拠点を失い、希望は潰えた。大陸の歴史は勝者によって書き換えられ、あなたの名は闇へと消えていく..."
            };
        }
    },

    // バトル画面スタイル
    BattleStyles: {
        gridBase: "rgba(30, 41, 59, 0.6)",
        gridMove: "rgba(30, 58, 138, 0.6)",
        gridAttack: "rgba(127, 29, 29, 0.6)",
        gridSelectedRing: ["ring-4", "ring-white"],
        movedUnitOpacity: "0.4"
    }
};
