var roomUtilities = require("utilities.room");

function runVisuals() {
	let rooms = Game.rooms;

	for (let key in rooms) {
		let room = Game.rooms[key];

		if (room.memory.roomPlanDisplay) {
			roomUtilities.displayRoomPlan(key);
		}
	}
}

module.exports = {
	runVisuals: runVisuals,
};
