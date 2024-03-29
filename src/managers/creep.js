require("../constants");
const creepUtilities = require("utilities/creep");
const roomUtilities = require("utilities/room");

const roles = {
	// Mines energy, then puts it in some kind of storage
	MOBILE_HARVESTER: {
		run: function(creep) {
			if (creep.memory.workPhase === 1) {
				if (creepUtilities.depositEnergy(creep)) return;
				else creep.say("I'm bored 😴");
			} else if (creep.memory.workPhase === 0) {
				getEnergy(creep);
			}
		},
		bodyType: [MOVE, CARRY, WORK],
		specialBody: [],
		count: function(room) {
			if (room.controller.level === 1) {
				return 2;
			} else if (room.memory.roles["TRANSPORTER"] === 0 || room.memory.roles["STATIC_HARVESTER"] === 0) {
				return 2;
			}
		}
	},
	// Stays at a source to mine, dropping energy on the floor or in a storage at their body
	STATIC_HARVESTER: {
		run: function(creep) {
			let room = Game.rooms[creep.memory.home];

			if (room.memory.sources === undefined) {
				room.memory.sources = [];
				let roomPlan = roomUtilities.getRoomPlan(creep.memory.home);
				let sourceSpots = roomPlan.sourceSpots;

				for (let i in sourceSpots) {
					let source = sourceSpots[i];

					room.memory.sources.push({
						owner: null,
						source: source.id,
						bestPosition: source.bestPosition
					});
				}
			}

			if (creep.memory.source == undefined) {
				for (let i in room.memory.sources) {
					let source = room.memory.sources[i];

					if (source.owner == null) {
						source.owner = creep.name;
						creep.memory.source = i;
						break;
					}
				}
			}

			let sourceMem = room.memory.sources[creep.memory.source];

			if (creep.pos.x == sourceMem.bestPosition.x && creep.pos.y == sourceMem.bestPosition.y) {
				let source = Game.getObjectById(sourceMem.source);
				let ret = creep.harvest(source);
			} else {
				let ret = creep.moveTo(sourceMem.bestPosition.x, sourceMem.bestPosition.y);
			}
		},
		bodyType: [MOVE, WORK],
		//specialBody: [WORK],
		count: function(room) {
			if (room.controller.level >= 2) {
				if (room.memory.sources == undefined) {
					return room.find(FIND_SOURCES).length;
				} else return room.memory.sources.length;
			} else return 0;
		}
	},
	TRANSPORTER: {
		run: function(creep) {
			if (creep.memory.workPhase == 1) {
				creepUtilities.depositEnergy(creep);
			} else if (creep.memory.workPhase == 0) {
				// fix so they wont try and mine energy themselves
				getEnergy(creep);
			}
		},
		bodyType: [MOVE, CARRY, CARRY],
		count: function(room) {
			if (room.controller.level >= 3) {
				return room.memory.sources.length + 1;
			} else if (room.controller.level == 2) {
				return 0;
			} else return 0;
		}
	},
	// Used to upgrade the Controller
	UPGRADER: {
		run: function(creep) {
			if (creep.memory.workPhase == 1) {
				var room = Game.rooms[creep.memory.home];

				if (room.memory.roles["TRANSPORTER"] == 0) {
					if (creepUtilities.depositEnergy(creep)) return;
				}

				var result = creep.upgradeController(room.controller);
				if (result == ERR_NOT_IN_RANGE) {
					creep.moveTo(room.controller);
				} else if (result == ERR_NOT_ENOUGH_ENERGY) {
					creep.memory.workPhase = 0;
				}
			} else if (creep.memory.workPhase == 0) {
				getEnergy(creep);
			}
		},
		bodyType: [MOVE, CARRY, WORK],
		count: function(room) {
			if (room.controller.level == 1) {
				return 4;
			} else return 3;
		}
	},
	// Looks for energy to use, and builds any construction stites in the room
	BUILDER: {
		run: function(creep) {
			if (creep.memory.workPhase == 1) {
				var room = Game.rooms[creep.memory.home];

				if (creep.memory.project == undefined || creep.memory.project == null) {
					let res = creep.room.find(FIND_MY_CONSTRUCTION_SITES);

					if (res.length == 0) {
						let roomPlan = roomUtilities.getRoomPlan(creep.room.name);

						let max = {};

						for (let type in roomPlan.buildings) {
							max[type] = 0;
						}

						for (let i = 1; i <= room.controller.level; i++) {
							for (let type in roomPlan.buildings) {
								if (controllerBuildings[i][type] != undefined) {
									max[type] = controllerBuildings[i][type];
								}
							}
						}

						for (let i in buildPriority) {
							let type = buildPriority[i];

							let structureType;

							if (type == "roads") {
								structureType = FIND_STRUCTURES;
							} else if (type == "spawns") {
								structureType = FIND_MY_STRUCTURES;

								// delete original dumb spawn placement

								if (Game.spawns["Spawn1"] != undefined) {
								}
							} else {
								structureType = FIND_MY_STRUCTURES;
							}

							let res = creep.room.find(structureType, {
								filter: function(structure) {
									return structure.structureType == buildingListMap[type];
								}
							}).length;

							if (res < max[type]) {
								let newProjPos = roomPlan.buildings[type][res];

								if (newProjPos != undefined) {
									let ret = creep.room.createConstructionSite(
										newProjPos.x,
										newProjPos.y,
										buildingListMap[type],
										type + "-" + res
									);

									if (ret == OK) {
										let constructionSites = creep.room.lookForAt(
											LOOK_CONSTRUCTION_SITES,
											newProjPos.x,
											newProjPos.y
										);

										for (let i in constructionSites) {
											let constructionSite = constructionSites[i];

											if (constructionSite.type == buildingListMap[type]) {
												creep.memory.project = constructionSite.id;
											}
										}
									}

									break;
								}
							}
						}
					} else {
						creep.memory.project = res[0].id;
					}
				}

				let project = Game.getObjectById(creep.memory.project);

				if (project == null) {
					creep.memory.project = null;
					return;
				}

				let res = creep.build(project);

				if (res == ERR_NOT_IN_RANGE) {
					creep.moveTo(project);
				} else if (res == ERR_NOT_ENOUGH_ENERGY) {
					creep.memory.workPhase = 0;
				}
			} else if (creep.memory.workPhase == 0) {
				getEnergy(creep);
			}
		},
		bodyType: [MOVE, CARRY, WORK],
		count: function(room) {
			if (room.controller.level > 1) {
				return Math.floor(room.controller.level / 2) + 1;
			} else return 0;
		}
	},
	// Moves to another room to claim the Controller
	INITIAL_COLONIST: {
		run: function(creep) {
		},
		bodyType: [MOVE, CLAIM],
		count: function(room) {
			return 0;
		}
	},
	// Moves to another room, and helps that one get started
	COLONIST: {
		run: function(creep) {
		},
		bodyType: [MOVE, CARRY, WORK],
		count: function(room) {
			return 0;
		}
	},
	// Checks out the room around it's home to see if there are any worth expanding to, and will keep track of the state of neighbors
	// Possibly create defenders if creeps with attack are noticed in a neighboring room
	SCOUT: {
		run: function(creep) {
			let map = Memory.map;
			let controller = Game.rooms[creep.memory.home].controller;

			if (map == undefined) {
				Memory.map = {};
				map = Memory.map;
			}

			if (creep.memory.cameFrom == undefined) {
				creep.memory.cameFrom = "";
			}

			if (creep.memory.workPhase == 0) {
				if (map[creep.room.name] == undefined) {
					// Initialize room data
					let room = creep.room;
				}

				creep.memory.workPhase = 1;
			} else if (creep.memory.workPhase == 1) {
				if (creep.memory.target != undefined) {
					creep.moveTo(Game.getObjectById(creep.memory.target));
				}

				// Make sure they're in a new room and won't go into exit limbo
				if (creep.memory.cameFromRoom != creep.room.name && !(creep.pos.x % 49 == 0 || creep.pos.y % 49 == 0)) {
					creep.memory.cameFromRoom = creep.room.name;
					delete creep.memory.target;

					creep.memory.workPhase = 0;
				}

				let exits = Game.map.describeExits(creep.room.name);

				function goToRandomExit() {
					// TODO: Check for blocked exits
					if (creep.memory.cameFrom.length > 0) {
						_.unset(exits, (eval(creep.memory.cameFrom[creep.memory.cameFrom.length - 1]) + 4) % 8);
					}

					let keys = _.keys(exits);

					if (keys.length > 0) {
						// Go to a random exit
						let dir = _.sample(keys);
						let room = exits[dir];

						creep.memory.cameFrom += dir;
						creep.memory.cameFromRoom = creep.room.name;

						let controller = Game.rooms[room.name].controller;

						if (creep.moveTo(controller) == OK) {
							creep.memory.target = controller.id;
						} else {
							goToRandomExit();
						}
					} else {
						// Go back to the room they came from
						let dir = creep.memory.cameFrom[creep.memory.cameFrom.length - 1];

						let room = Game.rooms[Game.map.describeExits(creep.room.name)[(dir + 4) % 8]];
						let controller = room.controller;

						if (creep.moveTo(controller) == OK) {
							creep.memory.cameFrom = _.dropRight(creep.memory.cameFrom);

							creep.memory.target = controller.id;
						} else {
							creep.say("I wanna go home 😢");
						}
					}
				}

				goToRandomExit();
			}
		},
		bodyType: [MOVE],
		specialBody: [],
		count: function(room) {
			if (room.controller.level < 3) {
				return 0;
			}

			if (Game.time % 500 == 0) {
				return 1;
			} else return 0;
		}
	},
	MELEE_DEFENDER: {
		run: function(creep) {
			let target = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
			if (target.length > 0) {
				if (creep.attack(target[0]) == ERR_NOT_IN_RANGE) {
					creep.moveTo(target[0]);
				}
			}
		},
		bodyType: [MOVE, ATTACK, TOUGH],
		count: function(room) {
			// Check for scout reports & attackers in room
			return room.find(FIND_HOSTILE_CREEPS).length; // TODO: Add a check for scout reports
		}
	}
};

