/**
 * DATA: ゲーム内の静的データ定義
 */
window.Data = {
    MAX_UNITS: 5,
    MAX_ARMIES: 5,
    ARMY_COST: 500,
    UNIT_SPEED: 10.0,
    RANK_UP_XP: 50,
    RANKS: ['E', 'D', 'C', 'B', 'A', 'S'],

    MASTERS: [
        { id: 'knight', name: 'ジーク', alignment: 'LAW', color: '#4466ff', emoji: '🏰', desc: '聖騎士。防御と近接戦闘に優れるバランス型。' },
        { id: 'mage', name: 'アーシェ', alignment: 'NEUTRAL', color: '#44ff66', emoji: '🧝', desc: '女王。遠距離魔法と機動力を持つエルフ軍。' },
        { id: 'demon', name: 'クリムゾン', alignment: 'CHAOS', color: '#ff4444', emoji: '👹', desc: '魔王。圧倒的な攻撃力で敵を粉砕する。' }
    ],

    FACTION_UNITS: {
        'knight': [
            { id: 'soldier', name: '兵士', emoji: '🛡️', hp: 40, atk: 14, range: 1, move: 3, cost: 200 },
            { id: 'paladin', name: '騎士', emoji: '🏇', hp: 60, atk: 20, range: 1, move: 5, cost: 500 }
        ],
        'mage': [
            { id: 'elf', name: 'エルフ', emoji: '🏹', hp: 30, atk: 18, range: 3, move: 3, cost: 300 },
            { id: 'fairy', name: '妖精', emoji: '🧚', hp: 25, atk: 12, range: 2, move: 4, cost: 250 }
        ],
        'demon': [
            { id: 'imp', name: '小悪魔', emoji: '👿', hp: 28, atk: 18, range: 1, move: 4, cost: 150 },
            { id: 'dragon', name: '竜', emoji: '🐉', hp: 95, atk: 32, range: 1, move: 6, cost: 1000 }
        ]
    },

    MAP_TEMPLATES: [
        {
            id: 'classic', name: 'バハムート大陸 (Classic)', desc: '標準的なバランスの初期マップです。',
            castles: [
                { id: 'c1', name: '王都', x: 150, y: 200, owner: 'player', captureBonus: 0, uniqueUnit: null, neighbors: ['c3', 'c7'] },
                { id: 'c2', name: '暗黒城', x: 750, y: 550, owner: 'enemy', captureBonus: 2000, uniqueUnit: 'hell-hound', neighbors: ['c3', 'c5', 'c6'] },
                { id: 'c6', name: '東の塔', x: 750, y: 150, owner: 'enemy2', captureBonus: 800, uniqueUnit: 'sorcerer', neighbors: ['c2', 'c4'] },
                { id: 'c3', name: '自由都市', x: 450, y: 350, owner: 'neutral', captureBonus: 500, uniqueUnit: 'guard', neighbors: ['c1', 'c2', 'c4', 'c5'] },
                { id: 'c4', name: '北の砦', x: 450, y: 100, owner: 'neutral', captureBonus: 350, uniqueUnit: 'crossbow', neighbors: ['c3', 'c6'] },
                { id: 'c5', name: '南の村', x: 250, y: 550, owner: 'neutral', captureBonus: 200, uniqueUnit: 'militia', neighbors: ['c2', 'c3'] },
                { id: 'c7', name: '西の廃墟', x: 100, y: 450, owner: 'neutral', captureBonus: 400, uniqueUnit: 'ghost', neighbors: ['c1'] }
            ]
        },
        {
            id: 'islands', name: '群島諸国 (Islands)', desc: '細長いルートで構成された機動力が試されるマップ。',
            castles: [
                { id: 'c1', name: '王都', x: 100, y: 300, owner: 'player', captureBonus: 0, uniqueUnit: null, neighbors: ['c3'] },
                { id: 'c2', name: '影の島', x: 800, y: 300, owner: 'enemy', captureBonus: 2000, uniqueUnit: 'hell-hound', neighbors: ['c6'] },
                { id: 'c5', name: '炎の運河', x: 650, y: 450, owner: 'enemy2', captureBonus: 300, uniqueUnit: 'sorcerer', neighbors: ['c4', 'c6'] },
                { id: 'c3', name: '風の関所', x: 250, y: 150, owner: 'neutral', captureBonus: 300, uniqueUnit: 'crossbow', neighbors: ['c1', 'c4'] },
                { id: 'c4', name: '中央島', x: 450, y: 300, owner: 'neutral', captureBonus: 600, uniqueUnit: 'guard', neighbors: ['c3', 'c5'] },
                { id: 'c6', name: '境界の門', x: 700, y: 150, owner: 'neutral', captureBonus: 400, uniqueUnit: 'pirate', neighbors: ['c2', 'c5'] }
            ]
        },
        {
            id: 'ring', name: '環状大陸 (Ring)', desc: '拠点が輪のように繋がった特殊なマップ。',
            castles: [
                { id: 'c1', name: '王都', x: 450, y: 80, owner: 'player', captureBonus: 0, uniqueUnit: null, neighbors: ['c3', 'c4'] },
                { id: 'c2', name: '暗黒城', x: 450, y: 520, owner: 'enemy', captureBonus: 2000, uniqueUnit: 'hell-hound', neighbors: ['c5', 'c6'] },
                { id: 'c3', name: '東の港', x: 700, y: 200, owner: 'enemy2', captureBonus: 400, uniqueUnit: 'pirate', neighbors: ['c1', 'c5'] },
                { id: 'c4', name: '西の砦', x: 200, y: 200, owner: 'neutral', captureBonus: 400, uniqueUnit: 'dwarf', neighbors: ['c1', 'c6'] },
                { id: 'c5', name: '南東の平原', x: 700, y: 400, owner: 'neutral', captureBonus: 400, uniqueUnit: 'berserker', neighbors: ['c3', 'c2'] },
                { id: 'c6', name: '南西の森', x: 200, y: 400, owner: 'neutral', captureBonus: 400, uniqueUnit: 'fenrir', neighbors: ['c4', 'c2'] }
            ]
        }
    ],

    SPECIAL_UNITS: {
        'hell-hound': { id: 'hell-hound', name: 'ケルベロス', emoji: '🐕', hp: 45, atk: 22, range: 1, move: 5, cost: 600, origin: '暗黒城' },
        'guard': { id: 'guard', name: '重装衛兵', emoji: '💂', hp: 80, atk: 18, range: 1, move: 2, cost: 400, origin: '自由都市' },
        'crossbow': { id: 'crossbow', name: '弩兵', emoji: '🏹', hp: 35, atk: 22, range: 4, move: 2, cost: 550, origin: '北の砦' },
        'militia': { id: 'militia', name: '義勇兵', emoji: '🧑‍🌾', hp: 25, atk: 12, range: 1, move: 3, cost: 100, origin: '南の村' },
        'sorcerer': { id: 'sorcerer', name: '魔導師', emoji: '🧙', hp: 40, atk: 28, range: 3, move: 2, cost: 800, origin: '東の塔' },
        'ghost': { id: 'ghost', name: '亡霊', emoji: '👻', hp: 25, atk: 22, range: 1, move: 6, cost: 350, origin: '西の廃墟' },
        'pirate': { id: 'pirate', name: '海賊', emoji: '🏴‍☠️', hp: 50, atk: 24, range: 1, move: 4, cost: 450, origin: '諸島/港' },
        'dwarf': { id: 'dwarf', name: 'ドワーフ兵', emoji: '⚒️', hp: 70, atk: 26, range: 1, move: 2, cost: 600, origin: '西の砦' },
        'berserker': { id: 'berserker', name: '狂戦士', emoji: '🪓', hp: 45, atk: 35, range: 1, move: 4, cost: 700, origin: '東の平原' },
        'fenrir': { id: 'fenrir', name: '魔狼', emoji: '🐺', hp: 55, atk: 24, range: 1, move: 6, cost: 650, origin: '南西の森' }
    }
};
window.Data = Data;
