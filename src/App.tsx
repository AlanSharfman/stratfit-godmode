import { Outlet } from "react-router-dom";
import MainNav from "@/app/navigation/MainNav";

export default function App() {
  return (
    <div className="app">
      <MainNav />
      <Outlet />
    </div>
  );
}
