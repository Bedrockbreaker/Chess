import { randomUUID } from "crypto";

import type { Room as RoomClient } from "../../common/client.d.ts";
import type { TimeControls } from "../../common/common.ts";
import type { Player, RoomSettings, GameSettings, User } from "../../common/server.d.ts";
import { Status } from "../../common/util.ts";
import { YggdrasilEngine } from "../../engine/yggdrasil.ts";

export class Room {

	id: string = randomUUID();
	roomName: string;
	players: Player[];
	numPlayers: number;
	status: Status;
	allowSpectators: boolean;
	password: string;
	timeControls: TimeControls;
	game: YggdrasilEngine = new YggdrasilEngine();

	constructor(roomSettings: RoomSettings, gameSettings: GameSettings) {
		this.roomName = roomSettings.roomName;
		this.players = roomSettings.players;
		this.numPlayers = roomSettings.numPlayers;
		this.status = roomSettings.status;
		this.allowSpectators = roomSettings.allowSpectators;
		this.password = roomSettings.password;
		this.timeControls = roomSettings.timeControls;

		this.game.load(gameSettings).then(() => this.players.forEach(player => player.user.game = this.game));
	}

	addPlayer(user: User, faction: number) {
		if (this.players.length >= this.numPlayers) throw new Error("Attempted to add a player to a full game");
		this.players.push({user, faction});
	}

	package(): RoomClient {
		return {
			id: this.id,
			roomName: this.roomName,
			players: this.players.map(player => ({
				id: player.user.id,
				username: player.user.username,
				faction: player.faction
			})),
			numPlayers: this.numPlayers,
			status: this.status,
			allowSpectators: this.allowSpectators,
			password: this.password !== "",
			timeControls: this.timeControls,
			game: this.game.package()
		}
	}
}