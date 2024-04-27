import { useState, useEffect, useLayoutEffect, useRef } from "react";

import { Tile } from "./Tile.tsx";
import { Gradient, isPosEqual, getHex } from "../util/helpers.ts";
import type { GameState, Pos, Move, TileOverlays, Tile as ClientTile } from "../../common/client";

import "../assets/styles/Game.css";

const root = document.querySelector<HTMLElement>(":root");
const evalGradient = new Gradient([0, 76, 23], [25, 100, 40], [0, 100, 100], [150, 100, 40], [206, 100, 42]); // TODO: make a better gradient

function Game() {
	const mobileQuery = window.matchMedia("(width <= 768px)");
	const tabletQuery = window.matchMedia("(width <= 1024px)");

	const [mobileStage, setMobileStage] = useState(mobileQuery.matches ? 1 : (tabletQuery.matches ? 2 : 3));
	// TODO: allow changing sidebar handedness in settings menu
	const [rightHanded, setRightHanded] = useState((localStorage.getItem("rightHanded") ?? "true") === "true"); // Refers to sidedness of sidebar in tablet/mobile stage, not the user.
	const [gameState, setGameState] = useState<GameState>();
	const [moveOptions, setMoveOptions] = useState<Move[][]>();
	const [selectedPos, setSelectedPos] = useState<Pos>();
	const [selectedMoveIndex, setSelectedMoveIndex] = useState<number>(-1);

	const renderArea = useRef<HTMLDivElement | null>(null);
	const socket = useRef<WebSocket | null>(null);
	const keyTimeout = useRef<NodeJS.Timeout | null>(null);
	const audioPlayer = useRef<HTMLAudioElement | null>(null);
	const historyMain = useRef<HTMLDivElement | null>(null);
	
	// FIXME: memoize all of this processing

	const turns: [Move[], Move[]?][] = [];
	let evenHalfTurn = true;
	for (let i = 0; i < (gameState?.moves.length ?? 0); i++) {
		const move = gameState?.moves[i];
		if (!move) break;
		if (gameState.moves[i-1]?.canContinue) turns.at(-1)?.[evenHalfTurn ? 0 : 1]?.push(move);
		else if (evenHalfTurn) turns.push([[move]]);
		else turns.at(-1)?.push([move]);
		if (!move.canContinue) evenHalfTurn = !evenHalfTurn;
	}

	const movesToOverlay: Move[][] = moveOptions ? (selectedMoveIndex > -1 ? [moveOptions[selectedMoveIndex]] : moveOptions) : [turns.at(-1)?.at(-1) ?? []];
	const overlaysAtPos: Map<string, TileOverlays> = new Map();
	for (let i = 0; i < movesToOverlay.length; i++) {
		const halfTurn = movesToOverlay[i];
		for (let j = 0; j < halfTurn.length; j++) {
			const move = halfTurn[j];
			if (move.removeAtPos) {
				const key = getHex(move.removeAtPos);
				overlaysAtPos.set(key, {...overlaysAtPos.get(key), removal: true});
			}
			if (move.captureAtPos) {
				const key = getHex(move.captureAtPos);
				overlaysAtPos.set(key, {...overlaysAtPos.get(key), capture: true});
			}
			if (move.spawnAtPos) {
				const key = getHex(move.spawnAtPos);
				overlaysAtPos.set(key, {...overlaysAtPos.get(key), spawn: true});
			}
			if (move.dropAtPos) {
				const key = getHex(move.dropAtPos);
				overlaysAtPos.set(key, {...overlaysAtPos.get(key), drop: true});
			}
			if (move.fromPos && move.toPos) {
				const fromKey = getHex(move.fromPos);
				const toKey = getHex(move.toPos);
				overlaysAtPos.set(fromKey, {...overlaysAtPos.get(fromKey), movement: true});
				overlaysAtPos.set(toKey, {...overlaysAtPos.get(toKey), movement: true});
			}
		}
	}

	const tiles: JSX.Element[] = [];
	const width = gameState?.board[0].length ?? 8;
	const height = gameState?.board.length ?? 8;
	root?.style.setProperty("--width", `${width}`);
	root?.style.setProperty("--height", `${height}`);
	let selectedTile: ClientTile | undefined = undefined;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {

			const tile = gameState?.board[y][x];
			const pos = {x: x, y: y};
			const overlay = overlaysAtPos.get(getHex(pos));
			if (isPosEqual(selectedPos, pos) && tile?.piece) selectedTile = tile;

			const selectMove = () => {
				if (!moveOptions) {
					setSelectedMoveIndex(-1);
					return -1;
				}
				const moves = moveOptions.filter(halfTurn => halfTurn.some(move => {
					return selectedPos && (selectedPos.x !== x || selectedPos.y !== y)
						&& (isPosEqual(move.fromPos, pos)
						|| isPosEqual(move.toPos, pos)
						|| isPosEqual(move.removeAtPos, pos)
						|| isPosEqual(move.captureAtPos, pos)
						|| isPosEqual(move.spawnAtPos, pos)
						|| isPosEqual(move.dropAtPos, pos))
				}));
				if (moves.length > 1) {
					setSelectedMoveIndex(-1);
					return -1;
				} 
				const moveIndex = moveOptions.indexOf(moves[0]);
				setSelectedMoveIndex(moveIndex);
				return moveIndex;
			}

			tiles.push(<Tile
				key={y * width + x}
				tile={tile || {pos: pos}}
				isSelected={selectedTile === tile}
				onClick={() => {
					let selectedIndex = selectedMoveIndex;
					const thisIndex = selectMove();
					if (mobileStage < 3 && selectedMoveIndex !== thisIndex) selectedIndex = thisIndex;
					if (((mobileStage === 3 && selectedMoveIndex > -1) || (mobileStage < 3 && selectedIndex === thisIndex && selectedIndex > -1)) && moveOptions) {
						socket.current?.send(JSON.stringify({type: "move", data: moveOptions[selectedIndex].map(move => move.serialized)}));
						setSelectedMoveIndex(-1);
						setSelectedPos(undefined);
						setMoveOptions(undefined);
						return;
					}
					const doSelect = tile?.piece && (selectedPos?.x !== x || selectedPos.y !== y);
					if (!doSelect) {
						setSelectedPos(undefined);
						setMoveOptions(undefined);
						return;
					}
					socket.current?.send(JSON.stringify({type: "moves", data: getHex(pos)}));
					setSelectedPos(pos);
				}}
				onMouseEnter={selectMove}
				overlays={overlay}
			/>);
		}
	}

	useEffect(() => {
		mobileQuery.onchange = () => setMobileStage(mobileQuery.matches ? 1 : (tabletQuery.matches ? 2 : 3));
		tabletQuery.onchange = () => setMobileStage(tabletQuery.matches ? (mobileQuery.matches ? 1 : 2) : 3);
	}, [mobileQuery, tabletQuery]); // These won't change, but ¯\_(ツ)_/¯

	useEffect(() => {
		document.title = `Yggdrasil - Game${!gameState ? " (Loading...)" : ""} 🐲`;
		if (historyMain.current) historyMain.current.scrollTop = historyMain.current.scrollHeight;
	}, [gameState]);

	useEffect(() => {
		localStorage.setItem("rightHanded", rightHanded.toString());
	}, [rightHanded]);

	useEffect(() => {
		const ws = new WebSocket(`ws://${location.hostname}:7890`);
		socket.current = ws;

		ws.onmessage = event => {
			let type: string = "";
			let data: any = undefined;
			try {
				({type, data} = JSON.parse(event.data));
			} catch (error) {
				console.error(error);
			}
			if (!type || !data) return;
			switch(type) {
				case "state":
					setGameState(data as GameState);
					const player = audioPlayer.current;
					if (!player) break;
					player.currentTime = 0;
					player.preservesPitch = false;
					// 1 + random gaussian with variance of (1/10)^2
					player.playbackRate = 1 + (Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random())) / 10;
					player.play().catch(() => {});
					break;
				case "moves":
					setMoveOptions((data as Move[][]).sort((halfTurnA, halfTurnB) => halfTurnA[0].serialized > halfTurnB[0].serialized ? 1 : -1));
					break;
				default:
					return;
			}
			console.log("Received over Websocket:", type, data);
		}

		return () => ws.close();
	}, []);

	useEffect(() => {
		window.onkeydown = event => {
			if (event.repeat) return;
			if (event.key === "k") setRightHanded(!rightHanded);
			else if (event.key === "`") keyTimeout.current = setTimeout(() => socket.current?.send(JSON.stringify({type: "reset"})), 500);
		}
		window.onkeyup = event => {
			if (event.key === "`" && keyTimeout.current) clearTimeout(keyTimeout.current);
		}
	}, [rightHanded, socket]);

	useLayoutEffect(() => {
		const onresize = () => {
			if (!renderArea.current || !root) return;
			const renderAreaBB = renderArea.current.getBoundingClientRect();
			const aspectRatioInside = height / width;
			let maxWidth = 0;

			// The CSS which used to do this never worked properly
			if (mobileStage === 3) { // Desktop
				// renderAreaBB.width - (renderArea padding) - (renderArea gaps) - (sidebar widths), (renderAreaBB.height - (renderArea padding) - (board padding)) / aspectRatioInside + (board padding)
				maxWidth = Math.min(renderAreaBB.width - 32 - 32 - 600, (renderAreaBB.height - 32 - 32) / aspectRatioInside + 32);
			} else if (mobileStage === 2) { // Tablet
				// renderAreaBB.width - (renderArea padding) - (renderArea gap) - (sidebar width), (renderAreaBB.height - (renderArea padding) - (board padding)) / aspectRatioInside + (board padding)
				maxWidth = Math.min(renderAreaBB.width - 16 - 32 - 300, (renderAreaBB.height - 32 - 32) / aspectRatioInside + 32);
			} else { // Mobile
				// renderAreaBB.width - (renderArea padding), ((renderAreaBB.height - (renderAreaPadding)) / 2 - (board padding)) / aspectRatioInside + (board padding)
				maxWidth = Math.min(renderAreaBB.width - 32, ((renderAreaBB.height - 32) / 2 - 32) / aspectRatioInside + 32);
			}

			root.style.setProperty("--width-px", `${maxWidth}px`);
			root.style.setProperty("--height-px", `${(maxWidth - 32) * aspectRatioInside + 32}px`);
			root.style.setProperty("--font-size", `${(maxWidth - 32) / (width * 4)}px`);
		}
		window.onresize = onresize;
		onresize();
	}, [mobileStage, width, height]);

	const movesDiv = <div id="moves">{!gameState ? "Loading..." : (moveOptions ? moveOptions.map((halfturn, i) => {
		return <div
			key={i}
			className={i === selectedMoveIndex ? "selected" : ""}
			onClick={() => {
				if (mobileStage < 3 && selectedMoveIndex !== i) return setSelectedMoveIndex(i);
				socket.current?.send(JSON.stringify({type: "move", data: halfturn.map(move => move.serialized)}));
				setSelectedMoveIndex(-1);
				setSelectedPos(undefined);
				setMoveOptions(undefined);
			}}
			onMouseEnter={() => setSelectedMoveIndex(i)}
			onMouseLeave={() => setSelectedMoveIndex(-1)}
		>
			{halfturn.map((move, j) => <code key={j}>{move.serialized}</code>)}
		</div>;
	}) : "")}</div>;
	
	const boardDiv = <div id="board" onMouseLeave={() => setSelectedMoveIndex(-1)}><div>{tiles}</div></div>;

	// TODO: grab real eval info from NN
	// Random gaussian (median 0) with variance sqrt(5)^2
	const randomEval = (Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random())) * 2.236;
	const historyDiv = <div id="history">
		<div className="prevMove">
			<div className="evalIcon" style={{backgroundColor: `${evalGradient.getCSSColor(Math.min(Math.max(randomEval + 5, 0) / 11, 1))}`}}></div>
			<div className="moveIds">{turns.at(-1)?.at(-1)?.map((move, i) => <code key={i}>{move.serialized}</code>) ?? <code>New Game</code>}</div>
			<div className="eval">{randomEval < 0 ? "-" : "+"}{Math.abs(randomEval).toFixed(1)}</div>
		</div>
		<hr/>
		<div className="main" ref={historyMain}><ol>
			{turns.map((fullTurn, i) => {
				return <li key={i}>
					<div>{fullTurn[0].map((move, j) => <code key={j}>{move.serialized}</code>)}</div>
					{fullTurn[1] ? <div>{fullTurn[1].map((move, j) => <code key={j}>{move.serialized}</code>)}</div> : <></>}
				</li>
			})}
		</ol></div>
	</div>;

	const tooltipDiv = selectedTile ? (<div id="tooltip">
		<div className="header">
			<div className="banner">
				<img src={`/assets/${selectedTile.pieceNamespace.replace(":", "/")}_${selectedTile.piece.isWhite ? "white" : "black"}.png`}/>
				<div className="humanReadable">
					<span>{selectedTile.piece.name}</span>
					<span>({selectedTile.pos.x},{selectedTile.pos.y})</span>
				</div>
			</div>
			<div className="internal">
				<code>{selectedTile.pieceNamespace}</code>
				<code>{getHex(selectedTile.pos)}</code>
			</div>
		</div>
		<div className="stats">{Object.entries(selectedTile.piece).map(pair => ["board", "pos", "name"].includes(pair[0]) ? undefined : <div key={pair[0]}>
			<code>{pair[0]}:</code>{" "}
			<code className={typeof(pair[1])}>{`${pair[1]}`}</code>
		</div>)}</div>
	</div>) : <></>;

	return (<div id="gameArea">
		<div ref={renderArea} className="mainFlex">
			{mobileStage === 1 ? (rightHanded ? <>{boardDiv}{moveOptions ? movesDiv : historyDiv}{tooltipDiv}</> : <>{moveOptions ? movesDiv : historyDiv}{tooltipDiv}{boardDiv}</>) : (<>
				{mobileStage === 2 ? (rightHanded ? <></> : <div className="tabletFlex">{movesDiv}{historyDiv}{tooltipDiv}</div>) : movesDiv}
				{boardDiv}
				{mobileStage === 2 ? (rightHanded ? <div className="tabletFlex">{movesDiv}{historyDiv}{tooltipDiv}</div> : <></>) : <div id="info">{historyDiv}{tooltipDiv}</div>}
			</>)}
		</div>
		<audio src="/assets/common/wood_hit.wav" ref={audioPlayer}/>
	</div>);
}

export { Game }