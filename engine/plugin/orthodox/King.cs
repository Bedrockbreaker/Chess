using System.Collections.Generic;

namespace Yggdrasil.Engine.Plugin.Orthodox;

/**
 * <summary>
 * Standard chess king.
 * <para/>
 * (F1)(W1)<br/>
 * + Castling
 * </summary>
 */
[YggdrasilPiece("orthodox", "king")]
public class King : Piece {

	public King() : base() {
		Nickname = "King";
	}

	public King(Board board, Pos pos, string nickname, Faction faction, Cardinal forwards, bool isRoyal, bool isIron, bool hasMoved) : base(board, pos, nickname, faction, forwards, isRoyal, isIron, hasMoved) { }

	public override List<List<Action>> GetActions() {
		List<List<Action>> actions = new();

		// King can move once othogonally or diagonally
		ActionBuilder builder = new(this);
		builder.AddAtom(1, 0);
		actions.AddRange(builder.Build());

		builder.AddAtom(1, 1);
		actions.AddRange(builder.Build());

		// TODO: Castling

		return actions;
	}
}