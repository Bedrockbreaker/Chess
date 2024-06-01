using Godot;

using Yggdrasil.Engine;

namespace Yggdrasil.Client.Entity.Piece;

public partial class Piece2D : Node2D {

	public Game game;

	public IPiece Piece {
		get => piece;
		set {
			piece = value;
			Material = piece.Faction.GetMaterial();
			sprite.Texture = game.GetTexture2D(piece);
			ColorblindIcon.Texture = piece.Faction.GetIcon();
		}
	}

	public Sprite2D sprite;

	public Sprite2D ColorblindIcon { get; set; }

	private IPiece piece;

	public override void _Ready() {
		sprite = GetNode<Sprite2D>("Sprite2D");
		ColorblindIcon = GetNode<Sprite2D>("ColorblindIcon");
	}
}
