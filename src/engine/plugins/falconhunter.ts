import type { PieceConstructorOptions } from "../../common/server.d.ts";
import { Directions } from "../../common/util.ts";
import { YggdrasilEngine, Piece, atom, Move } from "../yggdrasil.ts";

const PLUGIND = "falconhunter";

YggdrasilEngine.Plugin(PLUGIND, engine => {
	engine.registerPiece(PLUGIND, "falcon", Falcon);
	engine.registerPiece(PLUGIND, "hunter", Hunter);
});

class Falcon extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Falcon", ...options});
	}

	@atom({x: 1, y: 0, range: 0, directions: [Directions.Back]})
	@atom({x: 1, y: 1, range: 0, directions: [Directions.Forward]})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

class Hunter extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Hunter", ...options});
	}

	@atom({x: 1, y: 1, range: 0, directions: [Directions.Back]})
	@atom({x: 1, y: 0, range: 0, directions: [Directions.Forward]})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}