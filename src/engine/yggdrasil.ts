import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import Hash from "object-hash";

// import type { GameSettings } from "../common/common.d.ts";
import type { GameState, Tile as ClientTile, Piece as ClientPiece, Move as ClientMove } from "../common/client.d.ts";
import type { GameSettings, MoveDescriptor, Atom, PieceConstructorOptions, TileConstructorOptions } from "../common/server.ts";
import { Cardinals, Directions, Modifiers, Events } from "../common/util.ts";
import type { Pawn } from "./plugins/orthodox.ts";

// https://en.wikipedia.org/wiki/Fairy_chess_piece

/**
 * A 2D position
 */
class Pos {
	x: number = 0;
	y: number = 0;

	constructor();
	constructor(hex?: string)
	constructor(x: number, y: number)
	constructor(x?: number | string, y?: number) {
		if (typeof(x) === "string") {
			this.y = parseInt(x.slice(0, 4), 16);
			this.x = parseInt(x.slice(4), 16);
			return;
		}
		this.x = x ?? NaN;
		this.y = y ?? NaN;
	}

	static equals(p1: Pos, p2: Pos) {
		return p1.x === p2.x && p1.y === p2.y;
	}

	static add(p1: Pos, p2: Pos) {
		return new Pos(p1.x + p2.x, p1.y + p2.y);
	}

	static sub(p1: Pos, p2: Pos) {
		return new Pos(p1.x - p2.x, p1.y - p2.y);
	}

	static scale(pos: Pos, scaleX: number, scaleY?: number) {
		return new Pos(pos.x * scaleX, (scaleY ?? scaleX) * pos.y);
	}

	static rotate90cw(pos: Pos, n: number = 1) {
		const cosT = [1, 0, -1, 0][n % 4];
		const sinT = [0, -1, 0, 1][n % 4];
		return new Pos(cosT * pos.x - sinT * pos.y, sinT * pos.x + cosT * pos.y);
	}

	isValid() {
		return !Number.isNaN(this.x) && !Number.isNaN(this.y);
	}

	toHex() {
		return this.y.toString(16).padStart(4, "0") + this.x.toString(16).padStart(4, "0");
	}
}

/**
 * A tile on the board
 */
class Tile {
	[key: string]: unknown;
	pos: Pos;
	piece?: Piece;

	constructor(options?: TileConstructorOptions) {
		this.pos = options?.pos || new Pos();
		this.piece = options?.piece;

		if (!options) return;
		const pairs = Object.entries(options);
		for (let i = 0; i < pairs.length; i++) {
			const key = pairs[i][0];
			if (key === "pos" || key === "piece") continue;
			this[key] = pairs[i][1];
		}
	}

	clone(board?: Board) {
		const copy = new Tile();
		const props = Object.keys(this);
		for (let i = 0; i < props.length; i++) {
			copy[props[i]] = this[props[i]];
		}
		copy.piece = this.piece?.clone(board);
		return copy;
	}

	package(): ClientTile {
		if (!this.piece) return {pos: this.pos};
		return {pos: this.pos, piece: this.piece.package(), pieceNamespace: this.piece.namespace};
	}
}

/**
 * An entire board of tiles and pieces
 */
class Board extends Array<Tile[]> {

	clone() {
		const copy = new Board();

		for (let y = 0; y < this.height; y++) {
			copy[y] = [];
			for (let x = 0; x < this.width; x++) {
				copy[y][x] = this[y][x].clone(copy);
			}
		}

		return copy;
	}

	get(pos: Pos): Tile | undefined {
		return this[pos.y]?.[pos.x];
	}

	package() {
		const packaged: ClientTile[][] = [];

		for (let y = 0; y < this.height; y++) {
			packaged[y] = [];
			for (let x = 0; x < this.width; x++) {
				packaged[y][x] = this[y][x].package();
			}
		}

		return packaged;
	}

	get width() {
		return this[0].length;
	}

	get height() {
		return this.length;
	}
}

/**
 * A generic piece to extend from
 */
class Piece {
	engine: YggdrasilEngine;
	board: Board;
	pos: Pos;

	name: string;
	faction: number;
	/** The forwards direction for movement */
	forwards: Cardinals;
	/** Whether this piece can be checked/check-mated */
	isRoyal: boolean;
	/** Whether this piece can be captured */
	isIron: boolean;
	hasMoved: boolean;

