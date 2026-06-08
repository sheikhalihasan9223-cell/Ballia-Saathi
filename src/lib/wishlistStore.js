// Centralized wishlist query — fetch once, share everywhere via React Query cache
export const WISHLIST_QUERY_KEY = (email) => ['wishlist-all', email];