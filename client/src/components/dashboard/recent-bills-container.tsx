import { useQuery } from "@tanstack/react-query";
import { Environments } from "@/utils/config/enviroments.config";
import { MatchCurrency, PYS_AT } from "@/utils/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { RecentBills } from "./dashboard.types";
import { useNavigate } from "react-router-dom";

dayjs.extend(relativeTime);

export default function RecentBillsContainer() {
  const navigate = useNavigate();
  const bills = useQuery<RecentBills>({
    queryKey: ["bills", { limit: 3 }],
    queryFn: async () => {
      try {
        const resp = await fetch(`${Environments.API_URL}/user/bills?limit=3`, {
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

  const recentBills = bills.data?.data ?? [];

  return (
    <>
      <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
        Recent Bills
      </h2>
      {recentBills.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recentBills.map((bill) => (
            <Card key={bill.id}>
              <CardHeader>
                <CardTitle>{bill.title}</CardTitle>
                <CardDescription>
                  Created by {bill.owner.name} •{" "}
                  {dayjs().from(dayjs(bill.createdAt), true)} ago
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-500">
                    Total: {MatchCurrency[bill.currency]}
                    {bill.totalAmount.toLocaleString()}
                  </span>
                  <Badge
                    variant={
                      bill.status === "SETTLED"
                        ? "outline"
                        : bill.status === "OPEN"
                          ? "destructive"
                          : "default"
                    }
                  >
                    {bill.status}
                  </Badge>
                </div>
                {bill.members.length === 0 ? null : (
                  <Progress
                    value={(bill.currentAmount / bill.totalAmount) * 100}
                    className="w-full"
                  />
                )}

                <p className="text-sm text-gray-500 mt-2">
                  {bill.members.length === 0
                    ? "This bill has no members (yet)"
                    : bill.members.length === 1
                      ? `${bill.paidMembers.length === 1 ? "Only member has paid" : "Only member has not paid"}`
                      : `${bill.paidMembers.length}/${bill.members.length} people have paid`}
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/bills/${bill.id}`)}
                >
                  <div className="flex items-center">
                    <span>View Details</span>
                    <span>
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </span>
                  </div>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div>
          <p> No recent bills found. Create a new bill to get started :) </p>
        </div>
      )}
    </>
  );
}
