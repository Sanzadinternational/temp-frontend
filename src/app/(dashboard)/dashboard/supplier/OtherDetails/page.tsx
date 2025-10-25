"use client";
import { useState, useEffect } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
// import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchWithAuth } from "@/components/utils/api";
import { removeToken } from "@/components/utils/auth";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// Validation Schema
const formSchema = z.object({
  uniqueId: z.string().min(1, { message: "Please select a vehicle" }),
  Currency: z.string().min(1, { message: "Currency is required" }),
  HalfDayRide: z.enum(["yes", "no"]).optional(),
  FullDayRide: z.enum(["yes", "no"]).optional(),
  VehicleRent: z.string().optional(),
  Fuel: z.enum(["included", "not-included"]).optional(),
  Driver: z.enum(["included", "not-included"]).optional(),
  Parking: z.enum(["included", "not-included"]).optional(),
  TollTax: z.enum(["included", "not-included"]).optional(),
  DriverTips: z.enum(["included", "not-included"]).optional(),
  ParkingFee: z.string().optional(),
  TollFee: z.string().optional(),
  Tip: z.string().optional(),
  Others: z.string().optional(),
  HalfFullNightTime: z.enum(["yes", "no"]).optional(),
  HalfFullNightTimePrice: z.string().optional(),
});

