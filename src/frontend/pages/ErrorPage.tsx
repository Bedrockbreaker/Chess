import { useRouteError, type ErrorResponse } from "react-router-dom"

import "../assets/styles/ErrorPage.css";
import { NavLink } from "react-router-dom";

function ErrorPage() {
	const error = useRouteError() as Error | ErrorResponse;

	document.title = "Yggdrasil - Error 🐲";

	return (<div id="errorBody">
		<h1>Oh heck.</h1>
		<p>An unexpected error has occurred.</p>
		<p className="errorMessage">{error instanceof Error ? <>{error.message}<br/><br/>{error.stack}</> : `${error.status}: ${error.statusText}`}</p>
		<NavLink to="/">Home</NavLink>
	</div>)
}

export { ErrorPage }