var creepUtilities = require("utilities.creep");

var roles = {
	// Mines energy, then puts it in some kind of storage
	MOBILE_HARVESTER: {
		run: function (creep) {},
		bodyType: [MOVE, CARRY, WORK],
		count: function (room) {
			// if (room.controller.level == 1) {
			// 	return 2;
			// } else if (
			// 	room.memory.roles["TRANSPORTER"] == 0 &&
			// 	room.memory.roles["STATIC_HARVESTER"] == 0
			// ) {
			// 	return 1;
			// }
			return 0;
		},
	},
	// Stays at a source to mine, dropping energy on the floor or in a storage at their body
	STATIC_HARVESTER: {
		run: function (creep) {},
		bodyType: [MOVE, CARRY, WORK],
		specialBody: [WORK],
		count: function (room) {
			if (room.controller.level > 3) {
				return room.memory.sources;
			} else return 0;
		},
	},
	TRANSPORTER: {
		run: function (creep) {},
		bodyType: [MOVE, CARRY],
		count: function (room) {
			if (room.controller.level > 3) {
				return room.memory.sources + 1;
			} else return 0;
		},
	},
	// Used to upgrade the Controller
	UPGRADER: {
		run: function (creep) {
			if (creep.memory.workPhase == 1) {
				var room = Game.rooms[creep.memory.home];

				var result = creep.upgradeController(room.controller);
				if (result == ERR_NOT_IN_RANGE) {
					creep.moveTo(room.controller);
				} else if (result == ERR_NOT_ENOUGH_ENERGY) {
					creep.memory.workPhase = 0;
				}
			} else if (creep.memory.workPhase == 0) {
				var source = creep.pos.findClosestByPath(FIND_SOURCES);

				var result = creep.harvest(source);
				if (result == ERR_NOT_IN_RANGE) {
					creep.moveTo(source);
				} else if (result == OK) {
					if (
						creep.store.energy ==
						creep.store.getCapacity(RESOURCE_ENERGY)
					) {
						creep.memory.workPhase = 1;
					}
				}
			}
		},
		bodyType: [MOVE, CARRY, WORK],
		count: function (room) {
			if (room.controller.level == 1) {
				return 4;
			} else return 5;
		},
	},
	// Looks for energy to use, and builds any construction stites in the room
	BUILDER: {
		run: function (creep) {},
		bodyType: [MOVE, CARRY, WORK],
		count: function (room) {
			return 0;
		},
	},
	// Moves to another room to claim the Controller
	INITIAL_COLONIST: {
		run: function (creep) {},
		bodyType: [MOVE, CLAIM],
		count: function (room) {
			return 0;
		},
	},
	// Moves to another room, and helps that one get started
	COLONIST: {
		run: function (creep) {},
		bodyType: [MOVE, CARRY, WORK],
		count: function (room) {
			return 0;
		},
	},
	// Checks out the room around it's home to see if there are any worth expanding to, and will keep track of the state of neighbors
	// Possibly create defenders if creeps with attack are noticed in a neighboring room
	SCOUT: {
		run: function (creep) {},
		bodyType: [MOVE],
		specialBody: [],
		count: function (room) {
			return 0;
		},
	},
	MELEE_DEFENDER: {
		run: function (creep) {},
		bodyType: [MOVE, ATTACK, TOUGH],
		count: function (room) {
			// Check for scout reports & attackers in room
			return 0;
		},
	},
};

var priorities = [
	"MELEE_DEFENDER",
	"STATIC_HARVESTER",
	"TRANSPORTER",
	"MOBILE_HARVESTER",
	"UPGRADER",
	"BUILDER",
];

function getCreepBody(role, spawn) {
	var baseCost = creepUtilities.getCost(role.bodyType);

	if (role.specialBody == undefined) {
		var amount = spawn.store.getCapacity(RESOURCE_ENERGY) / baseCost;
		amount = Math.floor(amount);
		var body = [];

		for (var i = 0; i < amount; i++) {
			body.push(role.bodyType);
		}

		return _.flatten(body);
	} else {
		var amount;
		if (role.specialBody.size != 0) {
			amount = 0;
		} else {
			amount =
				(spawn.store.getCapacity(RESOURCE_ENERGY) - baseCost) /
				creepUtilities.getCost(role.specialBody);
		}

		var body = role.bodyType;

		for (var i = 0; i < amount; i++) {
			body.add(role.specialBody);
		}

		return _.flatten(body);
	}
}

function createCreeps() {
	for (var name in Game.rooms) {
		var room = Game.rooms[name];
		if (room.memory.roles == undefined) {
			room.memory.roles = {};

			for (var name in roles) {
				room.memory.roles[name] = 0;
			}
		}

		for (var i in priorities) {
			var name = priorities[i];
			var role = roles[name];

			if (role.count(room) > room.memory.roles[name]) {
				var spawns = room.find(FIND_MY_SPAWNS, {
					filter: function (spawn) {
						return spawn.isActive() && spawn.spawning == null;
					},
				});

				if (spawns.size == 0) {
					// All spawns are busy
					break;
				}

				var spawn = spawns[0];

				var body = getCreepBody(role, spawn);

				var result = spawn.spawnCreep(body, name + "-" + Game.time, {
					memory: {
						spawning: true,
						role: name,
						workPhase: 0,
						home: room.name,
					},
				});

				room.visual.text(result, spawn.pos, {
					color: "red",
					font: 0.8,
				});

				if (result == OK) {
					room.memory.roles[name]++;
				}

				// Spawn will now be busy and removed from the list of spawns, which will break from the next role check if it's the last one
			}
		}
	}
}

function runCreeps() {
	for (var name in Game.creeps) {
		var creep = Game.creeps[name];

		if (creep.memory.spawning) creep.memory.spawning = false;

		var role = roles[creep.memory.role];
		role.run(creep);
	}
}

module.exports = {
	runCreeps: runCreeps,
	createCreeps: createCreeps,
};
