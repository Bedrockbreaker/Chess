namespace Yggdrasil.Engine;

/**
 * <summary>
 * An entire board of tiles and pieces
 * </summary>
 */
public struct Board {

	public int Width { get; set; }
	public int Height { get; set; }
	public Tile[,] Tiles { get; set; }

	public Board(int width, int height) {
		Width = width;
		Height = height;
		Tiles = new Tile[width, height];
	}

	public readonly Optional<Tile> GetTile(Pos pos) {
		if (pos.x < 0 || pos.y < 0 || pos.x >= Width || pos.y >= Height) return default;
		return Tiles[pos.x, pos.y];
	}

	public readonly Tile this[int x, int y] {
		get => Tiles[x, y];
		set {
			Tiles[x, y] = value;
		}
	}
}