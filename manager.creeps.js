var creepUtilities = require("utilities.creep");
var roomUtilities = require("utilities.room");

var buildPriority = [
	"roads",
	"extensions",
	"containers",
	"towers",
	"links",
	"storage",
	"spawns",
];

var buildingListMap = {
	containers: STRUCTURE_CONTAINER,
	extensions: STRUCTURE_EXTENSION,
	towers: STRUCTURE_TOWER,
	storage: STRUCTURE_STORAGE,
	links: STRUCTURE_LINK,
	extractor: STRUCTURE_EXTRACTOR,
	labs: STRUCTURE_LAB,
	terminal: STRUCTURE_TERMINAL,
	factory: STRUCTURE_FACTORY,
	observer: STRUCTURE_OBSERVER,
	power_spawn: STRUCTURE_POWER_SPAWN,
	nuker: STRUCTURE_NUKER,
};

var controllerBuildings = {
	1: {
		containers: 5,
		spawns: 1,
	},
	2: {
		extensions: 5,
	},
	3: {
		extensions: 10,
		towers: 1,
	},
	4: {
		extensions: 20,
		towers: 1,
		storage: 1,
	},
	5: {
		extensions: 30,
		towers: 2,
		links: 2,
	},
	6: {
		extensions: 40,
		links: 3,
		extractor: 1,
		labs: 3,
		terminal: 1,
	},
	7: {
		spawns: 2,
		extensions: 50,
		towers: 3,
		links: 4,
		labs: 6,
		factory: 1,
	},
	8: {
		spawns: 3,
		extensions: 60,
		towers: 6,
		links: 6,
		labs: 10,
		observer: 1,
		power_spawn: 1,
		nuker: 1,
	},
};

