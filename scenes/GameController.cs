using Godot;

public partial class GameController : Node {

	public override void _Process(double delta) {
		if (Input.IsActionJustPressed("Fullscreen")) {
			if (DisplayServer.WindowGetMode() == DisplayServer.WindowMode.ExclusiveFullscreen) DisplayServer.WindowSetMode(DisplayServer.WindowMode.Windowed);
			else DisplayServer.WindowSetMode(DisplayServer.WindowMode.ExclusiveFullscreen);
		}
	}
}

