module.exports.getCost = function (creepBody) {
	var cost = 0;

	for (var i in creepBody) {
		var part = creepBody[i];
		cost += BODYPART_COST[part];
	}

	return cost;
};

module.exports.clearDeadCreeps = function () {
	for (var name in Memory.creeps) {
		var mem = Memory.creeps[name];
		if (!Game.creeps[name]) {
			var room = Game.rooms[mem.home];

			var role = mem.role;
			room.memory.roles[role]--;

			if (role == "STATIC_HARVESTER" && mem.source != null && mem.source != undefined) {
				room.memory.sources[mem.source].owner = null;
			}

			delete Memory.creeps[name];
		}
	}
};

module.exports.findEnergy = function (creep) {
	let energyCap = creep.store.getCapacity(RESOURCE_ENERGY);

	let ret = null;

	// try looking for dropped energy
	if (ret == null) {
		let ret1 = creep.room.find(FIND_DROPPED_RESOURCES, {
			filter: function (object) {
				return object.resourceType == RESOURCE_ENERGY && object.amount > energyCap;
			},
		});

		if (ret1.length > 0) {
			let ret2 = _.sortBy(ret1, [
				function (o) {
					o.amount;
				},
			]);

			ret = ret2[ret2.length - 1];
		}
	}

	// try looking at storages
	if (ret == null) {
		let ret1 = creep.room.find(FIND_STRUCTURES, {
			filter: function (structure) {
				return structure instanceof StructureContainer && structure.store.energy > energyCap;
			},
		});

		if (ret1.length > 0) {
			let ret2 = _.sortBy(ret1, [
				function (o) {
					o.store.energy;
				},
			]);

			ret = ret2[ret2.length - 1];
		}
	}

	return ret;
};

module.exports.depositEnergy = function (creep) {
	let room = Game.rooms[creep.memory.home];

	function depoTo(type) {
		let buildings = room.find(FIND_MY_STRUCTURES, {
			filter: function (structure) {
				return (
					structure.structureType == type &&
					structure.store.energy < structure.store.getCapacity(RESOURCE_ENERGY)
				);
			},
		});

		if (buildings.length > 0) {
			let res = creep.transfer(buildings[0], RESOURCE_ENERGY);
			if (res == ERR_NOT_IN_RANGE) {
				creep.moveTo(buildings[0]);
			} else if (res == ERR_NOT_ENOUGH_ENERGY) {
				creep.memory.workPhase = 0;
			}

			return true;
		}
		return false;
	}

	if (depoTo(STRUCTURE_SPAWN)) return true;
	if (depoTo(STRUCTURE_EXTENSION)) return true;
	if (depoTo(STRUCTURE_TOWER)) return true;
	if (depoTo(STRUCTURE_CONTAINER)) return true;
};
