/*
 * Possible optimizations
 * - Use typeof and check for whether you have the room name or room object so you don't have to retrieve it again (not sure if this will make a difference)
 * - Store creep's current work move/action target so they don't have to re-search for it every tick
 */

/*
 * Possible additions
 * - Need to add in the roads for the harvesters and whatnot, once the main 20 roads around the bunker is done
 * - Disater recovery - Make sure that even after adding extensions, if everyone is dead, don't use them all, instead only use the spawn energy
 * - Remote harvesting - Bottom room especially looks nice
 * - Max work - Static harvesters will get all energy available with 5 work parts, that needs to be implemented, as well as any others.
 */

// misc
require("version");
require("constants");
let updatePrototypes = require("utilities/updatePrototypes");

// utilities
let roomUtilities = require("utilities/room");
let creepUtilities = require("utilities/creep");

// managers
let roomManager = require("managers/room");
let creepManager = require("managers/creep");

module.exports.loop = function () {
	// Add a command to console (checkRoom)
	global.checkRoom = roomUtilities.displayRoomPlan;

	updatePrototypes();

	if (!Memory.SCRIPT_VERSION || Memory.SCRIPT_VERSION != SCRIPT_VERSION) {
		Memory.SCRIPT_VERSION = SCRIPT_VERSION;
		console.log("New code uplodated");
	}

	// Priority order
	// 0. Visuals (should have no effect on CPU)
	// 1. Creeps
	// 2. Spawns (Life & Death)
	// 3. Towers
	// 4. Room plan

	Memory.creepIn = spawnFrequency - (Game.time % spawnFrequency);

	roomManager.runVisuals();

	creepManager.runCreeps();

	creepUtilities.clearDeadCreeps();

	roomManager.runTowers();

	// TODO: change creep spawning to loop over spawners instead of looping over roles, each spawner can loop over roles individually
	// only try and make new creeps every once in a while
	if (Game.time % spawnFrequency == 0) creepManager.createCreeps();

	if (Game.cpu.bucket == 10000) {
		Game.cpu.generatePixel();
	}
};
