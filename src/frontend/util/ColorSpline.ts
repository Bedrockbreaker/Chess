class Gradient {

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

function lerp(a: number, b: number, t: number) {
	return a*(1-t) + b*t;
}

export { Gradient }