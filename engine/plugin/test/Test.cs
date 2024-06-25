namespace Yggdrasil.Engine.Plugin.Test;

/**
 * <summary>
 * A test piece
 * </summary>
 */
[YggdrasilPiece("test", "test")]
public class Test : Piece {

	public Test() : base() {
		Nickname = "Test";
		IsIron = true;
	}

	public Test(Board board, Pos pos, string nickname, Faction faction, Cardinal forwards, bool isRoyal, bool isIron, bool hasMoved) : base(board, pos, nickname, faction, forwards, isRoyal, isIron, hasMoved) { }
}