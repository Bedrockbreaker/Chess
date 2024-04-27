import type { PieceConstructorOptions } from "../../common/server.d.ts";
import { Modifiers } from "../../common/util.ts";
import { YggdrasilEngine, Piece, atom, Move } from "../yggdrasil.ts";

const PLUGIND = "falcon";

YggdrasilEngine.Plugin(PLUGIND, engine => {
	engine.registerPiece(PLUGIND, "falcon", Falcon);
});

class Falcon extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Falcon", ...options});
	}

	@atom({x: 1, y: 3, modifiers: [Modifiers.NoLeap]})
	@atom({x: 2, y: 3, modifiers: [Modifiers.NoLeap]})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}