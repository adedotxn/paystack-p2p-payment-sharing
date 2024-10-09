import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useLoaderData, useParams } from "react-router-dom";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import InviteMemberDialog from "@/components/bills/invite-member-dialog";
import PaymentButton from "@/components/bills/payment-button";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import SettleBillDialog from "@/components/bills/settle-bill-dialog";
import { Environments } from "@/utils/config/enviroments.config";
import { billDetailsQuery } from "./details.loader";
import { PYS_AT } from "@/utils/constants";

dayjs.extend(localizedFormat);

export default function BillDetailPage() {
  const profile = useQuery<{
    status: boolean;
    data: {
      id: number;
      email: string;
      name: string;
      picture: string;
      createdAt: string;
      updatedAt: string;
    };
  }>({
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
        unassignedAmount: number;
      };
    };
  };

  const params = useParams();
  const { data: billDetails } = useQuery({
    ...billDetailsQuery(localStorage.getItem(PYS_AT), params.billId),
    initialData: loaderData,
  });

  console.log("billDetails", billDetails);

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
  const currentBillMember = billDetailss.members.find(
    (member) => member.userId === user?.id,
  );

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
                  billDetailss.status === "SETTLED"
                    ? "outline"
                    : billDetailss.status === "OPEN"
                      ? "destructive"
                      : "default"
                }
              >
                {billDetailss.status}
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
                  <TabsTrigger value="invitations">Invitations</TabsTrigger>
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
                              {/* {member.id === user?.id ? " (Me)" : ""} */}
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
                <TabsContent value="invitations">
                  <div className="space-y-4">
                    {billDetailss.invitations.length > 0 ? (
                      billDetailss.invitations.map((invited, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {invited.email[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="ml-4">
                              <p className="text-sm font-medium">
                                {invited.email} --{" "}
                                <span className="text-xs">
                                  NGN {invited.assignedAmount}
                                </span>
                              </p>

                              <p className="text-xs text-gray-500">
                                Invited{" "}
                                {dayjs().from(dayjs(invited.createdAt), true)}{" "}
                                ago
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-medium">
                            {invited.status === "PENDING" && (
                              <Badge
                                variant="secondary"
                                className="bg-yellow-50"
                              >
                                {invited.status}
                              </Badge>
                            )}

                            {invited.status === "ACCEPTED" && (
                              <Badge variant="outline" className="bg-green-50">
                                {invited.status}
                              </Badge>
                            )}

                            {invited.status === "REJECTED" && (
                              <Badge variant="outline" className="bg-red-50">
                                {invited.status}
                              </Badge>
                            )}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div>
                        <p className="text-xs text-gray-500 grid place-items-center">
                          No invitation has been sent for this bill yet
                        </p>{" "}
                      </div>
                    )}
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
              {currentBillMember?.paidAmount !==
                currentBillMember?.assignedAmount && (
                <div>
                  {user && currentBillMember ? (
                    <PaymentButton
                      amount={currentBillMember.assignedAmount}
                      email={user.email}
                      billId={billDetailss.id}
                    />
                  ) : null}
                </div>
              )}
              <InviteMemberDialog
                unassignedAmount={billDetailss.unassignedAmount}
              />

              {billDetailss.totalAmount !== billDetailss.currentAmount ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    toast.error(
                      "Please complete all payments before attempting to settle the bill",
                    )
                  }
                >
                  Settle Bill
                </Button>
              ) : (
                <SettleBillDialog billId={billDetailss.id} />
              )}
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
              {billDetailss.unassignedAmount > 0 ? (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">
                    Unassigned Amount:
                  </span>
                  <span className="text-sm">
                    {billDetailss.currency} {billDetailss.unassignedAmount}
                  </span>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
