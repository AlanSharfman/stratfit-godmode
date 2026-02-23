import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AppRouter from "./AppRouter";
import { validateRoutingContract } from "@/navigation/routingContract";
import { bootstrapEngines } from "@/core/bootstrap/runEngines";
import "./styles/theme.css";

validateRoutingContract();
bootstrapEngines();

ReactDOM.createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
        <AppRouter />
    </BrowserRouter>
);
