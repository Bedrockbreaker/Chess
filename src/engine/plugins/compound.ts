import type { PieceConstructorOptions } from "../../common/server.d.ts";
import { Modifiers } from "../../common/util.ts";
import { YggdrasilEngine, Piece, atom, Move } from "../yggdrasil.ts";

const PLUGIND = "compound";

YggdrasilEngine.Plugin(PLUGIND, engine => {
	// Dual compound pieces
	engine.registerPiece(PLUGIND, "sailor", Sailor);
	engine.registerPiece(PLUGIND, "missionary", Missionary);
	engine.registerPiece(PLUGIND, "centaur", Centaur);
	engine.registerPiece(PLUGIND, "aviator", Aviator);
	engine.registerPiece(PLUGIND, "chancellor", Chancellor);
	engine.registerPiece(PLUGIND, "flyingfortress", FlyingFortress);
	engine.registerPiece(PLUGIND, "archbishop", Archbishop);
	engine.registerPiece(PLUGIND, "angel", Angel);
	engine.registerPiece(PLUGIND, "pegasus", Pegasus);

	// Triple compound pieces
	engine.registerPiece(PLUGIND, "hippocampus", Hippocampus);
	engine.registerPiece(PLUGIND, "admiral", Admiral);
	engine.registerPiece(PLUGIND, "crusader", Crusader);
	engine.registerPiece(PLUGIND, "inquisitor", Inquisitor);
	engine.registerPiece(PLUGIND, "pterocentaur", Pterocentaur);
	engine.registerPiece(PLUGIND, "amazon", Amazon);
	engine.registerPiece(PLUGIND, "empress", Empress);
	engine.registerPiece(PLUGIND, "hippogriff", Hippogriff);
	engine.registerPiece(PLUGIND, "cherub", Cherub);

	// Quadruple compound pieces
	engine.registerPiece(PLUGIND, "manticore", Manticore);
	engine.registerPiece(PLUGIND, "seraph", Seraph);
	engine.registerPiece(PLUGIND, "basilisk", Basilisk);

	// Quintuple compound pieces in this context don't exist. (man + rook + bishop = rook + bishop)
});

export class Sailor extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Sailor", ...options});
	}

	@atom({x: 1, y: 1})
	@atom({x: 1, y: 0, range: 0})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

export class Missionary extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Missionary", ...options});
	}

	@atom({x: 1, y: 0})
	@atom({x: 1, y: 1, range: 0})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

export class Centaur extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Centaur", ...options});
	}

	@atom({x: 1, y: 0})
	@atom({x: 1, y: 1})
	@atom({x: 1, y: 2})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

export class Aviator extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Aviator", ...options});
	}

	@atom({x: 1, y: 0})
	@atom({x: 1, y: 1})
	@atom({x: 1, y: 3, modifiers: [Modifiers.NoLeap]})
	@atom({x: 2, y: 3, modifiers: [Modifiers.NoLeap]})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

export class Chancellor extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Chancellor", ...options});
	}

	@atom({x: 1, y: 2})
	@atom({x: 1, y: 0, range: 0})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

export class FlyingFortress extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Flying Fortress", ...options});
	}

	@atom({x: 1, y: 0, range: 0})
	@atom({x: 1, y: 3, modifiers: [Modifiers.NoLeap]})
	@atom({x: 2, y: 3, modifiers: [Modifiers.NoLeap]})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

export class Archbishop extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Archbishop", ...options});
	}

	@atom({x: 1, y: 2})
	@atom({x: 1, y: 1, range: 0})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

export class Angel extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Angel", ...options});
	}

	@atom({x: 1, y: 1, range: 0})
	@atom({x: 1, y: 3, modifiers: [Modifiers.NoLeap]})
	@atom({x: 2, y: 3, modifiers: [Modifiers.NoLeap]})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

