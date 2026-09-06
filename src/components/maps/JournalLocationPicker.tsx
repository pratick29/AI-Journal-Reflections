import React, { useState, useEffect, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  X,
  Compass,
  Check,
  Sparkles,
  Navigation,
  CloudSun,
  ExternalLink,
  Key,
  Layers,
  Info,
} from 'lucide-react';
import { JournalLocation, AtmosphericWeather } from '../../types';
import { PARCHMENT_MAP_STYLES } from './mapStyles';
import { PlacesAutocomplete, SelectedPlaceResult } from './PlacesAutocomplete';

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

const HISTORIC_SANCTUARIES = [
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

// Inner map camera controller hook component
const MapCameraSync: React.FC<{
  center: { lat: number; lng: number };
  viewport?: google.maps.LatLngBounds | null;
}> = ({ center, viewport }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (viewport) {
      map.fitBounds(viewport);
    } else {
      map.panTo(center);
    }
  }, [map, center.lat, center.lng, viewport]);

  return null;
};

export const JournalLocationPicker: React.FC<JournalLocationPickerProps> = ({
  isOpen,
  onClose,
  currentLocation,
  onSaveLocation,
}) => {
  const [placeName, setPlaceName] = useState(currentLocation?.name || '');
  const [lat, setLat] = useState<number>(currentLocation?.lat ?? 42.4385);
  const [lng, setLng] = useState<number>(currentLocation?.lng ?? -71.3415);
  const [address, setAddress] = useState(currentLocation?.address || '');
  const [placeId, setPlaceId] = useState<string | undefined>(currentLocation?.placeId);
  const [weather, setWeather] = useState<AtmosphericWeather | undefined>(currentLocation?.weather);
  const [viewport, setViewport] = useState<google.maps.LatLngBounds | null>(null);

  const [isLocating, setIsLocating] = useState(false);
  const [isUpdatingWeather, setIsUpdatingWeather] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Runtime API Key management (from env or optional session key)
  const envKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';
  const [sessionKey, setSessionKey] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('mindscribe_gmp_key') || '';
    }
    return '';
  });
  const [showKeyInput, setShowKeyInput] = useState(false);

  const effectiveApiKey = envKey || sessionKey;
  const mapId = (import.meta as any).env?.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

  // Fetch atmospheric weather whenever coordinates change
  const refreshWeather = useCallback(async (latitude: number, longitude: number) => {
    setIsUpdatingWeather(true);
    try {
      const w = await fetchAtmosphericWeather(latitude, longitude);
      if (w) setWeather(w);
    } catch {
      // Weather is non-blocking enhancement
    } finally {
      setIsUpdatingWeather(false);
    }
  }, []);

  // Sync with current location on open
  useEffect(() => {
    if (currentLocation) {
      setPlaceName(currentLocation.name);
      setLat(currentLocation.lat);
      setLng(currentLocation.lng);
      setAddress(currentLocation.address || '');
      setPlaceId(currentLocation.placeId);
      setWeather(currentLocation.weather);
    }
  }, [currentLocation]);

  if (!isOpen) return null;

  // Handle Place selected from modern Places API (New) Autocomplete
  const handlePlaceSelect = (selected: SelectedPlaceResult) => {
    setPlaceName(selected.name);
    setLat(selected.lat);
    setLng(selected.lng);
    setAddress(selected.address || '');
    setPlaceId(selected.placeId);
    setViewport(selected.viewport || null);
    setGeoError(null);
    refreshWeather(selected.lat, selected.lng);
  };

  // Handle direct map click to set or adjust marker
  const handleMapClick = (e: any) => {
    if (e.detail?.latLng) {
      const clickedLat = Number(e.detail.latLng.lat.toFixed(5));
      const clickedLng = Number(e.detail.latLng.lng.toFixed(5));
      setLat(clickedLat);
      setLng(clickedLng);
      setViewport(null);
      if (!placeName || placeName === 'Quiet Sanctuary') {
        setPlaceName(`Locus (${clickedLat.toFixed(2)}, ${clickedLng.toFixed(2)})`);
      }
      refreshWeather(clickedLat, clickedLng);
    }
  };

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
        const userLat = Number(pos.coords.latitude.toFixed(5));
        const userLng = Number(pos.coords.longitude.toFixed(5));
        setLat(userLat);
        setLng(userLng);
        setViewport(null);
        if (!placeName) {
          setPlaceName('Current Sanctuary');
        }
        refreshWeather(userLat, userLng);
      },
      (err) => {
        setIsLocating(false);
        setGeoError(`Location notice: ${err.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Select a preset historic philosophical sanctuary
  const handleSelectPreset = (preset: (typeof HISTORIC_SANCTUARIES)[0]) => {
    setPlaceName(preset.name);
    setLat(preset.lat);
    setLng(preset.lng);
    setAddress(preset.desc);
    setPlaceId(undefined);
    setViewport(null);
    setGeoError(null);
    refreshWeather(preset.lat, preset.lng);
  };

  // Commit saved location to journal entry
  const handleSave = () => {
    if (!placeName.trim()) {
      setGeoError('Please specify a sanctuary or locus name for this entry.');
      return;
    }

    if (isNaN(lat) || isNaN(lng)) {
      setGeoError('Valid geographic coordinates are required.');
      return;
    }

    const locPayload: JournalLocation = {
      name: placeName.trim(),
      lat,
      lng,
      address: address.trim() || undefined,
      placeId: placeId || undefined,
      weather: weather || undefined,
    };

    onSaveLocation(locPayload);
    onClose();
  };

  const handleRemove = () => {
    onSaveLocation(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#1A1918]/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#FFFDF9] rounded-sm border border-[#E2DDD5] shadow-2xl overflow-hidden flex flex-col font-serif max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2DDD5] bg-[#F7F4EE]/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#C4432B]/10 text-[#C4432B] flex items-center justify-center shadow-xs">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-sans font-bold uppercase tracking-[0.18em] text-[#2B2A28]">
                Locus of Reflection
              </h3>
              <p className="text-[11px] font-sans text-[#8A8478]">
                Ground your meditation in physical topography with Google Maps & Places API
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

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Top Search & Actions Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-sans uppercase tracking-[0.2em] font-semibold text-[#595652] flex items-center gap-1.5">
                <span>Find Place or Sanctuary</span>
                <span className="text-[9px] text-[#8A8478] font-normal">(Places API New)</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCurrentPosition}
                  disabled={isLocating}
                  className="text-[#C4432B] hover:text-[#9E3420] text-[10px] font-sans uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Navigation className="w-3 h-3" />
                  <span>{isLocating ? 'Locating…' : 'Current Location'}</span>
                </button>
              </div>
            </div>

            {/* Places API Autocomplete Input (Active inside APIProvider or Fallback) */}
            {effectiveApiKey ? (
              <APIProvider apiKey={effectiveApiKey} solutionChannel="GMP_devsite_samples_v3_rgmautocomplete">
                <PlacesAutocomplete
                  onPlaceSelect={handlePlaceSelect}
                  initialValue={placeName}
                  placeholder="Search cities, historic sanctuaries, libraries, cafes…"
                />
              </APIProvider>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                  placeholder="e.g., Walden Pond, Concord, or Alpine Cabin"
                  className="w-full px-3 py-2 text-xs font-serif bg-[#FBF9F5] border border-[#E2DDD5] rounded-xs focus:outline-none focus:border-[#C4432B] text-[#2B2A28]"
                />
              </div>
            )}
          </div>

          {/* Interactive Google Map Stage */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-sans text-[#8A8478]">
              <span className="uppercase tracking-[0.16em] font-semibold text-[#595652]">
                Interactive Map &amp; Pin (Click map to adjust position)
              </span>
              <span className="font-mono text-[9px]">
                {lat.toFixed(4)}°, {lng.toFixed(4)}°
              </span>
            </div>

            <div className="w-full h-64 sm:h-72 rounded-xs border border-[#E2DDD5] overflow-hidden relative shadow-inner bg-[#F7F4EE]">
              {effectiveApiKey ? (
                <APIProvider
                  apiKey={effectiveApiKey}
                  solutionChannel="GMP_devsite_samples_v3_rgmautocomplete"
                >
                  <Map
                    defaultCenter={{ lat, lng }}
                    defaultZoom={13}
                    mapId={mapId}
                    gestureHandling="greedy"
                    disableDefaultUI={false}
                    styles={PARCHMENT_MAP_STYLES}
                    internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                    onClick={handleMapClick}
                    className="w-full h-full"
                  >
                    <AdvancedMarker
                      position={{ lat, lng }}
                      title={placeName || 'Locus of Thought'}
                    >
                      <Pin
                        background="#C4432B"
                        glyphColor="#FFFDF9"
                        borderColor="#8C2E1D"
                        scale={1.1}
                      />
                    </AdvancedMarker>

                    <MapCameraSync
                      center={{ lat, lng }}
                      viewport={viewport}
                    />
                  </Map>
                </APIProvider>
              ) : (
                /* Fallback Map Notice when API key is not yet set */
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-radial from-[#FFFDF9] to-[#F3EFE6]">
                  <div className="w-10 h-10 rounded-full bg-[#C4432B]/10 text-[#C4432B] flex items-center justify-center mx-auto">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div className="max-w-md space-y-1">
                    <h4 className="text-sm font-serif font-bold text-[#2B2A28]">
                      Interactive Google Map Canvas
                    </h4>
                    <p className="text-[11px] font-sans text-[#595652] leading-relaxed">
                      Enable live Google Maps tiles, Places API Autocomplete, and Advanced Markers by providing a Google Maps API Key or free Maps Demo Key.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <a
                      href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-[#2B2A28] hover:bg-[#C4432B] text-[#FFFDF9] text-[10px] font-sans uppercase tracking-wider font-semibold rounded-xs transition-colors inline-flex items-center gap-1.5"
                    >
                      <span>Get Free Maps Demo Key</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setShowKeyInput(!showKeyInput)}
                      className="px-3 py-1.5 border border-[#E2DDD5] hover:border-[#C4432B] text-[#595652] hover:text-[#C4432B] text-[10px] font-sans uppercase tracking-wider rounded-xs transition-colors inline-flex items-center gap-1"
                    >
                      <Key className="w-3 h-3" />
                      <span>{showKeyInput ? 'Hide Key Input' : 'Paste Key to Test'}</span>
                    </button>
                  </div>

                  {showKeyInput && (
                    <div className="w-full max-w-sm pt-2 flex items-center gap-1.5 animate-in fade-in duration-150">
                      <input
                        type="text"
                        value={sessionKey}
                        onChange={(e) => {
                          const k = e.target.value.trim();
                          setSessionKey(k);
                          if (typeof window !== 'undefined') {
                            sessionStorage.setItem('mindscribe_gmp_key', k);
                          }
                        }}
                        placeholder="Paste Google Maps API key..."
                        className="flex-1 px-2.5 py-1 text-xs font-mono bg-white border border-[#E2DDD5] rounded-xs focus:outline-none focus:border-[#C4432B]"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Place Details & Atmospheric Weather Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#F7F4EE]/60 rounded-xs border border-[#E2DDD5]">
            <div className="space-y-1">
              <label className="text-[9px] font-sans uppercase tracking-[0.2em] font-semibold text-[#8A8478]">
                Selected Sanctuary
              </label>
              <div className="text-xs font-serif font-medium text-[#2B2A28] truncate">
                {placeName || 'No locus designated'}
              </div>
              {address && (
                <div className="text-[10px] font-sans text-[#8A8478] truncate" title={address}>
                  {address}
                </div>
              )}
            </div>

            <div className="space-y-1 sm:border-l sm:border-[#E2DDD5] sm:pl-3">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-sans uppercase tracking-[0.2em] font-semibold text-[#8A8478] flex items-center gap-1">
                  <CloudSun className="w-2.5 h-2.5 text-[#C4432B]" />
                  <span>Atmospheric Weather</span>
                </label>
                {isUpdatingWeather && (
                  <span className="text-[9px] font-sans text-[#8A8478] animate-pulse">
                    Refreshing…
                  </span>
                )}
              </div>
              {weather ? (
                <div className="flex items-center gap-2 text-xs font-serif text-[#2B2A28]">
                  <span className="text-base">{weather.icon}</span>
                  <div>
                    <span className="font-semibold">{weather.tempC}°C</span>
                    <span className="text-[#8A8478] ml-1.5">• {weather.condition}</span>
                    {weather.windSpeedKmh !== undefined && (
                      <span className="text-[10px] font-sans text-[#8A8478] ml-1">
                        ({weather.windSpeedKmh} km/h wind)
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-[10px] font-sans text-[#8A8478] italic">
                  Weather recorded automatically with coordinates
                </div>
              )}
            </div>
          </div>

          {geoError && (
            <p className="text-[11px] font-sans text-[#C4432B] bg-[#C4432B]/5 border border-[#C4432B]/20 p-2 rounded-xs">
              {geoError}
            </p>
          )}

          {/* Historic Philosophical Sanctuaries Quick-Picks */}
          <div className="space-y-2 pt-1 border-t border-[#E2DDD5]/60">
            <div className="flex items-center gap-1 text-[10px] font-sans uppercase tracking-[0.18em] text-[#8A8478]">
              <Sparkles className="w-3 h-3 text-[#C4432B]" />
              <span>Or Choose a Historic Philosophical Locus</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {HISTORIC_SANCTUARIES.map((sanctuary) => (
                <button
                  key={sanctuary.name}
                  type="button"
                  onClick={() => handleSelectPreset(sanctuary)}
                  className={`text-left p-2 rounded-xs border transition-all group cursor-pointer ${
                    placeName === sanctuary.name
                      ? 'border-[#C4432B] bg-[#C4432B]/5'
                      : 'border-[#E2DDD5] bg-[#FBF9F5] hover:bg-[#F7F4EE] hover:border-[#C4432B]/50'
                  }`}
                >
                  <div className="text-[11px] font-serif font-medium text-[#2B2A28] group-hover:text-[#C4432B] transition-colors truncate">
                    {sanctuary.name}
                  </div>
                  <div className="text-[9px] font-sans text-[#8A8478] line-clamp-1">
                    {sanctuary.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-[#E2DDD5] bg-[#F7F4EE]/80 shrink-0">
          <div>
            {currentLocation && (
              <button
                type="button"
                onClick={handleRemove}
                className="text-xs font-sans text-[#C4432B] hover:underline cursor-pointer"
              >
                Clear Location
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-sans uppercase tracking-wider text-[#595652] hover:text-[#2B2A28] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-sans uppercase tracking-wider bg-[#2B2A28] hover:bg-[#1A1918] text-[#FFFDF9] rounded-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
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