	get x() {
		return this.pos.x;
	}

	get y() {
		return this.pos.y;
	}

	get namespace() {
		return this.engine.getNamespace(this)!;
	}

	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		this.engine = engine;
		this.board = options?.board || new Board();
		this.pos = options?.pos || new Pos(NaN, NaN);
		this.name = options?.name || "Generic Piece";
		this.faction = options?.faction ?? 0;
		this.forwards = options?.forwards ?? Cardinals.North;
		this.isRoyal = options?.isRoyal || false;
		this.isIron = options?.isIron || false;
		this.hasMoved = options?.hasMoved || false;
	}

	clone(board?: Board) {
		return new (this.constructor as typeof Piece)(this.engine, {board: board, pos: this.pos, name: this.name, faction: this.faction, isRoyal: this.isRoyal, isIron: this.isIron, hasMoved: this.hasMoved});
	}

	/**
	 * Package this piece to be sent over the network
	 */
	package(): ClientPiece {
		return {
			pos: {x: this.x, y: this.y},
			name: this.name,
			faction: this.faction,
			forwards: this.forwards,
			isRoyal: this.isRoyal,
			isIron: this.isIron,
			hasMoved: this.hasMoved
		}
	}

	/**
	 * Get the current psuedo-legal moves which can be taken, given the current list of moves taken this half-turn  
	 * Each index should contain another array of all single moves which must be taken together (e.g. castling)
	 */
	getMoves(halfTurnMoves?: Move[]): Move[][] {
		return [];
	}

	/**
	 * Whether this piece can be captured by the given piece
	 */
	isCapturableBy(piece: Piece) {
		return !this.isIron && (this.faction !== piece.faction);
	}

	/**
	 * Gets the tile relative to the current piece's position  
	 * Positive y-values are considered "forwards" from each player's point of view
	 */
	getRelTile(relPos: Pos): Tile | undefined {
		return this.board.get(Pos.add(this.pos, Pos.rotate90cw(relPos, this.forwards)));
	}
}

/**
 * Method decorator. Adds a move generator to the target method, roughly translated from betza notation
 * @example
 * ```
 * // Adds diagonal forwards (1,1) capture-only moves
 * ＠atom({x: 1, y: 1, directions: [Directions.Forward], modifiers: [Modifiers.Capture]})
 * generateMoves(): Move[] {
 * 	// do some calculations...
 * 	return moves; // Cool, non-simple moves here
 * }
 * ```
 * @see {@link https://www.gnu.org/software/xboard/Betza.html}
 * @see {@link https://en.wikipedia.org/wiki/Betza%27s_funny_notation#Betza_2.0}
 */
