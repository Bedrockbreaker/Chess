import { useCallback, useEffect, useRef, useState } from "react";

import type { wsClientMessage } from "../../common/client";
import { useWebsocket } from "../util/Websocket";

function UsernameInput() {
	const [username, _setUsername] = useState<string | null>(localStorage.getItem("username"));

	const usernameInput = useRef<HTMLInputElement>(null);
	const setUsername = useRef(_setUsername); // Very ugly, I know.

	const setUsernameClientside = useCallback((newUsername: string) => {
		if(usernameInput.current) usernameInput.current.value = newUsername;
		setUsername.current(newUsername);
	}, []);

	const onMessage = useCallback((message: wsClientMessage) => {
		switch(message.type) {
			case "user":
				setUsernameClientside(message.data.username);
				break;
			case "username":
				setUsernameClientside(message.data);
				break;
		}
	}, [setUsernameClientside]);

	// TODO: extract websocket connection to higher component
	const [ws, send] = useWebsocket(undefined, onMessage);

	const setUsernameServerside = useCallback((newUsername?: string) => {
		if (newUsername === username || !send) return;
		send({type: "username", data: !newUsername ? {method: "GET"} : {method: "PATCH", username: newUsername}});
	}, [username, send]);

	useEffect(() => {
		setUsername.current = _setUsername; // Doing this to avoid recreating a websocket every time the username changes
	}, [_setUsername]);

	return <form onSubmit={event => {
		event.preventDefault();
		usernameInput.current?.blur();
		setUsernameServerside(usernameInput.current?.value);
	}}>
		<input
			ref={usernameInput}
			id="usernameInput"
			className="editable"
			type="text"
			autoComplete="off"
			spellCheck={false}
			defaultValue={username || "loading..."}
			placeholder="♘"
			onBlur={event => setUsernameServerside(event.target.value)}
			minLength={1}
			maxLength={100}
		/>
	</form>
}

export { UsernameInput }