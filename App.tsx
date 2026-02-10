
import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, TrendingUp, Package, History, Bird, Plus, BrainCircuit,
  Trash2, Scale, X, Loader2, Edit2, Check, AlertCircle, User, Skull,
  UtensilsCrossed, AlertTriangle, Settings, Printer, Undo2, LogIn, UserPlus,
  Camera, LogOut, CloudSync
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { FarmState, TransactionType, Category, Transaction, FlockRecord, InventoryItem, WeightLog, MortalityLog, FeedLog, UserAccount } from './types';
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
  flocks: 'মুরগি',
  transactions: 'হিসাব',
  inventory: 'স্টক',
  ai: 'পরামর্শ',
  profile: 'সেটিংস'
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<keyof typeof TAB_NAMES>('dashboard');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [farmData, setFarmData] = useState<FarmState>({
    transactions: [],
    flocks: [],
    inventory: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [undoState, setUndoState] = useState<{ visible: boolean; data: FarmState; message: string; timer: number | null }>({ visible: false, data: farmData, message: '', timer: null });

  // Initial Session Check
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const user = {
            id: session.user.id,
            username: session.user.email?.split('@')[0] || '',
            name: session.user.user_metadata.full_name || 'খামারি',
            profilePic: session.user.user_metadata.avatar_url
          };
          setCurrentUser(user);
          await loadAllData();
        }
      } catch (err) {
        console.error("Session check error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const loadAllData = async () => {
    setIsSyncing(true);
    try {
      const [txs, flocks, inv] = await Promise.all([
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('flocks').select('*, weight_logs(*), mortality_logs(*), feed_logs(*)'),
        supabase.from('inventory').select('*')
      ]);

      if (txs.error) throw txs.error;
      if (flocks.error) throw flocks.error;
      if (inv.error) throw inv.error;

      const formattedFlocks = (flocks.data || []).map(f => ({
        id: f.id,
        batchName: f.batchName,
        startDate: f.startDate,
        initialCount: f.initialCount,
        currentCount: f.currentCount,
        breed: f.breed,
        weightLogs: (f.weight_logs || []).map((wl: any) => ({
          id: wl.id,
          date: wl.date,
          averageWeight: wl.averageWeight,
          sampleSize: wl.sampleSize
        })),
        mortalityLogs: f.mortality_logs || [],
        feedLogs: f.feed_logs || []
      }));

      setFarmData({
        transactions: txs.data || [],
        flocks: formattedFlocks,
        inventory: inv.data || []
      });
    } catch (err: any) {
      console.error("Load Data Error:", err);
      alert("ডেটা লোড করতে সমস্যা হয়েছে: " + (err.message || "টেবিলগুলো তৈরি করা আছে কি?"));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);
    loadAllData();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setFarmData({ transactions: [], flocks: [], inventory: [] });
  };

  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    setIsSyncing(true);
    const { data, error } = await supabase.from('transactions').insert([{
      date: t.date,
      type: t.type,
      category: t.category,
      amount: t.amount,
      description: t.description,
      flock_id: t.flock_id || null
    }]).select();
    
    if (error) {
      alert("হিসাব সেভ করা যায়নি: " + error.message);
    } else if (data) {
      setFarmData(prev => ({ ...prev, transactions: [data[0], ...prev.transactions] }));
    }
    setIsSyncing(false);
  };

  const addFlock = async (f: Omit<FlockRecord, 'id' | 'weightLogs' | 'mortalityLogs' | 'feedLogs'>) => {
    setIsSyncing(true);
    const dbPayload = {
      batchName: f.batchName,
      startDate: f.startDate,
      initialCount: f.initialCount,
      currentCount: f.initialCount,
      breed: f.breed
    };
    const { data, error } = await supabase.from('flocks').insert([dbPayload]).select();
    
    if (error) {
      alert("ব্যাচ তৈরি করা যায়নি: " + error.message);
    } else if (data) {
      setFarmData(prev => ({ 
        ...prev, 
        flocks: [{ ...data[0], weightLogs: [], mortalityLogs: [], feedLogs: [] }, ...prev.flocks] 
      }));
    }
    setIsSyncing(false);
  };

  const deleteFlock = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই ব্যাচটি মুছে ফেলতে চান?")) return;
    const { error } = await supabase.from('flocks').delete().eq('id', id);
    if (error) {
      alert("মুছে ফেলা যায়নি: " + error.message);
    } else {
      setFarmData(prev => ({ ...prev, flocks: prev.flocks.filter(f => f.id !== id) }));
    }
  };

  const addWeightLog = async (flockId: string, log: Omit<WeightLog, 'id'>) => {
    setIsSyncing(true);
    const { data, error } = await supabase.from('weight_logs').insert([{
      flock_id: flockId,
      date: log.date,
      averageWeight: log.averageWeight,
      sampleSize: log.sampleSize
    }]).select();

    if (error) alert(error.message);
    else if (data) {
      setFarmData(prev => ({
        ...prev,
        flocks: prev.flocks.map(f => f.id === flockId ? { ...f, weightLogs: [...f.weightLogs, data[0]] } : f)
      }));
    }
    setIsSyncing(false);
  };

  const addMortalityLog = async (flockId: string, log: Omit<MortalityLog, 'id'>) => {
    setIsSyncing(true);
    const { data, error } = await supabase.from('mortality_logs').insert([{
      flock_id: flockId,
      date: log.date,
      count: log.count,
      reason: log.reason
    }]).select();

    if (error) {
      alert(error.message);
    } else if (data) {
      const flock = farmData.flocks.find(f => f.id === flockId);
      if (flock) {
        const newCount = Math.max(0, flock.currentCount - log.count);
        await supabase.from('flocks').update({ currentCount: newCount }).eq('id', flockId);
        setFarmData(prev => ({
          ...prev,
          flocks: prev.flocks.map(f => f.id === flockId ? { ...f, currentCount: newCount, mortalityLogs: [...f.mortalityLogs, data[0]] } : f)
        }));
      }
    }
    setIsSyncing(false);
  };

  const addInventoryItem = async (item: Omit<InventoryItem, 'id'>) => {
    setIsSyncing(true);
    const { data, error } = await supabase.from('inventory').insert([{
      name: item.name,
      category: item.category,
      currentQuantity: item.currentQuantity,
      unit: item.unit,
      minThreshold: item.minThreshold
    }]).select();
    
    if (error) alert(error.message);
    else if (data) {
      setFarmData(prev => ({ ...prev, inventory: [data[0], ...prev.inventory] }));
    }
    setIsSyncing(false);
  };

  const deleteInventoryItem = async (id: string) => {
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    if (error) alert(error.message);
    else setFarmData(prev => ({ ...prev, inventory: prev.inventory.filter(i => i.id !== id) }));
  };

  const handleFetchAiInsights = async () => {
    setIsAiLoading(true);
    const insights = await getFarmInsights(farmData);
    setAiInsights(insights);
    setIsAiLoading(false);
  };

  const stats = useMemo(() => {
    const totalIncome = farmData.transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpense = farmData.transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + Number(t.amount), 0);
    const totalBirds = farmData.flocks.reduce((sum, f) => sum + Number(f.currentCount), 0);
    const totalMortality = farmData.flocks.reduce((sum, f) => sum + f.mortalityLogs.reduce((s, m) => s + Number(m.count), 0), 0);
    const initialBirds = farmData.flocks.reduce((sum, f) => sum + Number(f.initialCount), 0);
    const mortalityRate = initialBirds > 0 ? (totalMortality / initialBirds) * 100 : 0;
    const lowStockItems = farmData.inventory.filter(i => Number(i.currentQuantity) < Number(i.minThreshold)).length;
    return { totalIncome, totalExpense, totalBirds, totalMortality, mortalityRate, balance: totalIncome - totalExpense, lowStockItems };
  }, [farmData]);

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-emerald-600" size={48} />
        <p className="text-slate-600 font-bold font-['Hind_Siliguri']">কানেক্ট হচ্ছে...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthView onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-['Hind_Siliguri',_sans-serif]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex no-print">
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
           <div className={`flex items-center justify-center gap-2 text-[10px] font-bold uppercase ${isSyncing ? 'text-blue-600' : 'text-emerald-600'}`}>
             {isSyncing ? <Loader2 size={12} className="animate-spin" /> : <CloudSync size={12} />}
             {isSyncing ? 'Syncing...' : 'Live Connected'}
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-8 relative">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 px-6 md:px-8 flex justify-between items-center no-print">
          <div className="flex items-center gap-3">
            <div className="md:hidden w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white"><Bird size={18} /></div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-slate-800">{TAB_NAMES[activeTab]}</h2>
              <p className="text-[10px] md:text-sm text-slate-600 font-medium md:block hidden">{currentUser.name}</p>
            </div>
          </div>
          <button onClick={() => setActiveTab('profile')} className="w-10 h-10 rounded-full border-2 border-emerald-100 overflow-hidden bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center hover:scale-105 transition-transform shadow-sm">
            {currentUser.profilePic ? <img src={currentUser.profilePic} className="w-full h-full object-cover" /> : currentUser.name.charAt(0)}
          </button>
        </header>

        <div className="p-4 md:p-8 no-print">
          {activeTab === 'dashboard' && <DashboardView farmData={farmData} stats={stats} />}
          {activeTab === 'flocks' && <FlockView farmData={farmData} onAdd={addFlock} onDelete={deleteFlock} onAddWeight={addWeightLog} onAddMortality={addMortalityLog} />}
          {activeTab === 'transactions' && <TransactionView farmData={farmData} onAdd={addTransaction} />}
          {activeTab === 'inventory' && <InventoryView farmData={farmData} onAdd={addInventoryItem} onDelete={deleteInventoryItem} />}
          {activeTab === 'ai' && <AiView loading={isAiLoading} insights={aiInsights} onFetch={handleFetchAiInsights} />}
          {activeTab === 'profile' && (
             <div className="max-w-2xl mx-auto space-y-8">
               <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center">
                 <div className="w-32 h-32 rounded-full border-4 border-emerald-100 overflow-hidden bg-emerald-50 flex items-center justify-center text-emerald-700 text-4xl font-black mb-6">
                    {currentUser.profilePic ? <img src={currentUser.profilePic} className="w-full h-full object-cover" /> : currentUser.name.charAt(0)}
                 </div>
                 <h3 className="text-2xl font-black text-slate-800 mb-1">{currentUser.name}</h3>
                 <p className="text-slate-400 font-bold mb-8 italic">{currentUser.username}</p>
                 <button onClick={handleLogout} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors">
                    <LogOut size={20} /> লগ আউট
                 </button>
               </div>
             </div>
          )}
        </div>
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-xl border border-slate-200 h-16 rounded-2xl shadow-2xl flex items-center justify-around px-2 z-50 no-print">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'dashboard' ? 'text-emerald-600' : 'text-slate-400'}`}><LayoutDashboard size={20} /><span className="text-[10px] font-bold">ড্যাশবোর্ড</span></button>
        <button onClick={() => setActiveTab('flocks')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'flocks' ? 'text-emerald-600' : 'text-slate-400'}`}><Bird size={20} /><span className="text-[10px] font-bold">মুরগি</span></button>
        <button onClick={() => setActiveTab('transactions')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'transactions' ? 'text-emerald-600' : 'text-slate-400'}`}><TrendingUp size={20} /><span className="text-[10px] font-bold">হিসাব</span></button>
        <button onClick={() => setActiveTab('inventory')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'inventory' ? 'text-emerald-600' : 'text-slate-400'}`}><Package size={20} /><span className="text-[10px] font-bold">স্টক</span></button>
        <button onClick={() => setActiveTab('ai')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'ai' ? 'text-emerald-600' : 'text-slate-400'}`}><BrainCircuit size={20} /><span className="text-[10px] font-bold">এআই</span></button>
      </nav>
    </div>
  );
};

