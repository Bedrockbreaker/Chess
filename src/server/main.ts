import "dotenv/config";
import jwt from "jsonwebtoken";
import { randomInt, randomUUID } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { hrtime } from "node:process";
import { start } from "node:repl";
import { WebSocketServer } from "ws";

import type { wsClientMessage } from "../common/client.d.ts";
import type { User, wsServerMessage } from "../common/server.d.ts";
import { Status } from "../common/util.ts";

import { getName, getRooms } from "./util/random.ts";
import * as Engine from "../engine/yggdrasil.ts"; // Import all for repl use

let time = hrtime.bigint();
const userRequestMap = new WeakMap<IncomingMessage, User>(); // auth request -> partial user
const users = new Map<string, User>();

stopwatch();
const rooms = getRooms(1000);
console.log(`\x1b[33mGenerated \x1b[36m${rooms.length}\x1b[33m random rooms\x1b[0m [${stopwatch()} ms]`);

const wss = new WebSocketServer({noServer: true, clientTracking: false});
wss.on("connection", (ws, request) => {
	// BUG: vite hmr breaks websocket connection
	const userRequest = userRequestMap.get(request);
	if (!userRequest) return ws.close(4500, "You ceased to exist.");
	const userId = userRequest.id;
	const prevData = users.get(userId);
	prevData?.ws?.close(4408, "Connection replaced by a new one");
	const user: User = {username: userRequest.username, ...prevData, id: userId, ws: ws};
	users.set(userId, user);

	ws.on("error", console.error);
	
	const send = (message: wsClientMessage) => ws.send(JSON.stringify(message));
	ws.on("message", (data: string) => {
		let message: wsServerMessage | undefined = undefined;
		try {
			message = JSON.parse(data);
			if (typeof(message) !== "object") throw new Error("Parsed message was not an object");
		} catch (err) {
			console.log(`User ${userId} sent invalid data:`);
			console.error(message, err);
			send({type: "error", data: err});
			return;
		}

		switch(message.type) {
			case "username":
				if (message.data.method === "GET") return send({type: "username", data: user.username});
				user.username = message.data.username.slice(0, 100);
				return send({type: "username", data: user.username});
			default:
				return send({type: "error", data: `Unknown intent: ${message.type}`});
		}
	});

	/* ws.on("message", data => {
		const request = messageParser.exec(data.toString());
		switch (request?.[1]) {
			case "reset":
				reloadGame().then(() => sendState());
				break;
			case "moves":
				const moveOptions = game.board.get(new Chess.Pos(request?.[2]))?.piece?.getMoves().filter(moves => game.isLegal(moves));
				moveOptions?.forEach(moves => moves.forEach(move => {
					move.piece &&= move.piece.clone();
					if (move.piece?.engine) (move.piece.engine as any) = undefined;
					if (move.spawnProps?.board) move.spawnProps.board = undefined;
					(move as any).serialized = move.serialize(game);
				}));
				ws.send(`moves ${JSON.stringify(moveOptions)}`);
				break;
			case "move":
				game.makeMove(game.deserializeYCIN(JSON.parse(request?.[2]).join("\r\n")));
				sendState();
				break;
			default:
				console.log("Received unknown message over websocket:", request);
				break;
		}
	});
	
	sendState(); */

	ws.on("close", () => {
		// TODO: enact countdown before ending game
		console.log(users.get(userId)?.ws === ws);
		if (!user.game) users.delete(userId);
	});

	send({type: "user", data: {auth: jwt.sign(userRequest.id, process.env.JWT_SECRET ?? "sans is at my frontdoor"), username: user.username}});
});

function getUserId(request: IncomingMessage) {
	const token = new URL(`http://${request.headers.host}${request.url}`).searchParams.get("token") || "";
	
	try {
		return jwt.verify(token, process.env.JWT_SECRET ?? "sans is at my frontdoor") as string;
	} catch {
		return "";
	}
}

function socketError(error: Error) {
	console.error(error);
}

/* async function readRequest(request: IncomingMessage) {
	switch(request.headers["content-type"]) {
		case "text/plain":
			let data = "";
			request.on("data", (chunk: Buffer) => data += chunk.toString());
			return new Promise<string>(resolve => request.on("end", () => resolve(data)));
		default:
			return;
	}
} */

