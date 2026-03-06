import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/follows — follow a user
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { following_id } = await req.json()
  if (!following_id || following_id === user.id) {
    return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  }

  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: user.id, following_id })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify the followed user
  await supabase.from('notifications').insert({
    user_id: following_id,
    actor_id: user.id,
    type: 'follow',
  })

  return NextResponse.json({ ok: true })
}

// DELETE /api/follows — unfollow a user
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { following_id } = await req.json()

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', following_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
