import VehicleBrand from "@/components/admin/VehicleBrand";
import VehicleModel from "@/components/admin/VehicleModel";
import VehicleType from "@/components/admin/VehicleType";
import DashboardContainer from "@/components/layout/DashboardContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const page = () => {
  return (
    <DashboardContainer scrollable>
      <Tabs defaultValue="type" className="">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="type">Vehicle Type</TabsTrigger>
          <TabsTrigger value="brand">Vehicle Brand</TabsTrigger>
          <TabsTrigger value="model">Vehicle Model</TabsTrigger>
        </TabsList>
        <TabsContent value="type" className="flex items-center justify-center">
          <VehicleType/>
        </TabsContent>
        <TabsContent value="brand" className="flex items-center justify-center">
            <VehicleBrand/>
        </TabsContent>
        <TabsContent value="model" className="flex items-center justify-center">
            <VehicleModel/>
        </TabsContent>
      </Tabs>
    </DashboardContainer>
  );
};

export default page;
