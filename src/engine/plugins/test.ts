import { YggdrasilEngine, Piece, type PieceConstructorOptions, Pos, Move } from "../yggdrasil.ts";

YggdrasilEngine.Plugin("test", (engine: YggdrasilEngine) => engine.registerPiece("test", "test", Test));

/**
 * OP Test Piece
 * - Universal Jumper
 * - Iron
 * - Friendly Fire
 * - Can capture iron pieces
 * - Can make infinite number of moves
 * - Can drop piece from hand
 * - // TODO: Can promote to any piece
 * - Can suicide
 */
class Test extends Piece {

	foo = "bar";
	
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Test Piece", isIron: true, ...options});
	}

	getMoves(halfTurnMoves?: Move[]): Move[][] {
		const prevPos = halfTurnMoves?.findLast(move => move.piece === this)?.toPos || this.pos;

		const moves = this.board.flat().map(tile => {
			// Board drop moves
			if (!this.pos.isValid()) return [new Move({piece: this, dropAtPos: tile.pos, captureAtPos: tile.pos, canContinue: true})];
			// End half turn if performing zero leap
			if (Pos.equals(prevPos, tile.pos)) return [new Move({piece: this, fromPos: prevPos, toPos: tile.pos})];
			// Universal Jump
			const jump = new Move({piece: this, fromPos: prevPos, toPos: tile.pos, captureAtPos: tile.pos, canContinue: true});
			if (tile.piece) jump.captureAtPos = tile.pos;
			return [jump];
		});
		// Suicide
		moves.push([new Move({piece: this, captureAtPos: this.pos})]);
		return moves;
	}
}

export { Test }