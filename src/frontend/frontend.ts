interface Pos {
	x: number;
	y: number;
}

interface Tile {
	pos: Pos;
	piece?: Piece;
	pieceNamespace?: string;
}

interface Piece {
	board: Tile[][];
	pos: Pos;
	name: string;
	isWhite: boolean;
	isRoyal: boolean;
	isIron: boolean;
	hasMoved: boolean;
}

interface Move {
	piece?: Piece;
	pieceNamespace?: string;
	fromPos?: Pos;
	toPos?: Pos;
	removeAtPos?: Pos;
	captureAtPos?: Pos;
	spawnAtPos?: Pos;
	dropAtPos?: Pos;
	canContinue: boolean;
	serialized: string;
}

const socket = new WebSocket(`ws://${location.host}`);

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;

let pieceDisplay: HTMLDivElement;
let pieceIcon: HTMLImageElement;
let pieceName: HTMLHeadingElement;
let pieceNamespace: HTMLElement;
let pieceStats: HTMLParagraphElement;
let pieceCartesianCoords: HTMLParagraphElement;
let pieceHexCoords: HTMLElement;

let prevMoveMain: HTMLDivElement;
let prevMoveEval: HTMLSpanElement;
let stateStackDiv: HTMLDivElement;
let stateStackList: HTMLOListElement;

let potentialMovesDisplay: HTMLDivElement;

let audioPlayer: HTMLAudioElement;

let mouseX = -1;
let mouseY = -1;
let isShiftDown = false;

const images: Map<string, HTMLImageElement> = new Map();
const queue: Map<string, [number, number, number?, number?][]> = new Map();

let state: {board: Tile[][], moves: Move[]} | undefined;
let selectedPos: Pos | undefined;
let moveOptions: Move[][] | undefined;
let hoveredMove: number = -1;
let soloMove: number = -1;

document.addEventListener("DOMContentLoaded", () => {
	const canvasElement = document.getElementById("canvas") as HTMLCanvasElement;
	const context = canvasElement.getContext("2d");
	if (!context) throw new Error("Unable to establish canvas context");

	canvas = canvasElement;
	ctx = context;

	pieceDisplay = document.getElementById("pieceDisplay") as HTMLDivElement;
	pieceIcon = document.getElementById("pieceIcon") as HTMLImageElement
	pieceName = document.getElementById("pieceName") as HTMLHeadingElement;
	pieceNamespace = document.getElementById("pieceNamespace") as HTMLElement;
	pieceStats = document.getElementById("pieceStats") as HTMLDivElement;
	pieceCartesianCoords = document.getElementById("pieceCartesianCoords") as HTMLParagraphElement;
	pieceHexCoords = document.getElementById("pieceHexCoords") as HTMLElement;

	prevMoveMain = document.getElementById("prevMoveMain") as HTMLDivElement;
	prevMoveEval = document.getElementById("prevMoveEval") as HTMLSpanElement;
	stateStackDiv = document.getElementById("stateStack") as HTMLDivElement;
	stateStackList = document.getElementById("stateStackList") as HTMLOListElement;
	
	potentialMovesDisplay = document.getElementById("potentialMoves") as HTMLDivElement;
	
	audioPlayer = document.getElementById("audioPlayer") as HTMLAudioElement;

	canvasElement.height = canvasElement.width;
	context.imageSmoothingEnabled = false;
	context.strokeStyle = "white";

	if (socket.readyState !== socket.OPEN) context.strokeText("Waiting for Connection...", 0, 10);
});

window.onresize = (event) => {
	canvas.height = canvas.width;
	ctx.imageSmoothingEnabled = false;
};

window.onmousemove = (event) => {
	if (!state) return;
	
	const bb = canvas.getBoundingClientRect();
	mouseX = (event.clientX - bb.left) / bb.width;
	mouseY = (event.clientY - bb.top) / bb.height;

	updateMoveDisplay();
	if (!selectedPos) updateSidebar();
}

