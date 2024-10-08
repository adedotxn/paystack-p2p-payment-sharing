import React from "react";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { QueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useParams } from "react-router-dom";

export default function InviteMemberDialog(props: {
  unassignedAmount?: number;
}) {
  const [open, setOpen] = React.useState(false);

  function onSuccess() {
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Plus className="mr-2 h-4 w-4" /> Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a new member</DialogTitle>
          <DialogDescription>
            Enter the email address of the person you'd like to invite to this
            bill and the amount you'd like to assign to them'.
          </DialogDescription>
        </DialogHeader>
        <InviteMemberForm
          onSuccess={onSuccess}
          unassignedAmount={props.unassignedAmount}
        />
      </DialogContent>
    </Dialog>
  );
}

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  billId: z.number(),
  assignedAmount: z.number().min(200, {
    message: "Amount must be greater than 200 Naira.",
  }),
});

function InviteMemberForm(props: {
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
  const queryClient = new QueryClient();

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await fetch("http://localhost:5000/bill/invite", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
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
          queryKey: ["/user/bills"],
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
                  <div>
                    {" "}
                    NB: This bill still has NGN {props.unassignedAmount}{" "}
                    unassigned{" "}
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
