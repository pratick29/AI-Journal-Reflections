import React, { useState, useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import { X, MapPin, Compass, BookOpen, ExternalLink, Calendar, Layers, Sparkles } from 'lucide-react';
import { Interaction } from '../../types';
import { PARCHMENT_MAP_STYLES } from './mapStyles';

interface SacredGroundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  interactions: Interaction[];
  onSelectInteraction: (interaction: Interaction) => void;
}

export const SacredGroundsModal: React.FC<SacredGroundsModalProps> = ({
  isOpen,
  onClose,
  interactions,
  onSelectInteraction,
}) => {
  const [selectedPin, setSelectedPin] = useState<Interaction | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'historical' | 'recent'>('all');

  // Filter interactions with valid geographic coordinates
  const geoInteractions = useMemo(() => {
    return interactions.filter(
      (i) =>
        i.location &&
        typeof i.location.lat === 'number' &&
        typeof i.location.lng === 'number' &&
        !isNaN(i.location.lat) &&
        !isNaN(i.location.lng)
    );
  }, [interactions]);

  if (!isOpen) return null;

  // Retrieve API Key and Map ID from environment
  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';
  const mapId = (import.meta as any).env?.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

  // Compute default center (fallback to Concord/Walden Pond or first geo-tagged reflection)
  const defaultCenter = geoInteractions.length > 0
    ? { lat: geoInteractions[0].location!.lat, lng: geoInteractions[0].location!.lng }
    : { lat: 37.9753, lng: 23.7231 }; // Athens Stoa Poikile

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#1A1918]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[88vh] bg-[#FFFDF9] rounded-sm border border-[#E2DDD5] shadow-2xl overflow-hidden flex flex-col font-serif">
        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 border-b border-[#E2DDD5] bg-[#F7F4EE]/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#C4432B]/10 text-[#C4432B] flex items-center justify-center shadow-xs">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-sans font-bold uppercase tracking-[0.2em] text-[#2B2A28]">
                  Sacred Grounds Atlas
                </h2>
                <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-[#EFECE6] border border-[#E2DDD5] text-[#8A8478]">
                  {geoInteractions.length} Loci Inscribed
                </span>
              </div>
              <p className="text-[11px] font-sans text-[#8A8478]">
                Cartography of Mind & Spirit — Geographical anchor points of your philosophical inquiries
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 text-[#8A8478] hover:text-[#2B2A28] rounded-xs hover:bg-[#EFECE6] transition-colors"
              title="Close Atlas"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Map Container Area */}
        <div className="flex-1 relative overflow-hidden bg-[#F7F4EE]">
          {apiKey ? (
            <APIProvider apiKey={apiKey}>
              <Map
                defaultCenter={defaultCenter}
                defaultZoom={geoInteractions.length > 0 ? 4 : 2}
                mapId={mapId}
                gestureHandling="greedy"
                disableDefaultUI={false}
                styles={PARCHMENT_MAP_STYLES}
                internalUsageAttributionIds={['gmp_git_agentskills_v1']}
                className="w-full h-full"
              >
                {geoInteractions.map((item) => (
                  <AdvancedMarker
                    key={item.id}
                    position={{
                      lat: item.location!.lat,
                      lng: item.location!.lng,
                    }}
                    onClick={() => setSelectedPin(item)}
                  >
                    <div className="cursor-pointer group flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-[#C4432B] text-white flex items-center justify-center shadow-md border-2 border-[#FFFDF9] group-hover:scale-110 transition-transform">
                        <span className="text-xs">🪶</span>
                      </div>
                      <div className="text-[9px] font-sans font-semibold uppercase tracking-wider bg-[#FFFDF9]/95 border border-[#E2DDD5] text-[#2B2A28] px-1.5 py-0.5 rounded-xs mt-1 shadow-xs group-hover:border-[#C4432B] transition-colors whitespace-nowrap">
                        {item.location!.name}
                      </div>
                    </div>
                  </AdvancedMarker>
                ))}

                {selectedPin && selectedPin.location && (
                  <InfoWindow
                    position={{
                      lat: selectedPin.location.lat,
                      lng: selectedPin.location.lng,
                    }}
                    onCloseClick={() => setSelectedPin(null)}
                  >
                    <div className="p-2 max-w-xs font-serif text-[#2B2A28] space-y-2">
                      <div className="border-b border-[#E2DDD5] pb-1">
                        <div className="text-[9px] font-sans uppercase tracking-[0.2em] text-[#C4432B] font-semibold">
                          {selectedPin.category}
                        </div>
                        <h4 className="text-sm font-serif font-bold text-[#2B2A28]">
                          {selectedPin.title}
                        </h4>
                      </div>

                      <div className="text-[11px] text-[#595652] italic line-clamp-3">
                        {selectedPin.messages?.[0]?.content || 'Inscribed reflection...'}
                      </div>

                      <div className="text-[9px] font-mono text-[#8A8478]">
                        📍 {selectedPin.location.name} ({selectedPin.location.lat.toFixed(2)},{' '}
                        {selectedPin.location.lng.toFixed(2)})
                      </div>

                      <button
                        onClick={() => {
                          onSelectInteraction(selectedPin);
                          onClose();
                        }}
                        className="w-full mt-2 py-1 px-2 text-[10px] font-sans uppercase tracking-wider bg-[#2B2A28] hover:bg-[#1A1918] text-[#FFFDF9] rounded-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <BookOpen className="w-3 h-3 text-[#C4432B]" />
                        <span>Read Manuscript</span>
                      </button>
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </APIProvider>
          ) : (
            /* Parchment Fallback Atlas View (when Google Maps API Key is being configured) */
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-6 bg-radial from-[#FFFDF9] to-[#F3EFE6]">
              <div className="w-14 h-14 rounded-full bg-[#C4432B]/10 text-[#C4432B] flex items-center justify-center mx-auto shadow-xs">
                <Compass className="w-7 h-7" />
              </div>

              <div className="max-w-md space-y-2">
                <h3 className="text-xl font-serif font-bold text-[#2B2A28]">
                  Cartography of Reflection Loci
                </h3>
                <p className="text-xs font-serif text-[#595652] leading-relaxed">
                  Pinning locations connects your manuscripts with the spirit of the physical ground where
                  your insights were forged.
                </p>
              </div>

              {/* Geo-Tagged Manuscript List */}
              <div className="w-full max-w-lg border border-[#E2DDD5] bg-[#FFFDF9] rounded-sm p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between text-xs font-sans uppercase tracking-[0.16em] text-[#8A8478] border-b border-[#E2DDD5] pb-2">
                  <span>Inscribed Ground</span>
                  <span>Coordinates</span>
                </div>

                {geoInteractions.length === 0 ? (
                  <div className="py-6 text-xs text-[#8A8478] italic">
                    No manuscripts have been pinned with a locus yet. Click 📍 in the Writing Desk to inscribe your first setting!
                  </div>
                ) : (
                  <div className="divide-y divide-[#E2DDD5]/60 max-h-48 overflow-y-auto">
                    {geoInteractions.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          onSelectInteraction(item);
                          onClose();
                        }}
                        className="py-2.5 px-2 flex items-center justify-between hover:bg-[#F7F4EE] rounded-xs cursor-pointer transition-colors group"
                      >
                        <div className="text-left">
                          <div className="text-xs font-serif font-medium text-[#2B2A28] group-hover:text-[#C4432B] transition-colors">
                            {item.title}
                          </div>
                          <div className="text-[10px] font-sans text-[#8A8478] flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5 text-[#C4432B]" />
                            <span>{item.location!.name}</span>
                          </div>
                        </div>

                        <div className="text-[10px] font-mono text-[#8A8478]">
                          {item.location!.lat.toFixed(2)}°, {item.location!.lng.toFixed(2)}°
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Setup Instruction Note */}
              <div className="text-[11px] font-sans text-[#8A8478] max-w-md bg-[#F7F4EE] p-3 rounded-xs border border-[#E2DDD5]">
                <span>To enable dynamic Google Maps tiles, add </span>
                <code className="px-1 py-0.5 bg-[#E2DDD5]/60 text-[#2B2A28] rounded-xs font-mono text-[10px]">
                  VITE_GOOGLE_MAPS_API_KEY
                </code>
                <span> to your environment. Subject to </span>
                <a
                  href="https://cloud.google.com/maps-platform/terms?utm_campaign=gmp_git_agentskills_v1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#C4432B] underline hover:text-[#9E3420]"
                >
                  Google Maps Platform Terms of Service
                </a>.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-2.5 border-t border-[#E2DDD5] bg-[#F7F4EE]/90 flex items-center justify-between text-[10px] font-sans uppercase tracking-[0.16em] text-[#8A8478] shrink-0">
          <div className="flex items-center gap-1">
            <span>Powered by Google Maps Platform</span>
            <span>•</span>
            <a
              href="https://cloud.google.com/maps-platform/terms?utm_campaign=gmp_git_agentskills_v1"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#2B2A28] underline"
            >
              Terms of Service
            </a>
          </div>
          <div>
            <span>Peripatetic Topography</span>
          </div>
        </div>
      </div>
    </div>
  );
};
