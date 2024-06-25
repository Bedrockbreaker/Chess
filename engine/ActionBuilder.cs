using System;
using System.Collections.Generic;
using System.Linq;

namespace Yggdrasil.Engine;

/**
 * <summary>
 * An action builder.
 * <para/>
 * Emulates <see href="https://www.gnu.org/software/xboard/Betza.html">Betza 2.0 Notation</see>.<br/>
 * See also: <seealso href="https://en.wikipedia.org/wiki/Betza%27s_funny_notation#Betza_2.0"/>
 * </summary>
 */
public class ActionBuilder {

	public IPiece Piece { get; set; }
	public List<ActionAtom> Atoms { get; set; } = new List<ActionAtom>();
	public ActionBuilder(IPiece piece) {
		Piece = piece;
	}

	public ActionAtom AddAtom() {
		ActionAtom atom = new(Piece);
		Atoms.Add(atom);
		return atom;
	}

	public ActionAtom AddAtom(int x, int y, int range = 1) {
		ActionAtom atom = new(Piece);
		atom.SetPosition(x, y)
			.SetRange(range);
		Atoms.Add(atom);
		return atom;
	}

	public List<List<Action>> Build() {
		ActionAtom lastAtom = Atoms.Last();
		if (lastAtom.Modalities.Contains(ActionModalities.PASS) || lastAtom.Modalities.Contains(ActionModalities.TEST)) {
			throw new Exception("Can't build final atom with modalities PASS or TEST");
		}

		List<List<Action>> actions = new();

		// FIXME: Use the subatoms as the starting points for the next atoms
		actions.AddRange(lastAtom.Build());

		Atoms.Clear();
		return actions;
	}
}

/**
 * <summary>
 * A single unit of an action.<br/>
 * Contains either an (x,y) coordinate or a sub-atom.<br/>
 * Has a range, a list of directions and a list of modalities.
 * </summary>
 */
public class ActionAtom {

	public HashSet<ActionModalities> Modalities = new();

	private IPiece Piece;
	private int X;
	private int Y;
	private ActionAtom SubAtom;
	private int Range = 1;
	private int Directions = (int)ActionDirections.FORWARD | (int)ActionDirections.RIGHT | (int)ActionDirections.BACK | (int)ActionDirections.LEFT;
	private bool AbsoluteRotation = false;

	public ActionAtom(IPiece piece) {
		Piece = piece;
	}

	public ActionAtom SetPosition(int x, int y) {
		X = Math.Max(x, y);
		Y = Math.Min(x, y);
		SubAtom = null;
		return this;
	}

	public ActionAtom SetSubAtom(ActionAtom subAtom) {
		SubAtom = subAtom;
		return this;
	}

	public ActionAtom SetRange(int range) {
		Range = range;
		return this;
	}

	public ActionAtom SetDirections(HashSet<ActionDirections> directions) {
		Directions = directions.Aggregate(0x0000, (int accumulator, ActionDirections direction) => accumulator | (int)direction);
		return this;
	}

	public ActionAtom AddDirection(ActionDirections direction) {
		Directions |= (int)direction;
		return this;
	}

	public ActionAtom SetModalities(HashSet<ActionModalities> modalities) {
		Modalities = modalities;
		return this;
	}

	public ActionAtom AddModality(ActionModalities modality) {
		Modalities.Add(modality);
		return this;
	}

	public ActionAtom SetAbsoluteRotation(bool absoluteRotation) {
		AbsoluteRotation = absoluteRotation;
		return this;
	}

