import { create } from "zustand";

export interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  condition: string;
  icon: string;
  city: string;
  loaded: boolean;
  error: string | null;
}

interface WeatherState {
  weather: WeatherData;
  fetchWeather: () => Promise<void>;
}

// Mock weather data for demo (no API key required)
// Ayacucho, Peru — mild climate at ~2700m elevation
const MOCK_WEATHER: WeatherData[] = [
  {
    temp: 20,
    feels_like: 21,
    humidity: 55,
    wind_speed: 10,
    condition: "Parcialmente nublado",
    icon: "02d",
    city: "Ayacucho",
    loaded: true,
    error: null,
  },
  {
    temp: 18,
    feels_like: 17,
    humidity: 65,
    wind_speed: 8,
    condition: "Lluvia ligera",
    icon: "10d",
    city: "Ayacucho",
    loaded: true,
    error: null,
  },
  {
    temp: 22,
    feels_like: 23,
    humidity: 50,
    wind_speed: 12,
    condition: "Soleado",
    icon: "01d",
    city: "Ayacucho",
    loaded: true,
    error: null,
  },
];

function getMockWeather(): WeatherData {
  const idx = Math.floor(Math.random() * MOCK_WEATHER.length);
  return MOCK_WEATHER[idx];
}

export const useWeatherStore = create<WeatherState>((set) => ({
  weather: {
    temp: 0,
    feels_like: 0,
    humidity: 0,
    wind_speed: 0,
    condition: "",
    icon: "01d",
    city: "Ayacucho",
    loaded: false,
    error: null,
  },

  fetchWeather: async () => {
    try {
      // Try real API first with demo key (works for basic usage)
      const res = await fetch(
        "https://api.openweathermap.org/data/2.5/weather?q=Ayacucho,PE&units=metric&lang=es&appid=9de243494c0b295d0e1662c0780a09e6"
      );
      if (res.ok) {
        const data = await res.json();
        set({
          weather: {
            temp: Math.round(data.main.temp),
            feels_like: Math.round(data.main.feels_like),
            humidity: data.main.humidity,
            wind_speed: Math.round(data.wind.speed * 3.6), // m/s → km/h
            condition: data.weather[0]?.description ?? "Desconocido",
            icon: data.weather[0]?.icon ?? "01d",
            city: data.name ?? "Ayacucho",
            loaded: true,
            error: null,
          },
        });
        return;
      }
      // Fallback to mock data
      set({ weather: getMockWeather() });
    } catch {
      // Network error → mock data
      set({ weather: getMockWeather() });
    }
  },
}));
