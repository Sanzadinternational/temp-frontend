
"use client";

import * as z from "zod";
import { useEffect, useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
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
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { fetchWithAuth } from "@/components/utils/api";
import { removeToken } from "@/components/utils/auth";

const formSchema = z.object({
  Email: z.string().email({ message: "Invalid email address" }),
  Password: z.string().min(1, { message: "Password is required" }),
});

const LoginFormContent = () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "";

  // Check if user is already logged in
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      try {
        const data = await fetchWithAuth(`${API_BASE_URL}/dashboard`);
        setUser(data);
        router.push(`/dashboard/${data.role}`);
      } catch (err: any) {
        // console.error("Error:", err);
        setError(err.message);
        removeToken();
      }
    };

    fetchUserData();
  }, [router, API_BASE_URL]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { Email: "", Password: "" },
  });

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/login`, data);
      if (response.status === 200) {
        localStorage.setItem("authToken", response.data.accessToken);
        
        // Fetch user data after successful login
        const userData = await fetchWithAuth(`${API_BASE_URL}/dashboard`);
        setUser(userData);
        
        toast({ 
          title: "Login Successful", 
          description: `Welcome ${userData?.Company_name || userData?.email || 'User'}!`
        });
        
        const targetUrl = redirectUrl ? redirectUrl : `/dashboard/${response.data.role}`;
        router.push(targetUrl);
      }
    } catch (err: any) {
      // console.error("Login Error:", err);
      const errorMessage = err.response?.data?.message || "Login failed. Please try again.";
      setError(errorMessage);
      toast({ 
        title: "Error", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {error && <p className="text-red-500">{error}</p>}
        <FormField
          control={form.control}
          name="Email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input placeholder="Enter your email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="Password"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between">
                <FormLabel>Password <span className="text-red-500">*</span></FormLabel>
                <Link href="/forgot-password" className="text-xs text-blue-500 underline">
                  Forgot Password?
                </Link>
              </div>
              <FormControl>
                <Input type="password" placeholder="Enter your password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing In..." : "Sign In"}
        </Button>
      </form>
    </Form>
  );
};

const Login = () => {
  return (
    <div className="flex justify-center items-center my-8">
      <Card>
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading...</div>}>
            <LoginFormContent />
          </Suspense>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center gap-1">
          <CardDescription>Don&apos;t have an account SignUp</CardDescription>
          <div className="flex justify-between w-full">
            <Button variant="secondary">
              <Link href="/agent">Agent SignUp</Link>
            </Button>
            <Button variant="secondary">
              <Link href="/supplier">Supplier SignUp</Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;