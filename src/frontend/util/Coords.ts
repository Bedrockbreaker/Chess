import type { Pos } from "./types";

function getHexPos(pos: Pos) {
	return `${pos.y.toString(16).padStart(4, "0")}${pos.x.toString(16).padStart(4, "0")}`;
}

function getPosFromHex(hex: string): Pos {
	return {x: parseInt(hex.slice(4), 16), y: parseInt(hex.slice(0, 4), 16)};
}

function isEqual(pos1?: Pos, pos2?: Pos) {
	return pos1?.x === pos2?.x && pos1?.y === pos2?.y;
}

export { getHexPos, getPosFromHex, isEqual }