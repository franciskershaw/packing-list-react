// Hand-written types mirroring packing-list-go's Go structs field-for-field,
// per ADR 002. Each type cites the Go struct/handler it mirrors — verify
// against that source, not this comment, if they ever seem to disagree.

// Mirrors internal/models/category.go's Category (json tags).
export type Category = {
  id: string;
  name: string;
  isSystem: boolean;
};

// Mirrors internal/models/item.go's Item (json tags).
export type Item = {
  id: string;
  name: string;
  categoryId: string;
  isSystem: boolean;
};

// Mirrors internal/models/template.go's TemplateItem (json tags).
export type TemplateItem = {
  itemId: string;
  name: string;
  quantity: number;
  notes: string | null;
};

// Mirrors internal/models/template.go's Template (json tags).
export type Template = {
  id: string;
  name: string;
  description: string | null;
  items: TemplateItem[];
};

// Mirrors internal/models/packing_list.go's PackingListItem (json tags).
export type PackingListItem = {
  itemId: string;
  name: string;
  categoryId: string;
  quantity: number;
  notes: string | null;
  isPacked: boolean;
  sortOrder: number | null;
};

// Mirrors internal/models/packing_list.go's PackingList (json tags).
// Flat Items list — returned by POST /lists and GET /lists.
export type PackingList = {
  id: string;
  name: string;
  eventDate: string | null;
  templateId: string | null;
  items: PackingListItem[];
};

// Mirrors internal/models/packing_list.go's PackingListDetailItem.
export type PackingListDetailItem = {
  itemId: string;
  name: string;
  quantity: number;
  notes: string | null;
  isPacked: boolean;
  sortOrder: number | null;
};

// Mirrors internal/models/packing_list.go's PackingListCategory.
export type PackingListCategory = {
  id: string;
  name: string;
  items: PackingListDetailItem[];
};

// Mirrors internal/models/packing_list.go's PackingListDetail — the
// GET /lists/:id (and PATCH /lists/:id) response shape, items grouped by
// category rather than PackingList's flat Items.
export type PackingListDetail = {
  id: string;
  name: string;
  eventDate: string | null;
  templateId: string | null;
  categories: PackingListCategory[];
};

// Mirrors internal/models/user.go's User (json tags). The full model —
// most responses don't return this shape directly, see UserProfile below.
export type User = {
  id: string;
  googleId: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  createdAt: string;
  lastLoginAt: string;
};

// GET /me's actual response shape (internal/handler/auth_handler.go's
// Me handler builds this by hand — it is NOT models.User's json
// serialization; notably "name" not "displayName", and no googleId/
// createdAt/lastLoginAt). Verified against handler source, not assumed
// from the model.
export type UserProfile = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
};

// The consistent {"error": "message"} shape used by every non-2xx
// response across every handler (verified across category/item/
// template/packing-list/auth handlers).
export type ApiErrorBody = {
  error: string;
};

// Mirrors internal/handler/auth_handler.go's RefreshToken response.
export type RefreshResponse = {
  accessToken: string;
};
