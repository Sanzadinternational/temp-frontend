
"use client";
import React from "react";
import { useEffect, useState, useCallback, useRef } from "react";
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
  booking_unique_id: string;
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
  driver_id?: string;
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

// Debounce utility function
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
};

const SupplierBookingsTable = () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [bookings, setBookings] = useState<BookingWithPayment[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const [downloadingVoucher, setDownloadingVoucher] = useState<string | null>(null);
  const [supplierEmail, setSupplierEmail] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateSearchTerm, setDateSearchTerm] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  }>({
    key: "booking.booked_at",
    direction: "descending",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // New state variables for safe email processing
  const [isProcessingEmails, setIsProcessingEmails] = useState(false);
  const processedBookingsRef = useRef<Set<string>>(new Set());
  const emailQueueRef = useRef<Booking[]>([]);

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

  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return "N/A";
    try {
      const [hours, minutes] = timeString.split(":");
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      return format(date, "h:mm a");
    } catch {
      return "Invalid time";
    }
  };

  const getServiceDateTime = (booking: Booking) => {
    if (!booking.booking_date) return "N/A";
    const date = safeFormatDate(booking.booking_date).split(",")[0];
    const time = formatTime(booking.booking_time);
    return `${date} at ${time}`;
  };

  const getReturnTripInfo = (booking: Booking) => {
    if (booking.return_trip?.toLowerCase() !== "yes") return null;
    const returnDate = booking.return_date
      ? safeFormatDate(booking.return_date).split(",")[0]
      : "N/A";
    const returnTime = formatTime(booking.return_time);
    return {
      date: returnDate,
      time: returnTime,
      fullInfo: `Return on ${returnDate} at ${returnTime}`,
    };
  };

  const isWithin24Hours = (bookingDate: string, bookingTime: string) => {
    if (!bookingDate || !bookingTime) return false;
    try {
      const [hours, minutes] = bookingTime.split(":");
      const serviceDateTime = new Date(bookingDate);
      serviceDateTime.setHours(parseInt(hours, 10));
      serviceDateTime.setMinutes(parseInt(minutes, 10));
      const now = new Date();
      const timeDiff = serviceDateTime.getTime() - now.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      return hoursDiff <= 24 && hoursDiff > 0;
    } catch {
      return false;
    }
  };

  const isPast24Hours = (bookingDate: string, bookingTime: string) => {
    if (!bookingDate || !bookingTime) return false;
    try {
      const [hours, minutes] = bookingTime.split(":");
      const serviceDateTime = new Date(bookingDate);
      serviceDateTime.setHours(parseInt(hours, 10));
      serviceDateTime.setMinutes(parseInt(minutes, 10));
      const now = new Date();
      return serviceDateTime.getTime() <= now.getTime();
    } catch {
      return false;
    }
  };

  const toggleRowExpansion = (bookingId: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [bookingId]: !prev[bookingId],
    }));
  };

  // Optimized email sending function with rate limiting
  const sendDriverAssignmentReminder = useCallback(async (booking: Booking) => {
    if (!supplierEmail) {
      console.error("Supplier email not available");
      return false;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/supplier/email/send_driver_assignment_reminder`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            supplierEmail: supplierEmail,
            bookingId: booking.booking_unique_id || booking.id,
            bookingTime: getServiceDateTime(booking),
            pickupLocation: booking.pickup_location,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send reminder email");
      }

      console.log("Reminder email sent successfully for booking:", booking.id);
      return true;
    } catch (error) {
      console.error("Error sending reminder email for booking:", booking.id, error);
      return false;
    }
  }, [supplierEmail, API_BASE_URL]);

  // Debounced email checking function
  const checkAndSendReminders = useCallback(debounce(async (bookingsToCheck: BookingWithPayment[]) => {
    if (isProcessingEmails || !supplierId || !supplierEmail) return;

    setIsProcessingEmails(true);
    
    try {
      const bookingsNeedingReminders = bookingsToCheck.filter(item => {
        const booking = item.booking;
        
        // Skip if already processed in current session
        if (processedBookingsRef.current.has(booking.id)) return false;
        
        const shouldSendReminder = (
          booking.status?.toLowerCase() === "approved" &&
          !booking.driver_id &&
          isWithin24Hours(booking.booking_date, booking.booking_time) &&
          (item.payments?.payment_status?.toLowerCase() === "completed" ||
           item.payments?.payment_status?.toLowerCase() === "successful") &&
          // Check if reminder was sent more than 6 hours ago or never sent
          (!localStorage.getItem(`reminder-sent-${booking.id}`) || 
           (localStorage.getItem(`reminder-time-${booking.id}`) && 
            (Date.now() - parseInt(localStorage.getItem(`reminder-time-${booking.id}`) || '0')) > 6 * 60 * 60 * 1000))
        );

        if (shouldSendReminder) {
          processedBookingsRef.current.add(booking.id);
          return true;
        }
        return false;
      });

      if (bookingsNeedingReminders.length === 0) {
        setIsProcessingEmails(false);
        return;
      }

      console.log(`Processing ${bookingsNeedingReminders.length} email reminders`);

      // Process emails in batches with delays
      const BATCH_SIZE = 2;
      const DELAY_BETWEEN_BATCHES = 1000; // 1 second
      
      for (let i = 0; i < bookingsNeedingReminders.length; i += BATCH_SIZE) {
        const batch = bookingsNeedingReminders.slice(i, i + BATCH_SIZE);
        
        const batchPromises = batch.map(async (item) => {
          const success = await sendDriverAssignmentReminder(item.booking);
          if (success) {
            // Mark as sent with timestamp
            localStorage.setItem(`reminder-sent-${item.booking.id}`, "true");
            localStorage.setItem(`reminder-time-${item.booking.id}`, Date.now().toString());
            
            toast({
              title: "Reminder Sent",
              description: `Email sent for booking ${item.booking.booking_unique_id}`,
            });
          }
          return success;
        });

        await Promise.allSettled(batchPromises);
        
        // Delay between batches if there are more to process
        if (i + BATCH_SIZE < bookingsNeedingReminders.length) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
        }
      }
      
    } catch (error) {
      console.error("Error in email reminder processing:", error);
    } finally {
      setIsProcessingEmails(false);
    }
  }, 1000), [isProcessingEmails, supplierId, supplierEmail, sendDriverAssignmentReminder, toast]);

  // Update driver assignment
  const updateDriverAssignment = async (bookingId: string, driverId: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/supplier/AssignDriverToBooking/${bookingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            driver_id: driverId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to assign driver");
      }

      toast({
        title: "Success",
        description: "Driver assigned successfully",
      });

      setBookings((prevBookings) =>
        prevBookings.map((item) =>
          item.booking.id === bookingId
            ? {
                ...item,
                booking: {
                  ...item.booking,
                  driver_id: driverId,
                },
              }
            : item
        )
      );

      // Clear reminder flag when driver is assigned
      localStorage.removeItem(`reminder-sent-${bookingId}`);
    } catch (error: any) {
      console.error("Error assigning driver:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign driver",
        variant: "destructive",
      });
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

      const contentDisposition = response.headers.get("content-disposition");
      let filename = `voucher-${bookingId}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
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

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/supplier/ChangeBookingStatusByBookingId/${bookingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update booking status");
      }

      toast({
        title: "Success",
        description:
          newStatus === "approved"
            ? "Booking approved"
            : newStatus === "completed"
            ? "Booking marked as completed"
            : "Booking status updated",
      });

      setBookings((prevBookings) =>
        prevBookings.map((item) =>
          item.booking.id === bookingId
            ? {
                ...item,
                booking: {
                  ...item.booking,
                  status: newStatus,
                  completed_at:
                    newStatus === "completed"
                      ? new Date().toISOString()
                      : item.booking.completed_at,
                },
              }
            : item
        )
      );
    } catch (error: any) {
      console.error("Error updating booking:", error);
      setError(error.message);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Fetch supplier data - FIXED: Check authentication inside the useEffect
  useEffect(() => {
    const isAuthenticated = !!getToken(); // Define isAuthenticated here
    
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
        const email = dashboardData.Email;
        setSupplierId(userId);
        setSupplierEmail(email);

        const [bookingsData, driversData] = await Promise.all([
          fetchWithAuth(`${API_BASE_URL}/supplier/GetBookingBySupplierId/${userId}`),
          fetchWithAuth(`${API_BASE_URL}/supplier/GetDriver/${userId}`),
        ]);

        const normalizedData = bookingsData.result?.map((item: any) => ({
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
        setDrivers(driversData || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
        setError(errorMessage);
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        });
        if (errorMessage.includes("Unauthorized")) {
          removeToken();
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [API_BASE_URL, toast]);

  // Debounced email reminder checking
  useEffect(() => {
    if (bookings.length > 0 && supplierId && supplierEmail) {
      checkAndSendReminders(bookings);
    }
  }, [bookings, supplierId, supplierEmail, checkAndSendReminders]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      processedBookingsRef.current.clear();
      emailQueueRef.current = [];
    };
  }, []);

  // Filtering logic
  const filteredBookings = bookings.filter((item) => {
    const pickup = item.booking.pickup_location?.toLowerCase() ?? "";
    const drop = item.booking.drop_location?.toLowerCase() ?? "";
    const price = item.payments?.amount?.toString().toLowerCase() ?? item.booking.price?.toString().toLowerCase() ?? "";
    const bookingStatus = item.booking.status?.toLowerCase() ?? "";
    const paymentStatus = item.payments?.payment_status?.toLowerCase() ?? "";
    const search = searchTerm.toLowerCase();
    const bookingDate = item.booking.booked_at
      ? format(new Date(item.booking.booked_at), "yyyy-MM-dd")
      : "";
    const dateSearch = dateSearchTerm.toLowerCase();

    let statusMatch = true;
    if (statusFilter !== "all") {
      if (statusFilter === "approved") {
        statusMatch = bookingStatus === "approved";
      } else if (statusFilter === "upcoming") {
        statusMatch = bookingStatus === "approved";
      } else {
        statusMatch = bookingStatus === statusFilter;
      }
    }

    return (
      (pickup.includes(search) || drop.includes(search) || price.includes(search) || 
       bookingStatus.includes(search) || paymentStatus.includes(search)) &&
      (dateSearchTerm === "" || bookingDate.includes(dateSearch)) &&
      statusMatch
    );
  });

  // Sorting logic
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    if (!sortConfig) return 0;

    let aValue, bValue;

    if (sortConfig.key.includes("booking.")) {
      const key = sortConfig.key.replace("booking.", "") as keyof Booking;
      aValue = a.booking[key] || "";
      bValue = b.booking[key] || "";

      if (key === "booked_at" || key === "completed_at") {
        const dateA = new Date(aValue).getTime();
        const dateB = new Date(bValue).getTime();
        return sortConfig.direction === "ascending" ? dateA - dateB : dateB - dateA;
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

  const getStatusBadge = (status: string | undefined, type: "booking" | "payment") => {
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
      switch (statusText) {
        case "completed":
        case "successful":
          return (
            <Badge className="bg-green-500 hover:bg-green-600">
              <Check className="h-3 w-3 mr-1" />
              {statusText === "successful" ? "Successful" : "Completed"}
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

  // Check authentication for rendering
  const isAuthenticated = !!getToken();

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
                {/* Status Filter Dropdown */}
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
                    className="pr-8"
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
                {supplierId ? "No bookings found" : "Loading your bookings..."}
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
                          <React.Fragment key={item.booking.id}>
                            <TableRow>
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
                                      {/* added at 04-09 */}
                                      <div>
                                        <h4 className="text-sm font-medium text-gray-500">
                                          Driver Assignment
                                        </h4>
                                        <p>
                                          {item.booking.driver_id ? (
                                            <Badge className="bg-green-500 hover:bg-green-600">
                                              <Check className="h-3 w-3 mr-1" />
                                              Driver Assigned
                                            </Badge>
                                          ) : isPast24Hours(
                                              item.booking.booking_date,
                                              item.booking.booking_time
                                            ) ? (
                                            <Badge variant="outline">
                                              N/A (Service completed)
                                            </Badge>
                                          ) : (
                                            <Badge variant="outline">
                                              No Driver Assigned
                                            </Badge>
                                          )}
                                        </p>
                                      </div>
                                      {/* end */}

                                      <div>
                                        <h4 className="text-sm font-medium text-gray-500">
                                          Passenger Details
                                        </h4>
                                        <p>
                                          {item.booking.customer_name || "N/A"}{" "}
                                          ({item.booking.passengers || "N/A"}{" "}
                                          passengers)
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          {item.booking.customer_mobile ||
                                            "N/A"}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          {item.booking.customer_email || "N/A"}
                                        </p>
                                      </div>

                                      <div>
                                        <h4 className="text-sm font-medium text-gray-500">
                                          Service Date & Time
                                        </h4>
                                        <p>
                                          {getServiceDateTime(item.booking)}
                                        </p>
                                        {item.booking.pickup_type && (
                                          <p className="text-sm text-gray-600">
                                            Pickup from:{" "}
                                            {item.booking.pickup_type}
                                            {item.booking.planeArrivingFrom &&
                                              ` (${item.booking.planeArrivingFrom})`}
                                            {item.booking.flightNumber &&
                                              ` - Flight ${item.booking.flightNumber}`}
                                          </p>
                                        )}
                                      </div>

                                      {getReturnTripInfo(item.booking) && (
                                        <div>
                                          <h4 className="text-sm font-medium text-gray-500">
                                            Return Trip
                                          </h4>
                                          <p>
                                            {
                                              getReturnTripInfo(item.booking)
                                                ?.fullInfo
                                            }
                                          </p>
                                        </div>
                                      )}

                                      <div>
                                        <h4 className="text-sm font-medium text-gray-500">
                                          Destination
                                        </h4>
                                        <p>
                                          {item.booking.destinationName ||
                                            "N/A"}
                                        </p>
                                        {item.booking.destinationAddress && (
                                          <p className="text-sm text-gray-600">
                                            {item.booking.destinationAddress}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* added code for update driver at 04-09 */}

                                    {(item.booking.status?.toLowerCase() ===
                                      "approved" ||
                                      item.booking.status?.toLowerCase() ===
                                        "pending") &&
                                      (item.payments?.payment_status?.toLowerCase() ===
                                        "completed" ||
                                        item.payments?.payment_status?.toLowerCase() ===
                                          "successful") &&
                                      !isPast24Hours(
                                        item.booking.booking_date,
                                        item.booking.booking_time
                                      ) && (
                                        <div className="col-span-2">
                                          <h4 className="text-sm font-medium text-gray-500 mb-1">
                                            Assign Driver
                                            {isWithin24Hours(
                                              item.booking.booking_date,
                                              item.booking.booking_time
                                            ) && (
                                              <span className="text-orange-500 text-xs ml-2">
                                                (Within 24 hours - Email reminder sent)
                                              </span>
                                            )}
                                          </h4>
                                         
                                          <select
          className="w-full p-2 border rounded"
          value={
            item.booking.driver_id ||
            selectedDriver ||
            ""
          }
          onChange={(e) => {
            setSelectedDriver(e.target.value);
          }}
          onBlur={() => {
            if (selectedDriver) {
              updateDriverAssignment(
                item.booking.id,
                selectedDriver
              );
              // Clear reminder flag when driver is assigned
              localStorage.removeItem(`reminder-sent-${item.booking.id}`);
            }
          }}
        >
                                            <option value="">
                                              Select a driver
                                            </option>
                                            {drivers.map((driver) => (
                                              <option
                                                key={driver.id}
                                                value={driver.id}
                                              >
                                                {driver.DriverName} (
                                                {driver.DriverContact})
                                              </option>
                                            ))}
                                          </select>

                                           {isWithin24Hours(
          item.booking.booking_date,
          item.booking.booking_time
        ) &&
          !item.booking.driver_id &&
          !selectedDriver && (
            <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded">
              <p className="text-red-700 text-sm font-semibold">
                ⚠️ Urgent: No driver assigned!
              </p>
              <p className="text-red-600 text-xs">
                An email reminder has been sent to {supplierEmail}. 
                Please assign a driver immediately to avoid service disruption.
              </p>
             
              
            </div>
          )}
                                        </div>
                                      )}

                                    {/* end */}

                                    {/* Updated driver selection and buttons */}
                                    {item.booking.status?.toLowerCase() ===
                                      "pending" &&
                                      (item.payments?.payment_status?.toLowerCase() ===
                                        "completed" ||
                                        item.payments?.payment_status?.toLowerCase() ===
                                          "successful") && (
                                        <>
                                         
                                          <div className="flex justify-end gap-2">
                                            <Button
                                              size="sm"
                                              onClick={() => {
                                               
                                                updateBookingStatus(
                                                  item.booking.id,
                                                  "approved"
                                                );
                                              }}
                                              className="h-8"
                                            >
                                              <Check className="h-4 w-4 mr-1" />
                                              Approve Booking
                                            </Button>

                                            <Button
                                              variant="destructive"
                                              size="sm"
                                              onClick={() =>
                                                updateBookingStatus(
                                                  item.booking.id,
                                                  "rejected"
                                                )
                                              }
                                              className="h-8"
                                            >
                                              <X className="h-4 w-4 mr-1" />
                                              Reject
                                            </Button>
                                          </div>
                                        </>
                                      )}

                                    {/* Voucher download button (show only for approved bookings) */}
                                    {(item.booking.status?.toLowerCase() ===
                                      "approved" ||
                                      item.booking.status?.toLowerCase() ===
                                        "completed") && (
                                      <div className="flex justify-end">
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
                                          className="h-8"
                                        >
                                          {downloadingVoucher ===
                                          item.booking.id ? (
                                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                          ) : (
                                            <Download className="h-4 w-4 mr-1" />
                                          )}
                                          Voucher
                                        </Button>
                                      </div>
                                    )}

                                    {/* After the voucher download button in desktop view */}
                                    {item.booking.status?.toLowerCase() ===
                                      "approved" && (
                                      <div className="flex justify-end mt-2">
                                        <Button
                                          size="sm"
                                          onClick={() =>
                                            updateBookingStatus(
                                              item.booking.id,
                                              "completed"
                                            )
                                          }
                                          className="h-8 bg-blue-600 hover:bg-blue-700"
                                        >
                                          <Check className="h-4 w-4 mr-1" />
                                          Complete Booking
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
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
                                <p className="text-sm">
                                  {item.booking.booking_unique_id}
                                </p>
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
                              {/* added at 04-09 */}
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">
                                  Driver Assignment
                                </h4>
                                <p className="text-sm">
                                  {item.booking.driver_id ? (
                                    <Badge className="bg-green-500 hover:bg-green-600">
                                      <Check className="h-3 w-3 mr-1" />
                                      Driver Assigned
                                    </Badge>
                                  ) : isPast24Hours(
                                      item.booking.booking_date,
                                      item.booking.booking_time
                                    ) ? (
                                    <Badge variant="outline">
                                      N/A (Service completed)
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline">
                                      No Driver Assigned
                                    </Badge>
                                  )}
                                </p>
                              </div>
                              {/* end */}

                              <div>
                                <h4 className="text-sm font-medium text-gray-500">
                                  Passenger Details
                                </h4>
                                <p className="text-sm">
                                  {item.booking.customer_name || "N/A"} (
                                  {item.booking.passengers || "N/A"} passengers)
                                </p>
                                <p className="text-xs text-gray-600">
                                  {item.booking.customer_mobile || "N/A"} •{" "}
                                  {item.booking.customer_email || "N/A"}
                                </p>
                              </div>

                              <div>
                                <h4 className="text-sm font-medium text-gray-500">
                                  Service Date & Time
                                </h4>
                                <p className="text-sm">
                                  {getServiceDateTime(item.booking)}
                                </p>
                                {item.booking.pickup_type && (
                                  <p className="text-xs text-gray-600">
                                    Pickup from: {item.booking.pickup_type}
                                    {item.booking.planeArrivingFrom &&
                                      ` (${item.booking.planeArrivingFrom})`}
                                    {item.booking.flightNumber &&
                                      ` - Flight ${item.booking.flightNumber}`}
                                  </p>
                                )}
                              </div>

                              {getReturnTripInfo(item.booking) && (
                                <div>
                                  <h4 className="text-sm font-medium text-gray-500">
                                    Return Trip
                                  </h4>
                                  <p className="text-sm">
                                    {getReturnTripInfo(item.booking)?.fullInfo}
                                  </p>
                                </div>
                              )}

                              <div>
                                <h4 className="text-sm font-medium text-gray-500">
                                  Destination
                                </h4>
                                <p className="text-sm">
                                  {item.booking.destinationName || "N/A"}
                                </p>
                                {item.booking.destinationAddress && (
                                  <p className="text-xs text-gray-600">
                                    {item.booking.destinationAddress}
                                  </p>
                                )}
                              </div>

                              {/* updated for driver at 04-09 */}

                              {(item.booking.status?.toLowerCase() ===
                                "approved" ||
                                item.booking.status?.toLowerCase() ===
                                  "pending") &&
                                (item.payments?.payment_status?.toLowerCase() ===
                                  "completed" ||
                                  item.payments?.payment_status?.toLowerCase() ===
                                    "successful") &&
                                !isPast24Hours(
                                  item.booking.booking_date,
                                  item.booking.booking_time
                                ) && (
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-500">
                                      Assign Driver
                                      {isWithin24Hours(
                                        item.booking.booking_date,
                                        item.booking.booking_time
                                      ) && (
                                        <span className="text-orange-500 text-xs ml-2">
                                          (Within 24 hours)
                                        </span>
                                      )}
                                    </h4>
                                    <select
                                      className="w-full p-2 border rounded mt-1"
                                      value={
                                        item.booking.driver_id ||
                                        selectedDriver ||
                                        ""
                                      }
                                      onChange={(e) => {
                                        setSelectedDriver(e.target.value);
                                      }}
                                      onBlur={() => {
                                        if (selectedDriver) {
                                          updateDriverAssignment(
                                            item.booking.id,
                                            selectedDriver
                                          );
                                        }
                                      }}
                                    >
                                      <option value="">Select a driver</option>
                                      {drivers.map((driver) => (
                                        <option
                                          key={driver.id}
                                          value={driver.id}
                                        >
                                          {driver.DriverName} (
                                          {driver.DriverContact})
                                        </option>
                                      ))}
                                    </select>

                                    {isWithin24Hours(
                                      item.booking.booking_date,
                                      item.booking.booking_time
                                    ) &&
                                      !item.booking.driver_id &&
                                      !selectedDriver && (
                                        <p className="text-red-500 text-xs mt-1">
                                          Warning: Service is within 24 hours
                                          and no driver is assigned!
                                        </p>
                                      )}
                                  </div>
                                )}

                              {/* end */}

                              {/* Updated driver selection and buttons */}
                              {item.booking.status?.toLowerCase() ===
                                "pending" &&
                                (item.payments?.payment_status?.toLowerCase() ===
                                  "completed" ||
                                  item.payments?.payment_status?.toLowerCase() ===
                                    "successful") && (
                                  <>
                                   
                                    <div className="flex gap-2 pt-2">
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                         
                                          updateBookingStatus(
                                            item.booking.id,
                                            "approved"
                                          );
                                        }}
                                        className="flex-1"
                                      >
                                        <Check className="h-4 w-4 mr-1" />
                                        Approve Booking
                                      </Button>

                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() =>
                                          updateBookingStatus(
                                            item.booking.id,
                                            "rejected"
                                          )
                                        }
                                        className="flex-1"
                                      >
                                        <X className="h-4 w-4 mr-1" />
                                        Reject
                                      </Button>
                                    </div>
                                  </>
                                )}

                              {/* Voucher download button (show only for approved bookings) */}
                              {(item.booking.status?.toLowerCase() ===
                                "approved" ||
                                item.booking.status?.toLowerCase() ===
                                  "completed") && (
                                <div className="flex pt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      downloadVoucher(item.booking.id)
                                    }
                                    disabled={
                                      downloadingVoucher === item.booking.id
                                    }
                                    className="flex-1"
                                  >
                                    {downloadingVoucher === item.booking.id ? (
                                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                    ) : (
                                      <Download className="h-4 w-4 mr-1" />
                                    )}
                                    Voucher
                                  </Button>
                                </div>
                              )}

                              {/* After the voucher download button in mobile view */}
                              {item.booking.status?.toLowerCase() ===
                                "approved" && (
                                <div className="flex pt-2">
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      updateBookingStatus(
                                        item.booking.id,
                                        "completed"
                                      )
                                    }
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Complete Booking
                                  </Button>
                                </div>
                              )}
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

export default SupplierBookingsTable;