const AuthView: React.FC<{ onLogin: (user: UserAccount) => void }> = ({ onLogin }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        if (!form.name || !form.email || !form.password) throw new Error("সবগুলো ঘর পূরণ করুন");
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { full_name: form.name } }
        });
        if (error) throw error;
        if (data.user) {
          onLogin({
            id: data.user.id,
            username: form.email,
            name: form.name
          });
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password
        });
        if (error) throw error;
        if (data.user) {
          onLogin({
            id: data.user.id,
            username: data.user.email || '',
            name: data.user.user_metadata.full_name || 'খামারি'
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-emerald-600 p-6 relative overflow-hidden font-['Hind_Siliguri']">
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-10 relative z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg"><Bird size={40} /></div>
          <h2 className="text-3xl font-black text-slate-800">PoultryPro Cloud</h2>
          <p className="text-slate-400 font-bold mt-1 uppercase text-[10px]">Secure Backend System</p>
        </div>

        {error && <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-center text-sm font-bold">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && <input type="text" placeholder="আপনার পুরো নাম" className="w-full p-4 border rounded-2xl font-bold bg-slate-50 focus:ring-2 ring-emerald-500 outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />}
          <input type="email" placeholder="ইমেইল অ্যাড্রেস" className="w-full p-4 border rounded-2xl font-bold bg-slate-50 focus:ring-2 ring-emerald-500 outline-none" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          <input type="password" placeholder="পাসওয়ার্ড" className="w-full p-4 border rounded-2xl font-bold bg-slate-50 focus:ring-2 ring-emerald-500 outline-none" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
          <button disabled={loading} type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" /> : (isSignup ? 'অ্যাকাউন্ট তৈরি করুন' : 'লগ ইন')}
          </button>
        </form>
        <button onClick={() => setIsSignup(!isSignup)} className="w-full mt-6 text-emerald-600 font-black hover:underline">{isSignup ? 'ইতিমধ্যে অ্যাকাউন্ট আছে? লগ ইন করুন' : 'নতুন অ্যাকাউন্ট খুলতে চান? সাইন আপ করুন'}</button>
      </div>
    </div>
  );
};

const DashboardView: React.FC<{ farmData: FarmState, stats: any }> = ({ stats, farmData }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="মোট মুরগি" value={stats.totalBirds.toLocaleString()} icon={<Bird className="text-blue-500" />} />
      <StatCard title="মৃত্যু" value={stats.totalMortality.toLocaleString()} icon={<Skull className="text-rose-500" />} highlight="text-rose-600" />
      <StatCard title="মৃত্যুর হার" value={`${stats.mortalityRate.toFixed(1)}%`} icon={<AlertTriangle className="text-amber-500" />} />
      <StatCard title="ব্যালেন্স" value={`৳${stats.balance.toLocaleString()}`} icon={<History className="text-emerald-500" />} highlight={stats.balance < 0 ? 'text-rose-600' : 'text-emerald-600'} />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-[400px]">
        <h3 className="font-bold mb-6">ওজন বৃদ্ধির চার্ট</h3>
        <ResponsiveContainer width="100%" height="80%">
          <AreaChart data={farmData.flocks[0]?.weightLogs || []}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={8} />
            <YAxis stroke="#94a3b8" fontSize={8} unit="g" />
            <Tooltip />
            <Area type="monotone" dataKey="averageWeight" stroke="#3b82f6" fill="#3b82f620" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="font-bold mb-6">স্টক অ্যালার্ট</h3>
        <div className="space-y-4">
          {farmData.inventory.filter(i => Number(i.currentQuantity) < Number(i.minThreshold)).map(item => (
            <div key={item.id} className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-3">
              <AlertTriangle className="text-rose-500 shrink-0" />
              <div><p className="font-bold text-slate-800 text-sm">{item.name}</p><p className="text-xs text-rose-600">কম মজুদ: {item.currentQuantity} {item.unit}</p></div>
            </div>
          ))}
          {farmData.inventory.filter(i => Number(i.currentQuantity) < Number(i.minThreshold)).length === 0 && <p className="text-center py-10 opacity-40 font-bold">স্টক পর্যাপ্ত আছে</p>}
        </div>
      </div>
    </div>
  </div>
);

const FlockView: React.FC<{ 
  farmData: FarmState, onAdd: (f: any) => void, onDelete: (id: string) => void, onAddWeight: (id: string, log: any) => void, onAddMortality: (id: string, log: any) => void 
}> = ({ farmData, onAdd, onDelete, onAddWeight, onAddMortality }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [activeLog, setActiveLog] = useState<{ id: string, type: 'weight' | 'mortality' } | null>(null);
  const [form, setForm] = useState({ batchName: '', breed: 'ক্লব ৫০০', initialCount: 0, startDate: new Date().toISOString().split('T')[0] });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h3 className="text-lg font-bold">ব্যাচ ব্যবস্থাপনা</h3><button onClick={() => setIsAdding(!isAdding)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors">{isAdding ? 'বাতিল' : 'নতুন ব্যাচ'}</button></div>
      {isAdding && (
        <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-xl grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top-4">
          <input type="text" placeholder="ব্যাচের নাম" className="p-3 border rounded-xl" value={form.batchName} onChange={e => setForm({...form, batchName: e.target.value})} />
          <input type="number" placeholder="প্রাথমিক সংখ্যা" className="p-3 border rounded-xl" value={form.initialCount || ''} onChange={e => setForm({...form, initialCount: parseInt(e.target.value) || 0})} />
          <input type="date" className="p-3 border rounded-xl" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
          <button onClick={() => { if(!form.batchName) return alert("নাম দিন"); onAdd(form); setIsAdding(false); setForm({batchName:'', breed:'ক্লব ৫০০', initialCount:0, startDate:new Date().toISOString().split('T')[0]}); }} className="bg-emerald-600 text-white rounded-xl font-black hover:bg-emerald-700 transition-colors">সেভ</button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {farmData.flocks.map(flock => (
          <div key={flock.id} className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="p-8 bg-emerald-600 text-white flex justify-between items-center">
              <div><h4 className="text-2xl font-black">{flock.batchName}</h4><p className="opacity-70">{flock.breed}</p></div>
              <div className="flex gap-2">
                <button onClick={() => onDelete(flock.id)} className="p-2 bg-white/10 hover:bg-rose-500 rounded-xl transition-colors"><Trash2 size={16}/></button>
              </div>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-3 text-center mb-8">
                <div><p className="text-xs text-slate-400 font-bold uppercase">বর্তমান</p><p className="text-2xl font-black">{flock.currentCount}</p></div>
                <div><p className="text-xs text-slate-400 font-bold uppercase">মৃত্যু</p><p className="text-2xl font-black text-rose-600">{flock.mortalityLogs?.reduce((s, m) => s + m.count, 0) || 0}</p></div>
                <div><p className="text-xs text-slate-400 font-bold uppercase">ওজন</p><p className="text-2xl font-black text-blue-600">{flock.weightLogs?.length ? `${flock.weightLogs[flock.weightLogs.length-1].averageWeight}g` : '-'}</p></div>
              </div>
              <div className="flex gap-4 justify-center">
                <button onClick={() => setActiveLog({id: flock.id, type: 'weight'})} className="px-6 py-2 border rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors text-sm"><Scale size={16}/> ওজন</button>
                <button onClick={() => setActiveLog({id: flock.id, type: 'mortality'})} className="px-6 py-2 border rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 text-rose-600 transition-colors text-sm"><Skull size={16}/> মৃত্যু</button>
              </div>
              {activeLog?.id === flock.id && (
                <div className="mt-6 p-4 bg-slate-50 rounded-2xl border flex gap-4 animate-in zoom-in-95">
                  <input type="number" placeholder={activeLog.type === 'weight' ? 'ওজন (গ্রাম)' : 'সংখ্যা'} className="flex-1 p-2 border rounded-lg focus:ring-2 ring-emerald-500 outline-none" autoFocus onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const val = parseInt((e.target as HTMLInputElement).value);
                      if (!val) return;
                      if (activeLog.type === 'weight') onAddWeight(flock.id, { date: new Date().toISOString().split('T')[0], averageWeight: val, sampleSize: 10 });
                      else onAddMortality(flock.id, { date: new Date().toISOString().split('T')[0], count: val });
                      setActiveLog(null);
                    }
                  }} />
                  <button onClick={() => setActiveLog(null)} className="p-2 text-slate-400 hover:text-slate-600"><X size={16}/></button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string, value: string, icon: React.ReactNode, highlight?: string }> = ({ title, value, icon, highlight }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-start justify-between">
    <div><p className="text-slate-500 text-[10px] font-black uppercase mb-1 tracking-widest">{title}</p><h4 className={`text-2xl font-black ${highlight || 'text-slate-900'}`}>{value}</h4></div>
    <div className="p-4 bg-slate-50 rounded-2xl">{icon}</div>
  </div>
);

const TransactionView: React.FC<{ farmData: FarmState, onAdd: (t: any) => void }> = ({ farmData, onAdd }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [tx, setTx] = useState({ type: TransactionType.EXPENSE, category: Category.FEED, amount: 0, description: '', date: new Date().toISOString().split('T')[0], flock_id: '' });
  
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
      <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
        <h3 className="font-black text-xl flex items-center gap-3"><History className="text-emerald-600" /> আর্থিক খতিয়ান</h3>
        <button onClick={() => setIsAdding(!isAdding)} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black shadow-lg hover:bg-slate-800 transition-colors">{isAdding ? 'বাতিল' : 'নতুন হিসাব'}</button>
      </div>
      {isAdding && (
        <div className="p-8 bg-slate-50 border-b flex flex-col gap-4 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input type="date" className="p-3 border rounded-xl font-bold" value={tx.date} onChange={e => setTx({...tx, date: e.target.value})} />
            <select className="p-3 border rounded-xl font-bold bg-white" value={tx.type} onChange={e => setTx({...tx, type: e.target.value as any})}>
              <option value={TransactionType.EXPENSE}>ব্যয়</option>
              <option value={TransactionType.INCOME}>আয়</option>
            </select>
            <select className="p-3 border rounded-xl font-bold bg-white" value={tx.category} onChange={e => setTx({...tx, category: e.target.value as any})}>{Object.values(Category).map(c => <option key={c} value={c}>{CATEGORY_NAMES[c]}</option>)}</select>
            <input type="number" placeholder="৳ পরিমাণ" className="p-3 border rounded-xl font-bold" value={tx.amount || ''} onChange={e => setTx({...tx, amount: parseFloat(e.target.value) || 0})} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input type="text" placeholder="বিবরণ" className="p-3 border rounded-xl font-bold md:col-span-2" value={tx.description} onChange={e => setTx({...tx, description: e.target.value})} />
            <select className="p-3 border rounded-xl font-bold bg-white" value={tx.flock_id} onChange={e => setTx({...tx, flock_id: e.target.value})}>
              <option value="">ব্যাচ নির্বাচন (ঐচ্ছিক)</option>
              {farmData.flocks.map(f => <option key={f.id} value={f.id}>{f.batchName}</option>)}
            </select>
            <button onClick={() => { if(!tx.amount) return alert("পরিমাণ দিন"); onAdd(tx); setIsAdding(false); }} className="bg-emerald-600 text-white rounded-xl font-black py-3 hover:bg-emerald-700 transition-colors">সেভ করুন</button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto"><table className="w-full text-left">
        <thead className="bg-slate-50 border-b text-slate-400 text-[10px] font-black uppercase tracking-widest"><tr><th className="px-8 py-6">তারিখ</th><th className="px-8 py-6">বিভাগ</th><th className="px-8 py-6">বিবরণ</th><th className="px-8 py-6 text-right">পরিমাণ</th></tr></thead>
        <tbody className="divide-y divide-slate-100">{farmData.transactions.map(t => {
          const flock = farmData.flocks.find(f => f.id === t.flock_id);
          return (<tr key={t.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-8 py-5 text-slate-500 font-bold text-xs">{t.date}</td>
            <td className="px-8 py-5">
              <div className="flex flex-col gap-1">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black w-fit ${t.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{CATEGORY_NAMES[t.category]}</span>
                {flock && <span className="text-[9px] font-bold text-slate-400 ml-1">{flock.batchName}</span>}
              </div>
            </td>
            <td className="px-8 py-5 text-slate-800 font-bold text-xs">{t.description}</td>
            <td className={`px-8 py-5 text-right font-black ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>{t.type === TransactionType.INCOME ? '+' : '-'}৳{(t.amount || 0).toLocaleString()}</td>
          </tr>)
        })}</tbody>
      </table></div>
    </div>
  );
};

const InventoryView: React.FC<{ farmData: FarmState, onAdd: (item: any) => void, onDelete: (id: string) => void }> = ({ farmData, onAdd, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ name: '', category: Category.FEED, currentQuantity: 0, unit: 'কেজি', minThreshold: 5 });
  
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center"><h3 className="text-lg font-bold">স্টক ও ইনভেন্টরি</h3><button onClick={() => setIsAdding(!isAdding)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors">{isAdding ? 'বাতিল' : 'নতুন আইটেম'}</button></div>
      {isAdding && (
        <div className="bg-white p-8 rounded-[2.5rem] border shadow-xl grid grid-cols-1 md:grid-cols-5 gap-4 animate-in slide-in-from-top-4">
          <input type="text" placeholder="আইটেম নাম" className="p-3 border rounded-xl" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          <select className="p-3 border rounded-xl font-bold bg-white" value={form.category} onChange={e => setForm({...form, category: e.target.value as any})}>
            <option value={Category.FEED}>খাদ্য (ফিড)</option>
            <option value={Category.MEDICINE}>ওষুধ</option>
          </select>
          <input type="number" placeholder="পরিমাণ" className="p-3 border rounded-xl" value={form.currentQuantity || ''} onChange={e => setForm({...form, currentQuantity: parseFloat(e.target.value) || 0})} />
          <input type="number" placeholder="সতর্কতা সীমা" className="p-3 border rounded-xl" value={form.minThreshold || ''} onChange={e => setForm({...form, minThreshold: parseFloat(e.target.value) || 0})} />
          <button onClick={() => { if(!form.name) return alert("নাম দিন"); onAdd(form); setIsAdding(false); setForm({name:'', category:Category.FEED, currentQuantity:0, unit:'কেজি', minThreshold:5}); }} className="bg-emerald-600 text-white rounded-xl font-black hover:bg-emerald-700 transition-colors">সেভ</button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {farmData.inventory.map(item => (
          <div key={item.id} className="bg-white p-8 rounded-[2rem] border shadow-sm relative group hover:shadow-md transition-shadow">
            <button onClick={() => onDelete(item.id)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 bg-rose-50 text-rose-600 rounded-lg transition-all"><Trash2 size={16}/></button>
            <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">{item.category}</p>
            <h4 className="text-2xl font-black text-slate-800 mb-6">{item.name}</h4>
            <div className="flex justify-between items-end">
              <div><p className="text-4xl font-black">{item.currentQuantity}</p><p className="text-xs font-bold text-slate-400">{item.unit}</p></div>
              <div className={`text-xs font-bold px-2 py-1 rounded-lg ${Number(item.currentQuantity) < Number(item.minThreshold) ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>সীমা: {item.minThreshold}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AiView: React.FC<{ loading: boolean, insights: any, onFetch: () => void }> = ({ loading, insights, onFetch }) => (
  <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
    <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-12 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-8"><div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md"><BrainCircuit size={48} className="animate-pulse" /></div><div><h3 className="text-4xl font-black">HenGPT Advisor</h3><p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest">Connected Intelligence</p></div></div>
        <button onClick={onFetch} disabled={loading} className="px-10 py-4 bg-white text-emerald-700 rounded-2xl font-black flex items-center gap-3 shadow-xl disabled:opacity-50 hover:bg-emerald-50 transition-all">
          {loading ? <Loader2 className="animate-spin" /> : <BrainCircuit size={20} />} {loading ? 'বিশ্লেষণ চলছে...' : 'পরামর্শ জেনারেট করুন'}
        </button>
      </div>
    </div>
    {insights && (<div className="space-y-8 animate-in slide-in-from-bottom-8">
      <div className="bg-white p-10 rounded-[2.5rem] border shadow-sm"><h4 className="font-black text-2xl mb-6 flex items-center gap-3 text-emerald-600"><TrendingUp /> সারসংক্ষেপ</h4><p className="text-slate-600 leading-relaxed font-bold text-lg">{insights.summary}</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-rose-50 p-10 rounded-[2rem] border border-rose-100"><h4 className="font-black text-rose-800 mb-6 flex items-center gap-3 text-xl"><AlertTriangle /> সতর্কতা</h4><ul className="space-y-4">{(insights.warnings || []).map((w: string, i: number) => (<li key={i} className="flex gap-4 text-rose-700 font-bold text-base"><div className="w-2 h-2 rounded-full bg-rose-400 mt-2 shrink-0" />{w}</li>))}</ul></div>
        <div className="bg-emerald-50 p-10 rounded-[2rem] border border-emerald-100"><h4 className="font-black text-emerald-800 mb-6 flex items-center gap-3 text-xl"><Check /> পদক্ষেপ</h4><ul className="space-y-4">{(insights.recommendations || []).map((r: string, i: number) => (<li key={i} className="flex gap-4 text-emerald-700 font-bold text-base"><Check size={18} />{r}</li>))}</ul></div>
      </div>
    </div>)}
  </div>
);

export default App;
