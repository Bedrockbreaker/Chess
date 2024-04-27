import { useEffect, useState } from "react";

const mobileQuery = window.matchMedia("(width <= 768px)");
const tabletQuery = window.matchMedia("(width <= 1024px)");

function useDynamicLayout() {
	const [mobileStage, setMobileStage] = useState<"mobile" | "tablet" | "desktop">(mobileQuery.matches ? "mobile" : (tabletQuery.matches ? "tablet" : "desktop"));

	useEffect(() => {
		const onQueryChange = () => {
			setMobileStage(mobileQuery.matches ? "mobile" : (tabletQuery.matches ? "tablet" : "desktop"))
		}

		mobileQuery.addEventListener("change", onQueryChange);
		tabletQuery.addEventListener("change", onQueryChange);

		return () => {
			mobileQuery.removeEventListener("change", onQueryChange);
			tabletQuery.removeEventListener("change", onQueryChange);
		}
	}, []);

	return mobileStage;
}

export { useDynamicLayout }