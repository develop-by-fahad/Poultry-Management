
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1';

const supabaseUrl = 'https://lerxqtghpbqldavcmtns.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlcnhxdGdocGJxbGRhdmNtdG5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MTIyMTYsImV4cCI6MjA4NjI4ODIxNn0.OaBe__mytHQBhO14CdnMkAxgxPJfVCWo9CR4ikGB5F0';

export const supabase = createClient(supabaseUrl, supabaseKey);
