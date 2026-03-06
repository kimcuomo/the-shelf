export type Profile = {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  is_admin: boolean
  is_private: boolean
  wishlist_private: boolean
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

export type Comment = {
  id: string
  shelf_item_id: string
  user_id: string
  parent_id: string | null
  body: string
  created_at: string
  author?: Pick<Profile, 'id' | 'username' | 'avatar_url'>
  replies?: Comment[]
}

export type Notification = {
  id: string
  user_id: string
  actor_id: string
  type: 'follow' | 'save' | 'comment' | 'reply'
  shelf_item_id: string | null
  comment_id: string | null
  read_at: string | null
  created_at: string
  actor?: Pick<Profile, 'id' | 'username' | 'avatar_url'>
  shelf_item?: Pick<ShelfItem, 'id'> & { product?: Pick<Product, 'id' | 'name' | 'image_url'> }
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
