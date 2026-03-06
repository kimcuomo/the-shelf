import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/comments?shelf_item_id=xxx
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const shelf_item_id = req.nextUrl.searchParams.get('shelf_item_id')
  if (!shelf_item_id) return NextResponse.json({ error: 'Missing shelf_item_id' }, { status: 400 })

  const { data, error } = await supabase
    .from('comments')
    .select(`*, author:profiles!comments_user_id_fkey(id, username, avatar_url)`)
    .eq('shelf_item_id', shelf_item_id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Nest replies under their parent
  const top = (data ?? []).filter((c) => !c.parent_id)
  const byParent = (data ?? []).filter((c) => c.parent_id).reduce<Record<string, typeof data>>((acc, c) => {
    if (!acc[c.parent_id]) acc[c.parent_id] = []
    acc[c.parent_id].push(c)
    return acc
  }, {})
  const threaded = top.map((c) => ({ ...c, replies: byParent[c.id] ?? [] }))

  return NextResponse.json({ comments: threaded })
}

// POST /api/comments
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { shelf_item_id, parent_id, body } = await req.json()
  if (!shelf_item_id || !body?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({ shelf_item_id, user_id: user.id, parent_id: parent_id ?? null, body: body.trim() })
    .select(`*, author:profiles!comments_user_id_fkey(id, username, avatar_url)`)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Create notification for the shelf item owner (if not commenting on own item)
  const { data: shelfItem } = await supabase
    .from('shelf_items')
    .select('user_id')
    .eq('id', shelf_item_id)
    .single()

  if (shelfItem && shelfItem.user_id !== user.id) {
    await supabase.from('notifications').insert({
      user_id: shelfItem.user_id,
      actor_id: user.id,
      type: 'comment',
      shelf_item_id,
      comment_id: comment.id,
    })
  }

  // If it's a reply, also notify the parent comment author
  if (parent_id) {
    const { data: parentComment } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', parent_id)
      .single()

    if (parentComment && parentComment.user_id !== user.id && parentComment.user_id !== shelfItem?.user_id) {
      await supabase.from('notifications').insert({
        user_id: parentComment.user_id,
        actor_id: user.id,
        type: 'reply',
        shelf_item_id,
        comment_id: comment.id,
      })
    }
  }

  return NextResponse.json({ comment })
}

// DELETE /api/comments
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
