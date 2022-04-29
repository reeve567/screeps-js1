var roomSize = 50;

function getRoomPlan(roomName) {
	if (Memory.roomPlans == undefined) {
		Memory.roomPlans = {};

		let plan = createRoomPlan(roomName);
		Memory.roomPlans[roomName] = plan;
		return plan;
	} else {
		if (Memory.roomPlans[roomName] == undefined) {
			let plan = createRoomPlan(roomName);
			Memory.roomPlans[roomName] = plan;
			return plan;
		} else {
			return Memory.roomPlans[roomName];
		}
	}
}

function displayRoomPlan(roomName, display = true) {
	if (roomName == undefined) return;

	let room = Game.rooms[roomName];

	room.memory.roomPlanDisplay = display;
	if (!display) return;

	let roomPlan = getRoomPlan(roomName);

	let vis = new RoomVisual(roomName);

	for (let x = 0; x < roomSize; x++) {
		for (let y = 0; y < roomSize; y++) {
			var value = roomPlan.dt._bits[y + x * roomSize];
			vis.circle(x, y, { radius: value / 25 });
		}
	}
}
/**
 * Need to create a distance transform using the chessboard distance
 */
function distanceTransform(roomName) {
	let topDownPass = new PathFinder.CostMatrix();

	let terrain = Game.rooms[roomName].getTerrain();

	for (let y = 0; y < 50; ++y) {
		for (let x = 0; x < 50; ++x) {
			if (terrain.get(x, y) == TERRAIN_MASK_WALL) {
				topDownPass.set(x, y, 0);
			} else {
				topDownPass.set(
					x,
					y,
					Math.min(
						topDownPass.get(x - 1, y - 1),
						topDownPass.get(x, y - 1),
						topDownPass.get(x + 1, y - 1),
						topDownPass.get(x - 1, y)
					) + 1
				);
			}
		}
	}

	for (let y = 49; y >= 0; --y) {
		for (let x = 49; x >= 0; --x) {
			let value = Math.min(
				topDownPass.get(x, y),
				topDownPass.get(x + 1, y + 1) + 1,
				topDownPass.get(x, y + 1) + 1,
				topDownPass.get(x - 1, y + 1) + 1,
				topDownPass.get(x + 1, y) + 1
			);
			topDownPass.set(x, y, value);
		}
	}

	return topDownPass;
}

function createRoomPlan(roomName) {
	var dt = distanceTransform(roomName);

	return {
		dt: dt,
	};
}

module.exports = {
	getRoomPlan: getRoomPlan,
	displayRoomPlan: displayRoomPlan,
	createRoomPlan: createRoomPlan,
};
