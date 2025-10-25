"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import DashboardContainer from "@/components/layout/DashboardContainer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  ArrowUpDown,
  Loader2,
  Check,
  X,
  Clock,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fetchWithAuth } from "@/components/utils/api";
import { removeToken, getToken } from "@/components/utils/auth";
import { useToast } from "@/hooks/use-toast";
interface Booking {
  id: string;
  booking_unique_id:string;
  agent_id?: number;
  vehicle_id?: string;
  supplier_id?: number;
  pickup_location?: string;
  drop_location?: string;
  pickup_lat?: string;
  pickup_lng?: string;
  drop_lat?: string;
  drop_lng?: string;
  distance_miles?: string;
  price?: string;
  currency?: string;
  status?: string;
  booked_at?: string;
  completed_at?: string | null;


  customer_name?: string;
  customer_email?: string;
  customer_mobile?: string;
  passengers?: string;
  booking_time?: string;
  booking_date?: string;
  return_trip?: string;
  return_date?: string | null;
  return_time?: string | null;
  pickup_type?: string;
  planeArrivingFrom?: string | null;
  flightNumber?: string | null;
  destinationName?: string | null;
  destinationAddress?: string | null;
}

interface Payment {
  id: string;
  booking_id: string;
  payment_method: string;
  payment_status: string;
  transaction_id: string | null;
  reference_number: string;
  amount: string;
  created_at: string;
}

interface BookingWithPayment {
  booking: Booking;
  payments: Payment | null;
}

const ITEMS_PER_PAGE = 10;

const AgentBookingsTable = () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [bookings, setBookings] = useState<BookingWithPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [agentId, setAgentId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(
    null
  );
  const [downloadingVoucher, setDownloadingVoucher] = useState<string | null>(
    null
  );
  const { toast } = useToast();
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [dateSearchTerm, setDateSearchTerm] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  }>({
    key: "booking.booked_at",
    direction: "descending", // Default to newest first
  });
  const [currentPage, setCurrentPage] = useState(1);

  const toggleRowExpansion = (bookingId: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [bookingId]: !prev[bookingId],
    }));
  };


// Add this with your other state declarations
const [statusFilter, setStatusFilter] = useState<string>("all");

// Status filter options
const statusOptions = [
  { value: "all", label: "All Bookings" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
];


  // Safe date formatting
  const safeFormatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? "Invalid date" : format(date, "PPpp");
    } catch {
      return "Invalid date";
    }
  };

// Add these helper functions near your other utility functions
const formatTime = (timeString: string | null | undefined) => {
  if (!timeString) return "N/A";
  try {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return format(date, 'h:mm a');
  } catch {
    return "Invalid time";
  }
};

const getServiceDateTime = (booking: Booking) => {
  if (!booking.booking_date) return "N/A";
  const date = safeFormatDate(booking.booking_date).split(',')[0]; // Just get the date part
  const time = formatTime(booking.booking_time);
  return `${date} at ${time}`;
};

