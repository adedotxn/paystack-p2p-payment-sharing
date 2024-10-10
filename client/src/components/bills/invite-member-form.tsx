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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { Environments } from "@/utils/config/enviroments.config";
import { MatchCurrency, PYS_AT } from "@/utils/constants";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  billId: z.number(),
  assignedAmount: z.number().min(200, {
    message: "Amount must be greater than 200 Naira.",
  }),
});

export default function InviteMemberForm(props: {
  onSuccess: () => void;
  unassignedAmount?: number;
}) {
  const params = useParams();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      billId: params.billId ? parseInt(params.billId) : 0,
      assignedAmount: 0,
    },
  });
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await fetch(`${Environments.API_URL}/bill/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(PYS_AT)}`,
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data?.message) {
          throw new Error(data.message);
        } else {
          throw new Error("An error occurred while sending bill invite.");
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
        toast.success("Bill invite sent successfully");
        queryClient.invalidateQueries({
          queryKey: ["invites"],
        });

        queryClient.invalidateQueries({
          queryKey: ["bills"],
        });

        queryClient.invalidateQueries({
          queryKey: ["bill-detail", params.billId?.toString()],
        });
      }
      props.onSuccess();
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (params.billId) {
      mutation.mutate({
        ...values,
        billId: parseInt(params.billId),
      });
    } else {
      toast.error("An error occurred while sending bill invite.");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john@doe.com" {...field} />
              </FormControl>
              <FormDescription>
                Type in the email of the person you want to invite to this bill
                (make sure they have an ccount with PayShare first).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="assignedAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (₦)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Provide the amount to be assigned to this user for this bill
                (minimum 100 Naira).{" "}
                {props.unassignedAmount && props.unassignedAmount > 0 ? (
                  <div className="underline">
                    {" "}
                    NB: This bill still has {MatchCurrency["NGN"]}
                    {props.unassignedAmount.toLocaleString()} unassigned{" "}
                  </div>
                ) : null}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Inviting.." : "Invite Member"}{" "}
        </Button>
      </form>
    </Form>
  );
}
