import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AppRouter from "./AppRouter";
import { validateRoutingContract } from "@/system/validateRoutingContract";
import { assertUiNavContract } from "@/navigation/assertUiNavContract";
import { bootstrapEngines } from "@/core/bootstrap/runEngines";
import "./styles/theme.css";

validateRoutingContract();
assertUiNavContract();
bootstrapEngines();

ReactDOM.createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
        <AppRouter />
    </BrowserRouter>
);
