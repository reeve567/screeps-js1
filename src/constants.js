// Main settings
global.spawnFrequency = 25;

// Creep settings
global.rolePriorities = [
	"MELEE_DEFENDER",
	"MOBILE_HARVESTER",
	"STATIC_HARVESTER",
	"TRANSPORTER",
	"UPGRADER",
	"BUILDER",
];

// Building settings
global.buildPriority = ["roads", "controllerRoad", "extensions", "containers", "towers", "links", "storage", "spawns"];

global.buildingListMap = {
	roads: STRUCTURE_ROAD,
	controllerRoad: STRUCTURE_ROAD,
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

// convert to CONTROLLER_STRUCTURES
global.controllerBuildings = {
	1: {
		roads: 2500,
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
