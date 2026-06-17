import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Pin } from '../../types'

// Fix leaflet default marker icons
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function makeGroupIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:28px;height:28px;border-radius:50% 50% 50% 0;
      background:${color};border:2px solid white;
      transform:rotate(-45deg);
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  })
}

function draftIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:24px;height:24px;border-radius:50%;
      background:#3b82f6;border:3px solid white;
      animation:pulse 1.5s infinite;
      box-shadow:0 0 0 0 rgba(59,130,246,0.6);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

interface MapClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void
}

function MapClickHandler({ onMapClick }: MapClickHandlerProps) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

interface Props {
  pins: Pin[]
  draftLocation: { lat: number; lng: number } | null
  onMapClick: (lat: number, lng: number) => void
  onPinSelect: (pin: Pin) => void
  filterGroupId: string | null
}

export function MapView({ pins, draftLocation, onMapClick, onPinSelect, filterGroupId }: Props) {
  const mapRef = useRef<L.Map | null>(null)

  const visiblePins = filterGroupId
    ? pins.filter((p) => p.group_id === filterGroupId)
    : pins

  useEffect(() => {
    if (draftLocation && mapRef.current) {
      mapRef.current.panTo([draftLocation.lat, draftLocation.lng])
    }
  }, [draftLocation])

  return (
    <MapContainer
      center={[20, 0]}
      zoom={3}
      className="w-full h-full"
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapClickHandler onMapClick={onMapClick} />

      {visiblePins.map((pin) => (
        <Marker
          key={pin.id}
          position={[pin.lat, pin.lng]}
          icon={makeGroupIcon(pin.group?.color ?? '#64748b')}
          eventHandlers={{ click: () => onPinSelect(pin) }}
        >
          <Popup>
            <strong>{pin.title}</strong>
            {pin.group && <div style={{ color: pin.group.color }}>{pin.group.name}</div>}
          </Popup>
        </Marker>
      ))}

      {draftLocation && (
        <Marker position={[draftLocation.lat, draftLocation.lng]} icon={draftIcon()} />
      )}
    </MapContainer>
  )
}
