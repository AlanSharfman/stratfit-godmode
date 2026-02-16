import type { ReactNode } from "react";
import MainNav from "@/app/navigation/MainNav";
import { SystemBaselineProvider } from "@/system/SystemBaselineProvider";

export default function AppShell({ children }: { children: ReactNode }) {
    return (
        <SystemBaselineProvider>
            <div style={{ minHeight: "100vh" }}>
                <MainNav />
                {children}
            </div>
        </SystemBaselineProvider>
    );
}
