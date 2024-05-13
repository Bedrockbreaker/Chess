using Godot;

using Nakama.TinyJson;

using System.Collections.Generic;

using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;

namespace Yggdrasil.Engine;

public struct Config {

	public string Name { get; set; }
	public string Description { get; set; }
	[YamlMember(Alias = "configVersion")]
	public ushort Version { get; set; }
	public List<List<string>> Board { get; set; }
	[YamlMember(Alias = "boardKey")]
	public Dictionary<string, BoardKey> Keys { get; set; }
	public List<Faction> Factions { get; set; }
	public EndConditions EndConditions { get; set; }
	public List<string> Plugins { get; set; }
	public List<string> Moves { get; set; }

	public Config(string sourceFile) {
		using FileAccess file = FileAccess.Open(sourceFile, FileAccess.ModeFlags.Read);

		IDeserializer deserializer = new DeserializerBuilder().WithNamingConvention(HyphenatedNamingConvention.Instance).Build();
		var p = deserializer.Deserialize<Config>(file.GetAsText());
		GD.Print(p.ToJson());

		this = p;
	}
}

public struct BoardKey {
	[YamlMember(Alias = "piece")]
	public PieceDescription PieceDescription { get; set; }
	public List<string> TileComponents { get; set; }
}

public struct PieceDescription {

	public string Namespace { get; set; }
	[YamlMember(Alias = "faction")]
	public int FactionId { get; set; }
	public Cardinal Forwards { get; set; }
}

public struct TimeControls {

	public uint Main { get; set; }
	public uint Increment { get; set; }
	public uint EnableIncrementAfterTurn { get; set; }
	public List<Overtime> Overtime { get; set; }
}

public struct Overtime {

	public uint Amount { get; set; }
	public uint Turn { get; set; }
}

public struct EndConditions {

	public bool ExtinctionRoyalty { get; set; }
	public uint MaxRoyaltyInCheck { get; set; }
	public bool RexMultiplex { get; set; }
	public List<uint> MaxBoringTurns { get; set; }
	public List<uint> MaxTurnRepetitions { get; set; }
	public bool TurnRepetitionIsLoss { get; set; }
}