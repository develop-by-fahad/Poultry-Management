
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
  Trash2,
  Scale,
  X,
  Loader2,
  Edit2,
  Check,
  AlertCircle,
  User,
  Skull,
  UtensilsCrossed,
  AlertTriangle,
  RefreshCcw,
  Calendar,
  Settings,
  Download,
  Printer,
  Undo2,
  LogIn,
  UserPlus,
  Camera,
  LogOut
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
import { FarmState, TransactionType, Category, Transaction, FlockRecord, InventoryItem, WeightLog, MortalityLog, FeedLog, UserAccount } from './types';
import { getFarmInsights } from './services/geminiService';

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

const ACCOUNTS_KEY = 'poultrypro_accounts_v1';
const AUTH_SESSION_KEY = 'poultrypro_session_v1';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<keyof typeof TAB_NAMES>('dashboard');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [farmData, setFarmData] = useState<FarmState>({
    transactions: [],
    flocks: [],
    inventory: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<any>(null);
  
  // Undo Logic State
  const [undoState, setUndoState] = useState<{
    visible: boolean;
    data: FarmState;
    message: string;
    timer: number | null;
  }>({ visible: false, data: farmData, message: '', timer: null });

  // Load Session and User Data
  useEffect(() => {
    const session = localStorage.getItem(AUTH_SESSION_KEY);
    if (session) {
      const user = JSON.parse(session) as UserAccount;
      setCurrentUser(user);
      loadUserData(user.username);
    }
    setIsLoading(false);
  }, []);

  const loadUserData = (username: string) => {
    const storageKey = `poultrypro_data_${username}`;
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFarmData({
          transactions: parsed.transactions || [],
          flocks: (parsed.flocks || []).map((f: any) => ({
            ...f,
            weightLogs: f.weightLogs || [],
            mortalityLogs: f.mortalityLogs || [],
            feedLogs: f.feedLogs || []
          })),
          inventory: parsed.inventory || []
        });
      } catch (e) {
        console.error("Local data load error", e);
      }
    } else {
      setFarmData({ transactions: [], flocks: [], inventory: [] });
    }
  };

  // Save Data scoped to user
  useEffect(() => {
    if (!isLoading && currentUser) {
      const storageKey = `poultrypro_data_${currentUser.username}`;
      localStorage.setItem(storageKey, JSON.stringify(farmData));
    }
  }, [farmData, isLoading, currentUser]);

  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
    loadUserData(user.username);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_SESSION_KEY);
    setFarmData({ transactions: [], flocks: [], inventory: [] });
  };

  const triggerUndo = (message: string) => {
    if (undoState.timer) clearTimeout(undoState.timer);
    setUndoState(prev => ({
      visible: true,
      data: { ...farmData },
      message: message,
      timer: window.setTimeout(() => {
        setUndoState(u => ({ ...u, visible: false }));
      }, 8000)
    }));
  };

  const handleUndo = () => {
    if (undoState.timer) clearTimeout(undoState.timer);
    setFarmData(undoState.data);
    setUndoState(prev => ({ ...prev, visible: false, timer: null }));
  };

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTx = { ...t, id: 'tx-' + Date.now() };
    setFarmData(prev => ({ ...prev, transactions: [newTx, ...prev.transactions] }));
  };

  const addFlock = (f: Omit<FlockRecord, 'id' | 'weightLogs' | 'mortalityLogs' | 'feedLogs'>) => {
    const newFlock: FlockRecord = { 
      ...f, 
      id: 'flock-' + Date.now(), 
      weightLogs: [], 
      mortalityLogs: [], 
      feedLogs: [] 
    };
    setFarmData(prev => ({ ...prev, flocks: [newFlock, ...prev.flocks] }));
  };

  const updateFlock = (id: string, updates: Partial<FlockRecord>) => {
    setFarmData(prev => ({
      ...prev,
      flocks: prev.flocks.map(f => f.id === id ? { ...f, ...updates } : f)
    }));
  };

  const deleteFlock = (id: string) => {
    triggerUndo("ব্যাচ মুছে ফেলা হয়েছে");
    setFarmData(prev => ({ ...prev, flocks: prev.flocks.filter(f => f.id !== id) }));
  };

  const addWeightLog = (flockId: string, log: Omit<WeightLog, 'id'>) => {
    const newLog = { ...log, id: 'w-' + Date.now(), flock_id: flockId };
    setFarmData(prev => ({
      ...prev,
      flocks: prev.flocks.map(f => f.id === flockId ? { 
        ...f, 
        weightLogs: [...(f.weightLogs || []), newLog] 
      } : f)
    }));
  };

  const addMortalityLog = (flockId: string, log: Omit<MortalityLog, 'id'>) => {
    const deathCount = Number(log.count) || 0;
    const newLog = { ...log, id: 'm-' + Date.now(), flock_id: flockId, count: deathCount };
    setFarmData(prev => ({
      ...prev,
      flocks: prev.flocks.map(f => {
        if (f.id === flockId) {
          const newCurrentCount = Math.max(0, (f.current_count || 0) - deathCount);
          return {
            ...f,
            current_count: newCurrentCount,
            mortalityLogs: [...(f.mortalityLogs || []), newLog]
          };
        }
        return f;
      })
    }));
  };

  const addFeedLog = (flockId: string, log: Omit<FeedLog, 'id'>) => {
    const newLog = { ...log, id: 'f-' + Date.now(), flock_id: flockId };
    const amountInKg = log.unit === 'ব্যাগ' ? Number(log.amount) * 50 : Number(log.amount);
    
    setFarmData(prev => {
      const feedItemIndex = prev.inventory.findIndex(item => 
        item.category === Category.FEED || item.name.includes('খাদ্য') || item.name.toLowerCase().includes('feed')
      );
      let updatedInventory = [...prev.inventory];
      if (feedItemIndex > -1) {
        const item = updatedInventory[feedItemIndex];
        let reduction = item.unit === 'ব্যাগ' ? amountInKg / 50 : amountInKg;
        updatedInventory[feedItemIndex] = {
          ...item,
          current_quantity: Math.max(0, Number(item.current_quantity) - reduction)
        };
      }
      return {
        ...prev,
        inventory: updatedInventory,
        flocks: prev.flocks.map(f => f.id === flockId ? { 
          ...f, 
          feedLogs: [...(f.feedLogs || []), newLog] 
        } : f)
      };
    });
  };

  const addInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
    const newItem = { ...item, id: 'inv-' + Date.now() };
    setFarmData(prev => ({ ...prev, inventory: [newItem, ...prev.inventory] }));
  };

  const updateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
    setFarmData(prev => ({
      ...prev,
      inventory: prev.inventory.map(i => i.id === id ? { ...i, ...updates } : i)
    }));
  };

  const deleteInventoryItem = (id: string) => {
    triggerUndo("ইনভেন্টরি মুছে ফেলা হয়েছে");
    setFarmData(prev => ({ ...prev, inventory: prev.inventory.filter(i => i.id !== id) }));
  };

  // Fix: Added missing resetAppData function to clear farm state
  const resetAppData = () => {
    if (window.confirm("আপনি কি নিশ্চিত যে আপনি সমস্ত ডাটা মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।")) {
      setFarmData({ transactions: [], flocks: [], inventory: [] });
    }
  };

  const handleFetchAiInsights = async () => {
    setIsAiLoading(true);
    const insights = await getFarmInsights(farmData);
    setAiInsights(insights);
    setIsAiLoading(false);
  };

  const stats = useMemo(() => {
    const totalIncome = (farmData.transactions || [])
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const totalExpense = (farmData.transactions || [])
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const totalBirds = (farmData.flocks || []).reduce((sum, f) => sum + Number(f.current_count || 0), 0);
    const initialBirds = (farmData.flocks || []).reduce((sum, f) => sum + Number(f.initial_count || 0), 0);
    const totalMortality = (farmData.flocks || []).reduce((sum, f) => 
      sum + (f.mortalityLogs || []).reduce((s, m) => s + Number(m.count || 0), 0), 0
    );
    const mortalityRate = initialBirds > 0 ? (totalMortality / initialBirds) * 100 : 0;
    const lowStockItems = (farmData.inventory || []).filter(i => Number(i.current_quantity || 0) < Number(i.min_threshold || 0)).length;
    return { totalIncome, totalExpense, totalBirds, totalMortality, mortalityRate, balance: totalIncome - totalExpense, lowStockItems };
  }, [farmData]);

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-emerald-600" size={48} />
        <p className="text-slate-600 font-medium">লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthView onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-['Hind_Siliguri',_sans-serif]">
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
           <p className="text-[10px] text-slate-400 font-bold text-center uppercase">Local Secure Mode</p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto pb-24 md:pb-8 relative">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 px-6 md:px-8 flex justify-between items-center no-print">
          <div className="flex items-center gap-3">
            <div className="md:hidden w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white"><Bird size={18} /></div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-slate-800">{TAB_NAMES[activeTab]}</h2>
              <p className="text-[10px] md:text-sm text-slate-600 font-medium md:block hidden">{currentUser.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveTab('profile')} className="w-10 h-10 rounded-full border-2 border-emerald-100 overflow-hidden bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center hover:scale-105 transition-transform shadow-sm">
              {currentUser.profilePic ? <img src={currentUser.profilePic} className="w-full h-full object-cover" /> : currentUser.name.charAt(0)}
            </button>
          </div>
        </header>

        <div className="p-4 md:p-8 no-print">
          {activeTab === 'dashboard' && <DashboardView farmData={farmData} stats={stats} />}
          {activeTab === 'flocks' && <FlockView farmData={farmData} onAdd={addFlock} onUpdate={updateFlock} onDelete={deleteFlock} onAddWeight={addWeightLog} onAddMortality={addMortalityLog} onAddFeed={addFeedLog} />}
          {activeTab === 'transactions' && <TransactionView farmData={farmData} onAdd={addTransaction} />}
          {activeTab === 'inventory' && <InventoryView farmData={farmData} onAdd={addInventoryItem} onUpdate={updateInventoryItem} onDelete={deleteInventoryItem} />}
          {activeTab === 'ai' && <AiView loading={isAiLoading} insights={aiInsights} onFetch={handleFetchAiInsights} />}
          {activeTab === 'profile' && (
             <div className="max-w-2xl mx-auto space-y-8">
               <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center">
                 <div className="relative mb-6">
                   <div className="w-32 h-32 rounded-full border-4 border-emerald-100 overflow-hidden bg-emerald-50 flex items-center justify-center text-emerald-700 text-4xl font-black shadow-xl">
                    {currentUser.profilePic ? <img src={currentUser.profilePic} className="w-full h-full object-cover" /> : currentUser.name.charAt(0)}
                   </div>
                   <label className="absolute bottom-1 right-1 w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-emerald-50 transition-colors">
                     <Camera size={20} className="text-emerald-600" />
                     <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                       const file = e.target.files?.[0];
                       if (file) {
                         const reader = new FileReader();
                         reader.onloadend = () => {
                           const updatedUser = { ...currentUser, profilePic: reader.result as string };
                           setCurrentUser(updatedUser);
                           localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(updatedUser));
                           const accs = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');
                           const newAccs = accs.map((a: any) => a.username === updatedUser.username ? updatedUser : a);
                           localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(newAccs));
                         };
                         reader.readAsDataURL(file);
                       }
                     }} />
                   </label>
                 </div>
                 <h3 className="text-2xl font-black text-slate-800 mb-1">{currentUser.name}</h3>
                 <p className="text-slate-400 font-bold mb-8 italic">@{currentUser.username}</p>
                 
                 <div className="w-full space-y-4">
                    <button onClick={handleLogout} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors">
                      <LogOut size={20} /> লগ আউট
                    </button>
                    <button onClick={resetAppData} className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors">
                      <Trash2 size={20} /> ডাটা রিসেট করুন
                    </button>
                 </div>
               </div>
             </div>
          )}
        </div>

        {undoState.visible && (
          <div className="fixed bottom-24 md:bottom-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 z-[60] animate-in slide-in-from-bottom-4 no-print">
            <AlertCircle className="text-amber-400" size={20} />
            <span className="font-bold text-sm">{undoState.message}</span>
            <button onClick={handleUndo} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg font-black text-xs flex items-center gap-2 transition-colors">
              <Undo2 size={14} /> ফিরিয়ে আনুন
            </button>
          </div>
        )}
      </main>

      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-xl border border-slate-200 h-16 rounded-2xl shadow-2xl flex items-center justify-around px-2 z-50 no-print">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'dashboard' ? 'text-emerald-600 scale-110' : 'text-slate-400'}`}>
          <LayoutDashboard size={20} />
          <span className="text-[10px] font-bold">{TAB_NAMES.dashboard}</span>
        </button>
        <button onClick={() => setActiveTab('flocks')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'flocks' ? 'text-emerald-600 scale-110' : 'text-slate-400'}`}>
          <Bird size={20} />
          <span className="text-[10px] font-bold">{TAB_NAMES.flocks}</span>
        </button>
        <button onClick={() => setActiveTab('transactions')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'transactions' ? 'text-emerald-600 scale-110' : 'text-slate-400'}`}>
          <TrendingUp size={20} />
          <span className="text-[10px] font-bold">{TAB_NAMES.transactions}</span>
        </button>
        <button onClick={() => setActiveTab('inventory')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'inventory' ? 'text-emerald-600 scale-110' : 'text-slate-400'}`}>
          <Package size={20} />
          <span className="text-[10px] font-bold">{TAB_NAMES.inventory}</span>
        </button>
        <button onClick={() => setActiveTab('ai')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'ai' ? 'text-emerald-600 scale-110' : 'text-slate-400'}`}>
          <BrainCircuit size={20} />
          <span className="text-[10px] font-bold">{TAB_NAMES.ai}</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'profile' ? 'text-emerald-600 scale-110' : 'text-slate-400'}`}>
          <Settings size={20} />
          <span className="text-[10px] font-bold">{TAB_NAMES.profile}</span>
        </button>
      </nav>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white; }
          main { overflow: visible !important; height: auto !important; }
        }
        .print-only { display: none; }
      `}</style>
    </div>
  );
};

