import { QueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, Check, X } from "lucide-react";
import { Environments } from "@/utils/config/enviroments.config";

import { Button } from "@/components/ui/button";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Invite {
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
}

export default function NotificationsPopover() {
  const queryClient = new QueryClient();

  const { data: invitesData } = useQuery<{ status: boolean; data: Invite[] }>({
    queryKey: ["/bill/invites"],
    queryFn: async () => {
      const resp = await fetch(
        `${Environments.API_URL}/bill/invites?status=pending`,
        { credentials: "include" },
      );
      if (!resp.ok) throw new Error("Failed to fetch invites");
      return resp.json();
    },
  });

  const allInvites = invitesData?.data ?? [];

  const acceptMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const response = await fetch(
        `${Environments.API_URL}/bill/invite/accept`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invitationId }),
        },
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.message || "Failed to accept invite");
      }
      return response.json();
    },
    onError: (error: Error) => toast.error(error.message),
    onSuccess: () => {
      toast.success("Invite accepted!");
      queryClient.invalidateQueries({
        queryKey: ["bills"],
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const response = await fetch(
        `${Environments.API_URL}/bill/invite/reject`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invitationId }),
        },
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.message || "Failed to reject invite");
      }
      return response.json();
    },
    onError: (error: Error) => toast.error(error.message),
    onSuccess: () => {
      toast.success("Invite rejected!");
      queryClient.invalidateQueries({ queryKey: ["/bill/invites"] });
    },
  });

  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {allInvites.length > 0 && (
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
            )}
          </Button>
        </MenubarTrigger>
        <MenubarContent align="end" alignOffset={-11} className="w-80">
          <MenubarItem className="font-semibold" disabled>
            Invites
            <MenubarShortcut>{allInvites.length}</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <ScrollArea className="h-[100px]">
            {allInvites.length > 0 ? (
              allInvites.map((invite) => (
                <MenubarItem
                  key={invite.id}
                  className="flex flex-col items-start p-2"
                >
                  <div className="flex w-full justify-between items-center mb-1">
                    <span className="font-medium">{invite.bill.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(invite.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground mb-2">
                    Invited by {invite.bill.owner.name}
                  </span>
                  <div className="flex w-full justify-end space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => rejectMutation.mutate(invite.id)}
                      disabled={rejectMutation.isPending}
                    >
                      <X className="mr-1 h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => acceptMutation.mutate(invite.id)}
                      disabled={acceptMutation.isPending}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Accept
                    </Button>
                  </div>
                </MenubarItem>
              ))
            ) : (
              <MenubarItem disabled>No new invites</MenubarItem>
            )}
          </ScrollArea>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
