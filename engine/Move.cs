using System.Collections.Generic;

namespace Yggdrasil.Engine;

/// <summary>
/// A full move made by a player, or a half turn.
/// </summary>
public struct Move {
	public List<Action> Actions;

	public Move(List<Action> actions) {
		Actions = actions;
	}
}