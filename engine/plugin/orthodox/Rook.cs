using System.Collections.Generic;

namespace Yggdrasil.Engine.Plugin.Orthodox;

/// <summary>
/// Standard chess pawn.
/// <para/>
/// 
/// </summary>
[YggdrasilPiece("orthodox", "rook")]
public class Rook : Piece {

	public Rook() : base() {
		Nickname = "Rook";
	}

	public Rook(Pos pos, string nickname, Faction faction, Cardinal forwards, bool isRoyal, bool isIron, bool hasMoved) : base(pos, nickname, faction, forwards, isRoyal, isIron, hasMoved) { }

	public override List<Action> GetActions() {
		List<Action> actions = new();

		return actions;
	}
}