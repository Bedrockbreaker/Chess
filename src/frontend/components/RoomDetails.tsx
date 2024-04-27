import { useNavigate } from "react-router-dom";

import { useDynamicLayout } from "../util/DynamicLayout";
import type { Room } from "../../common/client";

import arrowLeftURL from "../assets/svg/arrow_left.svg";
import { Status } from "../../common/util";
import { formatTime, titleCase } from "../util/helpers";
import { Board } from "./Board";

function RoomDetails({room}: {room: Room}) {

	const mobileStage = useDynamicLayout();
	const navigate = useNavigate();

	const passwordInput = <div className="controlContainer passwordInput">
		<label htmlFor="password">Password:</label>
		<input id="password" type="text" autoComplete="off"/>
	</div>;
	
	return <div className="roomDetails">
		<div className="roomHeader">
				<button type="button" className="back" onClick={() => navigate(-1)}><img src={arrowLeftURL}/></button>
				<h3>{room.roomName}</h3>
				{/* TODO: send proper websocket message to join game (don't immediately link to /game/room/:roomId) */}
				{room.password && room.status === Status.WAITING && mobileStage === "desktop" ? passwordInput : undefined}
				{room.allowSpectators || room.status === Status.WAITING ? <a href={`/game/room/${room.id}`}><button type="button" className="join">{room.status === Status.STARTED ? "Spectate" : (room.status === Status.FINISHED ? "Review" : "Join")}</button></a> : undefined}
				{room.password && room.status === Status.WAITING && mobileStage !== "desktop" ? passwordInput : undefined}
				<div className={`statusBar ${room.status === Status.FINISHED ? "gray" : (room.status === Status.STARTED ? "red" : (room.password ? "yellow" : "green"))}`}/>
		</div>
		<div className="roomInfo">
			<h4>{room.status === Status.FINISHED ? "Game Finished" : (room.status === Status.STARTED ? "Game Started" : "Waiting for Players")}</h4>
			<div className="players info">
				<div>
					<div className="username">Players ({room.players.length}/{room.numPlayers})</div>
					<div>Turn Order</div>
				</div>
				<hr/>
				{room.players.map((player, i) => <div key={i}>
					<div className="username">{player.username}</div><div>{player.faction === -1 ? "Random" : player.faction + 1}</div>
				</div>)}
			</div>
			<h4>Plugins</h4>
			<div className="info">{room.game.plugins.map(plugin => titleCase(plugin)).join(", ")}</div>
			<h4>Time Controls</h4>
			<div className="info">
				<div>Main time: {formatTime(room.timeControls.main)}</div>
				{room.timeControls.useHourglass ? <div>Hourglass Format</div> : undefined}
				{room.timeControls.delay ? <div>Delay: {formatTime(room.timeControls.delay)}</div> : undefined}
				{room.timeControls.increment ? <div>Increment: +{formatTime(room.timeControls.increment)}{room.timeControls.enableIncrementAfterTurn ? ` (starting after turn ${room.timeControls.enableIncrementAfterTurn+1})` : ""}</div> : undefined}
				{room.timeControls.byoyomi.periods && room.timeControls.byoyomi.amountPerPeriod ? <div>Byoyomi: {room.timeControls.byoyomi.periods} period(s) of {room.timeControls.byoyomi.movesBeforeReset} move(s) in {formatTime(room.timeControls.byoyomi.amountPerPeriod)}{room.timeControls.byoyomi.progressiveMoveIncrement ? ` (+${room.timeControls.byoyomi.progressiveMoveIncrement} moves per period reset)` : ""}</div> : undefined}
				{room.timeControls.overtime.length ? <div>Overtime(s): {room.timeControls.overtime.map(ot => `+${formatTime(ot.amount)}${ot.triggerAfterTurn ? ` (turn ${ot.triggerAfterTurn+1})` : ""}`).join(", ")}</div> : undefined}
			</div>
			<h4>Board Setup</h4>
			<div className="info row">
				<Board state={room.game} decorative/>
				{/* <Board state={room.game}/> */}
			</div>
		</div>
	</div>;
}

export { RoomDetails }