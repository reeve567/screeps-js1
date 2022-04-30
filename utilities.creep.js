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
		if (!Game.creeps[name] && !mem.spawning) {
			var room = Game.rooms[mem.home];

			var role = mem.role;
			room.memory.roles[role]--;

			delete Memory.creeps[name];
		}
	}
};
