
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rvxuoabvgboihnaqjcst.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2eHVvYWJ2Z2JvaWhuYXFqY3N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDYyOTUsImV4cCI6MjA4NjIyMjI5NX0.4ZWhwJsE7t0CX33Zqy99XvkCD-wbaRluSBUWIfPyiPU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
