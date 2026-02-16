// src/app/layout/AppShell.tsx
// STRATFIT — App Shell with Terrain Root
// Phase 11 Voice API Lock

import TerrainRoot from "@/terrain/TerrainRoot";
import MainNav from "@/app/navigation/MainNav";
import AppRouter from "@/app/router/AppRouter";
import CinematicToggle from "@/components/cinematic/CinematicToggle";
import GodModePanel from "@/components/godmode/GodModePanel";
import VoiceUnlock from "@/components/cinematic/VoiceUnlock";

export default function AppShell() {
    return (
        <div className="appShell">
            <TerrainRoot />
            <MainNav />
            <CinematicToggle />
            <VoiceUnlock />
            <GodModePanel />
            <AppRouter />
        </div>
    );
}
