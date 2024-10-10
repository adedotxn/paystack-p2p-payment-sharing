import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import CreateBillForm from "@/components/bills/create-bill-form";

export default function CreateBillPage() {
  const navigate = useNavigate();

  function handleSuccess() {
    navigate(-1);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <h1 className="text-2xl font-bold mb-4">Create New Bill</h1>
      <p className="text-gray-600 mb-6">
        Enter the details for your new bill. Click save when you're done.
      </p>
      <CreateBillForm onSuccess={handleSuccess} />
    </div>
  );
}
