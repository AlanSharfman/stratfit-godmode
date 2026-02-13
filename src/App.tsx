import { Outlet } from "react-router-dom";
import { MainNav } from "@/components/navigation";

export default function App() {
  return (
    <div className="app">
      <MainNav />
      <Outlet />
    </div>
  );
}
