// map.js — Initializes Leaflet map, gets user location, fetches & displays clinic markers.

const ClinicMap = (() => {
  let map = null;
  let markersLayer = null;

  // Marker colors for affordability tiers
  const TIER_COLORS = {
    budget: "#2d9e2d",
    moderate: "#d4a017",
    premium: "#c0392b",
  };

  /**
   * Create a colored circle icon for map markers.
   */
  function createIcon(color) {
    return L.divIcon({
      className: "custom-marker",
      html: `<div style="
        width:14px;height:14px;border-radius:50%;
        background:${color};border:2px solid #fff;
        box-shadow:0 1px 4px rgba(0,0,0,0.4);
      "></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
      popupAnchor: [0, -10],
    });
  }

  /**
   * Initialize the Leaflet map centered on a given position.
   */
  function initMap(lat, lng) {
    console.log("[Map] Initializing map at lat:", lat, "lng:", lng);
    // Destroy previous map instance if it exists
    if (map) {
      map.remove();
      map = null;
    }

    map = L.map("map").setView([lat, lng], 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    // Mark user location
    L.circleMarker([lat, lng], {
      radius: 8,
      fillColor: "#0077b6",
      color: "#fff",
      weight: 2,
      fillOpacity: 0.9,
    })
      .addTo(map)
      .bindPopup("Your location")
      .openPopup();

    markersLayer = L.layerGroup().addTo(map);

    return map;
  }

  /**
   * Get the user's current position via the Geolocation API.
   * Returns { lat, lng }.
   */
function getUserLocation() {
  return new Promise((resolve, reject) => {

    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        console.log("User location:", lat, lng);

        resolve({ lat, lng });  
      },

      () => {
        reject(new Error("Location access denied. Please enable location services."));
      },

      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

  });
}

  /**
   * Fetch nearby clinics/hospitals using the Overpass API.
   * Searches within a ~3 km radius.
   */
  async function fetchNearbyClinics(lat, lng) {
    console.log("[Map] Fetching clinics near lat:", lat, "lng:", lng, "radius: 3000m");
    const radius = 3000; // meters
    const query = `
      [out:json][timeout:15];
      (
        node["amenity"="clinic"](around:${radius},${lat},${lng});
        node["amenity"="hospital"](around:${radius},${lat},${lng});
        node["amenity"="doctors"](around:${radius},${lat},${lng});
      );
      out body;
    `;

    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "data=" + encodeURIComponent(query),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch clinic data from OpenStreetMap.");
    }

    const data = await response.json();
    console.log("[Map] Overpass API returned", (data.elements || []).length, "clinics");
    return data.elements || [];
  }

  /**
   * Estimate an affordability tier for demonstration purposes.
   * Uses a simple heuristic based on amenity type and name keywords.
   */
  function estimateTier(element) {
    const name = (element.tags?.name || "").toLowerCase();
    const amenity = element.tags?.amenity || "";

    if (amenity === "hospital" || name.includes("hospital")) return "premium";
    if (
      name.includes("clinic") ||
      name.includes("center") ||
      name.includes("centre")
    )
      return "moderate";
    return "budget";
  }

  /**
   * Display clinic markers on the map.
   */
  function displayClinics(clinics) {
    if (!markersLayer) return;
    markersLayer.clearLayers();

    clinics.forEach((el) => {
      if (!el.lat || !el.lon) return;

      const tier = estimateTier(el);
      const color = TIER_COLORS[tier];
      const name = el.tags?.name || "Medical Facility";
      const amenity = el.tags?.amenity || "clinic";

      const marker = L.marker([el.lat, el.lon], {
        icon: createIcon(color),
      });

      marker.bindPopup(
        `<strong>${escapeHtml(name)}</strong><br/>` +
          `Type: ${escapeHtml(amenity)}<br/>` +
          `Tier: <span style="color:${color};font-weight:600;">${tier}</span>`
      );

      markersLayer.addLayer(marker);
    });
  }

  /**
   * Fetch ONLY nearby hospitals using the Overpass API (emergency mode).
   * Searches within a ~5 km radius for wider coverage.
   */
  async function fetchNearbyHospitals(lat, lng) {
    console.log("[Map] EMERGENCY: Fetching hospitals only near lat:", lat, "lng:", lng, "radius: 5000m");
    const radius = 5000; // wider radius for emergencies
    const query = `
      [out:json][timeout:15];
      (
        node["amenity"="hospital"](around:${radius},${lat},${lng});
        way["amenity"="hospital"](around:${radius},${lat},${lng});
      );
      out center body;
    `;

    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "data=" + encodeURIComponent(query),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch hospital data from OpenStreetMap.");
    }

    const data = await response.json();
    const elements = (data.elements || []).map((el) => {
      // way elements have center coords instead of lat/lon
      if (el.center) {
        el.lat = el.center.lat;
        el.lon = el.center.lon;
      }
      return el;
    });
    console.log("[Map] Overpass API returned", elements.length, "hospitals");
    return elements;
  }

  /**
   * Display hospital markers on the map (emergency mode — all red).
   */
  function displayHospitals(hospitals) {
    if (!markersLayer) return;
    markersLayer.clearLayers();

    hospitals.forEach((el) => {
      if (!el.lat || !el.lon) return;

      const name = el.tags?.name || "Hospital";

      const marker = L.marker([el.lat, el.lon], {
        icon: createIcon("#e63946"),
      });

      marker.bindPopup(
        `<strong>${escapeHtml(name)}</strong><br/>` +
          `Type: Hospital<br/>` +
          `<span style="color:#e63946;font-weight:600;">Emergency Facility</span>`
      );

      markersLayer.addLayer(marker);
    });
  }

  /**
   * Emergency mode: load map with only hospitals.
   */
  async function loadHospitalsAtCoords(lat, lng) {
    console.log("[Map] EMERGENCY: Loading hospitals at lat:", lat, "lng:", lng);
    initMap(lat, lng);

    const hospitals = await fetchNearbyHospitals(lat, lng);
    displayHospitals(hospitals);

    if (hospitals.length > 0) {
      const bounds = L.latLngBounds(
        hospitals.filter((h) => h.lat && h.lon).map((h) => [h.lat, h.lon])
      );
      bounds.extend([lat, lng]);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }

    return hospitals.length;
  }

  /**
   * Emergency mode entry point: auto-detect location → show hospitals.
   */
  async function loadHospitals() {
    console.log("[Map] EMERGENCY: Auto-detecting location for hospital search...");
    const { lat, lng } = await getUserLocation();
    return loadHospitalsAtCoords(lat, lng);
  }

  /**
   * Emergency mode with manual search: geocode → show hospitals.
   */
  async function searchHospitals(query) {
    console.log("[Map] EMERGENCY: Searching hospitals near:", query);
    const { lat, lng } = await geocodeLocation(query);
    return loadHospitalsAtCoords(lat, lng);
  }

  /**
   * Geocode a place name using OpenStreetMap Nominatim.
   * Returns { lat, lng }.
   */
  async function geocodeLocation(query) {
    console.log("[Map] Geocoding location:", query);
    const url =
      "https://nominatim.openstreetmap.org/search?" +
      new URLSearchParams({ q: query, format: "json", limit: "1" });

    const res = await fetch(url, {
      headers: { "User-Agent": "SymptomSpecialistMapper/1.0" },
    });

    if (!res.ok) throw new Error("Geocoding request failed.");
    const data = await res.json();
    if (!data.length) throw new Error("Location not found. Try a different search.");

    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  }

  /**
   * Load map at given coordinates, fetch & show clinics.
   */
  async function loadAtCoords(lat, lng) {
    console.log("[Map] Loading map at lat:", lat, "lng:", lng);
    initMap(lat, lng);

    const clinics = await fetchNearbyClinics(lat, lng);
    displayClinics(clinics);

    if (clinics.length > 0) {
      const bounds = L.latLngBounds(
        clinics.filter((c) => c.lat && c.lon).map((c) => [c.lat, c.lon])
      );
      bounds.extend([lat, lng]);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }

    return clinics.length;
  }

  /**
   * Main entry point: get location → init map → fetch & show clinics.
   */
  async function loadMap() {
    console.log("[Map] Auto-detecting user location...");
    const { lat, lng } = await getUserLocation();
    console.log("[Map] Auto-detected location — lat:", lat, "lng:", lng);
    return loadAtCoords(lat, lng);
  }

  /**
   * Search by place name: geocode → load map at that location.
   */
  async function searchLocation(query) {
    console.log("[Map] Manual search for:", query);
    const { lat, lng } = await geocodeLocation(query);
    console.log("[Map] Geocoded to lat:", lat, "lng:", lng);
    return loadAtCoords(lat, lng);
  }

  /**
   * Escape HTML to prevent XSS from OpenStreetMap data.
   */
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // Public API
  return { loadMap, searchLocation, loadHospitals, searchHospitals };
})();
