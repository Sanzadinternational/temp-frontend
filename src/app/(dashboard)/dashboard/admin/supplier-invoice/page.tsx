
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Loader2, Download, User, FileText } from "lucide-react";
// import { fetchWithAuth } from "@/components/utils/api";
// import { removeToken } from "@/components/utils/auth";

interface Supplier {
  id: number;
  Company_name: string;
  userId?: string;
}

interface InvoiceInfo {
  id: string;
  supplier_id: string;
  Image: string;
  filename?: string;
  uploadDate?: string;
  fileSize?: string;
}

const SupplierInvoice = () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCheckingInvoice, setIsCheckingInvoice] = useState(false);
  const [existingInvoice, setExistingInvoice] = useState<InvoiceInfo | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      try {
        setIsLoading(true);
        // Fetch suppliers
        const response = await fetch(`${API_BASE_URL}/admin/AllGetSuppliers`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
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

    fetchData();
  }, [API_BASE_URL, toast]);

  // Check for existing invoice when supplier is selected
  useEffect(() => {
    if (selectedSupplier) {
      checkExistingInvoice(selectedSupplier);
    } else {
      setExistingInvoice(null);
    }
  }, [selectedSupplier]);

  const checkExistingInvoice = async (supplier_id: string) => {
    try {
      setIsCheckingInvoice(true);
      // API call to check if invoice exists for this supplier
      const response = await fetch(
        `${API_BASE_URL}/supplier/GetSupplierDocuments/${supplier_id}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem("authToken")}`
          }
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        
        // Check if we have invoice data
        if (result.success && result.data && result.data.length > 0) {
          const invoiceData = result.data[0];
          
          // Extract filename from URL
          const urlParts = invoiceData.Image.split('/');
          const filename = urlParts[urlParts.length - 1];
          
          // Create invoice info object
          const invoiceInfo: InvoiceInfo = {
            ...invoiceData,
            filename: filename,
            uploadDate: new Date().toISOString(),
          };
          
          setExistingInvoice(invoiceInfo);
        } else {
          setExistingInvoice(null);
        }
      } else if (response.status === 404) {
        // No invoice exists
        setExistingInvoice(null);
      } else {
        throw new Error("Failed to check invoice status");
      }
    } catch (error: any) {
      console.error("Error checking invoice:", error);
      setExistingInvoice(null);
    } finally {
      setIsCheckingInvoice(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!existingInvoice?.Image) return;
    
    try {
      setIsDownloading(true);
      // Direct download from the URL in the API response
      const response = await fetch(existingInvoice.Image, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("authToken")}`
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to download invoice");
      }
      
      // Get the filename from the URL
      const urlParts = existingInvoice.Image.split('/');
      const filename = urlParts[urlParts.length - 1];
      
      // Create a blob from the response and create a download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        link.remove();
        window.URL.revokeObjectURL(url);
      }, 100);
      
      toast({
        title: "Success",
        description: "Invoice downloaded successfully",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Error downloading invoice:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to download invoice",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const getSelectedSupplierName = () => {
    if (!selectedSupplier) return '';
    const supplier = suppliers.find(s => s.id.toString() === selectedSupplier || s.userId === selectedSupplier);
    return supplier ? supplier.Company_name : '';
  };

  return (
    <DashboardContainer>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <User className="h-8 w-8" />
              <div>
                <CardTitle>Supplier Invoice Download</CardTitle>
                <CardDescription>
                  Download invoices for suppliers
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="w-full max-w-md">
                <Select
                  onValueChange={setSelectedSupplier}
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
              
              {isCheckingInvoice ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>Checking for invoice...</span>
                </div>
              ) : selectedSupplier && existingInvoice ? (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Available Invoice</CardTitle>
                    <CardDescription>
                      Invoice for {getSelectedSupplierName()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center">
                        <FileText className="h-8 w-8 text-blue-500 mr-3" />
                        <div>
                          <p className="font-medium">{existingInvoice.filename}</p>
                          <p className="text-sm text-muted-foreground">
                            Uploaded {existingInvoice.uploadDate ? new Date(existingInvoice.uploadDate).toLocaleDateString() : 'recently'}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleDownloadInvoice}
                          disabled={isDownloading}
                          className="flex items-center"
                        >
                          {isDownloading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <Download className="h-4 w-4 mr-1" />
                          )}
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : selectedSupplier ? (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">No Invoice Available</CardTitle>
                    <CardDescription>
                      {getSelectedSupplierName()} has not uploaded an invoice yet.
                    </CardDescription>
                  </CardHeader>
                </Card>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardContainer>
  );
};

export default SupplierInvoice;