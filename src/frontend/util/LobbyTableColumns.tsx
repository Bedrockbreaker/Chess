import {createColumnHelper, type ColumnDef, type RowData} from "@tanstack/react-table";

import type { Room } from "../../common/client";
import { formatTime, titleCase } from "./helpers";
import { Status } from "../../common/util";

declare module "@tanstack/react-table" {
	interface ColumnMeta<TData extends RowData, TValue> {
		columnName: string
	}
}

const helper = createColumnHelper<Room>();

const columns: ColumnDef<Room, string>[] = [
	helper.accessor(data => (data.status === Status.STARTED ? "started" : (data.password ? "password" : "waiting") as string), {
		id: "status",
		header: "",
		cell: ctx => <div className={`stoplight ${ctx.getValue() === "started" ? "red" : (ctx.getValue() === "password" ? "yellow" : "green")}`}/>,
		sortingFn: ({original: room1}, {original: room2}) => {
			return ((room1.status === Status.STARTED ? 1 : (room1.password ? 0 : -1)) - (room2.status === Status.STARTED ? 1 : (room2.password ? 0 : -1)));
		},
		enableResizing: false,
		size: 16,
		minSize: 16, // minSize normally defaults to 20px
		meta: {columnName: "Status"}
	}),
	helper.accessor("roomName", {
		id: "roomName",
		header: "Room Name",
		enableMultiSort: false,
		meta: {columnName: "Room Name"}
	}),
	helper.accessor(data => data.players.map(player => player.username).join(", "), {
		id: "players",
		header: "Players",
		sortingFn: ({original: room1}, {original: room2}) => room1.players.length - 1 / room1.numPlayers - room2.players.length + 1 / room2.numPlayers,
		size: 200,
		meta: {columnName: "Players"}
	}),
	helper.accessor(
		({timeControls: time}) => {
			if (time.delay && time.increment) return "Complex";
			if ((time.delay || time.increment || time.overtime.length) && (time.byoyomi.periods && time.byoyomi.amountPerPeriod)) return "Complex";
			const hourglass = time.useHourglass ? " ⧗" : "";
			const main = formatTime(time.main);
			const delayOrIncrement = time.delay || time.increment ? ` | ${time.increment ? "+" : ""}${formatTime(time.delay || time.increment)}${time.increment && time.enableIncrementAfterTurn ? "*" : ""}` : "";
			const byoyomi = time.byoyomi.periods && time.byoyomi.amountPerPeriod ? ` | ${time.byoyomi.periods} of ${time.byoyomi.movesBeforeReset ? `${time.byoyomi.movesBeforeReset}${time.byoyomi.progressiveMoveIncrement ? "⁺" : ""} in ` : ""}${formatTime(time.byoyomi.amountPerPeriod)}` : "";
			const overtime = time.overtime.length ? " | OT" : ""
			return `${main}${hourglass}${delayOrIncrement}${byoyomi}${overtime}`;
		}, {
			id: "timeControls",
			header: "Time Controls",
			sortingFn: ({original: {timeControls: time1}}, {original: {timeControls: time2}}) => {
				return time1.main + time1.byoyomi.amountPerPeriod * time1.byoyomi.periods + time1.overtime.reduce((total, ot) => total + ot.amount, 0) - time2.main - time2.byoyomi.amountPerPeriod * time2.byoyomi.periods - time2.overtime.reduce((total, ot) => total + ot.amount, 0);
			},
			// KAMO: use meta to set field to inform column width should minimize itself
			size: 140,
			meta: {columnName: "Time Controls"}
		}
	),
	helper.accessor(data => data.game.plugins.map(plugin => titleCase(plugin)).join(", "), {
		id: "plugins",
		header: "Plugins",
		sortingFn: ({original: room1}, {original: room2}) => room1.game.plugins.length - room2.game.plugins.length,
		size: 300,
		meta: {columnName: "Plugins"}
	})
];

export { columns }