"use client";

import React, { useEffect, useRef, useState } from "react";
import { Crosshair, Layers, Plus, Minus, MapPin, ShieldAlert, Radio } from "lucide-react";
import { TacticalCompass } from "./TacticalCompass";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface RealCrimeLocation {
  id: number;
  case_id: number;
  case_title: string;
  category: string;
  address: string;
  area: string;
  city: string;
  lat: number;
  lng: number;
  leadOfficer: string;
  badge: string;
  status: string;
  color: string;
}

const REAL_CRIME_LOCATIONS: RealCrimeLocation[] = [
  {
    id: 1,
    case_id: 1,
    case_title: "Operation Cyber Breach: Financial Swift Network Theft",
    category: "Cybercrime",
    address: "House 42, Road 11, Block D",
    area: "Banani",
    city: "Dhaka",
    lat: 23.7937,
    lng: 90.4066,
    leadOfficer: "Chief Insp. Arafat Faisal",
    badge: "ORC-1001",
    status: "Under Investigation",
    color: "#00e5ff",
  },
  {
    id: 2,
    case_id: 2,
    case_title: "Operation Kraken: Chittagong Contraband Syndicate",
    category: "Contraband Smuggling",
    address: "Container Yard Gate 4, Port Area",
    area: "Agrabad",
    city: "Chittagong",
    lat: 22.3168,
    lng: 91.8021,
    leadOfficer: "Inspector Tariq Ahmed",
    badge: "ORC-2001",
    status: "Under Investigation",
    color: "#a855f7",
  },
  {
    id: 3,
    case_id: 3,
    case_title: "Operation Iron Shield: Gulshan Extortion Ring",
    category: "Extortion & Arms",
    address: "Gulshan Avenue Commercial Complex",
    area: "Gulshan-2",
    city: "Dhaka",
    lat: 23.7925,
    lng: 90.4167,
    leadOfficer: "Sr. Detective Shakil Hossain",
    badge: "ORC-1002",
    status: "Pending Review",
    color: "#f59e0b",
  },
  {
    id: 4,
    case_id: 5,
    case_title: "Operation Black Grid: Grid Malware Intrusion",
    category: "Critical Infrastructure Cyber Attack",
    address: "Substation 4, Power Grid Colony",
    area: "Motihar",
    city: "Rajshahi",
    lat: 24.3636,
    lng: 88.6241,
    leadOfficer: "Cyber Specialist Kamrul Hasan",
    badge: "ORC-4001",
    status: "Open Incident",
    color: "#ef4444",
  },
  {
    id: 5,
    case_id: 4,
    case_title: "Operation Silver Mint: Fake Currency Distribution",
    category: "Counterfeiting & Forgery",
    address: "Tamabil Highway Border Checkpoint",
    area: "Jaflong",
    city: "Sylhet",
    lat: 24.8949,
    lng: 91.8687,
    leadOfficer: "Detective Sgt. Mahmudur Rahman",
    badge: "ORC-3001",
    status: "Closed",
    color: "#10b981",
  },
];

