using Godot;

using Yggdrasil.Engine;

namespace Yggdrasil.Client.Entity.Piece;

public partial class Piece2D : Node2D {

	public Game game;

	public IPiece Piece {
		get => piece;
		set {
			piece = value;
			sprite.Texture = ResourceLoader.Load<Texture2D>($"res://resources/piece/{game.GetNamespace(piece).PluginId}/{game.GetNamespace(piece).Path}.png");
		}
	}

	public Sprite2D sprite;

	private IPiece piece;

	public override void _Ready() {
		sprite = GetNode<Sprite2D>("Sprite2D");
	}
}
