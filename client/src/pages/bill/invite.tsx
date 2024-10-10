import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLoaderData, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { billDetailsQuery } from "./details.loader";
import { BillDetailResponse } from "@/components/bills/bills.types";
import { PYS_AT } from "@/utils/constants";
import InviteMemberForm from "@/components/bills/invite-member-form";

export default function InviteToBillPage() {
  const navigate = useNavigate();
  const params = useParams();

  const loaderData = useLoaderData() as {
    error: boolean;
    data: BillDetailResponse;
  };

  const { data: details } = useQuery({
    ...billDetailsQuery(localStorage.getItem(PYS_AT), params.billId),
    initialData: loaderData,
  });

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

  const billDetails: BillDetailResponse["data"] = details.data?.data;

  function handleSuccess() {
    navigate(-1);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <h1 className="text-2xl font-bold mb-4">Invite to Bill</h1>
      <p className="text-gray-600 mb-6">
        Enter the details for user you want to invite to bill and the amount
        they're to contribute. Click "Invite Member" when you're done.
      </p>

      <InviteMemberForm
        unassignedAmount={billDetails.unassignedAmount}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
