import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Group, Profile } from '../types'

export function useAdmin() {
  const [users, setUsers] = useState<Profile[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*, group:groups(*)')
      .order('created_at', { ascending: true })
    setUsers(data ?? [])
  }, [])

  const fetchGroups = useCallback(async () => {
    const { data } = await supabase.from('groups').select('*').order('name')
    setGroups(data ?? [])
  }, [])

  useEffect(() => {
    Promise.all([fetchUsers(), fetchGroups()]).finally(() => setLoading(false))
  }, [fetchUsers, fetchGroups])

  async function updateUserGroup(userId: string, groupId: string | null) {
    const { error } = await supabase
      .from('profiles')
      .update({ group_id: groupId })
      .eq('id', userId)
    if (error) throw error
    await fetchUsers()
  }

  async function updateUserRole(userId: string, role: 'admin' | 'member' | 'viewer') {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
    if (error) throw error
    await fetchUsers()
  }

  return { users, groups, loading, updateUserGroup, updateUserRole }
}
