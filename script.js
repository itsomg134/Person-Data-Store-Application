// Game State
let gameState = {
    player: {
        health: 100,
        maxHealth: 100,
        sanity: 100,
        maxSanity: 100,
        gold: 500,
        demonsCaptured: 0
    },
    currentDemon: null,
    contractCount: 1,
    isGameOver: false,
    isCombatActive: false
};

// Demon Database
const demonTypes = [
    {
        id: 1,
        name: "Shadow Imp",
        type: "Lesser Demon",
        baseHealth: 80,
        weakness: "Holy",
        icon: "fas fa-ghost",
        sanityDrain: 5,
        killReward: 150,
        captureDifficulty: 30
    },
    {
        id: 2,
        name: "Hell Knight",
        type: "Greater Demon",
        baseHealth: 150,
        weakness: "Ice",
        icon: "fas fa-helmet-battle",
        sanityDrain: 10,
        killReward: 300,
        captureDifficulty: 50
    },
    {
        id: 3,
        name: "Soul Weaver",
        type: "Greater Demon",
        baseHealth: 120,
        weakness: "Fire",
        icon: "fas fa-spider",
        sanityDrain: 8,
        killReward: 250,
        captureDifficulty: 40
    },
    {
        id: 4,
        name: "Void Stalker",
        type: "Archdemon",
        baseHealth: 200,
        weakness: "Light",
        icon: "fas fa-eye",
        sanityDrain: 15,
        killReward: 500,
        captureDifficulty: 70
    }
];

// Weakness icons mapping
const weaknessIcons = {
    "Holy": "fas fa-sun",
    "Ice": "fas fa-snowflake",
    "Fire": "fas fa-fire",
    "Light": "fas fa-star"
};

// Inventory
let inventory = {
    holyWater: 3,
    bindingCircles: 2,
    sanityPotions: 1
};

// Codex entries
let codex = [];

// DOM Elements
const healthValue = document.getElementById('healthValue');
const healthFill = document.getElementById('healthFill');
const sanityValue = document.getElementById('sanityValue');
const sanityFill = document.getElementById('sanityFill');
const goldValue = document.getElementById('goldValue');
const capturedValue = document.getElementById('capturedValue');

const demonName = document.getElementById('demonName');
const demonType = document.getElementById('demonType');
const demonHealthValue = document.getElementById('demonHealthValue');
const demonHealthFill = document.getElementById('demonHealthFill');
const demonWeakness = document.getElementById('demonWeakness');
const sanityDrainValue = document.getElementById('sanityDrainValue');
const demonIcon = document.getElementById('demonIcon');

const attackBtn = document.getElementById('attackBtn');
const captureBtn = document.getElementById('captureBtn');
const executeBtn = document.getElementById('executeBtn');
const nextBtn = document.getElementById('nextBtn');

const combatLog = document.getElementById('combatLog');

const holyWaterCount = document.getElementById('holyWaterCount');
const bindingCircleCount = document.getElementById('bindingCircleCount');
const potionCount = document.getElementById('potionCount');

const codexEntries = document.getElementById('codexEntries');

const contractText = document.getElementById('contractText');
const contractReward = document.getElementById('contractReward');

const gameOverModal = document.getElementById('gameOverModal');
const victoryModal = document.getElementById('victoryModal');
const restartBtn = document.getElementById('restartBtn');
const nextContractBtn = document.getElementById('nextContractBtn');

// Initialize Game
function initGame() {
    updatePlayerUI();
    generateNewContract();
    updateInventoryUI();
}

// Generate new demon contract
function generateNewContract() {
    const demonIndex = Math.floor(Math.random() * demonTypes.length);
    const demon = {...demonTypes[demonIndex]};
    
    // Add some variation to health
    demon.health = demon.baseHealth + Math.floor(Math.random() * 20);
    demon.maxHealth = demon.health;
    
    gameState.currentDemon = demon;
    gameState.isCombatActive = true;
    
    updateDemonUI();
    enableButtons();
    
    contractText.textContent = `Contract #${gameState.contractCount}: Eliminate the ${demon.name} haunting the forbidden ruins`;
    contractReward.textContent = demon.killReward;
    
    addToLog(`Contract accepted: Hunt the ${demon.name}`);
    addToLog(`Weakness detected: ${demon.weakness}`);
    addToLog("Prepare for battle!");
}

