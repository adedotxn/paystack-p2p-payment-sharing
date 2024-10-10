import { createBrowserRouter } from "react-router-dom";
import Root from "./pages/auth/root.tsx"; // Ensure this import is correct
import AuthCallback from "./pages/auth/callback.tsx";
import { AuthCallbackLoader } from "./pages/auth/callback.loader.ts";
import Dashboard from "./pages/dashboard/root.tsx";
import BillsPage from "./pages/bill/root.tsx";
import BillDetailPage from "./pages/bill/details.tsx";
import { BillDetailsLoader } from "./pages/bill/details.loader.ts";
import { QueryClient } from "@tanstack/react-query";
import { PYS_AT } from "./utils/constants.ts";
import CreateBillPage from "./pages/create-bill.tsx";
import SettleBillPage from "./pages/bill/settle-bill.tsx";
import InviteToBillPage from "./pages/bill/invite.tsx";

const queryClient = new QueryClient();
const access_token = localStorage.getItem(PYS_AT);

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
    loader: BillDetailsLoader(queryClient, access_token),
    element: <BillDetailPage />,
  },
  {
    path: "/bills/:billId/invite",
    loader: BillDetailsLoader(queryClient, access_token),
    element: <InviteToBillPage />,
  },
  {
    path: "/bills/:billId/settle",
    element: <SettleBillPage />,
  },
  {
    path: "/create-bill",
    element: <CreateBillPage />,
  },
]);

export default router;
