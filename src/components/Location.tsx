"use client";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  // CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Plane, Hotel, TrainFront, Bus, UsersRound, MapPin,Calendar as CalendarIcon, Clock as ClockIcon } from "lucide-react";
const placeTypeIcons: { [key: string]: JSX.Element } = {
  airport: <Plane className="w-6 h-6 text-blue-500 dark:text-sky-300" />,
  lodging: <Hotel className="w-6 h-6 text-yellow-500" />,
  establishment: <MapPin className="w-6 h-6 text-gray-500 dark:text-gray-100" />,
  train_station: <TrainFront className="w-6 h-6 text-green-500" />,
  bus_station: <Bus className="w-6 h-6 text-purple-500 dark:text-purple-200" />,
};

const defaultIcon = <MapPin className="w-6 h-6 text-gray-500 dark:text-gray-100" />;

const AutocompleteInput = ({ apiKey, onPlaceSelected }: any) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [selectedIcon, setSelectedIcon] = useState<JSX.Element | null>(null);

  useEffect(() => {
    const loadGoogleMapsScript = () => {
      if (document.querySelector("#google-maps-script")) {
        waitForGoogleMaps(initializeGoogleServices);
        return;
      }

      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => waitForGoogleMaps(initializeGoogleServices);
      document.head.appendChild(script);
    };

    const waitForGoogleMaps = (callback: () => void) => {
      const checkInterval = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(checkInterval);
          callback();
        }
      }, 500);
    };

    const initializeGoogleServices = () => {
      if (window.google?.maps?.places) setIsGoogleLoaded(true);
    };

    if (window.google?.maps?.places) {
      initializeGoogleServices();
    } else {
      loadGoogleMapsScript();
    }
  }, [apiKey]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    if (!inputValue) {
      setPredictions([]);
      return;
    }

    const service = new window.google.maps.places.AutocompleteService();
    service.getPlacePredictions(
      {
        input: inputValue,
        types: [
          "airport",
          "bus_station",
          "transit_station",
          "train_station",
          "lodging",
        ],
      },
      (results) => {
        setPredictions(results || []);
      }
    );
  };

  const handleSelectPlace = (placeId: string, description: string) => {
    const placesService = new window.google.maps.places.PlacesService(
      document.createElement("div")
    );
    placesService.getDetails({ placeId }, (place) => {
      if (place && place.geometry) {
        onPlaceSelected(place);
        const placeTypes = place.types || [];
        const icon = placeTypes.find((type) => placeTypeIcons[type]) ? (
          placeTypeIcons[placeTypes.find((type) => placeTypeIcons[type])!]
        ) : (
          <MapPin className="text-gray-500" />
        );

        setSelectedIcon(icon);
        setPredictions([]);
        if (inputRef.current) inputRef.current.value = description;
      }
    });
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        {/* Icon inside input */}
        <span className="absolute left-4 text-xl text-gray-500 w-6 h-6 flex items-center justify-center">
          {selectedIcon || <MapPin className="text-gray-500 dark:text-gray-300" />}
        </span>

        <input
          ref={inputRef}
          type="text"
          className="w-full bg-slate-100 dark:text-white dark:bg-slate-500 border border-gray-300 dark:border-gray-600 pl-12 p-3 text-lg rounded-sm ring-1 ring-slate-300 focus-visible:ring-0 focus-visible:ring-offset-0"
          // className="flex h-9 w-full rounded-md border border-input bg-transparent pl-12 p-3 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          // className=" bg-slate-100 dark:bg-slate-500 border-0 rounded-sm ring-1 ring-slate-300 focus-visible:ring-0 focus-visible:ring-offset-0 text-black dark:text-white p-1"
          placeholder={
            isGoogleLoaded ? "Search a location..." : "Loading Google Maps..."
          }
          disabled={!isGoogleLoaded}
          onChange={handleInputChange}
        />
      </div>

      {/* Dropdown suggestions */}
      {predictions.length > 0 && (
        <ul className="absolute z-50 mt-2 w-full bg-white dark:text-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
          {predictions.map((prediction) => {
            const type =
              prediction.types?.find((t) => placeTypeIcons[t]) ||
              "establishment";
            return (
              <li
                key={prediction.place_id}
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-blue-100 dark:hover:bg-gray-700 transition-all duration-200 rounded-md"
                onClick={() =>
                  handleSelectPlace(prediction.place_id, prediction.description)
                }
              >
                <span className="w-6 h-6 flex items-center justify-center">
                  {placeTypeIcons[type] || defaultIcon}
                </span>
                <span className="text-lg font-medium">
                  {prediction.description}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};





// Define the validation schema with date and time fields

const DateInput = ({ value, onChange, ...props }) => {
  const inputRef = useRef(null);
  const [showPlaceholder, setShowPlaceholder] = useState(!value);

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.showPicker();
    }
  };

  const handleChange = (e) => {
    onChange(e.target.value);
    setShowPlaceholder(!e.target.value);
  };

  const handleBlur = () => {
    setShowPlaceholder(!inputRef.current?.value);
  };

  return (
    <div className="relative" onClick={handleClick}>
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`w-full bg-slate-100 dark:bg-slate-500 border-0 rounded-sm ring-1 ring-slate-300 focus-visible:ring-0 focus-visible:ring-offset-0 text-black dark:text-white p-2 appearance-none cursor-pointer ${
          showPlaceholder ? "text-transparent" : ""
        }`}
        {...props}
      />
      {showPlaceholder && (
        <div className="absolute inset-0 flex items-center px-2 pointer-events-none text-gray-400 dark:text-gray-300">
          DD-MM-YYYY
        </div>
      )}
      {/* <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-300 pointer-events-none" /> */}
    </div>
  );
};

const TimeInput = ({ value, onChange, ...props }) => {
  const inputRef = useRef(null);
  const [showPlaceholder, setShowPlaceholder] = useState(!value);

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.showPicker();
    }
  };

  const handleChange = (e) => {
    onChange(e.target.value);
    setShowPlaceholder(!e.target.value);
  };

  const handleBlur = () => {
    setShowPlaceholder(!inputRef.current?.value);
  };

  return (
    <div className="relative" onClick={handleClick}>
      <input
        ref={inputRef}
        type="time"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`w-full bg-slate-100 dark:bg-slate-500 border-0 rounded-sm ring-1 ring-slate-300 focus-visible:ring-0 focus-visible:ring-offset-0 text-black dark:text-white p-2 appearance-none cursor-pointer ${
          showPlaceholder ? "text-transparent" : ""
        }`}
        {...props}
      />
      {showPlaceholder && (
        <div className="absolute inset-0 flex items-center px-2 pointer-events-none text-gray-400 dark:text-gray-300">
          HH:MM
        </div>
      )}
      {/* <ClockIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-300 pointer-events-none" /> */}
    </div>
  );
};


