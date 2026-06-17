import { useEffect, useState, useCallback } from 'react'
import { supabase, uploadFile } from '../lib/supabase'
import type { Pin, NewPin } from '../types'

export function usePins() {
  const [pins, setPins] = useState<Pin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPins = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('pins')
      .select('*, group:groups(*), profile:profiles(*, group:groups(*)), attachments(*)')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setPins(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPins()

    const channel = supabase
      .channel('pins-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pins' }, fetchPins)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchPins])

  async function createPin(newPin: NewPin, userId: string, groupId: string) {
    const { data: pin, error: pinError } = await supabase
      .from('pins')
      .insert({
        lat: newPin.lat,
        lng: newPin.lng,
        title: newPin.title,
        description: newPin.description || null,
        user_id: userId,
        group_id: groupId,
      })
      .select()
      .single()

    if (pinError) throw pinError

    for (const att of newPin.attachments) {
      let url = att.url

      if (att.file) {
        const ext = att.file.name.split('.').pop()
        const path = `${userId}/${pin.id}/${Date.now()}.${ext}`
        url = await uploadFile('pin-attachments', path, att.file)
      }

      const { error: attError } = await supabase.from('attachments').insert({
        pin_id: pin.id,
        type: att.type,
        url,
        name: att.name,
      })
      if (attError) throw attError
    }

    await fetchPins()
    return pin
  }

  async function deletePin(pinId: string) {
    const { error } = await supabase.from('pins').delete().eq('id', pinId)
    if (error) throw error
    setPins((prev) => prev.filter((p) => p.id !== pinId))
  }

  return { pins, loading, error, createPin, deletePin, refetch: fetchPins }
}
