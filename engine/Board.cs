namespace Yggdrasil.Engine;

/// <summary>
/// An entire board of tiles and pieces
/// </summary>
public struct Board {

	public int Width { get; }
	public int Height { get; }
	public Tile[,] Tiles { get; }

	public readonly Optional<Tile> GetTile(Pos pos) {
		if (pos.x < 0 || pos.y < 0 || pos.x >= Width || pos.y >= Height) return default;
		return Tiles[pos.x, pos.y];
	}
}