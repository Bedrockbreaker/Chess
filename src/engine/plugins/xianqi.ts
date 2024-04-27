import type { PieceConstructorOptions } from "../../common/server.d.ts";
import { Move, Piece, YggdrasilEngine, atom } from "../yggdrasil.ts";

const PLUGINID = "xianqi";

YggdrasilEngine.Plugin(PLUGINID, engine => {
	engine.registerPiece(PLUGINID, "general", General);
	engine.registerPiece(PLUGINID, "advisor", Advisor);
	engine.registerPiece(PLUGINID, "elephant", Elephant);
	engine.registerPiece(PLUGINID, "horse", Horse);
	engine.registerPiece(PLUGINID, "chariot", Chariot);
	engine.registerPiece(PLUGINID, "cannon", Cannon);
	engine.registerPiece(PLUGINID, "soldier", Soldier);
});

// TODO: generate moves for all pieces in xianqi
// TODO: look at variants on wikipedia
// TODO: implement palace tiles
// TODO: implement river tiles

class General extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: (options?.faction || Math.round(Math.random())) % 2 === 0 ? "Marshal" : "General", isRoyal: true, ...options});
	}

	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

class Advisor extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Advisor", ...options});
	}

	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

class Elephant extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: (options?.faction || Math.round(Math.random())) % 2 === 0 ? "Minister" : "Elephant", ...options});
	}

	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

class Horse extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Horse", ...options});
	}

	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

class Chariot extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Chariot", ...options});
	}

	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

class Cannon extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: (options?.faction || Math.round(Math.random())) % 2 === 0 ? "Cannon" : "Catapult", ...options});
	}

	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

class Soldier extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: (options?.faction || Math.round(Math.random())) % 2 === 0 ? "Soldier" : "Private", ...options});
	}

	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}