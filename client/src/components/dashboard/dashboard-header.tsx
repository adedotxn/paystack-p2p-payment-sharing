import ProfileAvatar from "./profile-avatar";
import { Link } from "react-router-dom";
import { DollarSign, LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationsMenubar from "./notifications-menubar";
import { PYS_AT } from "@/utils/constants";
import { toast } from "sonner";

export default function DashboardHeader() {
  function logout() {
    const token = localStorage.getItem(PYS_AT);

    if (token) {
      toast("Logging you out...");
      localStorage.removeItem(PYS_AT);
      window.location.href = "/";
    }
  }

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 md:justify-start md:space-x-10">
          <div className="flex justify-start lg:w-0 lg:flex-1">
            <a href="#" className="flex items-center">
              <span className="sr-only">PayShare</span>
              <DollarSign className="h-8 w-auto sm:h-10 text-purple-600" />
              <span className="text-2xl font-bold text-gray-900 ml-2">
                PayShare
              </span>
            </a>
          </div>
          <div className="-mr-2 -my-2 md:hidden">
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOutIcon className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              {/* <Menu className="h-6 w-6" aria-hidden="true" /> */}
              <NotificationsMenubar />
            </Button>
          </div>
          <nav className="hidden md:flex space-x-10">
            <Link
              to="/dashboard"
              className="text-base font-medium text-gray-500 hover:text-gray-900"
            >
              Dashboard
            </Link>
            <Link
              to="/bills"
              className="text-base font-medium text-gray-500 hover:text-gray-900"
            >
              My Bills
            </Link>
          </nav>
          <div className="hidden md:flex items-center justify-end md:flex-1 lg:w-0">
            <NotificationsMenubar />
            <ProfileAvatar />
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOutIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
