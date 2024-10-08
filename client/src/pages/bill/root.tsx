import { Plus, Search, ChevronRight } from "lucide-react";
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
import { useQuery } from "@tanstack/react-query";
import { Link, Outlet } from "react-router-dom";
import { Environments } from "@/utils/config/enviroments.config";

export default function BillsPage() {
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
    queryKey: ["/user/bills"],
    queryFn: async () => {
      try {
        const resp = await fetch(`${Environments.API_URL}/user/bills`, {
          credentials: "include",
        });

        const data = await resp.json();

        console.log("billsss", data);
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
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Create New Bill
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input type="text" placeholder="Search bills" className="pl-10" />
        </div>
        <Select>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="action-needed">Action Needed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
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
                {/* <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-500">
                    Total: ${bill.total.toFixed(2)}
                  </span>
                  <span className="text-sm font-medium text-gray-500">
                    Paid: ${bill.paid.toFixed(2)}
                  </span>
                </div>
                <Progress
                  value={(bill.paid / bill.total) * 100}
                  className="w-full mb-2"
                /> */}
                <div className="flex justify-between items-center">
                  <div className="flex -space-x-2">
                    {[...Array(Math.min(bill.members.length, 3))].map(
                      (_, i) => (
                        <Avatar key={i} className="border-2 border-white">
                          <AvatarFallback>
                            {String.fromCharCode(65 + i)}
                          </AvatarFallback>
                        </Avatar>
                      ),
                    )}
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