function getEnergy(creep) {
	let find = creepUtilities.findEnergy(creep);

	if (creep.store.energy === creep.store.getCapacity(RESOURCE_ENERGY)) {
		creep.memory.workPhase = 1;
		return;
	}

	if (find != null) {
		if (find instanceof Structure || find instanceof Tombstone) {
			let result = creep.withdraw(find, RESOURCE_ENERGY);

			if (result === ERR_NOT_IN_RANGE) {
				creep.moveTo(find);
			} else if (result === OK) {
				if (creep.store.energy === creep.store.getCapacity(RESOURCE_ENERGY)) {
					creep.memory.workPhase = 1;
				}
			}
		} else {
			let result = creep.pickup(find);

			if (result === ERR_NOT_IN_RANGE) {
				creep.moveTo(find);
			} else if (result === ERR_FULL) {
				creep.memory.workPhase = 1;
			} else if (result === OK) {
				if (creep.store.energy === creep.store.getCapacity(RESOURCE_ENERGY)) {
					creep.memory.workPhase = 1;
				}
			}
		}
	} else {
		var source = creep.pos.findClosestByPath(FIND_SOURCES);

		var result = creep.harvest(source);
		if (result === ERR_NOT_IN_RANGE) {
			creep.moveTo(source);
		} else if (result === OK) {
			if (creep.store.energy === creep.store.getCapacity(RESOURCE_ENERGY)) {
				creep.memory.workPhase = 1;
			}
		}
	}
}

