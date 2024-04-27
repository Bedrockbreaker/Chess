import { useState, useRef, useEffect } from "react";
import { Outlet, NavLink } from "react-router-dom";

import { useDynamicLayout } from "../util/DynamicLayout";

import "../assets/styles/App.css";
import hamburgerURL from "../assets/svg/hamburger.svg";

function App() {
	const [isDrawerOpen, setDrawerOpen] = useState(false);

	const menu = useRef<HTMLDivElement | null>(null);
	const detail = useRef<HTMLDivElement | null>(null);

	const mobileStage = useDynamicLayout();

	// document.title = "Yggdrasil 🐲";

	useEffect(() => {

		document.onmouseup = event => {
			if (!menu.current?.contains(event.target as Element)) setDrawerOpen(false);
		}
	}, []);

	// TODO: add settings menu
	// TODO: remove nav items if on index
	return (<div id="container">
		<div id="menubar" ref={menu}>
			<div className="title">
				<MenubarItem to="/" title="">
					<img src="/assets/orthodox/pawn_white.png"/>
					<h1>Yggdrasil {mobileStage === "mobile" ? "Mobile" : (mobileStage === "tablet" ? "Tablet" : "Desktop")}</h1>
				</MenubarItem>
			</div>
			{mobileStage === "mobile" ? (
				<button type="button" onClick={() => setDrawerOpen(!isDrawerOpen)}>
					<img src={hamburgerURL} width="100%"/>
				</button>)
			: <></>}
			<nav className={isDrawerOpen ? "open" : "closed"}>
				{mobileStage !== "desktop" ? (<><div className="separator"/><div className="fullscreen" onClick={() => detail.current?.requestFullscreen()}><h2>Enter Fullscreen</h2></div></>) : <></>}
				<div className="separator"/>
				<MenubarItem to="/lobby" title="Lobby"/>
				<div className="separator"/>
				<a href="/assets/test/test_white.png"><h2>Cool Location</h2></a>
				<div className="separator"/>
			</nav>
		</div>
		<div id="detail" ref={detail}><Outlet/></div>
	</div>);
}

function MenubarItem({to, title, children}: {to: string, title: string, children?: JSX.Element | JSX.Element[]}) {
	return <NavLink className="menuItem" to={to}>{children ? children : <h2>{title}</h2>}</NavLink>;
}

export { App }