import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
// This type defines the shape of our data
export type User = {
  name: string;
  email: string;
  agentoperation: "Allowed" | "Not-Allowed";
  agentaccount: "Allowed" | "Not-Allowed";
  agentproduct: "Allowed" | "Not-Allowed";
  supplieroperation: "Allowed" | "Not-Allowed";
  supplieraccount: "Allowed" | "Not-Allowed";
  supplierproduct: "Allowed" | "Not-Allowed";
};

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    // header: "Name",
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
    // header: "Email",
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
    accessorKey: "agentoperation",
    header: "Agent-Operation",
  },
  {
    accessorKey: "agentaccount",
    header: "Agent-Account",
  },
  {
    accessorKey: "agentproduct",
    header: "Agent-Product",
  },
  {
    accessorKey: "supplieroperation",
    header: "Supplier-Operation",
  },
  {
    accessorKey: "supplieraccount",
    header: "Supplier-Account",
  },
  {
    accessorKey: "supplierproduct",
    header: "Supplier-Product",
  },
];
