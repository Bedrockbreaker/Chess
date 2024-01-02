import { YggdrasilEngine, Piece, Pos, Tile, Board, Directions, atom, Move, type PieceConstructorOptions } from "../yggdrasil.ts"

const PLUGINID = "orthodox";

YggdrasilEngine.Plugin(PLUGINID, (engine: YggdrasilEngine) => {
	engine.registerPiece(PLUGINID, "pawn", Pawn);
	engine.registerPiece(PLUGINID, "rook", Rook);
	engine.registerPiece(PLUGINID, "knight", Knight);
	engine.registerPiece(PLUGINID, "bishop", Bishop);
	engine.registerPiece(PLUGINID, "queen", Queen);
	engine.registerPiece(PLUGINID, "king", King);
});

interface PromotionTile extends Tile {
	canPromoteHere?: boolean
}

interface PawnConstructorOptions extends PieceConstructorOptions {
	enPassantTarget?: number
}

class Pawn extends Piece {
	static promotions: Map<typeof Piece, PieceConstructorOptions> = new Map();

	/** The last rank this pawn was on if it just took its first move. Otherwise, -1 */
	enPassantTarget: number;

	constructor(engine: YggdrasilEngine, options?: PawnConstructorOptions) {
		super(engine, {name: "Pawn", ...options});
		this.enPassantTarget = options?.enPassantTarget ?? -1;
		engine.subscribeEvent(YggdrasilEngine.Events.HalfTurnEnd, this.onEndHalfTurn.bind(this));
	}

	static promotion(propsAfterPromotion?: PawnConstructorOptions) {
		return function decorator<This extends typeof Piece>(target: This, context: ClassDecoratorContext<This>) {
			Pawn.promotions.set(target, propsAfterPromotion || {});
		}
	}

	clone(board: Board) {
		const copy = super.clone(board) as Pawn;
		copy.enPassantTarget = this.enPassantTarget;
		return copy;
	}

	JSONify() {
		return {...super.JSONify(), enPassantTarget: this.enPassantTarget};
	}

	@atom(1, 1, 1, [Directions.Forward], true, (piece, newMoves, oldMoves, allMoves) => piece.getPromotions(allMoves)) // Diagonal capture + promotions
	@atom(1, 0, 2, [Directions.Forward], false, (piece, newMoves, oldMoves) => [...oldMoves, ...newMoves.slice(0, piece.hasMoved && newMoves.length > 1 ? 1 : undefined)]) // Single + Double push
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
			&& pieceL instanceof Pawn && pieceL.isCapturableBy(this) && pieceL.enPassantTarget !== -1
			&& (this.isWhite ? (pieceL.enPassantTarget <= this.y - 2 && pieceL.y >= this.y) : (pieceL.enPassantTarget >= this.y + 2 && pieceL.y <= this.y))
		) {
			const enPassant = [new Move({piece: this, fromPos: this.pos, toPos: tileLF.pos, captureAtPos: pieceL.pos})];
			if (tileLF.piece) enPassant.push(new Move({piece: this, captureAtPos: tileLF.pos}));
			moves.push(enPassant);
		}
		if (
			tileRF && (!tileRF?.piece || tileRF.piece.isCapturableBy(this))
			&& pieceR instanceof Pawn && pieceR.isCapturableBy(this) && pieceR.enPassantTarget !== -1
			&& (this.isWhite ? (pieceR.enPassantTarget <= this.y - 2 && pieceR.y >= this.y) : (pieceR.enPassantTarget >= this.y + 2 && pieceR.y <= this.y))
		) {
			const enPassant = [new Move({piece: this, fromPos: this.pos, toPos: tileRF.pos, captureAtPos: pieceR.pos})];
			if (tileRF.piece) enPassant.push(new Move({piece: this, captureAtPos: tileRF.pos}));
			moves.push(enPassant);
		}
		return moves;
	}

	getPromotions(allMoves: Move[][]) {
		for (let i = allMoves.length - 1; i >= 0; i--) {
			const halfTurn = allMoves[i];
			const farthestMoveIndex = halfTurn.reduce((farthestMoveIndex, move, j) => {
				if (move.piece !== this) return farthestMoveIndex;
				return (Math.abs((move.toPos?.y ?? this.y) - this.y) > Math.abs((halfTurn[farthestMoveIndex]?.toPos?.y ?? this.y) - this.y)) ? j : farthestMoveIndex;
			}, -1);
			const farthestMove = halfTurn[farthestMoveIndex];

			if (!(this.board.get(farthestMove?.toPos ?? this.pos) as PromotionTile)?.canPromoteHere) continue;
			allMoves.splice(i, 1, ...[...Pawn.promotions.entries()].map(entry => {
				const moveCopy = [...halfTurn];
				const promotion = new entry[0](this.engine, {board: this.board, hasMoved: true, isWhite: this.isWhite, ...entry[1]});
				moveCopy.splice(farthestMoveIndex, 1, new Move({pieceNamespace: this.engine.getNamespace(promotion) || "", spawnAtPos: farthestMove.toPos || this.pos, spawnProps: {board: this.board, hasMoved: true, isWhite: this.isWhite, name: this.name === "Pawn" ? `${promotion.name} (Promoted Pawn)` : this.name, ...entry[1]}, removeAtPos: farthestMove.fromPos}));
				return moveCopy;
			}));
		}
		return allMoves;
	}

	onEndHalfTurn(halfTurn: Move[]) {
		if (!this.hasMoved) return;
		if (this.enPassantTarget > -1) this.enPassantTarget = -1;
		const thisLastPos = halfTurn.findLast(move => move.piece === this)?.fromPos;
		if (!thisLastPos || !thisLastPos.isValid()) return;
		if (Math.abs(Pos.sub(this.pos, thisLastPos).y) > 1) this.enPassantTarget = thisLastPos.y;
	}
}

@Pawn.promotion()
class Rook extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Rook", ...options});
	}

	@atom(1, 0, 0)
	getMoves(halfTurnMoves?: Move[]): Move[][] {
		return [];
	}
}

@Pawn.promotion()
class Knight extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Knight", ...options});
	}

	@atom(1, 2)
	getMoves(halfTurnMoves?: Move[]): Move[][] {
		return [];
	}
}

@Pawn.promotion()
class Bishop extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Bishop", ...options});
	}

	@atom(1, 1, 0)
	getMoves(halfTurnMoves?: Move[]): Move[][] {
		return [];
	}
}

@Pawn.promotion()
class Queen extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Queen", ...options});
	}

	@atom(1, 0, 0)
	@atom(1, 1, 0)
	getMoves(halfTurnMoves?: Move[]): Move[][] {
		return [];
	}
}

class King extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "King", isRoyal: true, ...options});
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
			for (let i = x.length - 1; i >= 0; i--) {
				const tile = this.board.get(new Pos(this.pos.x + n * x[i], this.pos.y));
				if (!tile) {
					x.splice(i, 1);
					continue;
				}
				const piece = tile.piece;
				// TODO: check if pos is under attack and stop exploration
				if (!piece) continue;
				if (!(piece instanceof Rook) || piece.hasMoved || piece.isWhite !== this.isWhite) { // TODO: use decoration to instead mark castleable pieces
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