import { useState, useRef, useEffect } from "react";
import { Outlet, NavLink } from "react-router-dom";

import "../assets/styles/App.css";
import hamburgerURL from "../assets/svg/hamburger.svg";

function App() {
	const mobileQuery = window.matchMedia("(width <= 768px)");
	const tabletQuery = window.matchMedia("(width <= 1024px)");
	const [mobileStage, setMobileStage] = useState(mobileQuery.matches ? 1 : (tabletQuery.matches ? 2 : 3));
	const [isDrawerOpen, setDrawerOpen] = useState(false);

	const menu = useRef<HTMLDivElement | null>(null);
	const detail = useRef<HTMLDivElement | null>(null);

	// document.title = "Yggdrasil 🐲";

	useEffect(() => {
		mobileQuery.onchange = () => setMobileStage(mobileQuery.matches ? 1 : (tabletQuery.matches ? 2 : 3));
		tabletQuery.onchange = () => setMobileStage(tabletQuery.matches ? (mobileQuery.matches ? 1 : 2) : 3);

		document.onmouseup = event => {
			if (!menu.current?.contains(event.target as Element)) setDrawerOpen(false);
		}
	}, [mobileQuery, tabletQuery]);

	// TODO: add settings menu
	return (<div id="container">
		<div id="menubar" ref={menu}>
			<div className="title">
				<img src="/assets/orthodox/pawn_white.png"/>
				<h1>Yggdrasil {mobileStage === 1 ? "Mobile" : (mobileStage === 2 ? "Tablet" : "Desktop")}</h1>
			</div>
			{mobileStage === 1 ? (
				<button type="button" onClick={() => setDrawerOpen(!isDrawerOpen)}>
					<img src={hamburgerURL} width="100%"/>
				</button>)
			: <></>}
			<nav className={isDrawerOpen ? "open" : "closed"}>
				{mobileStage < 3 ? (<><div className="separator"/><div className="fullscreen" onClick={() => detail.current?.requestFullscreen()}><h2>Enter Fullscreen</h2></div></>) : <></>}
				<div className="separator"/>
				<MenubarItem to={"sans-undertale"}/>
				<div className="separator"/>
				<a href={"/assets/test/test_white.png"}><h2>Cool Location 2</h2></a>
				<div className="separator"/>
			</nav>
		</div>
		<div id="detail" ref={detail}><Outlet/></div>
	</div>);
}

function MenubarItem({ to }: { to: string}) {
	return <NavLink className="menuItem" to={to}><h2>Cool Location</h2></NavLink>;
}

export { App }