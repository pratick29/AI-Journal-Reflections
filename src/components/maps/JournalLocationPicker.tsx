import React, { useState } from 'react';
import { MapPin, X, Compass, Search, Check, Sparkles, Navigation, CloudSun } from 'lucide-react';
import { JournalLocation, AtmosphericWeather } from '../../types';

interface JournalLocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation?: JournalLocation | null;
  onSaveLocation: (location: JournalLocation | null) => void;
}

// Weather code interpreter for Open-Meteo
function interpretWmoCode(code: number): { condition: string; icon: string } {
  if (code === 0) return { condition: 'Clear Sky', icon: '☀️' };
  if (code === 1 || code === 2) return { condition: 'Partly Cloudy', icon: '⛅' };
  if (code === 3) return { condition: 'Overcast', icon: '☁️' };
  if (code === 45 || code === 48) return { condition: 'Misty Fog', icon: '🌫️' };
  if (code >= 51 && code <= 55) return { condition: 'Gentle Drizzle', icon: '🌦️' };
  if (code >= 61 && code <= 65) return { condition: 'Rain Shower', icon: '🌧️' };
  if (code >= 71 && code <= 77) return { condition: 'Snowfall', icon: '❄️' };
  if (code >= 80 && code <= 82) return { condition: 'Rain Showers', icon: '🌧️' };
  if (code >= 95) return { condition: 'Thunderstorm', icon: '⛈️' };
  return { condition: 'Atmospheric Solitude', icon: '🌤️' };
}

