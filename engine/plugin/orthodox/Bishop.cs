using System.Collections.Generic;

namespace Yggdrasil.Engine.Plugin.Orthodox;

/**
 * <summary>
 * Standard chess bishop.
 * <para/>
 * F0
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

		// Bishop can move indefinitely in any diagonal direction.
		ActionBuilder builder = new(this);
		builder.AddAtom(1, 1).SetRange(0);
		actions.AddRange(builder.Build());

		return actions;
	}
}