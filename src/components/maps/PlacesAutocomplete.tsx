import React, { useState, useEffect, useRef } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { Search, MapPin, Loader2, X } from 'lucide-react';

export interface SelectedPlaceResult {
  name: string;
  lat: number;
  lng: number;
  address?: string;
  placeId?: string;
  viewport?: google.maps.LatLngBounds | null;
}

interface PlacesAutocompleteProps {
  onPlaceSelect: (place: SelectedPlaceResult) => void;
  placeholder?: string;
  initialValue?: string;
}

export const PlacesAutocomplete: React.FC<PlacesAutocompleteProps> = ({
  onPlaceSelect,
  placeholder = 'Search cities, sanctuaries, libraries, landmarks…',
  initialValue = '',
}) => {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const placesLib = useMapsLibrary('places');
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<any>(null);

  // Sync with initial value changes if given
  useEffect(() => {
    if (initialValue && !query) {
      setQuery(initialValue);
    }
  }, [initialValue]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch autocomplete suggestions with debounce
  useEffect(() => {
    if (!placesLib || !query.trim() || query.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsLoading(true);
      setStatusNotice(null);

      try {
        // Modern Places API (New) AutocompleteSuggestion with Session Token
        if (placesLib.AutocompleteSuggestion) {
          if (!sessionTokenRef.current && placesLib.AutocompleteSessionToken) {
            sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
          }

          const response = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: query.trim(),
            sessionToken: sessionTokenRef.current ?? undefined,
          });

          if (response && response.suggestions && response.suggestions.length > 0) {
            setSuggestions(response.suggestions);
            setIsOpen(true);
          } else {
            setSuggestions([]);
            setIsOpen(false);
          }
        }
      } catch (err: any) {
        console.warn('Places autocomplete suggestion error:', err);
        setStatusNotice('Could not retrieve suggestions. You can also click directly on the map.');
      } finally {
        setIsLoading(false);
      }
    }, 280);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, placesLib]);

  // Handle selecting a prediction
  const handleSelectSuggestion = async (suggestion: google.maps.places.AutocompleteSuggestion) => {
    if (!suggestion.placePrediction) return;

    setIsLoading(true);
    setIsOpen(false);

    try {
      const place = suggestion.placePrediction.toPlace();

      // Fetch place fields using the session token bundled request
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location', 'viewport', 'id'],
      });

      const latLng = place.location;
      if (!latLng) {
        throw new Error('No coordinates returned for selected place');
      }

      const mainText =
        (suggestion.placePrediction as any).mainText?.toString() ||
        suggestion.placePrediction.text?.toString() ||
        'Selected Place';
      const secondaryText = (suggestion.placePrediction as any).secondaryText?.toString();

      const placeName = place.displayName || mainText;
      const address = place.formattedAddress || secondaryText || undefined;

      setQuery(placeName);

      onPlaceSelect({
        name: placeName,
        lat: Number(latLng.lat().toFixed(5)),
        lng: Number(latLng.lng().toFixed(5)),
        address,
        placeId: place.id || undefined,
        viewport: place.viewport || null,
      });

      // Reset session token after selection
      sessionTokenRef.current = null;
    } catch (err: any) {
      console.error('Error fetching place details:', err);
      setStatusNotice('Failed to fetch full place details. Please try another place.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    sessionTokenRef.current = null;
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative flex items-center">
        <div className="absolute left-3 text-[#8A8478] pointer-events-none">
          <Search className="w-3.5 h-3.5 text-[#C4432B]" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2 text-xs font-serif bg-[#FBF9F5] border border-[#E2DDD5] rounded-xs focus:outline-none focus:border-[#C4432B] text-[#2B2A28] placeholder:text-[#8A8478]/80 transition-colors shadow-2xs"
        />
        <div className="absolute right-2.5 flex items-center gap-1">
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C4432B]" />}
          {query && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="text-[#8A8478] hover:text-[#2B2A28] p-0.5 rounded-full transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {statusNotice && (
        <p className="text-[10px] font-sans text-[#8A8478] mt-1 italic">{statusNotice}</p>
      )}

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-[#FFFDF9] border border-[#E2DDD5] rounded-xs shadow-xl max-h-60 overflow-y-auto divide-y divide-[#E2DDD5]/60 animate-in fade-in duration-150">
          <div className="px-3 py-1 bg-[#F7F4EE]/80 text-[9px] font-sans uppercase tracking-[0.16em] text-[#8A8478] font-bold">
            Places API (New) Predictions
          </div>
          {suggestions.map((suggestion, index) => {
            const pred = suggestion.placePrediction;
            if (!pred) return null;
            const mainText = (pred as any).mainText?.toString() || pred.text?.toString();
            const secondaryText = (pred as any).secondaryText?.toString();

            return (
              <button
                key={(pred as any).placeId || index}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                className="w-full text-left px-3.5 py-2.5 hover:bg-[#F7F4EE] transition-colors flex items-start gap-2.5 group cursor-pointer"
              >
                <div className="mt-0.5 w-5 h-5 rounded-full bg-[#C4432B]/10 text-[#C4432B] flex items-center justify-center shrink-0 group-hover:bg-[#C4432B] group-hover:text-white transition-colors">
                  <MapPin className="w-2.5 h-2.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-serif font-medium text-[#2B2A28] group-hover:text-[#C4432B] transition-colors truncate">
                    {mainText}
                  </div>
                  {secondaryText && (
                    <div className="text-[10px] font-sans text-[#8A8478] truncate">
                      {secondaryText}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
