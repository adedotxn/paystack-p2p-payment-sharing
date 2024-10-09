import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BillDetail } from "./bills.types";
import dayjs from "dayjs";
import { MatchCurrency } from "@/utils/constants";

export default function BillDetailCard(props: { detail: BillDetail }) {
  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{props.detail.title}</span>
          <Badge
            variant={
              props.detail.status === "SETTLED"
                ? "outline"
                : props.detail.status === "OPEN"
                  ? "destructive"
                  : "default"
            }
          >
            {props.detail.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500 mb-4">{props.detail.description}</p>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">
            Total: {MatchCurrency[props.detail.currency]}{" "}
            {props.detail.totalAmount.toLocaleString()}
          </span>
          <span className="text-sm font-medium">
            Paid: {MatchCurrency[props.detail.currency]}{" "}
            {props.detail.currentAmount.toLocaleString()}
          </span>
        </div>
        <Progress
          value={(props.detail.currentAmount / props.detail.totalAmount) * 100}
          className="w-full mb-4"
        />

        {props.detail.members.length > 0 ? (
          <Tabs defaultValue="members">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="invitations">Invitations</TabsTrigger>
            </TabsList>
            <TabsContent value="members">
              <div className="space-y-4">
                {props.detail.members.map((member, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{member.user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="ml-4">
                        <p className="text-sm font-medium">
                          {member.user.name}
                          {/* {member.id === user?.id ? " (Me)" : ""} */}
                        </p>
                        <p className="text-sm text-gray-500">
                          {MatchCurrency[props.detail.currency]}{" "}
                          {member.assignedAmount.toLocaleString()}
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
                {props.detail.invitations.length > 0 ? (
                  props.detail.invitations.map((invited, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{invited.email[0]}</AvatarFallback>
                        </Avatar>
                        <div className="ml-4">
                          <p className="text-sm font-medium">
                            {invited.email} --{" "}
                            <span className="text-xs">
                              {MatchCurrency["NGN"]}
                              {invited.assignedAmount.toLocaleString()}
                            </span>
                          </p>

                          <p className="text-xs text-gray-500">
                            Invited{" "}
                            {dayjs().from(dayjs(invited.createdAt), true)} ago
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-medium">
                        {invited.status === "PENDING" && (
                          <Badge variant="secondary" className="bg-yellow-50">
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
  );
}
