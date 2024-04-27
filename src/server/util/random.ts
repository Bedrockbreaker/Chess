import { createHash, randomInt, randomUUID } from "crypto";

import type { RoomSettings, GameSettings } from "../../common/server.d.ts";
import { Cardinals, randomBool, shuffle, Status } from "../../common/util.ts";
import { ALL_PLUGINS, YggdrasilEngine } from "../../engine/yggdrasil.ts";

import { Room } from "./room.ts";

import adjectives from "./adjectives.json" assert {type: "json"}
import nouns from "./nouns.json" assert {type: "json"}

function getName() {
	return `${adjectives[randomInt(adjectives.length)]} ${nouns[randomInt(nouns.length)]}`;
}

const everythingGame = new YggdrasilEngine();
await everythingGame.load({
	board: [],
	endConditions: {
		extinctionRoyalty: true,
		maxRoyaltyInCheck: 1,
		rexMultiplex: false,
		softmaxBoringTurns: 50,
		hardmaxBoringTurns: 75,
		softmaxTurnRepetition: 3,
		hardmaxTurnRepetition: 5,
		turnRepetitionIsLoss: false
	},
	key: {},
	plugins: [...ALL_PLUGINS]
});
const allPieces = [...everythingGame.namespaceRegistry.values()];

// Generate rooms with random configs for testing purposes
function getRooms(num: number) {
	const rooms: Room[] = [];
	for (let i = 0; i < num; i++) {

		if (i % Math.max(Math.round(num / 100), 1) === 0) {
			process.stdout.cursorTo(0);
			process.stdout.write(`\x1b[33mGenerating rooms... \x1b[0m${i}/${num} \x1b[36m[${Math.round(i/num*100)}%]`);
			process.stdout.cursorTo(0);
		}

		const roomSettings: RoomSettings = {
			roomName: getName(),
			players: [],
			numPlayers: randomInt(1,17),
			status: Status.WAITING,
			allowSpectators: randomBool(),
			password: randomBool() && randomBool() ? createHash("sha256").update(randomUUID() /* user-supplied password goes here instead */).digest("hex") : "",
			timeControls: {
				main: randomInt(7200),
				delay: randomBool() ? randomInt(120) : 0,
				increment: randomBool() ? randomInt(120) : 0,
				enableIncrementAfterTurn: randomBool() ? randomInt(60) : 0,
				useHourglass: randomBool() && randomBool(),
				byoyomi: {
					amountPerPeriod: randomInt(120),
					periods: randomBool() ? (randomBool() ? randomInt(480) : 1) : 0,
					movesBeforeReset: randomBool() ? randomInt(1,11) : 1,
					progressiveMoveIncrement: randomBool() && randomBool() ? randomInt(10) : 0
				},
				overtime: []
			}
		};

		const gameSettings: GameSettings = {
			board: [],
			key: {},
			endConditions: {
				extinctionRoyalty: randomBool(),
				maxRoyaltyInCheck: randomBool() ? 1 : randomInt(1,5),
				rexMultiplex: randomBool() && randomBool(),
				softmaxBoringTurns: randomInt(1, 100),
				hardmaxBoringTurns: -1,
				softmaxTurnRepetition: randomInt(1, 10),
				hardmaxTurnRepetition: -1,
				turnRepetitionIsLoss: randomBool()
			},
			plugins: shuffle([...ALL_PLUGINS]).slice(randomInt(ALL_PLUGINS.length)),
		};

		let width = 0;
		let height = 0;
		while (width * height < roomSettings.numPlayers) {
			width = randomInt(1, 17);
			height = randomInt(1, 17);
		}
		const perPlayerArea = Math.ceil(width * height * .5 / roomSettings.numPlayers);
		gameSettings.board = new Array(height).fill("\x00".repeat(width));
		for (let j = 0; j < roomSettings.numPlayers; j++) {
			const forwards = [Cardinals.North, Cardinals.South, Cardinals.East, Cardinals.West][randomInt(0, roomSettings.numPlayers < 3 ? 2 : 4)];
			for (let k = 0; k < perPlayerArea; k++) {
				const index = String.fromCharCode(j*perPlayerArea + k + 1);
				const plugin = gameSettings.plugins[randomInt(gameSettings.plugins.length)];
				gameSettings.key[index] = {piece: {id: shuffle(allPieces.filter(namespace => namespace.startsWith(`${plugin}:`)))[0], faction: j, forwards}, tile: {}};

				const row = randomInt(0, height);
				const col = randomInt(0, width);
				const rowString = gameSettings.board[row];
				gameSettings.board[row] = rowString.slice(0, col) + index + rowString.slice(col+1);
			}
		}

		gameSettings.endConditions.hardmaxBoringTurns = gameSettings.endConditions.softmaxBoringTurns + randomInt(1, 20);
		gameSettings.endConditions.hardmaxTurnRepetition = gameSettings.endConditions.softmaxTurnRepetition + randomInt(1, 10);

		// Generate a shuffled array of factions with random uniform int in [0,0]U[2,N] indexes replaced with -1
		let numRandomFactions = randomInt(roomSettings.numPlayers);
		numRandomFactions = numRandomFactions === roomSettings.numPlayers - 1 ? roomSettings.numPlayers : numRandomFactions;
		let factions = shuffle(new Array(roomSettings.numPlayers).fill(0).map((_, i) => i));
		factions.splice(0, numRandomFactions, ...(new Array(numRandomFactions).fill(-1)));
		factions = shuffle(factions);

		for (let j = 0; j < randomInt(1, roomSettings.numPlayers+1); j++) {
			roomSettings.players.push({
				user: {
					id: randomUUID(), // KAMO: reserve null uuid (00000000-0000-0000-0000-000000000000) for NN
					ws: undefined,
					username: `${getName()} ${randomInt(1000).toString().padStart(3, "0")}`,
				}, 
				faction: factions[j]
			});
		}

		if (roomSettings.players.length === roomSettings.numPlayers) {
			roomSettings.status = randomBool() ? Status.STARTED : Status.FINISHED;
			roomSettings.players.forEach(player => {
				if (player.faction > -1) return;
				// Resolve all random factions
				player.faction = shuffle(new Array(roomSettings.numPlayers).fill(0).map((_, i) => i).filter(i => !roomSettings.players.some(player2 => player2.faction === i)))[0];
			});
		}

		for (let j = 0; j < (randomBool() ? randomInt(6) : 0); j++) {
			roomSettings.timeControls.overtime.push({
				amount: randomInt(3600),
				triggerAfterTurn: randomInt(60)
			});
		}
		if (randomBool()) roomSettings.timeControls.overtime.push({amount: randomInt(3600)});

		rooms.push(new Room(roomSettings, gameSettings));
	}

	return rooms;
}

export { getName, getRooms }