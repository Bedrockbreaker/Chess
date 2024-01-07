import { useState, useEffect, useLayoutEffect, useRef } from "react";

import { Tile } from "../util/Tile.tsx";
import type { GameState } from "../util/types";

import "../assets/styles/Game.css";

const root = document.querySelector<HTMLElement>(":root");

function Game() {
	const mobileQuery = window.matchMedia("(width <= 768px)");
	const tabletQuery = window.matchMedia("(width <= 1024px)");

	const [mobileStage, setMobileStage] = useState(mobileQuery.matches ? 1 : (tabletQuery.matches ? 2 : 3));
	// TODO: allow changing sidebar handedness in settings menu
	const [rightHanded, setRightHanded] = useState((localStorage.getItem("rightHanded") ?? "true") === "true"); // Refers to handedness of sidebar in tablet/mobile stage, not the user.
	const [tempvar, setDisplayTooltip] = useState(false);
	const [gameState, setGameState] = useState<GameState>();

	const renderRef = useRef<HTMLDivElement | null>(null);
	const socket = useRef<WebSocket | null>(null);
	const keyTimeout = useRef<NodeJS.Timeout | null>(null);
	const audioPlayer = useRef<HTMLAudioElement | null>(null);

	useEffect(() => {
		localStorage.setItem("rightHanded", rightHanded.toString());
	}, [rightHanded]);

	useEffect(() => {
		window.onkeydown = event => {
			if (event.repeat) return;
			if (event.key === "k") setRightHanded(!rightHanded);
			else if (event.key === "p") setDisplayTooltip(!tempvar);
			else if (event.key === "`") keyTimeout.current = setTimeout(() => socket.current?.send("reset"), 500);
		}
		window.onkeyup = event => {
			if (event.key === "`" && keyTimeout.current) clearTimeout(keyTimeout.current);
		}
	}, [rightHanded, tempvar, socket]);

	useEffect(() => {
		const ws = new WebSocket(`ws://${location.hostname}:7890`);
		socket.current = ws;

		const parser = /(\w+) (.+)/m;
		ws.onmessage = event => {
			let type: string = "";
			let data: any = undefined;
			try {
				const message = parser.exec(event.data);
				type = message?.[1] || "";
				data = JSON.parse(message?.[2] || "");
				// TODO: change communication protocol
				// ({type, data} = JSON.parse(event.data));
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
					break;
				default:
					return;
			}
			console.log("Received over Websocket:", type, data);
		}

		return () => ws.close();
	}, []);

	useEffect(() => {
		document.title = `Yggdrasil - Game${!gameState ? " (Loading...)" : ""} 🐲`;
	}, [gameState]);

	useEffect(() => {
		mobileQuery.onchange = () => setMobileStage(mobileQuery.matches ? 1 : (tabletQuery.matches ? 2 : 3));
		tabletQuery.onchange = () => setMobileStage(tabletQuery.matches ? (mobileQuery.matches ? 1 : 2) : 3);
	}, [mobileQuery, tabletQuery]);

	const tiles: JSX.Element[] = [];
	const width = gameState?.board[0].length ?? 8;
	const height = gameState?.board.length ?? 8;
	root?.style.setProperty("--width", `${width}`);
	root?.style.setProperty("--height", `${height}`);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			tiles.push(<Tile key={y * width + x} tile={gameState?.board[y][x] || {pos: {x: x, y: y}}}/>);
		}
	}

	useLayoutEffect(() => {
		const onresize = () => {
			if (!renderRef.current || !root) return;
			const renderRefBB = renderRef.current.getBoundingClientRect();
			const aspectRatioInside = height / width;

			// The CSS which used to do this never worked properly
			if (mobileStage === 3) { // Desktop
				// renderRefBB.width - (renderRef padding) - (renderRef gaps) - (sidebar widths), (renderRefBB.height - (renderRef padding) - (board padding)) / aspectRatioInside + (board padding)
				const maxWidth = Math.min(renderRefBB.width - 32 - 32 - 600, (renderRefBB.height - 32 - 32) / aspectRatioInside + 32);
				root.style.setProperty("--width-px", `${maxWidth}px`);
				root.style.setProperty("--height-px", `${(maxWidth - 32) * aspectRatioInside + 32}px`);
			} else if (mobileStage === 2) { // Tablet
				// renderRefBB.width - (renderRef padding) - (renderRef gap) - (sidebar width), (renderRefBB.height - (renderRef padding) - (board padding)) / aspectRatioInside + (board padding)
				const maxWidth = Math.min(renderRefBB.width - 16 - 32 - 300, (renderRefBB.height - 32 - 32) / aspectRatioInside + 32);
				root.style.setProperty("--width-px", `${maxWidth}px`);
				root.style.setProperty("--height-px", `${(maxWidth - 32) * aspectRatioInside + 32}px`);
			} else { // Mobile
				// renderRefBB.width - (renderRef padding), ((renderRefBB.height - (renderRefPadding)) / 2 - (board padding)) / aspectRatioInside + (board padding)
				const maxWidth = Math.min(renderRefBB.width - 32, ((renderRefBB.height - 32) / 2 - 32) / aspectRatioInside + 32);
				root.style.setProperty("--width-px", `${maxWidth}px`);
				root.style.setProperty("--height-px", `${(maxWidth - 32) * aspectRatioInside + 32}px`);
			}
		}
		window.onresize = onresize;
		onresize();
	}, [mobileStage, renderRef, width, height]);

	const movesDiv = <div id="moves">{!gameState ? "Loading..." : ""}</div>;
	const boardDiv = <div id="board"><div className={height > width ? "vertical" : ""}>{tiles}</div></div>;
	const historyDiv = <div id="history"></div>;
	const tooltipDiv = <div id="tooltip" className={tempvar ? "" : "hidden"}>Stuff in the tooltip<br/>Line 2<br/>Line 2<br/>Line 2<br/>Line 2<br/>Line 2<br/>Line 2<br/>Line 2<br/>Line 2<br/>Line 2<br/>Line 2<br/>Line 2</div>;
	const vertical = <>{movesDiv}{historyDiv}{tooltipDiv}</>;

	return (<div id="gameArea">
		<div ref={renderRef} className="mainFlex">
			{mobileStage === 1 ? (rightHanded ? <>{boardDiv}{vertical}</> : <>{vertical}{boardDiv}</>) : (<>
				{mobileStage === 2 ? (rightHanded ? <></> : <div className="tabletFlex">{vertical}</div>) : movesDiv}
				{boardDiv}
				{mobileStage === 2 ? (rightHanded ? <div className="tabletFlex">{vertical}</div> : <></>) : <div id="info">{historyDiv}{tooltipDiv}</div>}
			</>)}
		</div>
		<audio src="/common/wood_hit.wav" ref={audioPlayer}/>
	</div>);
}

export { Game }