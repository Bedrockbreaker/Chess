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

	public King(Pos pos, string nickname, Faction faction, Cardinal forwards, bool isRoyal, bool isIron, bool hasMoved) : base(pos, nickname, faction, forwards, isRoyal, isIron, hasMoved) { }

	public override List<Action> GetActions() {
		List<Action> actions = new();

		return actions;
	}
}