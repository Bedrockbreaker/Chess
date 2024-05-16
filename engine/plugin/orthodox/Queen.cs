using System.Collections.Generic;

namespace Yggdrasil.Engine.Plugin.Orthodox;

/// <summary>
/// Standard chess queen.
/// <para/>
/// 
/// </summary>
[YggdrasilPiece("orthodox", "queen")]
public class Queen : Piece {

	public Queen() : base() {
		Nickname = "Queen";
	}

	public Queen(Pos pos, string nickname, Faction faction, Cardinal forwards, bool isRoyal, bool isIron, bool hasMoved) : base(pos, nickname, faction, forwards, isRoyal, isIron, hasMoved) { }

	public override List<Action> GetActions() {
		List<Action> actions = new();

		return actions;
	}
}