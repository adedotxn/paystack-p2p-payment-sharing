import { createBrowserRouter } from "react-router-dom";
import Root from "./pages/auth/root.tsx"; // Ensure this import is correct
import AuthCallback from "./pages/auth/callback.tsx";
import Dashboard from "./pages/bill/root.tsx";
import { AuthCallbackLoader } from "./pages/auth/callback.loader.ts";

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
    path: "/bills",
    element: <Dashboard />,
  },
]);

export default router;
