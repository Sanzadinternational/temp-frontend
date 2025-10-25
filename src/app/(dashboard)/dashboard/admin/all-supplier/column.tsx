
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Eye } from "lucide-react";

export type User = {
  name: string;
  email: string;
  contact: string;
  status: "Pending" | "Approved" | "Rejected";
};

export const columns = (
  handleAction: (email: string, status: number) => void,
  handleView: (email: string) => void,
  loadingActions: { [email: string]: boolean }
): ColumnDef<User>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "contact",
    header: "Contact No.",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const { status, email } = row.original;

      if (status === "Pending") {
        return loadingActions[email] ? (
          <div className="flex space-x-2">
            <Button disabled>
              Processing...
            </Button>
          </div>
        ) : (
          <div className="flex space-x-2">
            <Button onClick={() => handleAction(email, 1)}>Approve</Button>
            <Button variant="destructive" onClick={() => handleAction(email, 2)}>Reject</Button>
          </div>
        );
      }

      return <span>{status}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const { email } = row.original;
      
      return (
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => handleView(email)}
          className="h-8 w-8"
        >
          <Eye className="h-4 w-4" />
          <span className="sr-only">View</span>
        </Button>
      );
    },
  },
];