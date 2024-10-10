import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, Check, X } from "lucide-react";
import { Environments } from "@/utils/config/enviroments.config";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PYS_AT } from "@/utils/constants";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import type { Invites } from "./dashboard.types";

export default function NotificationsMenubar() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: invitesData } = useQuery<Invites>({
    queryKey: ["invites"],
    queryFn: async () => {
      const resp = await fetch(
        `${Environments.API_URL}/bill/invites?status=pending`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(PYS_AT)}`,
          },
        },
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
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(PYS_AT)}`,
          },
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
      queryClient.invalidateQueries({
        queryKey: ["invites"],
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const response = await fetch(
        `${Environments.API_URL}/bill/invite/reject`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(PYS_AT)}`,
          },
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
      queryClient.invalidateQueries({ queryKey: ["invites"] });
    },
  });

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {allInvites.length > 0 && (
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Invites</h3>
          <span className="text-sm text-muted-foreground">
            {allInvites.length}
          </span>
        </div>
        <Separator className="mb-2" />
        <ScrollArea
          className={allInvites.length === 0 ? "h-[100px]" : "h-[300px]"}
        >
          {allInvites.length > 0 ? (
            allInvites.map((invite) => (
              <div key={invite.id} className="mb-4 last:mb-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">{invite.bill.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(invite.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground block mb-2">
                  Invited by {invite.bill.owner.name}
                </span>
                <div className="flex justify-end space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rejectMutation.mutate(invite.id)}
                    disabled={rejectMutation.isPending}
                  >
                    <X className="mr-1 h-4 w-4" />
                    {rejectMutation.isPending ? "Rejecting..." : "Reject"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => acceptMutation.mutate(invite.id)}
                    disabled={acceptMutation.isPending}
                  >
                    <Check className="mr-1 h-4 w-4" />
                    {acceptMutation.isPending ? "Accepting..." : "Accept"}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground">
              No new invites
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
