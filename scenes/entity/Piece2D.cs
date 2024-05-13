using Godot;

using Yggdrasil.Engine;
using Yggdrasil.Engine.Plugin;

namespace Yggdrasil.Client.Entity.Piece;

public partial class Piece2D : Node2D {

	public IPiece Piece {
		get => piece;
		set {
			piece = value;
			sprite.Texture = ResourceLoader.Load<Texture2D>($"res://resources/piece/{piece.GetNamespace().PluginId}/{piece.GetNamespace().Path}.png");
		}
	}

	public Sprite2D sprite;

	private IPiece piece;

	public override void _Ready() {
		sprite = GetNode<Sprite2D>("Sprite2D");
		Piece = new Test();
	}
}
