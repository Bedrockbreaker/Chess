type Piece = {
	name: string,
	isWhite: boolean
	pos: {
		x: number,
		y: number
	}
}

type Tile = {
	pieceNamespace?: string,
	piece?: Piece
	pos: {
		x: number,
		y: number
	}
}

const socket = new WebSocket("ws://localhost:7890");

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let sidebarElement: HTMLDivElement;
let sidebarIcon: HTMLImageElement;
let sidebarName: HTMLHeadingElement;
let sidebarSubtitle: HTMLElement;
let sidebarBody: HTMLParagraphElement;
let sidebarCartesianCoords: HTMLParagraphElement;
let sidebarHexCoords: HTMLElement;

let mouseX = -1;
let mouseY = -1;

const images: Map<string, HTMLImageElement> = new Map();
const queue: Map<string, [number, number, number?, number?][]> = new Map();

let state: {board: Tile[][], plugins: string[]} | undefined = undefined;
let selectedPos: {x: number, y: number} | undefined;

document.addEventListener("DOMContentLoaded", () => {
	const canvasElement = document.getElementById("canvas") as HTMLCanvasElement;
	const context = canvasElement.getContext("2d");
	if (!context) throw new Error("Unable to establish canvas context");

	canvas = canvasElement;
	ctx = context;
	sidebarElement = document.getElementById("pieceDisplay") as HTMLDivElement;
	sidebarIcon = document.getElementById("pieceIcon") as HTMLImageElement
	sidebarName = document.getElementById("pieceName") as HTMLHeadingElement;
	sidebarSubtitle = document.getElementById("pieceNamespace") as HTMLElement;
	sidebarBody = document.getElementById("pieceStats") as HTMLDivElement;
	sidebarCartesianCoords = document.getElementById("pieceCartesianCoords") as HTMLParagraphElement;
	sidebarHexCoords = document.getElementById("pieceHexCoords") as HTMLElement;
	
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

	if (!selectedPos) updateSidebar();
}

window.onmouseup = (event) => {
	if (!state || mouseX < 0 || mouseX > 1 || mouseY < 0 || mouseY > 1) return;

	const x = Math.floor(mouseX * state.board[0].length);
	const y = Math.floor(mouseY * state.board.length);
	const tile = state.board[y]?.[x];
	selectedPos = tile?.piece && tile.pos !== selectedPos ? tile.pos : undefined;
	updateSidebar();
}

socket.onopen = (event) => {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
}

socket.onmessage = (event) => {
	state = JSON.parse(event.data) as {board: Tile[][], plugins: string[]};
	console.log(state);
	renderState();
}

function renderState() {
	window.requestAnimationFrame(renderState);
	if (!ctx || !canvas || !state) return;

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	const board = state.board;
	const dw = canvas.width / board[0].length;
	const dh = canvas.height / board.length;

	ctx.font = `${Math.floor(dw/4)}px Calibri`;

	for (let y = 0; y < board.length; y++) {
		for (let x = 0; x < board[0].length; x++) {
			const dx = x * dw;
			const dy = y * dh;

			ctx.fillStyle = (x + y) % 2 === 0 ? "#9b9b9b" : "#5f5f5f";
			ctx.fillRect(dx, dy, dw, dh);
			
			if (y === 0) {
				ctx.fillStyle = x % 2 === 1 ? "#9b9b9b" : "#5f5f5f";
				ctx.fillText(x.toString(), dx + 1, dw/5);
			}

			const tile = board[y][x];
			if (!tile.piece) continue;
			drawImage(getAssetPath(tile), dx, dy, dw, dh);
		}
		if (y > 0) {
			ctx.fillStyle = y % 2 === 1 ? "#9b9b9b" : "#5f5f5f";
			ctx.fillText(y.toString(), 1, y * dh + dw/5);
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
	if (!hoveredTile?.piece) return sidebarElement.classList.add("hidden");

	sidebarIcon.src = getAssetPath(hoveredTile);
	sidebarName.textContent = hoveredTile.piece.name;
	sidebarSubtitle.textContent = hoveredTile.pieceNamespace || "";
	sidebarCartesianCoords.textContent = `(${hoveredTile.pos.x},${hoveredTile.pos.y})`;
	sidebarHexCoords.textContent = `${hoveredTile.pos.y.toString(16).padStart(4, "0")}${hoveredTile.pos.x.toString(16).padStart(4, "0")}`;
	sidebarBody.innerHTML = "";
	const pieceEntries = Object.entries(hoveredTile.piece);
	for (let i = 0; i < pieceEntries.length; i++) {
		const key = pieceEntries[i][0];
		if (["board", "pos", "name"].includes(key)) continue;
		const keyInline = document.createElement("code");
		keyInline.textContent = `${key}: `;
		const valueInline = document.createElement("code");
		valueInline.textContent = JSON.stringify(pieceEntries[i][1]);
		valueInline.classList.add(typeof(pieceEntries[i])[1]);
		sidebarBody.appendChild(keyInline);
		sidebarBody.appendChild(valueInline);
		sidebarBody.appendChild(document.createElement("br"));
	}

	sidebarElement.classList.remove("hidden");
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

function getAssetPath(tile: Tile) {
	if (!tile.pieceNamespace || !tile.piece) return "";
	return `assets/${tile.pieceNamespace.split(":")[0]}/${tile.pieceNamespace.split(":")[1]}_${tile.piece.isWhite ? "white" : "black"}.png`;
}