// TODO: allow multiple moves to be chained together ("a" argument in extended betza notation)
function atom<This extends Piece>(atom: Atom<This>) {
	return function decorator<Args extends [Move[]], Return extends Move[][]>(target: (this: This, ...args: Args) => Return, context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>) {
		return function wrapper(this: This, ...args: Args) {
			const [x, y] = [Math.max(atom.x, atom.y), Math.min(atom.x, atom.y)];
			const range = atom.range ?? 1;
			const modifiers = atom.modifiers ?? [];

			const directionIndices = [
				(y !== 0 ? [0, 1, 4, 5] : [0]), (y !== 0 ? [2, 3, 6, 7] : [2]), (y !== 0 ? [0, 3, 4, 7] : [3]), (y !== 0 ? [1, 2, 5, 6] : [1]),
				[0, 1, 4, 5], [2, 3, 6, 7], [0, 3, 4, 7], [1, 2, 5, 6],
				[0], (x === y ? [1] : [5]), (x === y ? [0] : [4]), [1],
				[3], (x === y ? [3] : [7]), [2], (x === y ? [2] : [6]),
				[0, 1, 2, 3], [4, 5, 6, 7], [0, 2, 5, 7], [1, 3, 4, 6],
				[0, 5], [1, 4], [3, 6], [2, 7],
				[0, 7], [2, 5], [3, 4], [1, 6]
			];
			const indices = [...new Set((atom.directions ?? [Directions.Forward, Directions.Left, Directions.Back, Directions.Right]).flatMap(direction => directionIndices[direction]))];
			const directions = [new Pos(-y, x), new Pos(x, y), new Pos(y, -x), new Pos(-x, -y), ...(y !== 0 && x !== y ? [new Pos(-x, y), new Pos(y, x), new Pos(x, -y), new Pos(-y, -x)] : [])].filter((pos, i) => indices.includes(i));
			const enabledModifiers = new Set<Modifiers>(modifiers);

			const newMoves: Move[][] = [];
			for (let i = 1; i < (range !== 0 ? range + 1 : this.board.width * this.board.height); i++) {
				if (!directions.length) break;
				const explore = directions.map(pos => Pos.scale(pos, i));
				for (let j = explore.length - 1; j >= 0; j--) {
					const tile = this.getRelTile(explore[j]);
					if (!tile) continue;

					// TODO: check if this piece is royal, and stop exploration if tile is under attack
					const move = new Move({piece: this, fromPos: this.pos, toPos: tile.pos});
					const piece = tile.piece;
					
					if (enabledModifiers.has(Modifiers.NoLeap) && !AStar(this.board, this.getRelTile(Pos.scale(directions[j], i-1))?.pos!, tile.pos, modifiers)) continue;

					if (piece) {
						directions.splice(j, 1);
						if (enabledModifiers.has(Modifiers.NonCapture) || !piece.isCapturableBy(this)) continue;
						move.captureAtPos = tile.pos;
					} else if (enabledModifiers.has(Modifiers.Capture)) {
						continue;
					}

					newMoves.push([move]);
				}
			}
			const oldMoves = target.call(this, ...args);
			return atom.callback ? atom.callback(this, newMoves, oldMoves, [...oldMoves, ...newMoves]) : [...oldMoves, ...newMoves];
		}
	}
}

/**
 * Performs an A* search between two positions, restricted to the bounded rectangle enclosed by the two positions.  
 * 
 * @returns Whether a valid path was found
 */
function AStar(board: Board, fromPos: Pos, toPos: Pos, modifiers: Modifiers[]) {
	const queue = [fromPos];
	const graph = new Map<Pos, {cost: number, estimate: number}>();
	graph.set(fromPos, {cost: 0, estimate: Math.max(Math.abs(fromPos.x - toPos.x), Math.abs(fromPos.y - toPos.y))});

	while (queue.length) {
		const pos = queue.sort((pos1, pos2) => graph.get(pos1)!.estimate - graph.get(pos2)!.estimate).shift()!;
		if (Pos.equals(pos, toPos)) return true;

		for (let x = -1; x <= 1; x++) {
			for (let y = -1; y <= 1; y++) {
				// BUG: compare against parent.pos and toPos.pos, otherwise this can snake around obstacles
				if ((x === 0 && y === 0) || (x < Math.min(fromPos.x, toPos.x) || x > Math.max(fromPos.x, toPos.x) || y < Math.min(fromPos.y, toPos.y) || y > Math.max(fromPos.y, toPos.y))) continue;
				const neighbor = new Pos(pos.x + x, pos.y + y);
				const tile = board.get(neighbor);
				if (!tile || (tile.piece && !Pos.equals(neighbor, toPos))) continue;
				const newCost = graph.get(pos)!.cost + 1;
				if (newCost >= (graph.get(neighbor)?.cost ?? Infinity)) continue;
				graph.set(neighbor, {cost: newCost, estimate: newCost + Math.max(Math.abs(neighbor.x - toPos.x), Math.abs(neighbor.y - toPos.y))});
				if (!queue.some(pos => Pos.equals(pos, neighbor))) queue.unshift(neighbor); // Unshift, so that it acts like a depth-first search for equal-cost paths
			}
		}
	}

	return false;
}

/**
 * A singular action taken in the game.  
 * Multiple can be made in one half-turn.
 */
class Move {
	piece?: Piece;
	pieceNamespace?: string;
	fromPos?: Pos;
	toPos?: Pos;
	removeAtPos?: Pos;
	captureAtPos?: Pos;
	spawnAtPos?: Pos;
	spawnProps?: PieceConstructorOptions;
	dropAtPos?: Pos;
	canContinue: boolean;

