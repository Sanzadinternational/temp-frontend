"use client";
import * as z from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  Email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Please enter a valid email" }),
  Password: z.string().min(1, { message: "Password is required" }),
  Company_name: z.string().min(1, { message: "User Name is required" }),
  Agent_account: z.boolean().optional(),
  Agent_operation: z.boolean().optional(),
  Agent_product: z.boolean().optional(),
  Supplier_account: z.boolean().optional(),
  Supplier_operation: z.boolean().optional(),
  Supplier_product: z.boolean().optional(),
});

const AddAdmin = () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [showAgentOptions, setShowAgentOptions] = useState(false);
  const [showSupplierOptions, setShowSupplierOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      Company_name: "",
      Email: "",
      Password: "",
      Agent_account: false,
      Agent_operation: false,
      Agent_product: false,
      Supplier_account: false,
      Supplier_operation: false,
      Supplier_product: false,
    },
  });

  const { toast } = useToast();

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    // console.log("Admin data",data);
    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/admin/create`,
        data
      );
      // console.log("Admin added successfully:", response.data);
      toast({
        title: "Success!",
        description: "Admin added successfully.",
      });
      form.reset();
      setShowAgentOptions(false);
      setShowSupplierOptions(false);
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
      });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Admin</CardTitle>
        <CardDescription>
          Create a new admin with required permissions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="Company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Name <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Admin Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="Email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Email" {...field} />
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
                  <FormLabel>Password <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter Password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <CardDescription>
              Give permission to Admin by selecting the field
            </CardDescription>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-2">
                  <FormLabel>Agent</FormLabel>
                  <Checkbox
                    checked={showAgentOptions}
                    onCheckedChange={setShowAgentOptions}
                  />
                </div>
                {showAgentOptions && (
                  <div className="flex flex-col gap-2">
                    <FormField
                      control={form.control}
                      name="Agent_account"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center space-x-2">
                            <FormLabel>Agent Account</FormLabel>
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="Agent_operation"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center space-x-2">
                            <FormLabel>Agent Operation</FormLabel>
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="Agent_product"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center space-x-2">
                            <FormLabel>Agent Product</FormLabel>
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-2">
                  <FormLabel>Supplier</FormLabel>
                  <Checkbox
                    checked={showSupplierOptions}
                    onCheckedChange={setShowSupplierOptions}
                  />
                </div>
                {showSupplierOptions && (
                  <div className="flex flex-col gap-2">
                    <FormField
                      control={form.control}
                      name="Supplier_account"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center space-x-2">
                            <FormLabel>Supplier Account</FormLabel>
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="Supplier_operation"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center space-x-2">
                            <FormLabel>Supplier Operation</FormLabel>
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="Supplier_product"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center space-x-2">
                            <FormLabel>Supplier Product</FormLabel>
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding Admin..." : "Add Admin"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AddAdmin;
