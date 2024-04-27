import { useEffect } from "react";
import { NavLink } from "react-router-dom";

import "../assets/styles/MainMenu.css";

function MainMenu() {

	useEffect(() => {
		document.title = `Yggdrasil 🐲`;
	}, []);

	return <div id="menuArea">
		<div className="container1">
			<div className="container2">
				<img className="logo" src="/assets/common/logo.png"/>
				<div className="links">
					<NavLink to="/lobby">
						<img src="/assets/common/multiplayer_icon.png"/>
						<h3>Online</h3>
					</NavLink>
					<NavLink to="/editor">
						<img src="/assets/orthodox/rook_black.png"/>
						<h3>Local</h3>
					</NavLink>
					<NavLink to="/compendium">
						<img src="/assets/common/compendium.png"/>
						<h3>Faepedia</h3>
					</NavLink>
					<NavLink to="/about">
						<img src="/assets/common/about.png"/>
						<h3>About</h3>
					</NavLink>
				</div>
			</div>
		</div>
	</div>
}

export { MainMenu }