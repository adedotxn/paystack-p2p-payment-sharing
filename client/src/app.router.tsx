import { createBrowserRouter } from "react-router-dom";
import Root from "./pages/auth/root.tsx"; // Ensure this import is correct
import AuthCallback from "./pages/auth/callback.tsx";
import { AuthCallbackLoader } from "./pages/auth/callback.loader.ts";
import Dashboard from "./pages/dashboard/root.tsx";
import BillsPage from "./pages/bill/root.tsx";
import BillDetailPage from "./pages/bill/details.tsx";
import { BillDetailsLoader } from "./pages/bill/details.loader.ts";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
  },
  {
    path: "/auth/callback",
    loader: AuthCallbackLoader,
    element: <AuthCallback />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/bills",
    element: <BillsPage />,
  },
  {
    path: "/bills/:billId",
    loader: BillDetailsLoader,
    element: <BillDetailPage />,
  },
]);

export default router;
