import { createBrowserRouter } from "react-router";
import { AuthPage } from "./pages/auth-page";
import { DashboardPage } from "./pages/dashboard-page";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AuthPage,
  },
  {
    path: "/dashboard",
    Component: DashboardPage,
  },
]);
