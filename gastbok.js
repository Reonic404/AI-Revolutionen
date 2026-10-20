const SUPABASE_URL = 'https://tprwplwiwmxqxgujlvny.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwcndwbHdpd214cXhndWpsdm55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzNjg0MjMsImV4cCI6MjEwNjk0NDQyM30.f8w1MVvAA8CLmDYXPVZ8FhHab8o4aYf0qfbiPuWgBoE';

// Create a single supabase client for interacting with your database
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);