async function fetchAtmosphericWeather(lat: number, lng: number): Promise<AtmosphericWeather | undefined> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,is_day,weather_code,wind_speed_10m`
    );
    if (!res.ok) return undefined;
    const data = await res.json();
    const current = data.current;
    if (!current) return undefined;

    const { condition, icon } = interpretWmoCode(current.weather_code || 0);
    return {
      tempC: Math.round(current.temperature_2m),
      condition,
      icon,
      isDay: current.is_day === 1,
      windSpeedKmh: Math.round(current.wind_speed_10m || 0),
    };
  } catch (err) {
    console.warn('Atmospheric weather fetch notice:', err);
    return undefined;
  }
}

const HISTORIC_SANCTUARIES: { name: string; desc: string; lat: number; lng: number }[] = [
  {
    name: 'Walden Pond, Concord',
    desc: "Henry David Thoreau's sanctuary of deliberate living & solitude",
    lat: 42.4385,
    lng: -71.3415,
  },
  {
    name: 'The Stoa Poikile, Athens',
    desc: 'Birthplace of Stoicism under Zeno of Citium',
    lat: 37.9753,
    lng: 23.7231,
  },
  {
    name: 'Philosopher’s Walk, Kyoto',
    desc: "Kitarō Nishida's daily walking path of Zen meditation",
    lat: 35.0272,
    lng: 135.7951,
  },
  {
    name: 'Sils Maria, Swiss Alps',
    desc: 'Friedrich Nietzsche’s summer refuge of eternal return',
    lat: 46.4289,
    lng: 9.7645,
  },
  {
    name: 'Café de Flore, Paris',
    desc: "Simone de Beauvoir & Sartre's hub of existentialist thought",
    lat: 48.8542,
    lng: 2.3328,
  },
  {
    name: 'The Granua River, Carnuntum',
    desc: 'Danube frontier camps where Marcus Aurelius inscribed Meditations',
    lat: 48.1167,
    lng: 16.8667,
  },
];

export const JournalLocationPicker: React.FC<JournalLocationPickerProps> = ({
  isOpen,
  onClose,
  currentLocation,
  onSaveLocation,
}) => {
  const [placeName, setPlaceName] = useState(currentLocation?.name || '');
  const [lat, setLat] = useState<string>(currentLocation ? String(currentLocation.lat) : '');
  const [lng, setLng] = useState<string>(currentLocation ? String(currentLocation.lng) : '');
  const [address, setAddress] = useState(currentLocation?.address || '');
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Browser Geolocation
  const handleCurrentPosition = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const userLat = Number(pos.coords.latitude.toFixed(4));
        const userLng = Number(pos.coords.longitude.toFixed(4));
        setLat(String(userLat));
        setLng(String(userLng));
        if (!placeName) {
          setPlaceName('Quiet Sanctuary');
        }
      },
      (err) => {
        setIsLocating(false);
        setGeoError(`Location access notice: ${err.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Select a preset historic philosophical sanctuary
  const handleSelectPreset = (preset: typeof HISTORIC_SANCTUARIES[0]) => {
    setPlaceName(preset.name);
    setLat(String(preset.lat));
    setLng(String(preset.lng));
    setAddress(preset.desc);
  };

  // Google Maps Geocoding Lookup (when API key is present or geocoding search)
  const handleSearchAddress = async () => {
    if (!placeName.trim()) return;
    setIsGeocoding(true);
    setGeoError(null);

    const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;

    if (apiKey) {
      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            placeName
          )}&key=${apiKey}`
        );
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const loc = data.results[0].geometry.location;
          setLat(String(Number(loc.lat.toFixed(4))));
          setLng(String(Number(loc.lng.toFixed(4))));
          setAddress(data.results[0].formatted_address || '');
          setIsGeocoding(false);
          return;
        }
      } catch (err) {
        console.warn('Google Maps geocoding error:', err);
      }
    }

    // Fallback: Check if placeName matches any preset or parse custom coordinates
    const matched = HISTORIC_SANCTUARIES.find((p) =>
      p.name.toLowerCase().includes(placeName.toLowerCase())
    );
    if (matched) {
      setLat(String(matched.lat));
      setLng(String(matched.lng));
      setAddress(matched.desc);
    } else if (!lat || !lng) {
      // Default to neutral peaceful coordinates if unspecified
      setLat('42.4385');
      setLng('-71.3415');
    }
    setIsGeocoding(false);
  };

  const handleSave = () => {
    if (!placeName.trim()) {
      setGeoError('Please provide a place name for this locus of thought.');
      return;
    }

    const numLat = parseFloat(lat);
    const numLng = parseFloat(lng);

    if (isNaN(numLat) || isNaN(numLng)) {
      setGeoError('Please enter valid numeric latitude and longitude coordinates.');
      return;
    }

    setIsGeocoding(true);
    fetchAtmosphericWeather(numLat, numLng)
      .then((weather) => {
        onSaveLocation({
          name: placeName.trim(),
          lat: numLat,
          lng: numLng,
          address: address.trim() || undefined,
          weather,
        });
        setIsGeocoding(false);
        onClose();
      })
      .catch(() => {
        onSaveLocation({
          name: placeName.trim(),
          lat: numLat,
          lng: numLng,
          address: address.trim() || undefined,
        });
        setIsGeocoding(false);
        onClose();
      });
  };

  const handleRemove = () => {
    onSaveLocation(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1918]/45 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#FFFDF9] rounded-sm border border-[#E2DDD5] shadow-xl overflow-hidden font-serif"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2DDD5] bg-[#F7F4EE]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#C4432B]/10 text-[#C4432B] flex items-center justify-center">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-sans font-semibold uppercase tracking-[0.16em] text-[#2B2A28]">
                Locus of Reflection
              </h3>
              <p className="text-[11px] font-sans text-[#8A8478]">
                Anchor this manuscript to the physical ground where it was conceived
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8A8478] hover:text-[#2B2A28] rounded-xs hover:bg-[#EFECE6] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Search or Place Name Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-sans uppercase tracking-[0.2em] font-semibold text-[#595652] flex items-center justify-between">
              <span>Sanctuary / Setting Name</span>
              <button
                type="button"
                onClick={handleCurrentPosition}
                disabled={isLocating}
                className="text-[#C4432B] hover:text-[#9E3420] text-[9px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Navigation className="w-2.5 h-2.5" />
                <span>{isLocating ? 'Locating...' : 'Use Current Location'}</span>
              </button>
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchAddress();
                  }
                }}
                placeholder="e.g., Walden Pond, Concord, or Alpine Cabin"
                className="w-full pl-3.5 pr-20 py-2 text-xs font-serif bg-[#FBF9F5] border border-[#E2DDD5] rounded-xs focus:outline-none focus:border-[#C4432B] text-[#2B2A28]"
              />
              <button
                type="button"
                onClick={handleSearchAddress}
                disabled={isGeocoding}
                className="absolute right-1 px-2.5 py-1 text-[10px] font-sans uppercase tracking-wider bg-[#F7F4EE] hover:bg-[#EFECE6] text-[#595652] rounded-xs border border-[#E2DDD5] flex items-center gap-1 transition-colors"
              >
                <Search className="w-3 h-3" />
                <span>Lookup</span>
              </button>
            </div>
          </div>

          {/* Coordinate Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-sans uppercase tracking-[0.2em] font-semibold text-[#8A8478]">
                Latitude
              </label>
              <input
                type="text"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="e.g., 42.4385"
                className="w-full px-3 py-1.5 text-xs font-mono bg-[#FBF9F5] border border-[#E2DDD5] rounded-xs focus:outline-none focus:border-[#C4432B] text-[#2B2A28]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-sans uppercase tracking-[0.2em] font-semibold text-[#8A8478]">
                Longitude
              </label>
              <input
                type="text"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="e.g., -71.3415"
                className="w-full px-3 py-1.5 text-xs font-mono bg-[#FBF9F5] border border-[#E2DDD5] rounded-xs focus:outline-none focus:border-[#C4432B] text-[#2B2A28]"
              />
            </div>
          </div>

          {/* Optional Setting Description or Address */}
          <div className="space-y-1">
            <label className="text-[9px] font-sans uppercase tracking-[0.2em] font-semibold text-[#8A8478]">
              Environmental Notes / Description (Optional)
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g., Beneath the old oak canopy at sunrise"
              className="w-full px-3 py-1.5 text-xs font-serif bg-[#FBF9F5] border border-[#E2DDD5] rounded-xs focus:outline-none focus:border-[#C4432B] text-[#2B2A28]"
            />
          </div>

          {geoError && (
            <p className="text-[11px] font-sans text-[#C4432B] bg-[#C4432B]/5 border border-[#C4432B]/20 p-2 rounded-xs">
              {geoError}
            </p>
          )}

          {/* Historic Philosophical Sanctuaries Presets */}
          <div className="space-y-2 pt-2 border-t border-[#E2DDD5]/60">
            <div className="flex items-center gap-1 text-[10px] font-sans uppercase tracking-[0.18em] text-[#8A8478]">
              <Sparkles className="w-3 h-3 text-[#C4432B]" />
              <span>Or Choose a Historic Philosophical Locus</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {HISTORIC_SANCTUARIES.map((sanctuary) => (
                <button
                  key={sanctuary.name}
                  type="button"
                  onClick={() => handleSelectPreset(sanctuary)}
                  className="text-left p-2 rounded-xs border border-[#E2DDD5] bg-[#FBF9F5] hover:bg-[#F7F4EE] hover:border-[#C4432B]/50 transition-all group"
                >
                  <div className="text-xs font-serif font-medium text-[#2B2A28] group-hover:text-[#C4432B] transition-colors">
                    {sanctuary.name}
                  </div>
                  <div className="text-[10px] font-sans text-[#8A8478] line-clamp-1">
                    {sanctuary.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-[#E2DDD5] bg-[#F7F4EE]/60">
          <div>
            {currentLocation && (
              <button
                type="button"
                onClick={handleRemove}
                className="text-xs font-sans text-[#C4432B] hover:underline"
              >
                Clear Location
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-sans uppercase tracking-wider text-[#595652] hover:text-[#2B2A28] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-sans uppercase tracking-wider bg-[#2B2A28] hover:bg-[#1A1918] text-[#FFFDF9] rounded-xs shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-[#C4432B]" />
              <span>Inscribe Locus</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
