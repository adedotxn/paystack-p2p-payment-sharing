import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import SettleBillForm from "@/components/bills/settle-bill-form";

export default function SettleBillPage() {
  const navigate = useNavigate();
  const params = useParams();

  function handleSuccess() {
    navigate(-1);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <h1 className="text-2xl font-bold mb-4">Settle Bill</h1>
      <p className="text-gray-600 mb-6">
        Enter the details for external account to settle the bill to. Click
        "Settle Bill" when you're done.
      </p>
      <SettleBillForm
        billId={Number(params.billId)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
