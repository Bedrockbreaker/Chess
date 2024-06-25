using System.Collections.Generic;

namespace Yggdrasil.Engine;

/// <summary>
/// A generic piece to extend from
/// </summary>
public class Piece : IPiece {

	public static readonly Namespace Namespace;

	public Board Board { get; set; }
	public Pos Pos { get; set; }
	public string Nickname { get; set; }
	public Faction Faction { get; set; }
	public Cardinal Forwards { get; set; }
	public bool IsRoyal { get; set; }
	public bool IsIron { get; set; }
	public bool HasMoved { get; set; }

	public int X { get => Pos.x; }
	public int Y { get => Pos.y; }
	public virtual Namespace GetNamespace() => Namespace;

	public Piece() { }

	public Piece(Board board, Pos? pos, string nickname, Faction? faction, Cardinal? forwards, bool? isRoyal, bool? isIron, bool? hasMoved) {
		Board = board;
		Pos = pos ?? default;
		Nickname = nickname;
		Faction = faction ?? default;
		Forwards = forwards ?? default;
		IsRoyal = isRoyal ?? false;
		IsIron = isIron ?? false;
		HasMoved = hasMoved ?? false;
	}

	public virtual IPiece Copy() {
		return new Piece(Board, Pos, Nickname, Faction, Forwards, IsRoyal, IsIron, HasMoved);
	}

	public virtual List<List<Action>> GetActions() {
		return new List<List<Action>>();
	}

	public virtual Optional<Tile> GetRelativeTile(Pos offset) {
		return Board.GetTile(Pos + offset.Rotate(Forwards));
	}

	public virtual bool IsFriendly(IPiece other) {
		return Faction == other.Faction;
	}

	public virtual bool IsCapturable() {
		return !IsIron;
	}

	public virtual bool IsCapturableBy(IPiece other) {
		return IsCapturable() && !IsFriendly(other);
	}

	public override string ToString() {
		return $"Piece({Nickname})";
	}
}