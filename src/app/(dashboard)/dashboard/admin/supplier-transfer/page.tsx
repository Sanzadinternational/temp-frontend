
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DashboardContainer from "@/components/layout/DashboardContainer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Supplier {
  id: number;
  Company_name: string;
}

interface Transfer {
  id: string;
  Zone_name: string;
  radius_miles:string;
  VehicleType: string;
  VehicleModel: string;
  VehicleBrand: string;
  ServiceType: string;
  price: string;
  Currency: string;
  extra_price_per_mile: string;
  NightTime: string;
  NightTime_Price: string;
  vehicleTax: string;
  vehicleTaxType: string;
  tollTax: string;
  parking: string;
  driverTips: string;
  driverCharge: string;
}

const ITEMS_PER_PAGE = 5;

const TransferDataPage = () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [isFetchingTransfers, setIsFetchingTransfers] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/admin/AllGetSuppliers`);
        if (!response.ok) {
          throw new Error("Failed to fetch suppliers");
        }
        const data = await response.json();
        setSuppliers(data);
      } catch (error: any) {
        console.error("Error fetching suppliers:", error);
        toast({
          title: "Error",
          description: "Failed to load suppliers",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuppliers();
  }, [API_BASE_URL, toast]);

  const fetchTransfers = async (supplierId: string) => {
    try {
      setIsFetchingTransfers(true);
      const response = await fetch(
        `${API_BASE_URL}/supplier/getTransferBySupplierId/${supplierId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch transfers");
      }
      const data = await response.json();
      setTransfers(data);
      setCurrentPage(1); // Reset to first page when new supplier is selected
    } catch (error: any) {
      console.error("Error fetching transfers:", error);
      toast({
        title: "Error",
        description: "Failed to load transfer data",
        variant: "destructive",
      });
      setTransfers([]);
    } finally {
      setIsFetchingTransfers(false);
    }
  };

  const handleSupplierChange = (value: string) => {
    setSelectedSupplier(value);
    fetchTransfers(value);
  };

  // Pagination logic
  const totalPages = Math.ceil(transfers.length / ITEMS_PER_PAGE);
  const paginatedTransfers = transfers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <DashboardContainer>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Transfer Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="w-full max-w-md">
                <Select
                  onValueChange={handleSupplierChange}
                  value={selectedSupplier}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        isLoading ? "Loading suppliers..." : "Select a supplier"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem
                        key={supplier.id}
                        value={supplier.id.toString()}
                      >
                        {supplier.Company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedSupplier && (
          <Card>
            <CardHeader>
              <CardTitle>Transfer Details</CardTitle>
            </CardHeader>
            <CardContent>
              {isFetchingTransfers ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : transfers.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No transfer data found for this supplier
                </p>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Zone</TableHead>
                            <TableHead>Vehicle Info</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Extras</TableHead>
                            <TableHead>Night Time</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedTransfers.map((transfer) => (
                            <TableRow key={transfer.id}>
                              <TableCell>
                                <div className="flex flex-col space-y-1">
                                  <span>{transfer.Zone_name}</span>
                                  <span><strong>Radius:</strong>{transfer.radius_miles} miles</span>
                                </div>
                                {/* {transfer.Zone_name} */}
                                </TableCell>
                              <TableCell>
                                <div className="flex flex-col space-y-1">
                                  <span><strong>Type:</strong> {transfer.VehicleType}</span>
                                  <span><strong>Model:</strong> {transfer.VehicleModel}</span>
                                  <span><strong>Brand:</strong> {transfer.VehicleBrand}</span>
                                  <span><strong>Service:</strong> {transfer.ServiceType}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col space-y-1">
                                  <span><strong>Base:</strong> {transfer.price} {transfer.Currency}</span>
                                  <span><strong>Per Mile:</strong> {transfer.extra_price_per_mile} {transfer.Currency}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col space-y-1">
                                  <span><strong>Tax:</strong> {transfer.vehicleTax} {transfer.vehicleTaxType === 'percentage' ? '%' : transfer.Currency}</span>
                                  <span><strong>Toll:</strong> {transfer.tollTax} {transfer.Currency}</span>
                                  <span><strong>Tips:</strong> {transfer.driverTips} {transfer.Currency}</span>
                                  <span><strong>Parking:</strong> {transfer.parking} {transfer.Currency}</span>
                                  <span><strong>Driver:</strong> {transfer.driverCharge} {transfer.Currency}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {transfer.NightTime === 'yes' ? (
                                  <div className="flex flex-col space-y-1">
                                    <Badge variant="destructive">Night Time</Badge>
                                    <span>{transfer.NightTime_Price} {transfer.Currency}</span>
                                  </div>
                                ) : (
                                  <Badge variant="outline">Day Time</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Desktop Pagination */}
                    <div className="flex items-center justify-between px-2 py-4">
                      <div className="text-sm text-muted-foreground">
                        Showing{" "}
                        <strong>
                          {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                          {Math.min(currentPage * ITEMS_PER_PAGE, transfers.length)}
                        </strong>{" "}
                        of <strong>{transfers.length}</strong> transfers
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToPreviousPage}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(page)}
                          >
                            {page}
                          </Button>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-4">
                    {paginatedTransfers.map((transfer) => (
                      <Card key={transfer.id}>
                        <CardHeader className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg mb-2">{transfer.Zone_name}</CardTitle>
                              <Badge variant={transfer.NightTime === 'yes' ? "destructive" : "outline"}>
                                {transfer.NightTime === 'yes' ? 'Night Time' : 'Day Time'}
                              </Badge>
                              {transfer.NightTime === 'yes' && (
                                <span className="ml-2">{transfer.NightTime_Price} {transfer.Currency}</span>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold">{transfer.price} {transfer.Currency}</div>
                              <div className="text-sm">+ {transfer.extra_price_per_mile} {transfer.Currency}/mile</div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="space-y-4">
                            <div>
                              <h3 className="font-medium mb-1">Vehicle Info</h3>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div><span className="text-muted-foreground">Type:</span> {transfer.VehicleType}</div>
                                <div><span className="text-muted-foreground">Model:</span> {transfer.VehicleModel}</div>
                                <div><span className="text-muted-foreground">Brand:</span> {transfer.VehicleBrand}</div>
                                <div><span className="text-muted-foreground">Service:</span> {transfer.ServiceType}</div>
                              </div>
                            </div>

                            <div>
                              <h3 className="font-medium mb-1">Extras</h3>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div><span className="text-muted-foreground">Tax:</span> {transfer.vehicleTax} {transfer.vehicleTaxType === 'percentage' ? '%' : transfer.Currency}</div>
                                <div><span className="text-muted-foreground">Toll:</span> {transfer.tollTax} {transfer.Currency}</div>
                                <div><span className="text-muted-foreground">Tips:</span> {transfer.driverTips} {transfer.Currency}</div>
                                <div><span className="text-muted-foreground">Parking:</span> {transfer.parking} {transfer.Currency}</div>
                                <div><span className="text-muted-foreground">Driver:</span> {transfer.driverCharge} {transfer.Currency}</div>
                                <div><span className="text-muted-foreground">Zone Radius:</span> {transfer.radius_miles} miles</div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {/* Mobile Pagination */}
                    <div className="flex items-center justify-between pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardContainer>
  );
};

export default TransferDataPage;