function sendResponse(response: ServerResponse<IncomingMessage>, statusCode: number, message?: string) {
	response.writeHead(statusCode, statusCode !== 200 ? message : undefined);
	if (message) response.write(message);
	response.end();
}

function getTrinary(value: string | null) {
	if (!value) return undefined;
	return value === "false" ? false : true;
}

function sortAlphabetical(string1: string, string2: string) {
	return string1 > string2 ? 1 : (string1 === string2 ? 0 : -1);
}

const originWhitelist = ["http://localhost:5173", "http://localhost:4173"];
const server = createServer((request, response) => {
	const url = new URL(`http://${request.headers.host}${request.url}`);
	const query = url.searchParams;
	console.log(query);

	const origin = request.headers.origin ?? "";
	if (originWhitelist.includes(origin) || origin.startsWith("http://192.168.")) {
		response.setHeader("Access-Control-Allow-Origin", origin);
		response.setHeader("Access-Control-Allow-Methods", "GET, PATCH");
		response.setHeader("Access-Control-Allow-Headers", "Content-Type");
	}

	if (url.pathname.startsWith("/api")) {
		switch(url.pathname.slice(4)) {
			case "/plugins":
				if (request.method !== "GET") return sendResponse(response, 405);
				return sendResponse(response, 200, JSON.stringify(Engine.ALL_PLUGINS));
			case "/rooms":
				if (request.method !== "GET") return sendResponse(response, 405);

				const isWaiting = query.has("isWaiting");
				const noPassword = query.has("noPassword");
				const roomSearch = query.get("roomSearch")?.toLowerCase();
				const pluginFilter = query.getAll("pluginFilter").filter(plugin => plugin);
				const pluginBlacklist = query.has("pluginBlacklist");
				const mainTimeLeft = Number(query.get("mainTimeLeft")) || 0;
				const mainTimeRightQuery = query.get("mainTimeRight");
				const mainTimeRight = !mainTimeRightQuery || isNaN(Number(mainTimeRightQuery)) ? Infinity : Number(mainTimeRightQuery);
				const delay = getTrinary(query.get("delay"));
				const increment = getTrinary(query.get("increment"));
				const useHourglass = getTrinary(query.get("useHourglass"));
				const byoyomi = getTrinary(query.get("byoyomi"));
				const overtime = getTrinary(query.get("overtime"));

				const numPerPage = Number(query.get("numPerPage")) || 100;
				const page = Number(query.get("page")) || 0;

				const sortBy = query.get("sortBy");
				const sortDir = query.get("sortDir") ? (query.get("sortDir") === "asc" ? 1 : -1) : 0;

				const results = rooms.filter(room => {
					return (room.status !== Status.FINISHED && (room.status !== Status.STARTED || room.allowSpectators))
						&& (!isWaiting || room.status === Status.WAITING)
						&& (!noPassword || room.password === "")
						&& (!roomSearch || room.roomName.toLowerCase().includes(roomSearch) || room.players.some(player => player.user.username.toLowerCase().includes(roomSearch)))
						&& (pluginFilter.length === 0 || pluginFilter.every(plugin => room.game.plugins.includes(plugin) !== pluginBlacklist))
						&& (room.timeControls.main >= mainTimeLeft && room.timeControls.main <= mainTimeRight)
						&& (delay === undefined || ((room.timeControls.delay > 0) === delay))
						&& (increment === undefined || ((room.timeControls.increment > 0) === increment))
						&& (useHourglass === undefined || room.timeControls.useHourglass === useHourglass)
						&& (byoyomi === undefined || ((room.timeControls.byoyomi.periods > 0 && room.timeControls.byoyomi.amountPerPeriod > 0) === byoyomi))
						&& (overtime === undefined || ((room.timeControls.overtime.length > 0) === overtime));
				}).sort((room1, room2) => {
					switch(sortBy) {
						case "status":
							return sortDir * ((room1.status === Status.STARTED ? 1 : (room1.password ? 0 : -1)) - (room2.status === Status.STARTED ? 1 : (room2.password ? 0 : -1)));
						case "roomName":
							return sortDir * sortAlphabetical(room1.roomName.toLowerCase(), room2.roomName.toLowerCase());
						case "players":
							return sortDir * (room1.players.length - 1 / room1.numPlayers - room2.players.length + 1 / room2.numPlayers);
						case "timeControls":
							const time1 = room1.timeControls;
							const time2 = room2.timeControls;
							return sortDir * (time1.main + time1.byoyomi.amountPerPeriod * time1.byoyomi.periods + time1.overtime.reduce((total, ot) => total + ot.amount, 0) - time2.main - time2.byoyomi.amountPerPeriod * time2.byoyomi.periods - time2.overtime.reduce((total, ot) => total + ot.amount, 0));
						case "plugins":
							return sortDir * (room1.game.plugins.length - room2.game.plugins.length);
						default:
							return 0;
					}
				});

				return sendResponse(response, 200, JSON.stringify({rooms: results.slice(page * numPerPage, (page + 1) * numPerPage).map(room => room.package()), total: results.length}));
			case "/room":
				const roomId = query.get("roomId");
				if (!roomId) return sendResponse(response, 404, "No Room id given");
				const room = rooms.find(room => room.id === roomId)?.package();
				if (!room) return sendResponse(response, 404, "Room not found");
				return sendResponse(response, 200, JSON.stringify(room));
			default:
				return sendResponse(response, 400, `No such endpoint on /user: ${url.pathname.slice(5)}`);
		}
	}

	sendResponse(response, 200, "Oh, hey Mr. Frog! You're not supposed to be here.");
});

