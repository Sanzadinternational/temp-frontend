
"use client";

import * as z from "zod";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, Save, X, Plus, Search, ChevronUp, ChevronDown } from "lucide-react";
import DashboardContainer from "@/components/layout/DashboardContainer";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
  Email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Please enter a valid email" }),
  Password: z.string().min(1, { message: "Password is required" }).optional(),
  Company_name: z.string().min(1, { message: "User Name is required" }),
  Agent_account: z.boolean().optional(),
  Agent_operation: z.boolean().optional(),
  Agent_product: z.boolean().optional(),
  Supplier_account: z.boolean().optional(),
  Supplier_operation: z.boolean().optional(),
  Supplier_product: z.boolean().optional(),
});

type Admin = {
  id: string;
  Company_name: string;
  Email: string;
  Agent_operation: boolean;
  Agent_account: boolean;
  Agent_product: boolean;
  Supplier_operation: boolean;
  Supplier_account: boolean;
  Supplier_product: boolean;
};

export default function AdminManagementPage() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const { toast } = useToast();
  
  // State for admin data and loading
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for form
  const [showAgentOptions, setShowAgentOptions] = useState(false);
  const [showSupplierOptions, setShowSupplierOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);

//   // Search and pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Admin;
    direction: "ascending" | "descending";
  } | null>(null);
  const [allAdmins, setAllAdmins] = useState<Admin[]>([]); // Original data
