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
    }
};
