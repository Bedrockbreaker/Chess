import type { PieceConstructorOptions } from "../../common/server.d.ts";
import { Piece, YggdrasilEngine } from "../yggdrasil.ts";

const PLUGINID = "ultima";

YggdrasilEngine.Plugin(PLUGINID, engine => {
	engine.registerPiece(PLUGINID, "pawn", Pawn);
	engine.registerPiece(PLUGINID, "withdrawer", Withdrawer);
	engine.registerPiece(PLUGINID, "longleaper", LongLeaper);
	engine.registerPiece(PLUGINID, "coordinator", Coordinator);
	engine.registerPiece(PLUGINID, "chameleon", Chameleon);
	engine.registerPiece(PLUGINID, "immobilizer", Immobilizer);
});

// TODO: generate moves for all pieces in ultima
// TODO: look at variants on wikipedia

class Pawn extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Pawn", ...options});
	}
}

class Withdrawer extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Withdrawer", ...options});
	}
}

class LongLeaper extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Long Leaper", ...options});
	}
}

class Coordinator extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Coordinator", ...options});
	}
}

class Chameleon extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Chameleon", ...options});
	}
}

class Immobilizer extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Immobilizer", ...options});
	}
}