import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ProductInput } from '@/lib/types'

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { product, status, rating, notes, variantTitles, savedFromUserId } = await request.json() as {
    product: ProductInput
    status: 'using' | 'wishlist'
    rating: number | null
    notes: string | null
    variantTitles: string[]
    savedFromUserId: string | null
  }

  let productId = product.id

  // If no DB id, find or create the product
  if (!productId) {
    if (product.externalId) {
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('external_id', product.externalId)
        .maybeSingle()

      if (existing) {
        productId = existing.id
      }
    }

    if (!productId) {
      const { data: created, error: createError } = await supabase
        .from('products')
        .insert({
          name: product.name,
          brand: product.brand ?? null,
          category: product.category ?? null,
          description: product.description ?? null,
          image_url: product.imageUrl ?? null,
          ingredients: product.ingredients ?? null,
          buy_link: product.buyLink ?? null,
          external_id: product.externalId ?? null,
          source: 'api',
          status: 'approved',
        })
        .select('id')
        .single()

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 })
      }

      productId = created.id
    }
  }

  // Get profile id
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const { error: shelfError } = await supabase
    .from('shelf_items')
    .upsert(
      {
        user_id: user.id,
        product_id: productId,
        status,
        rating,
        notes,
        variant_titles: variantTitles ?? [],
        saved_from_user_id: savedFromUserId ?? null,
      },
      { onConflict: 'user_id,product_id' }
    )

  if (shelfError) {
    return NextResponse.json({ error: shelfError.message }, { status: 500 })
  }

  // Notify the user whose shelf item was saved
  if (savedFromUserId && savedFromUserId !== user.id) {
    const { data: savedItem } = await supabase
      .from('shelf_items')
      .select('id')
      .eq('user_id', savedFromUserId)
      .eq('product_id', productId)
      .maybeSingle()

    await supabase.from('notifications').insert({
      user_id: savedFromUserId,
      actor_id: user.id,
      type: 'save',
      shelf_item_id: savedItem?.id ?? null,
    })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await request.json()

  const { error } = await supabase
    .from('shelf_items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, status, rating, notes, variant_titles } = await request.json()

  const { error } = await supabase
    .from('shelf_items')
    .update({ status, rating, notes, variant_titles: variant_titles ?? [] })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