function getCreepBody(role, spawn) {
	let body;
	var baseCost = creepUtilities.getCost(role.bodyType);

	if (role.specialBody == undefined) {
		var amount = spawn.room.energyCapacityAvailable / baseCost;
		amount = Math.floor(amount);
		body = [];

		for (var i = 0; i < amount; i++) {
			body.push(role.bodyType);
		}

		return _.flatten(body);
	} else {
		var amount;
		if (role.specialBody.length == 0) {
			amount = 0;
		} else {
			amount = (spawn.room.energyCapacityAvailable - baseCost) / creepUtilities.getCost(role.specialBody);
		}

		body = role.bodyType;

		for (var i = 0; i < amount; i++) {
			body.push(role.specialBody);
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

		for (var i in rolePriorities) {
			var name = rolePriorities[i];
			var role = roles[name];

			if (role.count(room) > room.memory.roles[name]) {
				var spawns = room.find(FIND_MY_SPAWNS, {
					filter: function(spawn) {
						return spawn.isActive() && spawn.spawning == null;
					}
				});

				if (spawns.length === 0) {
					// All spawns are busy
					break;
				}

				var spawn = spawns[0];

				var body = getCreepBody(role, spawn);

				var result = spawn.spawnCreep(body, name + "-" + Game.time / spawnFrequency, {
					memory: {
						role: name,
						workPhase: 0,
						home: room.name
					}
				});

				room.visual.text(result, spawn.pos, {
					color: "red",
					font: 0.8
				});

				if (result === OK) {
					room.memory.roles[name]++;
					break;
				} else if (result === ERR_NOT_ENOUGH_ENERGY) {
					room.memory.nextCreep = name;
					break;
				} else {
					console.log(result);
				}

				// Spawn will now be busy and removed from the list of spawns, which will break from the next role check if it's the last one
			}
		}
	}
}

function runCreeps() {
	for (var name in Game.creeps) {
		var creep = Game.creeps[name];

		var role = roles[creep.memory.role];

		if (role === undefined) {
			console.log("Error, undefined role: " + JSON.stringify(creep));
		}

		role.run(creep);
	}
}

module.exports = {
	runCreeps: runCreeps,
	createCreeps: createCreeps
};
