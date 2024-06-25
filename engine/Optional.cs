using System.Diagnostics;

namespace Yggdrasil.Engine;

/**
 * <summary>
 * An optional value
 * </summary>
 */
public struct Optional<T> {

	private T value;
	private bool hasValue;

	public static explicit operator T(Optional<T> optional) {
		return optional.Value;
	}

	public static implicit operator Optional<T>(T value) {
		return new Optional<T>(value);
	}

	public static implicit operator bool(Optional<T> optional) {
		return optional.hasValue;
	}

	public static bool operator true(Optional<T> optional) {
		return optional.hasValue;
	}

	public static bool operator false(Optional<T> optional) {
		return !optional.hasValue;
	}

	public static Optional<T> None => new();

	public Optional(T value) {
		this.value = value;
		hasValue = true;
	}

	public readonly bool HasValue => hasValue;

	public T Value {
		readonly get {
			Debug.Assert(hasValue, "Optional has no value.");
			return value;
		}
		set {
			this.value = value;
			hasValue = true;
		}
	}

	public readonly T ValueOrDefault() {
		return hasValue ? value : default;
	}

	public readonly T ValueOrDefault(T defaultValue) {
		return hasValue ? value : defaultValue;
	}

	public void Clear() {
		hasValue = false;
		value = default;
	}

	public readonly override string ToString() {
		return hasValue ? $"Optional<{value}>" : "Optional<null>";
	}
}