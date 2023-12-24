import { YggdrasilEngine, Piece, Pos, Tile, Board, Directions, atom, Move, type PieceConstructorOptions } from "../yggdrasil.ts"

const MODID = "orthodox";

interface PromotionTile extends Tile {
	canPromoteHere?: boolean
}

interface PawnConstructorOptions extends PieceConstructorOptions {
	enPassantTarget?: number
}

@YggdrasilEngine.registerPiece(MODID, "pawn")
class Pawn extends Piece {
	static promotions: Map<new (options?: PieceConstructorOptions) => Piece, PieceConstructorOptions> = new Map();

	/** The last rank this pawn was on if it just took its first move. Otherwise, -1 */
	enPassantTarget: number;

	constructor(options?: PawnConstructorOptions) {
		super({name: "Pawn", ...options});
		this.enPassantTarget = options?.enPassantTarget ?? -1;
	}

	static promotion(propsAfterPromotion?: PawnConstructorOptions) {
		return function decorator<This extends new (options?: PieceConstructorOptions) => Piece>(target: This, context: ClassDecoratorContext<This>) {
			Pawn.promotions.set(target, propsAfterPromotion || {});
		}
	}

	clone(board: Board) {
		const copy = super.clone(board);
		copy.enPassantTarget = this.enPassantTarget;
		return copy;
	}

	JSONify() {
		return {...super.JSONify(), enPassantTarget: this.enPassantTarget};
	}

	@atom(1, 1, 1, [Directions.Forward], true, (piece, _, allMoves) => piece.getPromotions(allMoves)) // Diagonal capture + promotions
	@atom(1, 0, 2, [Directions.Forward], false, (piece, _, allMoves) => allMoves.slice(0, piece.hasMoved ? -1 : undefined)) // Single + Double push
	getMoves(halfTurnMoves?: Move[]): Move[][] {
		// En passant
		const moves: Move[][] = [];
		const tileLF = this.getRelTile(new Pos(-1, 1));
		// TODO: iterate over the L/R files to support arbitrary en passant lengths
		const pieceL = this.board.get(new Pos(this.x + (this.isWhite ? -1 : 1), this.y))?.piece;
		const tileRF = this.getRelTile(new Pos(1, 1));
		const pieceR = this.board.get(new Pos(this.x + (this.isWhite ? 1 : -1), this.y))?.piece;
		if (
			tileLF && (!tileLF?.piece || tileLF.piece.isCapturableBy(this))
			&& pieceL instanceof Pawn && pieceL.isCapturableBy(this)
			&& (this.isWhite ? (pieceL.enPassantTarget <= this.y - 2 && pieceL.y >= this.y) : (pieceL.enPassantTarget >= this.y + 2 && pieceL.y <= this.y))
		) moves.push([new Move({piece: this, fromPos: this.pos, toPos: tileLF.pos, captureAtPos: pieceL.pos}), new Move({piece: this, captureAtPos: tileLF.pos})]);
		if (
			tileRF && (!tileRF?.piece || tileRF.piece.isCapturableBy(this))
			&& pieceR instanceof Pawn && pieceR.isCapturableBy(this)
			&& (this.isWhite ? (pieceR.enPassantTarget <= this.y - 2 && pieceR.y >= this.y) : (pieceR.enPassantTarget >= this.y + 2 && pieceR.y <= this.y))
		) moves.push([new Move({piece: this, fromPos: this.pos, toPos: tileRF.pos, captureAtPos: pieceR.pos}), new Move({piece: this, captureAtPos: tileRF.pos})]);
		return moves;
	}

	getPromotions(allMoves: Move[][]) {
		for (let i = allMoves.length - 1; i >= 0; i--) {
			const farthestMoveIndex = allMoves[i].reduce((farthestMoveIndex, move, j) => {
				if (move.piece !== this) return farthestMoveIndex;
				return (Math.abs(this.y - (move.toPos?.y ?? this.y)) > Math.abs(this.y - (allMoves[i][j]?.toPos?.y ?? this.y))) ? j : farthestMoveIndex;
			}, -1);
			const farthestMove = allMoves[i][farthestMoveIndex];

			if (!(this.board.get(farthestMove?.toPos ?? this.pos) as PromotionTile)?.canPromoteHere) continue;
			allMoves.splice(i, 1, ...[...Pawn.promotions.entries()].map(entry => {
				const moveCopy = [...allMoves[i]];
				moveCopy.splice(farthestMoveIndex, 1, new Move({piece: new entry[0](), spawnAtPos: farthestMove.toPos || this.pos, spawnProps: {board: this.board, hasMoved: true, isWhite: this.isWhite, ...entry[1]}, removeAtPos: farthestMove.fromPos}));
				return moveCopy;
			}));
		}
		return allMoves;
	}

