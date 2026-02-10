
import * as React from 'react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Package, 
  History, 
  Bird, 
  Plus, 
  BrainCircuit,
  LogOut,
  ChevronRight,
  TrendingDown,
  AlertTriangle,
  Scale,
  X,
  Loader2,
  RefreshCcw,
  Database,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  UserPlus,
  LogIn,
  User,
  Clock,
  Settings,
  ShieldCheck,
  Camera,
  Upload,
  WifiOff,
  DatabaseBackup,
  Skull,
  UtensilsCrossed
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area
} from 'recharts';
import { FarmState, TransactionType, Category, Transaction, FlockRecord, InventoryItem, WeightLog, MortalityLog, FeedLog } from './types';
import { getFarmInsights } from './services/geminiService';
import { supabase } from './lib/supabase';

const CATEGORY_NAMES: Record<Category, string> = {
  [Category.FEED]: 'খাদ্য (ফিড)',
  [Category.MEDICINE]: 'ওষুধ',
  [Category.CHICKEN_PURCHASE]: 'মুরগি ক্রয়',
  [Category.SALES]: 'বিক্রয়',
  [Category.UTILITIES]: 'ইউটিলিটি',
  [Category.LABOR]: 'শ্রমিক খরচ',
  [Category.OTHER]: 'অন্যান্য'
};

