import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLoaderData, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { billDetailsQuery } from "./details.loader";
import { PYS_AT } from "@/utils/constants";
import type { BillDetailResponse } from "@/components/bills/bills.types";
import BillDetailCard from "@/components/bills/bill-detail-card";
import BillDetailActionsCard from "@/components/bills/bill-detail-actions-card";
import BillDetailInfoCard from "@/components/bills/bill-detail-info-card";

export default function BillDetailPage() {
  const navigate = useNavigate();

  const loaderData = useLoaderData() as {
    error: boolean;
    data: BillDetailResponse;
  };

  const params = useParams();
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

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <div className="grid gap-6 md:grid-cols-3">
        <BillDetailCard detail={billDetails} />

        <div className="space-y-6">
          <BillDetailActionsCard detail={billDetails} />
          <BillDetailInfoCard detail={billDetails} />
        </div>
      </div>
    </div>
  );
}
