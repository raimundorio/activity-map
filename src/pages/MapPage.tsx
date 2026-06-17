import { useState } from 'react'
import { MapView } from '../components/map/MapView'
import { SidePanel } from '../components/sidebar/SidePanel'
import { usePins } from '../hooks/usePins'
import { useAuth } from '../hooks/useAuth'
import type { Pin, NewPin } from '../types'

export function MapPage() {
  const { user, profile, signOut } = useAuth()
  const { pins, loading, createPin, deletePin } = usePins()
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null)
  const [draftLocation, setDraftLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [filterGroupId, setFilterGroupId] = useState<string | null>(null)

  const groupMap = new Map<string, NonNullable<Pin['group']>>()
  for (const p of pins) {
    if (p.group && !groupMap.has(p.group_id)) groupMap.set(p.group_id, p.group)
  }
  const groups = Array.from(groupMap.values())

  function handleMapClick(lat: number, lng: number) {
    if (!profile?.group_id) return
    setSelectedPin(null)
    setDraftLocation({ lat, lng })
  }

  function handlePinSelect(pin: Pin) {
    setDraftLocation(null)
    setSelectedPin(pin)
  }

  async function handlePinSubmit(newPin: NewPin) {
    if (!user || !profile?.group_id) return
    await createPin(newPin, user.id, profile.group_id)
    setDraftLocation(null)
  }

  async function handlePinDelete(id: string) {
    await deletePin(id)
    setSelectedPin(null)
  }

  const noGroup = user && !profile?.group_id

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-900">
      <header className="h-12 bg-slate-800 flex items-center justify-between px-4 z-[1001] relative shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold text-sm">Activity Map</span>

          <div className="flex gap-1">
            <button
              onClick={() => setFilterGroupId(null)}
              className={`text-xs px-2 py-1 rounded-md transition-colors ${
                filterGroupId === null ? 'bg-white text-slate-800' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => setFilterGroupId(filterGroupId === g.id ? null : g.id)}
                className={`text-xs px-2 py-1 rounded-md transition-colors ${
                  filterGroupId === g.id ? 'text-white' : 'text-slate-400 hover:text-white'
                }`}
                style={filterGroupId === g.id ? { backgroundColor: g.color } : {}}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {profile?.group && (
            <span
              className="text-xs px-2 py-1 rounded-full font-medium"
              style={{ backgroundColor: profile.group.color + '33', color: profile.group.color }}
            >
              {profile.group.name}
            </span>
          )}
          <span className="text-slate-400 text-xs">{user?.email}</span>
          <button
            onClick={signOut}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="flex-1 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-slate-900/50">
            <div className="text-white text-sm">Loading pins…</div>
          </div>
        )}

        {noGroup && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1001] bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-2 rounded-lg shadow">
            Your account isn't linked to a group yet — ask an admin to assign you.
          </div>
        )}

        {profile?.group_id && !draftLocation && !selectedPin && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1001] bg-white/90 text-slate-600 text-xs px-3 py-1.5 rounded-full shadow pointer-events-none">
            Click anywhere on the map to add a pin
          </div>
        )}

        <MapView
          pins={pins}
          draftLocation={draftLocation}
          onMapClick={handleMapClick}
          onPinSelect={handlePinSelect}
          filterGroupId={filterGroupId}
        />

        <SidePanel
          selectedPin={selectedPin}
          draftLocation={draftLocation}
          onPinSubmit={handlePinSubmit}
          onPinCancel={() => setDraftLocation(null)}
          onPinClose={() => setSelectedPin(null)}
          onPinDelete={handlePinDelete}
          currentUserId={user?.id}
        />
      </div>
    </div>
  )
}
