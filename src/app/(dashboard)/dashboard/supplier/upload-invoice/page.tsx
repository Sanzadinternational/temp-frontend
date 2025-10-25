
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import DashboardContainer from "@/components/layout/DashboardContainer";
import { Loader2, Upload, FileText, Trash2, Download, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchWithAuth } from "@/components/utils/api";
import { removeToken } from "@/components/utils/auth";

interface InvoiceInfo {
  id: string;
  supplier_id: string;
  Image: string;
  filename?: string;
  uploadDate?: string;
  fileSize?: string;
}

const UploadInvoice = () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isCheckingInvoice, setIsCheckingInvoice] = useState(false);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [existingInvoice, setExistingInvoice] = useState<InvoiceInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [supplierInfo, setSupplierInfo] = useState<any>(null);

  useEffect(() => {
    const fetchSupplierData = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      try {
        setIsLoading(true);
        const data = await fetchWithAuth(`${API_BASE_URL}/dashboard`);
        setSupplierInfo(data);
        // Check for existing invoice
        if (data.userId) {
          checkExistingInvoice(data.userId);
        }
      } catch (err: any) {
        console.error("Error:", err);
        removeToken();
        window.location.href = "/login";
      } finally {
        setIsLoading(false);
      }
    };

    fetchSupplierData();
  }, [API_BASE_URL]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check if file is PDF
      if (file.type !== "application/pdf") {
        toast({
          title: "Error",
          description: "Please upload a PDF file only",
          variant: "destructive",
        });
        return;
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 10MB",
          variant: "destructive",
        });
        return;
      }
      
      setInvoiceFile(file);
    }
  };

  const deleteExistingInvoice = async () => {
    if (!existingInvoice?.id) return;
    
    try {
      setIsDeleting(true);
      // API call to delete existing invoice using document ID
      const response = await fetch(
        `${API_BASE_URL}/supplier/DeleteSupplierDocuments/${existingInvoice.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem("authToken")}`
          }
        }
      );
      
      const result = await response.json();
      
      // Check if the API returned a success message
      if (response.ok && result.message && result.message.includes("Successfully")) {
        toast({
          title: "Success",
          description: result.message,
          variant: "default",
        });
        
        // Clear the existing invoice from state
        setExistingInvoice(null);
        
        // Also clear any selected file
        setInvoiceFile(null);
        
        // Reset file input
        const fileInput = document.getElementById("invoice-file") as HTMLInputElement;
        if (fileInput) {
          fileInput.value = "";
        }
      } else if (!response.ok) {
        throw new Error(result.message || "Failed to delete invoice");
      } else {
        // Handle case where API returns success but without expected message
        toast({
          title: "Success",
          description: "Invoice deleted successfully",
          variant: "default",
        });
        
        // Clear the existing invoice from state
        setExistingInvoice(null);
        
        // Also clear any selected file
        setInvoiceFile(null);
        
        // Reset file input
        const fileInput = document.getElementById("invoice-file") as HTMLInputElement;
        if (fileInput) {
          fileInput.value = "";
        }
      }
    } catch (error: any) {
      console.error("Error deleting invoice:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete invoice",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const uploadInvoice = async () => {
    if (!supplierInfo?.userId || !invoiceFile) return;
    
    try {
      setIsUploading(true);
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append("Image", invoiceFile);
      formData.append("supplier_id", supplierInfo.userId);
      
      // API call to upload invoice
      const response = await fetch(
        `${API_BASE_URL}/supplier/SupplierDocumentsData`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem("authToken")}`
          },
          body: formData,
        }
      );
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        toast({
          title: "Success",
          description: "Invoice uploaded successfully",
          variant: "default",
        });
        
        // Refresh invoice info
        checkExistingInvoice(supplierInfo.userId);
        setInvoiceFile(null);
        
        // Reset file input
        const fileInput = document.getElementById("invoice-file") as HTMLInputElement;
        if (fileInput) {
          fileInput.value = "";
        }
      } else {
        throw new Error(result.message || "Failed to upload invoice");
      }
    } catch (error: any) {
      console.error("Error uploading invoice:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload invoice",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadInvoice = async () => {
    if (!existingInvoice?.Image) return;
    
    try {
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
    }
  };

  if (isLoading) {
    return (
      <DashboardContainer>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <User className="h-8 w-8" />
              <div>
                <CardTitle>Supplier Invoice Management</CardTitle>
                <CardDescription>
                  {supplierInfo?.Company_name || supplierInfo?.name || 'Supplier'} - Upload and manage your invoices
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {isCheckingInvoice ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>Checking for existing invoice...</span>
                </div>
              ) : existingInvoice ? (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Existing Invoice</CardTitle>
                    <CardDescription>
                      You have already uploaded an invoice. You can download it or delete it to upload a new one.
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
                          variant="outline"
                          size="sm"
                          onClick={downloadInvoice}
                          className="flex items-center"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={deleteExistingInvoice}
                          disabled={isDeleting}
                          className="flex items-center"
                        >
                          {isDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-1" />
                          )}
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Upload New Invoice</CardTitle>
                    <CardDescription>
                      Upload your invoice in PDF format (max 10MB)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="invoice-file">Invoice File (PDF only, max 10MB)</Label>
                        <Input 
                          id="invoice-file" 
                          type="file" 
                          accept=".pdf" 
                          onChange={handleFileChange}
                          disabled={isUploading}
                        />
                      </div>
                      
                      {invoiceFile && (
                        <div className="flex items-center p-3 border rounded-lg">
                          <FileText className="h-6 w-6 text-blue-500 mr-2" />
                          <div className="flex-1">
                            <p className="font-medium">{invoiceFile.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(invoiceFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <Button
                        onClick={uploadInvoice}
                        disabled={!invoiceFile || isUploading}
                        className="flex items-center"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Invoice
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardContainer>
  );
};

export default UploadInvoice;