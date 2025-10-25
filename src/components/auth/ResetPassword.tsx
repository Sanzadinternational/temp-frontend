"use client";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";
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

// ✅ Email validation schema
const emailSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

// ✅ Password validation schema
const passwordSchema = z.object({
  newpassword: z.string().min(4, "Password must be at least 4 characters long"),
});

const ForgotPassword = () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // ✅ Get token & email from URL
  const token = searchParams.get("token");
const emailFromURL = searchParams.get("Email");

  const { toast } = useToast();
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isPasswordSent, setIsPasswordSent] = useState(false);
  const [savedEmail, setSavedEmail] = useState("");

  // ✅ Email form
  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  // ✅ Password form
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newpassword: "" },
  });

  // ✅ Handle email submission (request reset link)
  const handleEmailSubmit = async (data: z.infer<typeof emailSchema>) => {
    setIsEmailSent(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/forgetpassword`,
        { Email: data.email }
      );

      if (response.status === 200) {
        setSavedEmail(data.email);
        toast({
          title: "Email Sent",
          description: "A password reset link has been sent to your email.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid email or user not found.",
        variant: "destructive",
      });
      console.error("Email submission error:", error);
    } finally {
      setIsEmailSent(false);
    }
  };

  // ✅ Verify reset token when user clicks the link
  useEffect(() => {
    if (!token || !emailFromURL) {
      console.log("❌ Missing token or email in URL!");
      return; // ❌ Don't redirect, just show email form
    }

    const verifyToken = async () => {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/verify_token`,
          { Token: token, Email: emailFromURL }
        );

        console.log("✅ Token Verified:", response.data);
        if (response.status === 200) {
          setIsTokenValid(true);
          setSavedEmail(emailFromURL);
        } else {
          throw new Error("Invalid token response");
        }
      } catch (error) {
        console.error("❌ Token verification error:", error.response?.data || error);
        toast({
          title: "Invalid Token",
          description: "The reset link is invalid or has expired.",
          variant: "destructive",
        });
      }
    };

    verifyToken();
  }, [token, emailFromURL]);

  // ✅ Handle new password submission
  const handlePasswordSubmit = async (data: z.infer<typeof passwordSchema>) => {
    setIsPasswordSent(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/resetpassword`, {
        Password: data.newpassword,
        Email: savedEmail,
        Token: token,
      });

      if (response.status === 200) {
        toast({
          title: "Success",
          description: "Password reset successfully. You can now log in.",
        });
        router.push("/login");
      } else {
        toast({
          title: "Error",
          description: "Password reset failed. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error resetting password.",
        variant: "destructive",
      });
      console.error("Password reset error:", error);
    } finally {
      setIsPasswordSent(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>
          {token && emailFromURL
            ? "Enter a new password"
            : "Enter your email to receive a password reset link"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* ✅ Email Form (Request Reset Link) */}
        {!token && !emailFromURL && (
          <Form {...emailForm}>
            <form
              onSubmit={emailForm.handleSubmit(handleEmailSubmit)}
              className="space-y-6"
            >
              <FormField
                control={emailForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isEmailSent}>
                {isEmailSent ? "Sending Reset Link..." : "Send Reset Link"}
              </Button>
            </form>
          </Form>
        )}

        {/* ✅ Password Reset Form (if token is valid) */}
        {token && emailFromURL && isTokenValid && (
          <Form {...passwordForm}>
            <form
              onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}
              className="space-y-6"
            >
              <FormField
                control={passwordForm.control}
                name="newpassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter new password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isPasswordSent}>
                {isPasswordSent ? "Resetting Password..." : "Reset Password"}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
};

export default ForgotPassword;
