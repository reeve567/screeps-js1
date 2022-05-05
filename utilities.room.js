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

	vis.text("bc", roomPlan.bestSpot.pos, {
		color: "blue",
	});

	for (let i in roomPlan.sourceSpots) {
		let sourceSpot = roomPlan.sourceSpots[i];

		vis.text("mc", sourceSpot.bestPosition, {
			color: "blue",
		});

		vis.poly(sourceSpot.path, {
			stroke: "#ddd",
			strokeWidth: 0.2,
		});
	}
}
/**
 * Need to create a distance transform using the chessboard distance
 */
function distanceTransform(roomName) {
	let topDownPass = new PathFinder.CostMatrix();

	let room = Game.rooms[roomName];
	let terrain = room.getTerrain();

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

	for (let y = 49; y > 0; --y) {
		for (let x = 49; x > 0; --x) {
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

	for (let y = 49; y > 0; --y) {
		for (let x = 49; x > 0; --x) {
			if (topDownPass.get(x, y) > 2) {
				let dist = room.controller.pos.findPathTo(x, y).length;
				topDownPass.set(
					x,
					y,
					Math.max(topDownPass.get(x, y) - Math.floor(dist / 15), 0)
				);
			}
		}
	}

	return topDownPass;
}

function createRoomPlan(roomName) {
	var dt = distanceTransform(roomName);

	var max = 0;
	var positions = [];

	for (let x = 0; x < roomSize; x++) {
		for (let y = 0; y < roomSize; y++) {
			var value = dt._bits[y + x * roomSize];
			if (value > max) max = value;
		}
	}

	for (let x = 0; x < roomSize; x++) {
		for (let y = 0; y < roomSize; y++) {
			var value = dt._bits[y + x * roomSize];
			if (value == max) {
				positions.push({ x: x, y: y });
			}
		}
	}

	let bestPosition;
	let distance = roomSize * roomSize;

	for (let i in positions) {
		var pos = positions[i];
		var roomPos = new RoomPosition(pos.x, pos.y, roomName);

		var path = roomPos.findPathTo(Game.rooms[roomName].controller.pos)
			.length;

		if (path < distance) {
			bestPosition = pos;
			distance = path;
		}
	}

	// start figuring out where buildings go

	let links = [new RoomPosition(bestPosition.x, bestPosition.y, roomName)];
	let center = links[0];
	let containers = [];
	let extensions = [];
	let towers = [];
	let roads = [];

	// Better way to do the roads to sources once it's affordable:
	// CostMatrix for all tiles, letting the walls be included with a higher cost

	let room = Game.rooms[roomName];
	let sources = room.find(FIND_SOURCES);
	let sourceSpots = [];
	let terrain = room.getTerrain();

	// let cost = new PathFinder.CostMatrix();
	//
	// for (let x = 1; x < 50; x++) {
	// 	for (let y = 1; y < 50; y++) {
	// 		if (terrain.get(x, y) == TERRAIN_MASK_WALL) {
	// 			cost.set(x, y, 4.0);
	// 		}
	// 	}
	// }

	for (let i in sources) {
		let source = sources[i];
		let pos = source.pos;

		let bestPosition;
		let bestPath;
		let min = 2500;

		for (let x = -1; x <= 1; x++) {
			for (let y = -1; y <= 1; y++) {
				if (x != 0 || y != 0) {
					let minePos = new RoomPosition(
						pos.x + x,
						pos.y + y,
						roomName
					);

					if (terrain.get(minePos.x, minePos.y) == TERRAIN_MASK_WALL)
						continue;

					let path = room.controller.pos.findPathTo(minePos);

					let dist = path.length;

					if (dist < min) {
						min = dist;
						bestPath = path;
						bestPosition = minePos;
					}
				}
			}
		}

		containers.push(bestPosition);

		sourceSpots.push({
			bestPosition: bestPosition,
			path: bestPath,
			position: pos,
			id: source.id,
		});
	}

	// bunker area
	// TODO: deal with smaller areas that wont fit a 5x5
	for (let x = -3; x <= 3; x++) {
		for (let y = -3; y <= 3; y++) {
			let pos = new RoomPosition(center.x + x, center.y + y, roomName);
			if (Math.abs(x) < 3 && Math.abs(y) < 3) {
				if (Math.abs(Math.abs(x) - Math.abs(y)) == 1) {
					extensions.push(pos);
				}

				if (Math.abs(x) == 2 && y == 0) {
					containers.push(pos);
				}

				if (Math.abs(x) == 2 && Math.abs(y) == 2) {
					towers.push(pos);
				}
			} else {
				if ((Math.abs(x) == 3) ^ (Math.abs(y) == 3)) {
					roads.push(pos);
				}
			}
		}
	}

	return {
		bestSpot: {
			pos: center,
			value: max,
		},
		sourceSpots: sourceSpots,
		dt: dt,
		buildings: {
			roads: roads,
			extensions: extensions,
			containers: containers,
			towers: towers,
			links: links,
		},
	};
}

function runTowers(roomName) {
	let room = Game.rooms[roomName];

	if (Game.time % 100 == 0) {
		delete room.memory.towers;
	}

	let towers = room.memory.towers;

	if (towers == undefined) {
		towers = room.find(FIND_MY_STRUCTURES, {
			filter: function (structure) {
				return structure.structureType == STRUCTURE_TOWER;
			},
		});
	}

	for (let t in towers) {
		let tower = towers[t];

		let hostileCreeps = tower.pos.findClosestByRange(FIND_CREEPS, {
			filter: function (creep) {
				return (
					!creep.my &&
					(creep.body.includes(ATTACK) ||
						creep.body.includes(RANGED_ATTACK) ||
						creep.body.includes(HEAL))
				);
			},
		});

		if (hostileCreeps.length > 0) {
			tower.attack(hostileCreeps[0]);
		}

		let buildings = room.find(FIND_MY_STRUCTURES, {
			filter: function (structure) {
				return structure.hits < structure.hitsMax - 400;
			},
		});

		if (buildings.length > 0) {
			tower.repair(buildings[0]);
		}
	}
}

module.exports = {
	getRoomPlan: getRoomPlan,
	displayRoomPlan: displayRoomPlan,
	createRoomPlan: createRoomPlan,
	spawnFrequency: 25,
};
