import { JoinArea } from "./JoinArea";
import { TabbedArea } from "./Tabs";
import { UsernameInput } from "./UsernameInput";

import "../assets/styles/Lobby.css";

function Lobby() {
	return <div id="lobby">
		<div className="container">
			<UsernameInput/>
			<TabbedArea tabs={[
				{label: "Join", children: <JoinArea/>},
				{label: "New Game", children: <></>}
			]}/>
		</div>
	</div>
}

export { Lobby }