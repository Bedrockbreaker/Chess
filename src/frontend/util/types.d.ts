declare type Pos = {
	x: number,
	y: number
}

declare type Tile = {
	pos: Pos
} & ({ piece?: never, pieceNamespace?: never} | {piece: Piece, pieceNamespace: string})

declare type Piece = {
	board: Tile[][],
	pos: Pos,
	name: string,
	isWhite: boolean,
	[key: string]: string
}

declare type Move = {
	piece?: Piece,
	pieceNamespace?: string,
	fromPos?: Pos,
	toPos?: Pos,
	removeAtPos: Pos,
	captureAtPos?: Pos,
	spawnAtPos?: Pos,
	dropAtPos?: Pos,
	canContinue: boolean,
	serialized: string
}

declare type GameState = {
	board: Tile[][],
	moves: Move[]
}

export { Pos, Tile, Piece, Move, GameState }