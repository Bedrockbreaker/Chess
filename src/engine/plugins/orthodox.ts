import { Directions, Modifiers } from "../../common/util.ts";
import type { PieceConstructorOptions } from "../../common/server.d.ts";
import { YggdrasilEngine, Piece, Pos, Tile, Board, atom, Move } from "../yggdrasil.ts"

const PLUGINID = "orthodox";

YggdrasilEngine.Plugin(PLUGINID, (engine: YggdrasilEngine) => {
	engine.registerPiece(PLUGINID, "pawn", Pawn);
	engine.registerPiece(PLUGINID, "rook", Rook);
	engine.registerPiece(PLUGINID, "knight", Knight);
	engine.registerPiece(PLUGINID, "bishop", Bishop);
	engine.registerPiece(PLUGINID, "queen", Queen);
	engine.registerPiece(PLUGINID, "king", King);
});

export interface PromotionTile extends Tile {
	canPromoteHere?: boolean
}

export interface PawnConstructorOptions extends PieceConstructorOptions {
	enPassantTarget?: {x: number, y: number}
}

export class Pawn extends Piece {
	static promotions: Map<typeof Piece, PieceConstructorOptions> = new Map();

	/** The last pos this pawn was on if it just took its first move */
	enPassantTarget: Pos;

	constructor(engine: YggdrasilEngine, options?: PawnConstructorOptions) {
		super(engine, {name: "Pawn", ...options});
		this.enPassantTarget = options?.enPassantTarget ? new Pos(options.enPassantTarget.x, options.enPassantTarget.y) : new Pos();
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

	package() {
		return {...super.package(), enPassantTarget: this.enPassantTarget}
	}

	@atom({x: 1, y: 1, directions: [Directions.Forward], modifiers: [Modifiers.Capture], callback: (piece, newMoves, oldMoves, allMoves) => piece.getPromotions(allMoves)}) // Diagonal capture + promotions
	@atom({x: 1, y: 0, directions: [Directions.Forward], modifiers: [Modifiers.NonCapture], callback: (piece, newMoves, oldMoves) => [...oldMoves, ...newMoves.slice(0, piece.hasMoved && newMoves.length > 1 ? 1 : undefined)]}) // Diagonal capture + promotions
	getMoves(halfTurnMoves?: Move[]): Move[][] {
		// En passant
		const moves: Move[][] = [];
		const tileLF = this.getRelTile(new Pos(-1, 1));
		const tileRF = this.getRelTile(new Pos(1, 1));

		// Q: "Why would there ever be multiple?" A: ¯\_(ツ)_/¯
		const potentialTargets = this.engine.pieces.filter(piece => piece instanceof Pawn && piece.enPassantTarget.isValid() && piece.isCapturableBy(this)) as Pawn[];
		for (const target of potentialTargets) {
			// Construct a line through the end positions of the target's movement.
			const m = Pos.sub(target.pos, target.enPassantTarget);
			const line = (pos: Pos) => m.x*(pos.y - target.pos.y) - m.y*(pos.x - target.pos.x);
			// Scaled distance to perpendicular bisector
			const distance = (pos: Pos) => Math.abs(m.y*(pos.y - (target.enPassantTarget.y + target.pos.y)/2) - m.x*(pos.x - (target.enPassantTarget.x + target.pos.x)/2));
			const distanceMax = distance(target.pos);
			
			// If a diagonal move lies on the line and is within the max distance of the perpendicular bisector, it is an en passant.
			if (tileLF && line(tileLF.pos) === 0 && distance(tileLF.pos) < distanceMax) {
				const enPassant = [new Move({piece: this, fromPos: this.pos, toPos: tileLF.pos, captureAtPos: target.pos})];
				if (tileLF.piece && tileLF.piece.isCapturableBy(this)) enPassant.push(new Move({piece: this, captureAtPos: tileLF.pos}));
				moves.push(enPassant);
			}
			if (tileRF && line(tileRF.pos) === 0 && distance(tileRF.pos) < distanceMax) {
				const enPassant = [new Move({piece: this, fromPos: this.pos, toPos: tileRF.pos, captureAtPos: target.pos})];
				if (tileRF.piece && tileRF.piece.isCapturableBy(this)) enPassant.push(new Move({piece: this, captureAtPos: tileRF.pos}));
				moves.push(enPassant);
			}
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
				const promotion = new entry[0](this.engine, {board: this.board, hasMoved: true, faction: this.faction, forwards: this.forwards, ...entry[1]});
				moveCopy.splice(farthestMoveIndex, 1, new Move({pieceNamespace: promotion.namespace, spawnAtPos: farthestMove.toPos || this.pos, spawnProps: {board: this.board, hasMoved: true, faction: this.faction, forwards: this.forwards, name: this.name === "Pawn" ? `${promotion.name} (Promoted Pawn)` : this.name, ...entry[1]}, removeAtPos: farthestMove.fromPos}));
				return moveCopy;
			}));
		}
		return allMoves;
	}

	onEndHalfTurn(halfTurn: Move[]) {
		if (!this.hasMoved) return;
		if (this.enPassantTarget.isValid()) this.enPassantTarget = new Pos();
		const thisLastPos = halfTurn.findLast(move => move.piece === this)?.fromPos;
		if (!thisLastPos || !thisLastPos.isValid()) return;
		// BUG: diagonal captures will be registered as en passant moves
		if (Math.abs(this.pos.x - thisLastPos.x) + Math.abs(this.pos.y - thisLastPos.y) > 1) this.enPassantTarget = thisLastPos;
	}
}

export class King extends Piece {

	static castlers = new Set<typeof Piece>();

	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "King", isRoyal: true, ...options});
	}

	static castleable<This extends typeof Piece>(target: This, context: ClassDecoratorContext<This>) {
		King.castlers.add(target);
	}

	@atom({x: 1, y: 0})
	@atom({x: 1, y: 1})
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
				if (!King.castlers.has(piece.constructor as typeof Piece) || piece.hasMoved || piece.faction !== this.faction) {
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

@Pawn.promotion()
@King.castleable
export class Rook extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Rook", ...options});
	}

	@atom({x: 1, y: 0, range: 0})
	getMoves(halfTurnMoves?: Move[]): Move[][] {
		return [];
	}
}

@Pawn.promotion()
export class Knight extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Knight", ...options});
	}

	@atom({x: 1, y: 2})
	getMoves(halfTurnMoves?: Move[] | undefined): Move[][] {
		return [];
	}
}

@Pawn.promotion()
export class Bishop extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Bishop", ...options});
	}

	@atom({x: 1, y: 1, range: 0})
	getMoves(halfTurnMoves?: Move[]): Move[][] {
		return [];
	}
}

@Pawn.promotion()
export class Queen extends Piece {
	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		super(engine, {name: "Queen", ...options});
	}

	@atom({x: 1, y: 0, range: 0})
	@atom({x: 1, y: 1, range: 0})
	getMoves(halfTurnMoves?: Move[]): Move[][] {
		return [];
	}
}