using System;
using System.Collections.Generic;

using Godot;

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

	private static readonly Dictionary<Colors, ShaderMaterial> materials = new() {
		{ Colors.WHITE, ResourceLoader.Load<ShaderMaterial>("res://resources/faction/material/WhitePalette.tres") },
		{ Colors.BLACK, ResourceLoader.Load<ShaderMaterial>("res://resources/faction/material/BlackPalette.tres") },
		{ Colors.RED, ResourceLoader.Load<ShaderMaterial>("res://resources/faction/material/RedPalette.tres") },
		{ Colors.GREEN, ResourceLoader.Load<ShaderMaterial>("res://resources/faction/material/GreenPalette.tres") },
		{ Colors.BLUE, ResourceLoader.Load<ShaderMaterial>("res://resources/faction/material/BluePalette.tres") },
		{ Colors.YELLOW, ResourceLoader.Load<ShaderMaterial>("res://resources/faction/material/YellowPalette.tres") },
		{ Colors.PURPLE, ResourceLoader.Load<ShaderMaterial>("res://resources/faction/material/PurplePalette.tres") },
		{ Colors.ORANGE, ResourceLoader.Load<ShaderMaterial>("res://resources/faction/material/OrangePalette.tres") },
		{ Colors.PINK, ResourceLoader.Load<ShaderMaterial>("res://resources/faction/material/PinkPalette.tres") },
		{ Colors.MINT, ResourceLoader.Load<ShaderMaterial>("res://resources/faction/material/MintPalette.tres") },
		{ Colors.CYAN, ResourceLoader.Load<ShaderMaterial>("res://resources/faction/material/CyanPalette.tres") },
		{ Colors.GRAY, ResourceLoader.Load<ShaderMaterial>("res://resources/faction/material/GrayPalette.tres") },
		{ Colors.BROWN, ResourceLoader.Load<ShaderMaterial>("res://resources/faction/material/BrownPalette.tres") },
		{ Colors.MAGENTA, ResourceLoader.Load<ShaderMaterial>("res://resources/faction/material/MagentaPalette.tres") },
		{ Colors.OLIVE, ResourceLoader.Load<ShaderMaterial>("res://resources/faction/material/OlivePalette.tres") },
		{ Colors.CORAL, ResourceLoader.Load<ShaderMaterial>("res://resources/faction/material/CoralPalette.tres") },
	};

	private static readonly Dictionary<Icons, Texture2D> icons = new() {
		{ Icons.CIRCLE, ResourceLoader.Load<Texture2D>("res://resources/faction/icon/circle.png") },
		{ Icons.SQUARE, ResourceLoader.Load<Texture2D>("res://resources/faction/icon/square.png") },
		{ Icons.TRIANGLE, ResourceLoader.Load<Texture2D>("res://resources/faction/icon/triangle.png") },
		{ Icons.SPADE, ResourceLoader.Load<Texture2D>("res://resources/faction/icon/spade.png") },
		{ Icons.DIAMOND, ResourceLoader.Load<Texture2D>("res://resources/faction/icon/diamond.png") },
		{ Icons.HEART, ResourceLoader.Load<Texture2D>("res://resources/faction/icon/heart.png") },
		{ Icons.CLUB, ResourceLoader.Load<Texture2D>("res://resources/faction/icon/club.png") },
		{ Icons.STAR, ResourceLoader.Load<Texture2D>("res://resources/faction/icon/star.png") },
		{ Icons.CROSS, ResourceLoader.Load<Texture2D>("res://resources/faction/icon/cross.png") },
		{ Icons.PLUS, ResourceLoader.Load<Texture2D>("res://resources/faction/icon/plus.png") },
		{ Icons.CRESCENT, ResourceLoader.Load<Texture2D>("res://resources/faction/icon/crescent.png") },
		{ Icons.SPIRAL, ResourceLoader.Load<Texture2D>("res://resources/faction/icon/spiral.png") },
		{ Icons.BOLT, ResourceLoader.Load<Texture2D>("res://resources/faction/icon/bolt.png") },
		{ Icons.PENTAGON, ResourceLoader.Load<Texture2D>("res://resources/faction/icon/pentagon.png") },
		{ Icons.HEXAGON, ResourceLoader.Load<Texture2D>("res://resources/faction/icon/hexagon.png") },
		{ Icons.ARROW, ResourceLoader.Load<Texture2D>("res://resources/faction/icon/arrow.png") }
	};

	public int Id { get; set; }
	public string Name { get; set; }
	public Colors Color { get; set; }
	public Icons Icon { get; set; }
	public TimeControls TimeControls { get; set; }

	public readonly ShaderMaterial GetMaterial() {
		return materials[Color];
	}

	public readonly Texture2D GetIcon() {
		return icons[Icon];
	}

	public static bool operator ==(Faction a, Faction b) {
		return a.Id == b.Id && a.Name == b.Name;
	}

	public static bool operator !=(Faction a, Faction b) {
		return a.Id != b.Id && a.Name != b.Name;
	}

	public readonly override bool Equals(object obj) {
		if (obj is Faction f) return f.Id == Id && f.Name == Name;
		return false;
	}

	public readonly override int GetHashCode() {
		return HashCode.Combine(Id, Name, Color, Icon);
	}
}

public enum Colors {
	WHITE,
	BLACK,
	RED,
	GREEN,
	BLUE,
	YELLOW,
	PURPLE,
	ORANGE,
	PINK,
	MINT,
	CYAN,
	BROWN,
	GRAY,
	MAGENTA,
	OLIVE,
	CORAL
}

public enum Icons {
	CIRCLE,
	SQUARE,
	TRIANGLE,
	SPADE,
	DIAMOND,
	HEART,
	CLUB,
	STAR,
	CROSS,
	PLUS,
	CRESCENT,
	SPIRAL,
	BOLT,
	PENTAGON,
	HEXAGON,
	ARROW
}