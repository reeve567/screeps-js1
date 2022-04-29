/*
 * Possible optimizations
 * - Use typeof and check for whether you have the room name or room object so you don't have to retrieve it again (not sure if this will make a difference)
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

	roomManager.runVisuals();

	creepManager.runCreeps();

	creepUtilities.clearDeadCreeps();
	creepManager.createCreeps();

	if (Game.cpu.bucket > 5000) {
		Game.cpu.generatePixel();
	}
};