window.onmouseup = (event) => {
	if (!state || mouseX < 0 || mouseX > 1 || mouseY < 0 || mouseY > 1) return;

	const x = Math.floor(mouseX * state.board[0].length);
	const y = Math.floor(mouseY * state.board.length);

	const tile = state.board[y]?.[x];
	if (hoveredMove > -1) {
		sendMove(potentialMovesDisplay.children[hoveredMove].innerHTML);
	} else {
		selectedPos = tile?.piece && tile.pos !== selectedPos ? tile.pos : undefined;
	}
	updateMoveDisplay();
	updateSidebar();

	if (selectedPos) socket.send(`moves ${getHexPos({x: x, y: y})}`);
}


let keydownTimeout: NodeJS.Timeout;
window.onkeydown = (event) => {
	if (event.repeat) return;
	const shiftChanged = isShiftDown !== event.shiftKey;
	isShiftDown = event.shiftKey;
	if (shiftChanged) updateMoveDisplay();

	if (event.key === "`") keydownTimeout = setTimeout(() => socket.send("reset"), 500);
}

window.onkeyup = (event) => {
	const shiftChanged = isShiftDown !== event.shiftKey;
	isShiftDown = event.shiftKey;
	if (shiftChanged) updateMoveDisplay();

	if (event.key === "`") clearTimeout(keydownTimeout);
}

socket.onopen = (event) => {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
}

const messageParser = /(\w+) (.+)/m;
socket.onmessage = (event) => {
	const message = messageParser.exec(event.data);
	switch (message?.[1]) {
		case "state":
			const isFirstLoad = state ? false : true;
			state = JSON.parse(message[2]);
			if (!state) return;

			hoveredMove = -1;
			soloMove = -1;
			moveOptions = undefined;
			selectedPos = undefined;

			if (state.moves.length) {
				prevMoveMain.innerHTML = "";
			} else {
				prevMoveMain.innerHTML = "<code>New Game</code>"
			}
			for (let i = state.moves.length-1; i >= 0; i--) {
				if (!state.moves[i].canContinue && prevMoveMain.innerHTML) break;
				prevMoveMain.innerHTML = `<code>${state.moves[i].serialized}</code>` + prevMoveMain.innerHTML;
				// TODO: set color of prevMoveIcon and number of prevMoveEval according to output from NN
			}

			if (!isFirstLoad) {
				audioPlayer.currentTime = 0;
				audioPlayer.preservesPitch = false;
				audioPlayer.playbackRate = 1 + (Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random())) / 10; // 1 + random gaussian with variance of (1/10)^2
				audioPlayer.play().catch(console.log);
			}

			// TODO: allow clicking on a move to temporarily display the board position at that moment
			stateStackList.innerHTML = "";
			let fullTurn = document.createElement("li");
			let innerHTML = "<code>";
			let isWhiteTurn = true;
			for (let i = 0; i < state.moves.length; i++) {
				if (state.moves[i-1]?.canContinue) innerHTML += "<br>";
				innerHTML += state.moves[i].serialized;
				if (state.moves[i].canContinue && i < state.moves.length-1) continue;
				innerHTML += "</code>";
				if (!isWhiteTurn || i === state.moves.length-1) {
					fullTurn.innerHTML = innerHTML;
					stateStackList.appendChild(fullTurn);
					fullTurn = document.createElement("li");
					innerHTML = "<code>";
				} else {
					innerHTML += "<code>";
				}
				isWhiteTurn = !isWhiteTurn;
			}
			stateStackDiv.style.minHeight = `calc(100% - ${stateStackDiv.offsetTop}px)`;
			stateStackDiv.scrollTop = stateStackDiv.scrollHeight;

			updateMoveDisplay();
			renderState();
			break;
		case "moves":
			moveOptions = JSON.parse(message[2]);
			if (!moveOptions || !state) return;
			moveOptions.sort((halfTurnA, halfTurnB) => halfTurnA[0].serialized > halfTurnB[0].serialized ? 1 : -1);

			potentialMovesDisplay.innerHTML = "";
			for (let i = 0; i < moveOptions.length; i++) {
				const halfTurn = moveOptions[i];
				const codeElement = document.createElement("code");
				for (let j = 0; j < halfTurn.length; j++) {
					if (j > 0) codeElement.innerHTML += "<br>";
					codeElement.innerHTML += halfTurn[j].serialized;
				}
				codeElement.onmouseover = (event) => soloMove = i;
				// Prevents all potential moves from rapidly flashing on the screen as the mouse moves between the blocks
				codeElement.onmouseout = (event) => setTimeout(() => soloMove = (soloMove === i ? -1 : soloMove), 50);
				codeElement.onclick = (event) => sendMove(codeElement.innerHTML);
				potentialMovesDisplay.appendChild(codeElement);
			}

			updateMoveDisplay();
			break;
		default:
			console.log("Received unknown message over websocket:", event.data);
			break;
	}
}

