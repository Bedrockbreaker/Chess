import { useRef } from "react";
import { useDrag, useDragLayer, useDrop, type XYCoord } from "react-dnd";
import type { Column, Table } from "@tanstack/react-table";

import type { Room } from "../../common/client";

import hamburgerURL from "../assets/svg/hamburger.svg";

interface ColumnDnDItem {
	column: Column<Room, unknown>,
	table: Table<Room>,
	index: number,
	moveColumn: (column: Column<Room, unknown>, toIndex: number) => void,
	width: number
}

function ColumnLabel({column, table, index, moveColumn, isFake = false}: {column: Column<Room, unknown>, table: Table<Room>, index: number, moveColumn: (column: Column<Room, unknown>, toIndex: number) => void, isFake?: boolean}) {
	const thisLabel = useRef<HTMLDivElement>(null);
	const prevIndex = useRef(index);
	
	const [{isDragging}, dragHandle] = useDrag<ColumnDnDItem, void, {isDragging: boolean}>(() => ({
		type: "ColumnLabel",
		item: () => ({id: column.id, column, table, index, moveColumn, width: thisLabel.current?.getBoundingClientRect().width || 0}),
		collect: monitor => ({
			isDragging: monitor.isDragging()
		}),
		end: (item, monitor) => {
			moveColumn(item.column, monitor.didDrop() ? index : prevIndex.current);
			if (monitor.didDrop()) prevIndex.current = index;
		}
	}), [column, index, moveColumn]);

	const [{canDrop}, dropTarget] = useDrop<ColumnDnDItem, void, {canDrop: boolean}>(() => ({
		accept: "ColumnLabel",
		hover: (item, monitor) => {
			if (!thisLabel.current) return;

			const bb = thisLabel.current.getBoundingClientRect();
			const centerY = (bb.bottom - bb.top)/2;
			const mouseRelY = (monitor.getClientOffset()?.y || 0) - bb.top;
			if ((item.index < index && mouseRelY < centerY) || (item.index > index && mouseRelY > centerY)) return;

			moveColumn(item.column, index);
		},
		collect: monitor => ({canDrop: monitor.canDrop()})
	}), [index, moveColumn]);

	if (!isFake) dragHandle(dropTarget(thisLabel));
	return <div ref={thisLabel} className={`controlContainer columnLabel ${isDragging ? "held" : ""} ${canDrop ? "target" : ""}`}>
		<input type="checkbox" id={`${column.id}-checkbox${isFake ? "fake" : ""}`} checked={column.getIsVisible()} onChange={event => {
			column.getToggleVisibilityHandler()(event);
			setTimeout(() => localStorage.setItem("columnVisibility", JSON.stringify(table.getState().columnVisibility)));
		}}/>
		<label htmlFor={`${column.id}-checkbox`}>{column.columnDef.meta?.columnName}</label>
		<div className="vertical"/>
		<img src={hamburgerURL} className="dndHandle" draggable={false}/>
	</div>
}

function ColumnLabelDragLayer() {
	const {item, itemType, currentOffset, isDragging} = useDragLayer<{item: ColumnDnDItem, itemType: string | symbol | null, currentOffset: XYCoord | null, isDragging: boolean}>(monitor => ({
		item: monitor.getItem(),
		itemType: monitor.getItemType(),
		currentOffset: monitor.getSourceClientOffset(),
		isDragging: monitor.isDragging()
	}));

	if (!isDragging || itemType !== "ColumnLabel" || !currentOffset) return null;

	return <div className="columnLabelDragLayer"><div style={{width: item.width, transform: `translate(${currentOffset.x}px, ${currentOffset.y}px)`}}><ColumnLabel column={item.column} table={item.table} index={item.index} moveColumn={item.moveColumn} isFake/></div></div>;
}

export { ColumnLabel, ColumnLabelDragLayer }