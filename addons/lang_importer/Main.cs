#if TOOLS
using Godot;

namespace Bedrockbreaker.LangImporter;

[Tool]
public partial class Main : EditorPlugin {

	private LangImporter importer;

	public override void _EnterTree() {
		importer = new LangImporter();
		AddImportPlugin(importer);
	}

	public override void _ExitTree() {
		RemoveImportPlugin(importer);
		importer = null;
	}
}
#endif
