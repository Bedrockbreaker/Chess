import type { TimeControls } from "./common.d.ts";
import { Cardinals, Status } from "./util.ts";

export interface Pos {
	x: number,
	y: number
}

export type Tile = {
	pos: Pos,
	piece?: never,
	pieceNamespace?: never
} | {
	pos: Pos,
	piece: Piece,
	pieceNamespace: string
}

export interface Piece {
	pos: Pos,
	name: string,
	faction: number,
	forwards: Cardinals,
	[key: string]: unknown
}

export type Board = Tile[][]

export interface Move {
	pieceNamespace?: string,
	fromPos?: Pos,
	toPos?: Pos,
	removeAtPos?: Pos,
	captureAtPos?: Pos,
	spawnAtPos?: Pos,
	dropAtPos?: Pos,
	canContinue: boolean,
	serialized: string
}

export interface TileOverlays {
	movement?: boolean,
	removal?: boolean,
	capture?: boolean,
	spawn?: boolean,
	drop?: boolean
}

export interface GameState {
	board: Board,
	moves: Move[],
	plugins: string[]
}

export interface Player {
	id: string,
	username: string,
	faction: number
}

export interface Room {
	id: string,
	roomName: string,
	players: Player[],
	numPlayers: number,
	status: Status,
	allowSpectators: boolean,
	password: boolean,
	timeControls: TimeControls,
	game: GameState
}

export type wsClientMessage = {
	type: "error",
	data: unknown
} | {
	type: "user",
	data: {auth: string, username: string}
} | {
	type: "username",
	data: string
}