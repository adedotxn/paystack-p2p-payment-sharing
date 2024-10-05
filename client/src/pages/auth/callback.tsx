import { useEffect } from "react";
import {
  LoaderFunctionArgs,
  redirect,
  useLoaderData,
  useNavigate,
} from "react-router-dom";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code") ?? "";

  if (!code) {
    return redirect("/");
  }

  try {
    const response = await fetch(
      `http://localhost:5000/auth/google/callback?code=${code}`,
    );
    const data = await response.json();

    if (data.user || data.user.id) {
      return { error: false, user: data.user };
    }

    return { error: true };
  } catch (e) {
    console.error(e);
    return { error: true };
  }
};

export default function AuthCallback() {
  const data = useLoaderData() as {
    error: boolean;
    user?: { name: string; email: string };
  };

  const navigate = useNavigate();

  useEffect(() => {
    if (!data.error && data.user?.name) {
      navigate("/bills");
    }
  }, [data.error]);

  if (data.error) {
    return <div>Error authenticating user</div>;
  }

  if (!data.error && data.user?.name) {
    return (
      <div>
        <h1>Welcome {data.user.name}</h1>
        <p>Logging you in</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Authenticating...</h1>
    </div>
  );
}
