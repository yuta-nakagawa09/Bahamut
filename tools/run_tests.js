/**
 * Node.js Test Runner for Legend of Bahamut
 * Execute with: node tools/run_tests.js
 */

// 1. Mock Browser Environment
global.window = global;
global.performance = { now: () => Date.now() };

// Basic DOM Mock for Testing View logic
const pseudoDOM = {};
class Element {
    constructor(tag) {
        this.tagName = tag;
        this.style = {};
        this.classList = { add: () => { }, remove: () => { } };
        this.children = [];
        this._innerHTML = '';
        this.id = '';
    }
    appendChild(child) {
        this.children.push(child);
        if (child.id) pseudoDOM[child.id] = child;
    }
    remove() {
        if (this.id) delete pseudoDOM[this.id];
    }
    get innerHTML() { return this._innerHTML; }
    set innerHTML(val) {
        this._innerHTML = val;
        // Simple parser to populate children for verification (very basic)
        // For renderMasterSelect test, we just check if children count matches Data.MASTERS length
        // We can simulate children creation by simple parsing or just trust string check.
        // Update: The test checks container.children.length. So we need to populate children based on innerHTML assignment!
        // This is hard without a real parser. 
        // Hack: For testing purposes, we assume renderMasterSelect sets innerHTML with N divs.
        this.children = [];
        const matches = val.match(/<div/g);
        if (matches) {
            for (let i = 0; i < matches.length; i++) {
                const child = new Element('div');
                // Extract content for "includes" check
                child._innerHTML = val;
                this.children.push(child);
            }
        }
    }
}

global.document = {
    getElementById: (id) => pseudoDOM[id] || null,
    createElement: (tag) => new Element(tag),
    body: new Element('body'),
    querySelectorAll: (sel) => [],
    querySelector: (sel) => null
};

// Add required elements for View to function without crashing
pseudoDOM['message-text'] = new Element('div');
pseudoDOM['turn-indicator'] = new Element('div');
pseudoDOM['btn-end-strategic-turn'] = new Element('div');
pseudoDOM['save-load-group'] = new Element('div');
pseudoDOM['base-menu'] = new Element('div');
pseudoDOM['screen-map'] = new Element('div');
pseudoDOM['screen-battle'] = new Element('div');
pseudoDOM['screen-title'] = new Element('div');
pseudoDOM['screen-master-select'] = new Element('div');
// ... add others if needed, but View.showMessage checks message-text


// 2. Load Game Modules
const fs = require('fs');
const path = require('path');

function loadScript(filename) {
    const filePath = path.join(__dirname, '..', 'js', filename);
    const content = fs.readFileSync(filePath, 'utf8');
    eval(content);
}

console.log("Loading Game Modules...");
loadScript('data.js');
console.log("- Data loaded");
loadScript('model.js');
console.log("- Model loaded");
loadScript('view.js'); // NOW LOADING VIEW
console.log("- View loaded");
loadScript('battle.js');
console.log("- BattleSystem loaded");
loadScript('ai.js');
console.log("- StrategicAI loaded");

global.Controller = {
    // Basic mock for View calls
    createGame: () => { }
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