const formSchema = z.object({
  pickup: z.string().min(1, { message: "Pick Up is Required" }),
  dropoff: z.string().min(1, { message: "Drop Off is Required" }),
  pax: z.string().min(1, { message: "Passenger is required" }),
  date: z.string().min(1, { message: "Date is required" }), // Date for the journey
  time: z.string().min(1, { message: "Time is required" }), // Time for the journey
  returnDate: z.string().optional(), // Optional return date
  returnTime: z.string().optional(), // Optional return time
});
type FormData = z.infer<typeof formSchema>;
// export default function Location() {
export default function Location({ onFormSubmit }: { onFormSubmit: () => void }) {
  const [fromCoords, setFromCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [toCoords, setToCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [showReturnFields, setShowReturnFields] = useState(false); // State to toggle return date/time fields
  const googleMapsApiKey = "AIzaSyAjXkEFU-hA_DSnHYaEjU3_fceVwQra0LI";
  const { toast } = useToast();
  const router = useRouter();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pickup: "",
      dropoff: "",
      pax: "1",
      date: "",
      time: "",
      returnDate: "",
      returnTime: "",
    },
  });

  const handleSelectFrom = (place: any) => {
    const location = place.geometry.location;
    setFromCoords({ lat: location.lat(), lng: location.lng() });
  };

  const handleSelectTo = (place: any) => {
    const location = place.geometry.location;
    setToCoords({ lat: location.lat(), lng: location.lng() });
  };


  const onSubmit = (data: FormData) => {
    if (!fromCoords || !toCoords) {
      toast({
        title: "Valid Location",
        description: "Please select valid locations for both Pickup and Dropoff.",
        variant: "destructive",
      });
      return;
    }
  
    // Convert form data into query parameters
    const queryParams = new URLSearchParams({
      pickup: data.pickup,
      dropoff: data.dropoff,
      pax: data.pax,
      date: data.date,
      time: data.time,
      returnDate: data.returnDate || "",
      returnTime: data.returnTime || "",
      pickupLocation: `${fromCoords.lat},${fromCoords.lng}`,
      dropoffLocation: `${toCoords.lat},${toCoords.lng}`,
    }).toString();
  

     // Call the callback to hide the form
    if (onFormSubmit) {
      onFormSubmit();
    }
    // Navigate to the transfer page with query parameters
    router.push(`/transfer?${queryParams}`);
  };
  



  const toggleReturnFields = () => {
    setShowReturnFields(!showReturnFields); // Toggle return date/time fields
  };

  return (
    <div className="w-[70%]">
      <Card className=" bg-blue-100/[.5] dark:bg-blend-darken dark:text-primary-foreground">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-medium">
            Book Your Rides
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                {/* Pickup Location */}
                <FormField
                  control={form.control}
                  name="pickup"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="uppercase text-xs font-bold text-blue-400 dark:text-white">
                        Pickup Location
                      </FormLabel>
                      <FormControl>
                        <div className="relative w-full">
                          <AutocompleteInput
                            apiKey={googleMapsApiKey}
                            onPlaceSelected={(place) => {
                              handleSelectFrom(place);
                              form.setValue("pickup", place.formatted_address);
                            }}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Dropoff Location */}
                <FormField
                  control={form.control}
                  name="dropoff"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="uppercase text-xs font-bold text-blue-400 dark:text-white">
                        Dropoff Location
                      </FormLabel>
                      <FormControl>
                        <div className="relative w-full">
                          <AutocompleteInput
                            apiKey={googleMapsApiKey}
                            onPlaceSelected={(place) => {
                              handleSelectTo(place);
                              form.setValue("dropoff", place.formatted_address);
                            }}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
               

