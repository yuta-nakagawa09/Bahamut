/**
 * DATA: ゲーム内の静的データ定義
 * ゲームバランス、ユニット、マップなどの定数を管理するオブジェクト。
 * パラメータを調整することでゲームの難易度や挙動を変更できます。
 * @namespace
 */
window.Data = {
    // -------------------------------------------------------------------------
    // 基本設定定数
    // -------------------------------------------------------------------------
    /** @type {number} 1部隊あたりの最大ユニット数 (最大5体) */
    MAX_UNITS: 5,
    /** @type {number} 1勢力あたりの最大部隊数 (プレイヤー・AI共通) */
    MAX_ARMIES: 5,
    /** 
     * @type {number} 新規部隊（Army）を作成する際の基本コスト 
     * ※現在は使用されていない可能性がありますが、将来的な拡張のために予約されています
     */
    ARMY_COST: 500,
    /** @type {number} ユニットの移動アニメーション速度 (値が大きいほど遅い) */
    UNIT_SPEED: 10.0,
    /** @type {number} ランクアップ（レベルアップ）に必要な経験値 */
    RANK_UP_XP: 50,
    /** @type {string[]} ランクの表示名リスト (0=E, 1=D, ..., 5=S) */
    RANKS: ['E', 'D', 'C', 'B', 'A', 'S'],

    /** @type {string} 通貨単位 */
    CURRENCY_UNIT: 'G',

    /**
     * ユニット強化（Enhancement）の設定
     * 部隊メニューから実行できる個体強化のコストと上昇値
     */
    ENHANCEMENT: {
        /** HP強化: コスト100GでHP+10 */
        HP: { COST: 100, VALUE: 10 },
        /** 攻撃力強化: コスト150GでATK+3 */
        ATK: { COST: 150, VALUE: 3 }
    },

    // -------------------------------------------------------------------------
    // 勢力定義 (Faction)
    // -------------------------------------------------------------------------
    /**
     * ゲームに登場する勢力の基本定義
     * id: 内部識別子
     * name: 表示名
     * defaultHq: マップデータ内でHQが指定されていない場合のデフォルト拠点ID
     * color: 勢力カラー (プレイヤーの場合はマスター選択に依存)
     * masterId: デフォルトのマスターID (プレイヤーは選択可能)
     */
    FACTIONS: [
        { id: 'player', name: 'プレイヤー王国', defaultHq: 'c1' },
        { id: 'enemy', name: '暗黒帝国', color: '#ff0000', masterId: 'demon', defaultHq: 'c2' },
        { id: 'enemy2', name: '東方同盟', color: '#aa00aa', masterId: 'mage', defaultHq: 'c6' }
    ],

    // -------------------------------------------------------------------------
    // バトル設定
    // -------------------------------------------------------------------------
    /** 
     * バトルシステムに関する定数
     * 戦闘計算式や経験値の取得量などを定義します。
     */
    BATTLE: {
        /** @type {number} バトルグリッドの1マスのサイズ(px) */
        GRID_SIZE: 90,
        /** @type {number} ダメージ計算の基本計数 (攻撃力 * DAMAGE_BASE) */
        DAMAGE_BASE: 0.8,
        /** @type {number} ダメージの乱数幅 (攻撃力 * DAMAGE_RANDOM の範囲で変動) */
        DAMAGE_RANDOM: 0.4,
        /** @type {number} 反撃時のダメージ倍率 (通常攻撃の0.7倍など) */
        COUNTER_RATE: 0.7,
        /** @type {number} ランクアップ時の能力上昇率 (20%) */
        RANK_UP_RATE: 0.2,
        /** 
         * 獲得経験値設定
         */
        XP: {
            ATTACK: 10,  // 攻撃した時
            KILL: 20,    // 敵を倒した時
            COUNTER: 5   // 反撃した時
        }
    },

    // -------------------------------------------------------------------------
    // AI設定
    // -------------------------------------------------------------------------
    /**
     * AI（敵思考ルーチン）の行動制御パラメータ
     */
    AI: {
        /**
         * 部隊の補充・回復に関する設定
         */
        RECRUIT: {
            /** (未使用) 雇用欲求度の定義 */
            URGE: { HIGH: 1.0, MED: 0.9, LOW: 0.7 },
            /** 雇用を行うための最低所持金 */
            MIN_GOLD: 300,
            /** 「金持ち」と判定する所持金ライン (これを超えると高確率で雇用する) */
            RICH_GOLD: 1000,
            /** 金持ち時の雇用確率 */
            CHANCE_HIGH: 0.9,
            /** 通常時の雇用確率 */
            CHANCE_LOW: 0.5
        },
        /**
         * 防衛行動に関する設定
         */
        DEFENSE: {
            /** 敵部隊の接近を検知する距離 (この範囲に敵がいると警戒する) */
            DIST: 200,
            /** 防衛に必要な味方部隊数のしきい値 (これ未満だと防衛に戻ろうとする) */
            ALLY_THRESHOLD: 2,
            /** 本拠地防衛判定における「本拠地周辺」の半径 */
            RADIUS_HQ: 50,
            /** 部隊が「安全圏（本拠地）」から離れているとみなす距離 */
            SAFE_DIST: 50
        },
        /** 侵攻確率: 隣接拠点へ移動（攻撃）を開始する基本確率 */
        INVADE_CHANCE: 0.3
    },

    // -------------------------------------------------------------------------
    // UI/操作設定
    // -------------------------------------------------------------------------
    /**
     * UI操作の判定パラメータ
     * マウス操作やタッチ操作の判定範囲などを定義
     */
    UI: {
        /** クリック判定の許容誤差半径 */
        CLICK_RADIUS: 30,
        /** 拠点の選択判定半径 */
        CASTLE_DETECT_RADIUS: 40,
        /** ユニットの選択判定半径 */
        UNIT_DETECT_RADIUS: 45,
        /** バトル画面でのドラッグ＆ドロップ判定距離 */
        BATTLE_TRIGGER_PIXELS: 50
    },

    // -------------------------------------------------------------------------
    // マスター（主人公）定義
    // -------------------------------------------------------------------------
    /**
     * マスター（指導者）のキャラクター定義
     * プレイヤーが選択可能なキャラクターや、敵勢力のリーダーとして使用されます。
     */
    MASTERS: [
        { id: 'knight', name: 'ジーク', alignment: 'LAW', color: '#4466ff', emoji: '🏰', image: 'assets/img/icon_master_fighter.png', colorKey: 'blue', desc: '聖騎士。防御と近接戦闘に優れるバランス型。' },
        { id: 'mage', name: 'アーシェ', alignment: 'NEUTRAL', color: '#44ff66', emoji: '🧝', image: 'assets/img/icon_master_mage.png', colorKey: 'green', desc: '女王。遠距離魔法と機動力を持つエルフ軍。' },
        { id: 'demon', name: 'クリムゾン', alignment: 'CHAOS', color: '#ff4444', emoji: '👹', image: 'assets/img/icon_master_demon.png', colorKey: 'red', desc: '魔王。圧倒的な攻撃力で敵を粉砕する。' }
    ],

    // -------------------------------------------------------------------------
    // 勢力固有ユニット
    // -------------------------------------------------------------------------
    /**
     * 各マスター（勢力）が雇用可能なユニットリスト
     * 配列の0番目が基本ユニット（安価）、1番目以降が上級ユニットとなります。
     */
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
    /**
     * ゲームマップの定義データ
     * 各マップは複数の拠点（Castle）によって構成されます。
     * neighbors配列により、拠点間の移動ルート（つながり）が定義されます。
     */
    MAP_TEMPLATES: [
        {
            id: 'classic', name: 'バハムート大陸 (Classic)', desc: '標準的なバランスの初期マップです。', image: 'assets/img/icon_map_continent.png',
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
            id: 'islands', name: '群島諸国 (Islands)', desc: '細長いルートで構成された機動力が試されるマップ。', image: 'assets/img/icon_map_islands.png',
            castles: [
                { id: 'c1', name: '王都', x: 290, y: 290, owner: 'player', captureBonus: 0, income: 500, uniqueUnit: null, neighbors: ['c3', 'c10'] },
                { id: 'c2', name: '暗黒城', x: 700, y: 450, owner: 'enemy', captureBonus: 2000, income: 500, uniqueUnit: 'hell-hound', neighbors: ['c5', 'c9'] },
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
            id: 'ring', name: '環状大陸 (Ring)', desc: '拠点が輪のように繋がった特殊なマップ。', image: 'assets/img/icon_map_ring.png',
            castles: [
                { id: 'c1', name: '王都', x: 490, y: 100, owner: 'player', captureBonus: 0, income: 500, uniqueUnit: null, neighbors: ['c6', 'c4', 'c8'] },
                { id: 'c2', name: '暗黒城', x: 510, y: 600, owner: 'enemy', captureBonus: 2000, income: 500, uniqueUnit: 'hell-hound', neighbors: ['c5', 'c3', 'c9'] },
                { id: 'c6', name: '東の港', x: 650, y: 200, owner: 'enemy2', captureBonus: 400, income: 300, uniqueUnit: 'pirate', neighbors: ['c1', 'c5', 'c7'] },
                { id: 'c4', name: '西の砦', x: 245, y: 325, owner: 'neutral', captureBonus: 400, income: 200, uniqueUnit: 'dwarf', neighbors: ['c1', 'c3', 'c7'] },
                { id: 'c5', name: '南東の平原', x: 750, y: 380, owner: 'neutral', captureBonus: 400, income: 200, uniqueUnit: 'berserker', neighbors: ['c6', 'c2', 'c10'] },
                { id: 'c3', name: '南西の森', x: 270, y: 485, owner: 'neutral', captureBonus: 400, income: 200, uniqueUnit: 'fenrir', neighbors: ['c4', 'c2'] },
                { id: 'c7', name: '中央島', x: 475, y: 350, owner: 'neutral', captureBonus: 800, income: 400, uniqueUnit: 'ancient-dragon', neighbors: ['c6', 'c4', 'c8', 'c9'] },
                { id: 'c8', name: '北の関門', x: 490, y: 240, owner: 'neutral', captureBonus: 300, income: 150, uniqueUnit: 'golem', neighbors: ['c1', 'c7'] },
                { id: 'c9', name: '南の関門', x: 500, y: 500, owner: 'neutral', captureBonus: 300, income: 150, uniqueUnit: 'golem', neighbors: ['c2', 'c7'] },
                { id: 'c10', name: '離れ小島', x: 850, y: 680, owner: 'neutral', captureBonus: 500, income: 300, uniqueUnit: 'griffin', neighbors: ['c5'] }
            ]
        }
    ],

    // -------------------------------------------------------------------------
    // 特殊/拠点固有ユニット定義
    // -------------------------------------------------------------------------
    /**
     * 特定の拠点を占領することで雇用可能になるユニークユニットの定義
     */
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
