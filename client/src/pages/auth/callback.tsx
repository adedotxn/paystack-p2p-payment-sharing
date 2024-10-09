import { useLoaderData, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { PYS_AT } from "@/utils/constants";

export default function AuthCallback() {
  const { access_token, user } = useLoaderData() as {
    access_token: string;
    user: { name: string; email: string };
  };

  const navigate = useNavigate();
  useEffect(() => {
    if (access_token) {
      localStorage.setItem(PYS_AT, access_token);
      navigate("/dashboard");
    }
  }, [access_token]);

  return (
    <div>
      {user ? <h1>Welcome, {user.name}</h1> : <h1>Authentication failed</h1>}
    </div>
  );
}
