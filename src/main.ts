import { open } from "node:fs/promises";
import { hrtime } from "node:process";
import repl from "node:repl";

import { YggdrasilEngine, type GameOptions } from "./yggdrasil.ts";
import * as Chess from "./yggdrasil.ts";
import Config from "./config.json" assert {type: "json"};

console.log("\x1b[33mStarting \x1b[36mYggdrasil Engine\x1b[0m 🐲");

let time = hrtime.bigint();
const game = new YggdrasilEngine();
await game.load(Config).then(() => {
	console.log(`- \x1b[33mProcessed Config File\x1b[0m [${(hrtime.bigint() - time)/1000000n} ms]`);
	time = hrtime.bigint();
	return open("./src/moves.txt").then(file => file.readFile()).then(data => data.toString());
}).then(file => {
	console.log(`- \x1b[33mLoaded Moves File\x1b[0m [${(hrtime.bigint() - time)/1000000n} ms]`);
	time = hrtime.bigint();
	game.makeMove(game.deserializeYCIN(file));
	console.log(`- \x1b[33mSimulated Game\x1b[0m [${(hrtime.bigint() - time)/1000000n} ms]`)
});

const globalEval = (cmd: string, ctx: Object, filename: string, callback: Function) => {
	let value: any;
	try {
		value = eval(cmd);
	} catch (err) {
		value = err;
	}
	callback(this, value);
}
const IO = repl.start({prompt: "\x1b[36m> \x1b[0m", eval: globalEval});