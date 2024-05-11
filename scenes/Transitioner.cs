using Godot;

public partial class Transitioner : Node {

	public AnimationPlayer player;

	private bool isInTransition = false;

	public override void _Ready() {
		player = GetNode<AnimationPlayer>("AnimationPlayer");
		AnimationLibrary library = new();
		library.AddAnimation("fade", new Animation());
		player.AddAnimationLibrary("fade", library);
	}

	public void TransitionMenu(string pathTo) {
		TransitionMenu(pathTo, true);
	}

	public void TransitionMenu(string pathTo, bool animateLeft) {
		if (isInTransition) return;
		isInTransition = true;

		Control from = (Control)GetTree().CurrentScene;

		const float duration = .15f;
		const uint opaque = 0xFFFFFFFF;
		const uint transparent = 0xFFFFFF00;
		const int movement = 50;

		Animation anim = player.GetAnimation("fade/fade");
		anim.Clear();
		anim.Length = duration;

		int fadeTrackOut = anim.AddTrack(Animation.TrackType.Value);
		anim.TrackSetPath(fadeTrackOut, $"{from.GetPath()}:modulate");
		anim.TrackInsertKey(fadeTrackOut, 0, opaque);
		anim.TrackInsertKey(fadeTrackOut, duration, transparent);
		anim.TrackSetInterpolationType(fadeTrackOut, Animation.InterpolationType.Cubic);
		int moveAnchorLeftTrackOut = anim.AddTrack(Animation.TrackType.Value);
		anim.TrackSetPath(moveAnchorLeftTrackOut, $"{from.GetPath()}:offset_left");
		anim.TrackInsertKey(moveAnchorLeftTrackOut, 0, 0);
		anim.TrackInsertKey(moveAnchorLeftTrackOut, duration, animateLeft ? -movement : movement);
		anim.TrackSetInterpolationType(moveAnchorLeftTrackOut, Animation.InterpolationType.Cubic);
		int moveAnchorRightTrackOut = anim.AddTrack(Animation.TrackType.Value);
		anim.TrackSetPath(moveAnchorRightTrackOut, $"{from.GetPath()}:offset_right");
		anim.TrackInsertKey(moveAnchorRightTrackOut, 0, 0);
		anim.TrackInsertKey(moveAnchorRightTrackOut, duration, animateLeft ? -movement : movement);
		anim.TrackSetInterpolationType(moveAnchorRightTrackOut, Animation.InterpolationType.Cubic);

		Control to = ResourceLoader.Load<PackedScene>(pathTo).Instantiate<Control>();
		GetTree().Root.AddChild(to);

		int fadeTrackIn = anim.AddTrack(Animation.TrackType.Value);
		anim.TrackSetPath(fadeTrackIn, $"{to.GetPath()}:modulate");
		anim.TrackInsertKey(fadeTrackIn, 0, transparent);
		anim.TrackInsertKey(fadeTrackIn, duration, opaque);
		anim.TrackSetInterpolationType(fadeTrackIn, Animation.InterpolationType.Cubic);
		int moveAnchorLeftTrackIn = anim.AddTrack(Animation.TrackType.Value);
		anim.TrackSetPath(moveAnchorLeftTrackIn, $"{to.GetPath()}:offset_left");
		anim.TrackInsertKey(moveAnchorLeftTrackIn, 0, animateLeft ? movement : -movement);
		anim.TrackInsertKey(moveAnchorLeftTrackIn, duration, 0);
		anim.TrackSetInterpolationType(moveAnchorLeftTrackIn, Animation.InterpolationType.Cubic);
		int moveAnchorRightTrackIn = anim.AddTrack(Animation.TrackType.Value);
		anim.TrackSetPath(moveAnchorRightTrackIn, $"{to.GetPath()}:offset_right");
		anim.TrackInsertKey(moveAnchorRightTrackIn, 0, animateLeft ? movement : -movement);
		anim.TrackInsertKey(moveAnchorRightTrackIn, duration, 0);
		anim.TrackSetInterpolationType(moveAnchorRightTrackIn, Animation.InterpolationType.Cubic);

		player.Play("fade/fade");

		void OnFinish(StringName name) {
			player.AnimationFinished -= OnFinish;
			from.QueueFree();
			GetTree().CurrentScene = to;
			isInTransition = false;
		}

		player.AnimationFinished += OnFinish;
	}
}
