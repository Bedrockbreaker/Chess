import type { PieceConstructorOptions } from "../../common/server.d.ts";
import { Modifiers } from "../../common/util.ts";
import { Move, Piece, YggdrasilEngine, atom } from "../yggdrasil.ts";
import { Knight, Pawn } from "./orthodox.ts";

const PLUGINID = "omega";

YggdrasilEngine.Plugin(PLUGINID, engine => {
	engine.registerPiece(PLUGINID, "champion", Champion);
	engine.registerPiece(PLUGINID, "wizard", Wizard);
	engine.registerPiece(PLUGINID, "fool", Fool);
	engine.registerPiece(PLUGINID, "templarknight", TemplarKnight);
});

@Pawn.promotion()
class Champion extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Champion", ...options});
	}

	@atom({x: 1, y: 0})
	@atom({x: 2, y: 0})
	@atom({x: 2, y: 2})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

@Pawn.promotion()
class Wizard extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Wizard", ...options});
	}

	@atom({x: 1, y: 1})
	@atom({x: 3, y: 1})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

@Pawn.promotion()
class Fool extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Fool", ...options});
	}

	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return []; // TODO: Generate moves for omega:fool
	}
}

@Pawn.promotion()
class TemplarKnight extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Templar Knight", ...options});
	}

	@atom({x: 2, y: 1})
	@atom({x: 3, y: 2, modifiers: [Modifiers.NonCapture]})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}