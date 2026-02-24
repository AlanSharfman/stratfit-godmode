import type { ReactNode } from "react";
import MainNav from "@/app/navigation/MainNav";
import { SystemBaselineProvider } from "@/system/SystemBaselineProvider";

export default function AppShell({ children }: { children: ReactNode }) {
    return (
        <SystemBaselineProvider>
            <div className="app">
                <MainNav />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                    {children}
                </div>
            </div>
        </SystemBaselineProvider>
    );
}
