namespace Yggdrasil.Engine.Plugin;

public class Test : Piece {

	public static readonly new Namespace Namespace = new("test", "test");

	static Test() {
		Game.RegisterPlugin += RegisterPlugin;
	}

	public override Namespace GetNamespace() => Namespace;

	protected static void RegisterPlugin(Game game) {
		game.RegisterPieceFactory(Namespace, () => new Test());
	}

	public Test() : base() {
		Nickname = "Test";
		IsIron = true;
	}

	public Test(Pos pos, string nickname, Faction faction, Cardinal forwards, bool isRoyal, bool isIron, bool hasMoved) : base(pos, nickname, faction, forwards, isRoyal, isIron, hasMoved) { }
}