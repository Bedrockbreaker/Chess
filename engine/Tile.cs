namespace Yggdrasil.Engine;

/// <summary>
/// A tile on the board
/// </summary>
public struct Tile {

	public Pos Pos;
	public Optional<IPiece> Piece;

	public Tile(Pos pos, IPiece piece) {
		Pos = pos;
		Piece = new Optional<IPiece>(piece);
	}

	public readonly Tile Copy() {
		return new Tile(Pos.Copy(), Piece ? Piece.Value.Copy() : default);
	}
}