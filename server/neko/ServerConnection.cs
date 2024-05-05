using Godot;
using Nakama;
using System;
using System.Collections.Generic;
using System.Linq;

public partial class ServerConnection : Node {

	[Export]
	public string scheme = "http";
	[Export]
	public string host = "localhost";
	[Export]
	public int port = 7350;
	[Export]
	public string serverKey = "defaultkey";

	[Signal]
	public delegate void ConnectionOpenedEventHandler();
	[Signal]
	public delegate void PlayerJoinEventHandler(string id);
	[Signal]
	public delegate void PlayerLeaveEventHandler(string id, string username);
	[Signal]
	public delegate void MatchStartedEventHandler();
	[Signal]
	public delegate void MatchStateEventHandler(long opCode, byte[] state, string userId);

	public IUserPresence localPlayer;
	public IUserPresence hostPlayer;
	public IMatch match;
	public Dictionary<string, IUserPresence> players = new();
	public int instanceId = 0;

	private IClient client;
	private ISession session;
	private ISocket socket;
	private IMatchmakerTicket ticket;

    private static string GetAuthToken(string id, string password) {
		FileAccess file;

		try {
			file = FileAccess.OpenEncryptedWithPass("user://auth_token", FileAccess.ModeFlags.Read, password);
		} catch (Exception) {
			return "";
		}
		if (file == null || file.GetError() != Error.Ok) return "";

		string authId = file.GetLine();
		string authToken = file.GetLine();
		file.Close();

		return authId == id ? authToken : "";
	}

	private static void StoreAuthToken(string id, string password, string authToken) {
		FileAccess file = FileAccess.OpenEncryptedWithPass("user://auth_token", FileAccess.ModeFlags.Write, password);
		if (file.GetError() != Error.Ok) return;

		file.StoreLine(id);
		file.StoreLine(authToken);
		file.Close();
	}

	public override async void _Ready() {
        // FIXME: apparently the serverkey ("defaultkey") is a secret
        client = new Client(scheme, host, port, serverKey) {
            Logger = new Logger(),
        };

        string id;
		if (OS.HasFeature("debug")) {
			id = Instance.UUID;
			GetWindow().Title = $"Yggdrasil (DEBUG) - {Instance.id}";
		} else {
			id = OS.GetUniqueId();
			GD.Print($"Using production id: {id}");
		}

		string authToken = GetAuthToken(id, id);
		if (!string.IsNullOrEmpty(authToken)) {
			ISession renewedSession = Session.Restore(authToken);
			if (!renewedSession.IsExpired) session = renewedSession;
		}

		if (session == null) {
			session = await client.AuthenticateDeviceAsync(id);
			StoreAuthToken(id, id, session.AuthToken);
		}

		socket = Socket.From(client);

		socket.Closed += CloseConnection;
		socket.ReceivedMatchmakerMatched += OnMatchmakerMatched;
		socket.ReceivedMatchPresence += OnPresenceEvent;
		socket.ReceivedMatchState += OnReceiveMatchState;

		await socket.ConnectAsync(session, true);
		EmitSignal(SignalName.ConnectionOpened);
	}

	public void CloseConnection() {
		socket = null;
	}

	public async void RequestMatchTicket() {
		ticket = await socket.AddMatchmakerAsync("*", 2, 2);
	}

	public async void CancelMatchTicket() {
		await socket.RemoveMatchmakerAsync(ticket);
	}

	public async void OnMatchmakerMatched(IMatchmakerMatched matched) {
		match = await socket.JoinMatchAsync(matched);
		localPlayer = matched.Self.Presence;
		CreatePlayer(localPlayer);
		foreach (IUserPresence presence in match.Presences) {
			CreatePlayer(presence);
		}

		EstablishHost();
		EmitDeferred(SignalName.MatchStarted);
	}

	public void OnPresenceEvent(IMatchPresenceEvent presenceEvent) {
		foreach (IUserPresence presence in presenceEvent.Joins) {
			CreatePlayer(presence);
		}

		foreach (IUserPresence presence in presenceEvent.Leaves) {
			DestroyPlayer(presence);
		}

		EstablishHost();
	}

	public void CreatePlayer(IUserPresence presence) {
		if (players.ContainsKey(presence.UserId)) return;
		players.Add(presence.UserId, presence);

		EmitDeferred(SignalName.PlayerJoin, presence.UserId);
	}

	public void DestroyPlayer(IUserPresence presence) {
		if (!players.ContainsKey(presence.UserId)) return;
		players.Remove(presence.UserId);
		EmitDeferred(SignalName.PlayerLeave, presence.UserId, presence.Username);
	}

	public void EstablishHost() {
		// Deterministically randomize the host based on the match id
		Random random = new(match.Id.GetHashCode());
		hostPlayer = players.OrderBy(pair => random.Next()).First().Value;
	}

	public void OnReceiveMatchState(IMatchState state) {
		EmitDeferred(SignalName.MatchState, state.OpCode, state.State, state.UserPresence.UserId);
	}

	public async void SendMatchState(string state) {
		await socket.SendMatchStateAsync(match.Id, 1, state);
	}

	private void EmitDeferred(string name, params Variant[] args) {
		Variant[] parameters = new Variant[args.Length + 1];
		parameters[0] = name;
		Array.Copy(args, 0, parameters, 1, args.Length);
		CallDeferred("emit_signal", parameters);
	}
}
