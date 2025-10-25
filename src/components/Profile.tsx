
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import Image from "next/image";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";
import { useToast } from "@/hooks/use-toast";
// import { ChooseCurrency } from "@/components/constants/currency";
// import { Select,SelectTrigger,SelectValue,SelectContent,SelectItem } from "./ui/select";
interface User {
  userId: string;
  Company_name: string;
  Email: string;
  Office_number: string;
  Mobile_number: string;
  Gst_Vat_Tax_number: string;
  PAN_number?: string;
  Currency?: string; 
  Country: string;
  City: string;
  Address: string;
  Zip_code: string;
  profileImage?: string;
  role?: string;
}

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("authToken");
  if (!token) throw new Error("Authentication token is missing.");

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
  return response.json();
};

const Profile = () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [updatedUser, setUpdatedUser] = useState<User | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchWithAuth(`${API_BASE_URL}/dashboard`);
        setUser(data);
        setUpdatedUser(data);
      } catch (err: any) {
        setError(err.message);
        if (err.message.includes("401")) removeToken();
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const removeToken = () => {
    localStorage.removeItem("authToken");
    router.push("/login");
  };

  const isAdmin = () => {
    return user?.role === 'admin' || user?.role === 'superadmin';
  };

  const handleEdit = () => {
    setEditing(true);
  };

 const handleSave = async () => {
    try {
      if (!updatedUser) return alert("No data to update!");
      setIsSubmitting(true);
  
      const formData = new FormData();
      
      // For admin/superadmin, only allow updating name and image
      if (isAdmin()) {
        formData.append("Company_name", updatedUser.Company_name);
        if (image) {
          formData.append("profileImage", image);
        }
      } else {
        // For other roles, allow updating all fields
        Object.entries(updatedUser).forEach(([key, value]) => {
          if (key !== 'profileImage' && value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });
        if (image) {
          formData.append("profileImage", image);
        }
      }
  
      // Log the data being sent to the server
      // console.log("Data being sent to server:", {
      //   ...updatedUser,
      //   profileImage: image ? "(new image file)" : user?.profileImage
      // });
  
      const response = await fetch(`${API_BASE_URL}/view/UpdateProfile/${user?.userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: formData,
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed to update profile: ${response.status}`);
      }
  
      const data = await response.json();
      const updatedData = data.updateResult?.[0] || data;
      
      // Log the response from the server
      // console.log("Server response:", data);
  
      // Update user data with new image if uploaded
      // const profileImageUrl = image ? 
      //   (preview || `${API_BASE_URL}/uploads/${updatedData.profileImage}`) : 
      //   updatedData.profileImage;
      const profileImageUrl = updatedData.profileImage 
  ? `${API_BASE_URL}/uploads/${updatedData.profileImage}`
  : user?.profileImage;
  
      const updatedUserData = {
        ...updatedData,
        profileImage: profileImageUrl
      };
  
      // Log the final updated user data
      // console.log("Updated user data:", updatedUserData);
  
      setUser(updatedUserData);
      setUpdatedUser(updatedUserData);
      setEditing(false);
      setImage(null);
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (err: any) {
      // console.error("Error updating profile:", err.message);
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setImage(null);
    setPreview(null);
    setUpdatedUser(user);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUpdatedUser((prev) => prev ? { ...prev, [e.target.name]: e.target.value } : null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const getImageUrl = () => {
    if (preview) return preview;
    if (!user?.profileImage) return "/male-profile-pic.webp";
    return user.profileImage.startsWith('http') || user.profileImage.startsWith('blob:') 
      ? user.profileImage 
      : `${API_BASE_URL}/uploads/${user.profileImage}`;
  };

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>My Profile</CardTitle>
            <div className="flex gap-2">
              {editing ? (
                <>
                  <Button 
                    onClick={handleSave} 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={handleEdit}>Edit Profile</Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <Image
                src={preview || getImageUrl()}
                width={120}
                height={120}
                alt="Profile"
                className="rounded-full border-2 border-gray-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/male-profile-pic.webp";
                }}
              />
              {editing && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Change Profile Picture
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold capitalize">
                {editing ? (
                  <Input
                    name="Company_name"
                    value={updatedUser?.Company_name || ""}
                    onChange={handleChange}
                    className="w-full"
                  />
                ) : (
                  user?.Company_name || "N/A"
                )}
              </h1>
              <p className="">{user?.Email || "N/A"}</p>
              <p className="capitalize">{user?.role || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Email"
              name="Email"
              value={updatedUser?.Email || ""}
              editing={false}
            />
            <FormField
              label="Office Number"
              name="Office_number"
              value={updatedUser?.Office_number || ""}
              editing={!isAdmin() && editing} // Only editable for non-admins
              onChange={handleChange}
            />
            <FormField
              label="Mobile Number"
              name="Mobile_number"
              value={updatedUser?.Mobile_number || ""}
              editing={!isAdmin() && editing} // Only editable for non-admins
              onChange={handleChange}
            />
            <FormField
        label="PAN Number"
        name="PAN_number"
        value={updatedUser?.PAN_number || ""}
        editing={false}
        onChange={handleChange}
      />
          <FormField
        label="Currency"
        name="Currency"
        value={updatedUser?.Currency || ""}
        editing={false}
        onChange={handleChange}
      />
           
          </div>
        </CardContent>
      </Card>

      {/* Contact Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Tax ID"
              name="Gst_Vat_Tax_number"
              value={updatedUser?.Gst_Vat_Tax_number || ""}
              editing={false}
              onChange={handleChange}
            />
            <FormField
              label="Country"
              name="Country"
              value={updatedUser?.Country || ""}
              editing={false}
              onChange={handleChange}
            />
            <FormField
              label="City"
              name="City"
              value={updatedUser?.City || ""}
              editing={!isAdmin() && editing} // Only editable for non-admins
              onChange={handleChange}
            />
            <FormField
              label="Address"
              name="Address"
              value={updatedUser?.Address || ""}
              editing={!isAdmin() && editing} // Only editable for non-admins
              onChange={handleChange}
            />
            <FormField
              label="Postal Code"
              name="Zip_code"
              value={updatedUser?.Zip_code || ""}
              editing={!isAdmin() && editing} // Only editable for non-admins
              onChange={handleChange}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper component for form fields
const FormField = ({
  label,
  name,
  value,
  editing,
  onChange,
  type = "text",
  ...props
}: {
  label: string;
  name: string;
  value: string;
  editing: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}) => {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      {editing ? (
        <Input
          name={name}
          value={value}
          onChange={onChange}
          className="w-full"
          type={type}
          {...props}
        />
      ) : (
        <p className="">{value || "N/A"}</p>
      )}
    </div>
  );
};
export default Profile;
