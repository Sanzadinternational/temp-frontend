
"use client";

import * as z from "zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { removeToken, getToken } from "@/components/utils/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePicker } from "@/components/DatePicker";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, Plus, Search, ArrowUpDown, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import DashboardContainer from "@/components/layout/DashboardContainer";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Vehicle {
  id: string;
  uniqueId: string;
  VehicleBrand: string;
  ServiceType: string;
}

interface Surcharge {
  id: string;
  VehicleName: string;
  From: string;
  To: string | null;
  SurgeChargePrice: string;
  vehicle_id: string | null;
  supplier_id: string;
  Currency: string;
}

const formSchema = z.object({
  uniqueId: z.string().min(1, { message: "Please select a vehicle" }),
  DateRange: z.object({
    from: z.date({ required_error: "Start date is required" }),
    to: z.date().nullable(),
  }),
  SurgeChargePrice: z
    .string()
    .min(1, { message: "Surcharge is required" })
    .refine((val) => !isNaN(parseFloat(val)), {
      message: "Must be a valid number",
    }),
  currency: z.string().min(1, { message: "Currency is required" }),
});

const ITEMS_PER_PAGE = 5;

const Surcharge = () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const { toast } = useToast();
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [surcharges, setSurcharges] = useState<Surcharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [userCurrency, setUserCurrency] = useState<string>('USD');
 
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ 
    key: 'VehicleName' | 'From' | 'To' | 'SurgeChargePrice'; 
    direction: 'ascending' | 'descending' 
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      uniqueId: "",
      SurgeChargePrice: "",
      DateRange: { from: null, to: null },
      currency: userCurrency,
    },
    mode: "onChange",
  });

  // Update form currency when userCurrency changes
  useEffect(() => {
    if (userCurrency) {
      form.setValue('currency', userCurrency);
      form.trigger('currency');
    }
  }, [userCurrency, form]);

  // Filter surcharges based on search term
  const filteredSurcharges = surcharges.filter(surcharge => 
    surcharge.VehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (surcharge.From && new Date(surcharge.From).toLocaleDateString().includes(searchTerm)) ||
    (surcharge.To && new Date(surcharge.To).toLocaleDateString().includes(searchTerm)) ||
    surcharge.SurgeChargePrice.includes(searchTerm)
  );

  // Sort surcharges
  const sortedSurcharges = [...filteredSurcharges].sort((a, b) => {
    if (!sortConfig) return 0;
    
    const key = sortConfig.key;
    let aValue = a[key];
    let bValue = b[key];

    if (key === 'From' || key === 'To') {
      aValue = aValue ? new Date(aValue).getTime() : 0;
      bValue = bValue ? new Date(bValue).getTime() : 0;
    }

    if (aValue < bValue) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedSurcharges.length / ITEMS_PER_PAGE);
  const paginatedSurcharges = sortedSurcharges.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const requestSort = (key: 'VehicleName' | 'From' | 'To' | 'SurgeChargePrice') => {
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

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      throw new Error("No authentication token found");
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const errorData = await response.text();
        errorMessage = errorData || errorMessage;
      } catch (e) {
        console.warn("Couldn't parse error response", e);
      }
      throw new Error(`HTTP ${response.status}: ${errorMessage}`);
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength === "0" || response.status === 204) {
      return null;
    }

    try {
      return await response.json();
    } catch (e) {
      console.error("Failed to parse JSON response:", e);
      throw new Error("Invalid JSON response from server");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getToken();
        if (!token) throw new Error("No authentication token found");

        const userData = await fetchWithAuth(`${API_BASE_URL}/dashboard`);
        setSupplierId(userData.userId);
        setUserCurrency(userData.Currency || 'USD');

        const [vehiclesData, surchargesData] = await Promise.all([
          fetchWithAuth(
            `${API_BASE_URL}/supplier/getVehiclebySupplierId/${userData.userId}`
          ),
          fetchWithAuth(
            `${API_BASE_URL}/supplier/GetSurgeCharges/${userData.userId}`
          ),
        ]);

        setVehicles(
          Array.isArray(vehiclesData)
            ? vehiclesData.map((v) => ({
                id: v.id?.toString(),
                uniqueId: v.id?.toString(),
                VehicleBrand: v.VehicleBrand || "Unknown Brand",
                ServiceType: v.ServiceType || "Unknown Service",
              }))
            : []
        );

        setSurcharges(Array.isArray(surchargesData) ? surchargesData : []);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "Something went wrong");

        if (err.response?.status === 401 || err.message.includes("401")) {
          toast({
            title: "Session Expired",
            description: "Please login again",
            variant: "destructive",
          });
          removeToken();
          router.push("/login");
          return;
        }

        toast({
          title: "Error",
          description: err.message || "Failed to fetch data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API_BASE_URL, router, toast, showForm]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const selectedVehicle = vehicles.find(
        (v) => v.uniqueId === data.uniqueId
      );
      if (!selectedVehicle) throw new Error("Invalid vehicle selection");

      const payload = {
        VehicleName: selectedVehicle.VehicleBrand,
        From: format(data.DateRange.from, "yyyy-MM-dd"),
        To: data.DateRange.to ? format(data.DateRange.to, "yyyy-MM-dd") : null,
        SurgeChargePrice: data.SurgeChargePrice,
        uniqueId: data.uniqueId,
        supplier_id: supplierId,
        Currency: data.currency,
      };

      const url = editingId
        ? `${API_BASE_URL}/supplier/UpdateSurgeCharges/${editingId}`
        : `${API_BASE_URL}/supplier/SurgeCharges`;

      await fetchWithAuth(url, {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      toast({
        title: "Success",
        description: `Surcharge ${
          editingId ? "updated" : "added"
        } successfully!`,
      });
      
      setShowForm(false);
      setEditingId(null);
      form.reset();

      const updatedSurcharges = await fetchWithAuth(
        `${API_BASE_URL}/supplier/GetSurgeCharges/${supplierId}`
      );
      setSurcharges(Array.isArray(updatedSurcharges) ? updatedSurcharges : []);
      setCurrentPage(1);
    } catch (error: any) {
      console.error("Submission error:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit surcharge",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (surcharge: Surcharge) => {
    setEditingId(surcharge.id);
    const vehicleId = surcharge.vehicle_id ? String(surcharge.vehicle_id) : "";

    form.reset({
      uniqueId: vehicleId,
      SurgeChargePrice: surcharge.SurgeChargePrice,
      DateRange: {
        from: new Date(surcharge.From),
        to: surcharge.To ? new Date(surcharge.To) : null,
      },
      currency: surcharge.Currency || userCurrency,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete?");
  if (!confirmDelete) return;
    try {
      await fetchWithAuth(`${API_BASE_URL}/supplier/DeleteSurgeCharges/${id}`, {
        method: "DELETE",
      });

      setSurcharges((prev) => prev.filter((item) => item.id !== id));
      toast({
        title: "Deleted",
        description: "Surcharge deleted successfully",
      });
      if (paginatedSurcharges.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error: any) {
      console.error("Deletion error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete surcharge",
        variant: "destructive",
      });
    }
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

  if (error) {
    return (
      <DashboardContainer>
        <div className="flex justify-center items-center my-8">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Error</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-red-500 text-center">{error}</div>
              <Button
                className="mt-4 w-full"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer scrollable>
      <div className="space-y-4">
        <Card>
          
<CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
  <div>
    <CardTitle className="text-lg md:text-xl">Surcharge Management</CardTitle>
    <CardDescription className="text-xs md:text-sm">
      {filteredSurcharges.length} surcharge{filteredSurcharges.length !== 1 ? 's' : ''} found
    </CardDescription>
  </div>
  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full">
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search..."
        className="pl-9 w-full"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setCurrentPage(1);
        }}
      />
    </div>
    <Button
      onClick={() => {
        setEditingId(null);
        form.reset({
          uniqueId: "",
          SurgeChargePrice: "",
          DateRange: { from: null, to: null },
          currency: userCurrency,
        });
        setShowForm(true);
      }}
      className="w-full md:w-auto"
      size="sm"
    >
      <Plus className="mr-2 h-4 w-4" /> Add Surcharge
    </Button>
    <Button asChild className="w-full md:w-auto"
          size="sm" variant="outline"><Link href="/dashboard/supplier/AddDriver">Add Driver</Link></Button>
  </div>
</CardHeader>
          <CardContent>
            {showForm || editingId ? (
              // <div className="mb-6 p-4 border rounded-lg bg-muted/50 relative">
              <div className="mb-6 p-2 sm:p-4 border rounded-lg bg-muted/50 relative w-full overflow-hidden">

                {isSubmitting && (
                  <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                )}
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={form.control}
                      name="uniqueId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Vehicle <span className="text-red-500">*</span></FormLabel>
                          <Select
                            value={field.value}
                            defaultValue={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);
                              form.trigger("uniqueId");
                            }}
                            disabled={isSubmitting}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a vehicle" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {vehicles.map((vehicle) => (
                                <SelectItem key={vehicle.id} value={vehicle.id}>
                                  {vehicle.VehicleBrand} ({vehicle.ServiceType})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="DateRange"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Date Range <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <DatePicker
                              value={field.value}
                              onChange={(date) => {
                                field.onChange(date);
                                form.trigger("DateRange");
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="SurgeChargePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Surcharge Amount <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter surcharge amount"
                              {...field}
                              disabled={isSubmitting}
                              type="number"
                              onChange={(e) => {
                                field.onChange(e.target.value);
                                form.trigger("SurgeChargePrice");
                              }}
                              min="0"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              readOnly 
                              className="bg-muted" 
                              value={userCurrency}
                              onChange={() => {}}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-4 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowForm(false);
                          setEditingId(null);
                          form.reset();
                        }}
                        type="button"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={!form.formState.isValid || isSubmitting}
                        className={cn(
                          !form.formState.isValid && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {editingId ? "Updating..." : "Submitting..."}
                          </>
                        ) : editingId ? (
                          "Update Surcharge"
                        ) : (
                          "Add Surcharge"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            ) : null}

            {surcharges.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No surcharges available</p>
                <Button onClick={() => setShowForm(true)} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" /> Add Your First Surcharge
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
                            onClick={() => requestSort('VehicleName')}
                            className="p-0 hover:bg-transparent font-medium"
                          >
                            Vehicle
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => requestSort('From')}
                            className="p-0 hover:bg-transparent font-medium"
                          >
                            Start Date
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => requestSort('To')}
                            className="p-0 hover:bg-transparent font-medium"
                          >
                            End Date
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => requestSort('SurgeChargePrice')}
                            className="p-0 hover:bg-transparent font-medium"
                          >
                            Surcharge
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedSurcharges.length > 0 ? (
                        paginatedSurcharges.map((surcharge) => {
                          const vehicle = vehicles.find(
                            (v) => v.uniqueId === surcharge.vehicle_id
                          );
                          const fromDate = new Date(surcharge.From);
                          const toDate = surcharge.To ? new Date(surcharge.To) : null;

                          return (
                            <TableRow key={surcharge.id}>
                              <TableCell className="font-medium">
                                {vehicle?.VehicleBrand ||
                                  surcharge.VehicleName ||
                                  "Unknown Vehicle"}
                              </TableCell>
                              <TableCell>
                                {format(fromDate, "MMM dd, yyyy")}
                              </TableCell>
                              <TableCell>
                                {toDate ? format(toDate, "MMM dd, yyyy") : "N/A"}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {surcharge.Currency || userCurrency} {surcharge.SurgeChargePrice}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(surcharge)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(surcharge.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center h-24">
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
                        Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredSurcharges.length)}-
                        {Math.min(currentPage * ITEMS_PER_PAGE, filteredSurcharges.length)} of {filteredSurcharges.length} surcharges
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
                  {paginatedSurcharges.length > 0 ? (
                    paginatedSurcharges.map((surcharge) => {
                      const vehicle = vehicles.find(
                        (v) => v.uniqueId === surcharge.vehicle_id
                      );
                      const fromDate = new Date(surcharge.From);
                      const toDate = surcharge.To ? new Date(surcharge.To) : null;

                      return (
                        <Card key={surcharge.id}>
                          <CardHeader className="flex flex-row justify-between items-start p-4">
                            <div>
                              <CardTitle className="text-lg">
                                {vehicle?.VehicleBrand ||
                                  surcharge.VehicleName ||
                                  "Unknown Vehicle"}
                              </CardTitle>
                              <div className="mt-2">
                                <Badge variant="outline">
                                  {surcharge.Currency || userCurrency} {surcharge.SurgeChargePrice}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(surcharge)}
                                className="h-8 w-8"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(surcharge.id)}
                                className="h-8 w-8 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <div className="space-y-2">
                              <div className="text-sm font-medium text-gray-500">Date Range</div>
                              <div className="text-sm">
                                {format(fromDate, "MMM dd, yyyy")}
                                {toDate && (
                                  <span className="text-muted-foreground">
                                    {" "}to {format(toDate, "MMM dd, yyyy")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No surcharges found
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

export default Surcharge;