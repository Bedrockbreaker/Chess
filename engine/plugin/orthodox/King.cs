using System.Collections.Generic;

namespace Yggdrasil.Engine.Plugin.Orthodox;

/// <summary>
/// Standard chess king.
/// <para/>
/// 
/// </summary>
[YggdrasilPiece("orthodox", "king")]
public class King : Piece {

	public King() : base() {
		Nickname = "King";
	}

	public King(Board board, Pos pos, string nickname, Faction faction, Cardinal forwards, bool isRoyal, bool isIron, bool hasMoved) : base(board, pos, nickname, faction, forwards, isRoyal, isIron, hasMoved) { }

	public override List<List<Action>> GetActions() {
		List<List<Action>> actions = new();

		return actions;
	}
}