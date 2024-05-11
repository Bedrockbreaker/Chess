using System;
using Godot;

namespace Yggdrasil.Engine;

/// <summary>
/// A faction which pieces are affiliated with.
/// <para/>
/// Factions are used to determine which pieces can attack each other,
/// as well as their color tint, and color-blind friendly icon.
/// </summary>
public struct Faction {

	public int Id { get; set; }
	public string Name { get; set; }
	public Color Color { get; set; }
	public string Icon { get; set; }

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