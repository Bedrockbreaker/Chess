using System.Collections.Generic;

namespace Yggdrasil.Engine.Plugin.Orthodox;

/// <summary>
/// Standard chess rook.
/// <para/>
/// 
/// </summary>
[YggdrasilPiece("orthodox", "rook")]
public class Rook : Piece {

	public Rook() : base() {
		Nickname = "Rook";
	}

	public Rook(Board board, Pos pos, string nickname, Faction faction, Cardinal forwards, bool isRoyal, bool isIron, bool hasMoved) : base(board, pos, nickname, faction, forwards, isRoyal, isIron, hasMoved) { }

	public override List<List<Action>> GetActions() {
		List<List<Action>> actions = new();

		return actions;
	}
}