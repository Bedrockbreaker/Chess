using System;

namespace Yggdrasil.Engine;

/// <summary>
/// A faction which pieces are affiliated with.
/// <para/>
/// Factions are used to determine which pieces can attack each other,
/// their color tint and color-blind friendly icon,
/// which direction the board is facing on their client,
/// and the time controls that faction is under.
/// </summary>
public struct Faction {

	public int Id { get; set; }
	public string Name { get; set; }
	public int Color { get; set; }
	public string Icon { get; set; }
	public TimeControls TimeControls { get; set; }

	public static bool operator ==(Faction a, Faction b) {
		return a.Id == b.Id;
	}

	public static bool operator !=(Faction a, Faction b) {
		return a.Id != b.Id;
	}

	public override bool Equals(object obj) {
		if (obj is Faction f) return f.Id == Id;
		return false;
	}

	public override int GetHashCode() {
		return HashCode.Combine(Id, Name, Color, Icon);
	}
}