import { BillDetail } from "./bills.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PYS_AT } from "@/utils/constants";
import { Environments } from "@/utils/config/enviroments.config";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import type { Profile } from "../dashboard/dashboard.types";
import PaymentButton from "./payment-button";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

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

  const params = useParams();
  const navigate = useNavigate();

  function navigateToInvitePage() {
    navigate(`/bills/${params.billId}/invite`);
  }

  function navigateToSettlementPage() {
    navigate(`/bills/${params.billId}/settle`);
  }

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

        <Button
          variant="outline"
          className="w-full"
          onClick={navigateToInvitePage}
        >
          <Plus className="mr-2 h-4 w-4" /> Invite Member
        </Button>

        {props.detail.totalAmount !== props.detail.currentAmount ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={() =>
              toast.info(
                "Please complete all payments before attempting to settle the bill",
              )
            }
          >
            Settle Bill
          </Button>
        ) : (
          <Button className="w-full" onClick={navigateToSettlementPage}>
            Settle Bill
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
