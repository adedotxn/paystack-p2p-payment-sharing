import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Environments } from "@/utils/config/enviroments.config";
import { useQueryClient } from "@tanstack/react-query";
import { PYS_AT } from "@/utils/constants";

const formSchema = z.object({
  recipient_account_number: z
    .string()
    .length(10, { message: "Account number must be 10 digits." }),
  recipient_bank_code: z.string().min(1, { message: "Please select a bank." }),
  recipient_name: z
    .string()
    .min(2, { message: "Please enter the account name." }),
});

type Bank = {
  name: string;
  slug: string;
  code: string;
  ussd: string;
  logo: string;
};

export default function SettleBillForm(props: {
  billId: number;
  onSuccess?: VoidFunction;
}) {
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipient_account_number: "",
      recipient_bank_code: "",
      recipient_name: "",
    },
  });

  const allbanks = useQuery<Bank[]>({
    queryKey: ["banks"],
    queryFn: async () => {
      const response = await fetch("https://nigerianbanks.xyz");

      const data = await response.json();

      return data;
    },
  });

  const banks = allbanks.data ?? [];

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await fetch(
        `${Environments.API_URL}/payment/settle-bill/${props.billId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(PYS_AT)}`,
          },
          body: JSON.stringify({
            ...values,
            recipient_account_number: Number(values.recipient_account_number),
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
        toast.success("Bill settled successfully");
        queryClient.invalidateQueries({
          queryKey: ["bills"],
        });

        queryClient.invalidateQueries({
          queryKey: ["bill-detail", props.billId.toString()],
        });

        if (props.onSuccess) {
          props.onSuccess();
        }
      }
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="recipient_account_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter 10-digit account number" {...field} />
              </FormControl>
              <FormDescription>
                Enter the 10-digit account number for the payment.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="recipient_bank_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bank</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a bank" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank.code} value={bank.code}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Select the bank for the account.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="recipient_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter account name" {...field} />
              </FormControl>
              <FormDescription>
                Enter the name associated with the account.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Settling Bill..." : "Settle Bill"}
        </Button>
      </form>
    </Form>
  );
}
