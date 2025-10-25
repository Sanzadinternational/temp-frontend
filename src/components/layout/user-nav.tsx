"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/components/utils/api";
import { removeToken } from "../utils/auth";
import { BadgeCheck, Bell, CreditCard, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useRouter } from "next/navigation"; // For redirecting

export function UserNav() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const router = useRouter(); // For navigation

  // Logout function
  const logout = () => {
    try {
      removeToken();
      router.push("/login"); // Redirect to login page
    } catch (err) {
      console.error("Failed to log out:", err);
    }
  };

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          console.warn("No token found. Redirecting to login...");
          logout();
          return;
        }

        const data = await fetchWithAuth(`${API_BASE_URL}/dashboard`);
        setUser(data);
      } catch (err: any) {
        // console.error("Error fetching user data:", err);
        setError(err.message || "An error occurred while fetching user data.");
        removeToken(); // Clear token if the request fails
        router.push("/login"); // Redirect to login
      }
    };

    fetchUserData();
  }, []);

const profileImageUrl = user?.profileImage 
  ? `${API_BASE_URL}/uploads/${user.profileImage}`
  : null;

  if (error) {
    console.error("Error in UserNav:", error); 
  }

  const rolename = user?.role;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8">
          {/* <Avatar className="h-8 w-8">
            <AvatarImage
              src={user?.avatar || "https://github.com/shadcn.png1"} // Use default avatar if none is provided
              alt="avatar"
            />
            <AvatarFallback className="bg-primary text-primary-foreground rounded-lg">
              {user?.Company_name?.slice(0, 2)?.toUpperCase() || "NA"}
            </AvatarFallback>
          </Avatar> */}
          <Avatar className="h-8 w-8 rounded-lg">
  {profileImageUrl ? (
    <AvatarImage
      src={profileImageUrl}
      alt="avatar"
      className="object-cover"
    />
  ) : (
    <AvatarFallback className="bg-primary text-primary-foreground rounded-lg">
      {user?.Company_name?.slice(0, 2)?.toUpperCase() || "NA"}
    </AvatarFallback>
  )}
</Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user?.Company_name || "User Name"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.Email || "user@example.com"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {/* Role-Based Profile Links */}
          <DropdownMenuItem asChild>
            <Link
              href={
                rolename === "superadmin"
                  ? `/dashboard/admin/profile`
                  : `/dashboard/${rolename}/profile`
              }
              className="flex items-center gap-2"
            >
              <BadgeCheck />
              Profile
            </Link>
          </DropdownMenuItem>

          {/* Supplier-Specific Links */}
          {rolename === "supplier" && (
            <DropdownMenuItem>
              <Link href="/dashboard/supplier/api" className="flex">
                <CreditCard />
                Integrate API
              </Link>
            </DropdownMenuItem>
          )}

          {/* Notifications */}
          <DropdownMenuItem>
            <Bell />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem onClick={logout}>
          <LogOut />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
