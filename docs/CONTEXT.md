# Request A Treat — Project Context
**Cassie's Dessert Order Website**
*Last updated: 2026-03-29*

---

## What This Is

A colorful dessert ordering site for Cassie's invited guests. Guests log in with a shared password, pick a treat, choose a delivery date, and submit. Cassie manages everything from Baker View. Photos can be uploaded by guests and approved by the baker.

**No backend server.** All database calls go directly from the browser to Supabase via the JS CDN client. Railway serves the static files using `serve`.

---

## File Map

```
index.html              ← HTML shell: 6 screen containers, modal, canvas, script tags
css/styles.css          ← Full design system (edit colors, fonts, spacing here)
js/config.js            ← Supabase keys, MENU data, date helpers, showScreen()
js/app.js               ← Boot: inits login, wires baker link + modal close
js/login.js             ← Password screen (secret: "treats", case-insensitive)
js/names.js             ← User dropdown from DB, active-order check
js/order.js             ← Menu grid, calendar, destination picker, order submit
js/calendar.js          ← Custom month calendar widget (reused in order + baker)
js/baker.js             ← Admin view (password: "swimfast12", case-insensitive)
js/photos.js            ← Photo upload (guests) + approval (baker)
js/confetti.js          ← Celebration animation on order submit
setup.sql               ← Schema + seed data (already run in Supabase)
package.json            ← Railway deploy: "serve" static server
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

### Cassie Design Notes
- To change colors: edit the `:root` block at the top of `styles.css`
- To add stickers/decals: add `<img>` tags in the screen HTML (login.js, order.js, etc.) and position with CSS
- Cards use `border-radius: 20px`, shadows, and scale-on-hover
- Mobile breakpoints at 768px and 480px
- Emoji used throughout as visual icons

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
| treat | text | must match a MENU item name |
| pickup_date | date | Mon–Thu only |
| destination | text | 'office' or 'home' |
| status | text | 'active' or 'cancelled' |
| created_at | timestamptz | auto |

### blocked_dates
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| date | date | the blocked day |
| blocked_by_week | boolean | if true, blocks entire Mon–Thu of that week |
| created_at | timestamptz | auto |

### photos
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| filename | text | path in storage bucket |
| status | text | 'pending' or 'approved' |
| created_at | timestamptz | auto |

**Storage bucket:** `treat-photos` (public, JPEG/PNG, 5MB max)

---

## Menu (js/config.js → MENU array)

| Treat | Emoji | Lead Days |
|-------|-------|-----------|
| Banana Cream Pie | 🍌 | 7 |
| Pumpkin Pie | 🎃 | 5 |
| Banana Bread | 🍞 | 7 |
| Pumpkin Muffins | 🧁 | 5 |
| Chocolate Muffins | 🍫 | 0 |
| Chocolate Cake | 🎂 | 0 |
| Vanilla Cake | 🍰 | 0 |

Each item has: name, emoji, leadDays, description, ingredients array.
To add/remove/edit treats: modify the MENU array in `js/config.js`.

---

## Ordering Rules (enforced in JS)

1. **Delivery days:** Mon–Thu only (Fri/Sat/Sun disabled on calendar)
2. **One order per week:** If any active order exists in the target week, that week is blocked
3. **One order per user:** If `has_active_order = true`, user sees "already ordered" screen
4. **Lead time:** Earliest date = today + leadDays, rounded forward past weekends
5. **Blocked dates:** Baker can block individual days or whole weeks

---

## User Flow

```
Login ("treats") → Pick Name → Order Form → Celebrate + Confetti + Gallery
                                  ↑
                          (if has_active_order → "Already Ordered" screen)
```

## Baker Flow

```
Footer link → Password ("swimfast12") → Baker Dashboard
  ├── Order Calendar (click order chip to cancel)
  ├── Block/Unblock dates (click empty day)
  ├── Active Orders table
  ├── Photo Review (approve/delete pending, manage approved)
  └── Add Guest form
```

---

## Deployment

- **Hosting:** Railway (auto-deploy from GitHub `main` branch)
- **Static server:** `serve` via package.json
- **Database:** Supabase (free tier, no backend needed)
- **Push:** `git push` from Windows (WSL can't push)

---

## How Modules Connect

```
app.js (boot)
  └── Login.init()
        └── Names.init()
              ├── [has_active_order] → Already Ordered screen
              └── Order.init()
                    ├── Calendar.init() (date picker)
                    ├── openRecipe() → recipe modal
                    └── submitOrder()
                          ├── Confetti.fire()
                          └── Photos.renderGallery()

Baker.promptPassword()
  └── loadBakerView()
        ├── renderBakerCalendar()
        ├── renderOrdersTable()
        ├── bindAddUser()
        └── Photos.renderBakerPhotos()
```

All modules are IIFEs (immediately-invoked function expressions) exposing public methods on a global object (Login, Names, Order, Calendar, Baker, Photos, Confetti).
