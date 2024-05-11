using Godot;

public partial class TransitionScene : Button {

	[Export]
	public string path;
	[Export(PropertyHint.Enum, "Left,Right")]
	public string animationDirection = "Left";

	public Transitioner transitioner;

	public override void _Ready() {
		transitioner = GetNode<Transitioner>("/root/GameController/Transitioner");
		Pressed += OnPressed;
	}

	public void OnPressed() {
		transitioner.TransitionMenu(path, animationDirection == "Left");
	}
}
