import { YggdrasilEngine, Piece, type PieceConstructorOptions, Pos, Move } from "../yggdrasil.ts";

/**
 * OP Test Piece
 * - Universal Jumper
 * - Iron
 * - Friendly Fire
 * - Can capture iron pieces
 * - Can make infinite number of moves
 * - Can drop piece from hand
 * - // TODO: Can promote to any piece (needs event subcription to onLoadFinish)
 * - Can suicide
 */
@YggdrasilEngine.registerPiece("test", "test")
class Test extends Piece {

	static promotions: (new (options?: PieceConstructorOptions) => Piece)[] = [];
	
	constructor(options?: PieceConstructorOptions) {
		super({name: "Test Piece", isIron: true, ...options});
	}

	@YggdrasilEngine.subscribeEvent(YggdrasilEngine.Events.loadEnd)
	static onLoad() {
		Test.promotions.push(...YggdrasilEngine.pieceRegistry.values());
	}

	getMoves(halfTurnMoves?: Move[]): Move[][] {
		const prevPos = halfTurnMoves?.findLast(move => move.piece === this)?.toPos || this.pos;

		const moves = this.board.flat().map(tile => {
			// Board drop moves
			if (!this.pos.isValid()) return [new Move({piece: this, dropAtPos: tile.pos, captureAtPos: tile.pos, canContinue: true})];
			// End half turn if performing zero leap
			if (Pos.equals(prevPos, tile.pos)) return [new Move({piece: this})];
			// Universal Jump
			return [new Move({piece: this, fromPos: prevPos, toPos: tile.pos, captureAtPos: tile.pos, canContinue: true})];
		});
		// Suicide
		moves.push([new Move({piece: this, captureAtPos: this.pos})]);
		return moves;
	}
}

export { Test }