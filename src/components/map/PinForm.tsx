import { useState, useRef } from 'react'
import type { NewPin, NewAttachment, AttachmentType } from '../../types'

interface Props {
  lat: number
  lng: number
  onSubmit: (pin: NewPin) => Promise<void>
  onCancel: () => void
}

const LINK_PATTERN = /^https?:\/\/.+/

function detectType(url: string): AttachmentType {
  if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)) return 'image'
  if (/\.(mp4|webm|mov|avi)$/i.test(url)) return 'video'
  if (/\.(xlsx|xls|csv|pdf|docx|doc)$/i.test(url)) return 'file'
  return 'link'
}

export function PinForm({ lat, lng, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [attachments, setAttachments] = useState<NewAttachment[]>([])
  const [linkUrl, setLinkUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function addLink() {
    if (!LINK_PATTERN.test(linkUrl)) return
    const type = detectType(linkUrl)
    setAttachments((prev) => [...prev, { type, url: linkUrl, name: linkUrl }])
    setLinkUrl('')
  }

  function addFiles(files: FileList | null) {
    if (!files) return
    const newAtts: NewAttachment[] = Array.from(files).map((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
      let type: AttachmentType = 'file'
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) type = 'image'
      else if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) type = 'video'
      return { type, url: '', name: file.name, file }
    })
    setAttachments((prev) => [...prev, ...newAtts])
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setError(null)
    setSaving(true)
    try {
      await onSubmit({ lat, lng, title, description, attachments })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save pin')
    } finally {
      setSaving(false)
    }
  }

  const attachmentIcons: Record<AttachmentType, string> = {
    image: '🖼',
    video: '🎥',
    file: '📄',
    link: '🔗',
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-800">New pin</h2>
        <span className="text-xs text-slate-400">
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 flex-1 overflow-y-auto">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What's happening here?"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Add more details…"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Attachments</label>

          <div className="flex gap-2 mb-2">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Paste a URL or Drive link"
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={addLink}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm px-3 py-2 rounded-lg"
            >
              Add
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,video/*,.xlsx,.xls,.csv,.pdf,.docx,.doc"
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-slate-300 rounded-lg py-2 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
          >
            + Upload files (images, videos, .xlsx…)
          </button>

          {attachments.length > 0 && (
            <ul className="mt-2 space-y-1">
              {attachments.map((att, i) => (
                <li key={i} className="flex items-center gap-2 text-sm bg-slate-50 rounded-lg px-3 py-1">
                  <span>{attachmentIcons[att.type]}</span>
                  <span className="flex-1 truncate text-slate-700">{att.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(i)}
                    className="text-slate-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-2 mt-auto pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-slate-300 text-slate-600 text-sm py-2 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm py-2 rounded-lg font-medium"
          >
            {saving ? 'Saving…' : 'Save pin'}
          </button>
        </div>
      </form>
    </div>
  )
}