function renderState() {
	window.requestAnimationFrame(renderState);
	if (!ctx || !canvas || !state) return;

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	const board = state.board;
	const dw = canvas.width / board[0].length;
	const dh = canvas.height / board.length;

	// TODO: move these 2 lines into window.onresize? (or some other "setupCanvas" function)
	ctx.font = `${Math.floor(dw/4)}px Calibri`;
	ctx.textBaseline = "top";

	// Board squares and markings
	for (let y = 0; y < board.length; y++) {
		for (let x = 0; x < board[0].length; x++) {
			const dx = x * dw;
			const dy = y * dh;

			ctx.fillStyle = (x + y) % 2 === 0 ? "#9b9b9b" : "#5f5f5f";
			ctx.fillRect(dx, dy, dw, dh);
			
			if (y === 0) {
				ctx.fillStyle = x % 2 === 1 ? "#9b9b9b" : "#5f5f5f";
				ctx.fillText(x.toString(), dx + 1, 0);
			}
		}
		if (y > 0) {
			ctx.fillStyle = y % 2 === 1 ? "#9b9b9b" : "#5f5f5f";
			ctx.fillText(y.toString(), 1, y * dh);
		}
	}

	// Movement overlays and pieces
	let renderedHalfTurn = false;
	for (let y = 0; y < board.length; y++) {
		for (let x = 0; x < board[0].length; x++) {
			const dx = x * dw;
			const dy = y * dh;

			if (!renderedHalfTurn) {
				const moves: Move[][] = (selectedPos ? (soloMove > -1 ? [moveOptions?.[soloMove] ?? []] : moveOptions) : [state.moves]) || [];
				const overlaysAtPos: Map<string, number> = new Map(); // Bitflags indicating overlays mapped to each position on the board
				for (let i = 0; i < moves.length; i++) {
					const halfTurn = moves[i];
					for (let j = halfTurn.length-1; j >=0; j--) {
						const move = halfTurn[j];
						if (!selectedPos && !move.canContinue && renderedHalfTurn) break; // If rendering previous move, only render that last half-turn
						if (move.removeAtPos) {
							const key = getHexPos(move.removeAtPos);
							overlaysAtPos.set(key, (overlaysAtPos.get(key) ?? 0) | 0x1);
						}
						if (move.captureAtPos) {
							const key = getHexPos(move.captureAtPos)
							overlaysAtPos.set(key, (overlaysAtPos.get(key) ?? 0) | 0x2);
						}
						if (move.spawnAtPos) {
							const key = getHexPos(move.spawnAtPos);
							overlaysAtPos.set(key, (overlaysAtPos.get(key) ?? 0) | 0x4);
						}
						if (move.dropAtPos) {
							const key = getHexPos(move.dropAtPos)
							overlaysAtPos.set(key, (overlaysAtPos.get(key) ?? 0) | 0x8);
						}
						if (move.fromPos && move.toPos) {
							// TODO: special overlay for 0-leap?
							const fromKey = getHexPos(move.fromPos);
							overlaysAtPos.set(fromKey, (overlaysAtPos.get(fromKey) ?? 0) | 0x10);
							const toKey = getHexPos(move.toPos);
							overlaysAtPos.set(toKey, (overlaysAtPos.get(toKey) ?? 0) | 0x10);
						}
						renderedHalfTurn = true;
					}
				}
				const positions = [...overlaysAtPos.entries()];
				for (let j = 0; j < positions.length; j++) {
					const pos = getPosFromHex(positions[j][0]);
					const overlays = positions[j][1];
					const polygon = overlays.toString(2).replace(/0/g, "").length
					let overlayN = 0;
					if (overlays & 0x1) { // removeAtPos
						ctx.fillStyle = "#D1696977"; // RGBA
						drawOverlay(pos.x, pos.y, dw, dh, polygon, overlayN++);
					}
					if (overlays & 0x2) { // captureAtPos
						ctx.fillStyle = "#CE917877";
						drawOverlay(pos.x, pos.y, dw, dh, polygon, overlayN++);
					}
					if (overlays & 0x4) { // spawnAtPos
						ctx.fillStyle = "#C586C077";
						drawOverlay(pos.x, pos.y, dw, dh, polygon, overlayN++);
					}
					if (overlays & 0x8) { // dropAtPos
						ctx.fillStyle = "#6A995577";
						drawOverlay(pos.x, pos.y, dw, dh, polygon, overlayN++);
					}
					if (overlays & 0x10) { // fromPos and toPos
						ctx.fillStyle = "#569CD677";
						drawOverlay(pos.x, pos.y, dw, dh, polygon, overlayN++);
					}
				}
				renderedHalfTurn = true;
			}

			const tile = board[y][x];
			if (!tile.piece) continue;
			drawImage(getAssetPath(tile), dx, dy, dw, dh);
		}
	}

	drawImage("assets/common/select.png", (selectedPos?.x ?? Math.floor(mouseX * state.board[0].length)) * dw, (selectedPos?.y ?? Math.floor(mouseY * state.board.length)) * dh, dw, dh);
}

