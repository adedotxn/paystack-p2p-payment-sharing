import { useQuery } from "@tanstack/react-query";
import { Environments } from "@/utils/config/enviroments.config";
import { PYS_AT } from "@/utils/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { ActiveBills } from "./dashboard.types";

export default function ActiveBillsCard() {
  const activeBills = useQuery<ActiveBills>({
    queryKey: ["active-bills"],
    queryFn: async () => {
      try {
        const resp = await fetch(`${Environments.API_URL}/user/bills/active`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(PYS_AT)}`,
          },
        });

        const data = await resp.json();

        return data;
      } catch (e) {
        if (e instanceof Error) throw new Error(e.message);
      }
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Bills</CardTitle>
        <CardDescription>Bills that need your attention</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-purple-600">
          {activeBills.data?.data.length ?? "-1"}
        </div>
        <p className="text-sm text-gray-500 mt-1">Bills requiring action</p>
      </CardContent>
      <CardFooter>
        <Button variant="link" className="w-full">
          <Link to="/bills" className="flex items-center">
            View All Bills <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
