import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { DndProvider } from "react-dnd";
import { TouchBackend } from "react-dnd-touch-backend";
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type ColumnOrderState, type ColumnSizingState, type SortingState, type VisibilityState } from "@tanstack/react-table";
import { useLoaderData, useNavigate, useParams } from "react-router-dom";
import Select from "react-select";

import { ColumnLabel, ColumnLabelDragLayer } from "./ColumnLabelDnD";
import { useDynamicLayout } from "../util/DynamicLayout";
import { formatTime, getSeconds, titleCase } from "../util/helpers";
import { columns } from "../util/LobbyTableColumns";
import { MultiRange } from "./MultiRange";
import { TriStateCheckbox } from "./TriStateCheckbox";
import { clamp } from "../../common/util";
import type { Room } from "../../common/client";

import arrowUpDownURL from "../assets/svg/arrow_up_down.svg";
import arrowUpURL from "../assets/svg/arrow_up.svg";
import arrowDownURL from "../assets/svg/arrow_down.svg";
import arrowDoubleLeftURL from "../assets/svg/arrow_double_left.svg";
import arrowLeftURL from "../assets/svg/arrow_left.svg";
import arrowRightURL from "../assets/svg/arrow_right.svg";
import arrowDoubleRightURL from "../assets/svg/arrow_double_right.svg";
import checkURL from "../assets/svg/check.svg";
import kebabURL from "../assets/svg/kebab.svg";
import { RoomDetails } from "./RoomDetails";

