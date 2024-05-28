@tool
extends EditorImportPlugin

const result_codes = preload ("../config/result_codes.gd")

var config = preload ("../config/config.gd").new()
var _aseprite_file_exporter = preload ("../aseprite/file_exporter.gd").new()
var file_system: EditorFileSystem = EditorInterface.get_resource_filesystem()

func _get_importer_name():
	return "aseprite_wizard.plugin.texture-tags"

func _get_visible_name():
	return "Aseprite Static Textures Split by Tag"

func _get_recognized_extensions():
	return ["aseprite", "ase"]

func _get_save_extension():
	return "res"

func _get_resource_type():
	return "AtlasTexture"

func _get_preset_count():
	return 1

func _get_preset_name(i):
	return "Default"

func _get_priority():
	return 2.0 if config.get_default_importer() == config.IMPORTER_STATIC_TEXTURE_BY_TAG_NAME else 1.0

func _get_import_order():
	return 1

func _get_import_options(_path, _i):
	return [
		{"name": "exclude_layers_pattern", "default_value": config.get_default_exclusion_pattern()},
		{"name": "only_visible_layers", "default_value": false}
	]

func _get_option_visibility(path, option, options):
	return true

func _import(source_file, save_path, options, platform_variants, gen_files):
	var absolute_source_file = ProjectSettings.globalize_path(source_file)
	var absolute_save_path = ProjectSettings.globalize_path(save_path)

	var source_path = source_file.substr(0, source_file.rfind('/'))
	var source_basename = source_file.substr(source_path.length() + 1, -1)
	source_basename = source_basename.substr(0, source_basename.rfind('.'))

	var aseprite_opts = {
		"export_mode": _aseprite_file_exporter.TAGS_EXPORT_MODE,
		"exception_pattern": options['exclude_layers_pattern'],
		"only_visible_layers": options['only_visible_layers'],
		"output_filename": '',
		"output_folder": source_path,
	}

	var source_files = _aseprite_file_exporter.generate_aseprite_files(absolute_source_file, aseprite_opts)
	if not source_files.is_ok:
		printerr("ERROR - Could not import aseprite file: %s" % result_codes.get_error_message(source_files.code))
		return FAILED

	var should_trigger_scan = false

	for sf in source_files.content:
		if sf.is_first_import:
			file_system.update_file(sf.sprite_sheet)
			append_import_external_resource(sf.sprite_sheet)
		else:
			should_trigger_scan = true

	if should_trigger_scan:
		file_system.scan()

	return OK

func _remove_source_files(source_files: Array):
	for s in source_files:
		DirAccess.remove_absolute(s.data_file)

	file_system.call_deferred("scan")
