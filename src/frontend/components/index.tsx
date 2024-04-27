import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import "../assets/styles/index.css";

import { App } from "./App";
import { ErrorPage } from "./ErrorPage";
import { MainMenu } from "./MainMenu";
import { Lobby } from "./Lobby";
import { Editor } from "./Editor";
import { Game } from "./Game";
import { Compendium } from "./Compendium";
import { About } from "./About";

const router = createBrowserRouter([
	{
		path: "/",
		element: <App/>,
		errorElement: <ErrorPage/>,
		children: [
			{
				errorElement: <ErrorPage/>,
				children: [
					{
						index: true,
						element: <MainMenu/>
					},
					{
						path: "lobby",
						element: <Lobby/>,
						loader: async () => fetch(`http://${location.hostname}:7890/api/plugins`).then(data => data.json()),
						children: [{
							path: "room/:roomId",
							element: <Lobby/>
						}]
					},
					{
						path: "editor",
						element: <Editor/>
					},
					{
						path: "game",
						element: <Game/>
					},
					{
						path: "compendium",
						element: <Compendium/>,
						children: [
							{
								index: true
								// TODO: base path for compendium
							},
							{
								path: ":pluginId",
								children: [
									{
										index: true
										// TODO: subpath for plugins
									},
									{
										path: ":topic"
										// TODO: topic pages
									}
								]
							}
						]
					},
					{
						path: "about",
						element: <About/>
					}
				]
			}
		]
	}
]);

ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><RouterProvider router={router}/></React.StrictMode>);