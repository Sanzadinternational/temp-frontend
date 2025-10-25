
"use client";

import { useState, useEffect } from "react";
import DashboardContainer from "@/components/layout/DashboardContainer";
import { 
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  getPaginationRowModel,
  flexRender,
  getSortedRowModel,
  getFilteredRowModel,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Eye, 
  Check, 
  X, 
  Loader2, 
  ChevronDown, 
  ChevronUp,
  ArrowUpDown,
  Search,
  AlertCircle
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type User = {
  id: string;
  name: string;
  email: string;
  contact: string;
  status: "Pending" | "Approved" | "Rejected";
  country?: string;
};

async function getData(): Promise<User[]> {
  const response = await fetch(`${API_BASE_URL}/admin/AllGetSuppliers`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const apiData = await response.json();

  return apiData.map((item: any) => ({
    id: item.id,
    name: item.Company_name,
    email: item.Email,
    // contact: item.Mobile_number || item.Office_number,
    contact: item.Office_number,
    status: item.IsApproved === 1 ? "Approved" : item.IsApproved === 0 ? "Pending" : "Rejected",
    country: item.Country
  }));
}

async function getUserDetails(email: string) {
  const response = await fetch(`${API_BASE_URL}/admin/SupplierSingleView/${email}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.json();
}

export default function SupplierManagementPage() {
  const [loadingActions, setLoadingActions] = useState<{ [email: string]: boolean }>({});
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [RejectionReason, setRejectionReason] = useState("");
  const [pendingRejectionEmail, setPendingRejectionEmail] = useState("");

  // Search state for mobile view
  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState<"name" | "email" | "country">("name");

  useEffect(() => {
    async function fetchData() {
      try {
        const fetchedData = await getData();
        setData(fetchedData);
      } catch (err) {
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleView = async (email: string) => {
    try {
      const userDetails = await getUserDetails(email);
      if (Array.isArray(userDetails) && userDetails.length > 0) {
        setSelectedUser(userDetails[0]);
      } else {
        setSelectedUser(null);
      }
    } catch (err) {
      console.error("Error fetching user details:", err);
    }
  };

  const handleAction = async (email: string, status: number, reason?: string) => {
    setLoadingActions((prev) => ({ ...prev, [email]: true }));
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/ChangeSupplierApprovalStatus/${email}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            isApproved: status,
            RejectionReason: reason || null
          }),
        }
      );
      if (!response.ok) throw new Error("Failed to update status");

      setData((prevData) =>
        prevData.map((user) =>
          user.email === email
            ? { ...user, status: status === 1 ? "Approved" : "Rejected" }
            : user
        )
      );

      // Reset rejection dialog state
      if (status === 2) {
        setRejectionDialogOpen(false);
        setRejectionReason("");
        setPendingRejectionEmail("");
      }

      // Close the details dialog if action was successful
      if (selectedUser && selectedUser.Email === email) {
        setSelectedUser(null);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while updating the status.");
    } finally {
      setLoadingActions((prev) => ({ ...prev, [email]: false }));
    }
  };

  const initiateRejection = (email: string) => {
    setPendingRejectionEmail(email);
    setRejectionDialogOpen(true);
  };

  const columns: ColumnDef<User>[] = [
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
      accessorKey: "country",
      header: "Country",
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
              <Button 
                variant="destructive" 
                onClick={() => initiateRejection(email)}
              >
                Reject
              </Button>
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

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getGlobalFilter: () => globalFilter,
  });

  // Filter data for mobile view
  const filteredData = data.filter((user) => {
    if (!searchTerm) return true;
    
    const value = user[searchField]?.toLowerCase() || "";
    return value.includes(searchTerm.toLowerCase());
  });

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
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <div className="flex items-center py-4 gap-2 flex-wrap">
                <div className="relative max-w-sm flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search suppliers..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Filter names..."
                    value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                      table.getColumn("name")?.setFilterValue(event.target.value)
                    }
                    className="max-w-xs"
                  />
                  <Input
                    placeholder="Filter emails..."
                    value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                      table.getColumn("email")?.setFilterValue(event.target.value)
                    }
                    className="max-w-xs"
                  />
                  <Input
                    placeholder="Filter countries..."
                    value={(table.getColumn("country")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                      table.getColumn("country")?.setFilterValue(event.target.value)
                    }
                    className="max-w-xs"
                  />
                </div>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 text-center">
                          No results.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
            </div>
            
            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={`Search by ${searchField}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={searchField === "name" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSearchField("name")}
                  >
                    Name
                  </Button>
                  <Button
                    variant={searchField === "email" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSearchField("email")}
                  >
                    Email
                  </Button>
                  <Button
                    variant={searchField === "country" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSearchField("country")}
                  >
                    Country
                  </Button>
                </div>
              </div>
              
              {filteredData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No suppliers found matching your search.
                </div>
              ) : (
                filteredData.map((user) => (
                  <Card key={user.email}>
                    <CardHeader className="flex flex-row justify-between items-start p-4">
                      <div>
                        <CardTitle className="text-lg">{user.name}</CardTitle>
                        <div className="mt-2">
                          <Badge variant={
                            user.status === "Approved" ? "default" : 
                            user.status === "Pending" ? "secondary" : "destructive"
                          }>
                            {user.status}
                          </Badge>
                        </div>
                        {user.country && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {user.country}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(user.email)}
                          className="h-8 w-8"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {user.status === "Pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleAction(user.email, 1)}
                              className="h-8 w-8 text-green-500 hover:text-green-700"
                              disabled={loadingActions[user.email]}
                            >
                              {loadingActions[user.email] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => initiateRejection(user.email)}
                              className="h-8 w-8 text-red-500 hover:text-red-700"
                              disabled={loadingActions[user.email]}
                            >
                              {loadingActions[user.email] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-500">Email</div>
                        <div className="text-sm">{user.email}</div>
                      </div>
                      <div className="space-y-2 mt-2">
                        <div className="text-sm font-medium text-gray-500">Contact</div>
                        <div className="text-sm">{user.contact || "N/A"}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Rejection Confirmation Dialog */}
      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Confirm Rejection
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this supplier? Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Alert variant="destructive">
              <AlertDescription>
                This action cannot be undone. The supplier will be notified of the rejection.
              </AlertDescription>
            </Alert>
            <div className="grid gap-2">
              <label htmlFor="RejectionReason" className="text-sm font-medium">
                Rejection Reason
              </label>
              <Textarea
                id="RejectionReason"
                value={RejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter the reason for rejection..."
                className="min-h-[100px]"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => handleAction(pendingRejectionEmail, 2, RejectionReason)}
              disabled={!RejectionReason || loadingActions[pendingRejectionEmail]}
            >
              {loadingActions[pendingRejectionEmail] ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <X className="mr-2 h-4 w-4" />
              )}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Supplier Details Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">
              {selectedUser?.Company_name || "Supplier Details"}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <Badge variant={
                selectedUser?.IsApproved === 1 ? "default" : 
                selectedUser?.IsApproved === 0 ? "secondary" : "destructive"
              }>
                {selectedUser?.IsApproved === 1 ? "Approved" : 
                 selectedUser?.IsApproved === 0 ? "Pending" : "Rejected"}
              </Badge>
              <span>•</span>
              <span>{selectedUser?.Email}</span>
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 pr-4 -mr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
              {/* Contact Information Section */}
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground">Contact Information</h3>
                <DetailItem label="Contact Person" value={selectedUser?.Contact_Person} />
                <DetailItem label="Mobile" value={selectedUser?.Mobile_number} />
                <DetailItem label="Office" value={selectedUser?.Office_number} />
              </div>

              {/* Location Information Section */}
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground">Location</h3>
                <DetailItem label="Country" value={selectedUser?.Country} />
                <DetailItem label="City" value={selectedUser?.City} />
                <DetailItem label="Address" value={selectedUser?.Address} />
                <DetailItem label="Zip Code" value={selectedUser?.Zip_code} />
              </div>

              {/* Business Information Section */}
              <div className="space-y-3 md:col-span-2">
                <h3 className="font-medium text-sm text-muted-foreground">Business Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailItem label="Currency" value={selectedUser?.Currency} />
                  <DetailItem label="IATA Code" value={selectedUser?.IATA_Code} />
                  <DetailItem label="Tax ID" value={selectedUser?.Gst_Vat_Tax_number} />
                  <DetailItem 
                    label="GST/Tax Certificate" 
                    value={selectedUser?.Gst_Tax_Certificate} 
                    isFile={true} 
                  />
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setSelectedUser(null)}
            >
              Close
            </Button>
            {selectedUser?.IsApproved === 0 && (
              <>
                <Button 
                  onClick={() => handleAction(selectedUser.Email, 1)}
                  disabled={loadingActions[selectedUser.Email]}
                >
                  {loadingActions[selectedUser.Email] ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Approve
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => initiateRejection(selectedUser.Email)}
                  disabled={loadingActions[selectedUser.Email]}
                >
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardContainer>
  );
}

function DetailItem({ 
  label, 
  value, 
  isFile = false 
}: { 
  label: string; 
  value?: string | null; 
  isFile?: boolean 
}) {
  const [expanded, setExpanded] = useState(false);
  
  if (!value) return null;

  if (isFile) {
    // Construct the full URL to the file
    const fileUrl = `${API_BASE_URL}/uploads/${value}`;
    
    return (
      <div className="text-sm">
        <span className="font-medium text-muted-foreground">{label}</span>
        <div className="mt-1">
          <Button
            variant="link"
            size="sm"
            className="h-6 px-0 text-primary"
            onClick={() => {
              // Open in new tab for viewing/download
              window.open(fileUrl, '_blank');
            }}
          >
            Download Certificate
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-sm">
      <div className="flex justify-between items-start">
        <span className="font-medium text-muted-foreground">{label}</span>
        {value.length > 30 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 text-muted-foreground"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
      <p className={`mt-1 ${expanded ? '' : 'line-clamp-1'}`}>
        {value}
      </p>
    </div>
  );
}