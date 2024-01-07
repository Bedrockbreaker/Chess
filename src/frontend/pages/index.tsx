import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import "../assets/styles/index.css";

import { App } from "./App";
import { ErrorPage } from "./ErrorPage";
import { Game } from "./Game";

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
						element: <Game/>
					}
				]
			}
		]
	}
]);

ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><RouterProvider router={router}/></React.StrictMode>);