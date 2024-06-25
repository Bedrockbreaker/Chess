using System;

namespace Yggdrasil.Engine;

/**
 * <summary>
 * A 2D position
 * </summary>
 */
public struct Pos {
	public int x;
	public int y;

	public static Pos operator -(Pos a) {
		return new Pos(-a.x, -a.y);
	}

	public static Pos operator +(Pos a) {
		return a;
	}

	public static bool operator ==(Pos a, Pos b) {
		return a.x == b.x && a.y == b.y;
	}

	public static bool operator !=(Pos a, Pos b) {
		return a.x != b.x || a.y != b.y;
	}

	public static Pos operator +(Pos a, Pos b) {
		return new Pos(a.x + b.x, a.y + b.y);
	}

	public static Pos operator -(Pos a, Pos b) {
		return new Pos(a.x - b.x, a.y - b.y);
	}

	public static Pos operator *(Pos a, int b) {
		return new Pos(a.x * b, a.y * b);
	}

	public Pos(int x, int y) {
		this.x = x;
		this.y = y;
	}

	public readonly Pos Rotate(Cardinal cardinal) {
		return cardinal switch {
			Cardinal.UP => new Pos(x, -y),
			Cardinal.RIGHT => new Pos(-y, -x),
			Cardinal.DOWN => new Pos(-x, y),
			Cardinal.LEFT => new Pos(y, x),
			_ => this
		};
	}

	public readonly Pos RotateCW(int numQuarters) {
		return (numQuarters % 4) switch {
			0 => this,
			1 => new Pos(y, -x),
			2 => new Pos(-x, -y),
			3 => new Pos(-y, x),
			_ => this
		};
	}

	public readonly Pos Copy() {
		return new Pos(x, y);
	}

	public readonly override bool Equals(object obj) {
		if (obj is Pos p) return p.x == x && p.y == y;
		return false;
	}

	public readonly override int GetHashCode() {
		return HashCode.Combine(x, y);
	}

	public readonly override string ToString() {
		return $"Pos({x}, {y})";
	}
}