const AuthView: React.FC<{ onLogin: (user: UserAccount) => void }> = ({ onLogin }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', name: '', profilePic: '' });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]') as UserAccount[];
    
    if (isSignup) {
      if (!form.username || !form.password || !form.name) {
        setError('সবগুলো ঘর পূরণ করুন');
        return;
      }
      if (accounts.find(a => a.username === form.username)) {
        setError('এই ইউজারনেমটি ইতিমধ্যে ব্যবহৃত হয়েছে');
        return;
      }
      const newUser = { ...form };
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...accounts, newUser]));
      onLogin(newUser);
    } else {
      const user = accounts.find(a => a.username === form.username && a.password === form.password);
      if (user) {
        onLogin(user);
      } else {
        setError('ইউজারনেম বা পাসওয়ার্ড ভুল');
      }
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-emerald-600 p-6 relative overflow-hidden font-['Hind_Siliguri']">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/10 rounded-full blur-3xl animate-pulse"></div>
      
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-10 relative z-10 animate-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg"><Bird size={40} /></div>
          <h2 className="text-3xl font-black text-slate-800">PoultryPro AI</h2>
          <p className="text-slate-400 font-bold mt-1 uppercase tracking-widest text-[10px]">Farm Management Secure Login</p>
        </div>

        {error && <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-center text-sm font-bold flex items-center justify-center gap-2"><AlertTriangle size={16} /> {error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <>
              <div className="flex justify-center mb-4">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-emerald-50 flex items-center justify-center text-slate-300 overflow-hidden cursor-pointer">
                    {form.profilePic ? <img src={form.profilePic} className="w-full h-full object-cover" /> : <User size={40} />}
                  </div>
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-emerald-700">
                    <Camera size={16} />
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setForm({...form, profilePic: reader.result as string});
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </label>
                </div>
              </div>
              <input type="text" placeholder="আপনার পুরো নাম" className="w-full p-4 border rounded-2xl font-bold bg-slate-50 focus:ring-2 ring-emerald-100" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </>
          )}
          <input type="text" placeholder="ইউজারনেম" className="w-full p-4 border rounded-2xl font-bold bg-slate-50 focus:ring-2 ring-emerald-100" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
          <input type="password" placeholder="পাসওয়ার্ড" className="w-full p-4 border rounded-2xl font-bold bg-slate-50 focus:ring-2 ring-emerald-100" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
          
          <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
            {isSignup ? <><UserPlus size={20} /> একাউন্ট তৈরি করুন</> : <><LogIn size={20} /> লগ ইন</>}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button onClick={() => setIsSignup(!isSignup)} className="text-emerald-600 font-black hover:underline">
            {isSignup ? 'ইতিমধ্যে একাউন্ট আছে? লগ ইন করুন' : 'নতুন একাউন্ট খুলতে চান? সাইন আপ করুন'}
          </button>
        </div>
      </div>
    </div>
  );
};

