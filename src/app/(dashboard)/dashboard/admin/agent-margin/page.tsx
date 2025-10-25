
"use client";

import * as z from "zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import axios from "axios";
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
import { Pencil, Trash2, Loader2, Search, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Agent {
  id: number;
  Company_name: string;
  Currency: string;
}

interface Margin {
  id: number;
  agent_id: number | string;
  Company_name: string;
  Currency: string;
  MarginPrice: string;
}

const formSchema = z.object({
  agent_id: z.string().min(1, { message: "Agent is required" }),
  Company_name: z.string().min(1),
  Currency: z.string().min(1),
  MarginPrice: z.string().min(1, { message: "Margin Price is required" }),
});

const ITEMS_PER_PAGE = 10;

const AgentMargin = () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [margins, setMargins] = useState<Margin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof Margin; direction: 'ascending' | 'descending' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      agent_id: "",
      Company_name: "",
      Currency: "",
      MarginPrice: ""
    },
  });

  // Filter and sort margins
  const filteredMargins = margins.filter(margin => 
    margin.Company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    margin.Currency.toLowerCase().includes(searchTerm.toLowerCase()) ||
    margin.MarginPrice.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort margins
  const sortedMargins = [...filteredMargins].sort((a, b) => {
    if (!sortConfig) return 0;
    
    const key = sortConfig.key;
    if (a[key] < b[key]) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (a[key] > b[key]) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedMargins.length / ITEMS_PER_PAGE);
  const paginatedMargins = sortedMargins.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const requestSort = (key: keyof Margin) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const fetchAgents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/agent/GetAgent`);
      if (!response.ok) {
        throw new Error("Failed to fetch agents");
      }
      const data = await response.json();
      setAgents(data);
    } catch (error: any) {
      console.error("Error fetching agents:", error);
      setError(error.message);
      toast({
        title: "Error",
        description: "Failed to load agents",
        variant: "destructive",
      });
    }
  };

  const fetchMargins = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/GetAgentMargin`);
      if (!response.ok) {
        throw new Error("Failed to fetch margins");
      }
      const data = await response.json();
      setMargins(data || []); // Access the data array from response
    } catch (error: any) {
      console.error("Error fetching margins:", error);
      toast({
        title: "Error",
        description: "Failed to load margins",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
    fetchMargins();
  }, []);

  const handleAgentChange = (agentId: string) => {
    const selectedAgent = agents.find(s => s.id.toString() === agentId);
    if (selectedAgent) {
      form.setValue("agent_id", agentId);
      form.setValue("Company_name", selectedAgent.Company_name);
      form.setValue("Currency", selectedAgent.Currency);
    }
  };

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    setError(null);

    const payload = {
      agent_id: parseInt(data.agent_id),
      Company_name: data.Company_name,
      Currency: data.Currency,
      MarginPrice: data.MarginPrice
    };

    try {
      if (editingId) {
        // Update existing margin
        const response = await axios.put(
          `${API_BASE_URL}/admin/UpdateAgentMargin/${editingId}`,
          payload
        );
        if (response.status === 200) {
          toast({
            title: "Success",
            description: "Margin updated successfully",
          });
          setEditingId(null);
          form.reset();
          fetchMargins();
        }
      } else {
        // Create new margin
        const response = await axios.post(
          `${API_BASE_URL}/admin/CreateAgentMargin`,
          payload
        );
        if (response.status === 200) {
          toast({
            title: "Success",
            description: "Margin added successfully",
          });
          form.reset();
          fetchMargins();
        }
      }
    } catch (err: any) {
      console.error("Submission Error:", err);
      const errorMessage = err.response?.data?.message || "Operation failed";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (margin: Margin) => {
    setEditingId(margin.id);
    form.setValue("agent_id", margin.agent_id.toString());
    form.setValue("Company_name", margin.Company_name);
    form.setValue("Currency", margin.Currency);
    form.setValue("MarginPrice", margin.MarginPrice);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this margin?");
  if (!confirmDelete) return;
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/admin/DeleteAgentMargin/${id}`
      );
      if (response.status === 200) {
        toast({
          title: "Success",
          description: "Margin deleted successfully",
        });
        fetchMargins();
      }
    } catch (err: any) {
      console.error("Deletion Error:", err);
      toast({
        title: "Error",
        description: "Failed to delete margin",
        variant: "destructive",
      });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    form.reset();
  };

  return (
    <DashboardContainer scrollable>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Margin" : "Add Margin"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6"
              >
                {error && <p className="text-red-500">{error}</p>}
                <FormField
                  control={form.control}
                  name="agent_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Select Agent <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleAgentChange(value);
                          }}
                          value={field.value}
                          disabled={isLoading}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder={
                                isLoading
                                  ? "Loading agents..."
                                  : "Select an agent"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {agents.map((agent) => (
                              <SelectItem
                                key={agent.id}
                                value={agent.id.toString()}
                              >
                                {agent.Company_name} ({agent.Currency})
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
                  name="MarginPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Margin Price <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter margin price"
                          {...field}
                          type="number"
                          min="0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting || isLoading}>
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {editingId ? "Update Margin" : "Add Margin"}
                  </Button>
                  {editingId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={cancelEdit}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle>Margin List</CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search margins..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset to first page when searching
                  }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : margins.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No margins found</p>
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
                              onClick={() => requestSort('Company_name')}
                              className="p-0 hover:bg-transparent"
                            >
                              Agent
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </TableHead>
                          <TableHead>
                            <Button
                              variant="ghost"
                              onClick={() => requestSort('MarginPrice')}
                              className="p-0 hover:bg-transparent"
                            >
                              Margin Price
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </TableHead>
                          <TableHead>
                            <Button
                              variant="ghost"
                              onClick={() => requestSort('Currency')}
                              className="p-0 hover:bg-transparent"
                            >
                              Currency
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedMargins.map((margin) => (
                          <TableRow key={margin.id}>
                            <TableCell className="font-medium">
                              {margin.Company_name}
                            </TableCell>
                            <TableCell>{margin.MarginPrice}</TableCell>
                            <TableCell>{margin.Currency}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(margin)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(margin.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
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
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {paginatedMargins.map((margin) => (
                    <Card key={margin.id}>
                      <CardHeader className="flex flex-row justify-between items-start p-4">
                        <div>
                          <CardTitle className="text-lg">
                            {margin.Company_name}
                          </CardTitle>
                          <div className="mt-2 flex items-center gap-2">
                            <Badge variant="outline">
                              {margin.Currency}
                            </Badge>
                            <Badge variant="default">
                              {margin.MarginPrice}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(margin)}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(margin.id)}
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                  
                  {/* Pagination for mobile */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between space-x-2 py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
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
                        onClick={() => handlePageChange(currentPage + 1)}
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

export default AgentMargin;