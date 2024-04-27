import { useState } from "react"

function TabbedArea({tabs, defaultTab = 0}: {tabs: {label: string, children?: JSX.Element[] | JSX.Element}[], defaultTab?: number}) {
	const [activeTab, setActiveTab] = useState(defaultTab);

	return <div className="tabbedArea">
		<div className="tabs">
			{tabs.map((tab, i) => <button key={i} className={activeTab === i ? "active" : ""} type="button" onClick={() => setActiveTab(i)}>{tab.label}</button>)}
		</div>
		<div className="tabContent">
			{tabs[activeTab].children}
		</div>
	</div>
}

export { TabbedArea }