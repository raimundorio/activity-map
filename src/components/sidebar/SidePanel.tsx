import type { Pin, NewPin } from '../../types'
import { PinDetail } from './PinDetail'
import { PinForm } from '../map/PinForm'

interface Props {
  selectedPin: Pin | null
  draftLocation: { lat: number; lng: number } | null
  onPinSubmit: (pin: NewPin) => Promise<void>
  onPinCancel: () => void
  onPinClose: () => void
  onPinDelete: (id: string) => void
  currentUserId?: string
}

export function SidePanel({
  selectedPin,
  draftLocation,
  onPinSubmit,
  onPinCancel,
  onPinClose,
  onPinDelete,
  currentUserId,
}: Props) {
  const isVisible = selectedPin !== null || draftLocation !== null

  return (
    <div
      className={`
        absolute top-0 right-0 h-full w-80 bg-white shadow-2xl z-[1000]
        transition-transform duration-300
        ${isVisible ? 'translate-x-0' : 'translate-x-full'}
      `}
    >
      {draftLocation && !selectedPin && (
        <PinForm
          lat={draftLocation.lat}
          lng={draftLocation.lng}
          onSubmit={onPinSubmit}
          onCancel={onPinCancel}
        />
      )}

      {selectedPin && (
        <PinDetail
          pin={selectedPin}
          onClose={onPinClose}
          onDelete={onPinDelete}
          currentUserId={currentUserId}
        />
      )}
    </div>
  )
}
