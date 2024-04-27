import type { PieceConstructorOptions } from "../../common/server.js";
import { YggdrasilEngine, Piece, atom, Move } from "../yggdrasil.ts";

const PLUGIND = "fundamental";

YggdrasilEngine.Plugin(PLUGIND, engine => {
	engine.registerPiece(PLUGIND, "zero", Zero);
	engine.registerPiece(PLUGIND, "wazir", Wazir);
	engine.registerPiece(PLUGIND, "ferz", Ferz);
	engine.registerPiece(PLUGIND, "dababba", Dababba);
	engine.registerPiece(PLUGIND, "knight", Knight);
	engine.registerPiece(PLUGIND, "alfil", Alfil);
	engine.registerPiece(PLUGIND, "threeleaper", Threeleaper);
	engine.registerPiece(PLUGIND, "camel", Camel);
	engine.registerPiece(PLUGIND, "zebra", Zebra);
	engine.registerPiece(PLUGIND, "tripper", Tripper);
	engine.registerPiece(PLUGIND, "fourleaper", Fourleaper);
	engine.registerPiece(PLUGIND, "giraffe", Giraffe);
	engine.registerPiece(PLUGIND, "stag", Stag);
	engine.registerPiece(PLUGIND, "antelope", Antelope);
	engine.registerPiece(PLUGIND, "commuter", Commuter);
});

export class Zero extends Piece {
	constructor(engine: YggdrasilEngine, options: PieceConstructorOptions) {
		super(engine, {...options, name: "Zero"});
	}

	getMoves(halfTurnMoves?: Move[]): Move[][] {
		return [[new Move({piece: this, fromPos: this.pos, toPos: this.pos})]];
	}
}

export class Wazir extends Piece {
	constructor(engine: YggdrasilEngine, options: PieceConstructorOptions) {
		super(engine, {...options, name: "Wazir"});
	}

	@atom({x: 1, y: 0})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

export class Ferz extends Piece {
	constructor(engine: YggdrasilEngine, options: PieceConstructorOptions) {
		super(engine, {...options, name: "Ferz"});
	}

	@atom({x: 1, y: 1})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

export class Dababba extends Piece {
	constructor(engine: YggdrasilEngine, options: PieceConstructorOptions) {
		super(engine, {...options, name: "Dababba"});
	}

	@atom({x: 2, y: 0})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

export class Knight extends Piece {
	constructor(engine: YggdrasilEngine, options: PieceConstructorOptions) {
		super(engine, {...options, name: "Knight"});
	}

	@atom({x: 2, y: 1})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

export class Alfil extends Piece {
	constructor(engine: YggdrasilEngine, options: PieceConstructorOptions) {
		super(engine, {...options, name: "Alfil"});
	}

	@atom({x: 2, y: 2})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

export class Threeleaper extends Piece {
	constructor(engine: YggdrasilEngine, options: PieceConstructorOptions) {
		super(engine, {...options, name: "Threeleaper"});
	}

	@atom({x: 3, y: 0})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

export class Camel extends Piece {
	constructor(engine: YggdrasilEngine, options: PieceConstructorOptions) {
		super(engine, {...options, name: "Camel"});
	}

	@atom({x: 3, y: 1})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

export class Zebra extends Piece {
	constructor(engine: YggdrasilEngine, options: PieceConstructorOptions) {
		super(engine, {...options, name: "Zebra"});
	}

	@atom({x: 3, y: 2})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

export class Tripper extends Piece {
	constructor(engine: YggdrasilEngine, options: PieceConstructorOptions) {
		super(engine, {...options, name: "Tripper"});
	}

	@atom({x: 3, y: 3})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

export class Fourleaper extends Piece {
	constructor(engine: YggdrasilEngine, options: PieceConstructorOptions) {
		super(engine, {...options, name: "Fourleaper"});
	}

	@atom({x: 4, y: 0})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

export class Giraffe extends Piece {
	constructor(engine: YggdrasilEngine, options: PieceConstructorOptions) {
		super(engine, {...options, name: "Giraffe"});
	}

	@atom({x: 4, y: 1})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

export class Stag extends Piece {
	constructor(engine: YggdrasilEngine, options: PieceConstructorOptions) {
		super(engine, {...options, name: "Stag"});
	}

	@atom({x: 4, y: 2})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

export class Antelope extends Piece {
	constructor(engine: YggdrasilEngine, options: PieceConstructorOptions) {
		super(engine, {...options, name: "Antelope"});
	}

	@atom({x: 4, y: 3})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

export class Commuter extends Piece {
	constructor(engine: YggdrasilEngine, options: PieceConstructorOptions) {
		super(engine, {...options, name: "Commuter"});
	}

	@atom({x: 4, y: 4})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}