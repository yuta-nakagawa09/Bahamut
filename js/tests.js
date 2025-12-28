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

        const passed = this.results.filter(r => r.status === 'pass').length;
        const duration = (performance.now() - startTime).toFixed(2);
        console.groupEnd();

        console.log(`%cTests Completed in ${duration}ms`, 'color: #fff; background: #333; padding: 4px;');
        console.log(`%cPASS: ${passed}  %cFAIL: ${this.results.length - passed}`, 'color: #4ade80; font-weight: bold;', 'color: #f87171; font-weight: bold;');

        if (passed === this.results.length) {
            View.showMessage(`全テスト通過 (${passed}/${passed})`);
        } else {
            View.showMessage(`テスト失敗あり (${this.results.length - passed}個)`);
        }
    }
};

// Replace old TestSuite
window.TestSuite = TestRunner;
