using System.Collections.Generic;

namespace Yggdrasil.Engine;

/// <summary>
/// A game piece, whether on the board or in the hand
/// </summary>
public interface IPiece {

	public Pos Pos { get; set; }
	public string Nickname { get; set; }
	public Faction Faction { get; set; }
	public Cardinal Forwards { get; set; }
	public bool IsRoyal { get; set; }
	public bool IsIron { get; set; }
	public bool HasMoved { get; set; }

	public int X { get; }
	public int Y { get; }

	public Namespace GetNamespace();

	public IPiece Copy();

	public List<Action> GetActions();

	public bool IsCapturableBy(IPiece other);

	public Optional<Tile> GetRelativeTile(Pos relativePos);
}