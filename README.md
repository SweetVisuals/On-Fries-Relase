<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1-CiQ98vBMw-kuAimzz2D5tSjSl7KJGYi

## Run Locally

**Prerequisites:**  Node.js, Supabase account


1. Install dependencies:
   `npm install`
2. Set up Supabase:
   - Create a new Supabase project at https://supabase.com
   - Go to Settings > API to get your project URL and anon key
   - Go to Settings > API > Service Role to get your service role key
3. Configure environment variables in [.env.local](.env.local):
   - Set `GEMINI_API_KEY` to your Gemini API key
   - Set `VITE_SUPABASE_URL` to your Supabase project URL
   - Set `VITE_SUPABASE_ANON_KEY` to your Supabase anon key
   - Set `SUPABASE_SERVICE_ROLE_KEY` to your Supabase service role key
4. Set up the database:
   - Run the SQL commands from [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) in your Supabase SQL editor
5. Create the admin account:
   `npm run create-admin`
6. Run the app:
   `npm run dev`

## Admin Login

Use these credentials to log in as admin:
- Username: `admin` (no @ symbol required)
- Password: `admin123`
