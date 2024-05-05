using Godot;
using Godot.Collections;

public partial class Server : Node2D {

	public Button button;
	public TextEdit textEdit;
	public Timer timer;
	public Sprite2D sprite;
	public HttpRequest getPokeInfo;
	public HttpRequest getPokeImage;

	private ServerConnection connection;
	
	public override void _Ready() {
		connection = GetNode<ServerConnection>("/root/ServerConnection");
		button = GetNode<Button>("Button");
		textEdit = GetNode<TextEdit>("TextEdit");
		timer = GetNode<Timer>("Timer");
		sprite = GetNode<Sprite2D>("Sprite2D");
		getPokeInfo = GetNode<HttpRequest>("GetPokeInfo");
		getPokeImage = GetNode<HttpRequest>("GetPokeImage");

		button.Pressed += () => connection.RequestMatchTicket();

		connection.ConnectionOpened += ConnectionOpened;
		connection.MatchStarted += MatchStarted;
		connection.MatchState += PokemonReceived;

		textEdit.TextChanged += () => timer.Start();

		timer.Timeout += OnTimeout;

		sprite.Centered = false;
		sprite.TextureFilter = TextureFilterEnum.Nearest;

		getPokeInfo.RequestCompleted += OnReceiveInfo;
		getPokeImage.RequestCompleted += OnReceiveImage;
	}

	public void ConnectionOpened() {
		button.Disabled = false;
	}

	public void MatchStarted() {
		textEdit.Editable = true;
		textEdit.PlaceholderText = "Enter a pokemon's name";
	}

	public void OnTimeout() {
		SetLocalImage(textEdit.Text);
		connection.SendMatchState(textEdit.Text);
	}

	public void SetLocalImage(string name) {
		Error error = getPokeInfo.Request($"https://pokeapi.co/api/v2/pokemon/{name}");
		if (error != Error.Ok) GD.PushError("Error: " + error);
	}

	public void PokemonReceived(long opCode, byte[] state, string userId) {
		string name = state.GetStringFromUtf8();
		textEdit.Text = name;
		SetLocalImage(name);
	}

	public void OnReceiveInfo(long result, long code, string[] headers, byte[] body) {
		if (result != (long)HttpRequest.Result.Success) {
			GD.PushError("Error couldn't fetch info");
			return;
		}
		
		Json parser = new();
		Error error = parser.Parse(body.GetStringFromUtf8());
		if (error != Error.Ok) {
			GD.PushError("Error parsing info: " + error);
			return;
		}

		Dictionary json = parser.Data.AsGodotDictionary();
		error = getPokeImage.Request(json["sprites"].AsGodotDictionary()["front_default"].AsString());
		if (error != Error.Ok) GD.PushError("Error: " + error);
	}

	public void OnReceiveImage(long result, long code, string[] headers, byte[] body) {
		if (result != (long)HttpRequest.Result.Success) {
			GD.PushError("Error couldn't be downloaded");
			return;
		}

		Image image = new();
		Error error = image.LoadPngFromBuffer(body);
		if (error != Error.Ok) {
			GD.PushError("Error loading image: " + error);
			return;
		}

		sprite.Texture = ImageTexture.CreateFromImage(image);
	}
}