<FormField
  control={form.control}
  name="pax"
  render={({ field }) => (
    <FormItem className="flex flex-col">
      <FormLabel className="uppercase text-xs font-bold text-blue-400 dark:text-white">
        Number of Passengers
      </FormLabel>
      <FormControl>
        <div className="relative flex items-center">
          <select
            {...field}
            value={field.value || "1"} // Ensure a value is always set
            className="w-full bg-slate-100 dark:bg-slate-500 border-0 rounded-sm ring-1 ring-slate-300 focus-visible:ring-0 focus-visible:ring-offset-0 text-black dark:text-white p-2 appearance-none"
          >
            {Array.from({ length: 50 }, (_, i) => i + 1).map((num) => (
              <option key={num} value={num.toString()}> {/* Convert to string */}
                {num} {num === 1 ? 'Passenger' : 'Passengers'}
              </option>
            ))}
          </select>
          <span className="absolute right-3 text-xl text-gray-500 w-6 h-6 flex items-center justify-center pointer-events-none">
            <UsersRound className="w-5 h-5 text-gray-500 dark:text-gray-300" />
          </span>
        </div>
      </FormControl>
      <FormMessage>
        {form.formState.errors.pax?.message}
      </FormMessage>
    </FormItem>
  )}
/>


                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                 

                    <FormField
  control={form.control}
  name="date"
  render={({ field }) => (
    <FormItem className="flex flex-col">
      <FormLabel className="uppercase text-xs font-bold text-blue-400 dark:text-white">
        Date
      </FormLabel>
      <FormControl>
        <DateInput
          value={field.value}
          onChange={field.onChange}
        />
      </FormControl>
      <FormMessage>
        {form.formState.errors.date?.message}
      </FormMessage>
    </FormItem>
  )}
/>

                 

                    <FormField
  control={form.control}
  name="time"
  render={({ field }) => (
    <FormItem className="flex flex-col">
      <FormLabel className="uppercase text-xs font-bold text-blue-400 dark:text-white">
        Time
      </FormLabel>
      <FormControl>
        <TimeInput
          value={field.value}
          onChange={field.onChange}
        />
      </FormControl>
      <FormMessage>
        {form.formState.errors.time?.message}
      </FormMessage>
    </FormItem>
  )}
/>


                </div>
              </div>

              {/* Passenger Field */}

              {/* Return Button to toggle return fields */}
              <Button
                className="mr-1 text-black dark:text-white bg-slate-100 dark:bg-slate-500 hover:text-white"
                type="button"
                onClick={toggleReturnFields}
    
              >
                {showReturnFields ? "Remove Return" : "Add Return"}
              </Button>

              {/* Conditional Return Date and Time Fields */}
              {showReturnFields && (
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                 
                  <FormField
  control={form.control}
  name="returnDate"
  render={({ field }) => (
    <FormItem className="flex flex-col">
      <FormLabel className="uppercase text-xs font-bold text-blue-400 dark:text-white">
        Return Date
      </FormLabel>
      <FormControl>
        <DateInput
          value={field.value}
          onChange={field.onChange}
        />
      </FormControl>
      <FormMessage>
        {form.formState.errors.returnDate?.message}
      </FormMessage>
    </FormItem>
  )}
/>
                  

                    <FormField
  control={form.control}
  name="returnTime"
  render={({ field }) => (
    <FormItem className="flex flex-col">
      <FormLabel className="uppercase text-xs font-bold text-blue-400 dark:text-white">
        Return Time
      </FormLabel>
      <FormControl>
        <TimeInput
          value={field.value}
          onChange={field.onChange}
        />
      </FormControl>
      <FormMessage>
        {form.formState.errors.returnTime?.message}
      </FormMessage>
    </FormItem>
  )}
/>

                </div>
              )}
              <Button
                className="bg-blue-500 dark:bg-card-foreground"
                type="submit"
                // disabled={isSubmiting}
              >
                {/* {isSubmiting ? "Searching..." : "See Results"} */}
                See Results
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