let memoizedPiece: Piece | undefined;
function updateSidebar() {
	if (!state) return;
	const hoveredTile = state.board[Math.floor(mouseY * state.board.length)]?.[Math.floor(mouseX * state.board[0].length)] as Tile | undefined;
	if (hoveredTile?.piece === memoizedPiece) return;
	memoizedPiece = hoveredTile?.piece;
	if (!hoveredTile?.piece) return pieceDisplay.classList.add("hidden");

	pieceIcon.src = getAssetPath(hoveredTile);
	pieceName.textContent = hoveredTile.piece.name;
	pieceNamespace.textContent = hoveredTile.pieceNamespace || "";
	pieceCartesianCoords.textContent = `(${hoveredTile.pos.x},${hoveredTile.pos.y})`;
	pieceHexCoords.textContent = getHexPos(hoveredTile.pos);
	pieceStats.innerHTML = "";
	const pieceEntries = Object.entries(hoveredTile.piece);
	for (let i = 0; i < pieceEntries.length; i++) {
		const key = pieceEntries[i][0];
		if (["board", "pos", "name"].includes(key)) continue;
		const keyInline = document.createElement("code");
		keyInline.textContent = `${key}: `;
		const valueInline = document.createElement("code");
		valueInline.textContent = JSON.stringify(pieceEntries[i][1]);
		valueInline.classList.add(typeof(pieceEntries[i])[1]);
		pieceStats.appendChild(keyInline);
		pieceStats.appendChild(valueInline);
		pieceStats.appendChild(document.createElement("br"));
	}

	pieceDisplay.classList.remove("hidden");
}

function updateMoveDisplay() {
	if (!canvas || !ctx || !state) return;

	const childRemoveHighlight = potentialMovesDisplay.children[hoveredMove];
	if (childRemoveHighlight) (childRemoveHighlight as HTMLElement).classList.remove("highlighted");

	if (selectedPos && (moveOptions?.length ?? 0) > 0) {
		potentialMovesDisplay.classList.remove("hidden");
	} else {
		potentialMovesDisplay.classList.add("hidden");
	}
	if (!moveOptions) return;

	const x = Math.floor(mouseX * state.board[0].length);
	const y = Math.floor(mouseY * state.board.length);

	const moves = moveOptions.filter(halfTurn => halfTurn.some(move => {
		return selectedPos && (selectedPos.x !== x || selectedPos.y !== y || isShiftDown)
			&& ((move.fromPos?.x === x && move.fromPos.y === y)
			|| (move.toPos?.x === x && move.toPos.y === y)
			|| (move.removeAtPos?.x === x && move.removeAtPos.y === y)
			|| (move.captureAtPos?.x === x && move.captureAtPos.y === y)
			|| (move.spawnAtPos?.x === x && move.spawnAtPos.y === y)
			|| (move.dropAtPos?.x === x && move.dropAtPos.y === y));
	}));
	if (moves.length > 1) return;
	hoveredMove = moveOptions.findIndex(halfTurn => halfTurn === moves[0]) ?? -1;
	const childAddHighlight = potentialMovesDisplay.children[hoveredMove];
	if (childAddHighlight) (childAddHighlight as HTMLElement).classList.add("highlighted");
}

