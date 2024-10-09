import { useQuery } from "@tanstack/react-query";
import { Environments } from "@/utils/config/enviroments.config";
import { MatchCurrency, PYS_AT } from "@/utils/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "lucide-react";
import type { BillsOverview } from "./dashboard.types";

export default function BalanceSummaryCard() {
  const overview = useQuery<BillsOverview>({
    queryKey: ["overview"],
    queryFn: async () => {
      try {
        const resp = await fetch(`${Environments.API_URL}/user/overview`, {
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

  const billsOverview = overview.data?.data;

  return (
    <>
      {billsOverview && (
        <Card>
          <CardHeader>
            <CardTitle>Balance Summary</CardTitle>
            <CardDescription>Overview of your financial status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground">
                  Total Paid
                </span>
                <div className="mt-1 flex items-baseline">
                  <span className="text-2xl font-semibold text-green-600">
                    {MatchCurrency["NGN"]}
                    {billsOverview.totalPaid.toLocaleString()}
                  </span>
                  <ArrowUpIcon className="ml-1 h-4 w-4 text-green-600" />
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground">
                  Total Assigned
                </span>
                <div className="mt-1 flex items-baseline">
                  <span className="text-2xl font-semibold text-blue-600">
                    {MatchCurrency["NGN"]}
                    {billsOverview.totalAssigned.toLocaleString()}
                  </span>
                  <MinusIcon className="ml-1 h-4 w-4 text-blue-600" />
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground">
                  Total Unpaid
                </span>
                <div className="mt-1 flex items-baseline">
                  <span className="text-2xl font-semibold text-red-600">
                    {/* ${totalUnpaid.toFixed(2)} */}
                    {MatchCurrency["NGN"]}
                    {billsOverview.totalUnpaid.toLocaleString()}
                  </span>
                  <ArrowDownIcon className="ml-1 h-4 w-4 text-red-600" />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <span className="text-sm font-medium text-muted-foreground">
                Net Balance
              </span>
              <div className="mt-1 flex items-baseline">
                <span
                  className={`text-3xl font-bold ${billsOverview.totalPaid - billsOverview.totalAssigned >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {MatchCurrency["NGN"]}
                  {(
                    billsOverview.totalPaid - billsOverview.totalAssigned
                  ).toLocaleString()}
                </span>
                {billsOverview.totalPaid - billsOverview.totalAssigned >= 0 ? (
                  <ArrowUpIcon className="ml-1 h-5 w-5 text-green-600" />
                ) : (
                  <ArrowDownIcon className="ml-1 h-5 w-5 text-red-600" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {billsOverview.totalPaid - billsOverview.totalAssigned >= 0
                  ? "You're owed this amount"
                  : "You owe this amount"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
