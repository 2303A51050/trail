Supabase backend setup (local frontend integration)

This project ships static frontend files. The `js/supabaseClient.js` and `js/cartManager.js` helpers provide a lightweight way to use Supabase as your backend for products, auth, and cart.

**Important: supabase-config.js is NOT committed to the repo for security. You must create it locally.**

Steps to set up Supabase and connect the frontend

0) **Create local Supabase config (IMPORTANT)**
   - Copy `supabase-config.example.js` to `supabase-config.js` in the project root.
   - Edit `supabase-config.js` and fill in your Supabase Project URL and anon key (see step 1 below).
   - **DO NOT commit `supabase-config.js` to git** — it contains your API keys. It's in `.gitignore`.
   - If you forgot to exclude it, remove it from git history: `git rm --cached supabase-config.js`

1) Create a Supabase project
   - Go to https://app.supabase.com and create a new project.
   - Note the Project URL and anon/public API key (Settings → API).

2) Run the SQL schema
   - Open the Supabase project, go to SQL Editor → New Query.
   - Copy the contents of `supabase/create_tables.sql` and run it. This creates `products`, `users`, `cart`, and `orders` tables and inserts a few sample products.

3) Add a client config file
   - Copy `supabase-config.example.js` to `supabase-config.js`.
   - Fill in `window.SUPABASE_URL` and `window.SUPABASE_ANON_KEY` from your Supabase project settings.
   - Example:

     ```javascript
     // supabase-config.js (NEVER commit this file)
     window.SUPABASE_URL = "https://your-project-ref.supabase.co";
     window.SUPABASE_ANON_KEY = "eyJhbGc...your-key...";
     ```

4) Include scripts on pages
   - Add the config and client scripts to pages that need Supabase integration (before other scripts that call them):

     ```html
     <script src="/supabase-config.js"></script>
     <script type="module" src="/js/supabaseClient.js"></script>
     ```

   - Example pages: `index.html`, `clothing.html`, `accessories.html`, `cart.html`.

5) Features wired to Supabase
   - **Products** (`content.js`): loads clothing and accessories from the `products` table.
   - **Auth** (`js/LOGIN.JS`): sign-up/sign-in using Supabase Auth REST endpoints; stores session in localStorage.
   - **Cart** (`js/cart-loader.js` + `js/cartManager.js`): read/write cart items from the `cart` table; fetch product details to display.

6) Security notes
   - The anon key is public but still tied to the policies you configure in Supabase. For production, enable Row Level Security (RLS) and write policies to protect sensitive operations.
   - For authentication flows, prefer Supabase Auth (see Supabase docs).
   - `.gitignore` already excludes `supabase-config.js` — do not remove this entry.