function JoinArea() {
	const ALL_PLUGINS = useLoaderData() as string[];

	const [rooms, setRooms] = useState<Room[]>([]);
	const [prevSelectedRoom, setPrevSelectedRoom] = useState<Room>();
	const [totalRooms, setTotalRooms] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [isTableSettingsOpen, setIsTableSettingsOpen] = useState(false);
	const [tableSizingState, setTableSizingState] = useState<ColumnSizingState>(JSON.parse(localStorage.getItem("columnSizing") ?? "{}"));
	const [tableSortingState, setTableSortingState] = useState<SortingState>([]);
	const [tableColumnVisibility, setTableColumnVisibility] = useState<VisibilityState>(JSON.parse(localStorage.getItem("columnVisibility") ?? "{}"));
	const [tableColumnOrder, setTableColumnOrder] = useState<ColumnOrderState>(JSON.parse(localStorage.getItem("columnOrder") ?? "false") || columns.map(column => column.id ?? ""));

	const filterForm = useRef<HTMLFormElement>(null);
	const filterRoomsTimeout = useRef<NodeJS.Timeout | null>(null);
	const waitingCheckbox = useRef<HTMLInputElement>(null);
	const tableRef = useRef<HTMLTableElement>(null);
	const tableSettingsMenu = useRef<HTMLDivElement>(null);
	const lastTap = useRef(0);
	const sortingHandler = useRef<() => void>();
	const pageInput = useRef<HTMLInputElement>(null);
	const pageInputFake = useRef<HTMLInputElement>(null);
	const numPerPageInput = useRef<HTMLInputElement>(null);
	const sortByInput = useRef<HTMLInputElement>(null);
	const sortDirInput = useRef<HTMLInputElement>(null);

	const selectedRoom = useParams().roomId || "";
	const mobileStage = useDynamicLayout();
	const navigate = useNavigate();

	// Disable linter from complaining about the ref value being used in the dependancy array
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const totalPages = useMemo(() => Math.ceil(totalRooms / (Number(numPerPageInput.current?.value) || 100)), [totalRooms, numPerPageInput.current?.value]);

	// KAMO: column pinning for horizontal scroll?
	const table = useReactTable({
		columns: columns,
		data: rooms ?? [],
		initialState: {
			columnSizing: tableSizingState
		},
		state: {
			sorting: tableSortingState,
			columnVisibility: tableColumnVisibility,
			columnOrder: tableColumnOrder
		},
		enableMultiSort: true,
		enableColumnResizing: true,
		columnResizeMode: "onChange",
		onSortingChange: setTableSortingState,
		onColumnVisibilityChange: setTableColumnVisibility,
		onColumnOrderChange: setTableColumnOrder,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});
	const tableState = table.getState();

	const getRooms = useCallback((skipDelay: boolean = false) => {
		if (filterRoomsTimeout.current) clearTimeout(filterRoomsTimeout.current);
		if (!filterForm.current) return;
		setIsLoading(true);
		const data = new FormData(filterForm.current);
		filterRoomsTimeout.current = setTimeout(() => {
			fetch(`http://${location.hostname}:7890/api/rooms?${new URLSearchParams(data as any)}`) // stupid "as any" cast
				.then(response => response.json())
				.then((data: {rooms: Room[], total: number}) => {
					setRooms(data.rooms);
					setTotalRooms(data.total);
					sortingHandler.current?.call(undefined);
					sortingHandler.current = undefined;
					setIsLoading(false);
				})
				.catch(console.error);
		}, skipDelay ? 0 : 750);
	}, []);

	const changePage = useCallback((page: number, isRelative: boolean) => {
		if (!pageInput.current || !pageInputFake.current) return;
		const newPage = clamp(isRelative ? Number(pageInput.current.value) + page : page, 0, totalPages-1);
		pageInput.current.value = `${newPage}`;
		pageInputFake.current.value = `${newPage+1}`;
		getRooms(true);
	}, [getRooms, totalPages]);

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => getRooms(true), []); // Run once on page load

	useEffect(() => {
		setTableSizingState(table.getState().columnSizing);
		localStorage.setItem("columnSizing", JSON.stringify(table.getState().columnSizing));
		if (!tableRef.current) return;
		const headers = table.getFlatHeaders();
		for (let i = 0; i < headers.length; i++) {
			const header = headers[i];
			tableRef.current.style.setProperty(`--th-${header.id}-size`, `${header.getSize()}px`);
			tableRef.current.style.setProperty(`--col-${header.column.id}-size`, `${header.column.getSize()}px`);
		}
	}, [table, tableState.columnSizing, setTableSizingState, tableState.columnVisibility]);

	useEffect(() => {
		const cancelScroll = (event: TouchEvent) => {
			if (event.touches.length > 1) event.preventDefault();
		}
		const dismissTableSettings = (event: MouseEvent | TouchEvent) => {
			if (!tableSettingsMenu.current?.contains(event.target as Element)) setIsTableSettingsOpen(false);
		}

		const currentTableRef = tableRef.current;
		currentTableRef?.addEventListener("touchmove", cancelScroll, {passive: false});
		window.addEventListener("mouseup", dismissTableSettings);
		window.addEventListener("touchend", dismissTableSettings);

		return () => {
			currentTableRef?.removeEventListener("touchmove", cancelScroll);
			window.removeEventListener("mouseup", dismissTableSettings);
			window.removeEventListener("touchend", dismissTableSettings);
		}
	}, []);

	useEffect(() => {
		document.title = `Yggdrasil - ${selectedRoom ? rooms.find(room => room.id === selectedRoom)?.roomName : "Lobby"} 🐲`;
	}, [rooms, selectedRoom]);

	useEffect(() => {
		const room = selectedRoom ? rooms.find(room => room.id === selectedRoom) : prevSelectedRoom;
		setPrevSelectedRoom(room);
		if (selectedRoom) fetch(`http://${location.hostname}:7890/api/room?roomId=${room?.id || selectedRoom}`).then(response => response.json()).then(setPrevSelectedRoom);
	// Disable linter complaint which would cause an infinite loop
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedRoom, setPrevSelectedRoom, rooms]);

	useLayoutEffect(() => {
		const onResize = () => {
			if (!tableRef.current || !numPerPageInput.current) return;
			numPerPageInput.current.value = `${Math.floor((tableRef.current.getBoundingClientRect().height - 19) / 24)}`;
			getRooms();
		}
		onResize();
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, [getRooms]);

	// HACK: setTimeout(getRooms) is used becuase onChange fires before the (correct) input's value actually changes
	return <>
		<div className={`joinArea ${selectedRoom ? "hidden" : ""}`}>
			<div className="filterBar">
				<form ref={filterForm} onChange={() => getRooms()}>
					<div className="inputWithCheckbox">
						<input
							type="text"
							name="roomSearch"
							className="roomSearch"
							autoComplete="off"
							spellCheck={false}
							placeholder="Search..."
							maxLength={100}
						/>
						<div className="controlContainer">
							<input
								ref={waitingCheckbox}
								id="isWaiting"
								type="checkbox"
								name="isWaiting"
								onChange={() => setTimeout(getRooms)}
							/>
							<label htmlFor="isWaiting">Waiting For Players</label>
						</div>
						{waitingCheckbox.current?.checked ? <div className="controlContainer">
							<input id="noPassword" type="checkbox" name="noPassword"/>
							<label htmlFor="noPassword">No Password</label>
						</div> : undefined}
					</div>
					<div className="inputWithCheckbox">
						<Select
							isMulti
							name="pluginFilter"
							closeMenuOnSelect={false}
							options={ALL_PLUGINS.map(plugin => ({label: titleCase(plugin), value: plugin}))}
							placeholder="Filter Plugins..."
							className="pluginFilter"
							classNamePrefix="pluginFilter"
							onChange={() => {setTimeout(getRooms)}}
						/>
						<div className="controlContainer">
							<input id="pluginBlacklist" type="checkbox" name="pluginBlacklist"/>
							<label htmlFor="pluginBlacklist">Blacklist</label>
						</div>
					</div>
					<div className="controlContainer">
						<label>Main Time</label> {/* FIXME: "No label associated with a form field" */}
						<MultiRange
							name="mainTime"
							min={0}
							max={25}
							notchToValue={notch => {
								if (notch === 25) return Infinity;
								let time = clamp(notch, 0, 6) * 30;
								time += clamp(notch - 6, 0, 7) * 60;
								time += clamp(notch - 13, 0, 5) * 600;
								time += clamp(notch - 18, 0, 6) * 3600;
								return Math.round(time); // Fixes floating point imprecision
							}}
							valueToLabel={value => value === Infinity ? "7:00:01+" : formatTime(value)}
							labelToValue={input => {
								if (input.endsWith("+")) return Infinity;
								const seconds = getSeconds(input);
								return seconds > 25200 ? Infinity : seconds;
							}}
							valueToNotch={value => {
								if (value > 25200) return 25;
								let notch = clamp(value, 0, 180) / 30;
								notch += clamp(value - Math.min(notch, 180), 0, 420) / 60;
								notch += clamp(value - clamp(notch - 6, 0, 7) * 60 - Math.min(notch, 6) * 30, 0, 3000) / 600;
								notch += clamp(value - clamp(notch - 13, 0, 5) * 600 - clamp(notch - 6, 0, 7) * 60 - Math.min(notch, 6) * 30, 0, 21600) / 3600;
								return notch;
							}}
							onChange={() => setTimeout(getRooms)}
						/>
					</div>
					<TriStateCheckbox name="delay" label="Delay" onChange={() => setTimeout(getRooms)}/>
					<TriStateCheckbox name="increment" label="Increment" onChange={() => setTimeout(getRooms)}/>
					{/* TODO: add dropdown for extended settings, including subsettings */}
					<TriStateCheckbox name="useHourglass" label="Hourglass" onChange={() => setTimeout(getRooms)}/>
					<TriStateCheckbox name="byoyomi" label="Byoyomi" onChange={() => setTimeout(getRooms)}/>
					<TriStateCheckbox name="overtime" label="Overtime" onChange={() => setTimeout(getRooms)}/>
					<input ref={pageInput} type="hidden" name="page"/>
					<input ref={numPerPageInput} type="hidden" name="numPerPage"/>
					<input ref={sortByInput} type="hidden" name="sortBy"/>
					<input ref={sortDirInput} type="hidden" name="sortDir"/>
				</form>
				<div ref={tableSettingsMenu} className="settingsMenu">
					<button className="settings" onClick={() => setIsTableSettingsOpen(!isTableSettingsOpen)}><img src={isTableSettingsOpen ? checkURL : kebabURL}/></button>
					<DndProvider backend={TouchBackend} options={{enableMouseEvents: true}}>
					{isTableSettingsOpen ? <div className="settingsDropdown">{table.getAllLeafColumns().map((column, i) => <div key={`${column.id}-div`}>
						<ColumnLabel column={column} table={table} index={i} moveColumn={(column, toIndex) => {
							const newOrder = [...tableColumnOrder];
							newOrder.splice(toIndex, 0, newOrder.splice(newOrder.indexOf(column.id), 1)[0]);
							localStorage.setItem("columnOrder", JSON.stringify(newOrder));
							table.setColumnOrder(newOrder);
						}}/>
					</div>)}</div> : undefined}
					<ColumnLabelDragLayer/>
					</DndProvider>
				</div>
			</div>
			<div className="tableContainer">
				<div ref={tableRef} id="table">
					<div className="thead">
						{table.getHeaderGroups().map(headerGroup => <div key={headerGroup.id} className="tr">
							{headerGroup.headers.map(header => <div
								key={header.id}
								className={`th ${header.column.getCanSort() ? "sortable" : ""}`}
								style={{width: `var(--th-${header.id}-size)`}}
							>
								{header.column.getCanSort() ? <button
									type="button"
									onClick={event => {
										if (sortByInput.current) sortByInput.current.value = header.id;
										if (sortDirInput.current) sortDirInput.current.value = header.column.getNextSortingOrder() || "";
										sortingHandler.current = header.column.getToggleSortingHandler()?.bind(undefined, event);
										// TODO: Multi-sorting (modify how server interprets sorting params, and also fix bug when 1. sort non-multi col, 2. sort multi col)
										// see table.resetSorting() for bug?
										// sortingHandler.current = header.column.toggleSorting.bind(undefined, undefined, header.column.getCanMultiSort());
										getRooms(true);
									}}
								>
									{header.isPlaceholder ? undefined : <>
										{flexRender(header.column.columnDef.header, header.getContext())}
										<img className="sortingIcon" src={header.column.getIsSorted() ? (header.column.getIsSorted() === "asc" ? arrowDownURL : arrowUpURL) : arrowUpDownURL}/>
									</>}
								</button> : flexRender(header.column.columnDef.header, header.getContext())}
								{header.column.getCanResize() ? <div
									className="resizeHandle"
									onMouseDown={header.getResizeHandler()}
									onTouchStart={event => {
										console.log("tapped");
										const now = Date.now();
										if (now - lastTap.current < 300) return header.column.resetSize();
										header.getResizeHandler().call(undefined, event);
										lastTap.current = now;
									}}
									onDoubleClick={() => header.column.resetSize()}
								><button type="button"/></div> : undefined}
							</div>)}
						</div>)}
					</div>
					<div className={`tbody ${isLoading ? "loading" : ""}`}>
						{table.getRowModel().rows.map(row => <div
							key={row.id}
							className="tr"
							onClick={() => navigate(`/lobby/room/${row.original.id}`)}
						>
							{row.getVisibleCells().map(cell => <div
								key={cell.id} className="td" style={{width: `var(--col-${cell.column.id}-size)`}}>
								{flexRender(cell.column.columnDef.cell, cell.getContext())}
							</div>)}
						</div>)}
					</div>
				</div>
			</div>
			<div className="tfoot">
				<div className="total">{totalRooms} Rooms</div>
				<div className="pagination">
					<button type="button" onClick={() => changePage(0, false)}><img src={arrowDoubleLeftURL}/></button>
					<button type="button" onClick={() => changePage(-1, true)}><img src={arrowLeftURL}/></button>
					<button type="button" onClick={() => changePage(1, true)}><img src={arrowRightURL}/></button>
					<button type="button" onClick={() => changePage(totalPages-1, false)}><img src={arrowDoubleRightURL}/></button>
					<label htmlFor="pageInputFake">Page</label>
					<input
						ref={pageInputFake}
						id="pageInputFake"
						type="number"
						className="pageInput"
						defaultValue={1}
						min={1}
						max={totalPages}
						onChange={event => {
							if (!pageInput.current || event.target.value === "") return;
							pageInput.current.value = isNaN(Number(event.target.value)) ? "0" : `${clamp(Math.round(Number(event.target.value)), 1, totalPages)-1}`;
							getRooms();
						}}
					/> of {totalPages}
				</div>
			</div>
		</div>
		<div className={`roomDetailsContainer ${selectedRoom ? "" : "hidden"}`}>{prevSelectedRoom ? <RoomDetails room={prevSelectedRoom}/> : undefined}</div>
	</>
}

export { JoinArea }