/*
 * Possible optimizations
 * - Use typeof and check for whether you have the room name or room object so you don't have to retrieve it again (not sure if this will make a difference)
 */

let roomUtilities = require("./utilities.room");
let updatePrototypes = require("./updatePrototypes");
let roomManager = require("./manager.rooms");

module.exports.loop = function () {
	global.checkRoom = roomUtilities.displayRoomPlan;

	updatePrototypes();

	console.log("Running visuals...");
	roomManager.runVisuals();

	// Priority order
	// 0. Visuals (should have no effect on CPU)
	// 1. Creeps
	// - 1. Harvesters
	// - 2. Upgraders (Controller)
	// - 3. Transporters
	// - 4. Defenders
	// - 5. ?
	// 2. Towers
	// 3. Room plan

	if (Game.cpu.bucket > 5000) {
		Game.cpu.generatePixel();
	}
};
