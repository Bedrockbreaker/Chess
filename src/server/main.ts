import mime from "mime";
import { open } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { hrtime } from "node:process";
import { REPLServer, start } from "node:repl";
import { WebSocketServer, type WebSocket } from "ws";

import * as Chess from "../engine/yggdrasil.ts"; // Import all for repl use
const YggdrasilEngine = Chess.YggdrasilEngine;
import Config from "./config.json" assert {type: "json"};

let time = hrtime.bigint();
let repl: REPLServer | undefined;
let game: Chess.YggdrasilEngine;
await reloadGame();

const server = createServer((request, response) => {
	let path = new URL(request.url || "/", `http://${request.headers.host}`).pathname;
	path = path === "/" ? "/index.html" : path;
	open(`./src/frontend${path}`)
		.then(file => file.readFile())
		.then(data => {
			response.writeHead(200, {"Content-Type": mime.getType(path) || undefined});
			response.write(data);
		})
		.catch(reason => {
			response.writeHead(404);
			response.write(`Error loading resource: ${path}\n${reason}`);
		})
		.finally(() => response.end());
});

const socket: {INSTANCE: WebSocket | undefined} = {INSTANCE: undefined};
const wss = new WebSocketServer({ server });
const messageParser = /(\w+)(?: (.+))?/m;
wss.on("connection", ws => {
	socket.INSTANCE?.terminate();
	socket.INSTANCE = ws;

	ws.on("error", console.error);

	ws.on("message", data => {
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
	
	sendState();
});

server.listen(7890, undefined, undefined, () => {
	console.log(`\x1b[33mStarted local server\x1b[36m [Port ${(server.address() as AddressInfo).port}]\x1b[0m [${stopwatch()} ms]`);

	repl = start({prompt: "\x1b[36m> \x1b[0m"});
	repl.context.game = game;
	repl.context.YggdrasilEngine = YggdrasilEngine;
	repl.context.Chess = Chess;
	repl.context.socket = socket;
	repl.on("exit", () => {server.close(); wss.close()});
});

function stopwatch() {
	const elapsed = (hrtime.bigint() - time)/1000000n;
	time = hrtime.bigint();
	return elapsed;
}

function sendState() {
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
}