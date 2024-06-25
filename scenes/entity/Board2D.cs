using System.Linq;

using Godot;

using Nakama.TinyJson;

using Yggdrasil.Client.Entity.Piece;
using Yggdrasil.Engine;

namespace Yggdrasil.Client;

public partial class Board2D : Node2D {

	public PackedScene scene = ResourceLoader.Load<PackedScene>("res://scenes/entity/Piece.tscn");
	public Game game = new(new Config("res://resources/config/custom0.yml"));

	public override void _Ready() {
		GameState state = game.State;
		Board board = state.Board;

		for (int x = 0; x < board.Width; x++) {
			for (int y = 0; y < board.Height; y++) {
				Optional<Tile> tile = board.GetTile(new Pos(x, y));
				if (!tile) continue;
				Optional<IPiece> piece = tile.Value.Piece;
				if (!piece) continue;

				Piece2D piece2d = scene.Instantiate<Piece2D>();
				AddChild(piece2d);
				piece2d.game = game;
				piece2d.Position = new Vector2(x * 32 + 32, y * 32 + 32);
				piece2d.Piece = piece.Value;
			}
		}

		IPiece test = board.GetTile(new Pos(0, 1)).Value.Piece.Value;
		GD.Print(game.GetNamespace(test));
		GD.Print(test.GetActions().Select(actionList => actionList.Select(action => action.ToString()).ToList()).ToList().ToJson());
	}
}