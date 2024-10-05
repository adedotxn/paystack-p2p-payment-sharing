import { Bell, Plus, DollarSign, ChevronRight, Menu } from "lucide-react";

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

export default function Dashboard() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 md:justify-start md:space-x-10">
            <div className="flex justify-start lg:w-0 lg:flex-1">
              <a href="#" className="flex items-center">
                <span className="sr-only">BillShare</span>
                <DollarSign className="h-8 w-auto sm:h-10 text-purple-600" />
                <span className="text-2xl font-bold text-gray-900 ml-2">
                  BillShare
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
              <a
                href="#"
                className="text-base font-medium text-gray-500 hover:text-gray-900"
              >
                My Bills
              </a>
              <a
                href="#"
                className="text-base font-medium text-gray-500 hover:text-gray-900"
              >
                Groups
              </a>
            </nav>
            <div className="hidden md:flex items-center justify-end md:flex-1 lg:w-0">
              <Button variant="ghost" size="icon" className="ml-4 relative">
                <Bell className="h-6 w-6" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
              </Button>
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
                  <Button className="w-full">
                    <Plus className="mr-2 h-4 w-4" /> Create New Bill
                  </Button>
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
                  <div className="text-3xl font-bold text-purple-600">4</div>
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Dinner at Olive Garden</CardTitle>
                  <CardDescription>
                    Created by Sarah • 2 days ago
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-500">
                      Total: $120.00
                    </span>
                    <Badge>In Progress</Badge>
                  </div>
                  <Progress value={66} className="w-full" />
                  <p className="text-sm text-gray-500 mt-2">
                    4/6 people have paid
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Weekend Getaway</CardTitle>
                  <CardDescription>Created by You • 1 week ago</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-500">
                      Total: $850.00
                    </span>
                    <Badge variant="outline">Completed</Badge>
                  </div>
                  <Progress value={100} className="w-full" />
                  <p className="text-sm text-gray-500 mt-2">
                    All 5 people have paid
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Utilities</CardTitle>
                  <CardDescription>
                    Created by Alex • 3 days ago
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-500">
                      Total: $210.50
                    </span>
                    <Badge variant="destructive">Action Needed</Badge>
                  </div>
                  <Progress value={33} className="w-full" />
                  <p className="text-sm text-gray-500 mt-2">
                    1/3 people have paid
                  </p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Pay Now</Button>
                </CardFooter>
              </Card>
            </div>

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
            © 2023 BillShare. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
