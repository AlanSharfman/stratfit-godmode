import React from "react";

export type CenterView = "terrain" | "variance" | "actuals";

interface CenterViewTabsProps {
	value: CenterView;
	onChange: (view: CenterView) => void;
}

const tabs: { key: CenterView; label: string }[] = [
	{ key: "terrain", label: "Terrain" },
	{ key: "variance", label: "Variance" },
	{ key: "actuals", label: "Actuals" },
];

export default function CenterViewTabs({ value, onChange }: CenterViewTabsProps) {
	return (
		<div className="flex gap-2">
			{tabs.map(tab => (
				<button
					key={tab.key}
					className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors duration-150 focus:outline-none ${
						value === tab.key
							? "bg-white/10 text-white border border-white/20"
							: "bg-transparent text-white/40 border border-transparent hover:bg-white/5"
					}`}
					onClick={() => onChange(tab.key)}
				>
					{tab.label}
				</button>
			))}
		</div>
	);
}
