
"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus, Search, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchWithAuth } from "@/components/utils/api";
import { removeToken, getToken } from "@/components/utils/auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import DashboardContainer from "@/components/layout/DashboardContainer";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import ZonePicker from "@/components/ZonePicker";
import Link from "next/link";

const formSchema = z.object({
  name: z.string().min(1, { message: "Zone name is required" }),
  address: z.string().min(1, { message: "Address is required" }),
  radius_miles: z.string().min(1, { message: "Radius is required" }),
  latitude: z.string().min(1, { message: "Latitude is required" }),
  longitude: z.string().min(1, { message: "Longitude is required" }),
});

const ITEMS_PER_PAGE = 5;

const Page = () => {
  const { toast } = useToast();
  const router = useRouter();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [zones, setZones] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ 
    key: 'name' | 'address' | 'radius_miles'; 
    direction: 'ascending' | 'descending' 
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      radius_miles: "5",
      latitude: "",
      longitude: "",
    },
  });

  // Filter zones based on search term
  const filteredZones = zones.filter(zone => 
    zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (zone.address && zone.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
    zone.radius_miles.toString().includes(searchTerm)
  );

  // Sort zones
  const sortedZones = [...filteredZones].sort((a, b) => {
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
  const totalPages = Math.ceil(sortedZones.length / ITEMS_PER_PAGE);
  const paginatedZones = sortedZones.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const requestSort = (key: 'name' | 'address' | 'radius_miles') => {
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

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isDialogOpen && !editingId) {
      form.reset({
        name: "",
        address: "",
        radius_miles: "5",
        latitude: "",
        longitude: "",
      });
    }
  }, [isDialogOpen, editingId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const userData = await fetchWithAuth(`${API_BASE_URL}/dashboard`);
      setSupplierId(userData.userId);

      const zoneResponse = await fetchWithAuth(
        `${API_BASE_URL}/supplier/getZonebySupplierId/${userData.userId}`
      );
      setZones(zoneResponse);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      
      if (err.cause?.status === 401 || err.message.includes("401")) {
        toast({ 
          title: "Session Expired", 
          description: "Please login again",
          variant: "destructive"
        });
        removeToken();
        router.push("/login");
      } else {
        toast({ 
          title: "Error", 
          description: err.message || "Failed to fetch data",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    fetchData();
  }, [API_BASE_URL, router]);

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      const token = getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const userData = await fetchWithAuth(`${API_BASE_URL}/dashboard`);
      
      const url = editingId
        ? `${API_BASE_URL}/supplier/update-zone/${editingId}`
        : `${API_BASE_URL}/supplier/new-zone`;

      const method = editingId ? "PUT" : "POST";

      await fetchWithAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...data,
          supplier_id: userData.userId 
        }),
      });

      toast({ 
        title: "Success!", 
        description: `Zone ${editingId ? "updated" : "created"} successfully.` 
      });
      
      await fetchData();
      setIsDialogOpen(false);
      form.reset();
      setEditingId(null);
      setCurrentPage(1); // Reset to first page after submission
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Operation failed",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (zone: any) => {
    setEditingId(zone.id);
    form.reset({
      name: zone.name,
      address: zone.address,
      radius_miles: zone.radius_miles.toString(),
      latitude: zone.latitude.toString(),
      longitude: zone.longitude.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete?");
  if (!confirmDelete) return;
    try {
      await fetchWithAuth(`${API_BASE_URL}/supplier/deleteZone/${id}`, {
        method: "DELETE",
      });

      setZones((prevZones) => prevZones.filter((zone) => zone.id !== id));
      toast({ title: "Deleted", description: "Zone deleted successfully!" });
      // Adjust current page if we deleted the last item on the page
      if (paginatedZones.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete zone", 
        variant: "destructive" 
      });
    }
  };

  if (isLoading) {
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
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
  <div className="w-full md:w-auto">
    <CardTitle className="text-lg md:text-xl">Zones Management</CardTitle>
    <CardDescription className="text-xs md:text-sm">
      {filteredZones.length} zone{filteredZones.length !== 1 ? 's' : ''} found
    </CardDescription>
  </div>
  <div className="flex flex-col md:flex-row items-stretch w-full md:w-auto gap-2">
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search zones..."
        className="pl-9 w-full text-sm"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setCurrentPage(1);
        }}
      />
    </div>
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          onClick={() => setEditingId(null)}
          className="w-full md:w-auto"
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4" /> Create Zone
        </Button>
      </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingId ? "Edit Zone" : "Create New Zone"}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zone Name <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Enter zone name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zone Address <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <ZonePicker
                              onChange={field.onChange}
                              setValue={form.setValue}
                              initialValue={form.getValues("address")}
                              initialCoords={{
                                lat: parseFloat(form.getValues("latitude")) || undefined,
                                lng: parseFloat(form.getValues("longitude")) || undefined,
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="radius_miles"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Radius (miles) <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter radius in miles"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Hidden fields for coordinates */}
                    <FormField
                      control={form.control}
                      name="latitude"
                      render={({ field }) => (
                        <FormItem className="hidden">
                          <FormControl>
                            <Input type="hidden" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="longitude"
                      render={({ field }) => (
                        <FormItem className="hidden">
                          <FormControl>
                            <Input type="hidden" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-4 pt-4">
                      <Button
                        variant="secondary"
                        onClick={() => setIsDialogOpen(false)}
                        type="button"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Saving..." : editingId ? "Update" : "Create"} Zone
                      </Button>
                      <Button variant="outline"><Link href="/dashboard/supplier/VehicleTransfer">Add Transfer</Link></Button>
                    </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              <Button asChild className="w-full md:w-auto"
                        size="sm" variant="outline"><Link href="/dashboard/supplier/VehicleTransfer">Add Transfer</Link></Button>
            </div>
          </CardHeader>

          <CardContent>
            {zones.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No zones found</p>
                <Button 
                  onClick={() => {
                    setEditingId(null);
                    setIsDialogOpen(true);
                  }}
                  className="mt-4"
                >
                  <Plus className="mr-2 h-4 w-4" /> Create First Zone
                </Button>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => requestSort('name')}
                            className="p-0 hover:bg-transparent font-medium"
                          >
                            Zone Name
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => requestSort('address')}
                            className="p-0 hover:bg-transparent font-medium"
                          >
                            Address
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => requestSort('radius_miles')}
                            className="p-0 hover:bg-transparent font-medium"
                          >
                            Radius
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-left">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedZones.length > 0 ? (
                        paginatedZones.map((zone) => (
                          <TableRow key={zone.id}>
                            <TableCell className="font-medium">{zone.name}</TableCell>
                            <TableCell>{zone.address || "N/A"}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{zone.radius_miles} miles</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(zone)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(zone.id)}
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
                        Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredZones.length)}-
                        {Math.min(currentPage * ITEMS_PER_PAGE, filteredZones.length)} of {filteredZones.length} zones
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

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {paginatedZones.length > 0 ? (
                    paginatedZones.map((zone) => (
                      <Card key={zone.id}>
                        <CardHeader className="flex flex-row justify-between items-start p-4">
                          <div>
                            <CardTitle className="text-lg">{zone.name}</CardTitle>
                            <div className="mt-2">
                              <Badge variant="outline">{zone.radius_miles} miles</Badge>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(zone)}
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(zone.id)}
                              className="h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-gray-500">Address</div>
                            <div className="text-sm">{zone.address || "N/A"}</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No zones found
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
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardContainer>
  );
};

export default Page;