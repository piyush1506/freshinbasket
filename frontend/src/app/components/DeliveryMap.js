"use client";

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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

export default function DeliveryMap({ lat = 25.3463, lng = 74.6364, address = "Bhilwara, Rajasthan", driverlocation }) {
  // Parse coords in case they are strings
  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);
  
  // Fallback to Bhilwara if invalid
  const endPosition = {
    lat: isNaN(parsedLat) ? 25.3463 : parsedLat, 
    lng: isNaN(parsedLng) ? 74.6364 : parsedLng,
  };

  const hasDriverLocation = driverlocation && driverlocation.lat !== 0 && driverlocation.lng !== 0;
  
  const centerPos = hasDriverLocation 
    ? [driverlocation.lat, driverlocation.lng] 
    : [endPosition.lat, endPosition.lng];

  return (
    <div style={{ width: '100%', height: '100%', zIndex: 0 }}>
      <MapContainer 
        center={centerPos} 
        zoom={14} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Destination marker */}
        <Marker position={[endPosition.lat, endPosition.lng]}>
          <Popup>{address}</Popup>
        </Marker>

        {/* Driver marker if location is available */}
        {hasDriverLocation && (
          <Marker position={[driverlocation.lat, driverlocation.lng]}>
            <Popup>Driver Location</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
