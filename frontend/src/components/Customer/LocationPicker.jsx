import React, { useEffect, useState } from "react";
import {
  Search,
  MapPin,
  LocateFixed,
  Loader2,
  Navigation,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";

// Leaflet custom marker configuration
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const DEFAULT_LOCATION = [23.0225, 72.5714];

// Map click event listener
const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  if (!position) return null;
  return <Marker position={position} />;
};

// Smooth recenter controller
const MapCenter = ({ position }) => {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom(), {
        animate: true,
        pan: { duration: 0.8 },
      });
    }
  }, [position, map]);

  return null;
};

const LocationPicker = ({ latitude, longitude, onLocationChange }) => {
  const [position, setPosition] = useState(
    latitude && longitude
      ? [Number(latitude), Number(longitude)]
      : DEFAULT_LOCATION,
  );

  const [address, setAddress] = useState("");
  const [gettingLocation, setGettingLocation] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Reverse Geocoding
  const getAddressFromCoordinates = async (lat, lng) => {
    try {
      setLoadingAddress(true);
      setAddressError("");

      const url =
        `https://nominatim.openstreetmap.org/reverse` +
        `?format=jsonv2` +
        `&lat=${lat}` +
        `&lon=${lng}` +
        `&zoom=18` +
        `&addressdetails=1` +
        `&accept-language=en`;

      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) throw new Error("Unable to fetch address");

      const data = await response.json();
      const readableAddress = data.display_name || "";

      setAddress(readableAddress);
      onLocationChange({
        latitude: lat,
        longitude: lng,
        address: readableAddress,
      });
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      setAddressError(
        "Unable to detect address automatically. You can type it manually.",
      );
      onLocationChange({
        latitude: lat,
        longitude: lng,
        address: "",
      });
    } finally {
      setLoadingAddress(false);
    }
  };

  useEffect(() => {
    if (!position) return;
    getAddressFromCoordinates(position[0], position[1]);
  }, [position]);

  // Current Geolocation
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (location) => {
        const newPos = [location.coords.latitude, location.coords.longitude];
        setPosition(newPos);
        setGettingLocation(false);
      },
      (error) => {
        console.error("Location error:", error);
        setGettingLocation(false);
        alert(
          "Unable to access current location. Please check browser permissions.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  // Search Address autocomplete
  const searchAddress = async () => {
    const query = searchQuery.trim();
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const url =
        `https://nominatim.openstreetmap.org/search` +
        `?format=jsonv2` +
        `&q=${encodeURIComponent(query)}` +
        `&limit=5` +
        `&addressdetails=1` +
        `&accept-language=en`;

      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) throw new Error("Search failed");
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Search & GPS Location Action Bar */}
      <div className="space-y-2">
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchResults([]);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    searchAddress();
                  }
                }}
                placeholder="Search landmark, locality, area..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 sm:text-sm"
              />
            </div>

            <button
              type="button"
              onClick={searchAddress}
              disabled={searching || searchQuery.trim().length < 3}
              className="flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {searching ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                "Search"
              )}
            </button>
          </div>

          {/* Autocomplete Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-12 z-[1000] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 animate-in fade-in zoom-in-95 duration-100">
              {searchResults.map((result) => (
                <button
                  key={result.place_id}
                  type="button"
                  onClick={() => {
                    const newPos = [Number(result.lat), Number(result.lon)];
                    setPosition(newPos);
                    setSearchQuery(result.display_name);
                    setSearchResults([]);
                  }}
                  className="flex w-full items-start gap-2.5 border-b border-slate-100 px-3.5 py-2.5 text-left transition last:border-b-0 hover:bg-blue-50/70"
                >
                  <MapPin size={15} className="mt-0.5 shrink-0 text-blue-600" />
                  <span className="line-clamp-2 text-xs font-medium text-slate-700">
                    {result.display_name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Use GPS Button */}
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={gettingLocation}
          className="group flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-blue-200/80 bg-blue-50/50 px-3 text-xs font-semibold text-blue-600 transition hover:bg-blue-100/70 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {gettingLocation ? (
            <>
              <Loader2 size={14} className="animate-spin text-blue-600" />
              <span>Fetching precise GPS...</span>
            </>
          ) : (
            <>
              <LocateFixed
                size={14}
                className="transition-transform duration-200 group-hover:scale-110"
              />
              <span>Use Current GPS Location</span>
            </>
          )}
        </button>
      </div>

      {/* Interactive Map Box */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100 shadow-xs">
        <MapContainer
          center={position}
          zoom={14}
          scrollWheelZoom={true}
          className="h-[220px] sm:h-[260px] w-full z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={setPosition} />
          <MapCenter position={position} />
        </MapContainer>

        <div className="pointer-events-none absolute bottom-2 left-2 z-[400] rounded-lg bg-white/90 px-2 py-1 text-[10px] font-medium text-slate-600 backdrop-blur-xs shadow-xs">
          Tap map to reposition
        </div>
      </div>

      {/* Selected Address Display Card */}
      <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 sm:p-3.5">
        <div className="flex items-start gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100/70 text-blue-600">
            {loadingAddress ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <CheckCircle2 size={15} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Pinned Address
            </span>

            {loadingAddress ? (
              <p className="mt-0.5 text-xs text-slate-400">
                Resolving address details...
              </p>
            ) : address ? (
              <p className="mt-0.5 line-clamp-2 text-xs font-medium text-slate-700 leading-snug">
                {address}
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-slate-400">
                Click on the map or search to pick a location.
              </p>
            )}
          </div>
        </div>

        {addressError && (
          <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] text-amber-700">
            <AlertCircle size={13} className="shrink-0" />
            <span>{addressError}</span>
          </div>
        )}
      </div>

      {/* Coordinates readout pills */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-2.5 py-1.5">
          <span className="text-[10px] font-medium uppercase text-slate-400">
            LAT
          </span>
          <span className="text-[11px] font-semibold text-slate-700 font-mono">
            {position[0]?.toFixed(5)}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-2.5 py-1.5">
          <span className="text-[10px] font-medium uppercase text-slate-400">
            LNG
          </span>
          <span className="text-[11px] font-semibold text-slate-700 font-mono">
            {position[1]?.toFixed(5)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
