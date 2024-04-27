import { useEffect, useRef, useState } from "react"

import "../assets/styles/MultiRange.css";
import { clamp } from "../../common/util";

function MultiRange({name, min, max, step = 1, notchToValue = value => value, valueToLabel = value => `${value}`, labelToValue = input => Number(input), valueToNotch = value => value, onChange}: {
	name: string,
	min: number,
	max: number,
	step?: number,
	notchToValue?: (notch: number) => number,
	valueToLabel?: (value: number) => string,
	labelToValue?: (input: string) => number,
	valueToNotch?: (value: number) => number,
	onChange?: (left: number, right: number, min: number, max: number, changed: "left" | "right") => void
}) {
	const [left, setLeft] = useState(min);
	const [right, setRight] = useState(max);

	const leftRange = useRef<HTMLInputElement>(null);
	const rightRange = useRef<HTMLInputElement>(null);
	const betweenDiv = useRef<HTMLDivElement>(null);
	const leftInput = useRef<HTMLInputElement>(null);
	const rightInput = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!betweenDiv.current || !rightRange.current) return;
		const leftPercent = (Math.round(left)-min)/(max-min)*100;
		betweenDiv.current.style.left = `${Math.round(leftPercent)}%`;
		betweenDiv.current.style.width = `${Math.round((Number(rightRange.current.value)-min)/(max-min)*100 - leftPercent)}%`;
	}, [left, min, max]);

	useEffect(() => {
		if (!betweenDiv.current || !leftRange.current) return;
		betweenDiv.current.style.width = `${Math.round((Math.round(right)-min)/(max-min)*100 - (Number(leftRange.current.value)-min)/(max-min)*100)}%`;
	}, [right, min, max]);

	return <div id={`${name}RangeContainer`} className={`rangeContainer`}>
		<input type="hidden" name={`${name}Left`} value={notchToValue(left)}/>
		<input type="hidden" name={`${name}Right`} value={notchToValue(right)}/>
		<div className={`rangeDisplay ${name}RangeDisplay`}>
			<div className="track"/>
			<div ref={betweenDiv} className={`betweenDiv ${name}BetweenDiv`}/>
			<input
				ref={leftRange}
				type="range"
				min={min}
				max={max}
				step={step}
				value={left}
				className={`${name}Left ${left >= max * .9 ? "top" : ""}`}
				onChange={event => {
					event.stopPropagation();
					const newLeft = clamp(Number(event.target.value), min, right);
					event.target.value = `${newLeft}`;
					if (leftInput.current) leftInput.current.value = valueToLabel(notchToValue(newLeft));
					setLeft(newLeft);
					if (onChange) onChange(newLeft, right, min, max, "left");
				}}
			/>
			<input
				ref={rightRange}
				type="range"
				min={min}
				max={max}
				step={step}
				value={right}
				className={`${name}Right`}
				onChange={event => {
					event.stopPropagation();
					const newRight = clamp(Number(event.target.value), left, max);
					event.target.value = `${newRight}`;
					if (rightInput.current) rightInput.current.value = valueToLabel(notchToValue(newRight));
					setRight(newRight);
					if (onChange) onChange(left, newRight, min, max, "right");
				}}
			/>
		</div>
		<div className="valueDisplay">
			<input
				ref={leftInput}
				id={`${name}TextLeft`}
				type="text"
				className="leftDisplay"
				defaultValue={valueToLabel(notchToValue(left))}
				onChange={event => event.stopPropagation()}
				onBlur={event => {
					const newLeft = clamp(valueToNotch(labelToValue(event.target.value)), min, right);
					event.target.value = valueToLabel(notchToValue(newLeft));
					if (leftRange.current) leftRange.current.value = `${newLeft}`;
					setLeft(newLeft);
					if (onChange) onChange(newLeft, right, min, max, "left");
				}}
			/>
			<input
				ref={rightInput}
				id={`${name}TextRight`}
				type="text"
				className="rightDisplay"
				defaultValue={valueToLabel(notchToValue(right))}
				onChange={event => event.stopPropagation()}
				onBlur={event => {
					const newRight = clamp(valueToNotch(labelToValue(event.target.value)), left, max);
					event.target.value = valueToLabel(notchToValue(newRight));
					if (rightRange.current) rightRange.current.value = `${newRight}`;
					setRight(newRight);
					if (onChange) onChange(left, newRight, min, max, "right");
				}}
			/>
		</div>
	</div>
}

export { MultiRange }