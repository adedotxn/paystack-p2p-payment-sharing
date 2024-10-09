import { Environments } from "@/utils/config/enviroments.config";
import { QueryClient } from "@tanstack/react-query";
import { LoaderFunctionArgs } from "react-router-dom";

async function getBillDetails(access_token: string | null, billId?: string) {
  try {
    const response = await fetch(`${Environments.API_URL}/bill/${billId}`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    const data = await response.json();

    return { error: false, data };
  } catch (e) {
    console.error(e);
    return { error: true };
  }
}

export const billDetailsQuery = (access_token: string | null, id?: string) => ({
  queryKey: ["bill-detail", id?.toString()],
  queryFn: async () => getBillDetails(access_token, id),
});

export const BillDetailsLoader =
  (queryClient: QueryClient, access_token: string | null) =>
  async ({ params }: LoaderFunctionArgs) => {
    const billId = params.billId;

    if (!billId) return { error: true };

    const query = billDetailsQuery(access_token, billId);
    return (
      queryClient.getQueryData(query.queryKey) ??
      (await queryClient.fetchQuery(query))
    );
  };
