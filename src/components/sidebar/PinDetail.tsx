import type { Pin, Attachment } from '../../types'

interface Props {
  pin: Pin
  onClose: () => void
  onDelete?: (id: string) => void
  currentUserId?: string
}

function AttachmentRow({ att }: { att: Attachment }) {
  if (att.type === 'image') {
    return (
      <div className="rounded-lg overflow-hidden">
        <img src={att.url} alt={att.name} className="w-full object-cover max-h-48" />
      </div>
    )
  }

  if (att.type === 'video') {
    return (
      <video controls className="w-full rounded-lg max-h-48">
        <source src={att.url} />
      </video>
    )
  }

  return (
    <a
      href={att.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm text-blue-700 transition-colors"
    >
      <span>{att.type === 'file' ? '📄' : '🔗'}</span>
      <span className="flex-1 truncate">{att.name}</span>
      <span className="text-slate-400 text-xs">↗</span>
    </a>
  )
}

export function PinDetail({ pin, onClose, onDelete, currentUserId }: Props) {
  const canDelete = currentUserId === pin.user_id

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-start justify-between p-4 border-b border-slate-100">
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-slate-800 text-base leading-tight">{pin.title}</h2>
          {pin.group && (
            <span
              className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: pin.group.color + '22', color: pin.group.color }}
            >
              {pin.group.name}
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 ml-2 text-xl leading-none">
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {pin.description && (
          <p className="text-sm text-slate-600 leading-relaxed">{pin.description}</p>
        )}

        <div className="text-xs text-slate-400 flex items-center gap-1">
          <span>📍</span>
          <span>{pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}</span>
        </div>

        {pin.profile && (
          <div className="text-xs text-slate-500">
            Posted by <span className="font-medium">{pin.profile.full_name ?? 'Unknown'}</span>
            {' · '}
            {new Date(pin.created_at).toLocaleDateString()}
          </div>
        )}

        {pin.attachments && pin.attachments.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Attachments</p>
            {pin.attachments.map((att) => (
              <AttachmentRow key={att.id} att={att} />
            ))}
          </div>
        )}
      </div>

      {canDelete && onDelete && (
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => onDelete(pin.id)}
            className="w-full text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg py-2 transition-colors"
          >
            Delete pin
          </button>
        </div>
      )}
    </div>
  )
}
