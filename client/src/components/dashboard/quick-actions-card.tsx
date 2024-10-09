import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateBillDialog } from "@/components/bills/create-bill-dialog";
import { DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QuickActionsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <CreateBillDialog />
        <Button variant="outline" className="w-full">
          <DollarSign className="mr-2 h-4 w-4" /> Settle Payments
        </Button>
      </CardContent>
    </Card>
  );
}
