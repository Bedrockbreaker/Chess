using System.Collections.Generic;

namespace Yggdrasil.Engine.Plugin.Orthodox;

/**
 * <summary>
 * Standard chess bishop.
 * <para/>
 * 
 * </summary>
 */
[YggdrasilPiece("orthodox", "bishop")]
public class Bishop : Piece {

	public Bishop() : base() {
		Nickname = "Bishop";
	}

	public Bishop(Board board, Pos pos, string nickname, Faction faction, Cardinal forwards, bool isRoyal, bool isIron, bool hasMoved) : base(board, pos, nickname, faction, forwards, isRoyal, isIron, hasMoved) { }

	public override List<List<Action>> GetActions() {
		List<List<Action>> actions = new();

		return actions;
	}
}