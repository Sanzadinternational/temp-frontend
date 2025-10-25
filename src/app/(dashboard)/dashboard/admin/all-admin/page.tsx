
"use client";

import { useState, useEffect } from "react";
import DashboardContainer from "@/components/layout/DashboardContainer";
import { User, columns } from "./column";
import { DataTable } from "./data-table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

export default function AdminManagementPage() {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/AllAdminRecords`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const apiData = await response.json();

      const formattedData = apiData.map((item: any) => ({
        id: item.id,
        name: item.Company_name,
        email: item.Email,
        agentoperation: item.Agent_operation === true ? "Allowed" : "Not-Allowed",
        agentaccount: item.Agent_account === true ? "Allowed" : "Not-Allowed",
        agentproduct: item.Agent_product === true ? "Allowed" : "Not-Allowed",
        supplieroperation: item.Supplier_operation === true ? "Allowed" : "Not-Allowed",
        supplieraccount: item.Supplier_account === true ? "Allowed" : "Not-Allowed",
        supplierproduct: item.Supplier_product === true ? "Allowed" : "Not-Allowed",
      }));

      setData(formattedData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (email: string) => {
    // const confirmDelete = window.confirm(`Are you sure you want to delete ${email}?`);
    // if (!confirmDelete) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/DestroyAdmin/${email}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Admin deleted successfully'
        });
        fetchData();
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.message || "Failed to delete admin",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error deleting admin:", error);
      toast({
        title: 'Error',
        description: "Something went wrong",
        variant: "destructive"
      });
    }
  };

  return (
    <DashboardContainer>
      <div className="container mx-auto py-4 md:py-10">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <DataTable
                columns={[
                  ...columns,
                  {
                    id: "actions",
                    header: "Actions",
                    cell: ({ row }) => {
                      const email = row.original.email;
                      return (
                        <Button variant='destructive' onClick={() => handleDelete(email)}>
                          Delete
                        </Button>
                      );
                    },
                  },
                ]}
                data={data}
              />
            </div>
            
            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {data.map((admin) => (
                <Card key={admin.email}>
                  <CardHeader className="flex flex-row justify-between items-start p-4">
                    <div>
                      <CardTitle className="text-lg">{admin.name}</CardTitle>
                      <div className="text-sm text-muted-foreground">{admin.email}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(admin.email)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-500">Agent Operation</div>
                      <Badge variant={admin.agentoperation === "Allowed" ? "default" : "destructive"}>
                        {admin.agentoperation}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-500">Agent Account</div>
                      <Badge variant={admin.agentaccount === "Allowed" ? "default" : "destructive"}>
                        {admin.agentaccount}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-500">Agent Product</div>
                      <Badge variant={admin.agentproduct === "Allowed" ? "default" : "destructive"}>
                        {admin.agentproduct}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-500">Supplier Operation</div>
                      <Badge variant={admin.supplieroperation === "Allowed" ? "default" : "destructive"}>
                        {admin.supplieroperation}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-500">Supplier Account</div>
                      <Badge variant={admin.supplieraccount === "Allowed" ? "default" : "destructive"}>
                        {admin.supplieraccount}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-500">Supplier Product</div>
                      <Badge variant={admin.supplierproduct === "Allowed" ? "default" : "destructive"}>
                        {admin.supplierproduct}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardContainer>
  );
}