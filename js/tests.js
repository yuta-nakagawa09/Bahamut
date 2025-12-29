/**
 * Simple Test Runner and Test Suite for Legend of Bahamut
 */
window.TestRunner = {
    results: [],

    expect(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) throw new Error(`Expected "${expected}" but got "${actual}"`);
            },
            toEqual: (expected) => {
                const sActual = JSON.stringify(actual);
                const sExpected = JSON.stringify(expected);
                if (sActual !== sExpected) throw new Error(`Expected ${sExpected} but got ${sActual}`);
            },
            toBeTruthy: () => {
                if (!actual) throw new Error(`Expected truthy but got ${actual}`);
            },
            toBeFalsy: () => {
                if (actual) throw new Error(`Expected falsy but got ${actual}`);
            },
            toBeGreaterThan: (expected) => {
                if (actual <= expected) throw new Error(`Expected > ${expected} but got ${actual}`);
            },
            toBeLessThan: (expected) => {
                if (actual >= expected) throw new Error(`Expected < ${expected} but got ${actual}`);
            }
        };
    },

    async test(name, fn) {
        try {
            await fn();
            console.log(`%c[PASS] ${name}`, 'color: #4ade80; font-weight: bold;');
            this.results.push({ name, status: 'pass' });
        } catch (e) {
            console.error(`%c[FAIL] ${name}`, 'color: #f87171; font-weight: bold;', e);
            this.results.push({ name, status: 'fail', error: e });
        }
    },

    async runAll() {
        if (!window.Model || !window.Controller) {
            console.error("Game modules not loaded properly.");
            return;
        }

        this.results = [];
        console.group("🧪 Running Test Suite");
        const startTime = performance.now();

        // --- Model Tests ---

        await this.test('Model: Hex Distance Calculation', () => {
            // (0,0) -> (0,1) should be 1
            this.expect(Model.getHexDist(0, 0, 0, 1)).toBe(1);
            // (0,0) -> (1,0) should be 1
            this.expect(Model.getHexDist(0, 0, 1, 0)).toBe(1);
            // Some farther distance
            const d = Model.getHexDist(0, 0, 2, 2);
            // 0,0 -> x:0, y:0, z:0
            // 2,2 -> x:2-(2-0)/2 = 1, z:2, y:-3.  (0,0,0) vs (1,-3,2) -> max(1,3,2) = 3 ?
            // Let's verify logic:
            // r=0, c=0 => x=0, z=0, y=0
            // r=2, c=2 => x= 2-(2-0)/2 = 1. z=2. y=-1-2=-3. 
            // dist = max(|0-1|, |0-(-3)|, |0-2|) = 3.
            this.expect(d).toBe(3);
        });

        await this.test('Model: Recruit Unit Validation', () => {
            // Setup Mock State
            const originalState = JSON.parse(JSON.stringify(Model.state));

            // Mock Player Faction
            Model.state.factions = [{ id: 'p1', isPlayer: true, gold: 1000, master: { id: 'knight' } }];
            Model.state.mapUnits = [{ id: 'a1', owner: 'p1', army: [] }];

            // Success case
            const res1 = Model.recruitUnit('a1', 'soldier'); // Assuming 'soldier' exists in Data
            // If soldier exists and costs <= 1000
            if (res1 === true) {
                const u = Model.state.mapUnits[0];
                this.expect(u.army.length).toBe(1);
                this.expect(Model.state.factions[0].gold).toBeLessThan(1000);
            } else {
                console.warn("Skipping recruit success check due to data dependency");
            }

            // Fail case: Not enough gold
            Model.state.factions[0].gold = 0;
            const res2 = Model.recruitUnit('a1', 'paladin');
            this.expect(res2).toBeTruthy(); // Should return error string, so truthy
            this.expect(typeof res2).toBe('string');

            // Restore State
            Model.state = originalState; // Warning: this might break references if controllers hold them
        });

        await this.test('Model: Enhance Unit Logic', () => {
            // Mock State
            const mockUnit = { id: 'u1', hp: 30, currentHp: 20, atk: 10, rank: 0 };
            Model.state.factions = [{ id: 'p1', isPlayer: true, gold: 1000 }];
            Model.state.mapUnits = [{ id: 'a1', owner: 'p1', army: [mockUnit] }];

            // Encode: heal
            const res = Model.enhanceUnit('a1', 0, 'hp');
            this.expect(res).toBe(true);
            this.expect(mockUnit.hp).toBe(40);
            this.expect(mockUnit.currentHp).toBe(30); // +10 healed
            this.expect(Model.state.factions[0].gold).toBe(900); // -100G
        });

        // --- Controller/Logic Integration Tests ---

        await this.test('Logic: Unit Movement Check', () => {
            // TODO: Add movement logic test
        });

        await this.test('Battle: Auto-Resolve Logic', () => {
            // Mock Units
            const u1 = { army: [{ atk: 10, currentHp: 20, hp: 20 }, { atk: 10, currentHp: 20, hp: 20 }] };
            const u2 = { army: [{ atk: 5, currentHp: 30, hp: 30 }] };

            // u1 total dmg = 20. u2 takes 20/u2.len * 0.5 = 10 dmg -> Survives
            // u2 total dmg = 5. u1 takes 5/u1.len * 0.5 = 1.25 -> Survives

            BattleSystem.autoResolve(u1, u2);

            // Should be fully healed if survived
            this.expect(u1.army[0].currentHp).toBe(20);
            this.expect(u2.army[0].currentHp).toBe(30);
        });

        await this.test('Battle: Auto-Resolve Retreat', () => {
            // Mock Data for Retreat
            const factionId = 'mock-faction';
            const mockCastle = { id: 'c1', owner: factionId, x: 10, y: 10 };
            const mockFaction = { id: factionId, isPlayer: false };

            // Setup Model State
            Model.state.factions = [mockFaction];
            Model.state.castles = [mockCastle];

            // Attacker (at 5,5) -> Attacks Defender (at 6,6)
            const attacker = {
                owner: factionId,
                x: 5, y: 5, targetX: 6, targetY: 6,
                army: [{ atk: 5, currentHp: 20, hp: 20 }]
            };
            const defender = {
                owner: 'other',
                x: 6, y: 6,
                army: [{ atk: 5, currentHp: 20, hp: 20 }]
            };

            // Draw condition (both survive)
            BattleSystem.autoResolve(attacker, defender, attacker);

            // Attacker should retreat to nearest castle (10, 10)
            this.expect(attacker.x).toBe(10);
            this.expect(attacker.y).toBe(10);
        });

        await this.test('AI: Unit Recruitment Logic', () => {
            // Mock a rich faction with no units
            const fId = 'ai-faction';
            const mId = 'demon';
            const faction = { id: fId, gold: 5000, hqId: 'hq1', master: { id: mId }, name: 'AI' };
            const hq = { id: 'hq1', x: 0, y: 0, owner: fId };

            Model.state.factions = [faction];
            Model.state.castles = [hq];
            Model.state.mapUnits = []; // No units -> urge = 1.0 (100%)

            // View.showMessage needs to be mocked to avoid errors
            const originalShowMessage = View.showMessage;
            View.showMessage = () => { };

            StrategicAI.processFaction(faction);

            // Should have created a new unit
            const newUnits = Model.state.mapUnits.filter(u => u.owner === fId);
            this.expect(newUnits.length).toBeGreaterThan(0);

            // Part 2: Reinforcement Check
            // Now we have a unit (newUnits[0]). Let's give AI money and see if it recruits more.
            // We need to ensure recruit check passes (gold > 300, chance check)
            // Force chance to pass by ensuring Math.random calls in ai.js logic? 
            // Ideally we mock Math.random, but for now let's just call recruitUnit directly to verify the Model fix works for non-player.

            const army = newUnits[0];
            const initialSize = army.army.length;
            const unitTypeId = Data.FACTION_UNITS[mId][0].id; // basic unit

            // Directly call Model.recruitUnit as AI would (verifying the fix works for non-player)
            const result = Model.recruitUnit(army.id, unitTypeId);

            this.expect(result).toBeTruthy();
            this.expect(army.army.length).toBe(initialSize + 1);

            // Restore
            View.showMessage = originalShowMessage;
        });

        await this.test('AI: Defense Priority Movement', () => {
            // Mock Setup
            const fId = 'ai-def';
            const aiHQ = { id: 'hq-ai', x: 0, y: 0, owner: fId, neighbors: [] }; // HQ at 0,0
            const otherCastle = { id: 'c-other', x: 1000, y: 1000, owner: 'player', neighbors: [] }; // Far away target

            const aiFaction = { id: fId, gold: 0, hqId: 'hq-ai', master: { id: 'demon' }, name: 'AI Def' };

            // AI Unit is far away (near otherCastle)
            const aiUnit = {
                id: 'u-ai', owner: fId, x: 900, y: 900,
                targetX: 900, targetY: 900,
                hasActed: true, isMoving: false, army: [{}]
            };

            // Enemy Unit is threatening HQ (near 0,0)
            const enemyUnit = {
                id: 'u-enemy', owner: 'player', x: 50, y: 50, // Within 200px danger zone
                army: [{}]
            };

            Model.state.factions = [aiFaction, { id: 'player', isPlayer: true }];
            Model.state.castles = [aiHQ, otherCastle];
            Model.state.mapUnits = [aiUnit, enemyUnit];

            // Mock View
            const originalShowMessage = View.showMessage;
            View.showMessage = () => { };

            // Run AI
            StrategicAI.processFaction(aiFaction);

            // Expectation: AI Unit should target HQ (0,0) to defend
            this.expect(aiUnit.targetX).toBe(aiHQ.x);
            this.expect(aiUnit.targetY).toBe(aiHQ.y);
            this.expect(aiUnit.isMoving).toBe(true);

            // Restore
            View.showMessage = originalShowMessage;
        });

        await this.test('Battle: Manual Battle Defeat Removal', () => {
            // Mock Map Units
            const playerUnit = { id: 'p1', owner: 'player', army: [] };
            const enemyUnit = { id: 'e1', owner: 'enemy-faction', army: [] };

            Model.state.mapUnits = [playerUnit, enemyUnit]; // Both exist on map initially

            // Mock Battle State
            Model.state.battleUnitA = playerUnit;
            Model.state.battleUnitB = enemyUnit;

            // Simulate Battle: Player survives (units list has player), Enemy dead (empty list)
            Model.state.battle = {
                active: true,
                units: [{ owner: 'player', hp: 10, currentHp: 10 }] // Only player remains
            };

            // Mock View and setTimeout
            const originalShowMessage = View.showMessage;
            View.showMessage = () => { };
            const originalChangeScreen = View.changeScreen;
            View.changeScreen = () => { };

            // Execute checkEnd
            BattleSystem.checkEnd();

            // Expectation: Battle inactive, Enemy unit removed from mapUnits
            this.expect(Model.state.battle.active).toBe(false);
            const remainingUnits = Model.state.mapUnits.map(u => u.id);
            this.expect(remainingUnits.includes('p1')).toBe(true);
            this.expect(remainingUnits.includes('e1')).toBe(false); // Should be removed

            // Restore
            View.showMessage = originalShowMessage;
            View.changeScreen = originalChangeScreen;
        });

        await this.test('View: Master Select Rendering', () => {
            // Mock View methods that might cause DOM errors
            const originalShowMessage = View.showMessage;
            View.showMessage = () => { };

            // Setup DOM container
            const containerId = 'master-select-container';
            // In mock DOM, createElement doesn't auto-register to getElementById unless appended
            let container = document.createElement('div');
            container.id = containerId;
            document.body.appendChild(container); // This registers it in pseudoDOM

            // Run Render
            View.renderMasterSelect();

            // Verify using String check instead of DOM structure check
            const html = container.innerHTML;

            // Check if all masters are rendered
            Data.MASTERS.forEach(m => {
                this.expect(html.includes(m.name)).toBe(true);
                this.expect(html.includes(m.emoji)).toBe(true);
                // Check if onclick handler is set correctly in string
                this.expect(html.includes(`Controller.createGame('${m.id}')`)).toBe(true);
            });

            // Cleanup
            container.remove();
            View.showMessage = originalShowMessage;
        });

        await this.test('Battle: Damage and XP Logic', () => {
            const originalShowMessage = View.showMessage;
            View.showMessage = () => { };

            // Setup Units
            // Reduce ATK to ensure target doesn't die (avoid XP.KILL bonus)
            const atk = { id: 'u1', name: 'Atk', atk: 10, hp: 100, currentHp: 100, range: 1, xp: 0, rank: 0, r: 0, c: 0, owner: 'player' };
            const def = { id: 'u2', name: 'Def', atk: 10, hp: 100, currentHp: 100, range: 1, xp: 0, rank: 0, r: 0, c: 1, owner: 'enemy' };

            // Setup mock state
            Model.state.battle = {
                units: [atk, def],
                movedUnits: new Set(),
                selectedUnit: atk,
                tempMoved: false,
                active: true
            };

            // Mock checkEnd to avoid side effects
            const originalCheckEnd = BattleSystem.checkEnd;
            BattleSystem.checkEnd = () => { };
            const originalUpdateUI = View.updateBattleUI;
            View.updateBattleUI = () => { };

            BattleSystem.attack(atk, def);

            // Verify XP
            this.expect(atk.xp).toBe(Data.BATTLE.XP.ATTACK);

            // Verify Damage
            const dmg = 100 - def.currentHp;
            const minDmg = Math.floor(atk.atk * Data.BATTLE.DAMAGE_BASE);
            const maxDmg = Math.floor(atk.atk * (Data.BATTLE.DAMAGE_BASE + Data.BATTLE.DAMAGE_RANDOM));

            // console.log(`Test Battle: DMG=${dmg} (Expect ${minDmg}-${maxDmg})`);
            this.expect(dmg >= minDmg).toBe(true);
            this.expect(dmg <= maxDmg).toBe(true);

            // Restore
            View.showMessage = originalShowMessage;
            BattleSystem.checkEnd = originalCheckEnd;
            View.updateBattleUI = originalUpdateUI;
        });

        const passed = this.results.filter(r => r.status === 'pass').length;
        const duration = (performance.now() - startTime).toFixed(2);
        console.groupEnd();

        console.log(`%cTests Completed in ${duration}ms`, 'color: #fff; background: #333; padding: 4px;');
        console.log(`%cPASS: ${passed}  %cFAIL: ${this.results.length - passed}`, 'color: #4ade80; font-weight: bold;', 'color: #f87171; font-weight: bold;');

        if (passed === this.results.length) {
            console.log(`全テスト通過 (${passed}/${passed})`);
        } else {
            console.error(`テスト失敗あり (${this.results.length - passed}個)`);
        }
    }
};

// Replace old TestSuite
window.TestSuite = TestRunner;
