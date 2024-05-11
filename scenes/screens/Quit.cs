using Godot;

public partial class Quit : Button {

	public override void _Ready() {
		Pressed += () => GetTree().Quit();
	}
}
