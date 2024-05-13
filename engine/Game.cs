using System;
using System.Collections.Generic;

namespace Yggdrasil.Engine;

/// <summary>
/// Fantasy chess engine FTW
/// </summary>
public class Game {

	public static event RegisterPluginHandler RegisterPlugin;

	public delegate void RegisterPluginHandler(Game game);

	private Dictionary<Namespace, Func<IPiece>> PieceFactories { get; } = new();

	public Game() {
		// RegisterPlugin.Invoke(this);
	}

	public void RegisterPieceFactory(Namespace namespaceId, Func<IPiece> factory) {
		PieceFactories[namespaceId] = factory;
	}
}