import { BillDetail } from "./bills.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PYS_AT } from "@/utils/constants";
import { Environments } from "@/utils/config/enviroments.config";
import { useQuery } from "@tanstack/react-query";
import SettleBillDialog from "@/components/bills/settle-bill-dialog";
import InviteMemberDialog from "@/components/bills/invite-member-dialog";
import { Button } from "@/components/ui/button";
import type { Profile } from "../dashboard/dashboard.types";
import PaymentButton from "./payment-button";
import { toast } from "sonner";

export default function BillDetailActionsCard(props: { detail: BillDetail }) {
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

  const currentBillMember = props.detail.members.find(
    (member) => member.userId === user?.id,
  );
  return (
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
                billId={props.detail.id}
              />
            ) : null}
          </div>
        )}
        <InviteMemberDialog unassignedAmount={props.detail.unassignedAmount} />

        {props.detail.totalAmount !== props.detail.currentAmount ? (
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
          <SettleBillDialog billId={props.detail.id} />
        )}
      </CardContent>
    </Card>
  );
}
