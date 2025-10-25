"use client";
import { useState, useEffect } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth } from "@/components/utils/api";
import { removeToken, getToken } from "@/components/utils/auth";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import DashboardContainer from "@/components/layout/DashboardContainer";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pencil,
  Trash2,
  Plus,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";

const formSchema = z.object({
  VehicleType: z.string().min(1, { message: "Vehicle Type is required" }),
  VehicleBrand: z.string().min(1, { message: "Vehicle Brand is required" }),
  // ServiceType: z.string().min(1, { message: "Service Type is required" }),
  ServiceType: z.string().optional(),
  VehicleModel: z.string().min(1, { message: "Vehicle Model is required" }),
  Doors: z.number(),
  Seats: z.number().min(1, { message: "Seats are required" }),
  Cargo: z.string().optional(),
  Passengers: z.number().min(1, { message: "Passengers are required" }),
  MediumBag: z.number().min(1, { message: "Medium Bag is required" }),
  SmallBag: z.number().min(1, { message: "Small Bag is required" }),
  ExtraSpace: z.array(z.string()).optional().default([]),
});

const ITEMS_PER_PAGE = 5;

const VehicleDetailsForm = () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [supplierId, setSupplierId] = useState("");
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);
  const [vehicleBrands, setVehicleBrands] = useState<any[]>([]);
  const [vehicleModels, setVehicleModels] = useState<any[]>([]);
  const [vehicleDetails, setVehicleDetails] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const userData = await fetchWithAuth(`${API_BASE_URL}/dashboard`);
      setSupplierId(userData.userId);

      const [vehicles, types, brands, models] = await Promise.all([
        fetchWithAuth(`${API_BASE_URL}/supplier/getVehicle/${userData.userId}`),
        fetchWithAuth(`${API_BASE_URL}/supplier/GetVehicleType`),
        fetchWithAuth(`${API_BASE_URL}/supplier/GetVehicleBrand`),
        fetchWithAuth(`${API_BASE_URL}/supplier/GetVehicleModel`),
      ]);

      setVehicleDetails(vehicles?.data || vehicles || []);
      setVehicleTypes(types?.data || types || []);
      setVehicleBrands(brands?.data || brands || []);
      setVehicleModels(models?.data || models || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      if (error.cause?.status === 401 || error.message.includes("401")) {
        toast({
          title: "Session Expired",
          description: "Please login again",
          variant: "destructive",
        });
        removeToken();
        window.location.href = "/login";
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      window.location.href = "/login";
      return;
    }
    fetchData();
  }, [isDialogOpen]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      VehicleType: "",
      VehicleBrand: "",
      ServiceType: "",
      VehicleModel: "",
      Doors: 1,
      Seats: 1,
      Cargo: "",
      Passengers: 1,
      MediumBag: 1,
      SmallBag: 1,
      ExtraSpace: [],
    },
  });

  useEffect(() => {
    if (isDialogOpen && !editingId) {
      form.reset({
        VehicleType: "",
        VehicleBrand: "",
        ServiceType: "",
        VehicleModel: "",
        Doors: 1,
        Seats: 1,
        Cargo: "",
        Passengers: 1,
        MediumBag: 1,
        SmallBag: 1,
        ExtraSpace: [],
      });
    }
  }, [isDialogOpen, editingId]);

  // Filter vehicles based on search term
  const filteredVehicles = vehicleDetails.filter(
    (vehicle) =>
      vehicle.VehicleBrand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.VehicleModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.VehicleType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.ServiceType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort vehicles
  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    if (!sortConfig) return 0;

    const key = sortConfig.key;
    if (a[key] < b[key]) {
      return sortConfig.direction === "ascending" ? -1 : 1;
    }
    if (a[key] > b[key]) {
      return sortConfig.direction === "ascending" ? 1 : -1;
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedVehicles.length / ITEMS_PER_PAGE);
  const paginatedVehicles = sortedVehicles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const numbers = Array.from({ length: 100 }, (_, i) => i + 1);
  const extraSpaceOptions = [
    "Roof Rack",
    "Trailer Hitch",
    "Extended Cargo Space",
  ];

  useEffect(() => {
    const selectedBrand = form.watch("VehicleBrand");
    if (selectedBrand) {
      const brandData = vehicleBrands.find(
        (brand) => brand.VehicleBrand === selectedBrand
      );
      if (brandData) {
        form.setValue("ServiceType", brandData.ServiceType);
      }
    }
  }, [form.watch("VehicleBrand")]);


  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const submitData = {
        ...data,
        ExtraSpace: data.ExtraSpace || [],
        SupplierId: supplierId,
      };

      const url = editingId
        ? `${API_BASE_URL}/supplier/UpdateVehicle/${editingId}`
        : `${API_BASE_URL}/supplier/Createvehicle`;

      await fetchWithAuth(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      toast({
        title: "Success!",
        description: `Vehicle ${
          editingId ? "updated" : "created"
        } successfully.`,
      });

      await fetchData();
      setIsDialogOpen(false);
      setEditingId(null);
      setCurrentPage(1); // Reset to first page after submission
    } catch (error: any) {
      console.error("Submission error:", error);
      if (error.cause?.status === 401) {
        toast({
          title: "Session Expired",
          description: "Please login again",
          variant: "destructive",
        });
        removeToken();
        window.location.href = "/login";
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Operation failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (vehicle: any) => {
    setEditingId(vehicle.id);
    const extraSpaceValue =
      typeof vehicle.ExtraSpace === "string"
        ? JSON.parse(vehicle.ExtraSpace)
        : vehicle.ExtraSpace || [];

    form.reset({
      VehicleType: vehicle.VehicleType || "",
      VehicleBrand: vehicle.VehicleBrand || "",
      ServiceType: vehicle.ServiceType || "",
      VehicleModel: vehicle.VehicleModel || "",
      Doors: Number(vehicle.Doors) || 1,
      Seats: Number(vehicle.Seats) || 1,
      Cargo: vehicle.Cargo || "",
      Passengers: Number(vehicle.Passengers) || 1,
      MediumBag: Number(vehicle.MediumBag) || 1,
      SmallBag: Number(vehicle.SmallBag) || 1,
      ExtraSpace: Array.isArray(extraSpaceValue) ? extraSpaceValue : [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete?");
  if (!confirmDelete) return;
    setIsLoading(true);
    try {
      await fetchWithAuth(`${API_BASE_URL}/supplier/DeleteVehicle/${id}`, {
        method: "DELETE",
      });

      setVehicleDetails((prev) => prev.filter((vehicle) => vehicle.id !== id));
      toast({ title: "Deleted", description: "Vehicle deleted successfully!" });
      // Adjust current page if we deleted the last item on the page
      if (paginatedVehicles.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error: any) {
      console.error("Deletion error:", error);
      if (error.cause?.status === 401) {
        toast({
          title: "Session Expired",
          description: "Please login again",
          variant: "destructive",
        });
        removeToken();
        window.location.href = "/login";
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to delete vehicle",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !vehicleDetails.length) {
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
    <CardTitle className="text-lg md:text-xl">Vehicle Details</CardTitle>
    <CardDescription className="text-xs md:text-sm">
      {filteredVehicles.length} vehicle{filteredVehicles.length !== 1 ? "s" : ""} found
    </CardDescription>
  </div>
  <div className="flex flex-col md:flex-row items-stretch w-full md:w-auto gap-2">
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search vehicles..."
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
          <Plus className="mr-2 h-4 w-4" /> Add Vehicle
        </Button>
      </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingId ? "Edit Vehicle" : "Add New Vehicle"}
                    </DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-[70vh] w-full pr-4">
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-4 p-1"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="VehicleType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Vehicle Type{" "}
                                  <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select Vehicle Type" />
                                    </SelectTrigger>
                                    
                                    <SelectContent>
            {vehicleTypes
              .slice()
              .sort((a, b) => a.VehicleType.localeCompare(b.VehicleType))
              .map((type) => (
                <SelectItem key={type.id} value={type.VehicleType}>
                  {type.VehicleType}
                </SelectItem>
              ))}
          </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="VehicleBrand"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Vehicle Brand{" "}
                                  <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select Vehicle Brand" />
                                    </SelectTrigger>
                                    
                                     <SelectContent>
            {vehicleBrands
              .slice()
              .sort((a, b) => a.VehicleBrand.localeCompare(b.VehicleBrand))
              .map((brand) => (
                <SelectItem key={brand.id} value={brand.VehicleBrand}>
                  {brand.VehicleBrand}
                </SelectItem>
              ))}
          </SelectContent>
                                  </Select>
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
                                <FormControl>
                                  <Input
                                    {...field}
                                    readOnly
                                    placeholder="Service type will be auto-selected"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="VehicleModel"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Vehicle Model{" "}
                                  <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select Vehicle Model" />
                                    </SelectTrigger>
                                   
                                    <SelectContent>
            {vehicleModels
              .slice()
              .sort((a, b) => a.VehicleModel.localeCompare(b.VehicleModel))
              .map((model) => (
                <SelectItem key={model.id} value={model.VehicleModel}>
                  {model.VehicleModel}
                </SelectItem>
              ))}
          </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="Doors"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Doors 
                                  {/* <span className="text-red-500">*</span> */}
                                </FormLabel>
                                <FormControl>
                                  <Select
                                    value={field.value.toString()}
                                    onValueChange={(value) =>
                                      field.onChange(Number(value))
                                    }
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select Doors" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {numbers.map((door) => (
                                        <SelectItem
                                          value={`${door}`}
                                          key={door}
                                        >
                                          {door}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="Seats"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Seats <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Select
                                    value={field.value.toString()}
                                    onValueChange={(value) =>
                                      field.onChange(Number(value))
                                    }
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select Seats" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {numbers.map((seat) => (
                                        <SelectItem
                                          value={`${seat}`}
                                          key={seat}
                                        >
                                          {seat}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="Cargo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cargo Space (litres)</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter Cargo"
                                    {...field}
                                    type="number"
                                    min="0"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="Passengers"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Passengers{" "}
                                  <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Select
                                    value={field.value.toString()}
                                    onValueChange={(value) =>
                                      field.onChange(Number(value))
                                    }
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Passengers" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {numbers.map((pax) => (
                                        <SelectItem value={`${pax}`} key={pax}>
                                          {pax}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="MediumBag"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Medium Bag{" "}
                                  <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Select
                                    value={field.value.toString()}
                                    onValueChange={(value) =>
                                      field.onChange(Number(value))
                                    }
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Medium Bag" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {numbers.map((num) => (
                                        <SelectItem key={num} value={`${num}`}>
                                          {num}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="SmallBag"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Small Bag{" "}
                                  <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Select
                                    value={field.value.toString()}
                                    onValueChange={(value) =>
                                      field.onChange(Number(value))
                                    }
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Small Bag" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {numbers.map((num) => (
                                        <SelectItem key={num} value={`${num}`}>
                                          {num}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="ExtraSpace"
                            render={({ field }) => {
                              const value = field.value || [];
                              return (
                                <FormItem className="md:col-span-2">
                                  <FormLabel>Extra Space</FormLabel>
                                  <FormControl>
                                    <div className="flex flex-col gap-2">
                                      {extraSpaceOptions.map((option) => (
                                        <div
                                          key={option}
                                          className="flex items-center space-x-2"
                                        >
                                          <Checkbox
                                            id={`extra-space-${option}`}
                                            checked={value.includes(option)}
                                            onCheckedChange={(checked) => {
                                              const newValue = checked
                                                ? [...value, option]
                                                : value.filter(
                                                    (item) => item !== option
                                                  );
                                              field.onChange(newValue);
                                            }}
                                          />
                                          <label
                                            htmlFor={`extra-space-${option}`}
                                            className="text-sm"
                                          >
                                            {option}
                                          </label>
                                        </div>
                                      ))}
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                          <Button
                            variant="secondary"
                            onClick={() => setIsDialogOpen(false)}
                            type="button"
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={isLoading}>
                            {isLoading
                              ? "Saving..."
                              : editingId
                              ? "Update"
                              : "Create"}{" "}
                            Vehicle
                          </Button>
                          
                            <Button
                            variant="outline"
                            type="button"
                          >
                            <Link href="/dashboard/supplier/AddZone">
                            Add Zone
                             </Link>
                          </Button>
                         
                        </div>
                      </form>
                    </Form>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
              <Button asChild className="w-full md:w-auto"
          size="sm" variant="outline"><Link href="/dashboard/supplier/AddZone">Add Zone</Link></Button>
            </div>
          </CardHeader>

          <CardContent>
            {vehicleDetails.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No vehicles available</p>
                <Button onClick={() => setIsDialogOpen(true)} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" /> Add Your First Vehicle
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
                            onClick={() => requestSort("VehicleBrand")}
                            className="p-0 hover:bg-transparent font-medium"
                          >
                            Vehicle
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => requestSort("VehicleType")}
                            className="p-0 hover:bg-transparent font-medium"
                          >
                            Type
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => requestSort("ServiceType")}
                            className="p-0 hover:bg-transparent font-medium"
                          >
                            Service
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>Luggage</TableHead>
                        <TableHead>Extras</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedVehicles.length > 0 ? (
                        paginatedVehicles.map((vehicle) => (
                          <TableRow key={vehicle.id}>
                            <TableCell className="font-medium">
                              <div>{vehicle.VehicleBrand}</div>
                              <div className="text-sm text-muted-foreground">
                                {vehicle.VehicleModel}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {vehicle.VehicleType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge>{vehicle.ServiceType}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <span>Seats: {vehicle.Seats}</span>
                                <span>Doors: {vehicle.Doors}</span>
                                <span>Passengers: {vehicle.Passengers}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <span>Medium: {vehicle.MediumBag}</span>
                                <span>Small: {vehicle.SmallBag}</span>
                                {vehicle.Cargo && (
                                  <span>Cargo: {vehicle.Cargo}L</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {vehicle.ExtraSpace?.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {vehicle.ExtraSpace.map((extra, index) => (
                                    <Badge key={index} variant="secondary">
                                      {extra}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-400">None</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(vehicle)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(vehicle.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center h-24">
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
                        Showing{" "}
                        {Math.min(
                          (currentPage - 1) * ITEMS_PER_PAGE + 1,
                          filteredVehicles.length
                        )}
                        -
                        {Math.min(
                          currentPage * ITEMS_PER_PAGE,
                          filteredVehicles.length
                        )}{" "}
                        of {filteredVehicles.length} vehicles
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
                          {Array.from(
                            { length: Math.min(5, totalPages) },
                            (_, i) => {
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
                                  variant={
                                    currentPage === pageNum
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  onClick={() => handlePageChange(pageNum)}
                                >
                                  {pageNum}
                                </Button>
                              );
                            }
                          )}
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
                  {paginatedVehicles.length > 0 ? (
                    paginatedVehicles.map((vehicle) => (
                      <Card key={vehicle.id}>
                        <CardHeader className="flex flex-row justify-between items-start p-4">
                          <div>
                            <CardTitle className="text-lg">
                              {vehicle.VehicleBrand} {vehicle.VehicleModel}
                            </CardTitle>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline">
                                {vehicle.VehicleType}
                              </Badge>
                              <Badge>{vehicle.ServiceType}</Badge>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(vehicle)}
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(vehicle.id)}
                              className="h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-gray-500">
                              Capacity
                            </div>
                            <div>
                              <div>Seats: {vehicle.Seats}</div>
                              <div>Doors: {vehicle.Doors}</div>
                              <div>Passengers: {vehicle.Passengers}</div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-gray-500">
                              Luggage
                            </div>
                            <div>
                              <div>Medium: {vehicle.MediumBag}</div>
                              <div>Small: {vehicle.SmallBag}</div>
                              {vehicle.Cargo && (
                                <div>Cargo: {vehicle.Cargo}L</div>
                              )}
                            </div>
                          </div>
                          <div className="col-span-2 space-y-2">
                            <div className="text-sm font-medium text-gray-500">
                              Extras
                            </div>
                            {vehicle.ExtraSpace?.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {vehicle.ExtraSpace.map((extra, index) => (
                                  <Badge key={index} variant="secondary">
                                    {extra}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400">None</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No vehicles found
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

export default VehicleDetailsForm;
