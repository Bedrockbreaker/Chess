using System.Collections.Generic;

namespace Yggdrasil.Engine.Plugin.Orthodox;

/**
 * <summary>
 * Standard chess knight.
 * <para/>
 * 
 * </summary>
 */
[YggdrasilPiece("orthodox", "knight")]
public class Knight : Piece {

	public Knight() : base() {
		Nickname = "Knight";
	}

	public Knight(Board board, Pos pos, string nickname, Faction faction, Cardinal forwards, bool isRoyal, bool isIron, bool hasMoved) : base(board, pos, nickname, faction, forwards, isRoyal, isIron, hasMoved) { }

	public override List<List<Action>> GetActions() {
		List<List<Action>> actions = new();

		return actions;
	}
}