	constructor(options: MoveDescriptor) {
		this.piece = options.piece;
		this.pieceNamespace = options.pieceNamespace;
		this.fromPos = options.fromPos;
		this.toPos = options.toPos;
		this.removeAtPos = options.removeAtPos;
		this.captureAtPos = options.captureAtPos;
		this.spawnAtPos = options.spawnAtPos;
		this.spawnProps = options.spawnProps;
		this.dropAtPos = options.dropAtPos;
		this.canContinue = options.canContinue || false;
	}

	serialize() {
		let ycin = "";
		if (this.piece || this.pieceNamespace) ycin += `${this.pieceNamespace || this.piece?.namespace || ""} `;
		if (this.fromPos && this.toPos) ycin += `-${this.fromPos.toHex()}${this.toPos.toHex()}`;
		if (this.removeAtPos) ycin += `.${this.removeAtPos.toHex()}`;
		if (this.captureAtPos) ycin += `x${this.captureAtPos.toHex()}`;
		if (this.spawnAtPos) ycin += `+${this.spawnAtPos.toHex()}${JSON.stringify(this.spawnProps || this.piece?.package()) || ""}`;
		if (this.dropAtPos) ycin += `*${this.dropAtPos.toHex()}`;
		// if (i !== this.stateStack.length - 1) ycin += j === moves.length - 1 ? "\n\n" : "\n";
		return ycin;
	}

	package(): ClientMove {
		return {
			pieceNamespace: this.pieceNamespace || this.piece?.namespace,
			fromPos: this.fromPos,
			toPos: this.toPos,
			removeAtPos: this.removeAtPos,
			captureAtPos: this.captureAtPos,
			spawnAtPos: this.spawnAtPos,
			dropAtPos: this.dropAtPos,
			canContinue: this.canContinue,
			serialized: this.serialize()
		};
	}
}

/**
 * Fantasy Chess Engine FTW
 */
class YggdrasilEngine {

	private static pluginEntryPoints = new Map<string, ((engine: YggdrasilEngine) => void)>();

	static Events = Events;

	pieceRegistry = new Map<string, typeof Piece>();
	namespaceRegistry = new Map<typeof Piece, string>();

	stateStack: {board: Board, moves: Move[], isWhiteTurn: boolean, prevStateHash: string, eventBus: Map<Events, ((...Args: any[]) => void)[]>}[] = [];
	isLoaded = false;

	plugins: string[] = [];

	static Plugin<This extends (engine: YggdrasilEngine) => void>(pluginId: string, target: This) {
		YggdrasilEngine.pluginEntryPoints.set(pluginId, target);
	}

	get state() {
		return this.stateStack[this.stateStack.length-1];
	}

	get eventBus() {
		return this.state.eventBus;
	}

	get board() {
		return this.state.board;
	}

	get isWhiteTurn() {
		return this.state.isWhiteTurn;
	}

	get pieces() {
		// TODO: add pieces from players' hands
		return this.board.flat().filter(tile => tile.piece !== undefined).map(tile => tile.piece!);
	}

	constructor() {
		this.stateStack.push({board: new Board(), isWhiteTurn: true, moves: [], prevStateHash: "", eventBus: new Map()});
	}

	async load(config: GameSettings) {
		if (this.isLoaded) throw new Error("This instance of YggdrasilEngine has already been loaded");

		const loadQueue: Promise<NodeModule>[] = [];
		config.plugins.forEach(plugin => {
			loadQueue.push(import(`./plugins/${plugin}.ts`));
		});
		await Promise.all(loadQueue);

		YggdrasilEngine.pluginEntryPoints.forEach((loadFunc, pluginId) => {
			if (config.plugins.includes(pluginId)) loadFunc(this);
		});

		for (let y = 0; y < config.board.length; y++) {
			this.board[y] = [];
			config.board[y].split("").forEach((char, x) => {
				const value = config.key[char];
				let piece: Piece | undefined = undefined;
				if (value) {
					const pieceClass = this.pieceRegistry.get(value.piece.id);
					if (!pieceClass) throw new Error(`No such piece exists: "${value.piece.id}"`);
					piece = new pieceClass(this, {board: this.board, pos: new Pos(x, y), ...value.piece});
				}
				const tile = new Tile({pos: new Pos(x, y), piece: piece, ...value?.tile});
				this.board[y][x] = tile;
			});
		}

		this.plugins = config.plugins;
		this.isLoaded = true;
		this.emitEvent(Events.loadEnd);
	}

