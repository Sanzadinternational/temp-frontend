"use client";

import * as z from "zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Search, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchWithAuth } from "@/components/utils/api";
import { removeToken } from "@/components/utils/auth";
import DashboardContainer from "@/components/layout/DashboardContainer";
const formSchema = z.object({
  DriverName: z.string().min(1, { message: "Driver Name is required" }),
  DriverContact: z.string().min(1, { message: "Driver Contact is required" }),
  DriverCarInfo: z.string(),
});

const ITEMS_PER_PAGE = 5;

const AddDriver = () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [drivers, setDrivers] = useState([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ 
    key: 'DriverName' | 'DriverContact' | 'DriverCarInfo'; 
    direction: 'ascending' | 'descending' 
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      DriverName: "", 
      DriverContact: "", 
      DriverCarInfo: "" 
    },
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      try {
        const data = await fetchWithAuth(`${API_BASE_URL}/dashboard`);
        setUser(data);
        if (data.userId) {
          fetchDrivers(data.userId);
        }
      } catch (err: any) {
        console.error("Error:", err);
        setError(err.message);
        removeToken();
      }
    };

    fetchUserData();
  }, []);

const fetchDrivers = async (supplierId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/supplier/GetDriver/${supplierId}`);
      if (!response.ok) throw new Error("Failed to fetch drivers");
  
      const result = await response.json();
      console.log("API Response:", result); // Debug log
      
      if (!result || !Array.isArray(result)) {
        throw new Error("Invalid data format");
      }
  
      setDrivers(result);
    } catch (error) {
      console.error("Error fetching drivers:", error);
      setDrivers([]);
      toast({
        title: "Error",
        description: "Failed to load drivers",
        variant: "destructive",
      });
    }
  };
const filteredDrivers = drivers.filter(driver => {
  const searchTermLower = searchTerm.toLowerCase();
  return (
    (driver.DriverName?.toLowerCase() || '').includes(searchTermLower) ||
    (driver.DriverContact?.toLowerCase() || '').includes(searchTermLower) ||
    (driver.DriverCarInfo?.toLowerCase() || '').includes(searchTermLower)
  );
});

  // Sort drivers
  const sortedDrivers = [...filteredDrivers].sort((a, b) => {
    if (!sortConfig) return 0;
    
    const key = sortConfig.key;
    if (a[key] < b[key]) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (a[key] > b[key]) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedDrivers.length / ITEMS_PER_PAGE);
  const paginatedDrivers = sortedDrivers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const requestSort = (key: 'DriverName' | 'DriverContact' | 'DriverCarInfo') => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };


const handleSubmit = async (data: z.infer<typeof formSchema>) => {
  setIsSubmitting(true);
  setError(null);

  try {
    const SupplierId = user?.userId; // Ensure consistent user ID access
    const url = editingId
      ? `${API_BASE_URL}/supplier/UpdateDriver/${editingId}`
      : `${API_BASE_URL}/supplier/CreateDriver`;

    const method = editingId ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, SupplierId }),
    });

    if (!response.ok) throw new Error("Failed to save driver");

    const updatedDriver = await response.json(); // Get the updated driver data
    
    toast({ 
      title: "Success", 
      description: `Driver ${editingId ? "updated" : "added"} successfully!` 
    });

    // Update local state immediately
    if (editingId) {
      setDrivers(prevDrivers => 
        prevDrivers.map(driver => 
          driver.id === editingId ? { ...driver, ...data } : driver
        )
      );
    } else {
      // For new drivers, add to beginning of array
      setDrivers(prevDrivers => [updatedDriver, ...prevDrivers]);
    }

    form.reset();
    setEditingId(null);
    setCurrentPage(1); // Reset to first page
    
    // Optional: Refetch to ensure sync with server
    fetchDrivers(user.userId);
    
  } catch (err: any) {
    console.error("Error:", err);
    const errorMessage = err.response?.data?.message || err.message;
    setError(errorMessage);
    toast({ 
      title: "Error", 
      description: errorMessage, 
      variant: "destructive" 
    });
  } finally {
    setIsSubmitting(false);
  }
};
  const handleEdit = (driver: any) => {
    setEditingId(driver.id);
    form.setValue("DriverName", driver.DriverName);
    form.setValue("DriverContact", driver.DriverContact);
    form.setValue("DriverCarInfo", driver.DriverCarInfo || "");
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete?");
  if (!confirmDelete) return;
    try {
      const response = await fetch(`${API_BASE_URL}/supplier/DeleteDriver/${id}`, { 
        method: "DELETE" 
      });

      if (!response.ok) throw new Error("Failed to delete driver");

      toast({ 
        title: "Deleted", 
        description: "Driver removed successfully!" 
      });
      fetchDrivers(user.userId);
      // Adjust current page if we deleted the last item on the page
      if (paginatedDrivers.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to delete driver", 
        variant: "destructive" 
      });
    }
  };

  return (
    <DashboardContainer scrollable>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
      {/* Add/Edit Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Driver" : "Add Driver"}</CardTitle>
          <CardDescription>
            {editingId ? "Update the selected driver" : "Add a new driver"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {error && <p className="text-red-500">{error}</p>}
              <FormField
                control={form.control}
                name="DriverName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Driver Name <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Driver Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="DriverContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Driver Contact No. <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Driver Contact No." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="DriverCarInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Extra Info (vehicle plate No.)</FormLabel>
                    <FormControl>
                      <Input placeholder="Extra Info" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Processing..." : editingId ? "Update Driver" : "Add Driver"}
                </Button>
                {editingId && (
                  <Button 
                    variant="outline" 
                    onClick={() => { 
                      setEditingId(null); 
                      form.reset(); 
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Display Existing Drivers */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Existing Drivers</CardTitle>
              <CardDescription>
                {filteredDrivers.length} driver{filteredDrivers.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search drivers..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page when searching
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => requestSort('DriverName')}
                      className="p-0 hover:bg-transparent font-medium"
                    >
                      Name
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => requestSort('DriverContact')}
                      className="p-0 hover:bg-transparent font-medium"
                    >
                      Contact
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => requestSort('DriverCarInfo')}
                      className="p-0 hover:bg-transparent font-medium"
                    >
                      Car Info
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDrivers.length > 0 ? (
                  paginatedDrivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell className="font-medium">
                        {driver.DriverName}
                      </TableCell>
                      <TableCell>
                        {driver.DriverContact}
                      </TableCell>
                      <TableCell>
                        {driver.DriverCarInfo || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(driver)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(driver.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      No results found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-muted-foreground">
                  Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredDrivers.length)}-
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredDrivers.length)} of {filteredDrivers.length} drivers
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile List */}
          <div className="md:hidden space-y-2">
            {paginatedDrivers.length > 0 ? (
              paginatedDrivers.map((driver) => (
                <div key={driver.id} className="p-3 border rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="font-medium">{driver.DriverName}</div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(driver)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(driver.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm">
                    <div>Contact: {driver.DriverContact}</div>
                    <div>Car Info: {driver.DriverCarInfo || "-"}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No drivers found
              </div>
            )}
            
            {/* Mobile Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
    </DashboardContainer>
  );
};

export default AddDriver;