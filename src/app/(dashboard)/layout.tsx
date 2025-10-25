import AppSidebar from "@/components/sidebar/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
const DashboardLayout = ({children}:{children:React.ReactNode}) => {
  return (
    <SidebarProvider>
    <AppSidebar>{children}</AppSidebar></SidebarProvider>
  )
}

export default DashboardLayout