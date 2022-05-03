/*
 * Possible optimizations
 * - Use typeof and check for whether you have the room name or room object so you don't have to retrieve it again (not sure if this will make a difference)
 * - Store creep's current work move/action target so they don't have to re-search for it every tick
 */

// misc
let updatePrototypes = require("updatePrototypes");

// utilities
let roomUtilities = require("utilities.room");
let creepUtilities = require("utilities.creep");

// managers
let roomManager = require("manager.rooms");
let creepManager = require("manager.creeps");

module.exports.loop = function () {
	global.checkRoom = roomUtilities.displayRoomPlan;

	updatePrototypes();

	// Priority order
	// 0. Visuals (should have no effect on CPU)
	// 1. Creeps
	// 2. Spawns (Life & Death)
	// 3. Towers
	// 4. Room plan

	Memory.creepIn =
		roomUtilities.spawnFrequency -
		(Game.time % roomUtilities.spawnFrequency);

	roomManager.runVisuals();

	creepManager.runCreeps();

	creepUtilities.clearDeadCreeps();

	// TODO: change creep spawning to loop over spawners instead of looping over roles, each spawner can loop over roles individually
	// only try and make new creeps every once in a while
	if (Game.time % roomUtilities.spawnFrequency == 0)
		creepManager.createCreeps();

	if (Game.cpu.bucket == 10000) {
		Game.cpu.generatePixel();
	}
};
