
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "../ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth } from "@/components/utils/api";
import { removeToken } from "@/components/utils/auth";
import { Skeleton } from "../ui/skeleton";
import { Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const formSchema = z.object({
  Api: z.string().min(1, { message: "API is required" }),
  Api_User: z.string().min(1, { message: "Username is required" }),
  Api_Password: z.string().min(1, { message: "Password is required" }),
});

interface UserData {
  userId: number;
  // Add other user properties if needed
}

interface ApiData {
  id: number;
  Api: string;
  Api_User: string;
  Api_Password: string;
  Api_Id_Foreign: number;
}

const SupplierAPI = () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const { toast } = useToast();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [apiData, setApiData] = useState<ApiData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Fetch user data and API data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // First fetch user data
        const user = await fetchWithAuth(`${API_BASE_URL}/dashboard`);
        setUserData(user);
        
        // Then fetch API data for this user
        const response = await axios.get(`${API_BASE_URL}/supplier/GetSupplierApi`);
        
        // Find the API data for this specific user
        if (response.data && Array.isArray(response.data)) {
          const userApiData = response.data.find(
            (api: ApiData) => api.Api_Id_Foreign === user.userId
          );
          if (userApiData) {
            setApiData(userApiData);
          }
        }
      } catch (err: any) {
        // console.error("Error fetching data:", err);
        setError(err.message);
        if (err.response?.status === 401) {
          removeToken();
          
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      Api: "",
      Api_User: "",
      Api_Password: "",
    },
  });

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!userData) {
      toast({
        title: "Error",
        description: "User data not loaded. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/supplier/CreateSupplierApi`,
        {
          Api: data.Api,
          Api_User: data.Api_User,
          Api_Password: data.Api_Password,
          Api_Id_Foreign: userData.userId,
        }
      );

      if (response.status === 200) {
        toast({
          title: "Success",
          description: "Supplier API added successfully.",
        });
        form.reset();
        // Refresh API data
        const apiResponse = await axios.get(`${API_BASE_URL}/supplier/GetSupplierApi`);
        if (apiResponse.data && Array.isArray(apiResponse.data)) {
          const userApiData = apiResponse.data.find(
            (api: ApiData) => api.Api_Id_Foreign === userData.userId
          );
          setApiData(userApiData || null);
        }
      } else {
        throw new Error("API integration failed.");
      }
    } catch (error: any) {
      // console.error("Error during API submission:", error);
      toast({
        title: "Error",
        description: error?.message || "An error occurred while integrating the API.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this API configuration?");
    if (!confirmDelete) return;

    try {
      setIsLoading(true);
      const response = await axios.delete(`${API_BASE_URL}/supplier/DeleteSupplierApi/${id}`);
      
      if (response.status === 200) {
        toast({
          title: "Deleted",
          description: "API configuration removed successfully.",
        });
        setApiData(null);
      } else {
        throw new Error("Failed to delete API configuration.");
      }
    } catch (error: any) {
      // console.error("Error deleting API:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to delete API configuration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (error) return <p>Error: {error}</p>;
  if (isLoading && !userData) return (
    <div className="flex flex-col justify-center items-center">
      <Skeleton className="h-[300px] w-[250px] rounded-xl" />
      <div className="space-y-2 m-1">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-4 my-4">
      <Card>
        <CardHeader>
          <CardTitle>Supplier API Integration</CardTitle>
          <CardDescription>
            {apiData ? "Your current API configuration" : "Enter API details to integrate the supplier API"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {apiData ? (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>API Endpoint</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Password</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">{apiData.Api}</TableCell>
                    <TableCell>{apiData.Api_User}</TableCell>
                    <TableCell>••••••••••••</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(apiData.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              
              <div className="text-sm text-muted-foreground">
                Note: You can only have one API configuration. Delete the current one to add a new configuration.
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="Api"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Endpoint</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., https://sandbox/v3/yourapi" 
                          {...field} 
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="Api_User"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter API username" 
                          {...field} 
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="Api_Password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Enter API password" 
                          {...field} 
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? "Submitting..." : "Submit"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierAPI;