import type { FullBill } from "./bills.types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { MatchCurrency } from "@/utils/constants";

export default function BillCard(props: { bill: FullBill }) {
  return (
    <Card key={props.bill.id}>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{props.bill.title}</span>
          <Badge
            variant={
              props.bill.status === "SETTLED"
                ? "outline"
                : props.bill.status === "OPEN"
                  ? "destructive"
                  : "default"
            }
          >
            {props.bill.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-500">
            Total: {MatchCurrency["NGN"]}
            {props.bill.totalAmount.toLocaleString()}
          </span>
          <span className="text-sm font-medium text-gray-500">
            Paid: {MatchCurrency["NGN"]}
            {props.bill.currentAmount.toLocaleString()}
          </span>
        </div>
        <Progress
          value={(props.bill.currentAmount / props.bill.totalAmount) * 100}
          className="w-full mb-2"
        />
        <div className="flex justify-between items-center">
          <div className="flex -space-x-2">
            {props.bill.members.slice(0, 3).map((member) => (
              <Avatar key={member.id} className="border-2 border-white">
                <AvatarFallback>{member.user.name[0]}</AvatarFallback>
              </Avatar>
            ))}

            {props.bill.members.length > 3 && (
              <Avatar className="border-2 border-white">
                <AvatarFallback>
                  +{props.bill.members.length - 3}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
          <span className="text-sm text-gray-500">
            {props.bill.members.length} members
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          <Link to={`/bills/${props.bill.id}`} className="flex">
            View Details <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
