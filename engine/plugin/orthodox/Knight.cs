using System.Collections.Generic;

namespace Yggdrasil.Engine.Plugin.Orthodox;

/// <summary>
/// Standard chess knight.
/// <para/>
/// 
/// </summary>
[YggdrasilPiece("orthodox", "knight")]
public class Knight : Piece {

	public Knight() : base() {
		Nickname = "Knight";
	}

	public Knight(Pos pos, string nickname, Faction faction, Cardinal forwards, bool isRoyal, bool isIron, bool hasMoved) : base(pos, nickname, faction, forwards, isRoyal, isIron, hasMoved) { }

	public override List<Action> GetActions() {
		List<Action> actions = new();

		return actions;
	}
}