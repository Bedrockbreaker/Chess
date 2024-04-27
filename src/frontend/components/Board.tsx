import { useMemo } from "react";
import type { GameState } from "../../common/client";

import "../assets/styles/Board.css";
import { Tile } from "./Tile";

function Board({state, decorative = false}: {state: GameState, decorative?: boolean}) {
	
	const tiles = useMemo(() => {
		const tiles: JSX.Element[] = [];
		for (let y = 0; y < state.board.length; y++) {
			for (let x = 0; x < state.board[0].length; x++) {
				tiles.push(<Tile key={`${y}_${x}`} tile={state.board[y][x]} isSelected={false} onClick={console.log} onMouseEnter={console.log}/>)
			}
		}
		return tiles;
	}, [state]);

	return <div className="boardContainer" style={{"--width": `${state.board[0]?.length || 0}`, "--height": `${state.board.length}`} as any}>
		<div className="container1">
			<div className="container2">
				<div className="tilesContainer">
					{tiles}
				</div>
			</div>
		</div>
	</div>
}

export { Board }