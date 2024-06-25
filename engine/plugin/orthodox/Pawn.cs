using System.Collections.Generic;

namespace Yggdrasil.Engine.Plugin.Orthodox;

/**
 * <summary>
 * Standard chess pawn.
 * <para/>
 * (fmiW1-fmW1)(fmW1)(fcF1)<br/>
 * + En Passant
 * </summary>
 */
[YggdrasilPiece("orthodox", "pawn")]
public class Pawn : Piece {

	public Pawn() : base() {
		Nickname = "Pawn";
	}

	public Pawn(Board board, Pos pos, string nickname, Faction faction, Cardinal forwards, bool isRoyal, bool isIron, bool hasMoved) : base(board, pos, nickname, faction, forwards, isRoyal, isIron, hasMoved) { }

	public override List<List<Action>> GetActions() {
		List<List<Action>> actions = new();

		// Initial double push
		ActionBuilder builder = new(this);
		builder
			.AddAtom(1, 0)
			.SetDirections(new HashSet<ActionDirections>() { ActionDirections.FORWARD })
			.SetModalities(new HashSet<ActionModalities>() { ActionModalities.MOVE, ActionModalities.INITIAL });
		builder
			.AddAtom(1, 0)
			.SetDirections(new HashSet<ActionDirections>() { ActionDirections.FORWARD })
			.SetModalities(new HashSet<ActionModalities>() { ActionModalities.MOVE });
		actions.AddRange(builder.Build());

		// Regular forward push
		builder
			.AddAtom(1, 0)
			.SetDirections(new HashSet<ActionDirections>() { ActionDirections.FORWARD })
			.SetModalities(new HashSet<ActionModalities>() { ActionModalities.MOVE });
		actions.AddRange(builder.Build());

		// Diagonal capture
		builder
			.AddAtom(1, 1)
			.SetDirections(new HashSet<ActionDirections>() { ActionDirections.FORWARD })
			.SetModalities(new HashSet<ActionModalities>() { ActionModalities.CAPTURE });
		actions.AddRange(builder.Build());

		// TODO: En Passant

		return actions;
	}
}