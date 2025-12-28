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
        selectedMapId: 'classic',
        gameCleared: false,
        battleUnitA: null, // 戦闘開始時のマップ上のユニット参照
        battleUnitB: null,
        globalBattleCooldown: 0
    },

    getCubeCoords(r, c) {
        const x = c - (r - (r & 1)) / 2;
        const z = r;
        const y = -x - z;
        return { x, y, z };
    },

    getHexDist(r1, c1, r2, c2) {
        if (r1 === undefined || c1 === undefined || r2 === undefined || c2 === undefined) return 999;
        const a = this.getCubeCoords(r1, c1);
        const b = this.getCubeCoords(r2, c2);
        return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.z - b.z));
    }
};
window.Model = Model;
