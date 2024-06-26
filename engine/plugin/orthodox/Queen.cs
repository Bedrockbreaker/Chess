using System.Collections.Generic;

namespace Yggdrasil.Engine.Plugin.Orthodox;

/**
 * <summary>
 * Standard chess queen.
 * <para/>
 * (F0)(W0)
 * </summary>
 */
[YggdrasilPiece("orthodox", "queen")]
public class Queen : Piece {

	public Queen() : base() {
		Nickname = "Queen";
	}

	public Queen(Board board, Pos pos, string nickname, Faction faction, Cardinal forwards, bool isRoyal, bool isIron, bool hasMoved) : base(board, pos, nickname, faction, forwards, isRoyal, isIron, hasMoved) { }

	public override List<List<Action>> GetActions() {
		List<List<Action>> actions = new();

		// Queen can move indefinitely othogonally or diagonally
		ActionBuilder builder = new(this);
		builder.AddAtom(1, 0).SetRange(0);
		actions.AddRange(builder.Build());

		builder.AddAtom(1, 1).SetRange(0);
		actions.AddRange(builder.Build());

		return actions;
	}
}