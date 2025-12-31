/**
 * DATA: ゲーム内の静的データ定義
 * ゲームバランス、ユニット、マップなどの定数を管理するオブジェクト。
 * @namespace
 */
window.Data = {
    // -------------------------------------------------------------------------
    // 基本設定定数
    // -------------------------------------------------------------------------
    /** @type {number} 部隊の最大ユニット数 */
    MAX_UNITS: 5,
    /** @type {number} 最大勢力数（プレイヤー含む） */
    MAX_ARMIES: 5,
    /** @type {number} 1部隊あたりの基本コスト（未使用の可能性あり） */
    ARMY_COST: 500,
    /** @type {number} ユニットの移動アニメーション速度 */
    UNIT_SPEED: 10.0,
    /** @type {number} ランクアップに必要な経験値 */
    RANK_UP_XP: 50,
    /** @type {string[]} ランクの表示名リスト */
    RANKS: ['E', 'D', 'C', 'B', 'A', 'S'],

    // -------------------------------------------------------------------------
    // バトル設定
    // -------------------------------------------------------------------------
    /** 
     * バトルシステムに関する定数
     */
    BATTLE: {
        GRID_SIZE: 90,
        DAMAGE_BASE: 0.8,
        DAMAGE_RANDOM: 0.4,
        COUNTER_RATE: 0.7,
        XP: {
            ATTACK: 10,
            KILL: 20,
            COUNTER: 5
        }
    },

    // -------------------------------------------------------------------------
    // AI設定
    // -------------------------------------------------------------------------
    /**
     * AIの行動パラメータ
     */
    AI: {
        RECRUIT_URGE: {
            HIGH: 1.0,
            MED: 0.9,
            LOW: 0.7
        },
        DEFENSE: {
            DIST: 200,
            ALLY_THRESHOLD: 2
        },
        INVADE_CHANCE: 0.3
    },

    // -------------------------------------------------------------------------
    // UI/操作設定
    // -------------------------------------------------------------------------
    /**
     * UI操作の判定パラメータ
     */
    UI: {
        CLICK_RADIUS: 30,
        CASTLE_DETECT_RADIUS: 40,
        UNIT_DETECT_RADIUS: 45,
        BATTLE_TRIGGER_PIXELS: 50
    },

    // -------------------------------------------------------------------------
    // マスター（主人公）定義
    // -------------------------------------------------------------------------
    MASTERS: [
        { id: 'knight', name: 'ジーク', alignment: 'LAW', color: '#4466ff', emoji: '🏰', desc: '聖騎士。防御と近接戦闘に優れるバランス型。' },
        { id: 'mage', name: 'アーシェ', alignment: 'NEUTRAL', color: '#44ff66', emoji: '🧝', desc: '女王。遠距離魔法と機動力を持つエルフ軍。' },
        { id: 'demon', name: 'クリムゾン', alignment: 'CHAOS', color: '#ff4444', emoji: '👹', desc: '魔王。圧倒的な攻撃力で敵を粉砕する。' }
    ],

    // -------------------------------------------------------------------------
    // 勢力固有ユニット
    // -------------------------------------------------------------------------
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
            { id: 'dragon', name: '竜', emoji: '🐉', hp: 75, atk: 25, range: 1, move: 6, cost: 1000 }
        ]
    },

    // -------------------------------------------------------------------------
    // マップテンプレート
    // -------------------------------------------------------------------------
    MAP_TEMPLATES: [
        {
            id: 'classic', name: 'バハムート大陸 (Classic)', desc: '標準的なバランスの初期マップです。',
            castles: [
                { id: 'c1', name: '王都', x: 215, y: 290, owner: 'player', captureBonus: 0, income: 500, uniqueUnit: null, neighbors: ['c3', 'c7', 'c8'] },
                { id: 'c2', name: '暗黒城', x: 780, y: 640, owner: 'enemy', captureBonus: 2000, income: 500, uniqueUnit: 'hell-hound', neighbors: ['c3', 'c5', 'c6', 'c9'] },
                { id: 'c6', name: '東の塔', x: 850, y: 330, owner: 'enemy2', captureBonus: 800, income: 300, uniqueUnit: 'sorcerer', neighbors: ['c2', 'c4', 'c9'] },
                { id: 'c3', name: '自由都市', x: 470, y: 375, owner: 'neutral', captureBonus: 500, income: 400, uniqueUnit: 'guard', neighbors: ['c1', 'c2', 'c4', 'c5', 'c9'] },
                { id: 'c4', name: '北の砦', x: 700, y: 160, owner: 'neutral', captureBonus: 350, income: 200, uniqueUnit: 'crossbow', neighbors: ['c3', 'c6', 'c8'] },
                { id: 'c5', name: '南の村', x: 535, y: 540, owner: 'neutral', captureBonus: 200, income: 150, uniqueUnit: 'militia', neighbors: ['c2', 'c3', 'c10'] },
                { id: 'c7', name: '西の廃墟', x: 145, y: 420, owner: 'neutral', captureBonus: 400, income: 100, uniqueUnit: 'ghost', neighbors: ['c1', 'c10'] },
                { id: 'c8', name: '隠れ里', x: 275, y: 15, owner: 'neutral', captureBonus: 300, income: 200, uniqueUnit: 'ninja', neighbors: ['c1', 'c4'] },
                { id: 'c9', name: '魔法の泉', x: 650, y: 315, owner: 'neutral', captureBonus: 600, income: 300, uniqueUnit: 'witch', neighbors: ['c3', 'c2', 'c6'] },
                { id: 'c10', name: '忘却の地', x: 240, y: 680, owner: 'neutral', captureBonus: 500, income: 100, uniqueUnit: 'skeleton', neighbors: ['c7', 'c5'] }
            ]
        },
        {
            id: 'islands', name: '群島諸国 (Islands)', desc: '細長いルートで構成された機動力が試されるマップ。',
            castles: [
                { id: 'c1', name: '王都', x: 290, y: 290, owner: 'player', captureBonus: 0, income: 500, uniqueUnit: null, neighbors: ['c3', 'c10'] },
                { id: 'c2', name: '影の島', x: 700, y: 450, owner: 'enemy', captureBonus: 2000, income: 500, uniqueUnit: 'hell-hound', neighbors: ['c5', 'c9'] },
                { id: 'c5', name: '炎の運河', x: 560, y: 420, owner: 'neutral', captureBonus: 300, income: 300, uniqueUnit: 'sorcerer', neighbors: ['c2', 'c4', 'c8'] },
                { id: 'c3', name: '風の関所', x: 410, y: 120, owner: 'neutral', captureBonus: 300, income: 200, uniqueUnit: 'crossbow', neighbors: ['c1', 'c4', 'c7', 'c8'] },
                { id: 'c4', name: '中央島', x: 530, y: 260, owner: 'neutral', captureBonus: 600, income: 400, uniqueUnit: 'guard', neighbors: ['c3', 'c5', 'c6'] },
                { id: 'c6', name: '境界の門', x: 730, y: 90, owner: 'enemy2', captureBonus: 400, income: 250, uniqueUnit: 'pirate', neighbors: ['c4', 'c7'] },
                { id: 'c7', name: '北の岩礁', x: 570, y: 30, owner: 'neutral', captureBonus: 200, income: 150, uniqueUnit: 'siren', neighbors: ['c3', 'c6'] },
                { id: 'c8', name: '南珊瑚', x: 300, y: 530, owner: 'neutral', captureBonus: 200, income: 150, uniqueUnit: 'merman', neighbors: ['c3', 'c5'] },
                { id: 'c9', name: '海底神殿', x: 730, y: 610, owner: 'neutral', captureBonus: 1000, income: 400, uniqueUnit: 'kraken', neighbors: ['c2'] },
                { id: 'c10', name: '商人の島', x: 255, y: 100, owner: 'neutral', captureBonus: 500, income: 300, uniqueUnit: 'thief', neighbors: ['c1'] }
            ]
        },
        {
            id: 'ring', name: '環状大陸 (Ring)', desc: '拠点が輪のように繋がった特殊なマップ。',
            castles: [
                { id: 'c1', name: '王都', x: 490, y: 100, owner: 'player', captureBonus: 0, income: 500, uniqueUnit: null, neighbors: ['c3', 'c4', 'c8'] },
                { id: 'c2', name: '暗黒城', x: 510, y: 600, owner: 'enemy', captureBonus: 2000, income: 500, uniqueUnit: 'hell-hound', neighbors: ['c5', 'c6', 'c9'] },
                { id: 'c3', name: '東の港', x: 650, y: 200, owner: 'enemy2', captureBonus: 400, income: 300, uniqueUnit: 'pirate', neighbors: ['c1', 'c5', 'c7'] },
                { id: 'c4', name: '西の砦', x: 245, y: 325, owner: 'neutral', captureBonus: 400, income: 200, uniqueUnit: 'dwarf', neighbors: ['c1', 'c6', 'c7'] },
                { id: 'c5', name: '南東の平原', x: 750, y: 380, owner: 'neutral', captureBonus: 400, income: 200, uniqueUnit: 'berserker', neighbors: ['c3', 'c2', 'c10'] },
                { id: 'c6', name: '南西の森', x: 270, y: 485, owner: 'neutral', captureBonus: 400, income: 200, uniqueUnit: 'fenrir', neighbors: ['c4', 'c2'] },
                { id: 'c7', name: '中央島', x: 475, y: 350, owner: 'neutral', captureBonus: 800, income: 400, uniqueUnit: 'ancient-dragon', neighbors: ['c3', 'c4', 'c8', 'c9'] },
                { id: 'c8', name: '北の関門', x: 490, y: 240, owner: 'neutral', captureBonus: 300, income: 150, uniqueUnit: 'golem', neighbors: ['c1', 'c7'] },
                { id: 'c9', name: '南の関門', x: 500, y: 500, owner: 'neutral', captureBonus: 300, income: 150, uniqueUnit: 'golem', neighbors: ['c2', 'c7'] },
                { id: 'c10', name: '離れ小島', x: 850, y: 680, owner: 'neutral', captureBonus: 500, income: 300, uniqueUnit: 'griffin', neighbors: ['c5'] }
            ]
        }
    ],

    // -------------------------------------------------------------------------
    // 特殊/拠点固有ユニット定義
    // -------------------------------------------------------------------------
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
        'fenrir': { id: 'fenrir', name: '魔狼', emoji: '🐺', hp: 55, atk: 24, range: 1, move: 6, cost: 650, origin: '南西の森' },
        'ninja': { id: 'ninja', name: '忍者', emoji: '🥷', hp: 35, atk: 25, range: 2, move: 5, cost: 700, origin: '隠れ里' },
        'witch': { id: 'witch', name: '魔女', emoji: '🧙‍♀️', hp: 30, atk: 26, range: 3, move: 3, cost: 650, origin: '魔法の泉' },
        'skeleton': { id: 'skeleton', name: '骸骨兵', emoji: '💀', hp: 30, atk: 15, range: 1, move: 2, cost: 150, origin: '忘却の地' },
        'siren': { id: 'siren', name: 'セイレーン', emoji: '🧜‍♀️', hp: 40, atk: 20, range: 2, move: 4, cost: 500, origin: '北の岩礁' },
        'merman': { id: 'merman', name: 'マーマン', emoji: '🧜‍♂️', hp: 50, atk: 22, range: 1, move: 4, cost: 450, origin: '南珊瑚' },
        'kraken': { id: 'kraken', name: 'クラーケン', emoji: '🦑', hp: 120, atk: 35, range: 2, move: 2, cost: 1500, origin: '海底神殿' },
        'thief': { id: 'thief', name: '盗賊', emoji: '🦹', hp: 30, atk: 18, range: 1, move: 5, cost: 300, origin: '商人の島' },
        'ancient-dragon': { id: 'ancient-dragon', name: '古竜', emoji: '🐲', hp: 150, atk: 40, range: 2, move: 4, cost: 2000, origin: '中央塔' },
        'golem': { id: 'golem', name: 'ゴーレム', emoji: '🗿', hp: 100, atk: 30, range: 1, move: 2, cost: 900, origin: '関門' },
        'griffin': { id: 'griffin', name: 'グリフォン', emoji: '🦅', hp: 70, atk: 28, range: 1, move: 6, cost: 850, origin: '離れ小島' }
    }
};
window.Data = Data;
