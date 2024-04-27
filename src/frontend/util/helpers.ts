import { lerp } from "../../common/util";
import type { Pos } from "../../common/client";

export function formatTime(seconds: number) {
	const time = new Date(seconds*1000);
	const hours = time.getUTCHours();
	const minutes = time.getUTCMinutes();
	const secs = time.getUTCSeconds();
	return `${hours > 0 ? `${hours}:` : ""}${minutes > 0 || hours > 0 ? `${hours > 0 ? minutes.toString().padStart(2, "0") : minutes}:` : ""}${minutes + hours === 0 ? ":" : ""}${secs.toString().padStart(2, "0")}`;
}

const timeParser = /(?:(?<hours>\d+):)?(?<minutes>\d{1,2})?:(?<seconds>\d{2})$/;
export function getSeconds(input: string) {
	if (!isNaN(Number(input))) return Number(input);
	const match = input.match(timeParser);
	if (!match) return 0;
	const hours = Number(match.groups?.hours) || 0;
	const minutes = Number(match.groups?.minutes) || 0;
	const seconds = Number(match.groups?.seconds) || 0;
	return hours * 3600 + minutes * 60 + seconds;
}

const wordParser = /(^|\s)\S/g;
export function titleCase(text: string) {
	return text.replaceAll(wordParser, char => char.toUpperCase());
}

export class Gradient {

	colors: [number, number, number][];

	/**
	 * @param colors The colors in HSL (360, %, %) format
	 */
	constructor(...colors: [number, number, number][]) {
		this.colors = colors;
	}

	/**
	 * @param t A value in [0,1] corresponding to a point along the gradient
	 */
	getCSSColor(t: number) {
		if (!this.colors.length) return "hsl(0, 0%, 0%)";
		const n = Math.floor(t * (this.colors.length-1));
		const k = Math.min(n+1, this.colors.length-1);
		t = t * (this.colors.length - 1) - n;
		return `hsl(${lerp(this.colors[n][0], this.colors[k][0], t)}, ${lerp(this.colors[n][1], this.colors[k][1], t)}%, ${lerp(this.colors[n][2], this.colors[k][2], t)}%)`;
	}
}

export function isPosEqual(pos1?: Pos, pos2?: Pos) {
	return pos1 && pos2 && pos1.x === pos2.x && pos1.y === pos2.y;
}

export function getHex(pos: Pos) {
	return pos.y.toString(16).padStart(4, "0") + pos.x.toString(16).padStart(4, "0");
}