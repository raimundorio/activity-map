export interface Group {
  id: string
  name: string
  description: string | null
  color: string
  created_at: string
}

export interface Profile {
  id: string
  full_name: string | null
  group_id: string | null
  group?: Group
  role: 'admin' | 'member' | 'viewer'
  created_at: string
}

export type AttachmentType = 'image' | 'video' | 'file' | 'link'

export interface Attachment {
  id: string
  pin_id: string
  type: AttachmentType
  url: string
  name: string
  created_at: string
}

export interface Pin {
  id: string
  lat: number
  lng: number
  title: string
  description: string | null
  group_id: string
  user_id: string
  group?: Group
  profile?: Profile
  attachments?: Attachment[]
  created_at: string
}

export interface NewPin {
  lat: number
  lng: number
  title: string
  description: string
  attachments: NewAttachment[]
}

export interface NewAttachment {
  type: AttachmentType
  url: string
  name: string
  file?: File
}