	registerPiece<pieceClass extends typeof Piece>(pluginId: string, registryName: string, target: pieceClass) {
		this.pieceRegistry.set(`${pluginId}:${registryName}`, target);
		this.namespaceRegistry.set(target, `${pluginId}:${registryName}`);
	}

	getNamespace(piece?: Piece) {
		return this.namespaceRegistry.get(piece?.constructor as new (options: PieceConstructorOptions) => Piece);
	}

	subscribeEvent(eventName: Events.loadEnd, target: () => void): void
	subscribeEvent(eventName: Events.HalfTurnEnd, target: (halfTurn: Move[]) => void): void
	subscribeEvent<Args>(eventName: Events, target: (...args: Args[]) => void) {
		if (!this.eventBus.has(eventName)) this.eventBus.set(eventName, []);
		this.eventBus.get(eventName)!.push(target);
	}

	emitEvent(event: Events.loadEnd): void
	emitEvent(event: Events.HalfTurnEnd, halfTurnMoves: Move[]): void
	emitEvent<Args>(event: Events, ...args: Args[]) {
		this.eventBus.get(event)?.forEach(listener => listener(...args));
	}

	/**
	 * Makes the move and pushes to the state stack  
	 * Throws an error if an illegal move is made
	 */
	makeMove(moves: Move[]) {
		if (!this.isLegal(moves)) throw new Error("Move would result in an illegal board state");
		this.forceMove(moves);
		// TODO: check end of game (stalemates, checkmates)
		// TODO: check halfTurn limit (number of moves made without pawn movement or capturing)
		// TODO: check three-fold repetition
	}

	/**
	 * Checks if the provided moves would result in an illegal board state
	 */
	isLegal(moves: Move[]) {
		if (!moves.length) return true;
		let halfTurn: Move[] = [];
		let halfTurns = 0;
		for (let i = 0; i < moves.length; i++) {
			const move = moves[i];
			halfTurn.push(move);
			// TODO: check moving other player's pieces
			if (move.canContinue && i < moves.length - 1) continue;
			this.forceMove(halfTurn);
			// TODO: check putting own king in check
			// TODO: check not taking king out of check
			halfTurn = [];
			halfTurns++;
		}
		for (let i = 0; i < halfTurns; i++) this.undoHalfTurn();
		return true;
	}

	/**
	 * Makes move without checking legality and pushes to the state stack
	 */
	forceMove(moves: Move[]) {
		if (moves.length === 0) return;
		this.stateStack.push({board: new Board(), isWhiteTurn: !this.isWhiteTurn, moves: [...this.state.moves], prevStateHash: this.hashState(), eventBus: new Map()});
		this.state.board = this.stateStack[this.stateStack.length-2].board.clone(); // Clone the board after pushing to the stack, so that event handlers are registered properly.

		let halfTurn: Move[] = [];
		for (let i = 0; i < moves.length; i++) {
			const move = moves[i];
			halfTurn.push(move);

			let piece = this.board.get(move.fromPos || new Pos())?.piece;
			if (!piece && move.pieceNamespace) {
				const testPiece = this.board.get(move.fromPos || new Pos())?.piece;
				if (move.pieceNamespace === testPiece?.namespace) piece = testPiece;
			}
			move.piece = piece;

			if (move.removeAtPos) {
				const tile = this.board.get(move.removeAtPos);
				if (tile) tile.piece = undefined;
			}
			if (piece && move.captureAtPos) {
				const tile = this.board.get(move.captureAtPos);
				if (tile?.piece) {
					const capturedPiece = tile.piece;
					tile.piece = undefined;
					// TODO: add capturedPiece to opponent's hand
				}
			}
			if (!piece && move.pieceNamespace && move.spawnAtPos) {
				const pieceClass = this.pieceRegistry.get(move.pieceNamespace);
				const tile = this.board.get(move.spawnAtPos);
				if (pieceClass && tile) {
					piece = new pieceClass(this, {board: this.board, pos: move.spawnAtPos, ...(move.spawnProps || {})});
					tile.piece = piece;
				}
			}
			if (!piece && move.pieceNamespace && move.dropAtPos) {
				piece = new Piece(this); // TODO: splice piece from player hands
				const tile = this.board.get(move.dropAtPos);
				if (piece && tile) tile.piece = piece;
			}
			if (piece && move.fromPos && move.toPos) {
				const fromTile = this.board.get(move.fromPos);
				const toTile = this.board.get(move.toPos);
				if (fromTile && toTile) {
					fromTile.piece = undefined;
					toTile.piece = piece;
					piece.pos = move.toPos;
					piece.hasMoved = true;
				}
			}

			if (move.canContinue && i < moves.length - 1) continue;
			this.state.moves.push(...halfTurn);
			if (!move.canContinue) this.emitEvent(Events.HalfTurnEnd, halfTurn);
			halfTurn = [];
		}
	}