const DashboardView: React.FC<{ farmData: FarmState, stats: any }> = ({ farmData, stats }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <StatCard title="মোট মুরগি" value={(stats.totalBirds || 0).toLocaleString()} icon={<Bird className="text-blue-500" />} />
      <StatCard title="মোট মৃত্যু" value={(stats.totalMortality || 0).toLocaleString()} icon={<Skull className="text-rose-500" />} highlight="text-rose-600" />
      <StatCard title="মৃত্যুর হার" value={`${(stats.mortalityRate || 0).toFixed(1)}%`} icon={<AlertTriangle className="text-amber-500" />} />
      <StatCard title="ব্যালেন্স" value={`৳${(stats.balance || 0).toLocaleString()}`} icon={<History className="text-amber-500" />} highlight={stats.balance < 0 ? 'text-rose-600' : 'text-emerald-600'} />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-3xl border border-slate-200 shadow-sm h-[300px] md:h-[400px]">
        <h3 className="font-bold text-slate-800 mb-6">ওজন বৃদ্ধির গতিপথ</h3>
        <ResponsiveContainer width="100%" height="80%">
          <AreaChart data={(farmData.flocks && farmData.flocks[0]?.weightLogs) || []}>
            <defs>
              <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={8} />
            <YAxis stroke="#94a3b8" fontSize={8} unit="g" />
            <Tooltip />
            <Area type="monotone" dataKey="average_weight" stroke="#3b82f6" fillOpacity={1} fill="url(#colorWeight)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white p-4 md:p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-6">স্টক অ্যালার্ট</h3>
        <div className="space-y-4">
          {(farmData.inventory || []).filter(i => Number(i.current_quantity || 0) < Number(i.min_threshold || 0)).map(item => (
            <div key={item.id} className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-3">
              <AlertTriangle className="text-rose-500 shrink-0" />
              <div>
                <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                <p className="text-xs text-rose-600">কম মজুদ: {item.current_quantity} {item.unit}</p>
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
  const [activeLogFlockId, setActiveLogFlockId] = useState<{ id: string, type: 'weight' | 'mortality' | 'feed' } | null>(null);
  const [formState, setFormState] = useState({ batch_name: '', breed: 'ক্লব ৫০০', initial_count: 0, current_count: 0, start_date: new Date().toISOString().split('T')[0] });
  const [weightForm, setWeightForm] = useState({ average_weight: 0, sample_size: 10, date: new Date().toISOString().split('T')[0] });
  const [mortalityForm, setMortalityForm] = useState({ count: 0, reason: '', date: new Date().toISOString().split('T')[0] });
  const [feedForm, setFeedForm] = useState({ amount: 0, unit: 'কেজি', date: new Date().toISOString().split('T')[0] });

  const handlePrintReport = (flock: FlockRecord) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const batchTransactions = farmData.transactions.filter(t => t.flock_id === flock.id);
    const feedCost = batchTransactions.filter(t => t.category === Category.FEED).reduce((sum, t) => sum + Number(t.amount), 0);
    const medCost = batchTransactions.filter(t => t.category === Category.MEDICINE).reduce((sum, t) => sum + Number(t.amount), 0);
    const otherCosts = batchTransactions.filter(t => t.type === TransactionType.EXPENSE && t.category !== Category.FEED && t.category !== Category.MEDICINE).reduce((sum, t) => sum + Number(t.amount), 0);
    const income = batchTransactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + Number(t.amount), 0);
    const totalDied = flock.mortalityLogs.reduce((sum, m) => sum + Number(m.count), 0);
    printWindow.document.write(`<html><head><title>রিপোর্ট - ${flock.batch_name}</title><style>body { font-family: 'Hind Siliguri', sans-serif; padding: 40px; color: #333; line-height: 1.6; } h1 { color: #059669; border-bottom: 3px solid #059669; padding-bottom: 10px; } .section { margin-bottom: 30px; } .section-title { font-weight: bold; font-size: 1.2em; border-left: 5px solid #059669; padding-left: 10px; margin-bottom: 15px; background: #f0fdf4; padding-top: 5px; padding-bottom: 5px; } table { width: 100%; border-collapse: collapse; margin-top: 10px; } th, td { border: 1px solid #ddd; padding: 12px; text-align: left; } th { background-color: #f9fafb; font-weight: bold; } .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; } .stat-box { border: 1px solid #e5e7eb; padding: 15px; border-radius: 10px; } .total { font-weight: 900; color: #059669; }</style><link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;700&display=swap" rel="stylesheet"></head><body><h1>ব্যাচ রিপোর্ট: ${flock.batch_name}</h1><p>তৈরির তারিখ: ${new Date().toLocaleDateString('bn-BD')}</p><div class="section"><div class="section-title">প্রাথমিক তথ্য</div><div class="grid"><div class="stat-box"><strong>জাত:</strong> ${flock.breed}</div><div class="stat-box"><strong>শুরুর তারিখ:</strong> ${flock.start_date}</div><div class="stat-box"><strong>মোট মুরগি (শুরু):</strong> ${flock.initial_count}</div><div class="stat-box"><strong>বর্তমান মুরগি:</strong> ${flock.current_count}</div><div class="stat-box" style="color: #e11d48"><strong>মোট মৃত মুরগি:</strong> ${totalDied}</div></div></div><div class="section"><div class="section-title">আর্থিক হিসাব (এই ব্যাচের জন্য)</div><table><tr><th>বিবরণ</th><th>পরিমাণ (৳)</th></tr><tr><td>খাদ্য খরচ</td><td>${feedCost.toLocaleString()}</td></tr><tr><td>ওষুধ খরচ</td><td>${medCost.toLocaleString()}</td></tr><tr><td>অন্যান্য খরচ</td><td>${otherCosts.toLocaleString()}</td></tr><tr style="background: #f8fafc"><td><strong>মোট ব্যয়</strong></td><td><strong>${(feedCost + medCost + otherCosts).toLocaleString()}</strong></td></tr><tr><td><strong>মোট আয় (বিক্রয়)</strong></td><td><strong class="total">${income.toLocaleString()}</strong></td></tr><tr style="background: #ecfdf5"><td><strong>নেট লাভ/ক্ষতি</strong></td><td><strong class="${income - (feedCost + medCost + otherCosts) >= 0 ? 'total' : ''}" style="color: ${income - (feedCost + medCost + otherCosts) >= 0 ? '#059669' : '#e11d48'}">${(income - (feedCost + medCost + otherCosts)).toLocaleString()}</strong></td></tr></table></div><footer style="margin-top: 50px; text-align: center; font-size: 0.8em; color: #999;">তৈরি করেছে PoultryPro AI খামার ব্যবস্থাপনা সিস্টেম</footer></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">ব্যাচ ব্যবস্থাপনা</h3>
        <button onClick={() => setIsAdding(!isAdding)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-lg">{isAdding ? 'বাতিল' : <><Plus size={18} /> নতুন</>}</button>
      </div>
      {isAdding && (
        <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input type="text" placeholder="ব্যাচের নাম" className="w-full p-3 border rounded-xl" value={formState.batch_name} onChange={e => setFormState({...formState, batch_name: e.target.value})} />
            <input type="text" placeholder="জাত" className="w-full p-3 border rounded-xl" value={formState.breed} onChange={e => setFormState({...formState, breed: e.target.value})} />
            <input type="number" placeholder="শুরুর সংখ্যা" className="w-full p-3 border rounded-xl" value={formState.initial_count || ''} onChange={e => { const v = parseInt(e.target.value) || 0; setFormState({...formState, initial_count: v, current_count: v}); }} />
            <input type="date" className="w-full p-3 border rounded-xl" value={formState.start_date} onChange={e => setFormState({...formState, start_date: e.target.value})} />
          </div>
          <button onClick={() => { onAdd(formState); setIsAdding(false); setFormState({ batch_name: '', breed: 'ক্লব ৫০০', initial_count: 0, current_count: 0, start_date: new Date().toISOString().split('T')[0] }); }} className="mt-6 px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold w-full md:w-auto">সেভ করুন</button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {(farmData.flocks || []).map(flock => (
          <div key={flock.id} className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all group/card">
            <div className="p-6 md:p-8 bg-emerald-600 text-white flex justify-between items-start">
               <div><h4 className="text-2xl md:text-3xl font-black">{flock.batch_name}</h4><p className="text-emerald-100 mt-1 text-sm">{flock.breed} • {flock.start_date}</p></div>
               <div className="flex gap-2">
                 <button onClick={() => handlePrintReport(flock)} title="রিপোর্ট ডাউনলোড/প্রিন্ট" className="p-2 bg-white/20 hover:bg-white/40 rounded-xl transition-colors flex items-center gap-2"><Printer size={16} /> <span className="text-[10px] font-bold md:block hidden">রিপোর্ট</span></button>
                 <button onClick={() => onDelete(flock.id)} className="p-2 bg-white/10 hover:bg-rose-500 rounded-xl"><Trash2 size={16} /></button>
               </div>
            </div>
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6 md:mb-8">
                <div className="text-center"><p className="text-[8px] md:text-xs font-bold text-slate-400 uppercase">বর্তমান</p><p className="text-lg md:text-2xl font-black text-slate-800">{flock.current_count || 0}</p></div>
                <div className="text-center"><p className="text-[8px] md:text-xs font-bold text-slate-400 uppercase">মৃত্যু</p><p className="text-lg md:text-2xl font-black text-rose-600">{(flock.mortalityLogs || []).reduce((s, m) => s + Number(m.count || 0), 0)}</p></div>
                <div className="text-center"><p className="text-[8px] md:text-xs font-bold text-slate-400 uppercase">ওজন (গড়)</p><p className="text-lg md:text-2xl font-black text-blue-600">{(flock.weightLogs && flock.weightLogs.length > 0) ? `${flock.weightLogs[flock.weightLogs.length - 1].average_weight}g` : '-'}</p></div>
              </div>
              {activeLogFlockId?.id === flock.id ? (
                <div className="bg-slate-50 p-4 md:p-6 rounded-3xl border border-emerald-100 animate-in zoom-in-95">
                  <div className="flex justify-between items-center mb-4"><h5 className="font-bold text-emerald-800 text-sm">{activeLogFlockId.type === 'weight' ? 'ওজন রেকর্ড' : activeLogFlockId.type === 'mortality' ? 'মৃত্যু রেকর্ড' : 'খাদ্য রেকর্ড'}</h5><button onClick={() => setActiveLogFlockId(null)}><X size={16} /></button></div>
                  {activeLogFlockId.type === 'weight' && (<div className="space-y-3"><input type="number" placeholder="ওজন (গ্রাম)" className="w-full p-3 border rounded-xl" value={weightForm.average_weight || ''} onChange={e => setWeightForm({...weightForm, average_weight: parseInt(e.target.value) || 0})} /><input type="date" className="w-full p-3 border rounded-xl font-bold" value={weightForm.date} onChange={e => setWeightForm({...weightForm, date: e.target.value})} /><button onClick={() => { onAddWeight(flock.id, weightForm); setActiveLogFlockId(null); }} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">সংরক্ষণ করুন</button></div>)}
                  {activeLogFlockId.type === 'mortality' && (<div className="space-y-3"><input type="number" placeholder="সংখ্যা" className="w-full p-3 border rounded-xl" value={mortalityForm.count || ''} onChange={e => setMortalityForm({...mortalityForm, count: parseInt(e.target.value) || 0})} /><input type="date" className="w-full p-3 border rounded-xl font-bold" value={mortalityForm.date} onChange={e => setMortalityForm({...mortalityForm, date: e.target.value})} /><button onClick={() => { onAddMortality(flock.id, mortalityForm); setActiveLogFlockId(null); }} className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold">সংরক্ষণ করুন</button></div>)}
                  {activeLogFlockId.type === 'feed' && (<div className="space-y-3"><div className="flex gap-2"><input type="number" placeholder="পরিমাণ" className="flex-1 p-3 border rounded-xl" value={feedForm.amount || ''} onChange={e => setFeedForm({...feedForm, amount: parseFloat(e.target.value) || 0})} /><select className="p-3 border rounded-xl font-bold bg-white" value={feedForm.unit} onChange={e => setFeedForm({...feedForm, unit: e.target.value})}><option value="কেজি">কেজি</option><option value="ব্যাগ">ব্যাগ</option></select></div><input type="date" className="w-full p-3 border rounded-xl font-bold" value={feedForm.date} onChange={e => setFeedForm({...feedForm, date: e.target.value})} /><button onClick={() => { onAddFeed(flock.id, feedForm); setActiveLogFlockId(null); }} className="w-full py-3 bg-amber-500 text-white rounded-xl font-bold">সংরক্ষণ করুন</button></div>)}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 md:gap-3">
                  <button onClick={() => setActiveLogFlockId({ id: flock.id, type: 'weight' })} className="flex flex-col items-center p-3 md:p-4 border rounded-2xl hover:bg-slate-50 transition-colors"><Scale size={18} className="text-blue-500 mb-1" /><span className="text-[10px] font-bold">ওজন</span></button>
                  <button onClick={() => setActiveLogFlockId({ id: flock.id, type: 'mortality' })} className="flex flex-col items-center p-3 md:p-4 border rounded-2xl hover:bg-slate-50 transition-colors"><Skull size={18} className="text-rose-500 mb-1" /><span className="text-[10px] font-bold">মৃত্যু</span></button>
                  <button onClick={() => setActiveLogFlockId({ id: flock.id, type: 'feed' })} className="flex flex-col items-center p-3 md:p-4 border rounded-2xl hover:bg-slate-50 transition-colors"><UtensilsCrossed size={18} className="text-amber-500 mb-1" /><span className="text-[10px] font-bold">খাদ্য</span></button>
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
  <div className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm flex items-start justify-between transition-transform active:scale-95">
    <div><p className="text-slate-500 text-[8px] md:text-[10px] font-black mb-1 uppercase tracking-widest">{title}</p><h4 className={`text-lg md:text-2xl font-black ${highlight || 'text-slate-900'}`}>{value}</h4></div>
    <div className="p-2 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl shrink-0">{icon}</div>
  </div>
);

const TransactionView: React.FC<{ farmData: FarmState, onAdd: (t: any) => void }> = ({ farmData, onAdd }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTx, setNewTx] = useState({ type: TransactionType.EXPENSE, category: Category.FEED, amount: 0, description: '', date: new Date().toISOString().split('T')[0], flock_id: '' });
  return (
    <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
      <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50/50 gap-4"><h3 className="font-black text-slate-800 text-xl flex items-center gap-3"><History className="text-emerald-600" /> আর্থিক খতিয়ান</h3><button onClick={() => setIsAdding(!isAdding)} className="w-full md:w-auto px-6 py-3 bg-slate-900 text-white rounded-2xl font-black shadow-lg">{isAdding ? 'বাতিল' : <><Plus size={18} /> নতুন হিসাব</>}</button></div>
      {isAdding && (
        <div className="p-6 md:p-8 bg-slate-50 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top-2"><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">তারিখ</label><input type="date" className="w-full p-3 border rounded-xl font-bold bg-white" value={newTx.date} onChange={(e) => setNewTx({...newTx, date: e.target.value})} /></div><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">টাইপ</label><select value={newTx.type} onChange={(e) => setNewTx({...newTx, type: e.target.value as any})} className="w-full p-3 border rounded-xl font-bold bg-white"><option value={TransactionType.INCOME}>আয়</option><option value={TransactionType.EXPENSE}>ব্যয়</option></select></div><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">বিভাগ</label><select value={newTx.category} onChange={(e) => setNewTx({...newTx, category: e.target.value as any})} className="w-full p-3 border rounded-xl font-bold bg-white">{Object.values(Category).map(c => <option key={c} value={c}>{CATEGORY_NAMES[c]}</option>)}</select></div><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">সংশ্লিষ্ট ব্যাচ (ঐচ্ছিক)</label><select value={newTx.flock_id} onChange={(e) => setNewTx({...newTx, flock_id: e.target.value})} className="w-full p-3 border rounded-xl font-bold bg-white"><option value="">কোনটিই নয়</option>{farmData.flocks.map(f => <option key={f.id} value={f.id}>{f.batch_name}</option>)}</select></div><div className="space-y-1 lg:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">পরিমাণ</label><input type="number" placeholder="পরিমাণ" className="w-full p-3 border rounded-xl font-bold" value={newTx.amount || ''} onChange={(e) => setNewTx({...newTx, amount: Number(e.target.value)})} /></div><div className="space-y-1 lg:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">বিবরণ</label><input type="text" placeholder="বিবরণ" className="w-full p-3 border rounded-xl font-bold" value={newTx.description} onChange={(e) => setNewTx({...newTx, description: e.target.value})} /></div><div className="flex items-end lg:col-start-4"><button onClick={() => { onAdd(newTx); setIsAdding(false); }} className="w-full bg-emerald-600 text-white rounded-xl font-black py-3 hover:bg-emerald-700 shadow-md">সেভ</button></div></div>
      )}
      <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest"><tr><th className="px-6 md:px-8 py-4 md:py-6 whitespace-nowrap">তারিখ</th><th className="px-6 md:px-8 py-4 md:py-6 whitespace-nowrap">বিভাগ/ব্যাচ</th><th className="px-6 md:px-8 py-4 md:py-6">বিবরণ</th><th className="px-6 md:px-8 py-4 md:py-6 text-right whitespace-nowrap">পরিমাণ</th></tr></thead><tbody className="divide-y divide-slate-100">{farmData.transactions.map(t => { const flock = farmData.flocks.find(f => f.id === t.flock_id); return (<tr key={t.id} className="hover:bg-slate-50 transition-colors"><td className="px-6 md:px-8 py-4 md:py-5 text-slate-500 font-bold text-xs whitespace-nowrap">{t.date}</td><td className="px-6 md:px-8 py-4 md:py-5"><div className="flex flex-col gap-1"><span className={`px-2 md:px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-tighter shadow-sm whitespace-nowrap w-fit ${t.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{CATEGORY_NAMES[t.category]}</span>{flock && <span className="text-[9px] font-bold text-slate-400 ml-1">{flock.batch_name}</span>}</div></td><td className="px-6 md:px-8 py-4 md:py-5 text-slate-800 font-bold text-xs">{t.description}</td><td className={`px-6 md:px-8 py-4 md:py-5 text-right font-black text-sm md:text-base whitespace-nowrap ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>{t.type === TransactionType.INCOME ? '+' : '-'}৳{(t.amount || 0).toLocaleString()}</td></tr>); })}</tbody></table></div>
    </div>
  );
};

const InventoryView: React.FC<{ farmData: FarmState, onAdd: (item: any) => void, onUpdate: (id: string, item: any) => void, onDelete: (id: string) => void }> = ({ farmData, onAdd, onUpdate, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState({ name: '', category: Category.FEED, current_quantity: 0, unit: 'কেজি', min_threshold: 5 });
  const resetForm = () => { setFormState({ name: '', category: Category.FEED, current_quantity: 0, unit: 'কেজি', min_threshold: 5 }); setIsAdding(false); setEditingId(null); };
  const handleEdit = (item: InventoryItem) => { setFormState({ name: item.name, category: item.category, current_quantity: item.current_quantity, unit: item.unit, min_threshold: item.min_threshold }); setEditingId(item.id); setIsAdding(true); };
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center"><h3 className="text-lg font-bold text-slate-800">স্টক ও ইনভেন্টরি</h3><button onClick={() => { if (isAdding) resetForm(); else setIsAdding(true); }} className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-all">{isAdding ? 'বাতিল' : <><Plus size={18} /> নতুন</>}</button></div>
      {isAdding && (
        <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 shadow-xl animate-in slide-in-from-top-4"><h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">{editingId ? <Edit2 size={20} className="text-emerald-600" /> : <Plus size={20} className="text-emerald-600" />}{editingId ? 'ইনভেন্টরি এডিট' : 'নতুন ইনভেন্টরি'}</h4><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">আইটেম নাম</label><input type="text" className="w-full p-3 border rounded-xl font-bold" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} /></div><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">বিভাগ</label><select className="w-full p-3 border rounded-xl font-bold bg-white" value={formState.category} onChange={e => setFormState({...formState, category: e.target.value as any})}><option value={Category.FEED}>ফিড</option><option value={Category.MEDICINE}>ওষুধ</option></select></div><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">পরিমাণ</label><input type="number" className="w-full p-3 border rounded-xl font-bold" value={formState.current_quantity || ''} onChange={e => setFormState({...formState, current_quantity: parseFloat(e.target.value) || 0})} /></div><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">একক</label><select className="w-full p-3 border rounded-xl font-bold bg-white" value={formState.unit} onChange={e => setFormState({...formState, unit: e.target.value})}><option value="কেজি">কেজি</option><option value="ব্যাগ">ব্যাগ (৫০ কেজি)</option><option value="বোতল">বোতল</option><option value="প্যাকেট">প্যাকেট</option></select></div><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">সতর্কতা সীমা</label><input type="number" className="w-full p-3 border rounded-xl font-bold" value={formState.min_threshold || ''} onChange={e => setFormState({...formState, min_threshold: parseFloat(e.target.value) || 0})} /></div></div><div className="mt-6 flex gap-3"><button onClick={() => { if (editingId) onUpdate(editingId, formState); else onAdd(formState); resetForm(); }} className="flex-1 md:flex-none px-8 py-3 bg-emerald-600 text-white rounded-xl font-black shadow-md hover:bg-emerald-700">{editingId ? 'আপডেট' : 'সংরক্ষণ'}</button><button onClick={resetForm} className="flex-1 md:flex-none px-8 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">বাতিল</button></div></div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">{farmData.inventory.map(item => (<div key={item.id} className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all"><div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleEdit(item)} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"><Edit2 size={16} /></button><button onClick={() => onDelete(item.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100"><Trash2 size={16} /></button></div>{Number(item.current_quantity || 0) < Number(item.min_threshold || 0) && (<div className="absolute top-0 left-0 px-3 py-1.5 bg-rose-500 text-white text-[8px] font-black uppercase rounded-br-2xl flex items-center gap-1.5 shadow-md"><AlertTriangle size={10} /> Low Stock</div>)}<p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 mt-4">{item.category}</p><h4 className="text-xl md:text-2xl font-black text-slate-800 mb-6">{item.name}</h4><div className="flex justify-between items-end"><div><p className="text-3xl md:text-4xl font-black text-slate-900">{parseFloat(Number(item.current_quantity || 0).toFixed(2))}</p><p className="text-[10px] md:text-xs font-bold text-slate-400 mt-1 uppercase">{item.unit}</p></div><div className="text-right opacity-60"><p className="text-[8px] md:text-[9px] font-black uppercase mb-1">সতর্কতা সীমা</p><p className="text-xs md:text-sm font-black text-slate-700">{item.min_threshold || 0} {item.unit}</p></div></div></div>))}</div>
    </div>
  );
};

const AiView: React.FC<{ loading: boolean, insights: any, onFetch: () => void }> = ({ loading, insights, onFetch }) => (
  <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700"><div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] text-white shadow-2xl relative overflow-hidden"><div className="relative z-10"><div className="flex items-center gap-4 mb-8"><div className="p-3 md:p-4 bg-white/20 rounded-2xl backdrop-blur-md"><BrainCircuit size={32} className="md:w-12 md:h-12 animate-pulse" /></div><div><h3 className="text-2xl md:text-4xl font-black">HenGPT উপদেষ্টা</h3><p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest">AI Strategic Poultry Guide</p></div></div><button onClick={onFetch} disabled={loading} className="w-full md:w-auto px-10 py-4 bg-white text-emerald-700 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl disabled:opacity-50 hover:bg-emerald-50 transition-all">{loading ? <Loader2 className="animate-spin" /> : <BrainCircuit size={20} />}{loading ? 'বিশ্লেষণ চলছে...' : 'পরামর্শ জেনারেট করুন'}</button></div></div>{insights && (<div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-6 md:space-y-8"><div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm"><h4 className="font-black text-slate-800 mb-4 md:mb-6 flex items-center gap-3 text-xl md:text-2xl"><TrendingUp className="text-emerald-500" /> সারসংক্ষেপ</h4><p className="text-slate-600 leading-relaxed font-bold text-base md:text-lg">{insights.summary}</p></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8"><div className="bg-rose-50 p-6 md:p-10 rounded-[2rem] border border-rose-100"><h4 className="font-black text-rose-800 mb-4 md:mb-6 flex items-center gap-3 text-lg md:text-xl"><AlertTriangle /> ঝুঁকি ও সতর্কতা</h4><ul className="space-y-4">{(insights.warnings || []).map((w: string, i: number) => (<li key={i} className="flex gap-4 text-rose-700 font-bold text-sm md:text-base"><div className="w-2 h-2 rounded-full bg-rose-400 mt-2 shrink-0" />{w}</li>))}</ul></div><div className="bg-emerald-50 p-6 md:p-10 rounded-[2rem] border border-emerald-100"><h4 className="font-black text-emerald-800 mb-4 md:mb-6 flex items-center gap-3 text-lg md:text-xl"><Check /> প্রয়োজনীয় পদক্ষেপ</h4><ul className="space-y-4">{(insights.recommendations || []).map((r: string, i: number) => (<li key={i} className="flex gap-4 text-emerald-700 font-bold text-sm md:text-base"><Check className="text-emerald-500 shrink-0" size={18} />{r}</li>))}</ul></div></div></div>)}</div>
);

export default App;
