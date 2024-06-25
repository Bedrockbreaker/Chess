namespace Yggdrasil.Engine;

/**
 * <summary>
 * A singular leg of a move. Multiple actions can be made in one move.
 * <para/>
 * <list type="bullet">
 * <item>Knight B1 -> C3</item>
 * <item>Pawn D7 -> D8, Promote to Queen</item>
 * <item>Rook A1 -> A4, King A5 -> A3</item>
 * </list>
 * </summary>
 */
public struct Action {

	public IPiece Piece;
	public Optional<Pos> FromPos;
	public Optional<Pos> ToPos;
	public Optional<Pos> RemovePos;
	public Optional<Pos> CapturePos;
	public Optional<Pos> SpawnPos;
	public Optional<IPiece> SpawnPiece;
	public Optional<Pos> DropPos;
	public bool CanContinue;
	public int Rotation;

	public readonly override string ToString() => $"{Piece} {FromPos} -> {ToPos}";
}