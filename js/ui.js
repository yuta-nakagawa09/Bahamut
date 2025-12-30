/**
 * UI: UIコンポーネント定義
 */
window.UI = {
    // 基本的なボタンスタイル
    // 基本的なボタンスタイル
    Button: (label, onclick, type = 'primary', extraClass = '') => {
        // base class `btn-base` defined in css
        // specific types defined in css: `btn-primary`, `btn-secondary`, etc.
        return `<button onclick="${onclick}" class="btn-base btn-${type} ${extraClass}">${label}</button>`;
    },

    // モーダル用ボタン (DOM要素を返す)
    createModalButton: (label, onclick, extraClass = '') => {
        const btn = document.createElement('button');
        // `btn-modal` defined in css
        btn.className = `btn-modal ${extraClass}`;
        btn.innerText = label;
        btn.onclick = onclick;
        return btn;
    },

    // マスター選択カード
    MasterSelectionCard: (m) => {
        let colorName = 'blue';
        if (m.id === 'mage') colorName = 'green';
        if (m.id === 'demon') colorName = 'red';

        // NOTE: Dynamic border colors (hover:border-${colorName}-500) and text colors are still easier in JS/Tailwind unless we make specific classes for each master.
        // For separation, we use `card-base` but keep color utility classes for dynamic parts.
        // `card-base` handles layout, basic border, bg, shadow.
        return `
        <div onclick="Controller.createGame('${m.id}')"
            class="card-base w-[300px] hover:border-${colorName}-500 ${extraClass = ''}">
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
            class="card-base w-[300px] hover:border-yellow-500">
            <div class="text-9xl mb-8 transition-transform group-hover:scale-110">${emoji}</div>
            <div class="text-4xl font-bold mb-4 text-white group-hover:text-yellow-400">${t.name}</div>
            <p class="text-center text-gray-400">${t.desc}</p>
        </div>`;
    },

    // 選択用カード（マップ用・マスター用共通）
    Card: (title, desc, icon, onclick, subtext = '', extraClass = '') => {
        return `
            <div onclick="${onclick}" 
                 class="card-base w-[400px] hover:border-yellow-500 ${extraClass}">
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
            // .text-bonus defined in css
            return `<span class="text-bonus">💰ボーナス: ${amount}G</span>`;
        } else {
            // .text-income defined in css
            return `<span class="text-income">💰収入: ${amount}G</span>`;
        }
    },

    // 各種パネル
    Panel: (content, extraClass = '') => {
        // .panel-base defined in css
        return `<div class="panel-base ${extraClass}">${content}</div>`;
    },

    // 部隊カード (BaseMenu内などで使用)
    ArmyCard: (unit, isPlayer, factionName, extraContent = '') => {
        const colorClass = isPlayer ? 'text-blue-300' : 'text-red-400';
        // .army-card-base, .army-card-player, .army-card-enemy defined in css
        const bgClass = isPlayer ? 'army-card-player' : 'army-card-enemy';
        return `
            <div class="army-card-base ${bgClass}">
                <div class="army-card-header">
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
        // .unit-list-item, .unit-info-group, .unit-details, .btn-enhance-hp, .btn-enhance-atk
        return `
        <div class="unit-list-item">
            <div class="unit-info-group">
                <div class="text-4xl">${u.emoji}</div>
                <div class="font-bold text-xl">${u.name}</div>
                <div class="unit-details">
                    HP:${u.currentHp}/${u.hp} ATK:${u.atk} XP:${u.xp} RANK ${Data.RANKS[u.rank || 0]}</div>
            </div>
            ${enhanceActions ? `
            <div class="flex flex-row gap-1">
                <button onclick="${enhanceActions.hp}" class="btn-enhance-hp">HP+(100G)</button>
                <button onclick="${enhanceActions.atk}" class="btn-enhance-atk">ATK+(150G)</button>
            </div>` : ''}
        </div>`;
    },

    // 部隊選択タブボタン (Elementを返す)
    createTabButton: (unit, isActive, faction, onclick) => {
        const color = faction ? faction.color : '#aaaaaa';
        const count = unit.army.length;
        const max = Data.MAX_UNITS;

        const btn = document.createElement('button');
        // .tab-btn, .tab-btn-active, .tab-btn-inactive
        const stateClass = isActive ? 'tab-btn-active' : 'tab-btn-inactive';
        btn.className = `tab-btn ${stateClass}`;

        btn.innerHTML = `
            <div class="text-xl font-bold uppercase truncate w-full text-center px-1 mb-1" style="color:${color}">${unit.isMaster ? '主軍' : '部隊'}</div>
            <div class="text-xl font-mono font-bold ${count >= max ? 'text-red-400' : 'text-cyan-400'}">${count}/${max}</div>
            ${isActive ? '<div class="tab-active-indicator">▲</div>' : ''}
        `;
        btn.onclick = onclick;
        return btn;
    },

    // ユニット雇用パネル
    // ユニット雇用アイテム
    RecruitItem: (ut, activeUnitId, castleId, canAfford, isFull) => {
        // .recruit-item, .btn-buy
        return `
            <div class="recruit-item">
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
                    class="btn-buy" 
                    ${!canAfford || isFull ? 'disabled' : ''}>${isFull ? "満員" : `${ut.cost}G`}</button>
            </div>`;
    },

    RecruitPanel: (options, activeUnit, castle, recruitItemHTML) => {
        // .panel-title
        return `
            <p class="panel-title">ユニット雇用</p>
            <div class="flex flex-col gap-3">
                ${options.map(ut => recruitItemHTML(ut, activeUnit, castle)).join('')}
            </div>`;
    },

    // ユニットリストパネル
    UnitListPanel: (unit, castle, unitListItemHTML) => {
        // .panel-title
        return `
            <p class="panel-title">部隊編成・強化</p>
            <div class="flex flex-col gap-3">
                ${unit.army.map((u, i) => unitListItemHTML(u, i)).join('')}
            </div>`;
    },

    // バトル用ヘックス
    BattleHex: (x, y, r, c, onClick) => {
        const div = document.createElement('div');
        // .battle-hex, .clip-hex
        div.className = "battle-hex clip-hex";
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
        // .battle-unit-rank, .battle-unit-bar-container, .battle-unit-bar-fill
        return `
            <div class="flex items-center gap-1 mb-1">
                <span class="text-4xl shadow-black drop-shadow-md">${u.emoji}</span>
                <span class="battle-unit-rank">${Data.RANKS[rankIndex]}</span>
            </div>
            <div class="battle-unit-bar-container">
                <div class="battle-unit-bar-fill" style="width:${Math.max(0, hpPct * 100)}%"></div>
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
                // .turn-indicator-player
                className: "turn-indicator-player",
                endBtnDisabled: false,
                retreatBtnDisabled: false
            };
        } else {
            return {
                text: "敵軍ターン",
                // .turn-indicator-enemy
                className: "turn-indicator-enemy",
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
                titleClass: "ending-title-win",
                bodyText: "敵勢力の拠点をすべて制圧し、バハムート大陸に真の平和が訪れた。あなたの名は伝説となり、永く語り継がれるだろう。"
            };
        } else {
            return {
                titleText: "敗北...",
                titleClass: "ending-title-loss",
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
