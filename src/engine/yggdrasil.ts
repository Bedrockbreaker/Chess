import Hash from "object-hash";

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

	isValid() {
		return !Number.isNaN(this.x) && !Number.isNaN(this.y);
	}

	toHex() {
		return this.y.toString(16).padStart(4, "0") + this.x.toString(16).padStart(4, "0");
	}
}

interface TileConstructorOptions {
	[key: string]: unknown,
	pos?: Pos,
	piece?: Piece
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

	get width() {
		return this[0].length;
	}

	get height() {
		return this.length;
	}
}

interface PieceConstructorOptions {
	board?: Board,
	pos?: Pos,
	name?: string,
	isWhite?: boolean,
	isRoyal?: boolean,
	isIron?: boolean,
	hasMoved?: boolean
}

/**
 * A generic piece to extend from
 */
class Piece {
	engine: YggdrasilEngine;
	board: Board;
	pos: Pos;

	name: string;
	isWhite: boolean;
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

	constructor(engine: YggdrasilEngine, options?: PieceConstructorOptions) {
		this.engine = engine;
		this.isWhite = options?.isWhite ?? true;
		this.board = options?.board || new Board();
		this.pos = options?.pos || new Pos(NaN, NaN);
		this.name = options?.name || "Generic Piece";
		this.isRoyal = options?.isRoyal || false;
		this.isIron = options?.isIron || false;
		this.hasMoved = options?.hasMoved || false;
	}

	clone(board?: Board) {
		return new (this.constructor as typeof Piece)(this.engine, {board: board, pos: this.pos, name: this.name, isWhite: this.isWhite, isRoyal: this.isRoyal, isIron: this.isIron, hasMoved: this.hasMoved});
	}

	/**
	 * Return a JSON-compatible representation of this piece for serialization
	 */
	JSONify(): PieceConstructorOptions {
		return {isWhite: this.isWhite, name: this.name, isRoyal: this.isRoyal, isIron: this.isIron, hasMoved: this.hasMoved};
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
		return !this.isIron && (this.isWhite !== piece.isWhite);
	}

	/**
	 * Gets the tile relative to the current piece's position  
	 * Positive y-values are considered "forwards" from each player's point of view
	 */
	getRelTile(relPos: Pos): Tile | undefined {
		return this.board.get(Pos.add(this.pos, Pos.scale(relPos, this.isWhite ? 1 : -1, this.isWhite ? -1 : 1)));
	}
}

/**
 * 
 * `.. .N .. .N ..`	Outer ring applies to 8-fold moves (i.e. N)  
 * `.N .F .W .F .N`	Inner ring applies to 4-fold moves (i.e. F and W)  
 * `.. .W ** .W ..` All periods are for text alignment purposes only  
 * `.N .F .W .F .N` The "!" means the reverse of the previous characters are equal  
 * `.. .N .. .N ..`
 * 
 * **Vertical Plane** -- **Horizontal Plane** -- **Indices**  
 * `.. .f .. .f ..`			`.. .l .. .r ..`		`.. .0 .. .5 ..`  
 * `.f .f .f .f .f`			`.l .l .. .r .r`		`.4 .0 .0 .1 .1`  
 * `.. .. ** .. ..`			`.. .l ** .r ..`		`.. .3 ** .1 ..`  
 * `.b .b .b .b .b`			`.l .l .. .r .r`		`.3 .3 .2 .2 .6`  
 * `.. .b .. .b ..`			`.. .l .. .r ..`		`.. .7 .. .2 ..`  
 * 
 * **Vertical Halves** -- **Horizontal Halves** -- **Single Directions** -- **Chiral**  
 * `.. fh .. fh ..`			`.. lh .. rh ..`		`.. lf .. rf ..`		`.. hl .. hr ..`  
 * `fh fh .. fh fh`			`lh lh .. rh rh`		`fl lf!.. rf!fr`		`hr .. .. .. hl`  
 * `.. .. ** .. ..`			`.. .. ** .. ..`		`.. .. ** .. ..`		`.. .. ** .. ..`  
 * `bh bh .. bh bh`			`lh lh .. rh rh`		`bl lb!.. rb!br`		`hl .. .. .. hr`  
 * `.. bh .. bh ..`			`.. lh .. rh ..`		`.. lb .. rb ..`		`.. hr .. hl ..`  
 * 
 * **Vertical Pairs** -- **Horizontal Pairs** -- **Quartets**  
 * `.. ff .. ff ..`			`.. lv .. rv ..`		`.. .V .. .V ..`  
 * `fs .. .. .. fs`			`ll .. .. .. rr`		`.S .. .V .. .S`  
 * `.. .. ** .. ..`			`.. .. ** .. ..`		`.. .S ** .S ..`  
 * `bs .. .. .. bs`			`ll .. .. .. rr`		`.S .. .V .. .S`  
 * `.. bb .. bb ..`			`.. lv .. rv ..`		`.. .V .. .V ..`  
 */
