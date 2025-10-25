
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  VehicleBrand: z.string().min(1, { message: "Vehicle Brand is required" }),
  ServiceType: z.string().min(1, { message: "Service Type is required" }),
});

const ITEMS_PER_PAGE = 5;
const SERVICE_TYPES = ["Standard", "Premium"];

const VehicleBrand = () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const { toast } = useToast();
  const [brands, setBrands] = useState([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ 
    key: 'VehicleBrand' | 'ServiceType'; 
    direction: 'ascending' | 'descending' 
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { VehicleBrand: "", ServiceType: "" },
  });

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/supplier/GetVehicleBrand`);
      if (!response.ok) throw new Error("Failed to fetch brands");
  
      const data = await response.json();
      setBrands(data);
    } catch (error) {
      console.error("Error fetching brands:", error);
      setBrands([]);
      toast({
        title: "Error",
        description: "Failed to load vehicle brands",
        variant: "destructive",
      });
    }
  };

  // Filter brands based on search term
  const filteredBrands = brands.filter(brand => 
    brand.VehicleBrand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brand.ServiceType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort brands
  const sortedBrands = [...filteredBrands].sort((a, b) => {
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
  const totalPages = Math.ceil(sortedBrands.length / ITEMS_PER_PAGE);
  const paginatedBrands = sortedBrands.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const requestSort = (key: 'VehicleBrand' | 'ServiceType') => {
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
    try {
      const url = editingId
        ? `${API_BASE_URL}/supplier/UpdateVehicleBrands/${editingId}`
        : `${API_BASE_URL}/supplier/CreateVehicleBrand`;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          VehicleBrand: data.VehicleBrand,
          ServiceType: data.ServiceType,
        }),
      });

      if (!response.ok) throw new Error("Failed to save brand");

      toast({ 
        title: "Success", 
        description: `Vehicle Brand ${editingId ? "updated" : "added"} successfully!` 
      });
      form.reset();
      setEditingId(null);
      fetchBrands();
      setCurrentPage(1); // Reset to first page after submission
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Operation failed", 
        variant: "destructive" 
      });
    }
  };

  const handleEdit = (brand: any) => {
    setEditingId(brand.id);
    form.setValue("VehicleBrand", brand.VehicleBrand);
    form.setValue("ServiceType", brand.ServiceType);
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete?");
  if (!confirmDelete) return;
    try {
      const response = await fetch(`${API_BASE_URL}/supplier/DeleteVehicleBrand/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete brand");

      toast({ 
        title: "Deleted", 
        description: "Vehicle Brand removed successfully!" 
      });
      fetchBrands();
      // Adjust current page if we deleted the last item on the page
      if (paginatedBrands.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to delete brand", 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
      {/* Add/Edit Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Vehicle Brand" : "Add Vehicle Brand"}</CardTitle>
          <CardDescription>
            {editingId ? "Update the selected brand" : "Add a new brand"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="VehicleBrand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Brand</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Audi, Toyota" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ServiceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Service Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SERVICE_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="submit">
                  {editingId ? "Update Brand" : "Add Brand"}
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

      {/* Display Existing Brands */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Existing Vehicle Brands</CardTitle>
              <CardDescription>
                {filteredBrands.length} brand{filteredBrands.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search brands..."
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
                      onClick={() => requestSort('VehicleBrand')}
                      className="p-0 hover:bg-transparent font-medium"
                    >
                      Brand
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => requestSort('ServiceType')}
                      className="p-0 hover:bg-transparent font-medium"
                    >
                      Service Type
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBrands.length > 0 ? (
                  paginatedBrands.map((brand) => (
                    <TableRow key={brand.id}>
                      <TableCell className="font-medium">
                        {brand.VehicleBrand}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {brand.ServiceType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(brand)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(brand.id)}
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
                  Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredBrands.length)}-
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredBrands.length)} of {filteredBrands.length} brands
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
            {paginatedBrands.length > 0 ? (
              paginatedBrands.map((brand) => (
                <div key={brand.id} className="flex flex-col p-3 border rounded-lg gap-2">
                  <div className="font-medium">{brand.VehicleBrand}</div>
                  <div className="flex justify-between items-center">
                    <Badge variant="outline">
                      {brand.ServiceType}
                    </Badge>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(brand)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(brand.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No vehicle brands found
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

export default VehicleBrand;