	/**
	 * Pops the state stack
	 */
	undoMove() {
		this.stateStack.pop();
	}

	/**
	 * Pops the state stack until it reaches the end of the last half-turn
	 */
	undoHalfTurn() {
		let undidMove = false;
		while (this.state.moves[this.state.moves.length - 1]?.canContinue || !undidMove) {
			this.undoMove();
			undidMove = true;
		}
	}

	deserializeYCIN(ycin: string) {
		const moves: Move[] = [];
		if (!ycin) return moves;
		const halfTurns = ycin.split("\r\n\r\n");

		const namespaceRegex = /^([^ ]+) /;
		const fromToPosRegex = /-([0-9A-F]{16})/i;
		const removeAtPosRegex = /\.([0-9A-F]{8})/i;
		const captureAtPosRegex = /x([0-9A-F]{8})/i;
		const spawnRegex = /\+([0-9A-F]{8})(\{.*\})?/i;
		const dropAtPosRegex = /\*([0-9A-F]{8})/i;

		for (let i = 0; i < halfTurns.length; i++) {
			const halfTurnMoves = halfTurns[i].split("\r\n");
			for (let j = 0; j < halfTurnMoves.length; j++) {
				const singleMove = halfTurnMoves[j];
				
				const pieceNamespace = namespaceRegex.exec(singleMove)?.[1];
				if (pieceNamespace && !this.pieceRegistry.has(pieceNamespace)) console.warn(`Warning: No such piece exists: ${pieceNamespace}`);

				const fromToPos = fromToPosRegex.exec(singleMove)?.[1];
				const fromPos = new Pos(fromToPos?.slice(0, 8));
				const toPos = new Pos(fromToPos?.slice(8));

				const removeAtPos = new Pos(removeAtPosRegex.exec(singleMove)?.[1]);
				const captureAtPos = new Pos(captureAtPosRegex.exec(singleMove)?.[1]);

				const spawn = spawnRegex.exec(singleMove);
				const spawnAtPos = new Pos(spawn?.[1]);
				const spawnProps = spawn?.[2];

				const dropAtPos = new Pos(dropAtPosRegex.exec(singleMove)?.[1]);

				const move = new Move({pieceNamespace: pieceNamespace, canContinue: j < halfTurnMoves.length - 1});
				if (removeAtPos.isValid()) move.removeAtPos = removeAtPos;
				if (fromPos.isValid() && toPos.isValid() && pieceNamespace) {
					move.fromPos = fromPos;
					move.toPos = toPos;
				}
				if (pieceNamespace && captureAtPos.isValid()) move.captureAtPos = captureAtPos;
				if (pieceNamespace && spawnAtPos.isValid()) {
					try {
						if (spawnProps) move.spawnProps = JSON.parse(spawnProps) || {};
						move.spawnAtPos = spawnAtPos;
					} catch (err) {
						console.warn(`Warning: Invalid JSON syntax: ${spawnProps}\n`, err);
					}
				}
				if (pieceNamespace && dropAtPos.isValid()) move.dropAtPos = dropAtPos;

				moves.push(move);
			}
		}

		return moves;
	}

	/**
	 * Package the game to be sent over the network
	 */
	package(): GameState {
		return {
			board: this.board.package(),
			moves: this.state.moves.map(move => move.package()),
			plugins: this.plugins
		}
	}

	private hashState() {
		return Hash(this, {excludeKeys: key => key !== "stateStack", unorderedArrays: true, unorderedObjects: true, unorderedSets: true});
	}
}

const ALL_PLUGINS: readonly string[] = await readdir(fileURLToPath(new URL("./plugins", import.meta.url))).then(fileNames => fileNames.map(name => name.slice(0, -3)));

export {
	Pos, Tile, Piece, Board, atom, Move,
	YggdrasilEngine, ALL_PLUGINS
}