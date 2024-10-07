import { Bell, DollarSign, ChevronRight, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { CreateBillDialog } from "@/components/bills/create-bill-dialog";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Link } from "react-router-dom";
import NotificationsPopover from "@/components/dashboard/notifications-popover";

dayjs.extend(relativeTime);

export default function Dashboard() {
  const bills = useQuery<{
    status: boolean;
    data: {
      id: number;
      title: string;
      slug: string;
      description: string;
      totalAmount: number;
      currentAmount: number;
      status: string;
      createdAt: string;
      updatedAt: string;
      currency: string;
      ownerId: number;
      owner: {
        id: number;
        email: string;
        name: string;
        picture: string;
        createdAt: string;
        updatedAt: string;
      };
      members: unknown[];
      paidMembers: unknown[];
      unpaidMembers: unknown[];
    }[];
  }>({
    queryKey: ["/user/bills", 3],
    queryFn: async () => {
      try {
        const resp = await fetch(`http://localhost:5000/user/bills?limit=3`, {
          credentials: "include",
        });

        const data = await resp.json();

        return data;
      } catch (e) {
        if (e instanceof Error) throw new Error(e.message);
      }
    },
  });

  const recentBills = bills.data?.data ?? [];

  const activeBills = useQuery<{
    status: true;
    data: [];
  }>({
    queryKey: ["/user/bills/active"],
    queryFn: async () => {
      try {
        const resp = await fetch(`http://localhost:5000/user/bills/active`, {
          credentials: "include",
        });

        const data = await resp.json();

        return data;
      } catch (e) {
        if (e instanceof Error) throw new Error(e.message);
      }
    },
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 md:justify-start md:space-x-10">
            <div className="flex justify-start lg:w-0 lg:flex-1">
              <a href="#" className="flex items-center">
                <span className="sr-only">PayShare</span>
                <DollarSign className="h-8 w-auto sm:h-10 text-purple-600" />
                <span className="text-2xl font-bold text-gray-900 ml-2">
                  PayShare
                </span>
              </a>
            </div>
            <div className="-mr-2 -my-2 md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" aria-hidden="true" />
              </Button>
            </div>
            <nav className="hidden md:flex space-x-10">
              <a
                href="#"
                className="text-base font-medium text-gray-500 hover:text-gray-900"
              >
                Dashboard
              </a>
              <Link
                to="/bills"
                className="text-base font-medium text-gray-500 hover:text-gray-900"
              >
                My Bills
              </Link>

              <a
                href="#"
                className="text-base font-medium text-gray-500 hover:text-gray-900"
              >
                Groups
              </a>
            </nav>
            <div className="hidden md:flex items-center justify-end md:flex-1 lg:w-0">
              <NotificationsPopover />
              <Avatar className="ml-4">
                <AvatarImage
                  src="https://github.com/shadcn.png"
                  alt="@shadcn"
                />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Welcome back, Alex!
            </h1>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <CreateBillDialog />
                  <Button variant="outline" className="w-full">
                    <DollarSign className="mr-2 h-4 w-4" /> Settle Payments
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Your Balance</CardTitle>
                  <CardDescription>
                    Total amount you owe or are owed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    +$245.50
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    You're owed this amount
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active Bills</CardTitle>
                  <CardDescription>
                    Bills that need your attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    {activeBills.data?.data.length ?? "-1"}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Bills requiring action
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="link" className="w-full">
                    View All Bills <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </div>

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
                          Total: {bill.currency}
                          {bill.currentAmount}
                        </span>
                        <Badge>{bill.status}</Badge>
                      </div>
                      {bill.members.length === 0 ? null : (
                        <Progress value={66} className="w-full" />
                      )}

                      <p className="text-sm text-gray-500 mt-2">
                        {bill.members.length === 0
                          ? "This bill has no members (yet)"
                          : `${bill.paidMembers.length}/${bill.members.length} people have paid`}
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">
                        <Link
                          to={`/bills/${bill.id}`}
                          className="flex items-center"
                        >
                          View Details <ChevronRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div>
                <p>
                  {" "}
                  No recent bills found. Create a new bill to get started :){" "}
                </p>
              </div>
            )}

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
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
            </Card>
          </div>
        </div>
      </main>

      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © 2023 PayShare. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