// Update player UI
function updatePlayerUI() {
    const player = gameState.player;
    
    healthValue.textContent = player.health;
    healthFill.style.width = `${(player.health / player.maxHealth) * 100}%`;
    
    sanityValue.textContent = player.sanity;
    sanityFill.style.width = `${(player.sanity / player.maxSanity) * 100}%`;
    
    goldValue.textContent = player.gold;
    capturedValue.textContent = player.demonsCaptured;
}

// Update demon UI
function updateDemonUI() {
    const demon = gameState.currentDemon;
    if (!demon) return;
    
    demonName.textContent = demon.name;
    demonType.textContent = `Type: ${demon.type}`;
    demonHealthValue.textContent = `${demon.health}/${demon.maxHealth}`;
    demonHealthFill.style.width = `${(demon.health / demon.maxHealth) * 100}%`;
    
    const weaknessIcon = weaknessIcons[demon.weakness] || "fas fa-question";
    demonWeakness.innerHTML = `<i class="${weaknessIcon}"></i> ${demon.weakness}`;
    
    sanityDrainValue.textContent = demon.sanityDrain;
    demonIcon.innerHTML = `<i class="${demon.icon}"></i>`;
}

// Update inventory UI
function updateInventoryUI() {
    holyWaterCount.textContent = inventory.holyWater;
    bindingCircleCount.textContent = inventory.bindingCircles;
    potionCount.textContent = inventory.sanityPotions;
}

// Add message to combat log
function addToLog(message) {
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.textContent = `[${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}] ${message}`;
    
    combatLog.appendChild(logEntry);
    combatLog.scrollTop = combatLog.scrollHeight;
}

// Enable/disable buttons based on game state
function enableButtons() {
    const demon = gameState.currentDemon;
    if (!demon) return;
    
    attackBtn.disabled = false;
    
    // Enable capture if demon health < 20% and player has binding circles
    if (demon.health <= demon.maxHealth * 0.2 && inventory.bindingCircles > 0) {
        captureBtn.disabled = false;
    } else {
        captureBtn.disabled = true;
    }
    
    // Enable execute if demon health < 30%
    executeBtn.disabled = !(demon.health <= demon.maxHealth * 0.3);
}

// Player attack
function playerAttack() {
    if (!gameState.currentDemon || gameState.isGameOver) return;
    
    const demon = gameState.currentDemon;
    const player = gameState.player;
    
    // Calculate damage (affected by sanity)
    let baseDamage = 15 + Math.floor(Math.random() * 10);
    if (player.sanity < 30) {
        baseDamage = Math.floor(baseDamage * 0.7);
        addToLog("Low sanity! Damage reduced.");
    }
    
    // Check for critical hit (5% chance)
    const isCritical = Math.random() < 0.05;
    if (isCritical) {
        baseDamage *= 2;
        addToLog("CRITICAL HIT!");
    }
    
    demon.health -= baseDamage;
    if (demon.health < 0) demon.health = 0;
    
    addToLog(`You attack for ${baseDamage} damage!`);
    
    // Demon drains sanity
    player.sanity -= demon.sanityDrain;
    if (player.sanity < 0) player.sanity = 0;
    
    addToLog(`${demon.name} drains ${demon.sanityDrain} sanity.`);
    
    // Demon counterattack (30% chance)
    if (demon.health > 0 && Math.random() < 0.3) {
        const demonDamage = 5 + Math.floor(Math.random() * 10);
        player.health -= demonDamage;
        if (player.health < 0) player.health = 0;
        
        addToLog(`${demon.name} counterattacks for ${demonDamage} damage!`);
    }
    
    updatePlayerUI();
    updateDemonUI();
    enableButtons();
    
    // Check for demon defeat
    if (demon.health <= 0) {
        demonDefeated('killed');
    }
    
    // Check for player defeat
    checkGameOver();
}

// Attempt to capture demon
function attemptCapture() {
    const demon = gameState.currentDemon;
    const player = gameState.player;
    
    if (!demon || inventory.bindingCircles <= 0) return;
    
    // Use a binding circle
    inventory.bindingCircles--;
    
    // Calculate capture chance
    const captureChance = 60 - demon.captureDifficulty + (player.sanity > 50 ? 20 : 0);
    const roll = Math.random() * 100;
    
    if (roll <= captureChance) {
        // Capture successful
        addToLog(`You successfully capture the ${demon.name}!`);
        
        // Add to codex
        addToCodex(demon);
        player.demonsCaptured++;
        
        demonDefeated('captured');
    } else {
        // Capture failed
        addToLog(`Capture failed! The ${demon.name} breaks free!`);
        
        // Demon gets enraged
        const rageDamage = 10 + Math.floor(Math.random() * 10);
        player.health -= rageDamage;
        addToLog(`Enraged ${demon.name} attacks for ${rageDamage} damage!`);
        
        updatePlayerUI();
        checkGameOver();
    }
    
    updateInventoryUI();
    enableButtons();
}

