import { Search, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

import { useQuery } from "@tanstack/react-query";
import { Link, Outlet } from "react-router-dom";
import { Environments } from "@/utils/config/enviroments.config";
import { useState } from "react";
import { CreateBillDialog } from "@/components/bills/create-bill-dialog";
import { PYS_AT } from "@/utils/constants";

export default function BillsPage() {
  const [filter, setFilter] = useState("all");

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
      members: {
        id: number;
        userId: number;
        billId: number;
        role: string;
        joinedAt: string;
        assignedAmount: number;
        paidAmount: number;
        user: {
          id: number;
          email: string;
          name: string;
          picture: string;
          createdAt: string;
          updatedAt: string;
        };
        payments: {
          id: number;
          amount: number;
          status: string;
          paystackRef: string;
          userId: number;
          billId: number;
          billMemberId: number;
          createdAt: string;
          updatedAt: string;
        }[];
      }[];
      paidMembers: {
        id: number;
        userId: number;
        billId: number;
        role: string;
        joinedAt: string;
        assignedAmount: number;
        paidAmount: number;
        user: {
          id: number;
          email: string;
          name: string;
          picture: string;
          createdAt: string;
          updatedAt: string;
        };
        payments: {
          id: number;
          amount: number;
          status: string;
          paystackRef: string;
          userId: number;
          billId: number;
          billMemberId: number;
          createdAt: string;
          updatedAt: string;
        }[];
      }[];
      unpaidMembers: {
        id: number;
        userId: number;
        billId: number;
        role: string;
        joinedAt: string;
        assignedAmount: number;
        paidAmount: number;
        user: {
          id: number;
          email: string;
          name: string;
          picture: string;
          createdAt: string;
          updatedAt: string;
        };
        payments: {
          id: number;
          amount: number;
          status: string;
          paystackRef: string;
          userId: number;
          billId: number;
          billMemberId: number;
          createdAt: string;
          updatedAt: string;
        }[];
      }[];
    }[];
  }>({
    queryKey: ["bills", filter],
    queryFn: async () => {
      try {
        const url =
          filter === "all"
            ? `${Environments.API_URL}/user/bills`
            : `${Environments.API_URL}/user/bills?status=${filter}`;
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Bills</h1>
        <CreateBillDialog />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input type="text" placeholder="Search bills" className="pl-10" />
        </div>
        <Select onValueChange={(value) => setFilter(value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="settled">Settled</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {allBills.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {allBills.map((bill) => (
            <Card key={bill.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{bill.title}</span>
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
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-500">
                    Total: NGN {bill.totalAmount}
                  </span>
                  <span className="text-sm font-medium text-gray-500">
                    Paid: NGN {bill.currentAmount}
                  </span>
                </div>
                <Progress
                  value={(bill.currentAmount / bill.totalAmount) * 100}
                  className="w-full mb-2"
                />
                <div className="flex justify-between items-center">
                  <div className="flex -space-x-2">
                    {bill.members.slice(0, 3).map((member) => (
                      <Avatar key={member.id} className="border-2 border-white">
                        <AvatarFallback>{member.user.name[0]}</AvatarFallback>
                      </Avatar>
                    ))}

                    {bill.members.length > 3 && (
                      <Avatar className="border-2 border-white">
                        <AvatarFallback>
                          +{bill.members.length - 3}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {bill.members.length} members
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <Link to={`/bills/${bill.id}`} className="flex">
                    View Details <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">No bills found</p>
        </div>
      )}

      <Outlet />
    </div>
  );
}
