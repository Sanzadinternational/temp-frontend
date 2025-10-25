"use client";

import * as z from "zod";
import { useState } from "react";
// import Image from "next/image";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";


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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import CountryCityAPI from "../api/CountryCityAPI";
import { useToast } from "@/hooks/use-toast";
import { ChooseCurrency } from "../constants/currency";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface FormattedCountry {
  name: string;
  flag: string;
  dialCode: string;
  states: {
    name: string;
    cities: string[];
  }[];
}

const chooseCurrency = ChooseCurrency;

const AgentRegistration: React.FC = () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  // const [countries, setCountries] = useState<Country[]>([]);
const [countries, setCountries] = useState<FormattedCountry[]>([]);
const [states, setStates] = useState<{name: string; cities: string[]}[]>([]);
const [cities, setCities] = useState<string[]>([]);


  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");
  const [selectedDialCode, setSelectedDialCode] = useState<string>("");
  const [selectedFlag, setSelectedFlag] = useState<string>("");
  const [otpSent, setOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
   const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const router = useRouter();

const formSchema = z.object({
  Company_name: z.string().min(1, { message: "Company Name is Required" }),
  Address: z.string().min(1, { message: "Address is Required" }),
  Email: z
    .string()
    .min(1, { message: "Email is Required" })
    .email({ message: "Please enter valid email" }),
  Password: z.string().min(1, { message: "Password is Required" }),
  Zip_code: z.string().min(1, { message: "Zipcode is Required" }),
  IATA_Code: z.string().optional(),
  Country: z.string().min(1, { message: "Country is required" }),
  // City: z.string().min(1, { message: "City is required" }),
  State: z.string().min(1, { message: "State is required" }),
   City: z.string().optional(),
  Gst_Vat_Tax_number: z.string().min(1, { message: "Tax Number is required" }),
  Contact_Person: z.string(),
  Otp: z.string(),
  Office_number: z.string().min(1, { message: "Office No. is required" }),
  Mobile_number: z.string().optional(),
  Currency: z.string().min(1, { message: "Currency is required" }),
  Gst_Tax_Certificate: z.any().refine((file) => file instanceof File, {
    message: "Upload document is required",
  }),
  COI_Certificate: z.any().refine((file) => file instanceof File, {
    message: "Certificate of Incorporation is required",
  }),
}).superRefine((data, ctx) => {
  // Custom validation - City is required only if cities are available
  const selectedState = states.find(state => state.name === data.State);
  if (selectedState?.cities.length > 0 && !data.City) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "City is required",
      path: ["City"]
    });
  }
});

