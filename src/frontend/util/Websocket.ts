import { useCallback, useEffect, useMemo, useRef } from "react"

import type { wsClientMessage } from "../../common/client.d.ts";
import type { wsServerMessage } from "../../common/server";

const token = sessionStorage.getItem("token");
const preferredName = localStorage.getItem("username");
const wsURL = new URL(`ws://${location.hostname}:7890`);
if (token) wsURL.searchParams.set("token", token);
if (preferredName) wsURL.searchParams.set("username", preferredName);

function useWebsocket(url: string | URL = wsURL, onMessage: (message: wsClientMessage) => void = () => {}) {
	const ws = useRef<WebSocket | null>(null);

	useEffect(() => {
		const socket = new WebSocket(url);

		socket.onmessage = event => {
			let message: wsClientMessage | undefined = undefined;
		
			try {
				message = JSON.parse(event.data);
				if (typeof(message) !== "object") throw new Error();
			} catch (error) {
				console.error(error);
				return;
			}

			if (!message) return;
			switch(message.type) {
				case "error":
					console.error("le epic fail :clueless:. I sent invalid data to the websocket:", message.data);
					break;
				case "user":
					sessionStorage.setItem("token", message.data.auth);
					localStorage.setItem("username", message.data.username);
					break;
				case "username":
					localStorage.setItem("username", message.data);
					break;
				default:
					console.log("Received unknown message");
					break;
			}
			onMessage(message);
		}

		ws.current = socket;

		return () => socket.close();
	}, [url, onMessage]);

	return [ws.current, (message: wsServerMessage) => ws.current?.send(JSON.stringify(message))] as const;
}

export { useWebsocket }