export const RealCrimeGISMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<RealCrimeLocation>(REAL_CRIME_LOCATIONS[0]);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filteredLocations =
    activeCategory === "All"
      ? REAL_CRIME_LOCATIONS
      : REAL_CRIME_LOCATIONS.filter((l) => l.category.toLowerCase().includes(activeCategory.toLowerCase()));

  // Initialize Real Leaflet Map with Dark Matter tiles
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Dhaka Center Coordinates
    const map = L.map(mapContainerRef.current, {
      center: [23.7937, 90.4066],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark Matter Tiles (High performance dark map tiles)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      subdomains: "abcd",
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers dynamically
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    filteredLocations.forEach((loc) => {
      const isSelected = selectedLocation.id === loc.id;

      // Custom Glowing Tactical Marker Icon
      const customIcon = L.divIcon({
        className: "custom-tactical-pin",
        html: `
          <div style="
            position: relative;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            <div style="
              position: absolute;
              width: 28px;
              height: 28px;
              border-radius: 50%;
              background-color: ${loc.color};
              opacity: 0.3;
              animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
            <div style="
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background-color: ${loc.color};
              border: 2px solid #ffffff;
              box-shadow: 0 0 12px ${loc.color};
              transform: ${isSelected ? "scale(1.3)" : "scale(1)"};
              transition: transform 0.2s ease;
            "></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(map);

      marker.on("click", () => {
        setSelectedLocation(loc);
        map.flyTo([loc.lat, loc.lng], 13, { duration: 1.2 });
      });
    });
  }, [filteredLocations, selectedLocation]);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleResetCenter = () => {
    mapInstanceRef.current?.flyTo([selectedLocation.lat, selectedLocation.lng], 13, { duration: 1 });
  };

  return (
    <div className="tactical-card p-6 relative overflow-hidden flex flex-col h-[520px]">
      {/* Map Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 z-20 mb-3">
        <div>
          <h3 className="font-tactical text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
            <span>REAL GEOSPATIAL CRIME SURVEILLANCE MAP</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </h3>
          <p className="font-mono-code text-xs text-neutral-400 mt-0.5">
            Real District Incident Coordinates &bull; Dhaka &bull; Chittagong &bull; Rajshahi &bull; Sylhet
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {["All", "Cyber", "Extortion", "Contraband", "Forgery"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveCategory(filter)}
              className={`px-3 py-1 rounded-full text-xs font-mono transition ${
                activeCategory === filter
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "bg-neutral-900/90 text-neutral-400 border border-neutral-800 hover:text-white"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Real Map Viewport Area */}
      <div className="relative flex-1 rounded-2xl border border-neutral-800/80 overflow-hidden">
        {/* Real Leaflet Map Container */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Radar Sweep Overlay in Center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-cyan-500/10 pointer-events-none z-10">
          <div className="w-full h-full rounded-full radar-sweep border-r-2 border-cyan-400/20 bg-gradient-to-tr from-transparent via-cyan-500/5 to-transparent" />
        </div>

        {/* Tactical Compass (Top Right - Screenshot 2) */}
        <div className="absolute top-4 right-4 z-20">
          <TacticalCompass heading="NW" degrees={315} />
        </div>

        {/* Real Map Controls (Right Side - Screenshot 2) */}
        <div className="absolute bottom-6 right-4 z-20 flex flex-col gap-2">
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="w-9 h-9 rounded-xl bg-neutral-900/90 border border-neutral-700 text-neutral-300 flex items-center justify-center hover:text-white hover:border-cyan-400 transition shadow-lg"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="w-9 h-9 rounded-xl bg-neutral-900/90 border border-neutral-700 text-neutral-300 flex items-center justify-center hover:text-white hover:border-cyan-400 transition shadow-lg"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetCenter}
            title="Center Incident"
            className="w-9 h-9 rounded-xl bg-neutral-900/90 border border-neutral-700 text-neutral-300 flex items-center justify-center hover:text-white hover:border-cyan-400 transition shadow-lg"
          >
            <Crosshair className="w-4 h-4 text-cyan-400" />
          </button>
        </div>

        {/* Floating Incident Inspection Card (Screenshot 1 & 2 HUD Style) */}
        {selectedLocation && (
          <div className="absolute bottom-4 left-4 z-20 w-80 sm:w-96 rounded-2xl bg-neutral-950/90 backdrop-blur-xl border border-neutral-700/80 p-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedLocation.color }} />
                <span className="font-mono-code text-xs font-bold text-white tracking-wider">
                  CASE #{selectedLocation.case_id}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                {selectedLocation.status}
              </span>
            </div>

            {/* Title & Location */}
            <div className="mt-3">
              <h4 className="font-tactical text-sm font-semibold text-white leading-tight">
                {selectedLocation.case_title}
              </h4>
              <p className="font-mono-code text-xs text-neutral-400 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{selectedLocation.address}, {selectedLocation.area}, {selectedLocation.city}</span>
              </p>
              <span className="text-[10px] font-mono text-neutral-500 block mt-0.5">
                GPS: {selectedLocation.lat.toFixed(4)}° N, {selectedLocation.lng.toFixed(4)}° E
              </span>
            </div>

            {/* Officer Assignment */}
            <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-500">LEAD DETECTIVE:</span>
              <span className="text-cyan-300 font-semibold">{selectedLocation.leadOfficer} ({selectedLocation.badge})</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