// TODO: Make the MOBILE_HARVESTER actually work for Controller level 2, and also make the static only start on Controller 3
var roles = {
	// Mines energy, then puts it in some kind of storage
	MOBILE_HARVESTER: {
		run: function (creep) {
			if (creep.memory.workPhase == 0) {
			}
		},
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
		run: function (creep) {
			let room = Game.rooms[creep.memory.home];

			if (room.memory.sources == undefined) {
				room.memory.sources = [];
				let roomPlan = roomUtilities.getRoomPlan(creep.memory.home);
				let sourceSpots = roomPlan.sourceSpots;

				for (let i in sourceSpots) {
					let source = sourceSpots[i];

					room.memory.sources.push({
						owner: null,
						source: source.id,
						bestPosition: source.bestPosition,
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

			if (
				creep.pos.x == sourceMem.bestPosition.x &&
				creep.pos.y == sourceMem.bestPosition.y
			) {
				let source = Game.getObjectById(sourceMem.source);
				let ret = creep.harvest(source);
			} else {
				let ret = creep.moveTo(
					sourceMem.bestPosition.x,
					sourceMem.bestPosition.y
				);
			}
		},
		bodyType: [MOVE, WORK],
		//specialBody: [WORK],
		count: function (room) {
			if (room.controller.level >= 2) {
				if (room.memory.sources == undefined) {
					return room.find(FIND_SOURCES).length;
				} else return room.memory.sources.length;
			} else return 0;
		},
	},
	TRANSPORTER: {
		run: function (creep) {
			if (creep.memory.workPhase == 1) {
				creepUtilities.depositEnergy(creep);
			} else if (creep.memory.workPhase == 0) {
				// fix so they wont try and mine energy themselves
				getEnergy(creep);
			}
		},
		bodyType: [MOVE, CARRY, CARRY],
		count: function (room) {
			if (room.controller.level > 3) {
				return room.memory.sources.length + 1;
			} else if (room.controller.level >= 2) {
				return 0;
			} else return 0;
		},
	},
	// Used to upgrade the Controller
	UPGRADER: {
		run: function (creep) {
			if (creep.memory.workPhase == 1) {
				var room = Game.rooms[creep.memory.home];

				// TODO: make fix for when there are no transporters

				if (creep.memory.workPhase == 1) {
					let room = Game.rooms[creep.memory.home];

					let spawns = room.find(FIND_MY_STRUCTURES, {
						filter: function (structure) {
							return (
								structure instanceof StructureSpawn &&
								structure.store.energy <
									structure.store.getCapacity(RESOURCE_ENERGY)
							);
						},
					});

					if (spawns.length > 0) {
						let res = creep.transfer(spawns[0], RESOURCE_ENERGY);
						if (res == ERR_NOT_IN_RANGE) {
							creep.moveTo(spawns[0], RESOURCE_ENERGY);
						} else if (res == ERR_NOT_ENOUGH_ENERGY) {
							creep.memory.workPhase = 0;
						} else {
							console.log(res);
						}
						return;
					}

					let extensions = room.find(FIND_MY_STRUCTURES, {
						filter: function (structure) {
							return (
								structure instanceof StructureExtension &&
								structure.store.energy <
									structure.store.getCapacity(RESOURCE_ENERGY)
							);
						},
					});

					if (extensions.length > 0) {
						let res = creep.transfer(
							extensions[0],
							RESOURCE_ENERGY
						);
						if (res == ERR_NOT_IN_RANGE) {
							creep.moveTo(extensions[0], RESOURCE_ENERGY);
						} else if (res == ERR_NOT_ENOUGH_ENERGY) {
							creep.memory.workPhase = 0;
						}
						return;
					}
				} else if (creep.memory.workPhase == 0) {
					// fix so they wont try and mine energy themselves
					getEnergy(creep);
				}

				// END FIX

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
		count: function (room) {
			if (room.controller.level == 1) {
				return 4;
			} else return 3;
		},
	},
	// Looks for energy to use, and builds any construction stites in the room
	BUILDER: {
		run: function (creep) {
			if (creep.memory.workPhase == 1) {
				var room = Game.rooms[creep.memory.home];

				if (
					creep.memory.project == undefined ||
					creep.memory.project == null
				) {
					let res = creep.room.find(FIND_MY_CONSTRUCTION_SITES);

					if (res.length == 0) {
						let roomPlan = roomUtilities.getRoomPlan(
							creep.room.name
						);

						let max = {};

						for (let type in roomPlan.buildings) {
							max[type] = 0;
						}

						for (let i = 1; i <= room.controller.level; i++) {
							for (let type in roomPlan.buildings) {
								if (controllerBuildings[i] != undefined) {
									max = controllerBuildings[i];
								}
							}
						}

						for (let i in buildPriority) {
							let type = buildPriority[i];

							let res = creep.room.find(FIND_MY_STRUCTURES, {
								filter: function (structure) {
									return (
										structure.structureType ==
										buildingListMap[type]
									);
								},
							}).length;

							res += creep.room.find(FIND_MY_CONSTRUCTION_SITES, {
								filter: function (structure) {
									return (
										structure.structureType ==
										buildingListMap[type]
									);
								},
							}).length;

							console.log(type);
							console.log(res + " < " + max[type]);

							if (res < max[type]) {
								let newProjPos = roomPlan.buildings[type][res];

								console.log(JSON.stringify(newProjPos));

								if (newProjPos != undefined) {
									let ret = creep.room.createConstructionSite(
										newProjPos.x,
										newProjPos.y,
										buildingListMap[type],
										type + "-" + res
									);

									console.log(ret);

									if (ret == OK) {
										let constructionSites = creep.room.lookForAt(
											LOOK_CONSTRUCTION_SITES,
											newProjPos.x,
											newProjPos.y
										);

										for (let i in constructionSites) {
											let constructionSite =
												constructionSites[i];

											if (
												constructionSite.type ==
												buildingListMap[type]
											) {
												creep.memory.project =
													constructionSite.id;
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
		count: function (room) {
			if (room.controller.level > 1) {
				return Math.floor(room.controller.level / 2) + 1;
			} else return 0;
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

function getEnergy(creep) {
	let find = creepUtilities.findEnergy(creep);

	if (creep.store.energy == creep.store.getCapacity(RESOURCE_ENERGY)) {
		creep.memory.workPhase = 1;
		return;
	}

	if (find != null) {
		if (find instanceof Structure || find instanceof Tombstone) {
			let result = creep.withdraw(find, RESOURCE_ENERGY);

			if (result == ERR_NOT_IN_RANGE) {
				creep.moveTo(find);
			} else if (result == OK) {
				if (
					creep.store.energy ==
					creep.store.getCapacity(RESOURCE_ENERGY)
				) {
					creep.memory.workPhase = 1;
				}
			}
		} else {
			let result = creep.pickup(find);

			if (result == ERR_NOT_IN_RANGE) {
				creep.moveTo(find);
			} else if (result == ERR_FULL) {
				creep.memory.workPhase = 1;
			} else if (result == OK) {
				if (
					creep.store.energy ==
					creep.store.getCapacity(RESOURCE_ENERGY)
				) {
					creep.memory.workPhase = 1;
				}
			}
		}
	} else {
		var source = creep.pos.findClosestByPath(FIND_SOURCES);

		var result = creep.harvest(source);
		if (result == ERR_NOT_IN_RANGE) {
			creep.moveTo(source);
		} else if (result == OK) {
			if (
				creep.store.energy == creep.store.getCapacity(RESOURCE_ENERGY)
			) {
				creep.memory.workPhase = 1;
			}
		}
	}
}

function getCreepBody(role, spawn) {
	var baseCost = creepUtilities.getCost(role.bodyType);

	if (role.specialBody == undefined) {
		var amount = spawn.room.energyCapacityAvailable / baseCost;
		amount = Math.floor(amount);
		var body = [];

		for (var i = 0; i < amount; i++) {
			body.push(role.bodyType);
		}

		return _.flatten(body);
	} else {
		var amount;
		if (role.specialBody.length == 0) {
			amount = 0;
		} else {
			amount =
				(spawn.room.energyCapacityAvailable - baseCost) /
				creepUtilities.getCost(role.specialBody);
		}

		var body = role.bodyType;

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

		for (var i in priorities) {
			var name = priorities[i];
			var role = roles[name];

			if (role.count(room) > room.memory.roles[name]) {
				var spawns = room.find(FIND_MY_SPAWNS, {
					filter: function (spawn) {
						return spawn.isActive() && spawn.spawning == null;
					},
				});

				if (spawns.length == 0) {
					// All spawns are busy
					break;
				}

				var spawn = spawns[0];

				var body = getCreepBody(role, spawn);

				var result = spawn.spawnCreep(
					body,
					name + "-" + Game.time / roomUtilities.spawnFrequency,
					{
						memory: {
							role: name,
							workPhase: 0,
							home: room.name,
						},
					}
				);

				room.visual.text(result, spawn.pos, {
					color: "red",
					font: 0.8,
				});

				if (result == OK) {
					room.memory.roles[name]++;
					break;
				} else if (result == ERR_NOT_ENOUGH_ENERGY) {
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
		role.run(creep);
	}
}

module.exports = {
	runCreeps: runCreeps,
	createCreeps: createCreeps,
};
