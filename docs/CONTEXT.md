# Request A Treat — Project Context
**Cassie's Dessert Order Website**
*Last updated: 2026-03-29*

---

## What This Is

A colorful dessert ordering site for Cassie's invited guests. Guests log in with a shared password, pick a treat, choose a delivery date, and submit. Cassie manages everything from Baker View — including menu items, orders, photos, and guest suggestions.

**No backend server.** All database calls go directly from the browser to Supabase via the JS CDN client. Railway serves the static files using `serve`.

**Live URL:** cassieproject-production.up.railway.app
**GitHub:** github.com/mitch-coluzzi/CassieProject

---

## File Map

```
index.html              ← HTML shell: 7 screen containers, 2 modals, canvas, script tags
css/styles.css          ← Full design system (colors, pup images, doggies, badges, responsive)
js/config.js            ← Supabase client, loadMenu(), date helpers, getPupImage(), showScreen()
js/app.js               ← Boot: await loadMenu(), init login, wire modals
js/login.js             ← Password screen (secret: "treats", case-insensitive)
js/names.js             ← User dropdown from DB, active-order check, pup on already-ordered
js/order.js             ← Menu grid with badges, calendar, destination, submit, recipe modal
js/calendar.js          ← Custom month calendar widget (reused in order + baker)
js/baker.js             ← Admin view (password: "swimfast12", case-insensitive)
js/photos.js            ← Photo upload/gallery (guests) + suggestions + baker review
js/confetti.js          ← Celebration animation on order submit
images/                 ← Pup images (pup-password, pup-baker, pup-cake, pup-cupcake, pup-banana)
setup.sql               ← Full schema + seed data (reference only — already run)
migrate-v2.sql          ← menu_items + suggestions tables
migrate-v3.sql          ← badge column on menu_items
migrate-v4.sql          ← 'completed' order status
migrate-v5.sql          ← recipe_url column on menu_items
package.json            ← Railway deploy: "serve" static server
docs/CONTEXT.md         ← This file
```

---

## Design System (css/styles.css)

### Colors — CSS custom properties at top of file
```css
--yellow:  #FFD93D      /* accents, confetti */
--orange:  #FF6B35      /* primary buttons, selections, highlights */
--pink:    #FF6B9D      /* secondary buttons, errors */
--white:   #FFFFFF      /* card backgrounds */
--cream:   #FFF8F0      /* page background */
--gray:    #E8E0D8      /* borders, disabled */
--text:    #3D2C2C      /* body text */
--purple:  #C77DFF      /* Baker View accent */
```

### Fonts (Google Fonts, loaded in index.html)
- **Pacifico** — headings (bakery feel)
- **Nunito** — body text (friendly, rounded)

### Visual Elements
- Pup images on login, name selection, order confirmation, and already-ordered screens
- Bouncing doggie emojis fixed-positioned around the site edges
- NEW (pulsing orange) and BE THE FIRST (pink) badges on menu cards
- Confetti animation on order submission
- Soft rounded corners, card-based layout, scale-on-hover buttons
- Mobile breakpoints at 768px and 480px

---

## Supabase Schema

**Project:** idsqxlnwyactzckrhlov.supabase.co
**Auth:** Anon public key in js/config.js (RLS open on all tables)

### users
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, auto-generated |
| display_name | text | e.g. "Di S", "Paw Paw" |
| has_active_order | boolean | default false, set true on order |
| created_at | timestamptz | auto |

**Seeded:** Di S, Paw Paw, Gracie V, Grace C, Nicole W, James F, Dad, Mom, Celeste R, Connor W, Jen B

### orders
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → users.id |
| treat | text | matches menu_items.name |
| pickup_date | date | Mon–Thu only |
| destination | text | 'office' or 'home' |
| status | text | 'active', 'cancelled', or 'completed' |
| created_at | timestamptz | auto |

### blocked_dates
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| date | date | the blocked day |
| blocked_by_week | boolean | if true, blocks entire Mon–Thu of that week |
| created_at | timestamptz | auto |

