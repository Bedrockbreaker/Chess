using Godot;
using Yggdrasil.Client.Entity.Piece;

namespace Yggdrasil.Client;

public partial class Board2D : Node2D {

	public PackedScene scene = ResourceLoader.Load<PackedScene>("res://scenes/entity/Piece.tscn");

	public override void _Ready() {
		for (int x = 0; x < 5; x++) {
			for (int y = 0; y < 5; y++) {
				Piece2D piece = scene.Instantiate<Piece2D>();
				AddChild(piece);
				piece.Position += new Vector2(x * 64, y * 64);
			}
		}
	}
}