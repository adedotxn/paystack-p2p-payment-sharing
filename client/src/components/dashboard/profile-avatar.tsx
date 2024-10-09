import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { Environments } from "@/utils/config/enviroments.config";
import { PYS_AT } from "@/utils/constants";
import type { Profile } from "./dashboard.types";

export default function ProfileAvatar() {
  const profile = useQuery<Profile>({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await fetch(`${Environments.API_URL}/user/profile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem(PYS_AT)}`,
        },
      });

      if (!response.ok) {
        throw new Error("An error occurred while fetching the data.");
      }
      return response.json();
    },
  });

  const user = profile.data?.data;

  return (
    <Avatar className="ml-4">
      {user ? <AvatarImage src={user.picture} alt={user.name} /> : null}
      <AvatarFallback>{user?.name.split(" ")[0][0] ?? ""}</AvatarFallback>
    </Avatar>
  );
}
