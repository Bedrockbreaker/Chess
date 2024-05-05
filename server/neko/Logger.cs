using System.Text.RegularExpressions;
using Godot;

class Logger : Nakama.ILogger {

	private static readonly Regex FormatRegex = new(@"({(\d+)})", RegexOptions.Compiled);

	private static string Colorize(string format, params object[] args) {
		format = FormatRegex.Replace(format, (match) => $"[/color][color=blue]{match}[/color][color=white]");
		return $"[color=gray]{Time.GetDatetimeStringFromSystem()}[/color] [color=purple][Nakama][/color] [color=white]{string.Format(format, args)}[/color]";
	}

	public void DebugFormat(string format, params object[] args) {
		GD.PrintRich(Colorize(format, args));
	}

	public void ErrorFormat(string format, params object[] args) {
		GD.PushError(string.Format(format, args));
	}

	public void InfoFormat(string format, params object[] args) {
		GD.PrintRich(Colorize(format, args));
	}

	public void WarnFormat(string format, params object[] args) {
		GD.PushWarning(string.Format(format, args));
	}
}