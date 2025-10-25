
"use client";
import Image from "next/image";
import Link from "next/link";
import ThemeToggler from "./theme/ThemeToggler";
import { Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/components/utils/api";
import { removeToken } from "./utils/auth";

const Header = () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const logout = () => {
    try {
      removeToken();
      window.location.href = "/";
    } catch (error) {
      console.error("Failed to navigate:", error);
    }
  };
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await fetchWithAuth(`${API_BASE_URL}/dashboard`);
        setUser(data);
      } catch (err: any) {
        setError(err.message);
        removeToken();
      }
    };

    fetchUserData();
  }, []);

  if (error) {
    console.log("Error:", { error });
  }
  return (
    <div
      className="text-white py-2 px-5 mx-10 my-4 flex justify-between rounded-sm items-center"
      style={{ backgroundColor: "rgba(47, 36, 131,1)" }}
    >
      <div>
        <Link href="/">
          <Image src="/sanzad-logo.png" alt="Logo" width={80} height={80} />
        </Link>
      </div>
      <div className="hidden md:flex justify-between items-center gap-4">
        <Link
          className="hover:bg-blue-200 hover:text-indigo-700 rounded-md px-2 py-1"
          href="/"
        >
          Home
        </Link>
       
        <Link
          className="hover:bg-blue-200 hover:text-indigo-700 rounded-md px-2 py-1"
          href="/agent"
        >
          Agent Signup
        </Link>
        <Link
          className="hover:bg-blue-200 hover:text-indigo-700 rounded-md px-2 py-1"
          href="/supplier"
        >
          Supplier Signup
        </Link>
        
        {user && (
          <Link
            className="hover:bg-blue-200 hover:text-indigo-700 rounded-md px-2 py-1"
            
            href={
                          user?.role === "superadmin"
                            ? `/dashboard/admin`
                            : `/dashboard/${user?.role}`
                        }
          >
            Dashboard
          </Link>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="mr-2 flex items-center">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none">
                <div>
                  <span className="hover:bg-blue-200 hover:text-indigo-700 rounded-md px-2 py-1 cursor-pointer hidden md:block">
                    {user?.Company_name || "NA"}
                  </span>
                  <span className="bg-blue-200 text-indigo-700 rounded-md px-2 py-1 cursor-pointer md:hidden">
                    {user?.Company_name?.slice(0, 2)?.toUpperCase() || "NA"}
                  </span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                
                <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/login"
              className="hover:bg-blue-200 hover:text-indigo-700 rounded-md px-2 py-1"
            >
              Login
            </Link>
          )}
        </div>
        <div>
          <ThemeToggler />
        </div>
        <div className="mr-2 flex items-center md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none" asChild>
              <Menu />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Menu</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/">
                <DropdownMenuItem>Home</DropdownMenuItem>
              </Link>
              <Link href="/agent">
                <DropdownMenuItem>Agent Signup</DropdownMenuItem>
              </Link>
              <Link href="/supplier">
                <DropdownMenuItem>Supplier Signup</DropdownMenuItem>
              </Link>
              
              {user && (
                <Link 
                // href={`/dashboard/${user?.role}`}
                href={
                          user?.role === "superadmin"
                            ? `/dashboard/admin`
                            : `/dashboard/${user?.role}`
                        }
                >
                  <DropdownMenuItem>Dashboard</DropdownMenuItem>
                </Link>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default Header;