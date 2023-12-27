import mime from "mime";
import { open } from "node:fs/promises";
import { createServer } from "node:http";
import { type AddressInfo } from "node:net";
import { hrtime } from "node:process";
import { start } from "node:repl";
import { WebSocketServer, type WebSocket } from "ws";

import * as Chess from "./yggdrasil.ts"; // Import all for repl use
const YggdrasilEngine = Chess.YggdrasilEngine;
import Config from "./config.json" assert {type: "json"};

console.log("\x1b[33mStarting \x1b[36mYggdrasil Engine\x1b[0m 🐲");

let time = hrtime.bigint();
const stopwatch = () => {
	const elapsed = (hrtime.bigint() - time)/1000000n;
	time = hrtime.bigint();
	return elapsed;
}

const game = YggdrasilEngine.INSTANCE;
await game.load(Config).then(() => {
	console.log(`- \x1b[33mProcessed Config File\x1b[0m [${stopwatch()} ms]`);
	return open("./src/moves.txt").then(file => file.readFile()).then(data => data.toString());
}).then(file => {
	console.log(`- \x1b[33mLoaded Moves File\x1b[0m [${stopwatch()} ms]`);
	time = hrtime.bigint();
	game.makeMove(game.deserializeYCIN(file));
	console.log(`- \x1b[33mSimulated Game\x1b[0m [${stopwatch()} ms]`);
});

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
wss.on("connection", ws => {
	socket.INSTANCE?.terminate();
	socket.INSTANCE = ws;
	ws.on("error", console.error);
	const board = game.state.board;
	const data = {board: new Chess.Board(), plugins: Config.plugins};
	for (let y = 0; y < board.height; y++) {
		data.board[y] = [];
		for (let x = 0; x < board.width; x++) {
			data.board[y][x] = board[y][x].clone();
			const piece = data.board[y][x].piece;
			if (!piece) continue;
			data.board[y][x].pieceNamespace = YggdrasilEngine.namespaceRegistry.get(piece.constructor as new (options: Chess.PieceConstructorOptions) => Chess.Piece);
		}
	}
	ws.send(JSON.stringify(data));
});

server.listen(7890, undefined, undefined, () => {
	console.log(`\x1b[33mStarted local server\x1b[36m [Port ${(server.address() as AddressInfo).port}]\x1b[0m [${stopwatch()} ms]`);

	const repl = start({prompt: "\x1b[36m> \x1b[0m"});
	repl.context.game = game;
	repl.context.YggdrasilEngine = YggdrasilEngine;
	repl.context.Chess = Chess;
	repl.context.socket = socket;
	repl.on("exit", () => {server.close(); wss.close()});
});