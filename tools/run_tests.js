/**
 * Node.js Test Runner for Legend of Bahamut
 * Execute with: node tools/run_tests.js
 */

// 1. Mock Browser Environment
global.window = global;
global.performance = { now: () => Date.now() };

// Mock DOM
global.document = {
    getElementById: (id) => ({
        style: {},
        classList: { add: () => { }, remove: () => { } },
        innerText: '',
        innerHTML: ''
    }),
    createElement: (tag) => ({
        style: {},
        classList: { add: () => { }, remove: () => { } },
        appendChild: () => { },
        onclick: null
    })
};

// Mock View (since we don't want to load view.js which has heavy DOM logic)
global.View = {
    showMessage: (msg) => console.log(`[View Message] ${msg}`),
    renderBaseMenu: () => { },
    updateBattleUI: () => { },
    changeScreen: () => { },
    canvas: { getBoundingClientRect: () => ({ left: 0, top: 0 }) }
};

// 2. Load Game Modules
const fs = require('fs');
const path = require('path');

function loadScript(filename) {
    const filePath = path.join(__dirname, '..', 'js', filename);
    const content = fs.readFileSync(filePath, 'utf8');
    // Basic wrapper to execute in global context
    eval(content);
}

console.log("Loading Game Modules...");
loadScript('data.js');
console.log("- Data loaded");
loadScript('model.js');
console.log("- Model loaded");

// We might want to mock Controller too if we're unit testing logic,
// but let's try to mock dependencies and load basic Controller methods if needed.
// For now, let's assume tests primarily target Model.
// If tests need Controller, we can load it, but it might error on DOM access.
// Let's Mock Controller for Model tests.
global.Controller = {
    // Mock methods if needed by Model? Model usually doesn't call Controller.
};

loadScript('tests.js');
console.log("- Tests loaded");

// 3. Execution
(async () => {
    try {
        console.log("\nStarting Tests...\n");
        await window.TestRunner.runAll();
    } catch (e) {
        console.error("Test Execution Failed:", e);
    }
})();
