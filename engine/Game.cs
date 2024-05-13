using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

namespace Yggdrasil.Engine;

/// <summary>
/// Fantasy chess engine FTW
/// </summary>
public class Game {

	private Dictionary<Namespace, Func<IPiece>> PieceFactories { get; } = new();
	private Dictionary<Type, Namespace> PieceRegistry { get; } = new();

	public Game() {

		Type[] types = Assembly.GetExecutingAssembly().GetTypes().Where(type => Attribute.IsDefined(type, typeof(YggdrasilPieceAttribute))).ToArray();

		foreach (Type type in types) {
			YggdrasilPieceAttribute attribute = (YggdrasilPieceAttribute)Attribute.GetCustomAttribute(type, typeof(YggdrasilPieceAttribute));
			if (attribute == null) continue;
			PieceFactories[attribute.Namespace] = () => (IPiece)Activator.CreateInstance(type);
			PieceRegistry[type] = attribute.Namespace;
		}
	}

	public Namespace GetNamespace(IPiece piece) {
		return PieceRegistry[piece.GetType()];
	}
}

[AttributeUsage(AttributeTargets.Class)]
public class YggdrasilPieceAttribute : Attribute {

	public Namespace Namespace { get; set; }

	public YggdrasilPieceAttribute(string pluginId, string pieceId) {
		Namespace = new Namespace(pluginId, pieceId);
	}
}