function sendMove(serializedMove: string) {
	socket.send(`move ["${serializedMove.replace(/<br>/g, "\",\"").replace(/"/g, "\\\"")}"]`);
	hoveredMove = -1;
	soloMove = -1;
	moveOptions = undefined;
	selectedPos = undefined;
	updateMoveDisplay();
	updateSidebar();
}

/**
 * Ensures an image is loaded, then draws it.
 */
function drawImage(path: string, x: number, y: number, width?: number, height?: number) {
	if (!ctx || !canvas) return;

	if (images.has(path)) {
		const image = images.get(path)!;
		ctx.drawImage(image, x, y, width ?? image.naturalWidth, height ?? image.naturalHeight);
		return;
	}

	if (queue.has(path)) {
		queue.get(path)!.push([x, y, width, height]);
		return;
	}

	queue.set(path, [[x, y, width, height]]);
	const image = new Image();
	image.src = path;
	image.onload = () => {
		images.set(path, image);
		const toDraw = queue.get(path)!;
		for (let i = toDraw.length - 1; i >= 0; i--) {
			drawImage(path, ...toDraw[i]);
			toDraw.splice(i, 1);
		}
	}
}

// Equal area slices of a square
const pentagon: [number, number][][] = [[[.5, .5], [.5, 0], [1, 0], [1, 0.3]], [[.5, .5], [1, 0.3], [1, 1], [11/12, 1]], [[.5, .5], [11/12, 1], [1/12, 1]], [[.5, .5], [1/12, 1], [0, 1], [0, 0.3]], [[.5, .5], [0, 0.3], [0, 0], [.5, 0]]];
const squares: [number, number][][] = [[[.5, .5], [.5, 0], [1, 0], [1, .5]], [[.5, .5], [1, .5], [1, 1], [.5, 1]], [[.5, .5], [.5, 1], [0, 1], [0, .5]], [[.5, .5], [0, .5], [0, 0], [.5, 0]]];
const triads: [number, number][][] = [[[.5, .5], [.5, 0], [1, 0], [1, 5/6]], [[.5, .5], [1, 5/6], [1, 1], [0, 1], [0, 5/6]], [[.5, .5], [0, 5/6], [0, 0], [.5, 0]]];
const triangles: [number, number][][] = [[[0, 0], [1, 0], [0, 1]], [[1, 0], [1, 1], [0, 1]]];
const quad: [number, number][][] = [[[0, 0], [1, 0], [1, 1], [0, 1]]];
function drawOverlay(x: number, y: number, dx: number, dy: number, polygon: number, polyN = 0) {
	if (!canvas || !ctx) return;
	let vertices : [number, number][];
	switch (polygon) {
		case 2:
			vertices = triangles[polyN];
			break;
		case 3:
			vertices = triads[polyN];
			break;
		case 4:
			vertices = squares[polyN];
			break;
		case 5:
			vertices = pentagon[polyN];
			break;
		default:
			vertices = quad[polyN];
			break;
	}

	ctx.beginPath();
	ctx.moveTo(x*dx + dx*vertices[0][0], y*dy + dy*vertices[0][1]);
	for (let k = 1; k < vertices.length; k++) {
		ctx.lineTo(x*dx + dx*vertices[k][0], y*dy + dy*vertices[k][1]);
	}
	ctx.closePath();
	ctx.fill();
}

function getAssetPath(tile: Tile) {
	if (!tile.pieceNamespace || !tile.piece) return "";
	return `assets/${tile.pieceNamespace.split(":")[0]}/${tile.pieceNamespace.split(":")[1]}_${tile.piece.isWhite ? "white" : "black"}.png`;
}

function getHexPos(pos: {x: number, y: number}) {
	return `${pos.y.toString(16).padStart(4, "0")}${pos.x.toString(16).padStart(4, "0")}`;
}

function getPosFromHex(hex: string): Pos {
	return {x:  parseInt(hex.slice(4), 16), y: parseInt(hex.slice(0, 4), 16)}
}