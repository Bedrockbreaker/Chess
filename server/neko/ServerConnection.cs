using Godot;
using Nakama;
using System;
using System.Collections.Generic;
using System.Linq;
using Yggdrasil.Tool;

namespace Yggdrasil.Server;

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
	public delegate void AuthenticationErrorEventHandler(string message);
	[Signal]
	public delegate void ConnectionErrorEventHandler(string message);
	[Signal]
	public delegate void MatchmakerRequestTicketErrorEventHandler(string message);
	[Signal]
	public delegate void MatchmakerCancelTicketErrorEventHandler(string message);
	[Signal]
	public delegate void MatchJoinErrorEventHandler(string message);
	[Signal]
	public delegate void MatchSendStateErrorEventHandler(string message);

	[Signal]
	public delegate void ConnectionOpenedEventHandler();
	[Signal]
	public delegate void ConnectionClosedEventHandler();
	[Signal]
	public delegate void PlayerJoinEventHandler(string id);
	[Signal]
	public delegate void PlayerLeaveEventHandler(string id, string username);
	[Signal]
	public delegate void MatchStartedEventHandler();
	[Signal]
	public delegate void MatchStateUpdatedEventHandler(long opCode, byte[] state, string userId);

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
		using FileAccess file = FileAccess.OpenEncryptedWithPass("user://auth_token", FileAccess.ModeFlags.Read, password);

		if (file == null || file.GetError() != Error.Ok) return "";

		string authId = file.GetLine();
		string authToken = file.GetLine();
		file.Close();

		return authId == id ? authToken : "";
	}

	private static void StoreAuthToken(string id, string password, string authToken) {
		using FileAccess file = FileAccess.OpenEncryptedWithPass("user://auth_token", FileAccess.ModeFlags.Write, password);
		if (file.GetError() != Error.Ok) return;

		file.StoreLine(id);
		file.StoreLine(authToken);
		file.Close();
	}

	public override async void _Ready() {
		// FIXME: apparently the serverkey ("defaultkey") is a secret
		client = new Nakama.Client(scheme, host, port, serverKey) {
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
			try {
				session = await client.AuthenticateDeviceAsync(id);
			} catch (Exception e) {
				EmitSignal(SignalName.AuthenticationError, e.ToString());
				return;
			}

			StoreAuthToken(id, id, session.AuthToken);
		}

		socket = Socket.From(client);

		socket.Closed += CloseConnection;
		socket.ReceivedMatchmakerMatched += OnMatchmakerMatched;
		socket.ReceivedMatchPresence += OnPresenceEvent;
		socket.ReceivedMatchState += OnReceiveMatchState;

		try {
			await socket.ConnectAsync(session, true);
		} catch (Exception e) {
			EmitSignal(SignalName.ConnectionError, e.ToString());
			return;
		}
		EmitSignal(SignalName.ConnectionOpened);
	}

	public void CloseConnection() {
		socket = null;
		EmitDeferred(SignalName.ConnectionClosed);
	}

	public async void RequestMatchTicket() {
		try {
			ticket = await socket.AddMatchmakerAsync("*", 2, 2);
		} catch (Exception e) {
			EmitSignal(SignalName.MatchmakerRequestTicketError, e.ToString());
		}
	}

	public async void CancelMatchTicket() {
		if (ticket == null) return;
		try {
			await socket.RemoveMatchmakerAsync(ticket);
		} catch (Exception e) {
			EmitSignal(SignalName.MatchmakerCancelTicketError, e.ToString());
		}
	}

	public async void OnMatchmakerMatched(IMatchmakerMatched matched) {
		try {
			match = await socket.JoinMatchAsync(matched);
		} catch (Exception e) {
			EmitSignal(SignalName.MatchJoinError, e.ToString());
			return;
		}
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

	/**
	 * <summary>
	 * Deterministically randomize the host based on the match id
	 * </summary>
	*/
	public void EstablishHost() {
		if (match == null || players.Count == 0) return;
		Random random = new(match.Id.GetHashCode());
		hostPlayer = players.OrderBy(pair => random.Next()).First().Value;
	}

	public void OnReceiveMatchState(IMatchState state) {
		EmitDeferred(SignalName.MatchStateUpdated, state.OpCode, state.State, state.UserPresence.UserId);
	}

	public async void SendMatchState(string state) {
		if (match == null) return;
		try {
			await socket.SendMatchStateAsync(match.Id, 1, state);
		} catch (Exception e) {
			EmitSignal(SignalName.MatchSendStateError, e.ToString());
		}
	}

	/**
	 * <summary>
	 * Most nakama responses are processed in parallel threads,
	 * so we need to defer the signal emission
	 * </summary>
	*/
	private void EmitDeferred(string name, params Variant[] args) {
		Variant[] parameters = new Variant[args.Length + 1];
		parameters[0] = name;
		Array.Copy(args, 0, parameters, 1, args.Length);
		CallDeferred("emit_signal", parameters);
	}
}