const [filteredAdmins, setFilteredAdmins] = useState<Admin[]>([]); // Filtered results

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      Company_name: "",
      Email: "",
      Password: "",
      Agent_account: false,
      Agent_operation: false,
      Agent_product: false,
      Supplier_account: false,
      Supplier_operation: false,
      Supplier_product: false,
    },
  });

  // Fetch all admins
  // const fetchAdmins = async () => {
  //   setLoading(true);
  //   try {
  //     const response = await fetch(`${API_BASE_URL}/admin/AllAdminRecords`);
  //     const data = await response.json();
  //     setAdmins(data);
  //   } catch (error) {
  //     toast({
  //       title: "Error",
  //       description: "Failed to fetch admins",
  //       variant: "destructive"
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };
const fetchAdmins = async () => {
  setLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/admin/AllAdminRecords`);
    const data = await response.json();
    setAllAdmins(data);
    setFilteredAdmins(data); // Initialize filtered data with all admins
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to fetch admins",
      variant: "destructive"
    });
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchAdmins();
  }, []);

useEffect(() => {
  if (!editMode) {
    resetForm();
  }
}, [editMode]);
//   // Apply search filter
  // useEffect(() => {
  //   const filtered = admins.filter(admin => {
  //     const searchLower = searchTerm.toLowerCase();
  //     return (
  //       admin.Company_name.toLowerCase().includes(searchLower) ||
  //       admin.Email.toLowerCase().includes(searchLower)
  // )});
  //   setAdmins(filtered);
  //   setCurrentPage(1);
  // }, [searchTerm]);

useEffect(() => {
  if (searchTerm.trim() === "") {
    setFilteredAdmins(allAdmins); // Show all data when search is empty
  } else {
    const filtered = allAdmins.filter(admin => {
      const searchLower = searchTerm.toLowerCase();
      return (
        admin.Company_name.toLowerCase().includes(searchLower) ||
        admin.Email.toLowerCase().includes(searchLower)
      );
    });
    setFilteredAdmins(filtered);
  }
  setCurrentPage(1); // Reset to first page when searching
}, [searchTerm, allAdmins]);

//   // Sort data
  useEffect(() => {
    if (sortConfig !== null) {
      const sortedAdmins = [...admins].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
          return sortConfig.direction === "ascending" 
            ? (aValue === bValue ? 0 : aValue ? -1 : 1)
            : (aValue === bValue ? 0 : aValue ? 1 : -1);
        }

        const strA = String(aValue).toLowerCase();
        const strB = String(bValue).toLowerCase();
        
        if (strA < strB) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (strA > strB) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
      setAdmins(sortedAdmins);
    }
  }, [sortConfig]);

  const requestSort = (key: keyof Admin) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig?.key === key) {
      direction = sortConfig.direction === "ascending" ? "descending" : "ascending";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Admin) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <span className="opacity-0"><ChevronUp size={16} /></span>;
    }
    return sortConfig.direction === "ascending" ? (
      <ChevronUp size={16} />
    ) : (
      <ChevronDown size={16} />
    );
  };

//   // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = admins.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(admins.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);


  // Handle form submission (create or update)
  // const onSubmit = async (data: z.infer<typeof formSchema>) => {
  //   setIsSubmitting(true);
  //   try {
  //     if (editMode && currentAdminId) {
  //       // Update existing admin - changed endpoint and added proper data structure
  //       const response = await axios.put(
  //         `${API_BASE_URL}/admin/update/${currentAdminId}`, 
  //         {
  //           ...data,
  //           id: currentAdminId // Make sure to include the admin ID in the payload
  //         },
  //         {
  //           headers: {
  //             'Content-Type': 'application/json'
  //           }
  //         }
  //       );
        
  //       if (response.status !== 200) {
  //         throw new Error(response.data.message || "Failed to update admin");
  //       }
        
  //       toast({
  //         title: "Success!",
  //         description: "Admin updated successfully.",
  //       });
  //     } else {
  //       // Create new admin
  //       const response = await axios.post(
  //         `${API_BASE_URL}/admin/create`,
  //         data,
  //         {
  //           headers: {
  //             'Content-Type': 'application/json'
  //           }
  //         }
  //       );
        
  //       if (response.status !== 201) {
  //         throw new Error(response.data.message || "Failed to create admin");
  //       }
        
  //       toast({
  //         title: "Success!",
  //         description: "Admin added successfully.",
  //       });
  //     }
      
  //     // Reset form and fetch updated data
  //     resetForm();
  //     fetchAdmins();
  //   } catch (error: any) {
  //     console.error("API Error:", error);
  //     toast({
  //       title: "Error",
  //       description: error.response?.data?.message || error.message || "An error occurred",
  //       variant: "destructive"
  //     });
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };
const onSubmit = async (data: z.infer<typeof formSchema>) => {
  setIsSubmitting(true);
  try {
    if (editMode && currentAdminId) {
      // Update existing admin
      const response = await axios.put(
        `${API_BASE_URL}/admin/UpdateAdmin/${currentAdminId}`, // Changed endpoint structure
        {
          ...data
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status !== 200) {
        throw new Error(response.data.message || "Failed to update admin");
      }

      toast({
        title: "Success!",
        description: "Admin updated successfully.",
      });
    } else {
      // Create new admin
      const response = await axios.post(
        `${API_BASE_URL}/admin/create`,data,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status !== 200) {
        throw new Error(response.data.message || "Failed to create admin");
      }

      toast({
        title: "Success!",
        description: "Admin added successfully.",
      });
    }

    // Reset form and fetch updated data
    resetForm();
    fetchAdmins();
  } catch (error: any) {
    console.error("API Error:", error);
    
    // Improved error message display
    let errorMessage = "An error occurred";
    if (error.response) {
      // The request was made and the server responded with a status code
      errorMessage = error.response.data?.message || 
                    `Server responded with ${error.response.status}`;
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = "No response received from server";
    }

    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive"
    });
  } finally {
    setIsSubmitting(false);
  }
};


  // Reset form to default values
  // const resetForm = () => {
  //   form.reset();
  //   setShowAgentOptions(false);
  //   setShowSupplierOptions(false);
  //   setEditMode(false);
  //   setCurrentAdminId(null);
  // };

const resetForm = () => {
  form.reset({
    Company_name: "",
    Email: "",
    Password: "",
    Agent_account: false,
    Agent_operation: false,
    Agent_product: false,
    Supplier_account: false,
    Supplier_operation: false,
    Supplier_product: false,
  });
  setShowAgentOptions(false);
  setShowSupplierOptions(false);
  setEditMode(false);
  setCurrentAdminId(null);
};

  // Handle edit button click
  const handleEdit = (admin: Admin) => {
    form.reset({
      Company_name: admin.Company_name,
      Email: admin.Email,
      Password: "", // Password is optional for edit
      Agent_account: admin.Agent_account,
      Agent_operation: admin.Agent_operation,
      Agent_product: admin.Agent_product,
      Supplier_account: admin.Supplier_account,
      Supplier_operation: admin.Supplier_operation,
      Supplier_product: admin.Supplier_product,
    });
    
    setShowAgentOptions(
      admin.Agent_account || admin.Agent_operation || admin.Agent_product
    );
    
    setShowSupplierOptions(
      admin.Supplier_account || admin.Supplier_operation || admin.Supplier_product
    );
    
    setEditMode(true);
    setCurrentAdminId(admin.id);
  };

  // Handle delete button click
  const handleDelete = async (email: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete?");
  if (!confirmDelete) return;

    try {
      const response = await axios.delete(`${API_BASE_URL}/admin/DestroyAdmin/${email}`);
      
      if (response.status !== 200) {
        throw new Error(response.data.message || "Failed to delete admin");
      }
      
      toast({
        title: 'Success',
        description: 'Admin deleted successfully'
      });
      fetchAdmins();
    } catch (error: any) {
      console.error("Delete Error:", error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || error.message || "Failed to delete admin",
        variant: "destructive"
      });
    }
  };

  // Helper function to render permission badge
  const renderPermissionBadge = (hasPermission: boolean) => {
    return (
      <Badge variant={hasPermission ? "default" : "destructive"}>
        {hasPermission ? "Allowed" : "Not Allowed"}
      </Badge>
    );
  };

 if (loading) {
    return (
      <DashboardContainer>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </DashboardContainer>
    );
  }


  return (
    <DashboardContainer scrollable>
     <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Admin Management</CardTitle>
          <Button onClick={() => { resetForm(); document.getElementById('admin-form')?.scrollIntoView() }}>
            <Plus className="mr-2 h-4 w-4" /> Add Admin
          </Button>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
              id="admin-form"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="Company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin Name <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Enter Admin Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="Email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter Email" 
                          {...field} 
                          disabled={editMode}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="Password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Password 
                        {!editMode && <span className="text-red-500">*</span>}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder={editMode ? "Enter Password" : "Enter Password"} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div>
                <CardDescription className="mb-2">
                  Give permission to Admin by selecting the field
                </CardDescription>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4 border p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FormLabel className="font-medium">Agent Permissions</FormLabel>
                      <Checkbox
                        checked={showAgentOptions}
                        onCheckedChange={setShowAgentOptions}
                      />
                    </div>
                    {showAgentOptions && (
                      <div className="space-y-4 pl-6">
                        <FormField
                          control={form.control}
                          name="Agent_account"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value || false}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel>Agent Account</FormLabel>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Agent_operation"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value || false}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel>Agent Operation</FormLabel>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Agent_product"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value || false}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel>Agent Product</FormLabel>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4 border p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FormLabel className="font-medium">Supplier Permissions</FormLabel>
                      <Checkbox
                        checked={showSupplierOptions}
                        onCheckedChange={setShowSupplierOptions}
                      />
                    </div>
                    {showSupplierOptions && (
                      <div className="space-y-4 pl-6">
                        <FormField
                          control={form.control}
                          name="Supplier_account"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value || false}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel>Supplier Account</FormLabel>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Supplier_operation"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value || false}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel>Supplier Operation</FormLabel>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Supplier_product"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value || false}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel>Supplier Product</FormLabel>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                {editMode && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={resetForm}
                    disabled={isSubmitting}
                  >
                    <X className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                )}
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    "Processing..."
                  ) : editMode ? (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Save Changes
                    </>
                  ) : (
                    "Add Admin"
                  )}
                </Button>
              </div>
            </form>
          </Form>

          {/* Admin List Section */}
          <div className="mt-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
              <h3 className="text-lg font-medium">Admin Accounts</h3>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search admins..."
                    className="pl-10 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Items per page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 per page</SelectItem>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="20">20 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => requestSort("Company_name")}
                    >
                      <div className="flex items-center gap-1">
                        Name {getSortIcon("Company_name")}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => requestSort("Email")}
                    >
                      <div className="flex items-center gap-1">
                        Email {getSortIcon("Email")}
                      </div>
                    </TableHead>
                    <TableHead>Agent Permissions</TableHead>
                    <TableHead>Supplier Permissions</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdmins.length > 0 ? (
                    filteredAdmins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell className="font-medium">{admin.Company_name}</TableCell>
                        <TableCell>{admin.Email}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">Account</span>
                            {renderPermissionBadge(admin.Agent_account)}
                            </div>
                            <div className="flex items-center gap-2">
                            <span className="text-sm">Operation</span>
                            {renderPermissionBadge(admin.Agent_operation)}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">Product</span>
                            {renderPermissionBadge(admin.Agent_product)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                            <span className="text-sm">Account</span>
                            {renderPermissionBadge(admin.Supplier_account)}
                            </div>
                            <div className="flex items-center gap-2">
                            <span className="text-sm">Operation</span>
                            {renderPermissionBadge(admin.Supplier_operation)}
                            </div>
                            <div className="flex items-center gap-2">
                            <span className="text-sm">Product</span>
                            {renderPermissionBadge(admin.Supplier_product)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(admin)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(admin.Email)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No admins found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => paginate(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
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
                          onClick={() => paginate(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <>
                        <span className="px-2">...</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => paginate(totalPages)}
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {filteredAdmins.length > 0 ? (
                filteredAdmins.map((admin) => (
                  <Card key={admin.id}>
                    <CardHeader className="flex flex-row justify-between items-start p-4">
                      <div>
                        <CardTitle className="text-lg">{admin.Company_name}</CardTitle>
                        <div className="text-sm text-muted-foreground">{admin.Email}</div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(admin)}
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(admin.Email)}
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-500">Agent Permissions</div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={admin.Agent_account ? "default" : "destructive"}>
                              {admin.Agent_account ? "Allowed" : "Not Allowed"}
                            </Badge>
                            <span className="text-sm">Account</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={admin.Agent_operation ? "default" : "destructive"}>
                              {admin.Agent_operation ? "Allowed" : "Not Allowed"}
                            </Badge>
                            <span className="text-sm">Operation</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={admin.Agent_product ? "default" : "destructive"}>
                              {admin.Agent_product ? "Allowed" : "Not Allowed"}
                            </Badge>
                            <span className="text-sm">Product</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-500">Supplier Permissions</div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={admin.Supplier_account ? "default" : "destructive"}>
                              {admin.Supplier_account ? "Allowed" : "Not Allowed"}
                            </Badge>
                            <span className="text-sm">Account</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={admin.Supplier_operation ? "default" : "destructive"}>
                              {admin.Supplier_operation ? "Allowed" : "Not Allowed"}
                            </Badge>
                            <span className="text-sm">Operation</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={admin.Supplier_product ? "default" : "destructive"}>
                              {admin.Supplier_product ? "Allowed" : "Not Allowed"}
                            </Badge>
                            <span className="text-sm">Product</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-4">No admins found</div>
              )}

              {/* Mobile pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => paginate(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardContainer>
  );
}