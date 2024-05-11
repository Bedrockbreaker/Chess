using Godot;

namespace Yggdrasil.Client.Screen;

public partial class Quit : Button {

	public override void _Ready() {
		Pressed += () => GetTree().Quit();
	}
}
