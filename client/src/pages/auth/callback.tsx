import { useEffect } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";

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
