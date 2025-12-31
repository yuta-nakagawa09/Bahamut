/**
 * UI: UIコンポーネント定義
 * HTMLテンプレート文字列やDOM要素を生成するステートレスなメソッド群。
 * @namespace
 */
window.UI = {
    // -------------------------------------------------------------------------
    // 汎用UIコンポーネント (Buttons, Modals)
    // -------------------------------------------------------------------------
    /**
     * 基本的なボタンHTML文字列を返す
     * @param {string} label - ボタンのラベル
     * @param {string} onclick - onclick属性に設定するJSコード文字列
     * @param {string} [type='primary'] - ボタンタイプ ('primary', 'secondary', 'neutral' etc.)
     * @param {string} [extraClass=''] - 追加のCSSクラス
     * @returns {string} HTML文字列
     */
    Button: (label, onclick, type = 'primary', extraClass = '') => {
        return `<button onclick="${onclick}" class="btn-base btn-${type} ${extraClass}">${label}</button>`;
    },

    /**
     * モーダル用ボタンのDOM要素を作成する
     * @param {string} label - ボタン名
     * @param {function} onclick - クリック時のコールバック関数
     * @param {string} [extraClass=''] - 追加CSSクラス
     * @returns {HTMLButtonElement} 生成されたボタン要素
     */
    createModalButton: (label, onclick, extraClass = '') => {
        const btn = document.createElement('button');
        btn.className = `btn-modal ${extraClass}`;
        btn.innerText = label;
        btn.onclick = onclick;
        return btn;
    },

    /**
     * 各種情報パネルのHTMLを生成する
     * @param {string} content - パネル内部のHTMLコンテンツ
     * @param {string} [extraClass=''] - 追加クラス
     * @returns {string} HTML文字列
     */
    Panel: (content, extraClass = '') => {
        return `<div class="panel-base ${extraClass}">${content}</div>`;
    },

    // -------------------------------------------------------------------------
    // カードコンポーネント (Master, Map, Army)
    // -------------------------------------------------------------------------
    /**
     * マスター選択画面のカードHTML
     * @param {Object} m - マスターデータ
     * @returns {string} HTML文字列
     */
    MasterSelectionCard: (m) => {
        let colorName = 'blue';
        if (m.id === 'mage') colorName = 'green';
        if (m.id === 'demon') colorName = 'red';

        let iconContent;
        if (m.id === 'knight') {
            iconContent = `<img src="assets/img/icon_master_fighter.png" class="card-icon" alt="${m.name}">`;
        } else if (m.id === 'mage') {
            iconContent = `<img src="assets/img/icon_master_mage.png" class="card-icon" alt="${m.name}">`;
        } else if (m.id === 'demon') {
            iconContent = `<img src="assets/img/icon_master_demon.png" class="card-icon" alt="${m.name}">`;
        } else {
            // Fallback
            iconContent = `<div class="text-9xl mb-8 transition-transform group-hover:scale-110">${m.emoji}</div>`;
        }

        return `
        <div onclick="Controller.createGame('${m.id}')"
            class="card-base hover:border-${colorName}-500 ${extraClass = ''} w-[300px] ">
            ${iconContent}
            <div class="text-4xl font-bold mb-4 text-white group-hover:text-${colorName}-400" style="text-shadow: 1px 1px 2px black;">${m.name}</div>
            <p class="text-center text-gray-200 text-lg font-semibold" style="text-shadow: 1px 1px 1px black;">${m.desc}</p>
        </div>`;
    },

    /**
     * マップ選択画面のカードHTML
     * @param {Object} t - マップテンプレートデータ
     * @returns {string} HTML文字列
     */
    MapSelectionCard: (t) => {
        let iconPath = 'assets/img/icon_map_continent.png';
        if (t.id === 'islands') iconPath = 'assets/img/icon_map_islands.png';
        if (t.id === 'ring') iconPath = 'assets/img/icon_map_ring.png';

        return `
        <div onclick="Controller.selectMapAndNext('${t.id}')"
            class="card-base hover:border-yellow-500 w-[300px] ">
            <img src="${iconPath}" class="card-icon" alt="${t.name}">
            <div class="text-4xl font-bold mb-4 text-[#fbbf24] group-hover:text-yellow-300" style="text-shadow: 1px 1px 2px black;">${t.name}</div>
            <p class="text-center text-gray-200 text-lg font-semibold" style="text-shadow: 1px 1px 1px black;">${t.desc}</p>
        </div>`;
    },

    /**
     * 汎用カードコンポーネント
     * @param {string} title - タイトル
     * @param {string} desc - 説明文
     * @param {string} icon - 絵文字アイコン
     * @param {string} onclick - クリックアクション
     * @param {string} subtext - サブテキスト（オプション）
     * @param {string} extraClass - 追加クラス
     * @returns {string} HTML文字列
     */
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

    /**
     * 部隊情報カード（BaseMenu等で使用）
     * @param {Object} unit - 部隊データ
     * @param {boolean} isPlayer - プレイヤーかどうか
     * @param {string} factionName - 勢力名
     * @param {string} extraContent - 追加コンテンツHTML
     * @returns {string} HTML文字列
     */
    ArmyCard: (unit, isPlayer, factionName, extraContent = '') => {
        const colorClass = isPlayer ? 'text-blue-300' : 'text-red-400';
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

    // -------------------------------------------------------------------------
    // メニュー・ヘッダー関連
    // -------------------------------------------------------------------------
    /**
     * メニューのタイトルHTML
     * @param {string} name - 名前（拠点名など）
     * @param {boolean} isHQ - 本拠地かどうか
     * @param {string} ownerName - 所有者名
     * @param {string} ownerEmoji - 所有者アイコン
     * @param {string} color - 色コード
     * @param {string} extraInfo - 追加情報
     * @returns {string} HTML文字列
     */
    MenuTitle: (name, isHQ, ownerName, ownerEmoji, color, extraInfo = '') => {
        return `
            <span>${name}</span>
            <span class="ml-2">${isHQ ? '👑本拠地' : ''}</span>
            <span style="color:${color}" class="ml-2">${ownerEmoji}${ownerName}</span>
            ${extraInfo}
        `;
    },

    /**
     * メニュー内のボーナス/収入表示HTML
     * @param {string} type - 'bonus' or 'income'
     * @param {number} amount - 金額
     * @returns {string} HTML文字列
     */
    MenuBonus: (type, amount) => {
        if (type === 'bonus') {
            return `<span class="text-bonus">💰ボーナス: ${amount}G</span>`;
        } else {
            return `<span class="text-income">💰収入: ${amount}G</span>`;
        }
    },

    /**
     * 戦力表示用HTML
     * @param {number} power - 戦力値
     * @returns {string} HTML文字列
     */
    MenuPower: (power) => {
        return `<span class="ml-4 text-gray-300 font-bold">⚔️戦力: ${power}</span>`;
    },

    // -------------------------------------------------------------------------
    // ユニットリスト・雇用関連
    // -------------------------------------------------------------------------
    /**
     * ユニットリストの1行分のアイテムHTML
     * @param {Object} u - ユニットデータ
     * @param {number} i - インデックス
     * @param {Object|null} enhanceActions - 強化アクション（hp, atk）のJSコード文字
     * @returns {string} HTML文字列
     */
    UnitListItem: (u, i, enhanceActions = null) => {
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

    /**
     * ユニットリストパネル全体のHTML
     * @param {Object} unit - 部隊データ
     * @param {Object} castle - 拠点データ
     * @param {function} unitListItemHTML - アイテム生成関数
     * @returns {string} HTML文字列
     */
    UnitListPanel: (unit, castle, unitListItemHTML) => {
        return `
            <p class="panel-title">部隊編成・強化</p>
            <div class="flex flex-col gap-3">
                ${unit.army.map((u, i) => unitListItemHTML(u, i)).join('')}
            </div>`;
    },

    /**
     * 雇用候補アイテムのHTML
     * @param {Object} ut - ユニット定義
     * @param {string} activeUnitId - 現在の部隊ID
     * @param {string} castleId - 拠点ID
     * @param {boolean} canAfford - 購入可能か
     * @param {boolean} isFull - 部隊が満員か
     * @returns {string} HTML文字列
     */
    RecruitItem: (ut, activeUnitId, castleId, canAfford, isFull) => {
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

    /**
     * 雇用パネル全体のHTML
     * @param {Array} options - 雇用候補リスト
     * @param {Object} activeUnit - 現在の部隊
     * @param {Object} castle - 拠点
     * @param {function} recruitItemHTML - アイテム生成関数
     * @returns {string} HTML文字列
     */
    RecruitPanel: (options, activeUnit, castle, recruitItemHTML) => {
        return `
            <p class="panel-title">ユニット雇用</p>
            <div class="flex flex-col gap-3">
                ${options.map(ut => recruitItemHTML(ut, activeUnit, castle)).join('')}
            </div>`;
    },

    /**
     * 部隊選択タブ切り替えボタンを作成する
     * @param {Object} unit - 部隊データ
     * @param {boolean} isActive - アクティブかどうか
     * @param {Object} faction - 勢力データ
     * @param {function} onclick - クリックハンドラ
     * @returns {HTMLButtonElement} ボタン要素
     */
    createTabButton: (unit, isActive, faction, onclick) => {
        const color = faction ? faction.color : '#aaaaaa';
        const count = unit.army.length;
        const max = Data.MAX_UNITS;

        const btn = document.createElement('button');
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

    // -------------------------------------------------------------------------
    // バトル画面コンポーネント (Hex, Unit, Turn)
    // -------------------------------------------------------------------------
    /**
     * バトルヘックスDOM要素を作成
     * @param {number} x - Pixel X
     * @param {number} y - Pixel Y
     * @param {number} r - Grid Row
     * @param {number} c - Grid Col
     * @param {function} onClick - クリックハンドラ
     * @returns {HTMLDivElement} ヘックス要素
     */
    BattleHex: (x, y, r, c, onClick) => {
        const div = document.createElement('div');
        div.className = "battle-hex clip-hex hex-base";
        div.style.left = `${x}px`;
        div.style.top = `${y}px`;

        div.addEventListener('click', (e) => {
            e.stopPropagation();
            if (onClick) onClick(r, c);
        });
        return div;
    },

    /**
     * バトルユニットのHTML表現
     * @param {Object} u - ユニットデータ
     * @param {number} rankIndex - ランクインデックス
     * @param {number} hpPct - HP残量(0.0-1.0)
     * @returns {string} HTML文字列
     */
    BattleUnitHTML: (u, rankIndex = 0, hpPct = 1) => {
        return `
            <div class="flex items-center gap-1 mb-1">
                <span class="text-4xl shadow-black drop-shadow-md">${u.emoji}</span>
                <span class="battle-unit-rank">${Data.RANKS[rankIndex]}</span>
            </div>
            <div class="battle-unit-bar-container">
                <div class="battle-unit-bar-fill" style="width:${Math.max(0, hpPct * 100)}%"></div>
            </div>`;
    },

    /**
     * 敵ユニット一覧の表示コンテナHTML
     * @param {string} content - 内部コンテンツ
     * @returns {string} HTML文字列
     */
    EnemyUnitListContainer: (content) => {
        return `<div class="flex flex-col gap-3">${content}</div>`;
    },

    /**
     * ターンインジケータのスタイル＆メッセージ定義を返す
     * @param {string} turn - 'player' | 'enemy'
     * @returns {{text:string, className:string, endBtnDisabled:boolean, retreatBtnDisabled:boolean}}
     */
    TurnIndicatorStyles: (turn) => {
        if (turn === 'player') {
            return {
                text: "自軍ターン",
                className: "turn-indicator-player",
                endBtnDisabled: false,
                retreatBtnDisabled: false
            };
        } else {
            return {
                text: "敵軍ターン",
                className: "turn-indicator-enemy",
                endBtnDisabled: true,
                retreatBtnDisabled: true
            };
        }
    },

    /**
     * エンディング画面のスタイル定義を返す
     * @param {boolean} isWin - 勝利したかどうか
     * @returns {{titleText:string, titleClass:string, bodyText:string}}
     */
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

    /**
     * バトル画面で使用するスタイルクラス定数
     */
    BattleStyles: {
        gridBaseClass: "hex-base",
        gridMoveClass: "hex-move",
        gridAttackClass: "hex-attack",
        gridSelectedClass: "hex-selected",
        movedUnitClass: "unit-moved"
    },

    // -------------------------------------------------------------------------
    // 情報ウィンドウ (Info Modal)
    // -------------------------------------------------------------------------
    /**
     * 情報モーダルのテンプレートHTML
     * @returns {string} HTML文字列
     */
    InfoModalTemplate: () => {
        return `
            <div class="info-modal-container" onclick="event.stopPropagation()">
                <div class="info-tabs">
                    <div id="tab-faction" class="info-tab active" onclick="View.switchInfoTab('faction')">勢力一覧</div>
                    <div id="tab-castle" class="info-tab" onclick="View.switchInfoTab('castle')">拠点一覧</div>
                    <div class="info-tab" onclick="View.closeModal()">閉じる</div>
                </div>
                <div id="info-content-area" class="info-content custom-scrollbar">
                    <!-- Data rendered here -->
                </div>
            </div>`;
    },

    /**
     * 勢力一覧テーブルのHTML
     * @param {Array<Object>} rows - 行データの配列
     * @returns {string} HTML文字列
     */
    InfoFactionTable: (rows) => {
        let html = `
            <table class="info-table">
                <thead>
                    <tr>
                        <th>勢力名</th>
                        <th>拠点数</th>
                        <th>部隊数</th>
                        <th>資金</th>
                        <th>総収入</th>
                        <th>総戦力</th>
                    </tr>
                </thead>
                <tbody>`;

        rows.forEach(row => {
            html += `
                <tr>
                    <td><span style="color:${row.color}">${row.emoji} ${row.name}</span></td>
                    <td>${row.castleCount}</td>
                    <td>${row.armyCount}</td>
                    <td>${row.gold}G</td>
                    <td class="text-highlight">+${row.income}G</td>
                    <td>${row.power}</td>
                </tr>`;
        });

        html += '</tbody></table>';
        return html;
    },

    /**
     * 拠点一覧テーブルのHTML
     * @param {Array<Object>} rows - 行データの配列
     * @returns {string} HTML文字列
     */
    InfoCastleTable: (rows) => {
        let html = `
            <table class="info-table">
                <thead>
                    <tr>
                        <th>名称</th>
                        <th>種別</th>
                        <th>支配</th>
                        <th>収入/Bonus</th>
                        <th>戦力</th>
                        <th>固有ユニット</th>
                    </tr>
                </thead>
                <tbody>`;

        rows.forEach(row => {
            html += `
                <tr>
                    <td class="font-bold">${row.name}</td>
                    <td>${row.type}</td>
                    <td>${row.ownerNameDisplay}</td>
                    <td>${row.incomeText}</td>
                    <td>${row.power}</td>
                    <td>${row.uniqueUnit}</td>
                </tr>`;
        });

        html += '</tbody></table>';
        return html;
    },
    /**
     * 汎用モーダルのテンプレートHTML
     * @returns {string} HTML文字列
     */
    GenericModalTemplate: () => {
        return `
        <div class="modal-content">
            <h3 id="modal-title" class="text-4xl font-bold text-white mb-6"></h3>
            <p id="modal-body" class="text-xl text-gray-300 mb-10 leading-relaxed"></p>
            <div id="modal-footer" class="flex justify-center gap-6"></div>
        </div>`;
    }
};
