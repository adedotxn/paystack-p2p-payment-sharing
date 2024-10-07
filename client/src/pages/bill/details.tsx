import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useLoaderData } from "react-router-dom";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { InviteMemberDialog } from "@/components/bills/invite-member-dialog";

dayjs.extend(localizedFormat);

export default function BillDetailPage() {
  const loaderData = useLoaderData() as {
    error: boolean;
    data: {
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
        }[];
        owner: {
          id: number;
          email: string;
          name: string;
          picture: string;
          createdAt: string;
          updatedAt: string;
        };
        invitations: {
          id: number;
          email: string;
          billId: number;
          status: string;
          assignedAmount: number;
          createdAt: string;
          updatedAt: string;
        }[];
        payments: unknown[];
      };
    };
  };

  console.log("loaderData", loaderData);

  const billDetails = {
    id: 1,
    name: "Dinner at Olive Garden",
    total: 120,
    paid: 80,
    members: [
      { name: "You", paid: true, amount: 20 },
      { name: "Alice", paid: true, amount: 20 },
      { name: "Bob", paid: true, amount: 20 },
      { name: "Charlie", paid: true, amount: 20 },
      { name: "David", paid: false, amount: 20 },
      { name: "Eve", paid: false, amount: 20 },
    ],
    status: "In Progress",
    date: "June 15, 2023",
    description: "Team dinner after the project completion",
  };

  if (loaderData.error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Bill not found</h1>
          <p className="text-gray-500">
            The bill you are looking for does not exist.
          </p>
        </div>
      </div>
    );
  }

  const billDetailss = loaderData.data.data;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" className="mb-6">
        <Link to="/bills" className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Bills
        </Link>
      </Button>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{billDetailss.title}</span>
              <Badge
                variant={
                  billDetails.status === "Completed"
                    ? "outline"
                    : billDetails.status === "Action Needed"
                      ? "destructive"
                      : "default"
                }
              >
                {billDetails.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              {billDetailss.description}
            </p>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">
                Total: {billDetailss.currency} {billDetailss.totalAmount}
              </span>
              <span className="text-sm font-medium">
                Paid: {billDetailss.currency} {billDetailss.currentAmount}
              </span>
            </div>
            <Progress
              value={
                (billDetailss.currentAmount / billDetailss.totalAmount) * 100
              }
              className="w-full mb-4"
            />

            {billDetailss.members.length > 0 ? (
              <Tabs defaultValue="members">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="members">Members</TabsTrigger>
                  <TabsTrigger value="transactions">Transactions</TabsTrigger>
                </TabsList>
                <TabsContent value="members">
                  <div className="space-y-4">
                    {billDetailss.members.map((member, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {member.user.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-4">
                            <p className="text-sm font-medium">
                              {member.user.name}
                              {member.role === "OWNER" ? " (Me)" : ""}
                            </p>
                            <p className="text-sm text-gray-500">
                              {billDetailss.currency} {member.assignedAmount}
                            </p>
                          </div>
                        </div>
                        {member.paidAmount === member.assignedAmount ? (
                          <Badge variant="outline" className="bg-green-50">
                            Paid
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-50">
                            Pending
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="transactions">
                  <div className="space-y-4">
                    {billDetails.members
                      .filter((m) => m.paid)
                      .map((member, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>{member.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="ml-4">
                              <p className="text-sm font-medium">
                                {member.name} paid
                              </p>
                              <p className="text-xs text-gray-500">
                                June 16, 2023
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-medium">
                            ${member.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center">
                <p className="text-gray-500">No members added yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full">Make Payment</Button>
              <InviteMemberDialog />
              <Button variant="outline" className="w-full">
                Close Bill
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bill Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Created on</span>
                <span className="text-sm">
                  {dayjs(billDetailss.createdAt).format("llll")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total members</span>
                <span className="text-sm">{billDetailss.members.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Amount per person</span>
                <span className="text-sm">
                  ${(billDetails.total / billDetails.members.length).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
