using System;
using Godot;

namespace Yggdrasil.Tool;

[Tool]
public partial class ControlVisualizer : Control {

	[Export]
	public bool ShowGrowthDirection {
		get => showGrowthDirection;
		set {
			showGrowthDirection = value;
			QueueRedraw();
		}
	}

	[Export]
	public bool ShowAnchorOffsets {
		get => showAnchorOffsets;
		set {
			showAnchorOffsets = value;
			QueueRedraw();
		}
	}

	private bool showGrowthDirection = false;
	private bool showAnchorOffsets = false;

	public override void _Ready() {
		MinimumSizeChanged += QueueRedraw;
		Resized += QueueRedraw;
		SizeFlagsChanged += QueueRedraw;
		ItemRectChanged += QueueRedraw;
	}

	public override void _Draw() {
		if (showAnchorOffsets) {
			// Left offset
			DrawLine(new Vector2(0, Size.Y / 2), new Vector2(-OffsetLeft, Size.Y / 2), Colors.Blue);
			DrawString(GetThemeDefaultFont(), new Vector2(-OffsetLeft / 2, Size.Y / 2), OffsetLeft.ToString(), HorizontalAlignment.Fill);
			// Right offset
			DrawLine(new Vector2(Size.X, Size.Y / 2), new Vector2(Size.X - OffsetRight, Size.Y / 2), Colors.Blue);
			DrawString(GetThemeDefaultFont(), new Vector2(Size.X - OffsetRight / 2, Size.Y / 2), OffsetRight.ToString(), HorizontalAlignment.Fill);
			// Top offset
			DrawLine(new Vector2(Size.X / 2, 0), new Vector2(Size.X / 2, -OffsetTop), Colors.Blue);
			DrawString(GetThemeDefaultFont(), new Vector2(Size.X / 2, -OffsetTop / 2), OffsetTop.ToString(), HorizontalAlignment.Fill);
			// Bottom offset
			DrawLine(new Vector2(Size.X / 2, Size.Y), new Vector2(Size.X / 2, Size.Y - OffsetBottom), Colors.Blue);
			DrawString(GetThemeDefaultFont(), new Vector2(Size.X / 2, Size.Y - OffsetBottom / 2), OffsetBottom.ToString(), HorizontalAlignment.Fill);
		}

		if (showGrowthDirection) {
			switch (GrowHorizontal) {
				case GrowDirection.Begin:
					DrawArrow(Vector2.Zero, new Vector2(-96, 0), Colors.Green);
					break;
				case GrowDirection.Both:
					DrawArrow(Vector2.Zero, new Vector2(-96, 0), Colors.Green);
					DrawArrow(new Vector2(Size.X, 0), new Vector2(Size.X + 96, 0), Colors.Green);
					break;
				case GrowDirection.End:
					DrawArrow(new Vector2(Size.X, 0), new Vector2(Size.X + 96, 0), Colors.Green);
					break;
			}
			switch (GrowVertical) {
				case GrowDirection.Begin:
					DrawArrow(Vector2.Zero, new Vector2(0, -96), Colors.Green);
					break;
				case GrowDirection.Both:
					DrawArrow(Vector2.Zero, new Vector2(0, -96), Colors.Green);
					DrawArrow(new Vector2(0, Size.Y), new Vector2(0, Size.Y + 96), Colors.Green);
					break;
				case GrowDirection.End:
					DrawArrow(new Vector2(0, Size.Y), new Vector2(0, Size.Y + 96), Colors.Green);
					break;
			}
		}
	}

	private void DrawArrow(Vector2 start, Vector2 end, Color color) {
		float headSize = 16;
		float angle = MathF.PI / 8;
		Vector2 headHalf = (start - end).Normalized() * headSize;

		// Arrow body
		DrawLine(start, end, color);
		// Arrow head
		DrawLine(end, end + headHalf.Rotated(angle), color);
		DrawLine(end, end + headHalf.Rotated(-angle), color);
	}
}
