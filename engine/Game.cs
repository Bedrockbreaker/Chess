using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

using Godot;

namespace Yggdrasil.Engine;

/// <summary>
/// Fantasy chess engine FTW
/// </summary>
public class Game {

	private Dictionary<Namespace, Func<IPiece>> PieceFactory { get; } = new();
	private Dictionary<Type, Namespace> PieceRegistry { get; } = new();
	private Stack<GameState> History { get; } = new();

	public Game(Config config) {

		Type[] types = Assembly.GetExecutingAssembly().GetTypes().Where(type => Attribute.IsDefined(type, typeof(YggdrasilPieceAttribute))).ToArray();

		foreach (Type type in types) {
			YggdrasilPieceAttribute attribute = (YggdrasilPieceAttribute)Attribute.GetCustomAttribute(type, typeof(YggdrasilPieceAttribute));
			if (attribute == null) continue;
			PieceFactory[attribute.Namespace] = () => (IPiece)Activator.CreateInstance(type);
			PieceRegistry[type] = attribute.Namespace;
		}

		if (config.Board.Count < 1 || config.Board[0].Count < 1) throw new Exception($"Error parsing config {config.Name}: Board size must be at least 1x1");

		Board board = new(config.Board.Count, config.Board[0].Count);
		for (int y = 0; y < config.Board.Count; y++) {
			for (int x = 0; x < config.Board[y].Count; x++) {
				string key = config.Board[y][x];
				if (key == null) {
					GD.PushWarning($"Error parsing config {config.Name}: Missing entry at {x}, {y}");
					continue;
				}

				if (key != "." && !config.Keys.ContainsKey(key)) {
					GD.PushWarning($"Error parsing config {config.Name}: Unknown key {key} at {x}, {y}");
					continue;
				}

				Optional<IPiece> piece = default;
				if (key != ".") {
					BoardKey boardKey = config.Keys[key];
					if (!string.IsNullOrEmpty(boardKey.PieceDescription.Namespace)) {
						string[] namespaceParts = boardKey.PieceDescription.Namespace.Split(":");
						if (namespaceParts.Length != 2) {
							GD.PushWarning($"Error parsing config {config.Name}: Invalid namespace {boardKey.PieceDescription.Namespace}");
							continue;
						}

						Namespace namespaceId = new(namespaceParts[0], namespaceParts[1]);
						if (!PieceFactory.ContainsKey(namespaceId)) {
							GD.PushWarning($"Error parsing config {config.Name}: Unknown namespace {namespaceId}");
							continue;
						}

						piece.Value = PieceFactory[namespaceId]();
						// TODO: set piece properties
					}
				}
				board[x, y] = new Tile(new Pos(x, y), piece);
				// TODO: set tile properties
			}
		}
	}

	public Namespace GetNamespace(IPiece piece) {
		return PieceRegistry[piece.GetType()];
	}
}

public struct GameState {

	public Board Board { get; }
	public List<Move> Moves { get; }
	public Faction ActiveFaction { get; }
}

[AttributeUsage(AttributeTargets.Class)]
public class YggdrasilPieceAttribute : Attribute {

	public Namespace Namespace { get; set; }

	public YggdrasilPieceAttribute(string pluginId, string pieceId) {
		Namespace = new Namespace(pluginId, pieceId);
	}
}