	@YggdrasilEngine.subscribeEvent(YggdrasilEngine.Events.HalfTurnEnd)
	onEndHalfTurn(halfTurn: Move[]) {
		if (!this.hasMoved) return;
		if (this.enPassantTarget > -1) this.enPassantTarget = -1;
		const thisLastPos = halfTurn.findLast(move => move.piece === this)?.fromPos;
		if (!thisLastPos || !thisLastPos.isValid()) return;
		if (Math.abs(Pos.sub(this.pos, thisLastPos).y) > 1) this.enPassantTarget = thisLastPos.y;
	}
}

@YggdrasilEngine.registerPiece(MODID, "rook")
@Pawn.promotion()
class Rook extends Piece {
	constructor(options?: PieceConstructorOptions) {
		super({name: "Rook", ...options});
	}

	@atom(1, 0, 0)
	getMoves(halfTurnMoves?: Move[]): Move[][] {
		return [];
	}
}

@YggdrasilEngine.registerPiece(MODID, "knight")
@Pawn.promotion()
class Knight extends Piece {
	constructor(options?: PieceConstructorOptions) {
		super({name: "Knight", ...options});
	}

	@atom(1, 2)
	getMoves(halfTurnMoves?: Move[]): Move[][] {
		return [];
	}
}

@YggdrasilEngine.registerPiece(MODID, "bishop")
@Pawn.promotion()
class Bishop extends Piece {
	constructor(options?: PieceConstructorOptions) {
		super({name: "Bishop", ...options});
	}

	@atom(1, 1, 0)
	getMoves(halfTurnMoves?: Move[]): Move[][] {
		return [];
	}
}

@YggdrasilEngine.registerPiece(MODID, "queen")
@Pawn.promotion()
class Queen extends Piece {
	constructor(options?: PieceConstructorOptions) {
		super({name: "Queen", ...options});
	}

	@atom(1, 0, 0)
	@atom(1, 1, 0)
	getMoves(halfTurnMoves?: Move[]): Move[][] {
		return [];
	}
}

@YggdrasilEngine.registerPiece(MODID, "king")
class King extends Piece {
	constructor(options?: PieceConstructorOptions) {
		super({name: "King", isRoyal: true, ...options});
	}

	@atom(1, 0)
	@atom(1, 1)
	getMoves(halfTurnMoves?: Move[]): Move[][] {
		// Castling
		const moves: Move[][] = [];
		if (this.hasMoved || !this.pos.isValid()) return moves;
		const x = [-1, 1]; // Left and Right
		for (let n = 1; n < this.board.width; n++) {
			if (!x.length) break;
			for (let i = x.length - 1; i >= 0; i++) {
				const tile = this.board.get(new Pos(this.pos.x + n * x[i], this.pos.y));
				if (!tile) {
					x.splice(i, 1);
					continue;
				}
				const piece = tile.piece;
				if (!piece) continue;
				if (!(piece instanceof Rook)) { // TODO: use decoration to instead mark castleable pieces
					// TODO: check if pos is under attack and stop exploration
					x.splice(i, 1);
					continue;
				}
				moves.push([
					new Move({piece: this, fromPos: this.pos, toPos: new Pos(this.pos.x + 2 * x[i], this.pos.y)}),
					new Move({piece: piece, fromPos: piece.pos, toPos: new Pos(this.pos.x + x[i], this.pos.y)})
				]);
				x.splice(i, 1);
			}
		}
		return moves;
	}
}

export { Rook, Knight, Bishop, Queen, King, Pawn, type PawnConstructorOptions, type PromotionTile }