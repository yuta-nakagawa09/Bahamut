/**
 * MODEL: 状態管理と計算ロジック
 */
window.Model = {
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
        globalBattleCooldown: 0
    },

    /**
     * オフセット座標からキューブ座標へ変換
     * @param {number} r - Row (y)
     * @param {number} c - Col (x)
     * @returns {{x:number, y:number, z:number}} Cube coordinates
     */
    getCubeCoords(r, c) {
        const x = c - (r - (r & 1)) / 2;
        const z = r;
        const y = -x - z;
        return { x, y, z };
    },

    /**
     * ヘックス間の距離計算
     * @param {number} r1 - Start Row
     * @param {number} c1 - Start Col
     * @param {number} r2 - End Row
     * @param {number} c2 - End Col
     * @returns {number} Distance in hex steps
     */
    getHexDist(r1, c1, r2, c2) {
        if (r1 === undefined || c1 === undefined || r2 === undefined || c2 === undefined) return 999;
        const a = this.getCubeCoords(r1, c1);
        const b = this.getCubeCoords(r2, c2);
        return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.z - b.z));
    },

    /**
     * 部隊雇用
     * @param {string} armyId - 雇用先の部隊ID
     * @param {string} unitTypeId - 雇用するユニットの定義ID
     * @returns {string|true} 成功ならtrue、失敗ならエラーメッセージ
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
     * ユニット強化
     * @param {string} armyId - 部隊ID
     * @param {number} unitIndex - 部隊内のインデックス
     * @param {string} type - 'hp' or 'atk'
     * @returns {string|true} 成功ならtrue、失敗ならエラーメッセージ
     */
    enhanceUnit(armyId, unitIndex, type) {
        const army = this.state.mapUnits.find(u => u.id === armyId);
        if (!army) return "部隊データが見つかりません";

        const faction = this.state.factions.find(f => f.id === army.owner);
        if (!faction) return "勢力データが見つかりません";

        const unit = army.army[unitIndex];
        if (!unit) return "ユニットが見つかりません";

        if (type === 'hp') {
            if (faction.gold < 100) return "資金が足りません(100G必要)";
            // if (unit.currentHp >= unit.hp) return "HPは既に満タンです"; // 最大HP強化なので満タンでもOKにする
            faction.gold -= 100;
            unit.hp += 10;
            unit.currentHp += 10;
            return true;
        } else if (type === 'atk') {
            if (faction.gold < 150) return "資金が足りません(150G必要)";
            faction.gold -= 150;
            unit.atk += 3;
            return true;
        }
        return "不正な強化タイプです";
    }
};
window.Model = Model;
