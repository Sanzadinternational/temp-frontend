
"use client";
import { useState } from "react";
import AutocompleteInput from "@/components/AutocompleteInput";
const googleMapsApiKey = "AIzaSyAjXkEFU-hA_DSnHYaEjU3_fceVwQra0LI";
// type ZonePickerProps = {
//   onChange: (value: string) => void;
//   setValue: (name: string, value: string) => void;
// };
interface ZonePickerProps {
  onChange: (value: string) => void;
  setValue: (name: string, value: any) => void;
  initialValue?: string;
  initialCoords?: {
    lat: number;
    lng: number;
  };
}
const ZonePicker = ({ onChange, setValue }: ZonePickerProps) => {
  const [zoneLocation, setZoneLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);

  const handleSelectZone = (zone: any) => {
    setZoneLocation(zone);
    console.log("Selected Zone Details:", zone);
    onChange(zone.address);
    setValue("latitude", zone.lat.toString());
    setValue("longitude", zone.lng.toString());
  };

  return (
    <div className="w-full">
      <AutocompleteInput
        apiKey={googleMapsApiKey}
        onPlaceSelected={handleSelectZone}
      />
    </div>
  );
};

export default ZonePicker;
