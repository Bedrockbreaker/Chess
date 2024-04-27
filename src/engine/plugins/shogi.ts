import type { PieceConstructorOptions } from "../../common/server.d.ts";
import { Directions } from "../../common/util.ts";
import { Move, Piece, YggdrasilEngine, atom } from "../yggdrasil.ts";

const PLUGINID = "shogi";

YggdrasilEngine.Plugin(PLUGINID, engine => {
	engine.registerPiece(PLUGINID, "general", General);
	engine.registerPiece(PLUGINID, "rook", Rook);
	engine.registerPiece(PLUGINID, "dragon", Dragon);
	engine.registerPiece(PLUGINID, "bishop", Bishop);
	engine.registerPiece(PLUGINID, "horse", Horse);
	engine.registerPiece(PLUGINID, "goldgeneral", GoldGeneral);
	engine.registerPiece(PLUGINID, "silvergeneral", SilverGeneral);
	engine.registerPiece(PLUGINID, "promotedsilver", PromotedSilver);
	engine.registerPiece(PLUGINID, "knight", Knight);
	engine.registerPiece(PLUGINID, "promotedknight", PromotedKnight);
	engine.registerPiece(PLUGINID, "lance", Lance);
	engine.registerPiece(PLUGINID, "promotedlance", PromotedLance);
	engine.registerPiece(PLUGINID, "pawn", Pawn);
	engine.registerPiece(PLUGINID, "tokin", Tokin);
});

// TODO: generate drop moves
// TODO: generate promotions

class General extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: (options?.faction || Math.round(Math.random())) % 2 === 0 ? "King General" : "Jeweled General", isRoyal: true, ...options});
	}

	@atom({x: 1, y: 0})
	@atom({x: 1, y: 1})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

class Rook extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Rook", ...options});
	}

	@atom({x: 1, y: 0, range: 0})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

class Dragon extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Dragon", ...options});
	}

	@atom({x: 1, y: 1})
	@atom({x: 1, y: 0, range: 0})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

class Bishop extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Bishop", ...options});
	}

	@atom({x: 1, y: 1, range: 0})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

class Horse extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Horse", ...options});
	}

	@atom({x: 1, y: 0})
	@atom({x: 1, y: 1, range: 0})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

class GoldGeneral extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Gold General", ...options});
	}

	@atom({x: 1, y: 0})
	@atom({x: 1, y: 1, directions: [Directions.Forward]})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

class SilverGeneral extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Silver General", ...options});
	}

	@atom({x: 1, y: 1})
	@atom({x: 1, y: 0, directions: [Directions.Forward]})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

class PromotedSilver extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Promoted Silver", ...options});
	}

	@atom({x: 1, y: 0})
	@atom({x: 1, y: 1, directions: [Directions.Forward]})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

class Knight extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Knight", ...options});
	}

	@atom({x: 1, y: 2, directions: [Directions.FrontFront]})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

class PromotedKnight extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Promoted Knight", ...options});
	}

	@atom({x: 1, y: 0})
	@atom({x: 1, y: 1, directions: [Directions.Forward]})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

class Lance extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Lance", ...options});
	}

	@atom({x: 1, y: 0, range: 0, directions: [Directions.Forward]})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

class PromotedLance extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Promoted Lance", ...options});
	}

	@atom({x: 1, y: 0})
	@atom({x: 1, y: 1, directions: [Directions.Forward]})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

class Pawn extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Foot Soldier", ...options});
	}

	@atom({x: 1, y: 0, directions: [Directions.Forward]})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

class Tokin extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Tokin", ...options});
	}

	@atom({x: 1, y: 0})
	@atom({x: 1, y: 1, directions: [Directions.Forward]})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}