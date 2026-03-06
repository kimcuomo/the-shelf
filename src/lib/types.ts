export type Profile = {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  is_admin: boolean
  created_at: string
}

export type Product = {
  id: string
  name: string
  brand: string | null
  category: string | null
  description: string | null
  image_url: string | null
  ingredients: string | null
  buy_link: string | null
  external_id: string | null
  source: 'api' | 'user_submitted'
  status: 'pending' | 'approved' | 'rejected'
  submitted_by: string | null
  created_at: string
}

export type ShelfItem = {
  id: string
  user_id: string
  product_id: string
  status: 'using' | 'wishlist'
  rating: number | null
  notes: string | null
  variant_titles: string[]
  saved_from_user_id: string | null
  created_at: string
  product?: Product
  saved_from_user?: Pick<Profile, 'id' | 'username'>
}

export type Follow = {
  follower_id: string
  following_id: string
  created_at: string
}

// Used when adding a product to shelf (may or may not exist in DB yet)
export type ProductInput = {
  id?: string
  externalId?: string
  name: string
  brand?: string
  category?: string
  description?: string
  imageUrl?: string
  ingredients?: string
  buyLink?: string
  variants?: Array<{ id: number; title: string; price?: string }>
}
