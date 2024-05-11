namespace Yggdrasil.Engine;

/// <summary>
/// An entire board of tiles and pieces
/// </summary>
public struct Board {

	public readonly int width;
	public readonly int height;
	public readonly Tile[,] Tiles;

	public readonly Optional<Tile> GetTile(Pos pos) {
		if (pos.x < 0 || pos.y < 0 || pos.x >= width || pos.y >= height) return default;
		return Tiles[pos.x, pos.y];
	}
}