const TAB_NAMES = {
  dashboard: 'ড্যাশবোর্ড',
  flocks: 'মুরগির ব্যবস্থাপনা',
  transactions: 'আর্থিক হিসাব',
  inventory: 'ইনভেন্টরি',
  ai: 'এআই পরামর্শ',
  profile: 'প্রোফাইল সেটিিংস'
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// --- AUTH COMPONENT ---
const Auth: React.FC<{ onAuthSuccess: () => void, onEnterLocalMode: () => void, serverError?: string | null }> = ({ onAuthSuccess, onEnterLocalMode, serverError }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string, type: 'limit' | 'fetch' | 'other' } | null>(null);

  useEffect(() => {
    if (serverError) {
      setError({ message: serverError, type: 'fetch' });
    }
  }, [serverError]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: name,
              gender: gender,
              avatar_url: null
            }
          }
        });
        if (error) throw error;
      }
      onAuthSuccess();
    } catch (err: any) {
      const msg = err.message?.toLowerCase() || '';
      if (msg.includes('failed to fetch') || msg.includes('network')) {
        setError({ 
          message: 'সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না। আপনার ইন্টারনেট চেক করুন অথবা লোকাল মোডে খামার ম্যানেজ করুন।', 
          type: 'fetch' 
        });
      } else if (msg.includes('rate limit')) {
        setError({ message: 'অতিরিক্ত বার চেষ্টা করা হয়েছে। দয়া করে কিছুক্ষণ পর পুনরায় চেষ্টা করুন।', type: 'limit' });
      } else {
        setError({ message: err.message || 'লগইন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।', type: 'other' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-['Hind_Siliguri',_sans-serif]">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
            <Bird size={32} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">
          {isLogin ? 'পোল্ট্রিপ্রো-তে লগইন করুন' : 'নতুন একাউন্ট খুলুন'}
        </h2>
        
        {error && (
          <div className={`p-4 rounded-2xl text-sm mb-6 flex items-start gap-3 border shadow-sm ${error.type === 'fetch' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
            <AlertCircle size={20} className="shrink-0 mt-1" />
            <div className="flex-1">
              <span className="font-bold block mb-1">{error.type === 'fetch' ? 'কানেকশন এরর' : 'সমস্যা'}</span>
              <span>{error.message}</span>
              {error.type === 'fetch' && (
                <button onClick={onEnterLocalMode} className="mt-2 block font-black underline hover:text-blue-900 transition-colors">লোকাল মোডে প্রবেশ করুন (অফলাইন)</button>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">আপনার নাম</label>
                <input required type="text" className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">লিঙ্গ</label>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setGender('male')} className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all ${gender === 'male' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-500'}`}>পুরুষ</button>
                  <button type="button" onClick={() => setGender('female')} className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all ${gender === 'female' ? 'bg-pink-50 border-pink-500 text-pink-700' : 'bg-white border-slate-200 text-slate-500'}`}>মহিলা</button>
                </div>
              </div>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase ml-1">ইমেইল</label>
            <input required type="email" className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase ml-1">পাসওয়ার্ড</label>
            <input required type="password" minLength={6} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          <button disabled={loading} type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
            {isLogin ? 'লগইন করুন' : 'একাউন্ট তৈরি করুন'}
          </button>
        </form>

        <div className="mt-8 text-center space-y-4">
          <button onClick={() => { setIsLogin(!isLogin); setError(null); }} className="text-emerald-600 text-sm font-bold hover:underline block w-full">
            {isLogin ? 'নতুন একাউন্ট নেই? এখানে ক্লিক করুন' : 'ইতিমধ্যে একাউন্ট আছে? লগইন করুন'}
          </button>
          <div className="pt-4 border-t border-slate-100">
            <button onClick={onEnterLocalMode} className="text-slate-400 text-xs font-bold hover:text-slate-600">লগইন ছাড়াই ব্যবহার করুন (লোকাল মোড)</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- PROFILE VIEW COMPONENT ---
const ProfileView: React.FC<{ profile: { name: string, gender: string, email: string, avatar_url: string | null }, onUpdate: (updates: { name: string, gender: string, avatar_url: string | null }) => Promise<void> }> = ({ profile, onUpdate }) => {
  const [name, setName] = useState(profile.name);
  const [gender, setGender] = useState<'male' | 'female'>(profile.gender as 'male' | 'female');
  const [avatar, setAvatar] = useState<string | null>(profile.avatar_url);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await blobToBase64(file);
        setAvatar(base64);
      } catch (err) {
        setMessage({ text: 'ছবি আপলোড করতে সমস্যা হয়েছে।', type: 'error' });
      }
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage(null);
    try {
      await onUpdate({ name, gender, avatar_url: avatar });
      setMessage({ text: 'প্রোফাইল সফলভাবে আপডেট করা হয়েছে!', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'আপডেট করতে সমস্যা হয়েছে।', type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500 font-['Hind_Siliguri',_sans-serif]">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white relative">
           <h3 className="text-2xl font-bold mb-1">প্রোফাইল সেটিংস</h3>
           <p className="text-emerald-100 text-sm">আপনার ব্যক্তিগত তথ্য এবং ছবি পরিবর্তন করুন</p>
        </div>
        
        <div className="p-8">
          {message && (
            <div className={`p-4 rounded-2xl text-sm mb-6 flex items-center gap-3 border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
              <span className="font-bold">{message.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="flex flex-col items-center mb-8">
              <div className="relative group">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-32 h-32 rounded-full border-4 shadow-xl overflow-hidden cursor-pointer transition-all hover:opacity-90 ${gender === 'female' ? 'border-pink-200 bg-pink-50' : 'border-emerald-200 bg-emerald-50'}`}
                >
                  {avatar ? (
                    <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-black text-slate-300">
                      {name.charAt(0)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full text-white text-[10px] font-bold">
                    <Camera size={24} className="mb-1" />
                    ছবি পরিবর্তন
                  </div>
                </div>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
              <p className="text-slate-400 text-xs mt-3 font-medium">ছবি আপলোড করতে ক্লিক করুন</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">আপনার নাম</label>
              <input required type="text" className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">লিঙ্গ</label>
              <div className="flex gap-4">
                <button type="button" onClick={() => setGender('male')} className={`flex-1 py-4 rounded-2xl border font-black text-sm transition-all ${gender === 'male' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm shadow-emerald-100' : 'bg-white border-slate-200 text-slate-500'}`}>পুরুষ</button>
                <button type="button" onClick={() => setGender('female')} className={`flex-1 py-4 rounded-2xl border font-black text-sm transition-all ${gender === 'female' ? 'bg-pink-50 border-pink-500 text-pink-700 shadow-sm shadow-pink-100' : 'bg-white border-slate-200 text-slate-500'}`}>মহিলা</button>
              </div>
            </div>

            <button disabled={isUpdating} type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-xl flex items-center justify-center gap-2">
              {isUpdating ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
              সংরক্ষণ করুন
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [localMode, setLocalMode] = useState(false);
  const [userProfile, setUserProfile] = useState<{ name: string, gender: string, email: string, avatar_url: string | null } | null>(null);
  const [farmData, setFarmData] = useState<FarmState>({
    transactions: [],
    flocks: [],
    inventory: []
  });
  const [activeTab, setActiveTab] = useState<keyof typeof TAB_NAMES>('dashboard');
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<{ text: string, type: 'fetch' | 'other' } | null>(null);

  // User-specific storage key to prevent data leakage between accounts
  const getStorageKey = (userId: string) => `poultrypro_data_${userId}`;

  const loadLocalData = (userId: string) => {
    const key = getStorageKey(userId);
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFarmData(parsed);
        return true;
      } catch (e) {
        console.error("Local data parse error", e);
      }
    } else {
      // Clear data if no cache for this user
      setFarmData({ transactions: [], flocks: [], inventory: [] });
    }
    return false;
  };

  const saveLocalData = (data: FarmState, userId: string) => {
    if (!userId) return;
    const key = getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(data));
  };

  useEffect(() => {
    const isLocal = sessionStorage.getItem('poultrypro_local_mode') === 'true';
    if (isLocal) {
      setLocalMode(true);
      setSession({ user: { id: 'local-user' } });
      const localProfile = localStorage.getItem('poultrypro_local_profile');
      if (localProfile) setUserProfile(JSON.parse(localProfile));
      else setUserProfile({ name: 'খামারি (অফলাইন)', gender: 'male', email: '', avatar_url: null });
      loadLocalData('local-user');
      setIsLoading(false);
      return;
    }

    const checkSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        if (currentSession) {
          setUserProfile({
            name: currentSession.user.user_metadata?.full_name || 'খামারি',
            gender: currentSession.user.user_metadata?.gender || 'male',
            email: currentSession.user.email || '',
            avatar_url: currentSession.user.user_metadata?.avatar_url || null
          });
          // Load existing cache immediately for better UX
          loadLocalData(currentSession.user.id);
          await fetchAllData(currentSession.user.id);
        }
      } catch (err: any) {
        if (err.message?.includes('fetch') || err.name === 'TypeError') {
          setErrorMsg({ text: "সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না। আপনার ইন্টারনেট চেক করুন অথবা লোকাল মোড ব্যবহার করুন।", type: 'fetch' });
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (localMode) return;
      setSession(currentSession);
      if (currentSession) {
        setUserProfile({
          name: currentSession.user.user_metadata?.full_name || 'খামারি',
          gender: currentSession.user.user_metadata?.gender || 'male',
          email: currentSession.user.email || '',
          avatar_url: currentSession.user.user_metadata?.avatar_url || null
        });
        loadLocalData(currentSession.user.id);
        fetchAllData(currentSession.user.id);
      } else {
        // Explicitly clear state on logout to prevent data leaking to next login
        setFarmData({ transactions: [], flocks: [], inventory: [] });
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [localMode]);

  const fetchAllData = async (userId: string) => {
    if (localMode) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const results = await Promise.allSettled([
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('flocks').select('*').order('startDate', { ascending: false }),
        supabase.from('inventory').select('*').order('name'),
        supabase.from('weight_logs').select('*'),
        supabase.from('mortality_logs').select('*'),
        supabase.from('feed_logs').select('*')
      ]);

      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length > 0) throw new Error('Fetch failed');

      const [txRes, flocksRes, inventoryRes, weightsRes, mortalityRes, feedRes] = results.map(r => (r as PromiseFulfilledResult<any>).value);
      
      const mappedFlocks = (flocksRes.data || []).map(f => ({
        ...f,
        weightLogs: (weightsRes.data || []).filter((w: any) => w.flock_id === f.id) || [],
        mortalityLogs: (mortalityRes.data || []).filter((m: any) => m.flock_id === f.id) || [],
        feedLogs: (feedRes.data || []).filter((fl: any) => fl.flock_id === f.id) || []
      }));

      const newState = {
        transactions: txRes.data || [],
        flocks: mappedFlocks,
        inventory: inventoryRes.data || []
      };
      setFarmData(newState);
      saveLocalData(newState, userId);
    } catch (err: any) {
      if (err.message?.includes('fetch') || err.name === 'TypeError') {
        setErrorMsg({ text: "সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না। লোকাল মোড চালু করা হচ্ছে।", type: 'fetch' });
      } else {
        setErrorMsg({ text: "ডেটা লোড করতে সমস্যা হয়েছে: " + err.message, type: 'other' });
      }
      loadLocalData(userId);
    } finally {
      setIsLoading(false);
    }
  };

  const enterLocalMode = () => {
    setLocalMode(true);
    setSession({ user: { id: 'local-user' } });
    sessionStorage.setItem('poultrypro_local_mode', 'true');
    loadLocalData('local-user');
    setErrorMsg(null);
  };

  const handleLogout = async () => {
    if (localMode) {
      sessionStorage.removeItem('poultrypro_local_mode');
      setLocalMode(false);
      setSession(null);
      setFarmData({ transactions: [], flocks: [], inventory: [] });
    } else {
      await supabase.auth.signOut();
      setFarmData({ transactions: [], flocks: [], inventory: [] });
    }
  };

  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    let newTx;
    if (localMode) {
      newTx = { ...t, id: 'local-' + Date.now() };
    } else {
      const { data, error } = await supabase.from('transactions').insert([t]).select();
      if (error) return;
      newTx = data[0];
    }
    const newState = { ...farmData, transactions: [newTx, ...farmData.transactions] };
    setFarmData(newState);
    saveLocalData(newState, session.user.id);
  };

  const addFlock = async (f: Omit<FlockRecord, 'id' | 'weightLogs' | 'mortalityLogs' | 'feedLogs'>) => {
    let newFlock;
    if (localMode) {
      newFlock = { ...f, id: 'local-' + Date.now(), weightLogs: [], mortalityLogs: [], feedLogs: [] };
    } else {
      const { data, error } = await supabase.from('flocks').insert([f]).select();
      if (error) return;
      newFlock = { ...data[0], weightLogs: [], mortalityLogs: [], feedLogs: [] };
    }
    const newState = { ...farmData, flocks: [newFlock, ...farmData.flocks] };
    setFarmData(newState);
    saveLocalData(newState, session.user.id);
  };

  const updateFlock = async (id: string, updates: Partial<FlockRecord>) => {
    if (localMode) {
      const newState = { ...farmData, flocks: farmData.flocks.map(f => f.id === id ? { ...f, ...updates } : f) };
      setFarmData(newState);
      saveLocalData(newState, session.user.id);
      return;
    }
    const { weightLogs, mortalityLogs, feedLogs, id: fid, ...dbUpdates } = updates as any;
    const { data, error } = await supabase.from('flocks').update(dbUpdates).eq('id', id).select();
    if (error) return;
    const newState = { ...farmData, flocks: farmData.flocks.map(f => f.id === id ? { ...f, ...data[0] } : f) };
    setFarmData(newState);
    saveLocalData(newState, session.user.id);
  };

  const addWeightLog = async (flockId: string, log: Omit<WeightLog, 'id'>) => {
    let newLog;
    if (localMode) {
      newLog = { ...log, id: 'local-' + Date.now(), flock_id: flockId };
    } else {
      const { data, error } = await supabase.from('weight_logs').insert([{ ...log, flock_id: flockId }]).select();
      if (error) return;
      newLog = data[0];
    }
    const newState = { ...farmData, flocks: farmData.flocks.map(f => f.id === flockId ? { ...f, weightLogs: [...f.weightLogs, newLog] } : f) };
    setFarmData(newState);
    saveLocalData(newState, session.user.id);
  };

  const addMortalityLog = async (flockId: string, log: Omit<MortalityLog, 'id'>) => {
    const flock = farmData.flocks.find(f => f.id === flockId);
    if (!flock) return;
    
    // Explicitly handle bird count reduction
    const deathCount = Number(log.count) || 0;
    const currentFlockCount = Number(flock.currentCount) || 0;
    const newCount = Math.max(0, currentFlockCount - deathCount);
    
    let newLog;
    try {
      if (localMode) {
        newLog = { ...log, id: 'local-' + Date.now(), flock_id: flockId, count: deathCount };
      } else {
        const { data, error: insertError } = await supabase.from('mortality_logs').insert([{ ...log, flock_id: flockId, count: deathCount }]).select();
        if (insertError) throw insertError;
        newLog = data[0];
        
        // Update database bird count
        const { error: updateError } = await supabase.from('flocks').update({ currentCount: newCount }).eq('id', flockId);
        if (updateError) console.error("Database update failed for bird count:", updateError);
      }
      
      const newState: FarmState = { 
        ...farmData, 
        flocks: farmData.flocks.map(f => f.id === flockId ? { 
          ...f, 
          currentCount: newCount,
          mortalityLogs: [...f.mortalityLogs, newLog] 
        } : f) 
      };
      setFarmData(newState);
      saveLocalData(newState, session.user.id);
    } catch (err: any) {
      alert("মৃত্যু রেকর্ড করতে সমস্যা হয়েছে: " + (err.message || "Unknown error"));
    }
  };

  const addFeedLog = async (flockId: string, log: Omit<FeedLog, 'id'>) => {
    let newLog;
    if (localMode) {
      newLog = { ...log, id: 'local-' + Date.now(), flock_id: flockId };
    } else {
      const { data, error } = await supabase.from('feed_logs').insert([{ ...log, flock_id: flockId }]).select();
      if (error) return;
      newLog = data[0];
    }
    const newState = { ...farmData, flocks: farmData.flocks.map(f => f.id === flockId ? { ...f, feedLogs: [...f.feedLogs, newLog] } : f) };
    setFarmData(newState);
    saveLocalData(newState, session.user.id);
  };

  const addInventoryItem = async (item: Omit<InventoryItem, 'id'>) => {
    let newItem;
    if (localMode) {
      newItem = { ...item, id: 'local-' + Date.now() };
    } else {
      const { data, error } = await supabase.from('inventory').insert([item]).select();
      if (error) return;
      newItem = data[0];
    }
    const newState = { ...farmData, inventory: [newItem, ...farmData.inventory] };
    setFarmData(newState);
    saveLocalData(newState, session.user.id);
  };

  const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
    if (localMode) {
      const newState = { ...farmData, inventory: farmData.inventory.map(i => i.id === id ? { ...i, ...updates } : i) };
      setFarmData(newState);
      saveLocalData(newState, session.user.id);
      return;
    }
    const { data, error } = await supabase.from('inventory').update(updates).eq('id', id).select();
    if (error) {
      alert("ইনভেন্টরি আপডেট করতে সমস্যা হয়েছে: " + error.message);
      return;
    }
    const newState = { ...farmData, inventory: farmData.inventory.map(i => i.id === id ? { ...i, ...data[0] } : i) };
    setFarmData(newState);
    saveLocalData(newState, session.user.id);
  };

  const deleteInventoryItem = async (id: string) => {
    if (!localMode) {
      const { error } = await supabase.from('inventory').delete().eq('id', id);
      if (error) {
        alert("মুছে ফেলতে সমস্যা হয়েছে");
        return;
      }
    }
    const newState = { ...farmData, inventory: farmData.inventory.filter(i => i.id !== id) };
    setFarmData(newState);
    saveLocalData(newState, session.user.id);
  };

  const deleteFlock = async (id: string) => {
    if (!localMode) {
      await supabase.from('flocks').delete().eq('id', id);
    }
    const newState = { ...farmData, flocks: farmData.flocks.filter(f => f.id !== id) };
    setFarmData(newState);
    saveLocalData(newState, session.user.id);
  };

  const stats = useMemo(() => {
    const totalIncome = farmData.transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpense = farmData.transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalBirds = farmData.flocks.reduce((sum, f) => sum + Number(f.currentCount), 0);
    const initialBirds = farmData.flocks.reduce((sum, f) => sum + Number(f.initialCount), 0);
    
    const totalMortality = farmData.flocks.reduce((sum, f) => 
      sum + f.mortalityLogs.reduce((s, m) => s + Number(m.count), 0), 0
    );
    
    const mortalityRate = initialBirds > 0 ? (totalMortality / initialBirds) * 100 : 0;
    const lowStockItems = farmData.inventory.filter(i => Number(i.currentQuantity) < Number(i.minThreshold)).length;

    return { 
      totalIncome, 
      totalExpense, 
      totalBirds, 
      totalMortality, 
      mortalityRate, 
      balance: totalIncome - totalExpense, 
      lowStockItems 
    };
  }, [farmData]);

  const handleFetchAiInsights = async () => {
    setIsAiLoading(true);
    const insights = await getFarmInsights(farmData);
    setAiInsights(insights);
    setIsAiLoading(false);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-emerald-600" size={48} />
        <p className="text-slate-600 font-medium">লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!session && !localMode) {
    return <Auth onAuthSuccess={() => {}} onEnterLocalMode={enterLocalMode} serverError={errorMsg?.text} />;
  }

  if (errorMsg && errorMsg.type === 'fetch') {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center font-['Hind_Siliguri',_sans-serif]">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-lg w-full">
          <WifiOff size={40} className="text-blue-600 mx-auto mb-6" />
          <h3 className="text-2xl font-black mb-4">সার্ভার সংযোগ বিচ্ছিন্ন</h3>
          <p className="text-slate-500 mb-10">{errorMsg.text}</p>
          <div className="grid grid-cols-1 gap-3">
            <button onClick={() => fetchAllData(session?.user?.id)} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black flex items-center justify-center gap-3"><RefreshCcw size={20} /> পুনরায় চেষ্টা করুন</button>
            <button onClick={enterLocalMode} className="w-full py-4 bg-white text-emerald-600 border-2 border-emerald-100 rounded-2xl font-black flex items-center justify-center gap-3"><DatabaseBackup size={20} /> লোকাল মোডে শুরু করুন</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-['Hind_Siliguri',_sans-serif]">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-sm"><Bird size={24} /></div>
          <h1 className="font-bold text-xl tracking-tight text-emerald-900">PoultryPro</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {Object.keys(TAB_NAMES).map(key => (
            <button key={key} onClick={() => setActiveTab(key as any)} className={`flex items-center gap-3 w-full p-3 rounded-xl font-bold transition-all text-sm ${activeTab === key ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-600 hover:bg-emerald-50'}`}>
              {key === 'dashboard' && <LayoutDashboard size={20} />}
              {key === 'flocks' && <Bird size={20} />}
              {key === 'transactions' && <TrendingUp size={20} />}
              {key === 'inventory' && <Package size={20} />}
              {key === 'ai' && <BrainCircuit size={20} />}
              {key === 'profile' && <User size={20} />}
              <span>{TAB_NAMES[key as keyof typeof TAB_NAMES]}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100">
          {localMode && (
            <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-2">
              <WifiOff size={16} className="text-blue-600" />
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-tighter">অফলাইন মোড</span>
            </div>
          )}
          <button onClick={handleLogout} className="flex items-center gap-3 w-full p-3 text-slate-500 hover:text-red-600 font-bold text-sm"><LogOut size={20} /><span>লগ আউট</span></button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 px-8 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{TAB_NAMES[activeTab]}</h2>
            <p className="text-sm text-slate-600 font-medium">
              {userProfile?.name} {localMode && <span className="text-xs bg-blue-100 text-blue-700 px-2 rounded-full font-bold ml-2">অফলাইন</span>}
            </p>
          </div>
          <button onClick={() => setActiveTab('profile')} className="w-10 h-10 rounded-full border-2 overflow-hidden bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center hover:scale-105 transition-transform">
            {userProfile?.avatar_url ? <img src={userProfile.avatar_url} className="w-full h-full object-cover" /> : userProfile?.name.charAt(0)}
          </button>
        </header>

        <div className="p-8">
          {activeTab === 'dashboard' && <DashboardView farmData={farmData} stats={stats} />}
          {activeTab === 'flocks' && <FlockView farmData={farmData} onAdd={addFlock} onUpdate={updateFlock} onDelete={deleteFlock} onAddWeight={addWeightLog} onAddMortality={addMortalityLog} onAddFeed={addFeedLog} />}
          {activeTab === 'transactions' && <TransactionView farmData={farmData} onAdd={addTransaction} />}
          {activeTab === 'inventory' && <InventoryView farmData={farmData} onAdd={addInventoryItem} onUpdate={updateInventoryItem} onDelete={deleteInventoryItem} />}
          {activeTab === 'ai' && <AiView loading={isAiLoading} insights={aiInsights} onFetch={handleFetchAiInsights} />}
          {activeTab === 'profile' && userProfile && <ProfileView profile={userProfile} onUpdate={async (u) => { setUserProfile({ ...userProfile, ...u }); if (!localMode) await supabase.auth.updateUser({ data: { full_name: u.name, gender: u.gender, avatar_url: u.avatar_url } }); }} />}
        </div>
      </main>
    </div>
  );
};

const DashboardView: React.FC<{ farmData: FarmState, stats: any }> = ({ farmData, stats }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="মোট মুরগি" value={stats.totalBirds.toLocaleString()} icon={<Bird className="text-blue-500" />} />
      <StatCard title="মোট মৃত্যু" value={stats.totalMortality.toLocaleString()} icon={<Skull className="text-rose-500" />} highlight="text-rose-600" />
      <StatCard title="মৃত্যুর হার" value={`${stats.mortalityRate.toFixed(1)}%`} icon={<AlertTriangle className="text-amber-500" />} />
      <StatCard title="ব্যালেন্স" value={`৳${stats.balance.toLocaleString()}`} icon={<History className="text-amber-500" />} highlight={stats.balance < 0 ? 'text-rose-600' : 'text-emerald-600'} />
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-[400px]">
        <h3 className="font-bold text-slate-800 mb-6">মুরগির বৃদ্ধির গতিপথ (গড় ওজন)</h3>
        <ResponsiveContainer width="100%" height="80%">
          <AreaChart data={farmData.flocks[0]?.weightLogs || []}>
            <defs>
              <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
            <YAxis stroke="#94a3b8" fontSize={10} unit="g" />
            <Tooltip />
            <Area type="monotone" dataKey="averageWeight" stroke="#3b82f6" fillOpacity={1} fill="url(#colorWeight)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-6">স্টক অ্যালার্ট</h3>
        <div className="space-y-4">
          {farmData.inventory.filter(i => Number(i.currentQuantity) < Number(i.minThreshold)).map(item => (
            <div key={item.id} className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-3">
              <AlertTriangle className="text-rose-500" />
              <div>
                <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                <p className="text-xs text-rose-600">কম মজুদ: {item.currentQuantity} {item.unit}</p>
              </div>
            </div>
          ))}
          {stats.lowStockItems === 0 && (
            <div className="text-center py-20 opacity-40">
              <Package size={32} className="mx-auto mb-2" />
              <p className="text-sm font-bold">স্টক পর্যাপ্ত আছে</p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

const FlockView: React.FC<{ 
  farmData: FarmState, 
  onAdd: (f: any) => void, 
  onUpdate: (id: string, f: any) => void, 
  onDelete: (id: string) => void, 
  onAddWeight: (id: string, log: any) => void,
  onAddMortality: (id: string, log: any) => void,
  onAddFeed: (id: string, log: any) => void
}> = ({ farmData, onAdd, onUpdate, onDelete, onAddWeight, onAddMortality, onAddFeed }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeLogFlockId, setActiveLogFlockId] = useState<{ id: string, type: 'weight' | 'mortality' | 'feed' } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const [formState, setFormState] = useState({ batchName: '', breed: 'ক্লব ৫০০', initialCount: 0, currentCount: 0, startDate: new Date().toISOString().split('T')[0] });
  const [weightForm, setWeightForm] = useState({ averageWeight: 0, sampleSize: 10, date: new Date().toISOString().split('T')[0] });
  const [mortalityForm, setMortalityForm] = useState({ count: 0, reason: '', date: new Date().toISOString().split('T')[0] });
  const [feedForm, setFeedForm] = useState({ amount: 0, unit: 'ব্যাগ', date: new Date().toISOString().split('T')[0] });

  const resetForm = () => {
    setFormState({ batchName: '', breed: 'ক্লব ৫০০', initialCount: 0, currentCount: 0, startDate: new Date().toISOString().split('T')[0] });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (flock: FlockRecord) => {
    setFormState({ ...flock });
    setEditingId(flock.id);
    setIsAdding(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Hind_Siliguri',_sans-serif]">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">ব্যাচ ব্যবস্থাপনা</h3>
        <button onClick={() => { if (isAdding) resetForm(); else setIsAdding(true); }} className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-50">
          {isAdding ? 'বাতিল' : <><Plus size={18} /> নতুন ব্যাচ</>}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-xl animate-in slide-in-from-top-4">
          <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            {editingId ? <Edit2 size={20} className="text-emerald-600" /> : <Plus size={20} className="text-emerald-600" />}
            {editingId ? 'ব্যাচ এডিট করুন' : 'নতুন ব্যাচ যোগ করুন'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">ব্যাচের নাম</label>
              <input type="text" className="w-full p-3 border rounded-xl" value={formState.batchName} onChange={e => setFormState({...formState, batchName: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">জাত</label>
              <input type="text" className="w-full p-3 border rounded-xl" value={formState.breed} onChange={e => setFormState({...formState, breed: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">শুরুর সংখ্যা</label>
              <input type="number" className="w-full p-3 border rounded-xl" value={formState.initialCount || ''} onChange={e => { const v = parseInt(e.target.value) || 0; setFormState({...formState, initialCount: v, currentCount: v}); }} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">তারিখ</label>
              <input type="date" className="w-full p-3 border rounded-xl" value={formState.startDate} onChange={e => setFormState({...formState, startDate: e.target.value})} />
            </div>
          </div>
          <div className="mt-8 flex gap-3">
            <button onClick={() => { if (editingId) onUpdate(editingId, formState); else onAdd(formState); resetForm(); }} className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-2"><Check size={18} /> সেভ করুন</button>
            <button onClick={resetForm} className="px-8 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">বাতিল</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {farmData.flocks.map(flock => (
          <div key={flock.id} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all group relative">
            <div className="p-8 bg-emerald-600 text-white">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="text-3xl font-black">{flock.batchName}</h4>
                  <p className="text-emerald-100 font-bold mt-2 opacity-80">{flock.breed} • {flock.startDate}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(flock)} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all"><Edit2 size={16} /></button>
                  <button onClick={() => setConfirmDeleteId(flock.id)} className="p-2.5 bg-white/10 hover:bg-rose-500 rounded-xl transition-all"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/10 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold uppercase opacity-60">বর্তমান সংখ্যা</p>
                  <p className="text-2xl font-black mt-1">{flock.currentCount}</p>
                </div>
                <div className="bg-white/10 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold uppercase opacity-60">গড় ওজন</p>
                  <p className="text-2xl font-black mt-1">{flock.weightLogs.length > 0 ? `${flock.weightLogs[flock.weightLogs.length - 1].averageWeight}g` : '-'}</p>
                </div>
                <div className="bg-white/10 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold uppercase opacity-60">মৃত্যু</p>
                  <p className="text-2xl font-black mt-1 text-rose-200">{flock.mortalityLogs.reduce((s, m) => s + Number(m.count), 0)} টি</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              {/* History Lists */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Scale size={14} className="text-blue-500" /> ওজন</h5>
                  <div className="space-y-2">
                    {flock.weightLogs.slice(-2).reverse().map(log => (
                      <div key={log.id} className="flex flex-col p-2.5 bg-slate-50 rounded-xl text-[10px] font-bold">
                        <span className="text-slate-400">{log.date}</span>
                        <span className="text-slate-800">{log.averageWeight}g</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Skull size={14} className="text-rose-500" /> মৃত্যু</h5>
                  <div className="space-y-2">
                    {flock.mortalityLogs.slice(-2).reverse().map(log => (
                      <div key={log.id} className="flex flex-col p-2.5 bg-rose-50 rounded-xl text-[10px] font-bold border border-rose-100">
                        <span className="text-rose-400">{log.date}</span>
                        <span className="text-rose-800">{log.count} টি</span>
                        {log.reason && <span className="text-[8px] opacity-70 truncate">{log.reason}</span>}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><UtensilsCrossed size={14} className="text-amber-500" /> খাদ্য</h5>
                  <div className="space-y-2">
                    {flock.feedLogs.slice(-2).reverse().map(log => (
                      <div key={log.id} className="flex flex-col p-2.5 bg-amber-50 rounded-xl text-[10px] font-bold border border-amber-100">
                        <span className="text-amber-400">{log.date}</span>
                        <span className="text-amber-800">{log.amount} {log.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Forms */}
              {activeLogFlockId?.id === flock.id ? (
                <div className="bg-slate-50 p-6 rounded-3xl border border-emerald-100 animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-6">
                    <h5 className="font-black text-emerald-800 uppercase text-xs tracking-widest">
                      {activeLogFlockId.type === 'weight' ? 'ওজন রেকর্ড' : 
                       activeLogFlockId.type === 'mortality' ? 'মৃত্যু রেকর্ড' : 
                       'খাদ্য রেকর্ড'}
                    </h5>
                    <button onClick={() => setActiveLogFlockId(null)} className="p-1 hover:bg-slate-200 rounded-full"><X size={16} /></button>
                  </div>
                  
                  {activeLogFlockId.type === 'weight' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <input type="number" placeholder="ওজন (গ্রাম)" className="p-3 border rounded-xl text-sm font-bold" value={weightForm.averageWeight || ''} onChange={e => setWeightForm({...weightForm, averageWeight: parseInt(e.target.value) || 0})} />
                        <input type="number" placeholder="নমুনা" className="p-3 border rounded-xl text-sm font-bold" value={weightForm.sampleSize || ''} onChange={e => setWeightForm({...weightForm, sampleSize: parseInt(e.target.value) || 0})} />
                      </div>
                      <button onClick={() => { onAddWeight(flock.id, weightForm); setActiveLogFlockId(null); setWeightForm({ averageWeight: 0, sampleSize: 10, date: new Date().toISOString().split('T')[0] }); }} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black text-sm shadow-lg shadow-emerald-100">ওজন সেভ করুন</button>
                    </div>
                  )}
                  {activeLogFlockId.type === 'mortality' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <input type="number" placeholder="সংখ্যা" className="p-3 border rounded-xl text-sm font-bold" value={mortalityForm.count || ''} onChange={e => setMortalityForm({...mortalityForm, count: parseInt(e.target.value) || 0})} />
                        <input type="date" className="p-3 border rounded-xl text-sm font-bold" value={mortalityForm.date} onChange={e => setMortalityForm({...mortalityForm, date: e.target.value})} />
                      </div>
                      <input type="text" placeholder="কারণ (ঐচ্ছিক)" className="w-full p-3 border rounded-xl text-sm font-bold" value={mortalityForm.reason} onChange={e => setMortalityForm({...mortalityForm, reason: e.target.value})} />
                      <button onClick={() => { onAddMortality(flock.id, mortalityForm); setActiveLogFlockId(null); setMortalityForm({ count: 0, reason: '', date: new Date().toISOString().split('T')[0] }); }} className="w-full py-3 bg-rose-600 text-white rounded-xl font-black text-sm shadow-lg shadow-rose-100">মৃত্যু সেভ করুন</button>
                    </div>
                  )}
                  {activeLogFlockId.type === 'feed' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <input type="number" placeholder="পরিমাণ" className="p-3 border rounded-xl text-sm font-bold" value={feedForm.amount || ''} onChange={e => setFeedForm({...feedForm, amount: parseFloat(e.target.value) || 0})} />
                        <select className="p-3 border rounded-xl text-sm font-bold bg-white" value={feedForm.unit} onChange={e => setFeedForm({...feedForm, unit: e.target.value})}>
                          <option value="ব্যাগ">ব্যাগ (Bag)</option>
                          <option value="কেজি">কেজি (KG)</option>
                          <option value="গ্রাম">গ্রাম (G)</option>
                        </select>
                      </div>
                      <input type="date" className="w-full p-3 border rounded-xl text-sm font-bold" value={feedForm.date} onChange={e => setFeedForm({...feedForm, date: e.target.value})} />
                      <button onClick={() => { onAddFeed(flock.id, feedForm); setActiveLogFlockId(null); setFeedForm({ amount: 0, unit: 'ব্যাগ', date: new Date().toISOString().split('T')[0] }); }} className="w-full py-3 bg-amber-500 text-white rounded-xl font-black text-sm shadow-lg shadow-amber-100">খাদ্য সেভ করুন</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => setActiveLogFlockId({ id: flock.id, type: 'weight' })} className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-emerald-200 rounded-2xl hover:bg-emerald-50 transition-all group">
                    <Scale size={20} className="text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black text-emerald-700">ওজন</span>
                  </button>
                  <button onClick={() => setActiveLogFlockId({ id: flock.id, type: 'mortality' })} className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-rose-200 rounded-2xl hover:bg-rose-50 transition-all group">
                    <Skull size={20} className="text-rose-500 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black text-rose-700">মৃত্যু</span>
                  </button>
                  <button onClick={() => setActiveLogFlockId({ id: flock.id, type: 'feed' })} className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-amber-200 rounded-2xl hover:bg-amber-50 transition-all group">
                    <UtensilsCrossed size={20} className="text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black text-amber-700">খাদ্য</span>
                  </button>
                </div>
              )}
            </div>

            {confirmDeleteId === flock.id && (
              <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
                <AlertCircle size={48} className="text-rose-500 mb-4" />
                <h5 className="text-white text-xl font-black mb-2">মুছে ফেলতে চান?</h5>
                <p className="text-slate-400 text-sm mb-8">এই ব্যাচের সব তথ্য চিরতরে মুছে যাবে।</p>
                <div className="flex gap-3 w-full max-w-xs">
                  <button onClick={() => { onDelete(flock.id); setConfirmDeleteId(null); }} className="flex-1 bg-rose-600 text-white py-3 rounded-2xl font-bold">মুছে ফেলুন</button>
                  <button onClick={() => setConfirmDeleteId(null)} className="flex-1 bg-slate-700 text-white py-3 rounded-2xl font-bold">বাতিল</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string, value: string, icon: React.ReactNode, highlight?: string }> = ({ title, value, icon, highlight }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-slate-500 text-[10px] font-black mb-1 uppercase tracking-widest">{title}</p>
      <h4 className={`text-2xl font-black ${highlight || 'text-slate-900'}`}>{value}</h4>
    </div>
    <div className="p-4 bg-slate-50 rounded-2xl">{icon}</div>
  </div>
);

const TransactionView: React.FC<{ farmData: FarmState, onAdd: (t: any) => void }> = ({ farmData, onAdd }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTx, setNewTx] = useState({ type: TransactionType.EXPENSE, category: Category.FEED, amount: 0, description: '', date: new Date().toISOString().split('T')[0] });

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500 font-['Hind_Siliguri',_sans-serif]">
      <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-black text-slate-800 text-xl flex items-center gap-3"><History className="text-emerald-600" /> আর্থিক খতিয়ান</h3>
        <button onClick={() => setIsAdding(!isAdding)} className="px-6 py-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all flex items-center gap-2 text-sm font-black shadow-lg shadow-slate-200">{isAdding ? 'বাতিল' : <><Plus size={18} /> নতুন হিসাব</>}</button>
      </div>
      {isAdding && (
        <div className="p-8 bg-slate-50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-5 gap-4 animate-in slide-in-from-top-2">
          <select value={newTx.type} onChange={(e) => setNewTx({...newTx, type: e.target.value as any})} className="p-3 border rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white"><option value={TransactionType.INCOME}>আয়</option><option value={TransactionType.EXPENSE}>ব্যয়</option></select>
          <select value={newTx.category} onChange={(e) => setNewTx({...newTx, category: e.target.value as any})} className="p-3 border rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white">{Object.values(Category).map(c => <option key={c} value={c}>{CATEGORY_NAMES[c]}</option>)}</select>
          <input type="number" placeholder="পরিমাণ" className="p-3 border rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500" value={newTx.amount || ''} onChange={(e) => setNewTx({...newTx, amount: Number(e.target.value)})} />
          <input type="text" placeholder="বিবরণ" className="p-3 border rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500" value={newTx.description} onChange={(e) => setNewTx({...newTx, description: e.target.value})} />
          <button onClick={() => { onAdd(newTx); setIsAdding(false); }} className="bg-emerald-600 text-white rounded-xl font-black py-3 shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all">সেভ করুন</button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest">
            <tr><th className="px-8 py-6">তারিখ</th><th className="px-8 py-6">বিভাগ</th><th className="px-8 py-6">বিবরণ</th><th className="px-8 py-6 text-right">পরিমাণ</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {farmData.transactions.map(t => (
              <tr key={t.id} className="hover:bg-slate-50 transition-all">
                <td className="px-8 py-5 text-slate-500 font-bold text-sm">{t.date}</td>
                <td className="px-8 py-5"><span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm ${t.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{CATEGORY_NAMES[t.category]}</span></td>
                <td className="px-8 py-5 text-slate-800 font-bold text-sm">{t.description}</td>
                <td className={`px-8 py-5 text-right font-black text-base ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>{t.type === TransactionType.INCOME ? '+' : '-'}৳{t.amount.toLocaleString()}</td>
              </tr>
            ))}
            {farmData.transactions.length === 0 && (
              <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-black">কোনো লেনদেন রেকর্ড নেই</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const InventoryView: React.FC<{ farmData: FarmState, onAdd: (item: any) => void, onUpdate: (id: string, item: any) => void, onDelete: (id: string) => void }> = ({ farmData, onAdd, onUpdate, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [formState, setFormState] = useState({ name: '', category: Category.FEED, currentQuantity: 0, unit: 'ব্যাগ', minThreshold: 5 });

  const resetForm = () => {
    setFormState({ name: '', category: Category.FEED, currentQuantity: 0, unit: 'ব্যাগ', minThreshold: 5 });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (item: InventoryItem) => {
    setFormState({ ...item });
    setEditingId(item.id);
    setIsAdding(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Hind_Siliguri',_sans-serif]">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">স্টক ও ইনভেন্টরি</h3>
        <button onClick={() => { if (isAdding) resetForm(); else setIsAdding(true); }} className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-50 hover:bg-emerald-700 transition-all">
          {isAdding ? 'বাতিল' : <><Plus size={18} /> নতুন আইটেম</>}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl animate-in slide-in-from-top-2">
          <h4 className="font-black text-slate-800 mb-6 flex items-center gap-3">
            {editingId ? <Edit2 className="text-emerald-600" /> : <Package className="text-emerald-600" />}
            {editingId ? 'আইটেম এডিট করুন' : 'রিসোর্স তথ্য'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">নাম</label>
              <input type="text" placeholder="আইটেম নাম" className="w-full p-3 border rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">বিভাগ</label>
              <select className="w-full p-3 border rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white" value={formState.category} onChange={e => setFormState({...formState, category: e.target.value as any})}><option value={Category.FEED}>ফিড</option><option value={Category.MEDICINE}>ওষুধ</option></select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">বর্তমান পরিমাণ</label>
              <input type="number" placeholder="বর্তমান পরিমাণ" className="w-full p-3 border rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500" value={formState.currentQuantity || ''} onChange={e => setFormState({...formState, currentQuantity: parseInt(e.target.value) || 0})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">একক</label>
              <input type="text" placeholder="একক (ব্যাগ/বোতল)" className="w-full p-3 border rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500" value={formState.unit} onChange={e => setFormState({...formState, unit: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">সীমা</label>
              <input type="number" placeholder="মিনিমাম সীমা" className="w-full p-3 border rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500" value={formState.minThreshold || ''} onChange={e => setFormState({...formState, minThreshold: parseInt(e.target.value) || 0})} />
            </div>
          </div>
          <div className="mt-8 flex gap-3">
            <button onClick={() => { if (editingId) onUpdate(editingId, formState); else onAdd(formState); resetForm(); }} className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-black shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2">
              <Check size={18} /> সংরক্ষণ করুন
            </button>
            <button onClick={resetForm} className="px-8 py-3 bg-slate-100 text-slate-600 rounded-xl font-black">বাতিল</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {farmData.inventory.map(item => (
          <div key={item.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleEdit(item)} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"><Edit2 size={16} /></button>
              <button onClick={() => setConfirmDeleteId(item.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"><Trash2 size={16} /></button>
            </div>

            {Number(item.currentQuantity) < Number(item.minThreshold) && (
              <div className="absolute top-0 left-0 px-4 py-2 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-br-2xl animate-pulse">Low Stock</div>
            )}
            
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 mt-4">{CATEGORY_NAMES[item.category as Category] || item.category}</p>
            <h4 className="text-2xl font-black text-slate-800 mb-6">{item.name}</h4>
            <div className="flex justify-between items-end">
              <div><p className="text-4xl font-black text-slate-900">{item.currentQuantity}</p><p className="text-xs font-bold text-slate-400 mt-1 uppercase">{item.unit}</p></div>
              <div className="text-right opacity-60"><p className="text-[9px] font-black uppercase mb-1">সতর্কতা সীমা</p><p className="text-sm font-black text-slate-700">{item.minThreshold} {item.unit}</p></div>
            </div>
            <div className="mt-8 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 ${Number(item.currentQuantity) < Number(item.minThreshold) ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (Number(item.currentQuantity) / (Number(item.minThreshold) * 2)) * 100)}%` }}></div>
            </div>

            {confirmDeleteId === item.id && (
              <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
                <AlertCircle size={32} className="text-rose-500 mb-4" />
                <h5 className="text-white font-black mb-6">আইটেমটি কি নিশ্চিতভাবে মুছে ফেলতে চান?</h5>
                <div className="flex gap-2 w-full">
                  <button onClick={() => { onDelete(item.id); setConfirmDeleteId(null); }} className="flex-1 bg-rose-600 text-white py-2 rounded-xl text-sm font-bold">মুছুন</button>
                  <button onClick={() => setConfirmDeleteId(null)} className="flex-1 bg-slate-700 text-white py-2 rounded-xl text-sm font-bold">বাতিল</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {farmData.inventory.length === 0 && (
          <div className="col-span-full py-20 text-center opacity-30 border-2 border-dashed border-slate-300 rounded-[2.5rem]">
            <Package size={48} className="mx-auto mb-4" />
            <p className="font-black">কোনো ইনভেন্টরি আইটেম নেই</p>
          </div>
        )}
      </div>
    </div>
  );
};

const AiView: React.FC<{ loading: boolean, insights: any, onFetch: () => void }> = ({ loading, insights, onFetch }) => (
  <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
    <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-12 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md"><BrainCircuit size={48} className="animate-pulse" /></div>
          <div><h3 className="text-4xl font-black">HenGPT উপদেষ্টা</h3><p className="text-emerald-100 text-xs font-bold uppercase tracking-widest">AI Strategic Poultry Guide</p></div>
        </div>
        <p className="text-emerald-50 mb-12 max-w-lg text-lg font-medium leading-relaxed">আপনার খামারের প্রতিটি ডেটা পয়েন্ট বিশ্লেষণ করে আমরা আপনার মুনাফা বৃদ্ধিতে সহায়তা করি।</p>
        <button onClick={onFetch} disabled={loading} className="px-12 py-4 bg-white text-emerald-700 rounded-2xl font-black flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50">
          {loading ? <Loader2 className="animate-spin" /> : <BrainCircuit />}
          {loading ? 'বিশ্লেষণ চলছে...' : 'পরামর্শ জেনারেট করুন'}
        </button>
      </div>
    </div>
    
    {insights && (
      <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8">
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h4 className="font-black text-slate-800 mb-6 flex items-center gap-3 text-2xl"><TrendingUp className="text-emerald-500" /> সারসংক্ষেপ</h4>
          <p className="text-slate-600 leading-relaxed font-bold text-lg">{insights.summary}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-rose-50 p-10 rounded-[2.5rem] border border-rose-100">
            <h4 className="font-black text-rose-800 mb-6 flex items-center gap-3 text-xl"><AlertTriangle /> ঝুঁকি ও সতর্কতা</h4>
            <ul className="space-y-4">{insights.warnings.map((w: string, i: number) => (<li key={i} className="flex gap-4 text-rose-700 font-bold leading-tight"><div className="w-2 h-2 rounded-full bg-rose-400 mt-2 shrink-0" />{w}</li>))}</ul>
          </div>
          <div className="bg-emerald-50 p-10 rounded-[2.5rem] border border-emerald-100">
            <h4 className="font-black text-emerald-800 mb-6 flex items-center gap-3 text-xl"><Check /> প্রয়োজনীয় পদক্ষেপ</h4>
            <ul className="space-y-4">{insights.recommendations.map((r: string, i: number) => (<li key={i} className="flex gap-4 text-emerald-700 font-bold leading-tight"><Check className="text-emerald-500 shrink-0" />{r}</li>))}</ul>
          </div>
        </div>
      </div>
    )}
    {!insights && !loading && (
      <div className="text-center py-40 border-2 border-dashed border-slate-200 rounded-[3rem] bg-white opacity-40">
        <BrainCircuit size={64} className="mx-auto mb-6 text-slate-300" />
        <p className="text-xl font-black text-slate-400">বিশ্লেষণের জন্য ডেটা প্রস্তুত</p>
      </div>
    )}
  </div>
);

export default App;