### menu_items
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | text | unique, displayed to guests |
| emoji | text | shown on cards and orders |
| description | text | fun description for recipe modal |
| lead_days | integer | 0 = same day, 5/7 = advance notice required |
| ingredients | text[] | Postgres array of strings |
| recipe_url | text | optional link to source recipe |
| sort_order | integer | controls display sequence |
| badge | text | 'auto', 'new', 'first', or 'none' |
| active | boolean | false = hidden from guests |
| created_at | timestamptz | auto |

### photos
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| filename | text | path in storage bucket |
| status | text | 'pending' or 'approved' |
| created_at | timestamptz | auto |

**Storage bucket:** `treat-photos` (public, JPEG/PNG, 5MB max)

### suggestions
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_name | text | who suggested it |
| suggestion | text | what they want baked |
| created_at | timestamptz | auto |

---

## Menu System

Menu items are stored in the `menu_items` table and loaded at boot via `loadMenu()`. The global `MENU` array is populated before any screen renders.

**Badge logic (order.js):**
- `badge = 'new'` → always shows NEW badge (pulsing orange)
- `badge = 'first'` → always shows BE THE FIRST badge (pink)
- `badge = 'none'` → no badge
- `badge = 'auto'` → NEW if created within 14 days, BE THE FIRST if never ordered

Menu cards sort: NEW first, BE THE FIRST second, everything else after.

**Pup image mapping (config.js → getPupImage):**
- Muffins → pup-cupcake.png
- Cake → pup-cake.png
- Banana/Pumpkin/Pie → pup-banana.png

---

## Ordering Rules (enforced in JS)

1. **Delivery days:** Mon–Thu only (Fri/Sat/Sun disabled on calendar)
2. **One order per week:** If any active order exists in the target week, that week is blocked
3. **One order per user:** If `has_active_order = true`, user sees "already ordered" screen with pup
4. **Lead time:** Earliest date = today + leadDays, rounded forward past weekends
5. **Blocked dates:** Baker can block individual days or whole weeks

---

## User Flow

```
Login ("treats" + pup-password) → Pick Name (pup-baker) → Order Form → Confetti + Pup Confirm
                                                              ↑
                                                    (if has_active_order → "Already Ordered" + pup)
                                                              ↓
                                                    Gallery & Suggestions (accessible from all screens)
```

## Baker Flow

```
Footer link → Password ("swimfast12") → Baker Dashboard
  ├── Order Calendar (click chip → complete or cancel)
  ├── Active Orders table (Done / Cancel buttons per row)
  ├── Menu Items (edit, add, hide/show, emoji picker, badge toggle, recipe URL)
  ├── Add Guest form
  ├── Photo Review (approve/delete pending, manage approved)
  └── Suggestion Box (view and dismiss guest suggestions)
```

---

## Deployment

- **Live:** cassieproject-production.up.railway.app
- **Hosting:** Railway (auto-deploy from GitHub `main` branch)
- **Static server:** `serve` via package.json
- **Database:** Supabase (free tier, no backend needed)
- **Repo:** github.com/mitch-coluzzi/CassieProject
- **Push:** `git push` from Windows PowerShell (WSL can't push)

---

## How Modules Connect

```
app.js (boot)
  └── await loadMenu()  ← fetches menu_items from Supabase
  └── Login.init()
        └── Names.init()
              ├── [has_active_order] → Already Ordered screen (+ pup + gallery link)
              └── Order.init()
                    ├── Calendar.init() (date picker with lead time blocking)
                    ├── openRecipe() → recipe modal (+ recipe URL link)
                    ├── Photos.showGalleryScreen() (gallery + suggestions)
                    └── submitOrder()
                          ├── Confetti.fire()
                          └── pup confirm screen (+ gallery link)

Baker.promptPassword()
  └── loadBakerView()
        ├── renderBakerCalendar() (complete/cancel orders, block/unblock dates)
        ├── renderOrdersTable() (Done/Cancel per row)
        ├── renderMenuManager() (edit/add/toggle items, emoji picker, badge, recipe URL)
        ├── bindAddUser()
        ├── Photos.renderBakerPhotos() (approve/delete)
        └── Photos.renderBakerSuggestions() (view/dismiss)
```

All modules are IIFEs exposing public methods on global objects (Login, Names, Order, Calendar, Baker, Photos, Confetti).
