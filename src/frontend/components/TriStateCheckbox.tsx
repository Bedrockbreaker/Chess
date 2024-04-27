import { useEffect, useState, useRef } from "react"

function TriStateCheckbox({name, defaultState = false, label, onChange}: {name: string, defaultState?: boolean, label?: string, onChange?: () => void}) {
	const [state, setState] = useState<boolean | "">(defaultState);

	const fakeCheckbox = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!fakeCheckbox.current) return;
		fakeCheckbox.current.indeterminate = state === "";
	}, [state]);

	return <div className="controlContainer">
		<input
			ref={fakeCheckbox}
			id={`${name}Fake`}
			className={name}
			type="checkbox"
			checked={state === true}
			onChange={event => {
				setState(state ? "" : state !== "");
				event.stopPropagation();
				if (onChange) onChange();
			}}
		/>
		{label ? <label htmlFor={`${name}Fake`} className={name}>{label}</label> : <></>}
		<input type="hidden" name={name} value={`${state === false ? "" : state || false}`}/>
	</div>
}

export { TriStateCheckbox }