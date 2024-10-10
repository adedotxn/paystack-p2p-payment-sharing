import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { CreateBillButton } from "../bills/create-bill-button";

export default function QuickActionsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Action</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <CreateBillButton full />
        {/* <Button variant="outline" className="w-full">
          <DollarSign className="mr-2 h-4 w-4" /> Settle Payments
        </Button> */}
      </CardContent>
    </Card>
  );
}
