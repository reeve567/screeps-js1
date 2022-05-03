var roomUtilities = require("utilities.room");

function displayRoomInfo(room) {
	let visual = room.visual;
	let style = {
		align: "left",
	};

	visual.text("Game tick: " + Game.time, 1, 1, style);
	visual.text(
		"Spawn in: " +
			(roomUtilities.spawnFrequency -
				(Game.time % roomUtilities.spawnFrequency)),
		1,
		2,
		style
	);
	visual.text("Next creep: " + room.memory.nextCreep, 1, 3, style);
	visual.text("Bucket: " + Game.cpu.bucket, 1, 4, style);
}

function runVisuals() {
	let rooms = Game.rooms;

	for (let key in rooms) {
		let room = Game.rooms[key];

		if (room.memory.roomPlanDisplay) {
			roomUtilities.displayRoomPlan(key);
		}
		displayRoomInfo(room);
	}
}

module.exports = {
	runVisuals: runVisuals,
};
