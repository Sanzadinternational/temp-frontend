
import useSWR from 'swr';
import { useEffect } from 'react';

interface City {
  id: number;
  name: string;
  latitude: string;
  longitude: string;
}

interface State {
  id: number;
  name: string;
  state_code: string;
  latitude: string;
  longitude: string;
  type: string;
  cities: City[];
}

interface Country {
  id: number;
  name: string;
  iso3: string;
  iso2: string;
  phonecode: string;
  capital: string;
  currency: string;
  currency_symbol: string;
  emoji: string;
  emojiU: string;
  states: State[];
}

interface FormattedCountry {
  name: string;
  flag: string; // This will be the emoji string like "🇮🇳"
  dialCode: string;
  states: {
    name: string;
    cities: string[];
  }[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const CountryCityAPI = ({ 
  onDataFetched 
}: { 
  onDataFetched: (countries: FormattedCountry[]) => void 
}) => {
  const { data, error, isLoading } = useSWR(
    'https://api.sanzadinternational.in/api/V1/data/GetCountryData',
    fetcher
  );

  useEffect(() => {
    if (data && !isLoading && !error) {
      const formattedCountries: FormattedCountry[] = data.map((country: Country) => ({
        name: country.name,
        flag: country.emoji, // Using the emoji directly
        dialCode: `+${country.phonecode}`,
        states: country.states.map(state => ({
          name: state.name,
          cities: state.cities.map(city => city.name)
        }))
      }));
      
      onDataFetched(formattedCountries);
    }
  }, [data, isLoading, error, onDataFetched]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading countries.</div>;
  return null;
};

export default CountryCityAPI;
