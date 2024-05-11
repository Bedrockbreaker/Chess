#if TOOLS
using Godot;
using Godot.Collections;
using System;
using System.IO;
using FileAccess = Godot.FileAccess;

namespace Bedrockbreaker.LangImporter;

[Tool]
public partial class LangImporter : EditorImportPlugin {

	public enum Presets {
		DEFAULT
	}

	public override string _GetImporterName() {
		return "bedrockbreaker.lang_importer";
	}

	public override string _GetVisibleName() {
		return "Lang File";
	}

	public override string[] _GetRecognizedExtensions() {
		return new string[] { "lang" };
	}

	public override string _GetSaveExtension() {
		return "translation";
	}

	public override string _GetResourceType() {
		return "Translation";
	}

	public override float _GetPriority() {
		return 1;
	}

	public override int _GetImportOrder() {
		return 0;
	}

	public override int _GetPresetCount() {
		return Enum.GetNames(typeof(Presets)).Length;
	}

	public override string _GetPresetName(int index) {
		return (Presets)index switch {
			Presets.DEFAULT => "Default",
			_ => "Unknown"
		};
	}

	public override Array<Dictionary> _GetImportOptions(string path, int index) {
		return (Presets)index switch {
			Presets.DEFAULT => new Array<Dictionary>() {
				new() {
					{"name", "compress"},
					{"default_value", true}
				}
			},
			_ => new Array<Dictionary>()
		};
	}

	public override bool _GetOptionVisibility(string path, StringName optionName, Dictionary options) {
		return true;
	}

	public override Error _Import(string sourceFile, string savePath, Dictionary options, Array<string> platformVariants, Array<string> genFiles) {
		using FileAccess file = FileAccess.Open(sourceFile, FileAccess.ModeFlags.Read);

		if (file == null || file.GetError() != Error.Ok) return FileAccess.GetOpenError();

		string locale = TranslationServer.Singleton.StandardizeLocale(Path.GetFileNameWithoutExtension(sourceFile));

		if (string.IsNullOrEmpty(locale)) return Error.FileUnrecognized;

		Translation translation = new() {
			Locale = locale
		};

		do {
			string line = file.GetLine();
			if (line.StartsWith("#") || line.Length == 0) continue;

			string[] parts = line.Split('=', 2);
			if (parts.Length != 2) {
				GD.PushWarning($"Invalid line: {line}");
				continue;
			}

			translation.AddMessage(parts[0], parts[1].CUnescape());
		} while (file.GetPosition() < file.GetLength());

		if (options["compress"].AsBool()) {
			OptimizedTranslation optimizedTranslation = new();
			optimizedTranslation.Generate(translation);
			translation = optimizedTranslation;
		}

		Error error = ResourceSaver.Save(translation, $"{savePath}.{_GetSaveExtension()}");
		if (error != Error.Ok) return error;

		savePath = $"{sourceFile.GetBaseDir()}/{locale}.{_GetSaveExtension()}";
		error = ResourceSaver.Save(translation, savePath);
		if (error != Error.Ok) return error;
		genFiles.Add(savePath);

		return Error.Ok;
	}
}
#endif