
"use client";

import DashboardContainer from "@/components/layout/DashboardContainer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/components/utils/api";
import { removeToken } from "@/components/utils/auth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Car,
  FileUser,
  IndianRupee,
  User,
  Bell,
  X,
  Settings,
  Proportions,
  NotebookPen,
  Route,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import io from "socket.io-client";

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!);

interface Notification {
  message: string;
  timestamp: string;
  type: 'order' | 'supplier' | 'other';
}

const MAX_NOTIFICATIONS = 50;

const Page = () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notifications');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [unreadCount, setUnreadCount] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('unreadCount');
      return saved ? parseInt(saved) : 0;
    }
    return 0;
  });
  const [notificationOpen, setNotificationOpen] = useState(false);

  const updateNotifications = (newNotifications: Notification[]) => {
    const limitedNotifications = newNotifications.slice(0, MAX_NOTIFICATIONS);
    setNotifications(limitedNotifications);
    localStorage.setItem('notifications', JSON.stringify(limitedNotifications));
  };

  const updateUnreadCount = (count: number) => {
    setUnreadCount(count);
    localStorage.setItem('unreadCount', count.toString());
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await fetchWithAuth(`${API_BASE_URL}/dashboard`);
        setUser(data);
      } catch (err: any) {
        setError(err.message);
        removeToken();
        window.location.href = "/login";
      }
    };

    fetchUserData();

    socket.on("new_supplier_registered", (data) => {
      const newNotification: Notification = {
        message: data.message,
        timestamp: new Date().toISOString(),
        type: 'supplier'
      };
      updateNotifications([newNotification, ...notifications]);
      updateUnreadCount(unreadCount + 1);
    });

    socket.on("Order", (data) => {
      const newNotification: Notification = {
        message: data.message,
        timestamp: new Date().toISOString(),
        type: 'order'
      };
      updateNotifications([newNotification, ...notifications]);
      updateUnreadCount(unreadCount + 1);
    });

    return () => {
      socket.off("new_supplier_registered");
      socket.off("Order");
    };
  }, [notifications, unreadCount]);

  const handleNotificationClick = () => {
    setNotificationOpen(true);
  };

  const clearNotifications = () => {
    updateNotifications([]);
    updateUnreadCount(0);
  };

  if (error) return <p>Error: {error}</p>;

  if (!user) {
    return (
      <div className="flex flex-col m-4">
        <div className="space-y-2 m-1">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[250px]" />
        </div>
        <div className="space-x-4 flex">
          <Skeleton className="h-[160px] w-[200px] rounded-xl" />
          <Skeleton className="h-[160px] w-[200px] rounded-xl" />
          <Skeleton className="h-[160px] w-[200px] rounded-xl" />
          <Skeleton className="h-[160px] w-[200px] rounded-xl" />
        </div>
      </div>
    );
  }

  const isSuperAdmin = user.role === 'superadmin';

  const hasPermission = (permission: string) => {
    return isSuperAdmin || user[permission] === true;
  };

  const adminTabs = [
    {
      value: "account",
      label: "Account",
      icon: Proportions,
      items: [
        {
          title: "Agent Accounts",
          url: "/dashboard/admin/agent-accounts",
          permission: "AgentAccount",
          icon: Proportions,
        },
        {
          title: "Supplier Accounts",
          url: "/dashboard/admin/supplier-accounts",
          permission: "SupplierAccount",
          icon: Proportions,
        },
      ].filter(item => hasPermission(item.permission)),
    },
    {
      value: "operation",
      label: "Operation",
      icon: Settings,
      items: [
        {
          title: "Agent Operations",
          url: "/dashboard/admin/all-agent",
          permission: "AgentOperation",
          icon: Settings,
        },
        {
          title: "Supplier Operations",
          url: "/dashboard/admin/all-supplier",
          permission: "SupplierOpration",
          icon: Settings,
        },
      ].filter(item => hasPermission(item.permission)),
    },
    {
      value: "product",
      label: "Product",
      icon: NotebookPen,
      items: [
        {
          title: "Agent Products",
          url: "#",
          permission: "Agent_product",
          icon: NotebookPen,
        },
        {
          title: "Supplier Products",
          url: "/dashboard/admin/vehicle-details",
          permission: "Supplier_product",
          icon: NotebookPen,
        },
      ].filter(item => hasPermission(item.permission)),
    },
  ].filter(tab => tab.items.length > 0);

  return (
    <DashboardContainer scrollable>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">
            Hi, {user.Company_name}
          </h2>
          
          <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                onClick={handleNotificationClick}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h3 className="font-semibold">Notifications</h3>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearNotifications}
                    disabled={notifications.length === 0}
                  >
                    Clear All
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setNotificationOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {notifications.length > 0 ? (
                <div className="max-h-60 overflow-y-auto">
                  {notifications.map((note, index) => (
                    <div 
                      key={index} 
                      className="px-4 py-3 border-b hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                          {note.type === 'order' ? (
                            <NotebookPen className="h-4 w-4 text-green-500" />
                          ) : note.type === 'supplier' ? (
                            <User className="h-4 w-4 text-blue-500" />
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                          )}
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm">{note.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(note.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No notifications yet
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {isSuperAdmin ? (
          // SuperAdmin View (original layout)
          <Tabs defaultValue="supplier" className="space-y-4">
            <TabsList>
              <TabsTrigger value="supplier">Supplier</TabsTrigger>
              <TabsTrigger value="agent">Agent</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
              <TabsTrigger value="booking">Booking</TabsTrigger>
            </TabsList>

            {/* Supplier Tab */}
            <TabsContent value="supplier" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Supplier</CardTitle>
                    <FileUser width={20} height={20} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">Supplier List</div>
                    <p className="text-xs text-muted-foreground">find all supplier here</p>
                  </CardContent>
                  <CardFooter>
                    <Link href="/dashboard/admin/all-supplier">
                      <Button variant="outline">View Supplier</Button>
                    </Link>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Supplier</CardTitle>
                    <IndianRupee width={20} height={20} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">Add Margin</div>
                    <p className="text-xs text-muted-foreground">add supplier-wise margin</p>
                  </CardContent>
                  <CardFooter>
                    <Link href="/dashboard/admin/add-margin">
                      <Button variant="outline">Add Margin</Button>
                    </Link>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Supplier</CardTitle>
                    <Car width={20} height={20} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">Vehicle Info</div>
                    <p className="text-xs text-muted-foreground">add vehicle model, brand, etc.</p>
                  </CardContent>
                  <CardFooter>
                    <Link href="/dashboard/admin/vehicle-details">
                      <Button variant="outline">Add Info</Button>
                    </Link>
                  </CardFooter>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Supplier</CardTitle>
                    <Route width={20} height={20} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">Transfer Info</div>
                    <p className="text-xs text-muted-foreground">View Supplier wise transfer</p>
                  </CardContent>
                  <CardFooter>
                    <Link href="/dashboard/admin/supplier-transfer">
                      <Button variant="outline">View Transfer</Button>
                    </Link>
                  </CardFooter>
                </Card>



                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Supplier</CardTitle>
                    <FileText width={20} height={20} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">Supplier Invoice</div>
                    <p className="text-xs text-muted-foreground">View Supplier wise invoice</p>
                  </CardContent>
                  <CardFooter>
                    <Link href="/dashboard/admin/supplier-invoice">
                      <Button variant="outline">View Invoice</Button>
                    </Link>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>

            {/* Agent Tab */}
            <TabsContent value="agent" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Agent</CardTitle>
                    <FileUser width={20} height={20} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">Agent List</div>
                    <p className="text-xs text-muted-foreground">find all agents here</p>
                  </CardContent>
                  <CardFooter>
                    <Link href="/dashboard/admin/all-agent">
                      <Button variant="outline">View Agent</Button>
                    </Link>
                  </CardFooter>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Agent</CardTitle>
                    <IndianRupee width={20} height={20} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">Add Margin</div>
                    <p className="text-xs text-muted-foreground">add agent-wise margin</p>
                  </CardContent>
                  <CardFooter>
                    <Link href="/dashboard/admin/agent-margin">
                      <Button variant="outline">Add Margin</Button>
                    </Link>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>

            {/* Admin Tab */}
            <TabsContent value="admin" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Admin</CardTitle>
                    <User width={20} height={20} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">Add Admin</div>
                    <p className="text-xs text-muted-foreground">add new admin here</p>
                  </CardContent>
                  <CardFooter>
                    <Link href="/dashboard/admin/add-admin">
                      <Button variant="outline">Add Admin</Button>
                    </Link>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
            {/* Booking Tab */}
            <TabsContent value="booking" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Booking</CardTitle>
                    <Car width={20} height={20} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">Booking List</div>
                    <p className="text-xs text-muted-foreground">find all booking here</p>
                  </CardContent>
                  <CardFooter>
                    <Link href="/dashboard/admin/all-booking">
                      <Button variant="outline">View Booking</Button>
                    </Link>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          // Admin View (new permission-based tabs)
          <Tabs defaultValue={adminTabs[0]?.value || ""} className="space-y-4">
            <TabsList>
              {adminTabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  <tab.icon className="mr-2 h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {adminTabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {tab.items.map((item) => (
                    <Card key={item.title}>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">{tab.label || item.title}</CardTitle>
                        {item.icon && <item.icon width={20} height={20} />}
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl font-bold">{item.title}</div>
                        <p className="text-xs text-muted-foreground">Manage {item.title.toLowerCase()}</p>
                      </CardContent>
                      <CardFooter>
                        <Link href={item.url}>
                          <Button variant="outline">View</Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </DashboardContainer>
  );
};

export default Page;