const getReturnTripInfo = (booking: Booking) => {
  if (booking.return_trip?.toLowerCase() !== 'yes') return null;
  
  const returnDate = booking.return_date ? safeFormatDate(booking.return_date).split(',')[0] : "N/A";
  const returnTime = formatTime(booking.return_time);
  
  return {
    date: returnDate,
    time: returnTime,
    fullInfo: `Return on ${returnDate} at ${returnTime}`
  };
};


  // Check authentication status
  const isAuthenticated = !!getToken();

  // Fetch agent ID and bookings
  useEffect(() => {
    if (!isAuthenticated) {
      setError("Please log in to view your bookings");
      return;
    }
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const dashboardData = await fetchWithAuth(`${API_BASE_URL}/dashboard`);
        const userId = dashboardData.userId;
        setAgentId(userId);

        const bookingsData = await fetchWithAuth(
          `${API_BASE_URL}/agent/GetBookingByAgentId/${userId}`
        );

        // Ensure dates are properly parsed
        const normalizedData =
          bookingsData.result?.map((item: any) => ({
            booking: {
              ...item.booking,
              booked_at: item.booking.booked_at
                ? new Date(item.booking.booked_at).toISOString()
                : null,
              completed_at: item.booking.completed_at
                ? new Date(item.booking.completed_at).toISOString()
                : null,
            },
            payments: item.payments || null,
          })) || [];

        setBookings(normalizedData);
      } catch (err) {
        console.error("Error fetching data:", err);
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";
        setError(errorMessage);

        if (errorMessage.includes("Unauthorized")) {
          removeToken();
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated]);

  // Download invoice function
  const downloadInvoice = async (bookingId: string) => {
    try {
      setDownloadingInvoice(bookingId);
      const response = await fetch(
        `${API_BASE_URL}/payment/invoices/${bookingId}/download`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to download invoice");
      }

      // Get the filename from the content-disposition header or generate one
      const contentDisposition = response.headers.get("content-disposition");
      let filename = `invoice-${bookingId}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      // Create blob from response
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Invoice downloaded successfully",
      });
    } catch (error: any) {
      console.error("Error downloading invoice:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to download invoice",
        variant: "destructive",
      });
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const downloadVoucher = async (bookingId: string) => {
    try {
      setDownloadingVoucher(bookingId);
      const response = await fetch(
        `${API_BASE_URL}/payment/Voucher/${bookingId}/download`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to download voucher");
      }

      // Get the filename from the content-disposition header or generate one
      const contentDisposition = response.headers.get("content-disposition");
      let filename = `voucher-${bookingId}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      // Create blob from response
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Voucher downloaded successfully",
      });
    } catch (error: any) {
      console.error("Error downloading voucher:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to download voucher",
        variant: "destructive",
      });
    } finally {
      setDownloadingVoucher(null);
    }
  };

  // Safe filtering with null checks

  const filteredBookings = bookings.filter((item) => {
    const pickup = item.booking.pickup_location?.toLowerCase() ?? "";
    const drop = item.booking.drop_location?.toLowerCase() ?? "";
    const price =
      item.payments?.amount?.toString().toLowerCase() ??
      item.booking.price?.toString().toLowerCase() ??
      "";
    const bookingStatus = item.booking.status?.toLowerCase() ?? "";
    const paymentStatus = item.payments?.payment_status?.toLowerCase() ?? "";
    const search = searchTerm.toLowerCase();

    // Date filtering
    const bookingDate = item.booking.booked_at
      ? format(new Date(item.booking.booked_at), "yyyy-MM-dd")
      : "";
    const dateSearch = dateSearchTerm.toLowerCase();

 // Status filtering
  const statusMatch = 
    statusFilter === "all" || 
    bookingStatus === statusFilter.toLowerCase();


    return (
      (pickup.includes(search) ||
        drop.includes(search) ||
        price.includes(search) ||
        bookingStatus.includes(search) ||
        paymentStatus.includes(search)) &&
      (dateSearchTerm === "" || bookingDate.includes(dateSearch)) &&
    statusMatch
    );
  });

  // Sort bookings with null checks and date handling
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    if (!sortConfig) return 0;

    let aValue, bValue;

    if (sortConfig.key.includes("booking.")) {
      const key = sortConfig.key.replace("booking.", "") as keyof Booking;
      aValue = a.booking[key] || "";
      bValue = b.booking[key] || "";

      // Special handling for dates
      if (key === "booked_at" || key === "completed_at") {
        const dateA = new Date(aValue).getTime();
        const dateB = new Date(bValue).getTime();
        return sortConfig.direction === "ascending"
          ? dateA - dateB
          : dateB - dateA;
      }
    } else if (sortConfig.key.includes("payments.")) {
      const key = sortConfig.key.replace("payments.", "") as keyof Payment;
      aValue = a.payments?.[key] || "";
      bValue = b.payments?.[key] || "";
    } else {
      return 0;
    }

    if (aValue < bValue) {
      return sortConfig.direction === "ascending" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === "ascending" ? 1 : -1;
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedBookings.length / ITEMS_PER_PAGE);
  const paginatedBookings = sortedBookings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig?.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getStatusBadge = (
    status: string | undefined,
    type: "booking" | "payment"
  ) => {
    if (!status) {
      return <Badge variant="outline">N/A</Badge>;
    }

    const statusText = status.toLowerCase();

    
if (type === "booking") {
    switch (statusText) {
      case "approved":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">
            <Clock className="h-3 w-3 mr-1" />
            Upcoming
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <Check className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <X className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{statusText}</Badge>;
    }


    } else {
      // Payment status
      switch (statusText) {
        case "completed":
          return (
            <Badge className="bg-green-500 hover:bg-green-600">
              <Check className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          );
        case "pending":
          return (
            <Badge className="bg-yellow-500 hover:bg-yellow-600">
              <Clock className="h-3 w-3 mr-1" />
              Pending
            </Badge>
          );
        case "failed":
          return (
            <Badge variant="destructive">
              <X className="h-3 w-3 mr-1" />
              Failed
            </Badge>
          );
        default:
          return <Badge variant="outline">{statusText}</Badge>;
      }
    }
  };

  if (!isAuthenticated || error?.includes("Unauthorized")) {
    return (
      <DashboardContainer scrollable>
        <div className="flex items-center justify-center h-full">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center">Session Expired</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-destructive">
                Your session has expired. Please log in again.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardContainer>
    );
  }

  if (error) {
    return (
      <DashboardContainer scrollable>
        <div className="flex items-center justify-center h-full">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-destructive">{error}</p>
            </CardContent>
          </Card>
        </div>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer scrollable>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle>My Bookings</CardTitle>
              <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">

 {/* Status Filter Dropdown - Add this as the first item */}
      <div className="relative w-full md:w-48">
        <select
          className="w-full p-2 border rounded bg-background text-sm"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search bookings..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
                <div className="relative w-full md:w-64">
                  <Input
                    type="date"
                    placeholder="Filter by date"
                    value={dateSearchTerm}
                    onChange={(e) => {
                      setDateSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pr-8" // Add padding for the clear button
                  />
                  {dateSearchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        setDateSearchTerm("");
                        setCurrentPage(1);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : bookings.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                {agentId ? "No bookings found" : "Loading your bookings..."}
              </p>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            <Button
                              variant="ghost"
                              onClick={() =>
                                requestSort("booking.pickup_location")
                              }
                              className="p-0 hover:bg-transparent"
                            >
                              Pickup
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </TableHead>
                          <TableHead>
                            <Button
                              variant="ghost"
                              onClick={() =>
                                requestSort("booking.drop_location")
                              }
                              className="p-0 hover:bg-transparent"
                            >
                              Drop
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </TableHead>
                          <TableHead>
                            <Button
                              variant="ghost"
                              onClick={() => requestSort("booking.status")}
                              className="p-0 hover:bg-transparent"
                            >
                              Status
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </TableHead>
                          <TableHead>
                            <Button
                              variant="ghost"
                              onClick={() => requestSort("booking.booked_at")}
                              className="p-0 hover:bg-transparent"
                            >
                              Booked At
                              {sortConfig?.key === "booking.booked_at" ? (
                                sortConfig.direction === "ascending" ? (
                                  <ChevronUp className="ml-2 h-4 w-4" />
                                ) : (
                                  <ChevronDown className="ml-2 h-4 w-4" />
                                )
                              ) : (
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                              )}
                            </Button>
                          </TableHead>
                          <TableHead className="text-right">Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedBookings.map((item) => (
                          <>
                            <TableRow key={item.booking.id}>
                              <TableCell className="font-medium">
                                {item.booking.pickup_location || "N/A"}
                              </TableCell>
                              <TableCell>
                                {item.booking.drop_location || "N/A"}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(item.booking.status, "booking")}
                              </TableCell>
                              <TableCell>
                                {safeFormatDate(item.booking.booked_at)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    toggleRowExpansion(item.booking.id)
                                  }
                                  className="h-8"
                                >
                                  {expandedRows[item.booking.id] ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                  <span className="ml-1">Details</span>
                                </Button>
                              </TableCell>
                            </TableRow>
                            {expandedRows[item.booking.id] && (
                              <TableRow className="bg-gray-50">
                                <TableCell colSpan={5}>
                                  <div className="p-4 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <h4 className="text-sm font-medium text-gray-500">
                                          Booking ID
                                        </h4>
                                        {/* <p>{item.booking.id}</p> */}
                                        <p>{item.booking.booking_unique_id}</p>
                                      </div>
                                      <div>
                                        <h4 className="text-sm font-medium text-gray-500">
                                          Price
                                        </h4>
                                        <p>
                                          {item.booking?.currency}{" "}
                                          {item.payments?.amount ||
                                            item.booking.price ||
                                            "0"}
                                        </p>
                                      </div>
                                      <div>
                                        <h4 className="text-sm font-medium text-gray-500">
                                          Payment Status
                                        </h4>
                                        <p>
                                          {getStatusBadge(
                                            item.payments?.payment_status,
                                            "payment"
                                          )}
                                        </p>
                                      </div>
                                      <div>
                                        <h4 className="text-sm font-medium text-gray-500">
                                          Payment Method
                                        </h4>
                                        <p>
                                          {item.payments?.payment_method ||
                                            "N/A"}
                                        </p>
                                      </div>
                                      {item.payments?.transaction_id && (
                                        <div>
                                          <h4 className="text-sm font-medium text-gray-500">
                                            Transaction ID
                                          </h4>
                                          <p>{item.payments.transaction_id}</p>
                                        </div>
                                      )}
                                      {item.payments?.reference_number && (
                                        <div>
                                          <h4 className="text-sm font-medium text-gray-500">
                                            Reference Number
                                          </h4>
                                          <p>
                                            {item.payments.reference_number}
                                          </p>
                                        </div>
                                      )}


<div>
            <h4 className="text-sm font-medium text-gray-500">
              Passenger Details
            </h4>
            <p>
              {item.booking.customer_name || 'N/A'} ({item.booking.passengers || 'N/A'} passengers)
            </p>
            <p className="text-sm text-gray-600">
              {item.booking.customer_mobile || 'N/A'}
            </p>
            <p className="text-sm text-gray-600">
              {item.booking.customer_email || 'N/A'}
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500">
              Service Date & Time
            </h4>
            <p>{getServiceDateTime(item.booking)}</p>
            {item.booking.pickup_type && (
              <p className="text-sm text-gray-600">
                Pickup from: {item.booking.pickup_type}
                {item.booking.planeArrivingFrom && ` (${item.booking.planeArrivingFrom})`}
                {item.booking.flightNumber && ` - Flight ${item.booking.flightNumber}`}
              </p>
            )}
          </div>
          
          {getReturnTripInfo(item.booking) && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">
                Return Trip
              </h4>
              <p>{getReturnTripInfo(item.booking)?.fullInfo}</p>
            </div>
          )}
          
          <div>
            <h4 className="text-sm font-medium text-gray-500">
              Destination
            </h4>
            <p>{item.booking.destinationName || 'N/A'}</p>
            {item.booking.destinationAddress && (
              <p className="text-sm text-gray-600">
                {item.booking.destinationAddress}
              </p>
            )}
          </div>

                                      <div className="flex gap-2">
                                        {(item.payments?.payment_status?.toLowerCase() ===
                                        "completed" || 
item.payments?.payment_status?.toLowerCase() === "successful") && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            downloadInvoice(item.booking.id)
                                          }
                                          disabled={
                                            downloadingInvoice ===
                                            item.booking.id
                                          }
                                        >
                                          {downloadingInvoice ===
                                          item.booking.id ? (
                                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                          ) : (
                                            <Download className="h-4 w-4 mr-1" />
                                          )}
                                          Invoice
                                        </Button>
                                        )}
                                         {(item.booking.status?.toLowerCase() === "approved" || item.booking.status?.toLowerCase() === "completed") && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            downloadVoucher(item.booking.id)
                                          }
                                          disabled={
                                            downloadingVoucher ===
                                            item.booking.id
                                          }
                                        >
                                          {downloadingVoucher ===
                                          item.booking.id ? (
                                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                          ) : (
                                            <Download className="h-4 w-4 mr-1" />
                                          )}
                                          Voucher
                                        </Button>
                                         )}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-end space-x-2 py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
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
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {paginatedBookings
                    .sort((a, b) => {
                      const dateA = new Date(
                        a.booking.booked_at || 0
                      ).getTime();
                      const dateB = new Date(
                        b.booking.booked_at || 0
                      ).getTime();
                      return dateB - dateA; // Descending order
                    })
                    .map((item) => (
                      <Card key={item.booking.id}>
                        <CardHeader className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">
                                {item.booking.pickup_location || "N/A"} →{" "}
                                {item.booking.drop_location || "N/A"}
                              </CardTitle>
                              <div className="mt-2 flex items-center gap-2">
                                {getStatusBadge(item.booking.status, "booking")}
                              </div>
                              <div className="mt-2 text-sm text-gray-500">
                                {safeFormatDate(item.booking.booked_at)}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                toggleRowExpansion(item.booking.id)
                              }
                            >
                              {expandedRows[item.booking.id] ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </CardHeader>
                        {expandedRows[item.booking.id] && (
                          <CardContent className="p-4 pt-0 border-t">
                            <div className="space-y-3">
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">
                                  Booking ID
                                </h4>
                                {/* <p className="text-sm">{item.booking.id}</p> */}
                                <p className="text-sm">{item.booking.booking_unique_id}</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">
                                  Price
                                </h4>
                                <p className="text-sm">
                                  {item.booking?.currency}{" "}
                                  {item.payments?.amount ||
                                    item.booking.price ||
                                    "0"}
                                </p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">
                                  Payment Status
                                </h4>
                                <p className="text-sm">
                                  {getStatusBadge(
                                    item.payments?.payment_status,
                                    "payment"
                                  )}
                                </p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">
                                  Payment Method
                                </h4>
                                <p className="text-sm">
                                  {item.payments?.payment_method || "N/A"}
                                </p>
                              </div>
                              {item.payments?.transaction_id && (
                                <div>
                                  <h4 className="text-sm font-medium text-gray-500">
                                    Transaction ID
                                  </h4>
                                  <p className="text-sm">
                                    {item.payments.transaction_id}
                                  </p>
                                </div>
                              )}
                              {item.payments?.reference_number && (
                                <div>
                                  <h4 className="text-sm font-medium text-gray-500">
                                    Reference Number
                                  </h4>
                                  <p className="text-sm">
                                    {item.payments.reference_number}
                                  </p>
                                </div>
                              )}

<div>
        <h4 className="text-sm font-medium text-gray-500">
          Passenger Details
        </h4>
        <p className="text-sm">
          {item.booking.customer_name || 'N/A'} ({item.booking.passengers || 'N/A'} passengers)
        </p>
        <p className="text-xs text-gray-600">
          {item.booking.customer_mobile || 'N/A'} • {item.booking.customer_email || 'N/A'}
        </p>
      </div>
      
      <div>
        <h4 className="text-sm font-medium text-gray-500">
          Service Date & Time
        </h4>
        <p className="text-sm">{getServiceDateTime(item.booking)}</p>
        {item.booking.pickup_type && (
          <p className="text-xs text-gray-600">
            Pickup from: {item.booking.pickup_type}
            {item.booking.planeArrivingFrom && ` (${item.booking.planeArrivingFrom})`}
            {item.booking.flightNumber && ` - Flight ${item.booking.flightNumber}`}
          </p>
        )}
      </div>
      
      {getReturnTripInfo(item.booking) && (
        <div>
          <h4 className="text-sm font-medium text-gray-500">
            Return Trip
          </h4>
          <p className="text-sm">{getReturnTripInfo(item.booking)?.fullInfo}</p>
        </div>
      )}
      
      <div>
        <h4 className="text-sm font-medium text-gray-500">
          Destination
        </h4>
        <p className="text-sm">{item.booking.destinationName || 'N/A'}</p>
        {item.booking.destinationAddress && (
          <p className="text-xs text-gray-600">
            {item.booking.destinationAddress}
          </p>
        )}
      </div>

                              <div className="flex gap-2">
                                {(item.payments?.payment_status?.toLowerCase() ===
                                        "completed" || 
item.payments?.payment_status?.toLowerCase() === "successful") && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    downloadInvoice(item.booking.id)
                                  }
                                  disabled={
                                    downloadingInvoice === item.booking.id
                                  }
                                >
                                  {downloadingInvoice === item.booking.id ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  ) : (
                                    <Download className="h-4 w-4 mr-1" />
                                  )}
                                  Invoice
                                </Button>
                                )}
                                {(item.booking.status?.toLowerCase() === "approved" || item.booking.status?.toLowerCase() === "completed") && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    downloadVoucher(item.booking.id)
                                  }
                                  disabled={
                                    downloadingVoucher === item.booking.id
                                  }
                                >
                                  {downloadingVoucher === item.booking.id ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  ) : (
                                    <Download className="h-4 w-4 mr-1" />
                                  )}
                                  Voucher
                                </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))}

                  {/* Pagination for mobile */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between space-x-2 py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                      >
                        Next
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

export default AgentBookingsTable;
