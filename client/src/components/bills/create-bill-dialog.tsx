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
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
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
import { Textarea } from "@/components/ui/textarea";
import { useMediaQuery } from "@/utils/useMediaQuery";
import { QueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

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

export function CreateBillDialog() {
  const [open, setOpen] = React.useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  function onSuccess() {
    setOpen(false);
  }

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="mr-2 h-4 w-4" /> Create New Bill
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Bill</DialogTitle>
            <DialogDescription>
              Enter the details for your new bill. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <CreateBillForm onSuccess={onSuccess} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Create New Bill
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Create New Bill</DrawerTitle>
          <DrawerDescription>
            Enter the details for your new bill. Click save when you're done.
          </DrawerDescription>
        </DrawerHeader>
        <CreateBillForm onSuccess={onSuccess} />
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function CreateBillForm(props: { onSuccess: () => void }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      amount: 0,
      description: "",
      assignedCreatorAmount: 100,
    },
  });
  const queryClient = new QueryClient();

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await fetch("http://localhost:5000/bill", {
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
          queryKey: ["/user/bills"],
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