// Execute demon (instant kill when low health)
function executeDemon() {
    const demon = gameState.currentDemon;
    
    if (!demon || demon.health > demon.maxHealth * 0.3) return;
    
    addToLog(`You execute the weakened ${demon.name}!`);
    demonDefeated('executed');
}

// Demon defeated handler
function demonDefeated(method) {
    const demon = gameState.currentDemon;
    const player = gameState.player;
    
    gameState.isCombatActive = false;
    
    // Calculate rewards
    let goldEarned = demon.killReward;
    let message = `${demon.name} defeated!`;
    
    if (method === 'captured') {
        goldEarned = Math.floor(demon.killReward * 0.7); // Less gold for capture
        message = `${demon.name} captured and added to Codex!`;
    } else if (method === 'executed') {
        goldEarned = Math.floor(demon.killReward * 1.2); // Bonus for execution
        message = `${demon.name} executed! Bonus gold earned.`;
    }
    
    player.gold += goldEarned;
    
    // Show victory modal
    document.getElementById('victoryMessage').textContent = message;
    document.getElementById('rewardGold').textContent = goldEarned;
    
    if (method === 'captured') {
        document.getElementById('captureRewardText').style.display = 'block';
    } else {
        document.getElementById('captureRewardText').style.display = 'none';
    }
    
    victoryModal.style.display = 'flex';
    playSound('victorySound');
    
    updatePlayerUI();
    disableButtons();
}

// Add demon to codex
function addToCodex(demon) {
    const demonEntry = {
        name: demon.name,
        type: demon.type,
        weakness: demon.weakness,
        dateCaptured: new Date().toLocaleDateString()
    };
    
    codex.push(demonEntry);
    updateCodexUI();
}

// Update codex UI
function updateCodexUI() {
    codexEntries.innerHTML = '';
    
    if (codex.length === 0) {
        codexEntries.innerHTML = '<div class="empty-codex">No demons captured yet</div>';
        return;
    }
    
    codex.forEach(entry => {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'demon-entry';
        entryDiv.innerHTML = `
            <h4>${entry.name}</h4>
            <p>Type: ${entry.type}</p>
            <p>Weakness: ${entry.weakness}</p>
            <p>Captured: ${entry.dateCaptured}</p>
        `;
        codexEntries.appendChild(entryDiv);
    });
}

// Check for game over
function checkGameOver() {
    const player = gameState.player;
    
    if (player.health <= 0) {
        gameOver("Your health has reached zero. The darkness consumes you...");
    } else if (player.sanity <= 0) {
        gameOver("Your sanity has broken. You become one with the madness...");
    }
}

// Game over handler
function gameOver(message) {
    gameState.isGameOver = true;
    document.getElementById('gameOverMessage').textContent = message;
    gameOverModal.style.display = 'flex';
    disableButtons();
}

// Disable all action buttons
function disableButtons() {
    attackBtn.disabled = true;
    captureBtn.disabled = true;
    executeBtn.disabled = true;
}

// Play sound effect
function playSound(soundId) {
    const sound = document.getElementById(soundId);
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log("Audio play failed:", e));
    }
}

// Restart game
function restartGame() {
    gameState = {
        player: {
            health: 100,
            maxHealth: 100,
            sanity: 100,
            maxSanity: 100,
            gold: 500,
            demonsCaptured: 0
        },
        currentDemon: null,
        contractCount: 1,
        isGameOver: false,
        isCombatActive: false
    };
    
    inventory = {
        holyWater: 3,
        bindingCircles: 2,
        sanityPotions: 1
    };
    
    codex = [];
    
    gameOverModal.style.display = 'none';
    victoryModal.style.display = 'none';
    
    updatePlayerUI();
    updateCodexUI();
    updateInventoryUI();
    
    generateNewContract();
}

// Next contract
function nextContract() {
    victoryModal.style.display = 'none';
    gameState.contractCount++;
    
    // Restore some sanity
    gameState.player.sanity = Math.min(gameState.player.sanity + 20, gameState.player.maxSanity);
    
    // Small chance to find items
    if (Math.random() < 0.3) {
        inventory.bindingCircles++;
        addToLog("Found a Binding Circle while exploring!");
    }
    
    updatePlayerUI();
    updateInventoryUI();
    generateNewContract();
}

// Event