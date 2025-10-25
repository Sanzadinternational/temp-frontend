
"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Search, ArrowUpDown, ChevronLeft, ChevronRight, Upload } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";

// Updated schema to handle both file and string for image (when editing)
const formSchema = z.object({
  VehicleType: z.string().min(1, { message: "Vehicle Type is required" }),
  vehicleImage: z.any().optional(), // More flexible type for image
});

const ITEMS_PER_PAGE = 5;

const VehicleType = () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const { toast } = useToast();
  const [types, setTypes] = useState([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ 
    key: 'VehicleType'; 
    direction: 'ascending' | 'descending' 
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      VehicleType: "",
      vehicleImage: null
    },
  });

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/supplier/GetVehicleType`);
      if (!response.ok) throw new Error("Failed to fetch vehicle types");
  
      const result = await response.json();
      // console.log("API Response:", result); 
      
      if (!result.success || !Array.isArray(result.data)) {
        throw new Error("Invalid data format");
      }
  
      setTypes(result.data);
    } catch (error) {
      // console.error("Error fetching vehicle types:", error);
      setTypes([]);
      toast({
        title: "Error",
        description: "Failed to load vehicle types",
        variant: "destructive",
      });
    }
  };

  // Filter types based on search term
  const filteredTypes = types.filter(type => 
    type.VehicleType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort types
  const sortedTypes = [...filteredTypes].sort((a, b) => {
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
  const totalPages = Math.ceil(sortedTypes.length / ITEMS_PER_PAGE);
  const paginatedTypes = sortedTypes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const requestSort = (key: 'VehicleType') => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("VehicleType", data.VehicleType);
      
      // Only append the image if it's a File object (new upload)
      if (data.vehicleImage instanceof File) {
        formData.append("vehicleImage", data.vehicleImage);
      }
      
      // console.log("Submitting form data:", {
      //   VehicleType: data.VehicleType,
      //   hasImage: !!data.vehicleImage,
      //   imageType: typeof data.vehicleImage
      // }); 

      const url = editingId
        ? `${API_BASE_URL}/supplier/UpdateVehicleTypes/${editingId}`
        : `${API_BASE_URL}/supplier/CreateVehicleType`;

      const method = editingId ? "PUT" : "POST";

      // console.log("Making request to:", url); 
      
      const response = await fetch(url, {
        method,
        body: formData,
      });

      const responseData = await response.json();
      // console.log("Server response:", responseData); 

      if (!response.ok) {
        throw new Error(responseData.message || "Failed to save vehicle type");
      }

      toast({ 
        title: "Success", 
        description: `Vehicle Type ${editingId ? "updated" : "added"} successfully!` 
      });
      
      form.reset({
        VehicleType: "",
        vehicleImage: null
      });
      setEditingId(null);
      fetchTypes();
      setCurrentPage(1);
    } catch (error: any) {
      // console.error("Submission error:", error); 
      toast({ 
        title: "Error", 
        description: error.message || "Operation failed", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (type: any) => {
    setEditingId(type.id);
    form.setValue("VehicleType", type.VehicleType);
    // For image, we set the value to the existing image URL
    // This is just for display purposes as we can't set file input value
    form.setValue("vehicleImage", type.vehicleImage || null);
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete?");
    if (!confirmDelete) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/supplier/DeleteVehicleType/${id}`, { 
        method: "DELETE" 
      });

      if (!response.ok) throw new Error("Failed to delete vehicle type");

      toast({ 
        title: "Deleted", 
        description: "Vehicle Type removed successfully!" 
      });
      fetchTypes();
      if (paginatedTypes.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to delete vehicle type", 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
      {/* Add/Edit Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Vehicle Type" : "Add Vehicle Type"}</CardTitle>
          <CardDescription>
            {editingId ? "Update the selected type" : "Add a new type"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="VehicleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Sedan, SUV" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vehicleImage"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Vehicle Image</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          {...fieldProps}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            onChange(file);
                          }}
                        />
                        {editingId && form.watch("vehicleImage") && typeof form.watch("vehicleImage") === "string" && (
                          <div className="relative h-10 w-10">
                            <Image 
                              src={`${API_BASE_URL}/uploads/${form.watch("vehicleImage")}`} 
                              alt="Current vehicle" 
                              fill
                              className="object-cover rounded"
                            />
                          </div>
                        )}
                        {form.watch("vehicleImage") instanceof File && (
                          <div className="text-sm text-muted-foreground">
                            New image selected: {form.watch("vehicleImage").name}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Processing..." : editingId ? "Update Type" : "Add Type"}
                </Button>
                {editingId && (
                  <Button 
                    variant="outline" 
                    type="button"
                    onClick={() => { 
                      setEditingId(null); 
                      form.reset({
                        VehicleType: "",
                        vehicleImage: null
                      }); 
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

      {/* Display Existing Vehicle Types */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Existing Vehicle Types</CardTitle>
              <CardDescription>
                {filteredTypes.length} type{filteredTypes.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search types..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
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
                  <TableHead>Image</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => requestSort('VehicleType')}
                      className="p-0 hover:bg-transparent font-medium"
                    >
                      Type
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTypes.length > 0 ? (
                  paginatedTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell>
                        {type.vehicleImage && (
                          <div className="relative h-10 w-10">
                            <Image 
                              src={`${API_BASE_URL}/uploads/${type.vehicleImage}`} 
                              alt={type.VehicleType} 
                              fill
                              className="object-cover rounded"
                            />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {type.VehicleType}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(type)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(type.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center h-24">
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
                  Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredTypes.length)}-
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredTypes.length)} of {filteredTypes.length} types
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
            {paginatedTypes.length > 0 ? (
              paginatedTypes.map((type) => (
                <div key={type.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {type.vehicleImage && (
                      <div className="relative h-10 w-10">
                        <Image 
                          src={`${API_BASE_URL}/uploads/${type.vehicleImage}`} 
                          alt={type.VehicleType} 
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    )}
                    <div className="font-medium">{type.VehicleType}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(type)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(type.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No vehicle types found
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
  );
};

export default VehicleType;