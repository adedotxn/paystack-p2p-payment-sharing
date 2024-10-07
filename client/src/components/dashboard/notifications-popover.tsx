import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { QueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export default function NotificationsPopover() {
  const queryClient = new QueryClient();

  const invites = useQuery<{
    status: boolean;
    data: {
      id: number;
      email: string;
      billId: number;
      status: string;
      assignedAmount: number;
      createdAt: string;
      updatedAt: string;
      bill: {
        title: string;
        slug: string;
        status: string;
        owner: {
          name: string;
        };
      };
    }[];
  }>({
    queryKey: ["/bill/invites"],
    queryFn: async () => {
      try {
        const resp = await fetch(
          `http://localhost:5000/bill/invites?status=pending`,
          {
            credentials: "include",
          },
        );

        const data = await resp.json();

        return data;
      } catch (e) {
        if (e instanceof Error) throw new Error(e.message);
      }
    },
  });

  const allInvites = invites.data?.data ?? [];

  const mutation = useMutation({
    mutationFn: async (value: { invitationId: number }) => {
      try {
        const response = await fetch(
          `http://localhost:5000/bill/invite/accept`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(value),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          if (data?.message) {
            throw new Error(data.message);
          } else {
            throw new Error(
              "An error occurred while accepting the bill invite.",
            );
          }
        }

        return data;
      } catch (e) {
        if (e instanceof Error) throw new Error(e.message);
      }
    },
    onError: (error) => {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    },
    onSuccess: (data: { status: boolean; data: [] }) => {
      if (data.status) {
        toast.success("Invite accepted!");
        queryClient.invalidateQueries({
          queryKey: ["/bill/invites"],
        });
        queryClient.invalidateQueries({
          queryKey: ["/user/bills"],
        });
      }
    },
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="ml-4 relative">
          <Bell className="h-6 w-6" />
          {allInvites.length > 0 && (
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        {allInvites.length > 0 ? (
          <div className="p-4">
            <h3 className="text-lg font-semibold">Invites</h3>
            <ul className="mt-4">
              {allInvites.map((invite) => (
                <li key={invite.id} className="py-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">
                        {invite.bill.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        Invite by {invite.bill.owner.name}
                      </p>
                    </div>
                    <div>
                      <Button
                        size="sm"
                        onClick={() => {
                          mutation.mutate({ invitationId: invite.id });
                        }}
                        disabled={mutation.isPending}
                      >
                        {mutation.isPending ? "Accepting..." : "Accept"}
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="p-4">
            <h3 className="text-lg font-semibold">No new invites</h3>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
