
"use client";
import { useState, useEffect, useRef } from "react";
import { Plane, Hotel, TrainFront, Bus, MapPin } from "lucide-react";

// Place type icons mapping
const placeTypeIcons: { [key: string]: JSX.Element } = {
  airport: <Plane className="w-6 h-6 text-blue-500" />,
  lodging: <Hotel className="w-6 h-6 text-yellow-500" />,
  train_station: <TrainFront className="w-6 h-6 text-green-500" />,
  bus_station: <Bus className="w-6 h-6 text-purple-500" />,
  establishment: <MapPin className="w-6 h-6 text-gray-500" />,
};
const defaultIcon = <MapPin className="w-6 h-6 text-gray-500" />;

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
        types: ["airport", "bus_station", "transit_station", "train_station", "lodging"],
      },
      (results) => {
        setPredictions(results || []);
      }
    );
  };

  const handleSelectPlace = (placeId: string, description: string) => {
    const placesService = new window.google.maps.places.PlacesService(document.createElement("div"));
    placesService.getDetails({ placeId }, (place) => {
      if (place && place.geometry) {
        const placeTypes = place.types || [];
        const icon = placeTypes.find((type) => placeTypeIcons[type])
          ? placeTypeIcons[placeTypes.find((type) => placeTypeIcons[type])!]
          : defaultIcon;

        setSelectedIcon(icon);
        setPredictions([]);

        onPlaceSelected({
          address: description,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          icon,
        });

        if (inputRef.current) inputRef.current.value = description;
      }
    });
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        {/* Icon inside input */}
        <span className="absolute left-4 text-xl text-gray-500 w-6 h-6 flex items-center justify-center">
          {selectedIcon || defaultIcon}
        </span>

        <input
          ref={inputRef}
          type="text"
          // className="w-full bg-slate-100 dark:text-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-md pl-12 p-3 text-lg focus:ring-2 focus:ring-blue-400"
          className="flex h-9 w-full rounded-md border border-input bg-transparent pl-12 p-3 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={isGoogleLoaded ? "Search a location..." : "Loading Google Maps..."}
          disabled={!isGoogleLoaded}
          onChange={handleInputChange}
        />
      </div>

      {/* Dropdown suggestions */}
      {predictions.length > 0 && (
        <ul className="absolute z-50 mt-2 w-full bg-white dark:text-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
          {predictions.map((prediction) => {
            const type = prediction.types?.find((t) => placeTypeIcons[t]) || "establishment";
            return (
              <li
                key={prediction.place_id}
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-blue-100 dark:hover:bg-gray-700 transition-all duration-200 rounded-md"
                onClick={() => handleSelectPlace(prediction.place_id, prediction.description)}
              >
                <span className="w-6 h-6 flex items-center justify-center">
                  {placeTypeIcons[type] || defaultIcon}
                </span>
                <span className="text-lg font-medium">{prediction.description}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default AutocompleteInput;
