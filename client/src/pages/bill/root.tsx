import { ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { CreateBillDialog } from "@/components/bills/create-bill-dialog";
import AllBillsContainer from "@/components/bills/all-bills-container";
import { PYS_AT } from "@/utils/constants";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function BillsPage() {
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  const token = localStorage.getItem(PYS_AT);

  useEffect(() => {
    if (!token) {
      navigate("/");
    }
  }, [token]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Bills</h1>
        <CreateBillDialog />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input type="text" placeholder="Search bills" className="pl-10" />
        </div> */}
        <Select onValueChange={(value) => setFilter(value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="settled">Settled</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <AllBillsContainer filter={filter} />
    </div>
  );
}