	public List<List<Action>> Build() {
		List<List<Action>> actions = new();

		bool isEightFoldMove = X != Y && Y > 0;
		List<PosRotation> exploration;

		if (SubAtom != null) {
			// BUG: the subatom should be (re)built in the exploration loop
			actions = SubAtom.Build();
			exploration = actions
				.FindAll(actionList => actionList.Any(action => action.Piece == Piece && action.ToPos.HasValue))
				.Select(actionList => {
					Action action = actionList.FindLast(action => action.Piece == Piece && action.ToPos.HasValue);
					return new PosRotation() {
						Pos = action.ToPos.Value,
						Rotation = AbsoluteRotation ? 0 : action.Rotation
					};
				})
				.ToList();
		} else {
			exploration = new List<PosRotation>() { };
			if ((Y != 0 && (Directions & 0x0103) != 0) || (Y == 0 && (Directions & 0x0001) != 0))
				exploration.Add(new PosRotation() { Pos = new Pos(Y, X), Rotation = 0 });
			if ((Y != 0 && (Directions & 0x040C) != 0) || (Y == 0 && (Directions & 0x0004) != 0))
				exploration.Add(new PosRotation() { Pos = new Pos(X, -Y), Rotation = 0 });
			if ((Y != 0 && (Directions & 0x1030) != 0) || (Y == 0 && (Directions & 0x0010) != 0))
				exploration.Add(new PosRotation() { Pos = new Pos(-Y, -X), Rotation = 0 });
			if ((Y != 0 && (Directions & 0x40C0) != 0) || (Y == 0 && (Directions & 0x0040) != 0))
				exploration.Add(new PosRotation() { Pos = new Pos(-X, Y), Rotation = 0 });
			if (X != Y && Y != 0) {
				if ((Directions & 0x0200) != 0)
					exploration.Add(new PosRotation() { Pos = new Pos(X, Y), Rotation = 0 });
				if ((Directions & 0x0800) != 0)
					exploration.Add(new PosRotation() { Pos = new Pos(Y, -X), Rotation = 0 });
				if ((Directions & 0x2000) != 0)
					exploration.Add(new PosRotation() { Pos = new Pos(-X, -Y), Rotation = 0 });
				if ((Directions & 0x8000) != 0)
					exploration.Add(new PosRotation() { Pos = new Pos(-Y, X), Rotation = 0 });
			}
		}

		for (int i = 1; (i < Range + 1 || Range == 0) && exploration.Count > 0; i++) {
			List<PosRotation> explorationSet = exploration.Select(tile => new PosRotation() {
				Pos = tile.Pos * i,
				Rotation = tile.Rotation
			}).ToList();

			for (int j = explorationSet.Count - 1; j >= 0; j--) {
				// TODO: factor in rotation
				Optional<Tile> optionalTile = Piece.GetRelativeTile(explorationSet[j].Pos);
				if (!optionalTile.HasValue) continue;
				Tile tile = optionalTile.Value;

				// TODO: check if this piece is royal, and stop exploration if tile is under attack
				Action action = new() {
					Piece = Piece,
					FromPos = Piece.Pos,
					ToPos = tile.Pos,
					Rotation = explorationSet[j].Rotation
				};
				Optional<IPiece> piece = tile.Piece;
				bool pieceExists = piece.HasValue;
				bool pieceIsEnemy = pieceExists && !piece.Value.IsFriendly(Piece);
				bool pieceIsCapturable = pieceExists && piece.Value.IsCapturable();
				bool pieceIsCapturableByThis = pieceExists && piece.Value.IsCapturableBy(Piece);

				bool passedTest = false;
				if (Modalities.Contains(ActionModalities.CAPTURE) && pieceIsCapturableByThis) {
					action.CapturePos = tile.Pos;
					exploration.RemoveAt(j);
					passedTest = true;
				}
				if (Modalities.Contains(ActionModalities.MOVE) && !pieceExists) {
					passedTest = true;
				}
				if (Modalities.Contains(ActionModalities.PASS) && pieceIsEnemy) {
					passedTest = true;
				}
				if (Modalities.Contains(ActionModalities.DESTROY) && !pieceIsEnemy && pieceIsCapturable) {
					action.CapturePos = tile.Pos;
					exploration.RemoveAt(j);
					passedTest = true;
				}
				if (Modalities.Contains(ActionModalities.TEST) && pieceExists && !pieceIsEnemy) {
					passedTest = true;
				}
				if (Modalities.Contains(ActionModalities.INITIAL) && passedTest) {
					passedTest = !Piece.HasMoved;
				}

				if (!passedTest) {
					exploration.RemoveAt(j);
					continue;
				}

				actions.Add(new List<Action>() { action });
			}
		}

		return actions;
	}
}

public struct PosRotation {
	public Pos Pos { get; set; }
	public int Rotation { get; set; }
}