enum Directions {
	Forward, Back, Left, Right,
	ForwardHalf, BackHalf, LeftHalf, RightHalf,
	LeftFront, RightFront, FrontLeft, FrontRight,
	BackLeft, LeftBack, RightBack, BackRight,
	ChiralLeft, ChiralRight, Vertical, Sideways,
	FrontFront, FrontSide, BackSide, BackBack,
	LeftVertical, RightVertical, LeftLeft, RightRight
}

/**
 * Method decorator. Returns a basic moveset corresponding to Betza notation.
 * 
 * @param modality - `true` = Capture Only, `false` = Non-capturing, `undefined` = Either.
 * 
 * @see {@link https://www.gnu.org/software/xboard/Betza.html}
 * @see {@link https://en.wikipedia.org/wiki/Betza%27s_funny_notation#Betza_2.0}
 * 
 * @example
 * ```
 * ＠atom(1, 1, 0, [Direction.Forward], true) // Adds forwards (1,1) capture-only moves
 * generateMoves(): Move[] {
       // do stuff...
       return moves; // Cool, non-simple moves here
 * }
 * ```
 */
function atom<This extends Piece>(x: number, y: number = 0, range: number = 1, directions: Directions[] = [Directions.Forward, Directions.Left, Directions.Back, Directions.Right], modality?: boolean, callback?: (piece: This, newMoves: Move[][], oldMoves: Move[][], allMoves: Move[][]) => Move[][]) {
	return function decorator<Args extends [Move[]], Return extends Move[][]>(target: (this: This, ...args: Args) => Return, context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>) {
		return function wrapper(this: This, ...args: Args) {
			[x, y] = [Math.max(x, y), Math.min(x, y)];
			// Each item corresponds to its respective index in Direction
			const allMods = [
				(y !== 0 ? [0, 1, 4, 5] : [0]), (y !== 0 ? [2, 3, 6, 7] : [2]), (y !== 0 ? [0, 3, 4, 7] : [3]), (y !== 0 ? [1, 2, 5, 6] : [1]),
				[0, 1, 4, 5], [2, 3, 6, 7], [0, 3, 4, 7], [1, 2, 5, 6],
				[0], (x === y ? [1] : [5]), (x === y ? [0] : [4]), [1],
				[3], (x === y ? [3] : [7]), [2], (x === y ? [2] : [6]),
				[0, 1, 2, 3], [4, 5, 6, 7], [0, 2, 5, 7], [1, 3, 4, 6],
				[0, 5], [1, 4], [3, 6], [2, 7],
				[0, 7], [2, 5], [3, 4], [1, 6]
			];
			const indices = [...new Set(directions.flatMap(dir => allMods[dir]))];
			const dir = [new Pos(-y, x), new Pos(x, y), new Pos(y, -x), new Pos(-x, -y), ...(y !== 0 && x !== y ? [new Pos(-x, y), new Pos(y, x), new Pos(x, -y), new Pos(-y, -x)] : [])].filter((pos, i) => indices.includes(i));

			const newMoves: Move[][] = [];
			for (let i = 1; i < (range !== 0 ? range + 1 : this.board.width * this.board.height); i++) {
				if (!dir.length) break;
				const explore = dir.map(pos => Pos.scale(pos, i));
				for (let j = explore.length - 1; j >= 0; j--) {
					const tile = this.getRelTile(explore[j]);
					if (!tile) continue;
					// TODO: check if this piece is royal, and stop exploration if tile is under attack
					const move = new Move({piece: this, fromPos: this.pos, toPos: tile.pos});
					if (tile.piece) {
						dir.splice(j, 1);
						// If non-capturing move, or can't capture piece at tile, continue
						if (modality === false || !tile.piece.isCapturableBy(this)) continue;
						move.captureAtPos = tile.pos;
					} else if (modality === true) {
						continue;
					}
					newMoves.push([move]);
				}
			}
			const oldMoves = target.call(this, ...args);
			return callback ? callback(this, newMoves, oldMoves, [...oldMoves, ...newMoves]) : [...oldMoves, ...newMoves];
		}
	}
}

