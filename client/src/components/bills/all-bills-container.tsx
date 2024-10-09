import { useQuery } from "@tanstack/react-query";
import { Environments } from "@/utils/config/enviroments.config";
import { PYS_AT } from "@/utils/constants";
import { BillsResponse } from "./bills.types";
import BillCard from "./bill-card";

export default function AllBillsContainer(props: { filter: string }) {
  const bills = useQuery<BillsResponse>({
    queryKey: ["bills", props.filter],
    queryFn: async () => {
      try {
        const url =
          props.filter === "all"
            ? `${Environments.API_URL}/user/bills`
            : `${Environments.API_URL}/user/bills?status=${props.filter}`;
        const resp = await fetch(url, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(PYS_AT)}`,
          },
        });

        const data = await resp.json();
        return data;
      } catch (e) {
        if (e instanceof Error) throw new Error(e.message);
      }
    },
  });

  const allBills = bills.data?.data ?? [];

  return (
    <>
      {allBills.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {allBills.map((bill) => (
            <BillCard bill={bill} key={bill.id} />
          ))}
        </div>
      ) : (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">No bills found</p>
        </div>
      )}
    </>
  );
}
