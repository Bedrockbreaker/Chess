export function clamp(t: number, a: number, b: number) {
	return Math.max(Math.min(t, b), a);
}

export function lerp(a: number, b: number, t: number) {
	return a*(1-t) + b*t;
}

export function parseWithFallback(input: any, fallback: number = 0) {
	return isNaN(Number(input)) ? fallback : Number(input);
}

export function randomBool() {
	return Math.random() < .5;
}

/**
 * Fisher-Yates shuffle
 * // FIXME: make sure this is used instead of a "random sort"
 */
export function shuffle<T>(array: T[]) {

	const shuffled = [...array];
	for (let i = shuffled.length-1; i > 0; i--) {
		const j = Math.floor(Math.random() * i);
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

export enum Status {
	WAITING, STARTED, FINISHED
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
export enum Directions {
	Forward, Back, Left, Right,
	ForwardHalf, BackHalf, LeftHalf, RightHalf,
	LeftFront, RightFront, FrontLeft, FrontRight,
	BackLeft, LeftBack, RightBack, BackRight,
	ChiralLeft, ChiralRight, Vertical, Sideways,
	FrontFront, FrontSide, BackSide, BackBack,
	LeftVertical, RightVertical, LeftLeft, RightRight
}

export enum Modifiers {
	Capture, NonCapture,
	NoLeap, /* Hop, ShortHop,
	Rifle */
}

export enum Cardinals {
	North, East, South, West
}

export enum Events {
	loadEnd,
	HalfTurnStart, HalfTurnEnd
}
