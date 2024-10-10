import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getFormattedDate } from "@/utils/getFormattedDate";
import { Environments } from "@/utils/config/enviroments.config";
import { PYS_AT } from "@/utils/constants";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Bill name must be at least 2 characters.",
  }),
  amount: z.number().min(200, {
    message: "Amount must be greater than 200 Naira.",
  }),
  description: z.string().optional(),
  assignedCreatorAmount: z
    .number()
    .min(100, {
      message: "Assigned creator split must be > 100",
    })
    .optional(),
});

export default function CreateBillForm(props: { onSuccess: () => void }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      amount: 0,
      description: "",
      assignedCreatorAmount: 100,
    },
  });

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await fetch(`${Environments.API_URL}/bill`, {
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
        toast.success("Bill created successfully");
        queryClient.invalidateQueries({
          queryKey: ["bills", { limit: 3 }],
        });

        queryClient.invalidateQueries({
          queryKey: ["bills"],
        });

        queryClient.invalidateQueries({
          queryKey: ["active-bills"],
        });
      }
      props.onSuccess();
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bill Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter bill name" {...field} />
              </FormControl>
              <Button
                type="button"
                onClick={() => form.setValue("name", getFormattedDate())}
                className="mt-2"
              >
                Auto-fill with current date and time
              </Button>
              <FormDescription>
                Give your bill a descriptive name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
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
                Enter the total amount for this bill (minimum 200 Naira).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter bill description"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Provide any additional details about the bill.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="assignedCreatorAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your split of the bill</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Provide the amount to be assigned to you for this bill (minimum
                100 Naira).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating.." : "Create Bill"}{" "}
        </Button>
      </form>
    </Form>
  );
}
