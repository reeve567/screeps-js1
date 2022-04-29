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

	let roomPlan = getRoomPlan(roomName);
	let room = Game.rooms[roomName];
	room.memory.roomPlanDisplay = display;

	for (let x = 0; x < roomSize; x++) {
		for (let y = 0; y < roomSize; y++) {
			room.visual.text(roomPlan[x + y * roomSize], x, y, {
				color: "green",
				font: 0.5,
			});
		}
	}
}
/**
 * Need to create a distance transform using the chessboard distance (max(abs(x-i),abs(y-j)))
 * Algoritms to try:
 * - Meijster distance (linear time)
 * 	- https://fab.cba.mit.edu/classes/S62.12/docs/Meijster_distance.pdf
 */
function distanceTransform(roomName) {
	function CDT_f(x, i, g_i) {
		return Math.max(Math.abs(x - i), g_i);
	}

	function CDT_Sep(i, u, g_i, g_u) {
		if (g_i <= g_u) return Math.max(i + g_u, Math.floor((i + u) / 2));
		else return Math.min(u - g_i, Math.floor((i + u) / 2));
	}

	let terrain = Game.rooms[roomName].getTerrain();
	let max = roomSize * 2;

	let booleanTerrain = terrain.getRawBuffer().map(function (item) {
		if (item & TERRAIN_MASK_WALL) return 1;
		else return 0;
	});

	// First phase
	let g = new Array(max);

	for (let x = 0; x < roomSize; x++) {
		if (booleanTerrain[x + 0 * roomSize]) g[x + 0 * roomSize] = 0;
		else g[x + 0 * roomSize] = max;

		// Org scan
		for (let y = 1; y < roomSize; y++) {
			if (booleanTerrain[x + y * roomSize]) g[x + y * roomSize] = 0;
			else g[x + y * roomSize] = 1 + g[x + (y - 1)];
		}

		for (let y = roomSize - 1; y >= 0; y--) {
			if (g[x + (y + 1) * roomSize] < g[x + y * roomSize])
				g[x + y * roomSize] = g[x + (y + 1) * roomSize];
		}
	}

	// Second phase
	let dt = new Array(max);

	let s = new Array(roomSize);
	let t = new Array(roomSize);
	let q, w;
	for (var y = 0; y < roomSize; y++) {
		q = 0;
		s[0] = 0;
		t[0] = 0;

		for (var u = 1; u < roomSize; u++) {
			while (
				q >= 0 &&
				(t[q], s[q], g[s[q] + y * roomSize]) >
					CDT_f(t[q], u, g[u + y * roomSize])
			)
				q--;
			if (q < 0) {
				q = 0;
				s[0] = u;
			} else {
				w =
					1 +
					CDT_Sep(
						s[q],
						u,
						g[s[q] + y * roomSize],
						g[u + y * roomSize]
					);
				if (w < roomSize) {
					q++;
					s[q] = u;
					t[q] = w;
				}
			}
		}

		// Scan 4
		for (u = roomSize - 1; u >= 0; u--) {
			var d = CDT_f(u, s[q], g[s[q] + y * roomSize]);
			dt[u + y * roomSize] = d;
			if (u == t[q]) q--;
		}
	}

	return dt;
}

function createRoomPlan(roomName) {}

module.exports = {
	getRoomPlan: getRoomPlan,
	displayRoomPlan: displayRoomPlan,
	createRoomPlan: createRoomPlan,
};
