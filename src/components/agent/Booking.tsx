
"use client";

import { Car } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Separator } from "../ui/separator";
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
import { Button } from "../ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
// Define the schema for the form
const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Please enter a valid email" }),
  mobile: z.string().min(1, { message: "Mobile Number is required" }),
  paymentMethod: z.enum(["pay_now", "already_paid"]),
  referenceNumber: z.string().optional(),
  pickupType: z.enum(["airport", "cruise", "station","hotel", "others"]),
  // GST fields
  // gstRequired: z.enum(["yes", "no"]),
  // gstNumber: z.string().optional(),
  // Airport fields
  planeArrivingFrom: z.string().optional(),
  airlineName: z.string().optional(),
  flightNumber: z.string().optional(),
  // Cruise fields
  cruiseShipName: z.string().optional(),
  // Station fields
  trainArrivingFrom: z.string().optional(),
  trainName: z.string().optional(),
  trainOperator: z.string().optional(),
  // Hotel fields
  hotelName: z.string().optional(),
  pickupAddress: z.string().optional(),
  //Other fields
  venueAddress:z.string().optional(),
  // Dropoff fields
  destinationName: z.string().optional(),
  destinationAddress: z.string().optional(),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

const Booking = ({ bookingInfo, setBookingInfo, nextStep }) => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState("pay_now");
  const [pickupType, setPickupType] = useState("airport");
  // const [gstRequired, setGstRequired] = useState("no");
  const [totalPrice, setTotalPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      mobile: "",
      paymentMethod: "pay_now",
      referenceNumber: "",
      pickupType: "airport",
      // gstRequired: "no",
      // gstNumber: "",
      planeArrivingFrom: "",
      airlineName: "",
      flightNumber: "",
      cruiseShipName: "",
      trainArrivingFrom: "",
      trainName: "",
      trainOperator: "",
      hotelName: "",
      pickupAddress: "",
      venueAddress:"",
      destinationName: "",
      destinationAddress: "",
      termsAccepted: false,
    },
  });

  // Calculate total price with GST
  useEffect(() => {
    const basePrice = Number(bookingInfo?.vehicle?.price || 0);
    const extraCost = Number(bookingInfo?.extraCost || 0);
    // const isReturnTrip = bookingInfo?.returnDate && bookingInfo?.returnTime;
    // let calculatedTotal = (basePrice + extraCost) * (isReturnTrip ? 2 : 1);
    // let calculatedTotal = (basePrice + extraCost);
     const calculatedTotal = (basePrice + extraCost);
    // Add 5% GST if required
    // if (gstRequired === "yes") {
    //   calculatedTotal = calculatedTotal * 1.05;
    // }
    
  //   setTotalPrice(calculatedTotal);
  // }, [bookingInfo, gstRequired]);
    setTotalPrice(calculatedTotal);
  }, [bookingInfo]);

  const handleSubmit = async (data) => {
    setIsLoading(true);
    if (!bookingInfo) {
      console.error("Booking info is missing");
      setIsLoading(false);
      return;
    }

    // Prepare pickup details based on selected type
    let pickupDetails = {};
    switch (data.pickupType) {
      case "airport":
        pickupDetails = {
          pickupType: "airport",
          planeArrivingFrom: data.planeArrivingFrom,
          airlineName: data.airlineName,
          flightNumber: data.flightNumber,
        };
        break;
      case "cruise":
        pickupDetails = {
          pickupType: "cruise",
          cruiseShipName: data.cruiseShipName,
        };
        break;
      case "station":
        pickupDetails = {
          pickupType: "station",
          trainArrivingFrom: data.trainArrivingFrom,
          trainName: data.trainName,
          trainOperator: data.trainOperator,
        };
        break;
      case "hotel":
        pickupDetails = {
          pickupType: "hotel",
          hotelName: data.hotelName,
          pickupAddress: data.pickupAddress,
        };
        break;
      case "others":
        default:
        pickupDetails = {
          pickupType: "others",
          venueAddress:data.venueAddress,
        };
    }

    const bookingData = {
      suplier_id: bookingInfo?.vehicle?.suplier_id,
      vehicle_id: bookingInfo?.vehicle?.vehicle_id,
      vehicleName: `${bookingInfo?.vehicle?.brand} (${bookingInfo?.vehicle?.vehicalType})`,
      agent_id: bookingInfo?.agent_id,
      agent_email: bookingInfo?.agent_email,
      pickup_location: bookingInfo?.pickup,
      drop_location: bookingInfo?.dropoff,
      passenger:bookingInfo?.pax,
      pickupTime:bookingInfo?.time,
      pickupDate:bookingInfo?.date,
      returnTime:bookingInfo?.returnTime,
      returnDate:bookingInfo?.returnDate,
      pickup_lat: bookingInfo?.pickup_lat,
      pickup_lng: bookingInfo?.pickup_lng,
      drop_lat: bookingInfo?.drop_lat,
      drop_lng: bookingInfo?.drop_lng,
      distance_miles: bookingInfo?.distance_miles,
      price: totalPrice, // Use the calculated total price with GST
      currency: bookingInfo?.targetCurrency,
      agent_address: bookingInfo?.agent_address,
      agent_city: bookingInfo?.agent_city,
      agent_country: bookingInfo?.agent_country,
      agent_zipcode: bookingInfo?.agent_zipcode,
      reference_number:
        data.paymentMethod === "already_paid" ? data.referenceNumber : null,
      passenger_name: data.name,
      passenger_email: data.email,
      passenger_phone: data.mobile,
      // gst_required: data.gstRequired,
      // gst_number: data.gstRequired === "yes" ? data.gstNumber : null,
      
      pickupDetails,
      dropoffDetails: {
        destinationName: data.destinationName,
        destinationAddress: data.destinationAddress,
      },
    };

    try {
      const response = await fetch(
        `${API_BASE_URL}/${
          data.paymentMethod === "pay_now"
            ? "payment/payment-iniciate"
            : "payment/referencePayment"
        }`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bookingData),
        }
      );
      
      if (!response.ok) throw new Error("Failed to submit booking");
      const result = await response.json();

      if (result && result.paymentUrl && result.formData) {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = result.paymentUrl;

        // Add form fields returned from backend
        Object.entries(result.formData).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      } else {
        console.error("Invalid response from the server");
      }

      toast({
        title: "Booking Confirmed",
        description: "Your booking has been created successfully!",
      });

      setBookingInfo((prev) => ({
        ...prev,
        orderId: result.orderId,
        passenger: {
          name: data.name,
          email: data.email,
          mobile: data.mobile,
        },
        // gstDetails: {
        //   gstRequired: data.gstRequired,
        //   gstNumber: data.gstNumber,
        // },
        pickupDetails,
        dropoffDetails: {
          destinationName: data.destinationName,
          destinationAddress: data.destinationAddress,
        },
        totalPrice: totalPrice, // Store the calculated total with GST
      }));
      
      if (data.paymentMethod !== "pay_now") {
        nextStep();
      }
    } catch (error) {
      // console.error("Error submitting booking:", error);
      toast({
        title: "Booking Failed",
        description: "Failed to create booking.",
        variant: "destructive",
      });
    }finally {
      setIsLoading(false); 
    }
  };

  if (!bookingInfo) return <p>Loading...</p>;

  return (
    <div className="flex flex-col md:flex-row gap-5">
      <Card className="md:w-1/3">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1">
            <Car width={20} height={20} />
            <Separator className="shrink" />
          </div>
          <dl>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Vehicle</dt>
              <dd>{bookingInfo?.vehicle?.brand || "N/A"}</dd>
            </div>
             <div className="flex flex-col">
              <dt className="text-muted-foreground">From</dt>
              <dd>
                {bookingInfo?.pickup}
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-muted-foreground">To</dt>
              <dd>
                {bookingInfo?.dropoff}
              </dd>
            </div>
             <div className="flex justify-between">
              <dt className="text-muted-foreground">PickUp Date</dt>
              <dd>{bookingInfo?.date || "N/A"}</dd>
            </div>
             <div className="flex justify-between">
              <dt className="text-muted-foreground">PickUp Time</dt>
              <dd>{bookingInfo?.time || "N/A"}</dd>
            </div>
             <div className="flex justify-between">
              <dt className="text-muted-foreground">Passengers</dt>
              <dd>{bookingInfo?.pax || "N/A"}</dd>
            </div>
            {/* {gstRequired === "yes" && (
              <>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Base Price</dt>
                  <dd>{`${bookingInfo?.targetCurrency} ${(totalPrice / 1.05).toFixed(2)}`}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">GST (5%)</dt>
                  <dd>{`${bookingInfo?.targetCurrency} ${(totalPrice * 0.05).toFixed(2)}`}</dd>
                </div>
              </>
            )} */}
            <div className="flex justify-between font-semibold">
              <dt className="text-muted-foreground">Total Cost</dt>
              <dd>{`${bookingInfo?.targetCurrency} ${totalPrice.toFixed(2)}`}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      <ScrollArea className="md:w-2/3 rounded-xl border">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Transfer Details</CardTitle>
            <CardTitle>Passenger Information (Lead Passenger)</CardTitle>
            <CardDescription>Details are used in Voucher</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6"
              >
                {/* Passenger Information */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Number</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} min="0"/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Pickup Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Pickup Details</h3>
                  <FormField
                    control={form.control}
                    name="pickupType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pickup Type</FormLabel>
                        <RadioGroup
                          value={field.value}
                          onValueChange={(val) => {
                            field.onChange(val);
                            setPickupType(val);
                          }}
                          className="grid grid-cols-2 gap-4"
                        >
                          <FormItem className="flex items-end space-x-2">
                            <FormControl>
                              <RadioGroupItem value="airport" id="airport" />
                            </FormControl>
                            <FormLabel htmlFor="airport" className="">Airport</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-end space-x-2">
                            <FormControl>
                              <RadioGroupItem value="cruise" id="cruise" />
                            </FormControl>
                            <FormLabel htmlFor="cruise">Cruise</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-end space-x-2">
                            <FormControl>
                              <RadioGroupItem value="station" id="station" />
                            </FormControl>
                            <FormLabel htmlFor="station">Station</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-end space-x-2">
                            <FormControl>
                              <RadioGroupItem value="hotel" id="hotel" />
                            </FormControl>
                            <FormLabel htmlFor="station">Hotel</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-end space-x-2">
                            <FormControl>
                              <RadioGroupItem value="others" id="others" />
                            </FormControl>
                            <FormLabel htmlFor="others">Others</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormItem>
                    )}
                  />

                  {/* Airport Fields */}
                  {pickupType === "airport" && (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="planeArrivingFrom"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Plane Arriving From</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="airlineName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Airline Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="flightNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Flight Number</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Cruise Fields */}
                  {pickupType === "cruise" && (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="cruiseShipName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cruise Ship Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Station Fields */}
                  {pickupType === "station" && (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="trainArrivingFrom"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Train Arriving From</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="trainName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Train Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="trainOperator"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Train Operator</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Hotel Fields */}
                  {pickupType === "hotel" && (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="hotelName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hotel/Property Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="pickupAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Others Fields */}
                  {pickupType === "others" && (
                    <div className="space-y-4">
                      
                      <FormField
                        control={form.control}
                        name="venueAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Venue Address</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>

                {/* Dropoff Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Dropoff Details</h3>
                  <FormField
                    control={form.control}
                    name="destinationName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destination Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="destinationAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destination Address</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* GST Option */}
                {/* <div className="space-y-4">
                  <h3 className="text-lg font-semibold">GST Information</h3>
                  <FormField
                    control={form.control}
                    name="gstRequired"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Do you need GST invoice?</FormLabel>
                        <RadioGroup
                          value={field.value}
                          onValueChange={(val) => {
                            field.onChange(val);
                            setGstRequired(val);
                          }}
                          className="flex space-x-4"
                        >
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="yes" id="gst_yes" />
                            </FormControl>
                            <FormLabel htmlFor="gst_yes">Yes</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="no" id="gst_no" />
                            </FormControl>
                            <FormLabel htmlFor="gst_no">No</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormItem>
                    )}
                  />
                  {gstRequired === "yes" && (
                    <FormField
                      control={form.control}
                      name="gstNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GST Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter your GST number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div> */}


                  {/* Terms and Conditions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Terms & Conditions</h3>
                  <FormField
                    control={form.control}
                    name="termsAccepted"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            By clicking this checkbox, you agree to the terms and conditions
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>


                {/* Payment Method */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Payment Method</h3>
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <RadioGroup
                          value={field.value}
                          onValueChange={(val) => {
                            field.onChange(val);
                            setPaymentMethod(val);
                          }}
                        >
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="pay_now" id="pay_now" />
                            </FormControl>
                            <FormLabel htmlFor="pay_now">Pay Now</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem
                                value="already_paid"
                                id="already_paid"
                              />
                            </FormControl>
                            <FormLabel htmlFor="already_paid">
                              Already Paid
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormItem>
                    )}
                  />
                  {paymentMethod === "already_paid" && (
                    <FormField
                      control={form.control}
                      name="referenceNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reference Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* <Button type="submit">Proceed</Button> */}
                 <Button type="submit" disabled={isLoading}>
        {isLoading ? "Processing..." : "Proceed"}
      </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </ScrollArea>
    </div>
  );
};

export default Booking;
