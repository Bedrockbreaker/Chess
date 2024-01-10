import { Overlay } from "./TileOverlay.tsx";
import type { TileOverlays, Tile as TileType } from "./types";

function Tile({ tile, isSelected, overlays, onClick, onMouseEnter }: { tile: TileType, isSelected: boolean, overlays?: TileOverlays, onClick: () => void, onMouseEnter: () => void}) {
	return <div className={`tile ${(tile.pos.x + tile.pos.y) % 2 === 0 ? "even" : "odd"} ${isSelected ? "selected" : ""}`} onClick={onClick} onMouseEnter={onMouseEnter}>
		{overlays ? <Overlay classes={Object.keys(overlays)}/> : <></>}
		{tile.pos.x === 0 || tile.pos.y === 0 ? <span>{tile.pos.x || tile.pos.y}</span> : <></>}
		{tile.piece ? <img src={`/assets/${tile.pieceNamespace.replace(":", "/")}_${tile.piece.isWhite ? "white" : "black"}.png`} draggable="false"></img> : <></>}
	</div>;
}

export { Tile }