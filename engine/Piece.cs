using System.Collections.Generic;

namespace Yggdrasil.Engine;

/// <summary>
/// A generic piece to extend from
/// </summary>
public class Piece : IPiece {

	public static readonly Namespace Namespace;

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

	public Piece(Pos? pos, string nickname, Faction? faction, Cardinal? forwards, bool? isRoyal, bool? isIron, bool? hasMoved) {
		Pos = pos ?? default;
		Nickname = nickname;
		Faction = faction ?? default;
		Forwards = forwards ?? default;
		IsRoyal = isRoyal ?? false;
		IsIron = isIron ?? false;
		HasMoved = hasMoved ?? false;
	}

	public virtual IPiece Copy() {
		return new Piece(Pos, Nickname, Faction, Forwards, IsRoyal, IsIron, HasMoved);
	}

	public virtual List<Action> GetActions() {
		return new List<Action>();
	}

	public virtual Optional<Tile> GetRelativeTile(Pos relativePos) {
		throw new System.NotImplementedException();
	}

	public virtual bool IsCapturableBy(IPiece other) {
		return !IsIron && Faction != other.Faction;
	}
}