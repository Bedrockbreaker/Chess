using System.Collections.Generic;

namespace Yggdrasil.Engine;

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