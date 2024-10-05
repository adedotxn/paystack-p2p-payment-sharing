import { useEffect } from "react";
import { LoaderFunctionArgs, useLoaderData } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code") ?? "";
  return { code };
};

export default function AuthCallback() {
  const { code } = useLoaderData() as { code: string };
  console.log("code", code);
  const navigate = useNavigate();

  useEffect(() => {
    async function CallbackHandler() {
      if (!code) return;

      try {
        const response = await fetch(
          `http://localhost:5000/auth/google/callback?code=${code}`,
        );
        const sth = (await response.json()) as {
          user: { id: string; name: string };
        };
        console.log("yayyy", sth);
        if (sth.user.id) {
          navigate("/");
        }
      } catch (e) {
        console.error(e);
      }
    }

    CallbackHandler();
  }, [code, navigate]);

  return (
    <div>
      <h1>AuthCallback</h1>
    </div>
  );
}
