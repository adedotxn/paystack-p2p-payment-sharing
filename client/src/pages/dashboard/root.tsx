import { useQuery } from "@tanstack/react-query";
import { Environments } from "@/utils/config/enviroments.config";
import { PYS_AT } from "@/utils/constants";
import BalanceSummaryCard from "@/components/dashboard/balance-summary-card";
import ActiveBillsCard from "@/components/dashboard/active-bills-card";
import QuickActionsCard from "@/components/dashboard/quick-actions-card";
import RecentBillsContainer from "@/components/dashboard/recent-bills-container";
import type { Profile } from "@/components/dashboard/dashboard.types";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import { useEffect } from "react";
import { toast } from "sonner";

export default function Dashboard() {
  const profile = useQuery<Profile>({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await fetch(`${Environments.API_URL}/user/profile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem(PYS_AT)}`,
        },
      });

      if (!response.ok) {
        throw new Error("An error occurred while fetching the data.");
      }
      return response.json();
    },
  });

  const user = profile.data?.data;

  useEffect(() => {
    const token = localStorage.getItem(PYS_AT);
    if (!token) {
      toast.error("You are not logged in. Redirecting to login page...");
      window.location.href = "/";
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <DashboardHeader />

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Welcome back, {user?.name.split(" ")[0] ?? ""}!
            </h1>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <QuickActionsCard />
              <BalanceSummaryCard />
              <ActiveBillsCard />
            </div>
            <RecentBillsContainer />

            {/* <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              Recent Activity
            </h2>
            <Card>
              <CardContent className="p-0">
                <ul className="divide-y divide-gray-200">
                  {[
                    {
                      user: "Mike",
                      action: "paid",
                      amount: "$25.00",
                      bill: "Dinner at Olive Garden",
                      time: "2 hours ago",
                    },
                    {
                      user: "You",
                      action: "created",
                      amount: "$210.50",
                      bill: "Monthly Utilities",
                      time: "3 days ago",
                    },
                    {
                      user: "Sarah",
                      action: "invited you to",
                      amount: null,
                      bill: "Movie Night",
                      time: "1 week ago",
                    },
                  ].map((activity, index) => (
                    <li key={index} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <Avatar>
                            <AvatarFallback>{activity.user[0]}</AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {activity.user} {activity.action}{" "}
                            {activity.amount && (
                              <span className="font-semibold">
                                {activity.amount}
                              </span>
                            )}{" "}
                            {activity.bill}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="link" className="w-full">
                  View All Activity <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card> */}
          </div>
        </div>
      </main>

      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            PayShare is a Proof of Concept of a bill sharing app/service build
            on Paystack APIs
          </p>
        </div>
      </footer>
    </div>
  );
}
