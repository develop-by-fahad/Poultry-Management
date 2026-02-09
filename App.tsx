
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
  Upload
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
import { FarmState, TransactionType, Category, Transaction, FlockRecord, InventoryItem, WeightLog } from './types';
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
  profile: 'প্রোফাইল সেটিংস'
};

// Helper for image conversion
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// --- AUTH COMPONENT ---
const Auth: React.FC<{ onAuthSuccess: () => void }> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string, type: 'limit' | 'other' } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ 
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
      console.error("Auth error details:", err);
      if (err.message?.toLowerCase().includes('rate limit')) {
        setError({ 
          message: 'অতিরিক্ত বার চেষ্টা করা হয়েছে। সুপাবেসের নিরাপত্তা সীমার কারণে আপনার একাউন্ট তৈরিতে বাধা দেওয়া হচ্ছে। দয়া করে ১ ঘণ্টা পর পুনরায় চেষ্টা করুন অথবা অন্য ইমেইল ব্যবহার করুন।', 
          type: 'limit' 
        });
      } else {
        setError({ message: err.message || 'একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।', type: 'other' });
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
        <p className="text-center text-slate-500 text-sm mb-8">
          আপনার খামার ব্যবস্থাপনাকে করুন আরো সহজ
        </p>

        {error && (
          <div className={`p-4 rounded-2xl text-sm mb-6 flex items-start gap-3 border shadow-sm ${error.type === 'limit' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
            {error.type === 'limit' ? <Clock size={20} className="shrink-0 mt-1" /> : <AlertCircle size={20} className="shrink-0 mt-1" />}
            <span className="font-medium">{error.message}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">আপনার নাম</label>
                <input required type="text" className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="উদাঃ আব্দুর রহমান" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">লিঙ্গ</label>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setGender('male')} className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all ${gender === 'male' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-500'}`}>পুরুষ (Male)</button>
                  <button type="button" onClick={() => setGender('female')} className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all ${gender === 'female' ? 'bg-pink-50 border-pink-500 text-pink-700' : 'bg-white border-slate-200 text-slate-500'}`}>মহিলা (Female)</button>
                </div>
              </div>
            </>
          )}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase ml-1">ইমেইল</label>
            <input required type="email" className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="example@mail.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase ml-1">পাসওয়ার্ড</label>
            <input required type="password" minLength={6} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          <button disabled={loading} type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? <LogIn size={20} /> : <UserPlus size={20} />)}
            {isLogin ? 'লগইন করুন' : 'একাউন্ট তৈরি করুন'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button onClick={() => { setIsLogin(!isLogin); setError(null); }} className="text-emerald-600 text-sm font-bold hover:underline transition-all">
            {isLogin ? 'নতুন একাউন্ট নেই? এখানে ক্লিক করুন' : 'ইতিমধ্যে একাউন্ট আছে? লগইন করুন'}
          </button>
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
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white relative">
           <div className="absolute top-0 right-0 p-8 opacity-20">
              <Settings size={80} className="animate-spin-slow" />
           </div>
           <h3 className="text-2xl font-bold mb-1">প্রোফাইল সেটিংস</h3>
           <p className="text-emerald-100 text-sm">আপনার ব্যক্তিগত তথ্য এবং ছবি পরিবর্তন করুন</p>
        </div>
        
        <div className="p-8">
          {message && (
            <div className={`p-4 rounded-2xl text-sm mb-6 flex items-center gap-3 border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
              {message.type === 'success' ? <ShieldCheck size={20} /> : <AlertCircle size={20} />}
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
                    <div className={`w-full h-full flex items-center justify-center text-4xl font-black ${gender === 'female' ? 'text-pink-300' : 'text-emerald-300'}`}>
                      {name.charAt(0)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full text-white text-[10px] font-bold">
                    <Camera size={24} className="mb-1" />
                    ছবি পরিবর্তন
                  </div>
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageChange} 
              />
              <p className="text-slate-400 text-xs mt-3 font-medium">প্রোফাইল ছবি আপলোড করতে ক্লিক করুন</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">ইমেইল এড্রেস</label>
              <input disabled type="text" className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 text-slate-500 font-medium cursor-not-allowed" value={profile.email} />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">আপনার নাম</label>
              <input required type="text" className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-semibold" value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">লিঙ্গ</label>
              <div className="flex gap-4">
                <button type="button" onClick={() => setGender('male')} className={`flex-1 py-4 rounded-2xl border font-black text-sm transition-all flex items-center justify-center gap-2 ${gender === 'male' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm shadow-emerald-100' : 'bg-white border-slate-200 text-slate-500'}`}>
                  পুরুষ (Male)
                </button>
                <button type="button" onClick={() => setGender('female')} className={`flex-1 py-4 rounded-2xl border font-black text-sm transition-all flex items-center justify-center gap-2 ${gender === 'female' ? 'bg-pink-50 border-pink-500 text-pink-700 shadow-sm shadow-pink-100' : 'bg-white border-slate-200 text-slate-500'}`}>
                  মহিলা (Female)
                </button>
              </div>
            </div>

            <button disabled={isUpdating} type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-2 mt-4">
              {isUpdating ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
              পরিবর্তন সংরক্ষণ করুন
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setUserProfile({
          name: session.user.user_metadata?.full_name || 'খামারি',
          gender: session.user.user_metadata?.gender || 'male',
          email: session.user.email || '',
          avatar_url: session.user.user_metadata?.avatar_url || null
        });
        fetchAllData();
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setUserProfile({
          name: session.user.user_metadata?.full_name || 'খামারি',
          gender: session.user.user_metadata?.gender || 'male',
          email: session.user.email || '',
          avatar_url: session.user.user_metadata?.avatar_url || null
        });
        fetchAllData();
      } else {
        setUserProfile(null);
        setFarmData({ transactions: [], flocks: [], inventory: [] });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [txRes, flocksRes, inventoryRes, weightsRes] = await Promise.all([
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('flocks').select('*').order('startDate', { ascending: false }),
        supabase.from('inventory').select('*').order('name'),
        supabase.from('weight_logs').select('*')
      ]);

      const anyError = txRes.error || flocksRes.error || inventoryRes.error || weightsRes.error;
      if (anyError) {
        if (anyError.code === '42P01') {
          throw new Error('আপনার সুপাবেস প্রজেক্টে টেবিলগুলো তৈরি করা হয়নি। দয়া করে SQL কোডটি রান করুন।');
        }
        throw new Error(anyError.message || 'ডেটা লোড করতে সমস্যা হয়েছে');
      }

      const mappedFlocks = (flocksRes.data || []).map(f => ({
        ...f,
        weightLogs: (weightsRes.data || []).filter(w => w.flock_id === f.id) || [],
        mortalityLogs: [] 
      }));

      setFarmData({
        transactions: txRes.data || [],
        flocks: mappedFlocks,
        inventory: inventoryRes.data || []
      });
    } catch (err: any) {
      console.error("Fetch Error:", err);
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (updates: { name: string, gender: string, avatar_url: string | null }) => {
    const { data, error } = await supabase.auth.updateUser({
      data: {
        full_name: updates.name,
        gender: updates.gender,
        avatar_url: updates.avatar_url
      }
    });
    if (error) throw error;
    if (data.user) {
      setUserProfile({
        name: data.user.user_metadata?.full_name,
        gender: data.user.user_metadata?.gender,
        email: data.user.email || '',
        avatar_url: data.user.user_metadata?.avatar_url
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const stats = useMemo(() => {
    const totalIncome = farmData.transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = farmData.transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);
    const totalBirds = farmData.flocks.reduce((sum, f) => sum + f.currentCount, 0);
    const lowStockItems = farmData.inventory.filter(i => i.currentQuantity < i.minThreshold).length;

    return { totalIncome, totalExpense, totalBirds, lowStockItems, balance: totalIncome - totalExpense };
  }, [farmData]);

  const handleFetchAiInsights = async () => {
    setIsAiLoading(true);
    const insights = await getFarmInsights(farmData);
    setAiInsights(insights);
    setIsAiLoading(false);
  };

  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    const { data, error } = await supabase.from('transactions').insert([t]).select();
    if (!error && data) setFarmData(prev => ({ ...prev, transactions: [data[0], ...prev.transactions] }));
  };

  const addFlock = async (f: Omit<FlockRecord, 'id' | 'weightLogs' | 'mortalityLogs'>) => {
    const { data, error } = await supabase.from('flocks').insert([f]).select();
    if (!error && data) setFarmData(prev => ({ ...prev, flocks: [{ ...data[0], weightLogs: [], mortalityLogs: [] }, ...prev.flocks] }));
  };

  const updateFlock = async (id: string, updates: Partial<FlockRecord>) => {
    const { weightLogs, mortalityLogs, id: fid, ...dbUpdates } = updates as any;
    const { data, error } = await supabase.from('flocks').update(dbUpdates).eq('id', id).select();
    if (!error && data) setFarmData(prev => ({ ...prev, flocks: prev.flocks.map(f => f.id === id ? { ...f, ...data[0] } : f) }));
  };

  const addWeightLog = async (flockId: string, log: Omit<WeightLog, 'id'>) => {
    const { data, error } = await supabase.from('weight_logs').insert([{ ...log, flock_id: flockId }]).select();
    if (!error && data) setFarmData(prev => ({ ...prev, flocks: prev.flocks.map(f => f.id === flockId ? { ...f, weightLogs: [...f.weightLogs, data[0]] } : f) }));
  };

  const addInventoryItem = async (item: Omit<InventoryItem, 'id'>) => {
    const { data, error } = await supabase.from('inventory').insert([item]).select();
    if (!error && data) setFarmData(prev => ({ ...prev, inventory: [data[0], ...prev.inventory] }));
  };

  const deleteFlock = async (id: string) => {
    const { error } = await supabase.from('flocks').delete().eq('id', id);
    if (!error) setFarmData(prev => ({ ...prev, flocks: prev.flocks.filter(f => f.id !== id) }));
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-emerald-600" size={48} />
        <p className="text-slate-600 font-medium font-['Hind_Siliguri',_sans-serif]">লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!session) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  if (errorMsg) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center font-['Hind_Siliguri',_sans-serif]">
        <Database size={32} className="text-rose-600 mb-4" />
        <h3 className="text-xl font-bold mb-2">সমস্যা হয়েছে</h3>
        <p className="text-slate-500 mb-6">{errorMsg}</p>
        <button onClick={fetchAllData} className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-2 mx-auto shadow-lg shadow-emerald-50"><RefreshCcw size={18} /> পুনরায় চেষ্টা করুন</button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-['Hind_Siliguri',_sans-serif]">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-sm">
            <Bird size={24} />
          </div>
          <h1 className="font-bold text-xl tracking-tight text-emerald-900">PoultryPro</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <SidebarLink icon={<LayoutDashboard size={20} />} label={TAB_NAMES.dashboard} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarLink icon={<Bird size={20} />} label={TAB_NAMES.flocks} active={activeTab === 'flocks'} onClick={() => setActiveTab('flocks')} />
          <SidebarLink icon={<TrendingUp size={20} />} label={TAB_NAMES.transactions} active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} />
          <SidebarLink icon={<Package size={20} />} label={TAB_NAMES.inventory} active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
          <SidebarLink icon={<BrainCircuit size={20} />} label={TAB_NAMES.ai} active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} />
        </nav>

        <div className="p-4 border-t border-slate-100">
           <SidebarLink icon={<User size={20} />} label={TAB_NAMES.profile} active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
          <button onClick={handleLogout} className="flex items-center gap-3 w-full p-3 text-slate-500 hover:text-red-600 transition-colors font-bold text-sm mt-2">
            <LogOut size={20} />
            <span>লগ আউট</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 px-8 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{TAB_NAMES[activeTab]}</h2>
            <p className="text-sm text-slate-600 font-medium">
              {userProfile?.gender === 'female' ? `স্বাগতম ${userProfile.name} বোন` : `স্বাগতম ${userProfile?.name} ভাই`}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`w-10 h-10 rounded-full border-2 overflow-hidden flex items-center justify-center font-bold shadow-sm transition-transform hover:scale-105 active:scale-95 ${userProfile?.gender === 'female' ? 'bg-pink-100 border-pink-200 text-pink-700' : 'bg-emerald-100 border-emerald-200 text-emerald-700'}`}
            >
              {userProfile?.avatar_url ? (
                <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                userProfile?.name.charAt(0)
              )}
            </button>
          </div>
        </header>

        <div className="p-8">
          {activeTab === 'dashboard' && <DashboardView farmData={farmData} stats={stats} />}
          {activeTab === 'flocks' && <FlockView farmData={farmData} onAdd={addFlock} onUpdate={updateFlock} onDelete={deleteFlock} onAddWeight={addWeightLog} />}
          {activeTab === 'transactions' && <TransactionView farmData={farmData} onAdd={addTransaction} />}
          {activeTab === 'inventory' && <InventoryView farmData={farmData} onAdd={addInventoryItem} />}
          {activeTab === 'ai' && <AiView loading={isAiLoading} insights={aiInsights} onFetch={handleFetchAiInsights} />}
          {activeTab === 'profile' && userProfile && <ProfileView profile={userProfile} onUpdate={handleUpdateProfile} />}
        </div>
      </main>
    </div>
  );
};

const SidebarLink: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex items-center gap-3 w-full p-3 rounded-lg font-bold transition-all text-sm ${active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'}`}>
    {icon}
    <span>{label}</span>
  </button>
);

const DashboardView: React.FC<{ farmData: FarmState, stats: any }> = ({ farmData, stats }) => {
  const birdStats = farmData.flocks[0]?.weightLogs.map(l => ({ date: l.date, weight: l.averageWeight })) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="মোট মুরগি" value={stats.totalBirds.toLocaleString()} icon={<Bird className="text-blue-500" />} />
        <StatCard title="মোট আয়" value={`৳${stats.totalIncome.toLocaleString()}`} icon={<TrendingUp className="text-emerald-500" />} />
        <StatCard title="মোট ব্যয়" value={`৳${stats.totalExpense.toLocaleString()}`} icon={<TrendingDown className="text-rose-500" />} />
        <StatCard title="নিট মুনাফা" value={`৳${stats.balance.toLocaleString()}`} icon={<History className="text-amber-500" />} highlight={stats.balance < 0 ? 'text-rose-600' : 'text-emerald-600'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800">বৃদ্ধির পারফরম্যান্স (গড় ওজন)</h3>
            <span className="text-xs font-semibold px-3 py-1 bg-blue-50 text-blue-600 rounded-full">সক্রিয় ব্যাচ</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={birdStats}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} unit="g" />
                <Tooltip />
                <Area type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
          <h3 className="font-bold text-slate-800 mb-6">জরুরি ইনভেন্টরি</h3>
          <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2">
            {farmData.inventory.filter(i => i.currentQuantity < i.minThreshold).map(item => (
              <div key={item.id} className="flex items-center gap-4 p-3 bg-rose-50 rounded-xl border border-rose-100 animate-in slide-in-from-right-2">
                <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                  <AlertTriangle size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-slate-800">{item.name}</p>
                  <p className="text-xs text-rose-600 font-bold">মাত্র {item.currentQuantity} {item.unit} আছে</p>
                </div>
              </div>
            ))}
            {farmData.inventory.filter(i => i.currentQuantity < i.minThreshold).length === 0 && (
              <div className="text-center py-20 opacity-40">
                <Package className="mx-auto mb-2" size={32} />
                <p className="text-sm font-medium">ইনভেন্টরি পর্যাপ্ত আছে</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string, value: string, icon: React.ReactNode, highlight?: string }> = ({ title, value, icon, highlight }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-slate-500 text-xs font-bold mb-1 uppercase tracking-wider">{title}</p>
      <h4 className={`text-xl font-bold ${highlight || 'text-slate-900'}`}>{value}</h4>
    </div>
    <div className="p-3 bg-slate-50 rounded-xl">{icon}</div>
  </div>
);

const FlockView: React.FC<{ farmData: FarmState, onAdd: (f: any) => void, onUpdate: (id: string, f: any) => void, onDelete: (id: string) => void, onAddWeight: (id: string, log: any) => void }> = ({ farmData, onAdd, onUpdate, onDelete, onAddWeight }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeWeightId, setActiveWeightId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const [formState, setFormState] = useState({ batchName: '', breed: 'ক্লব ৫০০', initialCount: 0, currentCount: 0, startDate: new Date().toISOString().split('T')[0] });
  const [newWeight, setNewWeight] = useState({ averageWeight: 0, sampleSize: 10, date: new Date().toISOString().split('T')[0] });

  const resetForm = () => {
    setFormState({ batchName: '', breed: 'ক্লব ৫০০', initialCount: 0, currentCount: 0, startDate: new Date().toISOString().split('T')[0] });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEditClick = (flock: FlockRecord) => {
    setFormState({
      batchName: flock.batchName,
      breed: flock.breed,
      initialCount: flock.initialCount,
      currentCount: flock.currentCount,
      startDate: flock.startDate
    });
    setEditingId(flock.id);
    setIsAdding(true);
  };

  const handleSubmit = () => {
    if (editingId) {
      onUpdate(editingId, formState);
    } else {
      onAdd(formState);
    }
    resetForm();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">সক্রিয় ব্যাচের তালিকা</h3>
        <button onClick={() => { if (isAdding) resetForm(); else setIsAdding(true); }} className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all text-sm font-bold shadow-lg shadow-emerald-50">
          {isAdding ? 'বাতিল' : <><Plus size={18} /> নতুন ব্যাচ</>}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-lg animate-in slide-in-from-top-4">
          <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            {editingId ? <Edit2 size={20} className="text-emerald-600" /> : <Plus size={20} className="text-emerald-600" />}
            {editingId ? 'ব্যাচের তথ্য পরিবর্তন করুন' : 'নতুন ব্যাচের তথ্য দিন'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">ব্যাচের নাম</label>
              <input type="text" placeholder="উদাঃ ব্যাচ-০১" className="p-3 border border-slate-200 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-emerald-500 transition-all" value={formState.batchName} onChange={(e) => setFormState({...formState, batchName: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">জাত (Breed)</label>
              <input type="text" placeholder="উদাঃ ক্লব ৫০০" className="p-3 border border-slate-200 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-emerald-500 transition-all" value={formState.breed} onChange={(e) => setFormState({...formState, breed: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">শুরুর সংখ্যা</label>
              <input type="number" placeholder="উদাঃ ৫০০" className="p-3 border border-slate-200 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-emerald-500 transition-all" value={formState.initialCount || ''} onChange={(e) => { const val = parseInt(e.target.value) || 0; setFormState({...formState, initialCount: val, currentCount: val}); }} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">শুরুর তারিখ</label>
              <input type="date" className="p-3 border border-slate-200 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-emerald-500 transition-all" value={formState.startDate} onChange={(e) => setFormState({...formState, startDate: e.target.value})} />
            </div>
          </div>
          <div className="mt-8 flex gap-3">
            <button disabled={!formState.batchName || !formState.initialCount} onClick={handleSubmit} className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold disabled:opacity-50 flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-md">
              <Check size={18} /> {editingId ? 'পরিবর্তন সেভ করুন' : 'ব্যাচ তৈরি করুন'}
            </button>
            <button onClick={resetForm} className="px-8 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all">বাতিল</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {farmData.flocks.length > 0 ? (
          farmData.flocks.map(flock => (
            <div key={flock.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col group relative transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="p-6 bg-emerald-600 text-white">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-2xl font-bold">{flock.batchName}</h4>
                    <p className="text-emerald-100 text-sm flex items-center gap-1.5 mt-2 font-medium">
                      <Bird size={14} className="opacity-80" /> জাত: <span className="font-bold underline decoration-emerald-400 decoration-2">{flock.breed || 'উল্লেখ নেই'}</span>
                    </p>
                    <p className="text-emerald-100 text-[10px] mt-2 font-bold opacity-70 tracking-widest">শুরু: {flock.startDate}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditClick(flock)} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all" title="এডিট">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => setConfirmDeleteId(flock.id)} className="p-2.5 bg-white/10 hover:bg-rose-500 rounded-xl transition-all" title="ডিলিট">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                    <p className="text-emerald-100 text-[10px] uppercase font-bold opacity-80 tracking-tighter">বর্তমান সংখ্যা</p>
                    <p className="text-3xl font-bold mt-1">{flock.currentCount}</p>
                  </div>
                  <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                    <p className="text-emerald-100 text-[10px] uppercase font-bold opacity-80 tracking-tighter">গড় ওজন</p>
                    <p className="text-3xl font-bold mt-1">{flock.weightLogs.length > 0 ? `${flock.weightLogs[flock.weightLogs.length - 1].averageWeight} গ্রাম` : 'নেই'}</p>
                  </div>
                </div>
              </div>

              {confirmDeleteId === flock.id && (
                <div className="absolute inset-0 bg-slate-900/95 z-20 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300 backdrop-blur-sm">
                  <div className="p-4 bg-rose-500/10 rounded-full mb-4">
                    <AlertCircle size={48} className="text-rose-500" />
                  </div>
                  <h5 className="text-white font-bold text-xl mb-3">আপনি কি নিশ্চিত?</h5>
                  <p className="text-slate-400 text-sm mb-8 leading-relaxed">এই ব্যাচ এবং এর সব রেকর্ড চিরতরে মুছে যাবে। এটি আর ফিরে পাওয়া সম্ভব নয়।</p>
                  <div className="flex gap-3 w-full max-w-xs">
                    <button onClick={() => { onDelete(flock.id); setConfirmDeleteId(null); }} className="flex-1 bg-rose-600 text-white py-3.5 rounded-2xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-900/20">মুছে ফেলুন</button>
                    <button onClick={() => setConfirmDeleteId(null)} className="flex-1 bg-slate-700 text-white py-3.5 rounded-2xl font-bold hover:bg-slate-600 transition-all">বাতিল</button>
                  </div>
                </div>
              )}

              <div className="p-6 flex-1 bg-white">
                {activeWeightId === flock.id ? (
                  <div className="bg-slate-50 p-5 rounded-2xl space-y-4 mb-4 border border-emerald-100 animate-in zoom-in-95 duration-200 shadow-inner">
                    <h5 className="font-bold text-xs text-emerald-800 uppercase tracking-widest text-center border-b border-emerald-100 pb-2">ওজন রেকর্ড করুন</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 ml-1">ওজন (গ্রাম)</label>
                        <input type="number" className="p-2.5 border border-slate-200 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-emerald-500" value={newWeight.averageWeight || ''} onChange={(e) => setNewWeight({...newWeight, averageWeight: parseInt(e.target.value) || 0})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 ml-1">নমুনা সংখ্যা</label>
                        <input type="number" className="p-2.5 border border-slate-200 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-emerald-500" value={newWeight.sampleSize || ''} onChange={(e) => setNewWeight({...newWeight, sampleSize: parseInt(e.target.value) || 0})} />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => { onAddWeight(flock.id, newWeight); setActiveWeightId(null); setNewWeight({ averageWeight: 0, sampleSize: 10, date: new Date().toISOString().split('T')[0] }); }} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-sm">সেভ করুন</button>
                      <button onClick={() => setActiveWeightId(null)} className="px-5 py-2.5 border border-slate-200 rounded-xl font-bold text-xs bg-white hover:bg-slate-50 transition-all">বন্ধ</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h5 className="font-bold text-xs text-slate-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                       <History size={14} /> ওজনের ইতিহাস
                    </h5>
                    <div className="space-y-3 mb-8">
                      {flock.weightLogs.length > 0 ? (
                        flock.weightLogs.slice(-3).reverse().map(log => (
                          <div key={log.id} className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-emerald-100 transition-colors">
                            <span className="text-slate-500 font-bold">{log.date}</span>
                            <span className="font-extrabold text-slate-800 flex items-center gap-1.5 bg-white px-3 py-1 rounded-full shadow-sm"><Scale size={14} className="text-blue-500" />{log.averageWeight} গ্রাম</span>
                          </div>
                        ))
                      ) : ( <p className="text-xs text-slate-400 italic py-4 text-center bg-slate-50 rounded-xl">রেকর্ড নেই</p> )}
                    </div>
                    <button onClick={() => setActiveWeightId(flock.id)} className="w-full py-4 border-2 border-dashed border-emerald-200 text-emerald-600 font-bold rounded-2xl hover:bg-emerald-50 hover:border-emerald-300 transition-all text-sm flex items-center justify-center gap-2.5 group">
                      <Plus size={18} className="group-hover:scale-110 transition-transform" /> ওজন রেকর্ড করুন
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-32 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200 shadow-inner">
             <Bird size={64} className="mx-auto text-slate-200 mb-6" />
             <p className="text-slate-500 font-bold text-xl mb-2">কোনো মুরগির ব্যাচ নেই</p>
             <p className="text-slate-400 text-sm max-w-xs mx-auto">খামারের কার্যক্রম শুরু করতে নতুন ব্যাচ যোগ করুন।</p>
          </div>
        )}
      </div>
    </div>
  );
};

const TransactionView: React.FC<{ farmData: FarmState, onAdd: (t: any) => void }> = ({ farmData, onAdd }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTx, setNewTx] = useState({ type: TransactionType.EXPENSE, category: Category.FEED, amount: 0, description: '', date: new Date().toISOString().split('T')[0] });

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-bold text-slate-800 flex items-center gap-2"><History size={20} className="text-emerald-600" /> আর্থিক খতিয়ান</h3>
        <button onClick={() => setIsAdding(!isAdding)} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 text-sm font-bold shadow-lg shadow-slate-100">{isAdding ? 'বাতিল' : <><Plus size={18} /> নতুন হিসাব</>}</button>
      </div>
      {isAdding && (
        <div className="p-6 bg-slate-50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-5 gap-4 animate-in slide-in-from-top-2 duration-300">
          <select value={newTx.type} onChange={(e) => setNewTx({...newTx, type: e.target.value as TransactionType})} className="p-3 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white"><option value={TransactionType.INCOME}>আয়</option><option value={TransactionType.EXPENSE}>ব্যয়</option></select>
          <select value={newTx.category} onChange={(e) => setNewTx({...newTx, category: e.target.value as Category})} className="p-3 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white">{Object.values(Category).map(c => <option key={c} value={c}>{CATEGORY_NAMES[c]}</option>)}</select>
          <input type="number" placeholder="টাকার পরিমাণ" className="p-3 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white" value={newTx.amount || ''} onChange={(e) => setNewTx({...newTx, amount: Number(e.target.value)})} />
          <input type="text" placeholder="বিবরণ" className="p-3 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white" value={newTx.description} onChange={(e) => setNewTx({...newTx, description: e.target.value})} />
          <button disabled={!newTx.amount || !newTx.description} onClick={() => { onAdd(newTx); setIsAdding(false); setNewTx({ type: TransactionType.EXPENSE, category: Category.FEED, amount: 0, description: '', date: new Date().toISOString().split('T')[0] }); }} className="bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm disabled:opacity-50 hover:bg-emerald-700 transition-all shadow-md">সেভ করুন</button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            <tr><th className="px-6 py-5">তারিখ</th><th className="px-6 py-5">বিভাগ</th><th className="px-6 py-5">বিবরণ</th><th className="px-6 py-5 text-right">পরিমাণ</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {farmData.transactions.length > 0 ? (
              farmData.transactions.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition-all group">
                  <td className="px-6 py-4 text-slate-500 font-bold">{t.date}</td>
                  <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase shadow-sm ${t.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{CATEGORY_NAMES[t.category]}</span></td>
                  <td className="px-6 py-4 text-slate-800 font-semibold">{t.description}</td>
                  <td className={`px-6 py-4 text-right font-extrabold text-base ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>{t.type === TransactionType.INCOME ? '+' : '-'}৳{t.amount.toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-400 font-medium">কোনো লেনদেন পাওয়া যায়নি</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const InventoryView: React.FC<{ farmData: FarmState, onAdd: (item: any) => void }> = ({ farmData, onAdd }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: Category.FEED, currentQuantity: 0, unit: 'ব্যাগ', minThreshold: 5 });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">রিসোর্স স্টক</h3>
        <button onClick={() => setIsAdding(!isAdding)} className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-bold shadow-lg shadow-emerald-50">{isAdding ? 'বাতিল' : <><Plus size={18} /> নতুন আইটেম</>}</button>
      </div>
      {isAdding && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-lg animate-in slide-in-from-top-2">
          <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><Package size={20} className="text-emerald-600" />পণ্যের তথ্য দিন</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <input type="text" placeholder="পণ্যের নাম" className="p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})} />
            <select className="p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" value={newItem.category} onChange={(e) => setNewItem({...newItem, category: e.target.value as Category.FEED | Category.MEDICINE})}><option value={Category.FEED}>খাদ্য (ফিড)</option><option value={Category.MEDICINE}>ওষুধ</option></select>
            <input type="number" placeholder="বর্তমান পরিমাণ" className="p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" value={newItem.currentQuantity || ''} onChange={(e) => setNewItem({...newItem, currentQuantity: parseInt(e.target.value) || 0})} />
            <input type="text" placeholder="একক (ব্যাগ/বোতল)" className="p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" value={newItem.unit} onChange={(e) => setNewItem({...newItem, unit: e.target.value})} />
            <input type="number" placeholder="সর্বনিম্ন সীমা" className="p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" value={newItem.minThreshold || ''} onChange={(e) => setNewItem({...newItem, minThreshold: parseInt(e.target.value) || 0})} />
          </div>
          <button disabled={!newItem.name} onClick={() => { onAdd(newItem); setIsAdding(false); setNewItem({ name: '', category: Category.FEED, currentQuantity: 0, unit: 'ব্যাগ', minThreshold: 5 }); }} className="mt-6 px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold disabled:opacity-50 hover:bg-emerald-700 transition-all shadow-md">আইটেম যোগ করুন</button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {farmData.inventory.length > 0 ? (
          farmData.inventory.map(item => (
            <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              {item.currentQuantity < item.minThreshold && ( <div className="absolute top-0 right-0 p-2.5 bg-rose-500 text-white shadow-lg rounded-bl-2xl animate-pulse"><AlertTriangle size={18} /></div> )}
              <p className="text-slate-400 text-[10px] font-extrabold uppercase mb-2 tracking-[0.2em]">{CATEGORY_NAMES[item.category as Category] || item.category}</p>
              <h4 className="font-extrabold text-slate-800 mb-6 text-xl">{item.name}</h4>
              <div className="flex items-end justify-between mb-4">
                <div><p className="text-4xl font-black text-slate-900 leading-none">{item.currentQuantity}</p><p className="text-slate-400 text-xs font-bold uppercase mt-1 tracking-widest">{item.unit}</p></div>
                <div className="text-right"><p className="text-[9px] text-slate-400 mb-1 uppercase tracking-tighter font-black">মিনিমাম সীমা</p><p className="text-sm font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-full">{item.minThreshold} {item.unit}</p></div>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <div className={`h-full rounded-full transition-all duration-1000 ease-out ${item.currentQuantity < item.minThreshold ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (item.currentQuantity / (item.minThreshold * 2)) * 100)}%` }}></div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-32 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200 shadow-inner">
             <Package size={64} className="mx-auto text-slate-200 mb-4" />
             <p className="text-slate-500 font-bold text-lg">ইনভেন্টরি খালি</p>
          </div>
        )}
      </div>
    </div>
  );
};

const AiView: React.FC<{ loading: boolean, insights: any, onFetch: () => void }> = ({ loading, insights, onFetch }) => (
  <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
    <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-10 rounded-[2.5rem] text-white shadow-2xl shadow-emerald-200/50 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-700"></div>
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/5 rounded-full blur-2xl -ml-20 -mb-20"></div>
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
            <BrainCircuit size={40} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-4xl font-black tracking-tight">HenGPT উপদেষ্টা</h3>
            <p className="text-emerald-100 text-sm font-bold uppercase tracking-widest mt-1">AI Driven Poultry Management</p>
          </div>
        </div>
        <p className="text-emerald-50 mb-10 max-w-lg font-medium leading-relaxed text-xl">Gemini 3 দ্বারা চালিত, আপনার পালের ওজনের প্রবণতা এবং ব্যয়ের হিসাব বিশ্লেষণ করে আপনাকে বিশেষজ্ঞ পরামর্শ প্রদান করবে।</p>
        <button onClick={onFetch} disabled={loading} className="px-10 py-4 bg-white text-emerald-700 rounded-2xl font-black hover:bg-emerald-50 transition-all flex items-center gap-3 disabled:opacity-50 text-base shadow-xl hover:shadow-2xl hover:-translate-y-1">
          {loading ? <Loader2 className="animate-spin" size={24} /> : <BrainCircuit size={24} />}
          {loading ? 'ডেটা বিশ্লেষণ করা হচ্ছে...' : 'এআই পরামর্শ জেনারেট করুন'}
        </button>
      </div>
    </div>
    {insights && (
      <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <h4 className="font-black text-slate-800 mb-4 flex items-center gap-3 text-2xl"><TrendingUp size={24} className="text-emerald-500" />সারসংক্ষেপ</h4>
          <p className="text-slate-600 leading-relaxed font-semibold text-lg">{insights.summary}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-rose-50 p-8 rounded-3xl border border-rose-100 shadow-sm">
            <h4 className="font-black text-rose-800 mb-6 flex items-center gap-3 text-xl"><AlertTriangle size={24} />সতর্কতা ও ঝুঁকি</h4>
            <ul className="space-y-4">{insights.warnings.map((w: string, i: number) => (<li key={i} className="flex gap-4 text-base text-rose-700 font-bold leading-tight animate-in slide-in-from-left-4" style={{ animationDelay: `${i * 100}ms` }}><div className="shrink-0 w-6 h-6 bg-rose-200 rounded-full flex items-center justify-center text-[10px]">!</div>{w}</li>))}</ul>
          </div>
          <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100 shadow-sm">
            <h4 className="font-black text-emerald-800 mb-6 flex items-center gap-3 text-xl"><TrendingUp size={24} />প্রয়োজনীয় পরামর্শ</h4>
            <ul className="space-y-4">{insights.recommendations.map((r: string, i: number) => (<li key={i} className="flex gap-4 text-base text-emerald-700 font-bold leading-tight animate-in slide-in-from-right-4" style={{ animationDelay: `${i * 100}ms` }}><Check size={20} className="shrink-0 mt-0.5 text-emerald-600" />{r}</li>))}</ul>
          </div>
        </div>
      </div>
    )}
    {!insights && !loading && ( <div className="text-center py-32 border-2 border-dashed border-slate-200 rounded-[3rem] bg-white shadow-inner"><BrainCircuit size={64} className="mx-auto text-slate-100 mb-6" /><h4 className="text-slate-800 font-black text-2xl mb-2">বিশ্লেষণের জন্য প্রস্তুত</h4><p className="text-slate-400 text-base font-bold">আপনার এআই-চালিত পর্যালোচনার জন্য উপরের বাটনে ক্লিক করুন।</p></div> )}
  </div>
);

export default App;
