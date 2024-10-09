import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import type { BillDetail } from "./bills.types";
import { MatchCurrency } from "@/utils/constants";

dayjs.extend(localizedFormat);

export default function BillDetailInfoCard(props: { detail: BillDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bill Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Created on</span>
          <span className="text-sm">
            {dayjs(props.detail.createdAt).format("llll")}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Total members</span>
          <span className="text-sm">{props.detail.members.length}</span>
        </div>
        {props.detail.unassignedAmount > 0 ? (
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Unassigned Amount:</span>
            <span className="text-sm">
              {MatchCurrency[props.detail.currency]}
              {props.detail.unassignedAmount}
            </span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
