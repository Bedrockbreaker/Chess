import studioLogoURL from "../public/assets/common/studio.png";
import logoURL from "../public/assets/common/logo.png";

function About() {
	return <div style={{marginLeft: "5rem"}}>
		<h1 style={{marginLeft: "22rem"}}>Credits</h1>
		<img src={studioLogoURL}/>
		<div style={{padding: "2rem", display: "inline-block"}}/>
		<img src={logoURL} width={"300px"}/>
		<hr/>
		<p style={{marginLeft: "19rem"}}>Developer: Jenson Searle</p>
		<p style={{marginLeft: "19rem"}}>Programmer: Jenson Searle</p>
		<p style={{marginLeft: "19rem"}}>Artist: Jenson Searle</p>
	</div>;
}

export { About }