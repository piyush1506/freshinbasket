"use client";

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon missing in next.js due to webpack
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const driverIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: 'driver-marker',
});

// Custom CSS for driver marker
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .driver-marker {
      filter: hue-rotate(200deg) saturate(2);
    }
  `;
  document.head.appendChild(style);
}

function MapBoundsUpdater({ driverPos, destPos }) {
  const map = useMap();
  useEffect(() => {
    if (driverPos && destPos) {
      const bounds = L.latLngBounds([driverPos, destPos]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [driverPos, destPos, map]);
  return null;
}

export default function DeliveryMap({ lat = 25.3463, lng = 74.6364, address = "Bhilwara, Rajasthan", driverlocation }) {
  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);
  
  const endPosition = {
    lat: isNaN(parsedLat) ? 25.3463 : parsedLat, 
    lng: isNaN(parsedLng) ? 74.6364 : parsedLng,
  };

  const hasDriverLocation = driverlocation && driverlocation.lat !== 0 && driverlocation.lng !== 0;
  
  const driverPos = hasDriverLocation ? [driverlocation.lat, driverlocation.lng] : null;
  const destPos = [endPosition.lat, endPosition.lng];

  const centerPos = hasDriverLocation ? driverPos : destPos;

  return (
    <div style={{ width: '100%', height: '100%', zIndex: 0 }}>
      <MapContainer 
        center={centerPos} 
        zoom={14} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Destination marker */}
        <Marker position={destPos}>
          <Popup>{address}</Popup>
        </Marker>

        {/* Driver marker if location is available */}
        {hasDriverLocation && (
          <Marker position={driverPos} icon={driverIcon}>
            <Popup>Your Location</Popup>
          </Marker>
        )}

        {/* Route line between driver and destination */}
        {hasDriverLocation && (
          <Polyline
            positions={[driverPos, destPos]}
            color="#2D6A2E"
            weight={3}
            opacity={0.6}
            dashArray="10, 10"
          />
        )}

        {/* Auto-fit bounds to show both markers */}
        {hasDriverLocation && (
          <MapBoundsUpdater driverPos={driverPos} destPos={destPos} />
        )}
      </MapContainer>
    </div>
  );
}
