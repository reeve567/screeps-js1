// priority order: STATIC_HARVESTER, TRANSPORTER, MOBILE_HARVESTER, UPGRADER, BUILDER

var types = {
	// Mines energy, then puts it in some kind of storage
	MOBILE_HARVESTER: {
		run: function (creep) {},
		bodyType: [MOVE, MOVE, CARRY, WORK],
		priority: 3,
		count: function (room) {
			if (room.controller.level == 1) {
				return 2;
			} else if (
				room.memory.roles["TRANSPORTER"] == 0 &&
				room.memory.roles["STATIC_HARVESTER"] == 0
			) {
				return 1;
			}
		},
	},
	// Stays at a source to mine, dropping energy on the floor or in a storage at their body
	STATIC_HARVESTER: {
		run: function (creep) {},
		bodyType: [MOVE, CARRY, WORK],
		specialBody: [WORK],
		priority: 1,
		count: function (room) {
			if (room.controller.level > 1) {
				return room.memory.sources;
			} else return 0;
		},
	},
	TRANSPORTER: {
		run: function (creep) {},
		bodyType: [MOVE, CARRY],
		priority: 2,
		count: function (room) {
			if (room.controller.level > 1) {
				return room.memory.sources + 1;
			} else return 0;
		},
	},
	// Used to upgrade the Controller
	UPGRADER: {
		run: function (creep) {},
		bodyType: [MOVE, MOVE, CARRY, WORK],
		priority: 4,
		count: function (room) {
			if (room.controller.level == 1) {
				return 2;
			} else return 3;
		},
	},
	// Looks for energy to use, and builds any construction stites in the room
	BUILDER: {
		run: function (creep) {},
		bodyType: [MOVE, MOVE, CARRY, WORK],
		priority: 5,
		count: function (room) {
			return;
		},
	},
	// Moves to another room to claim the Controller
	INITIAL_COLONIST: {
		run: function (creep) {},
		bodyType: [MOVE, CLAIM],
		priority: 11,
		count: function (room) {
			return 0;
		},
	},
	// Moves to another room, and helps that one get started
	COLONIST: {
		run: function (creep) {},
		bodyType: [MOVE, MOVE, CARRY, WORK],
		priority: 10,
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
		priority: 9,
		count: function (room) {
			return 0;
		},
	},
	MELEE_DEFENDER: {
		run: function (creep) {},
		bodyType: [MOVE, ATTACK, TOUGH],
	},
};