const OtherDetailsForm = () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  //   const { toast } = useToast();
  //   const [isLoading, setIsLoading] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      uniqueId: "",
      Currency: "Rs",
      VehicleRent: "",
      ParkingFee: "",
      TollFee: "",
      Others: "",
      Tip: "",
      Fuel: "included",
      Driver: "included",
      HalfDayRide: "no",
      FullDayRide: "no",
      Parking: "included",
      TollTax: "included",
      DriverTips: "included",
      HalfFullNightTime: "no",
    },
  });
  const Currency = form.watch("Currency");
  const HalfDayRide = form.watch("HalfDayRide");
  const FullDayRide = form.watch("FullDayRide");
  const Parking = form.watch("Parking");
  const TollTax = form.watch("TollTax");
  const DriverTips = form.watch("DriverTips");
  const HalfFullNightTime = form.watch("HalfFullNightTime");
  // ✅ Fetch User & Vehicles in One Efficient Call
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await fetchWithAuth(
          `${API_BASE_URL}/supplier/dashboard`
        );
        const vehicleResponse = await fetch(
          `${API_BASE_URL}/supplier/getCarDetails/${userData.userId}`
        );
        if (!vehicleResponse.ok) throw new Error("Failed to fetch vehicles");

        const vehicleData = await vehicleResponse.json();
        const processedVehicles = vehicleData.map(
          (item: any) => item.Car_Details
        );

        setVehicles(processedVehicles);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "Something went wrong");
        removeToken();
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    console.log("Form Submitted:", data); // Log form values

  };
  if (loading) {
    return (
      <div className="space-y-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center">Error: {error}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Other Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <div className="relative flex py-3 items-center">
              <div className="flex-grow border-t border-gray-400"></div>
              <span className="flex-shrink mx-4 text-gray-400">
                Select Vehicle
              </span>
              <div className="flex-grow border-t border-gray-400"></div>
            </div>
            <div className="grid grid-cols-2 justify-between items-center gap-4">
            <FormField
              control={form.control}
              name="uniqueId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Vehicle</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.length === 0 ? (
                          <p className="text-red-500 text-center p-2">
                            No vehicles found
                          </p>
                        ) : (
                          vehicles.map((vehicle) => (
                            <SelectItem
                              key={vehicle.uniqueId}
                              value={vehicle.uniqueId}
                            >
                              {vehicle.VehicleBrand} ({vehicle.VehicleModel})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="Currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <FormControl>
                    <Select
                      {...field}
                      value={`${field.value}`}
                      onValueChange={(value) => field.onChange(value)}
                      // onValueChange={handleCurrencyChange}
                      // value={currency}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Rs">Rs</SelectItem>
                        <SelectItem value="usd">USD</SelectItem>
                        <SelectItem value="ed">ED</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            </div>
            <div className="relative flex py-3 items-center">
              <div className="flex-grow border-t border-gray-400"></div>
              <span className="flex-shrink mx-4 text-gray-400">
                Others Details
              </span>
              <div className="flex-grow border-t border-gray-400"></div>
            </div>
            <div>
              <div className="grid grid-cols-2 justify-between items-center">
                <FormField
                  control={form.control}
                  name="HalfDayRide"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Half Day Ride (4hrs)</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value || "no"}
                          className="flex items-center"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="yes" />
                            </FormControl>
                            <FormLabel className="font-normal">Yes</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="no" />
                            </FormControl>
                            <FormLabel className="font-normal">No</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="FullDayRide"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Full Day Ride (8hrs)</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value || "no"}
                          className="flex items-center"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="yes" />
                            </FormControl>
                            <FormLabel className="font-normal">Yes</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="no" />
                            </FormControl>
                            <FormLabel className="font-normal">No</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Show Inclusions Only If HalfDayRide or FullDayRide is "yes" */}
              {(HalfDayRide === "yes" || FullDayRide === "yes") && (
                <div>
                  <div className="mt-2">
                    <FormField
                      control={form.control}
                      name="HalfFullNightTime"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>
                            Night Time Supplements (10PM-06AM)
                          </FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value || "no"}
                              className="flex items-center"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="yes" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Yes
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="no" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  No
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {HalfFullNightTime === "yes" && (
                      <FormField
                        control={form.control}
                        name="HalfFullNightTimePrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Night Time Price (per hour)</FormLabel>
                            <FormControl>
                              <div className="flex justify-center w-1/2 md:w-1/4">
                                <span className="bg-secondary px-2 py-1 rounded-sm">
                                  {Currency.toUpperCase()}
                                </span>
                                <Input
                                  placeholder="Night Time Price"
                                  {...field}
                                  value={field.value || ""}
                                  type="number"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  <CardDescription className="text-lg mt-2">
                    Inclusions
                  </CardDescription>
                  <div>
                    <FormField
                      control={form.control}
                      name="VehicleRent"
                      render={({ field }) => (
                        <FormItem className="w-1/4">
                          <FormLabel>Vehicle Rent</FormLabel>
                          <FormControl>
                            <div className="flex justify-center">
                              <span className="bg-secondary px-2 py-1 rounded-sm">
                                {Currency.toUpperCase()}
                              </span>
                              <Input
                                placeholder="Vehicle Rent"
                                {...field}
                                type="number"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <FormField
                        control={form.control}
                        name="Fuel"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Fuel</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value || "included"}
                                className="flex items-center"
                              >
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="included" />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    Included
                                  </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="not-included" />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    Not Included
                                  </FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="Driver"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Driver</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value || "included"}
                                className="flex items-center"
                              >
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="included" />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    Included
                                  </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="not-included" />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    Not Included
                                  </FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 justify-between items-center gap-2 mt-4">
                      <div className="flex flex-col gap-2">
                        <FormField
                          control={form.control}
                          name="Parking"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel>Parking</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value || "included"}
                                  className="flex items-center"
                                >
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="included" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      Included
                                    </FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="not-included" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      Not Included
                                    </FormLabel>
                                  </FormItem>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {Parking === "not-included" && (
                          <FormField
                            control={form.control}
                            name="ParkingFee"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Parking Fee</FormLabel>
                                <FormControl>
                                  <div className="flex justify-center">
                                    <span className="bg-secondary px-2 py-1 rounded-sm">
                                      {Currency.toUpperCase()}
                                    </span>
                                    <Input
                                      placeholder="Parking Fee"
                                      {...field}
                                      type="number"
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <FormField
                          control={form.control}
                          name="TollTax"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel>Toll-Tax</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value || "included"}
                                  className="flex items-center"
                                >
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="included" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      Included
                                    </FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="not-included" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      Not Included
                                    </FormLabel>
                                  </FormItem>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {TollTax === "not-included" && (
                          <FormField
                            control={form.control}
                            name="TollFee"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Toll Fees</FormLabel>
                                <FormControl>
                                  <div className="flex justify-center">
                                    <span className="bg-secondary px-2 py-1 rounded-sm">
                                      {Currency.toUpperCase()}
                                    </span>
                                    <Input
                                      placeholder="Toll Fees"
                                      {...field}
                                      type="number"
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <FormField
                          control={form.control}
                          name="DriverTips"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel>Driver Tips</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value || "included"}
                                  className="flex items-center"
                                >
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="included" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      Included
                                    </FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="not-included" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      Not Included
                                    </FormLabel>
                                  </FormItem>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {DriverTips === "not-included" && (
                          <FormField
                            control={form.control}
                            name="Tip"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tip</FormLabel>
                                <FormControl>
                                  <div className="flex justify-center">
                                    <span className="bg-secondary px-2 py-1 rounded-sm">
                                      {Currency.toUpperCase()}
                                    </span>
                                    <Input
                                      placeholder="Tip"
                                      {...field}
                                      type="number"
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="Others"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Others</FormLabel>
                          <FormControl>
                            <Input placeholder="Others" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
            </div>
            <Button type="submit">
              {/* {isLoading ? "Saving..." : "Save Vehicle Details"} */}
              Save Vehicle Details
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default OtherDetailsForm;