type FormData = z.infer<typeof formSchema>;



  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      Company_name: "",
      Address: "",
      Email: "",
      Password: "",
      Country: "",
      State:"",
      City: "",
      Zip_code: "",
      IATA_Code: "",
      Gst_Vat_Tax_number: "",
      Otp: "",
      Contact_Person: "",
    },
  });
  
  const [gstFile, setGstFile] = useState<File | null>(null);
  const [gstPreview, setGstPreview] = useState<string | null>(null);
  const [coiFile, setCoiFile] = useState<File | null>(null);
  const [coiPreview, setCoiPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const validateBeforeSendOtp = async () => {
    // Trigger validation for all required fields except password and OTP
    const isValid = await form.trigger([
      "Company_name",
      "Address",
      "Email",
      "Country",
      "State",
      "City",
      "Zip_code",
      "Gst_Vat_Tax_number",
      // "Office_number",
      // "Mobile_number"
    ]);

    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields before sending OTP",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleSendOtp = async () => {
    const isValid = await validateBeforeSendOtp();
    if (!isValid) return;

    const email = form.getValues("Email");
    if (email) {
      setIsSendingOtp(true);
      try {
        const response = await fetch(`${API_BASE_URL}/agent/send-otp`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        if (response.ok) {
          setOtpSent(true);
          toast({
            title: "Sending OTP",
            description: "OTP sent to email",
          });
        } else if (response.status === 406) {
          toast({
            title: "Error",
            description: "This Email is already registered.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to send OTP.",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: (error as Error).message,
          variant: "destructive",
        });
      } finally {
        setIsSendingOtp(false);
      }
    }
  };

  const handleVerifyOtp = async () => {
    const email = form.getValues("Email");
    const otp = form.getValues("Otp");
    setIsVerifyingOtp(true);
    try {
      const response = await fetch(`${API_BASE_URL}/agent/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      if (response.ok) {
        setIsOtpVerified(true);
        toast({
          title: "OTP Verification",
          description: "OTP verified successfully!",
        });
      } else {
        toast({
          title: "OTP Verification",
          description: "Invalid OTP.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSubmit: SubmitHandler<FormData> = async (data) => {
    setIsSubmitting(true);

const selectedState = states.find(state => state.name === data.State);
  
  // If cities are available but none selected, show error
  if (selectedState?.cities.length > 0 && !data.City) {
    form.setError("City", {
      type: "manual",
      message: "Please select a city"
    });
    return;
  }


    const officeNumberWithDialCode = `${selectedDialCode}${data.Office_number}`;
    const mobileNumberWithDialCode = `${selectedDialCode}${data.Mobile_number}`;

    const formData = new FormData();
    formData.append("Company_name", data.Company_name);
    formData.append("Address", data.Address);
    formData.append("Email", data.Email);
    formData.append("Password", data.Password);
    formData.append("Zip_code", data.Zip_code);
    formData.append("IATA_Code", data.IATA_Code);
    formData.append("Country", data.Country);
    formData.append("City", data.City);
    formData.append("Gst_Vat_Tax_number", data.Gst_Vat_Tax_number);
    formData.append("Contact_Person", data.Contact_Person);
    formData.append("Office_number", officeNumberWithDialCode);
    formData.append("Mobile_number", mobileNumberWithDialCode);
    formData.append("Currency", data.Currency);

    const gstFileInput = document.querySelector(
      'input[name="Gst_Tax_Certificate"]'
    ) as HTMLInputElement;
    if (!gstFileInput?.files?.[0]) {
      toast({
        title: "Error",
        description: "Please upload the GST Tax Certificate.",
      });
      setIsSubmitting(false);
      return;
    }
    formData.append("Gst_Tax_Certificate", gstFileInput.files[0]);

    const coiFileInput = document.querySelector(
      'input[name="COI_Certificate"]'
    ) as HTMLInputElement;
    if (!coiFileInput?.files?.[0]) {
      toast({
        title: "Error",
        description: "Please upload the Certificate of Incorporation.",
      });
      setIsSubmitting(false);
      return;
    }
    formData.append("COI_Certificate", coiFileInput.files[0]);

    if (isOtpVerified) {
      try {
        const registrationResponse = await fetch(
          `${API_BASE_URL}/agent/registration`,
          {
            method: "POST",
            body: formData, 
          }
        );

        if (registrationResponse.ok) {
          setIsSuccessDialogOpen(true);
          // toast({
          //   title: "User Registration",
          //   description: "Registered Successfully!",
          // });
          // router.push("/login");
        } else {
          const errorData = await registrationResponse.json();
          toast({
            title: "Error",
            description: errorData.message || "Registration failed.",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "An error occurred during registration.",
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      toast({ title: "Error", description: "Please verify the OTP first." });
    }
  };

  const handleGstFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf" && !selectedFile.name.endsWith('.pdf')) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file only.",
          variant: "destructive",
        });
        return;
      }
      
      setGstFile(selectedFile);
      setGstPreview(URL.createObjectURL(selectedFile));
      form.setValue("Gst_Tax_Certificate", selectedFile);
      form.clearErrors("Gst_Tax_Certificate");
    }
  };

  const handleCoiFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf" && !selectedFile.name.endsWith('.pdf')) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file only.",
          variant: "destructive",
        });
        return;
      }
      
      setCoiFile(selectedFile);
      setCoiPreview(URL.createObjectURL(selectedFile));
      form.setValue("COI_Certificate", selectedFile);
      form.clearErrors("COI_Certificate");
    }
  };

 const handleCountryChange = (value: string) => {
  const country = countries.find((country) => country.name === value);
  if (country) {
    setSelectedCountry(value);
    setSelectedDialCode(country.dialCode);
    setSelectedFlag(country.flag);
    setStates(country.states);
    setCities([]); // Reset cities when country changes
    form.setValue("Country", value);
    form.setValue("State", "");
    form.setValue("City", "");
    form.trigger("Country");
  }
};

const handleStateChange = (value: string) => {
  const state = states.find((state) => state.name === value);
  if (state) {
    setCities(state.cities);
    form.setValue("State", value);
    form.setValue("City", "");
    form.trigger("State");
    
    // If no cities available, clear any city validation errors
    if (state.cities.length === 0) {
      form.clearErrors("City");
    }
  }
};
const handleCityChange = (value: string) => {
  form.setValue("City", value);
  form.trigger("City");
};



  const handleCurrencyChange = (value: string) => {
    setSelectedCurrency(value);
    form.setValue("Currency", value);
  };

   return (
    <div className="container mx-auto px-10 md:px-4 py-8 max-w-6xl">
      <Card className="shadow-lg">
        <CountryCityAPI onDataFetched={setCountries} />
        <CardHeader className="border-b">
          <CardTitle className="text-2xl">Agent Registration</CardTitle>
          <CardDescription>
            Create your account with the required credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Basic Information Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="Company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Enter Company Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="Contact_Person"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person</FormLabel>
                      <FormControl>
                        <Input placeholder="Contact Person" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              
              {/* Location Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="Country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Select
                          {...field}
                          onValueChange={handleCountryChange}
                          value={selectedCountry}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a country" />
                          </SelectTrigger>
                          <SelectContent>
                            {countries
                              .slice()
                              .sort((a, b) => a.name.localeCompare(b.name))
                              .map((country) => (
                                <SelectItem key={country.name} value={country.name}>
                                  {country.name}
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
  name="State"
  render={({ field }) => (
    <FormItem>
      <FormLabel>
        State <span className="text-red-500">*</span>
      </FormLabel>
      <FormControl>
        <Select
          {...field}
          onValueChange={handleStateChange}
          disabled={!selectedCountry}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a state" />
          </SelectTrigger>
          <SelectContent>
            {states.map((state) => (
              <SelectItem key={state.name} value={state.name}>
                {state.name}
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
  name="City"
  render={({ field }) => (
    <FormItem>
      <FormLabel>
        City {cities.length > 0 && <span className="text-red-500">*</span>}
      </FormLabel>
      <FormControl>
        {cities.length > 0 ? (
          <Select
            {...field}
            onValueChange={handleCityChange}
            disabled={!form.getValues("State")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a city" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            {...field}
            placeholder="No cities available - enter manually"
            disabled={!form.getValues("State")}
          />
        )}
      </FormControl>
      {/* {cities.length === 0 && <FormDescription>
        This state doesn&apos;t have predefined cities - please enter manually
        </FormDescription>} */}
      <FormMessage />
    </FormItem>
  )}
/>             
              </div>


<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
<FormField
                control={form.control}
                name="Address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter Your Address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

<FormField
                  control={form.control}
                  name="Zip_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zip Code <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Enter Zip Code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
</div>

              {/* Tax and Identification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


                <FormField
                  control={form.control}
                  name="Gst_Vat_Tax_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GST/VAT/TAX Number <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Enter GST/VAT/TAX Number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="IATA_Code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IATA Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter IATA Code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Email and OTP Section */}
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="Email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input type="email" placeholder="Enter Email" {...field} />
                          <Button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={otpSent}
                            className="whitespace-nowrap"
                          >
                            {isSendingOtp
                              ? "Sending..."
                              : otpSent
                              ? "OTP Sent"
                              : "Send OTP"}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {otpSent && (
                  <FormField
                    control={form.control}
                    name="Otp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>OTP <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input
                              type="text"
                              placeholder="Enter OTP"
                              {...field}
                              disabled={isOtpVerified}
                            />
                            <Button
                              type="button"
                              onClick={handleVerifyOtp}
                              disabled={isOtpVerified || isVerifyingOtp}
                              className="whitespace-nowrap"
                            >
                              {isVerifyingOtp
                                ? "Verifying..."
                                : isOtpVerified
                                ? "Verified"
                                : "Verify OTP"}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {isOtpVerified && (
                <>
                  {/* Password Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="Password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Create Password <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter Password" {...field} />
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
                          <FormLabel>Currency <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Select
                              {...field}
                              onValueChange={handleCurrencyChange}
                              value={selectedCurrency}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select Currency" />
                              </SelectTrigger>
                              <SelectContent>
                                {chooseCurrency?.map((cur) => (
                                  <SelectItem key={cur.value} value={`${cur.value}`}>
                                    {cur.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="Office_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Office Number <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <div className="flex gap-2 items-center">
                              {/* {selectedFlag && (
                                <Image
                                  src={selectedFlag}
                                  alt="flag"
                                  width={24}
                                  height={24}
                                  className="h-6 w-auto"
                                />
                              )} */}
                                {selectedFlag && (
            <span className="text-2xl">{selectedFlag}</span>
          )}
                              {selectedDialCode && (
                                <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                                  {selectedDialCode}
                                </span>
                              )}
                              <Input
                                type="number"
                                placeholder="Enter Office Number"
                                className="flex-1"
                                {...field}
                              min="0"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="Mobile_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobile Number 
                            {/* <span className="text-red-500">*</span> */}
                          </FormLabel>
                          <FormControl>
                            <div className="flex gap-2 items-center">
                              {/* {selectedFlag && (
                                <Image
                                  src={selectedFlag}
                                  alt="flag"
                                  width={24}
                                  height={24}
                                  className="h-6 w-auto"
                                />
                              )} */}
                                {selectedFlag && (
            <span className="text-2xl">{selectedFlag}</span>
          )}
                              {selectedDialCode && (
                                <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                                  {selectedDialCode}
                                </span>
                              )}
                              <Input
                                type="number"
                                placeholder="Enter Mobile Number"
                                className="flex-1"
                                {...field}
                                min="0"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Documents Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="Gst_Tax_Certificate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                             Upload any Document (GST/Passport/PAN/Aadhaar in PDF){" "}
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              name="Gst_Tax_Certificate"
                              type="file"
                              accept=".pdf,application/pdf"
                              onChange={handleGstFileChange}
                            />
                          </FormControl>
                          {gstPreview && (
                            <div className="mt-2 text-sm">
                              <a
                                href={gstPreview}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                              >
                                View uploaded GST PDF
                              </a>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="COI_Certificate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Certificate of Incorporation (PDF){" "}
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              name="COI_Certificate"
                              type="file"
                              accept=".pdf,application/pdf"
                              onChange={handleCoiFileChange}
                            />
                          </FormControl>
                          {coiPreview && (
                            <div className="mt-2 text-sm">
                              <a
                                href={coiPreview}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                              >
                                View uploaded COI PDF
                              </a>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Processing..." : "Complete Registration"}
                  </Button>
                </>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

          <Dialog 
              open={isSuccessDialogOpen} 
              onOpenChange={(open) => {
                if (!open) {
                  // When dialog is closed (by any means)
                  form.reset(); // Reset the form
                  router.push("/"); // Redirect to login
                }
              }}
            >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl">Registration Successful!</DialogTitle>
            <DialogDescription>
              {form.getValues("Company_name")} is successfully registered
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p>
              Email will be received with credentials once approved by Sanzad International
            </p>
            
            <ul className="list-disc pl-6 space-y-2">
              <li>This process will be completed in next 2 hours</li>
              <li>Thereafter website can browsed from your end and we are happy to take your bookings</li>
              <li>Happy Selling</li>
            </ul>
            
            <div className="flex justify-end pt-4">
              <Button 
                onClick={() => {
                  setIsSuccessDialogOpen(false);
                  router.push("/");
                }}
              >
                Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentRegistration;