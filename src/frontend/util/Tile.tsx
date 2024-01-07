import type { Tile as TileType } from "./types";

function Tile({ tile }: { tile: TileType }) {
	return <div className={`tile ${(tile.pos.x + tile.pos.y) % 2 === 0 ? "even" : "odd"}`}>
		{tile.piece ? <img src={`/${tile.pieceNamespace.replace(":", "/")}_${tile.piece.isWhite ? "white" : "black"}.png`}></img> : <></>}
	</div>;
}

export { Tile }