/**
 * <summary>
 * <c>.. .N .. .N ..</c> Outer ring applies to 8-fold moves (i.e. N - Knight)<br/>
 * <c>.N .F .W .F .N</c> Inner ring applies to 4-fold moves (i.e. F - Ferz, W - Wazir)<br/>
 * <c>.. .W ** .W ..</c> All periods are for text aligment purposes only.<br/>
 * <c>.N .F .W .F .N</c> The "!" means the reverse of the previous characters are equal<br/>
 * <c>.. .N .. .N ..</c> <br/>
 * <para/><br/>
 * <c>Vertical Plane</c> -- <c>Horizontal Plane</c>	-- <c>Index Bit Mask</c><br/>
 * <c>.. .f .. .f ..</c> -- <c>.. .l .. .r ..</c> ----- <c>.. 15 .. .8 ..</c><br/>
 * <c>.f .f .f .f .f</c> -- <c>.l .l .. .r .r</c> ----- <c>14 .7 .0 .1 .9</c><br/>
 * <c>.. .. ** .. ..</c> -- <c>.. .l ** .r ..</c> ----- <c>.. .6 ** .2 ..</c><br/>
 * <c>.b .b .b .b .b</c> -- <c>.l .l .. .r .r</c> ----- <c>13 .5 .4 .3 10</c><br/>
 * <c>.. .b .. .b ..</c> -- <c>.. .l .. .r ..</c> ----- <c>.. 12 .. 11 ..</c><br/>
 * <para/><br/>
 * <c>Vertical Halves</c> -- <c>Horizontal Halves</c> -- <c>Single Directions</c> -- <c>Chiral</c><br/>
 * <c>.. fh .. fh ..</c> --- <c>.. lh .. rh ..</c> ------ <c>.. lf .. rf ..</c> ------ <c>.. hl .. hr ..</c><br/>
 * <c>fh fh .. fh fh</c> --- <c>lh lh .. rh rh</c> ------ <c>fl lf!.. rf!fr</c> ------ <c>hr .. .. .. hl</c><br/>
 * <c>.. .. ** .. ..</c> --- <c>.. .. ** .. ..</c> ------ <c>.. .. ** .. ..</c> ------ <c>.. .. ** .. ..</c><br/>
 * <c>bh bh .. bh bh</c> --- <c>lh lh .. rh rh</c> ------ <c>bl lb!.. rb!br</c> ------ <c>hl .. .. .. hr</c><br/>
 * <c>.. bh .. bh ..</c> --- <c>.. lh .. rh ..</c> ------ <c>.. lb .. rb ..</c> ------ <c>.. hr .. hl ..</c><br/>
 * <para/><br/>
 * <c>Vertical Pairs</c> -- <c>Horizontal Pairs</c> -- <c>Quartets</c><br/>
 * <c>.. ff .. ff ..</c> -- <c>.. lv .. rv ..</c> ----- <c>.. .V .. .V ..</c><br/>
 * <c>fs .. .. .. fs</c> -- <c>ll .. .. .. rr</c> ----- <c>.S .. .V .. .S</c><br/>
 * <c>.. .. ** .. ..</c> -- <c>.. .. ** .. ..</c> ----- <c>.. .S ** .S ..</c><br/>
 * <c>bs .. .. .. bs</c> -- <c>ll .. .. .. rr</c> ----- <c>.S .. .V .. .S</c><br/>
 * <c>.. bb .. bb ..</c> -- <c>.. lv .. rv ..</c> ----- <c>.. .V .. .V ..</c><br/>
 * </summary>
 */
public enum ActionDirections {
	FORWARD = 0xC383, BACK = 0x3C38, LEFT = 0xF0E0, RIGHT = 0x0F0E,
	FORWARD_HALF = 0xC382, BACK_HALF = 0x3C28, LEFT_HALF = 0xF0A0, RIGHT_HALF = 0x0F0A,
	LEFT_FRONT = 0x8080, RIGHT_FRONT = 0x0102, FRONT_LEFT = 0x4080, FRONT_RIGHT = 0x0202,
	BACK_LEFT = 0x2020, LEFT_BACK = 0x1020, RIGHT_BACK = 0x0808, BACK_RIGHT = 0x0408,
	CHIRAL_LEFT = 0xAA00, CHIRAL_RIGHT = 0x5500, VERTICAL = 0x9911, SIDEWAYS = 0x6644,
	FRONT_FRONT = 0x8100, FRONT_SIDE = 0x4200, BACK_SIDE = 0x2400, BACK_BACK = 0x1800,
	LEFT_VERTICAL = 0x9000, RIGHT_VERTICAL = 0x0900, LEFT_LEFT = 0x6000, RIGHT_RIGHT = 0x0600
}

/**
 * <summary>
 * Modalities of an ActionAtom.
 * </summary>
 */
public enum ActionModalities {
	/**
	 * <summary>
	 * Leg can capture opponent's piece.
	 * </summary>
	 */
	CAPTURE,
	/**
	 * <summary>
	 * Leg can move to an empty square.
	 * </summary>
	 */
	MOVE,
	/**
	 * <summary>
	 * Leg can land in a square occupied by an opponent.<br/>
	 * Invalid as the final leg of an action.
	 * </summary>
	 */
	PASS,
	/**
	 * <summary>
	 * Leg can capture your own piece.
	 * </summary>
	 */
	DESTROY,
	/**
	 * <summary>
	 * Leg can land in a square occupied by your own piece.<br/>
	 * Invalid as the final leg of an action.
	 * </summary>
	 */
	TEST,
	/**
	 * <summary>
	 * Leg is an initial move.
	 * </summary>
	 */
	INITIAL
}