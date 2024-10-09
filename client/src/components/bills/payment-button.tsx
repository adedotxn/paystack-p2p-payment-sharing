/* eslint-disable @typescript-eslint/no-explicit-any */

import { usePaystackPayment } from "react-paystack";
import { Button } from "../ui/button";
import { Environments } from "@/utils/config/enviroments.config";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { PYS_AT } from "@/utils/constants";
import { useQueryClient } from "@tanstack/react-query";

export default function PaymentButton(props: {
  amount: number;
  email: string;
  billId: number;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (paystackRef: string) => {
      const response = await fetch(
        `${Environments.API_URL}/payment/verify/${props.billId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(PYS_AT)}`,
          },
          body: JSON.stringify({
            paystackRef,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        if (data?.message) {
          throw new Error(data.message);
        } else {
          throw new Error("An error occurred while creating the bill.");
        }
      }

      return data;
    },
    onError: (error) => {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    },
    onSuccess: (data: { status: boolean; data: [] }) => {
      if (data.status) {
        toast.success("Payment successfull");

        queryClient.invalidateQueries({
          queryKey: ["bills"],
        });

        queryClient.invalidateQueries({
          queryKey: ["bill-detail", props.billId.toString()],
        });
      }
    },
  });

  const config = {
    reference: new Date().getTime().toString(),
    email: props.email,
    amount: props.amount * 100, //Amount is in the country's lowest currency. E.g Kobo, so 20000 kobo = N200
    publicKey: Environments.PAYSTACK_PUBLIC_KEY,
  };

  const initializePayment = usePaystackPayment(config);

  const onSuccess = (response?: any) => {
    const res = response as {
      reference: string;
      trans: string;
      status: string;
      message: string;
      transaction: string;
      trxref: string;
      redirecturl: string;
    };

    console.log("response", res);

    if (res.message && res.reference) {
      mutation.mutate(res.reference);
    }
  };

  // you can call this function anything
  const onClose = (response?: any) => {
    // implementation for  whatever you want to do when the Paystack dialog closed.
    console.log("closed");
    console.log("response closed", response);
  };

  return (
    <Button
      className="w-full"
      onClick={() => initializePayment({ onSuccess, onClose })}
    >
      Make Payment
    </Button>
  );
}