server.on("upgrade", (request, socket, head) => {
	socket.on("error", socketError);

	const userId = getUserId(request) || randomUUID();
	const username = new URL(`http://${request.headers.host}${request.url}`).searchParams.get("username") || `${getName()} ${randomInt(999).toString().padStart(3, "0")}`;

	socket.removeListener("error", socketError);
	userRequestMap.set(request, {id: userId, username: username});
	wss.handleUpgrade(request, socket, head, ws => wss.emit("connection", ws, request));
});

/* function sendState() {
	if (!socket.INSTANCE) return;
	const data = {board: new Chess.Board(), moves: game.state.moves.map(move => {
		const copy = new Chess.Move({piece: move.piece?.clone(), pieceNamespace: move.pieceNamespace, fromPos: move.fromPos, toPos: move.toPos, removeAtPos: move.removeAtPos, captureAtPos: move.captureAtPos, spawnAtPos: move.spawnAtPos, spawnProps: move.spawnProps, dropAtPos: move.dropAtPos, canContinue: move.canContinue} as Chess.MoveDescriptor);
		(copy as any).serialized = copy.serialize(game);
		copy.piece = undefined;
		return copy;
	})};
	for (let y = 0; y < game.board.height; y++) {
		data.board[y] = [];
		for (let x = 0; x < game.board.width; x++) {
			data.board[y][x] = game.board[y][x].clone();
			const piece = data.board[y][x].piece;
			if (!piece) continue;
			(piece.engine as any) = undefined;
			data.board[y][x].pieceNamespace = game.getNamespace(piece);
		}
	}
	socket.INSTANCE.send(`state ${JSON.stringify(data)}`);
}

function reloadGame() {
	console.log("\x1b[33mStarting \x1b[36mYggdrasil Engine\x1b[0m 🐲");
	stopwatch();
	game = new YggdrasilEngine();
	return game.load(Config).then(() => {
		if (repl) repl.context.game = game;
		console.log(`- \x1b[33mProcessed Config File\x1b[0m [${stopwatch()} ms]`);
		return open("./src/server/moves.txt").then(file => file.readFile()).then(data => data.toString());
	}).then(file => {
		console.log(`- \x1b[33mLoaded Moves File\x1b[0m [${stopwatch()} ms]`);
		time = hrtime.bigint();
		game.makeMove(game.deserializeYCIN(file));
		console.log(`- \x1b[33mSimulated Game\x1b[0m [${stopwatch()} ms]`);
	});
} */

server.listen(7890, () => {
	const address = server.address() as AddressInfo;
	console.log(`\x1b[33mStarted local server\x1b[36m [Port ${address.port}]\x1b[0m [${stopwatch()} ms]`);
	
	const repl = start({prompt: "\x1b[36m> \x1b[0m"});
	repl.context.Engine = Engine;
	repl.context.users = users;
	repl.context.rooms = rooms;
	repl.on("exit", () => {
		server.close();
		wss.close();
	});
	
});

function stopwatch() {
	const elapsed = (hrtime.bigint() - time)/1000000n;
	time = hrtime.bigint();
	return elapsed;
}