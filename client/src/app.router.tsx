import { createBrowserRouter } from "react-router-dom";
import Root from "./pages/auth/root.tsx"; // Ensure this import is correct
import AuthCallback, {
  loader as AuthCallbackLoader,
} from "./pages/auth/callback.tsx";

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
]);

export default router;
