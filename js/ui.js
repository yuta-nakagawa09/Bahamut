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

    // -------------------------------------------------------------------------
    // カードコンポーネント (Master, Map, Army)
    // -------------------------------------------------------------------------
    /**
     * マスター選択画面のカードHTML
     * @param {Object} m - マスターデータ
     * @returns {string} HTML文字列
     */
    MasterSelectionCard: (m) => {
        return `
        <div onclick="Controller.createGame('${m.id}')"
            class="card-base">
            <img src="${m.image}" class="card-icon" alt="${m.name}">
            <div class="card-title">${m.name}</div>
            <p class="card-desc">${m.desc}</p>
        </div>`;
    },

    /**
     * マップ選択画面のカードHTML
     * @param {Object} t - マップテンプレートデータ
     * @returns {string} HTML文字列
     */
    MapSelectionCard: (t) => {
        return `
        <div onclick="Controller.selectMapAndNext('${t.id}')"
            class="card-base">
            <img src="${t.image}" class="card-icon" alt="${t.name}">
            <div class="card-title">${t.name}</div>
            <p class="card-desc">${t.desc}</p>
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
    UnitListItem: (u, i, enhanceActions = null, onClickOverride = null) => {
        return `
        <div class="unit-list-item list-item-base" onclick="${onClickOverride ? onClickOverride : `View.showUnitDetail('${u.id}')`}" style="cursor: pointer;">
            <div class="unit-info-group">
                <div class="list-item-icon">${u.emoji}</div>
                <div class="list-item-name">${u.name}</div>
                <div class="list-item-details">
                    HP:${u.currentHp}/${u.hp} ATK:${u.atk} XP:${u.xp} RANK ${Data.RANKS[u.rank || 0]}</div>
            </div>
            ${enhanceActions ? `
            <div class="flex flex-row gap-1">
                <button onclick="event.stopPropagation(); ${enhanceActions.hp}" class="btn-enhance-hp">HP+(${Data.ENHANCEMENT.HP.COST}${Data.CURRENCY_UNIT})</button>
                <button onclick="event.stopPropagation(); ${enhanceActions.atk}" class="btn-enhance-atk">ATK+(${Data.ENHANCEMENT.ATK.COST}${Data.CURRENCY_UNIT})</button>
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
            <div class="list-panel-base">
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
            <div class="recruit-item list-item-base" onclick="View.showUnitDetail('${ut.id}')" style="cursor: pointer;">
                <div class="flex items-center gap-3">
                    <div class="list-item-icon">${ut.emoji}</div>
                    <div class="flex gap-3">
                        <div class="list-item-name">${ut.name}
                        </div>
                        <div class="list-item-details">
                        HP:${ut.hp} / ATK:${ut.atk} / RNG:${ut.range} / MOVE:${ut.move}</div>
                    </div>
                </div>
                <button onclick="event.stopPropagation(); Controller.recruitUnit('${activeUnitId}', '${ut.id}', '${castleId}')" 
                    class="btn-recruit-buy" 
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
            <div class="list-panel-base">
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
        const stateClass = isActive ? 'active' : 'inactive';
        btn.className = `unit-tab-btn ${stateClass}`;

        btn.innerHTML = `
            <div class="text-xl font-bold uppercase truncate w-full text-center px-1 mb-1" style="color:${color}">部隊</div>
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
            const unitDisplay = row.uniqueUnitId
                ? `<span class="cursor-pointer text-yellow-400 hover:underline" onclick="View.showUnitDetail('${row.uniqueUnitId}')">${row.uniqueUnitName}</span>`
                : row.uniqueUnitName || '-';

            html += `
                <tr>
                    <td class="font-bold">${row.name}</td>
                    <td>${row.type}</td>
                    <td>${row.ownerNameDisplay}</td>
                    <td>${row.incomeText}</td>
                    <td>${row.power}</td>
                    <td>${unitDisplay}</td>
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
            <h3 id="modal-title" class="modal-title"></h3>
            <p id="modal-body" class="modal-body"></p>
            <div id="modal-footer" class="modal-footer"></div>
        </div>`;
    },

    /**
     * ユニット詳細確認モーダルのHTML
     * @param {Object} u - ユニットデータ
     * @returns {string} HTML文字列
     */
    UnitDetailModal: (u) => {
        return `
        <div class="modal-content unit-detail-container">
            <div class="unit-detail-header">
                <div class="unit-detail-icon">${u.emoji}</div>
                <div class="unit-detail-title">
                    <h2>${u.name}</h2>
                    <div class="text-xl text-gray-400">RANK: ${Data.RANKS[u.rank || 0]} / Cost: ${u.cost}G</div>
                </div>
            </div>

            <div class="unit-detail-stats">
                <div class="stat-row"><span class="stat-label">HP</span><span class="stat-value">${u.hp}</span></div>
                <div class="stat-row"><span class="stat-label">ATK</span><span class="stat-value">${u.atk}</span></div>
                <div class="stat-row"><span class="stat-label">RNG</span><span class="stat-value">${u.range}</span></div>
                <div class="stat-row"><span class="stat-label">MOVE</span><span class="stat-value">${u.move}</span></div>
            </div>

            <div class="unit-detail-desc">
                ${u.description || "説明文がありません。"}
            </div>

            <div class="mt-3 text-center">
                <button onclick="View.closeModal()" class="btn-base btn-neutral">閉じる</button>
            </div>
        </div>`;
    },

    // -------------------------------------------------------------------------
    // 拠点メニュータブ
    // -------------------------------------------------------------------------
    /**
     * 拠点メニューのタブHTMLを生成・イベント設定
     * @param {string} activeTab - 'create' | 'recruit' | 'enhance'
     * @param {function} onSwitch - タブ切り替え時のコールバック (tabId) => void
     * @returns {HTMLElement} タブコンテナ要素
     */
    BaseMenuTabs: (activeTab, onSwitch) => {
        const container = document.createElement('div');
        container.className = "flex gap-1 w-full"; // Full width container

        const tabs = [
            { id: 'enhance', label: '駐留部隊' },
            { id: 'create', label: '部隊追加' },
            { id: 'recruit', label: 'ユニット雇用' }
        ];

        tabs.forEach(tab => {
            const btn = document.createElement('button');
            const isActive = tab.id === activeTab;

            btn.className = isActive ? 'menu-tab-btn active' : 'menu-tab-btn inactive';
            btn.innerText = tab.label;
            btn.onclick = () => onSwitch(tab.id);
            container.appendChild(btn);

        });

        return container;
    },

    /**
     * 部隊選択タブ（横スクロール）を生成
     * @param {Array} allUnits - 全部隊リスト
     * @param {Object} activeUnit - 選択中の部隊
     * @param {function} onSelect - (unit) => void
     * @returns {HTMLElement}
     */
    UnitTabs: (allUnits, activeUnit, onSelect) => {
        const container = document.createElement('div');
        container.className = "flex gap-3 pb-1 mb-1";

        allUnits.forEach(u => {
            const isActive = (u === activeUnit);
            const faction = Model.state.factions.find(fx => fx.id === u.owner);
            const btn = UI.createTabButton(u, isActive, faction, () => onSelect(u));
            container.appendChild(btn);
        });
        return container;
    },

    /**
     * 「部隊新規」タブの内容を生成
     * @param {number} gold - 現在の所持金
     * @param {number} currentArmies - 現在の部隊数
     * @param {number} armCost - 部隊作成コスト
     * @param {number} maxArmies - 最大部隊数
     * @param {function} onAction - 作成実行時のコールバック
     * @returns {HTMLElement}
     */
    TabContentCreate: (gold, currentArmies, armCost, maxArmies, onAction) => {
        const container = document.createElement('div');
        const canCreate = gold >= armCost && currentArmies < maxArmies;

        const createBtn = document.createElement('button');
        createBtn.className = "btn-create";
        createBtn.innerHTML = `
            <span>新規部隊結成</span>
            <span class="text-sm font-normal text-purple-200">費用: ${armCost}G</span>
        `;
        createBtn.disabled = !canCreate;
        createBtn.onclick = onAction;
        container.appendChild(createBtn);

        const desc = document.createElement('div');
        desc.className = "text-center text-gray-400 text-sm mt-2";
        if (!canCreate) {
            if (gold < armCost) desc.innerText = "資金不足です";
            else desc.innerText = "部隊数が上限に達しています";
        } else {
            desc.innerText = "新しい部隊をこの拠点に配置します";
        }
        container.appendChild(desc);

        return container;
    },

    /**
     * 「雇用」タブの内容を生成
     * @param {Array} allUnits - この拠点の全部隊
     * @param {Object} activeUnit - 選択中の部隊
     * @param {Object} castle - 拠点データ
     * @param {Object} playerFaction - プレイヤー勢力データ
     * @param {function} onSelectUnit - (unit) => void
     * @param {function} onRecruit - (ut, activeUnit, castle) => void
     * @returns {HTMLElement}
     */
    TabContentRecruit: (allUnits, activeUnit, castle, playerFaction, onSelectUnit, onRecruit) => {
        const container = document.createElement('div');

        if (allUnits.length > 0 && activeUnit) {
            // Unit Tabs
            container.appendChild(UI.UnitTabs(allUnits, activeUnit, onSelectUnit));

            // Recruit Panel
            if (activeUnit.owner === playerFaction.id) {
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
                const wrapper = document.createElement('div');
                wrapper.innerHTML = recruitHTML;
                container.appendChild(wrapper);
            } else {
                const msg = document.createElement('div');
                msg.className = "text-center text-red-400 py-4";
                msg.innerText = "敵軍部隊です（操作不可）";
                container.appendChild(msg);
            }
        } else {
            const noMsg = document.createElement('div');
            noMsg.className = "py-12 text-center border-2 border-dashed border-gray-800 rounded-lg text-gray-600 text-xs font-black uppercase tracking-widest italic";
            noMsg.innerText = "部隊がいません。「部隊新規」で作成してください。";
            container.appendChild(noMsg);
        }
        return container;
    },

    /**
     * 「強化」タブの内容を生成
     * @param {Array} allUnits - この拠点の全部隊
     * @param {Object} activeUnit - 選択中の部隊
     * @param {Object} castle - 拠点データ
     * @param {Object} playerFaction - プレイヤー勢力データ
     * @param {function} onSelectUnit - (unit) => void
     * @returns {HTMLElement}
     */
    TabContentEnhance: (allUnits, activeUnit, castle, playerFaction, onSelectUnit) => {
        const container = document.createElement('div');

        if (allUnits.length > 0 && activeUnit) {
            // Unit Tabs
            container.appendChild(UI.UnitTabs(allUnits, activeUnit, onSelectUnit));

            // Unit List + Enhance Buttons
            if (activeUnit.owner === playerFaction.id) {
                const unitsHTML = UI.UnitListPanel(activeUnit, castle, (u, i) => UI.UnitListItem(u, i, {
                    hp: `Controller.enhanceUnit('${activeUnit.id}', ${i}, 'hp', '${castle.id}')`,
                    atk: `Controller.enhanceUnit('${activeUnit.id}', ${i}, 'atk', '${castle.id}')`
                }, `View.showUnitInstanceDetail('${activeUnit.id}', ${i})`));
                const wrapper = document.createElement('div');
                wrapper.innerHTML = unitsHTML;
                container.appendChild(wrapper);
            } else {
                const listHtml = UI.EnemyUnitListContainer(activeUnit.army.map((u, i) => UI.UnitListItem(u, i)).join(''));
                const wrapper = document.createElement('div');
                wrapper.innerHTML = listHtml;
                container.appendChild(wrapper);
            }
        } else {
            const noMsg = document.createElement('div');
            noMsg.className = "py-12 text-center border-2 border-dashed border-gray-800 rounded-lg text-gray-600 text-xs font-black uppercase tracking-widest italic";
            noMsg.innerText = "部隊がいません。";
            container.appendChild(noMsg);
        }
        return container;
    },

    /**
     * 敵/中立拠点用のコンテンツ生成
     * @param {Array} allUnits - 部隊リスト
     * @param {Object} activeUnit - 選択中の部隊
     * @param {function} onSelectUnit - 切り替えコールバック
     * @returns {HTMLElement}
     */
    TabContentEnemy: (allUnits, activeUnit, onSelectUnit) => {
        const container = document.createElement('div');
        if (activeUnit) {
            container.appendChild(UI.UnitTabs(allUnits, activeUnit, onSelectUnit));

            const listHtml = UI.EnemyUnitListContainer(activeUnit.army.map((u, i) => UI.UnitListItem(u, i)).join(''));
            const wrapper = document.createElement('div');
            wrapper.innerHTML = listHtml;
            container.appendChild(wrapper);
        } else {
            const noMsg = document.createElement('div');
            noMsg.className = "py-12 text-center border-2 border-dashed border-gray-800 rounded-lg text-gray-600 text-xs font-black uppercase tracking-widest italic";
            noMsg.innerText = "駐留部隊なし";
            container.appendChild(noMsg);
        }
        return container;
    }
};
