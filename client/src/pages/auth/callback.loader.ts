import { Environments } from "@/utils/config/enviroments.config";
import { LoaderFunctionArgs, redirect } from "react-router-dom";

export const AuthCallbackLoader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code") ?? "";

  if (!code) {
    return redirect("/");
  }

  try {
    const response = await fetch(
      `${Environments.API_URL}/auth/google/callback?code=${code}`,
    );
    const data = await response.json();

    if (data.user || data.access_token) {
      return { error: false, user: data.user, access_token: data.access_token };
    }

    return { error: true };
  } catch (e) {
    console.error(e);
    return { error: true };
  }
};