export class Pegasus extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Pegasus", ...options});
	}

	@atom({x: 1, y: 2})
	@atom({x: 1, y: 3, modifiers: [Modifiers.NoLeap]})
	@atom({x: 2, y: 3, modifiers: [Modifiers.NoLeap]})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

export class Hippocampus extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Hippocampus", ...options});
	}

	@atom({x: 1, y: 1})
	@atom({x: 1, y: 2})
	@atom({x: 1, y: 0, range: 0})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

export class Admiral extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Admiral", ...options});
	}

	@atom({x: 1, y: 1})
	@atom({x: 1, y: 0, range: 0})
	@atom({x: 1, y: 3, modifiers: [Modifiers.NoLeap]})
	@atom({x: 2, y: 3, modifiers: [Modifiers.NoLeap]})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

export class Crusader extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Crusader", ...options});
	}

	@atom({x: 1, y: 0})
	@atom({x: 1, y: 2})
	@atom({x: 1, y: 1, range: 0})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

export class Inquisitor extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Inquisitor", ...options});
	}

	@atom({x: 1, y: 0})
	@atom({x: 1, y: 1, range: 0})
	@atom({x: 1, y: 3, modifiers: [Modifiers.NoLeap]})
	@atom({x: 2, y: 3, modifiers: [Modifiers.NoLeap]})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

export class Pterocentaur extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Pterocentaur", ...options});
	}

	@atom({x: 1, y: 0})
	@atom({x: 1, y: 1})
	@atom({x: 1, y: 2})
	@atom({x: 1, y: 3, modifiers: [Modifiers.NoLeap]})
	@atom({x: 2, y: 3, modifiers: [Modifiers.NoLeap]})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

export class Amazon extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Amazon", ...options});
	}

	@atom({x: 1, y: 2})
	@atom({x: 1, y: 0, range: 0})
	@atom({x: 1, y: 1, range: 0})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

export class Empress extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Empress", ...options});
	}

	@atom({x: 1, y: 0, range: 0})
	@atom({x: 1, y: 1, range: 0})
	@atom({x: 1, y: 3, modifiers: [Modifiers.NoLeap]})
	@atom({x: 2, y: 3, modifiers: [Modifiers.NoLeap]})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

export class Hippogriff extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Hippogriff", ...options});
	}

	@atom({x: 1, y: 0, range: 0})
	@atom({x: 1, y: 2})
	@atom({x: 1, y: 3, modifiers: [Modifiers.NoLeap]})
	@atom({x: 2, y: 3, modifiers: [Modifiers.NoLeap]})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

export class Cherub extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Cherub", ...options});
	}

	@atom({x: 1, y: 1, range: 0})
	@atom({x: 1, y: 2})
	@atom({x: 1, y: 3, modifiers: [Modifiers.NoLeap]})
	@atom({x: 2, y: 3, modifiers: [Modifiers.NoLeap]})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

export class Manticore extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Manticore", ...options});
	}

	@atom({x: 1, y: 1})
	@atom({x: 1, y: 2})
	@atom({x: 1, y: 0, range: 0})
	@atom({x: 1, y: 3, modifiers: [Modifiers.NoLeap]})
	@atom({x: 2, y: 3, modifiers: [Modifiers.NoLeap]})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

export class Seraph extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Seraph", ...options});
	}

	@atom({x: 1, y: 0})
	@atom({x: 1, y: 2})
	@atom({x: 1, y: 1, range: 0})
	@atom({x: 1, y: 3, modifiers: [Modifiers.NoLeap]})
	@atom({x: 2, y: 3, modifiers: [Modifiers.NoLeap]})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

export class Basilisk extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Basilisk", ...options});
	}

	@atom({x: 1, y: 2})
	@atom({x: 1, y: 0, range: 0})
	@atom({x: 1, y: 1, range: 0})
	@atom({x: 1, y: 3, modifiers: [Modifiers.NoLeap]})
	@atom({x: 2, y: 3, modifiers: [Modifiers.NoLeap]})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}