type Piecelike = {piece: Piece} | {pieceNamespace: string}

type MoveDescriptor = {
	piece?: Piece,
	pieceNamespace?: string,
	removeAtPos?: Pos,
	canContinue?: boolean
}	& ({fromPos?: never, toPos?: never} | ({fromPos: Pos, toPos: Pos} & Piecelike))
	& ({spawnAtPos?: never, spawnProps?: never} | ({spawnAtPos: Pos, spawnProps: PieceConstructorOptions} & Piecelike))
	& ({captureAtPos?: never} | ({captureAtPos: Pos} & Piecelike))
	& ({dropAtPos?: never} | ({dropAtPos: Pos} & Piecelike));

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

	serialize(engine: YggdrasilEngine) {
		let ycin = "";
		if (this.piece || this.pieceNamespace) ycin += `${this.pieceNamespace || engine.getNamespace(this.piece)} `;
		if (this.fromPos && this.toPos) ycin += `-${this.fromPos.toHex()}${this.toPos.toHex()}`;
		if (this.removeAtPos) ycin += `.${this.removeAtPos.toHex()}`;
		if (this.captureAtPos) ycin += `x${this.captureAtPos.toHex()}`;
		if (this.spawnAtPos) ycin += `+${this.spawnAtPos.toHex()}${JSON.stringify(this.spawnProps || this.piece?.JSONify()) || ""}`;
		if (this.dropAtPos) ycin += `*${this.dropAtPos.toHex()}`;
		// if (i !== this.stateStack.length - 1) ycin += j === moves.length - 1 ? "\n\n" : "\n";
		return ycin;
	}
}

interface GameOptions {
	board: string[],
	key: {
		[key: string]: {
			piece: {id: string} & PieceConstructorOptions,
			tile: TileConstructorOptions
		}
	}
	maxHalfTurns: number,
	plugins: string[]
}

enum Events {
	loadEnd,
	HalfTurnStart, HalfTurnEnd
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
		return this.board.flat().map(tile => tile.piece).filter(piece => piece);
	}

	constructor() {
		this.stateStack.push({board: new Board(), isWhiteTurn: true, moves: [], prevStateHash: "", eventBus: new Map()});
	}

	async load(config: GameOptions) {
		if (this.isLoaded) throw new Error("This instance of YggdrasilEngine has already been loaded");

		const loadQueue: Promise<NodeModule>[] = [];
		config.plugins.forEach(plugin => {
			loadQueue.push(import(`./plugins/${plugin}.ts`));
		});
		await Promise.all(loadQueue);

		YggdrasilEngine.pluginEntryPoints.forEach((loadFunc, pluginId) => {
			if (config.plugins.includes(pluginId)) loadFunc(this);
		});

		const keys = Object.keys(config.key);
		for (let y = 0; y < config.board.length; y++) {
			this.board[y] = [];
			config.board[y].split("").forEach((key, x) => {
				const bothKeysDefined = keys.includes(key.toLowerCase()) && keys.includes(key.toUpperCase());
				const data = config.key[bothKeysDefined ? key : keys.find(key2 => key2.toLowerCase() === key.toLowerCase()) || ""];
				let piece: Piece | undefined = undefined;
				if (data.piece.id) {
					const pieceClass = this.pieceRegistry.get(data.piece.id);
					if (!pieceClass) throw new Error(`No such piece exists: "${data.piece.id}"`);
					piece = new pieceClass(this, {board: this.board, isWhite: bothKeysDefined ? undefined : key === key.toLowerCase(), pos: new Pos(x, y), ...data.piece});
				}
				const tile = new Tile({pos: new Pos(x, y), piece: piece, ...data.tile});
				this.board[y][x] = tile;
			});
		}

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
				if (testPiece && move.pieceNamespace === this.getNamespace(testPiece)) piece = testPiece;
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

	private hashState() {
		return Hash(this, {excludeKeys: key => key !== "stateStack", unorderedArrays: true, unorderedObjects: true, unorderedSets: true});
	}
}

export {
	Pos, Tile, Board,
	Piece, type PieceConstructorOptions,
	Directions, atom, Move, type MoveDescriptor,
	YggdrasilEngine, type GameOptions,
}