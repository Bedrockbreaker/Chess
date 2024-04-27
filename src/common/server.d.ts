import type { WebSocket } from "ws";

import type { Status, TimeControls } from "./common.d.ts";
import type { Cardinals, Directions, Modifiers, Pos } from "./util.ts"
import type { Piece, Board, YggdrasilEngine } from "../engine/yggdrasil.ts";

/* KAMO: allow unique time controls per-player */
export interface RoomSettings {
	roomName: string,
	players: Player[],
	numPlayers: number,
	status: Status,
	allowSpectators: boolean,
	password: string
	timeControls: TimeControls;
}

export interface GameSettings {
	board: string[],
	key: {
		[key: string]: {
			piece: ({id: string, faction: number, forwards: Cardinals } & PieceConstructorOptions),
			tile: TileConstructorOptions
		} | undefined
	},
	endConditions: {
		extinctionRoyalty: boolean,
		maxRoyaltyInCheck: number,
		rexMultiplex: boolean,
		softmaxBoringTurns: number,
		hardmaxBoringTurns: number,
		softmaxTurnRepetition: number,
		hardmaxTurnRepetition: number,
		turnRepetitionIsLoss: boolean
	},
	plugins: string[]
}

export interface User {
	id: string,
	ws?: WebSocket,
	username: string,
	game?: YggdrasilEngine
}

export interface Player {
	user: User,
	faction: number
}

export interface TileConstructorOptions {
	[key: string]: unknown,
	pos?: Pos,
	piece?: Piece
}

export interface PieceConstructorOptions {
	board?: Board,
	pos?: Pos,
	name?: string,
	faction?: number,
	forwards?: Cardinals,
	isRoyal?: boolean,
	isIron?: boolean,
	hasMoved?: boolean
}

export type Piecelike = {piece: Piece} | {pieceNamespace: string}

export type MoveDescriptor = {
	piece?: Piece,
	pieceNamespace?: string,
	removeAtPos?: Pos,
	canContinue?: boolean
}	& ({fromPos?: never, toPos?: never} | ({fromPos: Pos, toPos: Pos} & Piecelike))
	& ({spawnAtPos?: never, spawnProps?: never} | ({spawnAtPos: Pos, spawnProps: PieceConstructorOptions} & Piecelike))
	& ({captureAtPos?: never} | ({captureAtPos: Pos} & Piecelike))
	& ({dropAtPos?: never} | ({dropAtPos: Pos} & Piecelike));

export interface Atom<This extends Piece> {
	x: number,
	y: number,
	range?: number,
	directions?: Directions[],
	modifiers?: Modifiers[],
	callback?: (piece: This, newMoves: Move[][], oldMoves: Move[][], allMoves: Move[][]) => Move[][]
}

export interface wsServerMessage {
	type: "username",
	data: {method: "GET"} | {method: "PATCH", username: string}
}