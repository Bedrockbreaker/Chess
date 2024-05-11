namespace Yggdrasil.Engine;

/// <summary>
/// A singular leg of a move. Multiple actions can be made in one move.
/// <para/>
/// <list type="bullet">
/// 	<item>Knight B1 -> C3</item>
/// 	<item>Pawn D7 -> D8, Promote to Queen</item>
/// 	<item>Rook A1 -> A4, King A5 -> A3</item>
/// </list>
/// </summary>
public struct Action {

	public IPiece Piece;
	public Pos FromPos;
	public Pos ToPos;
	public Pos RemovePos;
	public Pos CapturePos;
	public Pos SpawnPos;
	public IPiece SpawnPiece;
	public Pos DropPos;
	public bool CanContinue;
}