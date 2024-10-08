import { Environments } from "@/utils/config/enviroments.config";
import { QueryClient } from "@tanstack/react-query";
import { LoaderFunctionArgs } from "react-router-dom";

async function getBillDetails(billId?: string) {
  try {
    const response = await fetch(`${Environments.API_URL}/bill/${billId}`, {
      credentials: "include",
    });
    const data = await response.json();

    return { error: false, data };
  } catch (e) {
    console.error(e);
    return { error: true };
  }
}

export const billDetailsQuery = (id?: string) => ({
  queryKey: ["bill-detail", id?.toString()],
  queryFn: async () => getBillDetails(id),
});

export const BillDetailsLoader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    const billId = params.billId;

    if (!billId) return { error: true };

    const query = billDetailsQuery(billId);
    return (
      queryClient.getQueryData(query.queryKey) ??
      (await queryClient.fetchQuery(query))
    );
  };
