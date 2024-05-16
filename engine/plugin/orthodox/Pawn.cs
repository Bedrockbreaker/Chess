using System.Collections.Generic;

namespace Yggdrasil.Engine.Plugin.Orthodox;

/// <summary>
/// Standard chess rook.
/// <para/>
/// 
/// </summary>
[YggdrasilPiece("orthodox", "pawn")]
public class Pawn : Piece {

	public Pawn() : base() {
		Nickname = "Pawn";
	}

	public Pawn(Pos pos, string nickname, Faction faction, Cardinal forwards, bool isRoyal, bool isIron, bool hasMoved) : base(pos, nickname, faction, forwards, isRoyal, isIron, hasMoved) { }

	public override List<Action> GetActions() {
		List<Action> actions = new();

		return actions;
	}
}