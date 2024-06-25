namespace Yggdrasil.Engine;

/**
 * <summary>
 * A tile on the board
 * </summary>
 */
public struct Tile {

	public Pos Pos;
	public Optional<IPiece> Piece;

	public Tile(Pos pos, Optional<IPiece> piece = default) {
		Pos = pos;
		Piece = piece;
	}

	public readonly Tile Copy() {
		return new Tile(Pos.Copy(), Piece ? new Optional<IPiece>(Piece.Value.Copy()) : Optional<IPiece>.None);
	}
}