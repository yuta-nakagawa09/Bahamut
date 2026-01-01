/**
 * MODEL: 状態管理と計算ロジック
 * ゲーム全体のステート管理、座標計算、データ変更ロジックを担当する。
 * @namespace
 */
window.Model = {
    // -------------------------------------------------------------------------
    // ステート定義
    // -------------------------------------------------------------------------
    /**
     * ゲームの状態オブジェクト
     * @property {Array} factions - 全勢力のデータ
     * @property {Array} castles - 全拠点のデータ
     * @property {Array} mapUnits - マップ上の全部隊データ
     * @property {string} currentScreen - 現在の画面ID
     * @property {number} turnCount - 経過ターン数
     * @property {Object} battle - 戦闘フェーズの状態
     */
    state: {
        factions: [],
        castles: [],
        mapUnits: [],
        currentScreen: 'title',
        turnCount: 1,
        strategicTurn: 'player', // 'player' or 'enemy'
        selectedMapUnit: null,
        battle: {
            active: false,
            units: [],
            grid: [],
            turn: 'player',
            selectedUnit: null,
            movedUnits: new Set(),
            tempMoved: false,
            logs: []
        },
        selectedMapId: null,
        gameCleared: false,
        battleUnitA: null, // 戦闘開始時のマップ上のユニット参照
        battleUnitB: null,
        globalBattleCooldown: 0,
        spectateCPUBattles: false // 観戦モードフラグ
    },

    // -------------------------------------------------------------------------
    // 座標計算ロジック (Hex Grid)
    // -------------------------------------------------------------------------
    /**
     * オフセット座標からキューブ座標へ変換する
     * ヘックスグリッドの距離計算に使用。
     * @param {number} r - Row (y)
     * @param {number} c - Col (x)
     * @returns {{x:number, y:number, z:number}} キューブ座標オブジェクト
     */
    getCubeCoords(r, c) {
        const x = c - (r - (r & 1)) / 2;
        const z = r;
        const y = -x - z;
        return { x, y, z };
    },

    /**
     * ヘックス間の距離を計算する
     * @param {number} r1 - 開始地点 Row
     * @param {number} c1 - 開始地点 Col
     * @param {number} r2 - 終了地点 Row
     * @param {number} c2 - 終了地点 Col
     * @returns {number} ヘックス単位の距離 (到達不能時は999)
     */
    getHexDist(r1, c1, r2, c2) {
        if (r1 === undefined || c1 === undefined || r2 === undefined || c2 === undefined) return 999;
        const a = this.getCubeCoords(r1, c1);
        const b = this.getCubeCoords(r2, c2);
        return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.z - b.z));
    },

    // -------------------------------------------------------------------------
    // ユニット・部隊管理ロジック
    // -------------------------------------------------------------------------
    /**
     * 部隊にユニットを雇用する
     * @param {string} armyId - 雇用先の部隊ID
     * @param {string} unitTypeId - 雇用するユニットの定義ID
     * @returns {string|boolean} 成功ならtrue、失敗ならエラーメッセージ文字列
     */
    recruitUnit(armyId, unitTypeId) {
        const army = this.state.mapUnits.find(u => u.id === armyId);
        if (!army) return "部隊データが見つかりません";

        const faction = this.state.factions.find(f => f.id === army.owner);
        if (!faction) return "勢力データが見つかりません";

        let ut = Data.FACTION_UNITS[faction.master.id].find(x => x.id === unitTypeId) || Data.SPECIAL_UNITS[unitTypeId];

        if (!army || !ut) return "部隊データが見つかりません";
        if (army.army.length >= Data.MAX_UNITS) return "部隊がいっぱいです";
        if (faction.gold < ut.cost) return "資金が不足しています";

        faction.gold -= ut.cost;
        army.army.push({ ...ut, currentHp: ut.hp, rank: 0, xp: 0 });
        return true;
    },

    /**
     * ユニットを強化する (HPまたはATK)
     * @param {string} armyId - 部隊ID
     * @param {number} unitIndex - 部隊内のユニットインデックス
     * @param {string} type - 強化タイプ ('hp' または 'atk')
     * @returns {string|boolean} 成功ならtrue、失敗ならエラーメッセージ文字列
     */
    enhanceUnit(armyId, unitIndex, type) {
        const army = this.state.mapUnits.find(u => u.id === armyId);
        if (!army) return "部隊データが見つかりません";

        const faction = this.state.factions.find(f => f.id === army.owner);
        if (!faction) return "勢力データが見つかりません";

        const unit = army.army[unitIndex];
        if (!unit) return "ユニットが見つかりません";

        if (type === 'hp') {
            const cost = Data.ENHANCEMENT.HP.COST;
            const val = Data.ENHANCEMENT.HP.VALUE;
            if (faction.gold < cost) return `資金が足りません(${cost}G必要)`;
            // if (unit.currentHp >= unit.hp) return "HPは既に満タンです"; // 最大HP強化なので満タンでもOKにする
            faction.gold -= cost;
            unit.hp += val;
            unit.currentHp += val;
            return true;
        } else if (type === 'atk') {
            const cost = Data.ENHANCEMENT.ATK.COST;
            const val = Data.ENHANCEMENT.ATK.VALUE;
            if (faction.gold < cost) return `資金が足りません(${cost}G必要)`;
            faction.gold -= cost;
            unit.atk += val;
            return true;
        }
        return "不正な強化タイプです";
    },

    /**
     * 新規部隊を作成しマップに配置する
     * @param {string} factionId - 所属勢力ID
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @returns {Object|null} 作成された新しい部隊オブジェクト、失敗時はnull
     */
    createNewArmy(factionId, x, y) {
        const faction = this.state.factions.find(f => f.id === factionId);
        if (!faction) return null;

        const newUnit = {
            id: `e-${faction.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            owner: faction.id,
            x: x, y: y,
            targetX: x, targetY: y,
            emoji: faction.master.emoji,
            army: [],
            isMaster: false,
            hasActed: true,
            isMoving: false
        };
        this.state.mapUnits.push(newUnit);
        return newUnit;
    },

    /**
     * ユニット単体の戦力を計算する
     * @param {Object} unit - ユニットデータ (atk, currentHpを持つ)
     * @returns {number}
     */
    getUnitPower(unit) {
        return (unit.atk || 0) + (unit.currentHp || 0);
    },

    /**
     * 指定された拠点の戦力合計を計算する
     * 拠点上の全ユニットの攻撃力(atk)の合計を返す
     * @param {Object} castle - 拠点データ
     * @returns {number} 戦力合計値
     */
    getCastleTotalPower(castle) {
        if (!castle) return 0;
        const allUnits = this.state.mapUnits.filter(u => Math.hypot(u.x - castle.x, u.y - castle.y) < Data.UI.UNIT_DETECT_RADIUS);
        return allUnits.reduce((acc, mapUnit) => {
            return acc + mapUnit.army.reduce((uAcc, u) => uAcc + this.getUnitPower(u), 0);
        }, 0);
    },

    /**
     * 指定された勢力の総戦力を計算する
     * @param {string} factionId - 勢力ID
     * @returns {number} 総戦力
     */
    getFactionTotalPower(factionId) {
        const factionUnits = this.state.mapUnits.filter(u => u.owner === factionId);
        return factionUnits.reduce((acc, mapUnit) => {
            return acc + mapUnit.army.reduce((uAcc, u) => uAcc + this.getUnitPower(u), 0);
        }, 0);
    },

    /**
     * 指定された勢力の収入を計算する
     * 基本収入(100) + 所有拠点の収入合計
     * @param {string} factionId - 勢力ID
     * @returns {number} 収入値
     */
    calculateFactionIncome(factionId) {
        const castleIncome = this.state.castles
            .filter(c => c.owner === factionId)
            .reduce((sum, c) => sum + (c.income || 0), 0);
        return castleIncome;
    },
    /**
     * ユニットのランクアップ処理
     * @param {Object} unit
     * @returns {boolean} ランクアップしたかどうか
     */
    processRankUp(unit) {
        // Data.RANK_UP_XP は root直下
        if (unit.xp >= Data.RANK_UP_XP && (unit.rank === undefined || unit.rank < 5)) {
            unit.rank = (unit.rank || 0) + 1;
            unit.xp = 0;

            // 能力上昇 (20%)
            const hpBonus = Math.floor(unit.hp * Data.BATTLE.RANK_UP_RATE);
            const atkBonus = Math.floor(unit.atk * Data.BATTLE.RANK_UP_RATE);

            unit.hp += hpBonus;
            unit.atk += atkBonus;
            unit.currentHp += hpBonus; // 最大HP上昇分だけ回復

            return true;
        }
        return false;
    }
};
window.Model = Model;
