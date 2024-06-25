using System;

namespace Yggdrasil.Engine;

/**
 * <summary>
 * A unique, human-readable identifier for a piece
 * </summary>
 */
public readonly struct Namespace {

	public string PluginId { get; }
	public string Path { get; }

	public Namespace(string pluginId, string path) {
		PluginId = pluginId;
		Path = path;
	}

	public readonly override string ToString() {
		return $"{PluginId}:{Path}";
	}

	public static bool operator ==(Namespace a, Namespace b) {
		return a.PluginId == b.PluginId && a.Path == b.Path;
	}

	public static bool operator !=(Namespace a, Namespace b) {
		return a.PluginId != b.PluginId || a.Path != b.Path;
	}

	public override bool Equals(object obj) {
		if (obj is Namespace n) return n.PluginId == PluginId && n.Path == Path;
		return false;
	}

	public override int GetHashCode() {
		return HashCode.Combine(PluginId, Path);
	}
}