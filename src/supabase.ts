import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fseicixcmdbedspteokg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZWljaXhjbWRiZWRzcHRlb2tnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MjI5ODUsImV4cCI6MjEwMjM5ODk4NX0._7vAmKXoOBAnapNAW2qd3Y4RKiyaWXFB40zJtWwFC-4'
);

export default supabase;