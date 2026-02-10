
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
  RefreshCcw
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
  profile: 'সেটিংস'
};

const STORAGE_KEY = 'poultrypro_local_v1';
const PROFILE_KEY = 'poultrypro_profile_v1';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<keyof typeof TAB_NAMES>('dashboard');
  const [farmData, setFarmData] = useState<FarmState>({
    transactions: [],
    flocks: [],
    inventory: []
  });
  const [userProfile, setUserProfile] = useState({ 
    name: 'খামারি', 
    gender: 'male', 
    avatar_url: null 
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<any>(null);

  // Load Data
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    const savedProfile = localStorage.getItem(PROFILE_KEY);
    
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
    }
    
    if (savedProfile) {
      try {
        setUserProfile(JSON.parse(savedProfile));
      } catch (e) {}
    }
    
    setIsLoading(false);
  }, []);

  // Save Data
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(farmData));
    }
  }, [farmData, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(userProfile));
    }
  }, [userProfile, isLoading]);

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
      // Find the feed item in inventory to subtract from
      const feedItemIndex = prev.inventory.findIndex(item => 
        item.category === Category.FEED || item.name.includes('খাদ্য') || item.name.toLowerCase().includes('feed')
      );
      
      let updatedInventory = [...prev.inventory];
      
      if (feedItemIndex > -1) {
        const item = updatedInventory[feedItemIndex];
        let reduction = 0;
        
        // Logic: 1 Bag = 50 KG
        // If the inventory item unit is "Bags", convert consumption KG to bags
        if (item.unit === 'ব্যাগ') {
          reduction = amountInKg / 50;
        } else {
          // If inventory unit is KG or something else, subtract directly in KG
          reduction = amountInKg;
        }
        
        updatedInventory[feedItemIndex] = {
          ...item,
          current_quantity: Math.max(0, Number(item.current_quantity) - reduction)
        };
      } else {
        console.warn("No feed item found in inventory to sync consumption.");
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
    setFarmData(prev => ({ ...prev, inventory: prev.inventory.filter(i => i.id !== id) }));
  };

  const handleFetchAiInsights = async () => {
    setIsAiLoading(true);
    const insights = await getFarmInsights(farmData);
    setAiInsights(insights);
    setIsAiLoading(false);
  };

  const resetAppData = () => {
    if (confirm("আপনি কি নিশ্চিতভাবে সব ডাটা মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।")) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(PROFILE_KEY);
      window.location.reload();
    }
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

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-emerald-600" size={48} />
        <p className="text-slate-600 font-medium">লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-['Hind_Siliguri',_sans-serif]">
      {/* Sidebar */}
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
           <p className="text-[10px] text-slate-400 font-bold text-center uppercase">Local Offline Mode</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 px-8 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{TAB_NAMES[activeTab]}</h2>
            <p className="text-sm text-slate-600 font-medium">{userProfile.name}</p>
          </div>
          <button onClick={() => setActiveTab('profile')} className="w-10 h-10 rounded-full border-2 overflow-hidden bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center hover:scale-105 transition-transform">
            {userProfile.name.charAt(0)}
          </button>
        </header>

        <div className="p-8">
          {activeTab === 'dashboard' && <DashboardView farmData={farmData} stats={stats} />}
          {activeTab === 'flocks' && <FlockView farmData={farmData} onAdd={addFlock} onUpdate={updateFlock} onDelete={deleteFlock} onAddWeight={addWeightLog} onAddMortality={addMortalityLog} onAddFeed={addFeedLog} />}
          {activeTab === 'transactions' && <TransactionView farmData={farmData} onAdd={addTransaction} />}
          {activeTab === 'inventory' && <InventoryView farmData={farmData} onAdd={addInventoryItem} onUpdate={updateInventoryItem} onDelete={deleteInventoryItem} />}
          {activeTab === 'ai' && <AiView loading={isAiLoading} insights={aiInsights} onFetch={handleFetchAiInsights} />}
          {activeTab === 'profile' && (
             <div className="max-w-2xl mx-auto space-y-8">
               <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                 <h3 className="text-xl font-bold mb-6">প্রোফাইল সেটিংস</h3>
                 <div className="space-y-4">
                   <input 
                     type="text" 
                     className="w-full p-4 border rounded-2xl" 
                     value={userProfile.name} 
                     onChange={e => setUserProfile({...userProfile, name: e.target.value})} 
                     placeholder="নাম"
                   />
                   <button onClick={() => alert("সেভ করা হয়েছে")} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold">সংরক্ষণ করুন</button>
                 </div>
               </div>
               <div className="bg-rose-50 p-8 rounded-3xl border border-rose-200">
                 <h3 className="text-xl font-bold text-rose-800 mb-2">ডাটা রিসেট</h3>
                 <p className="text-rose-600 text-sm mb-6">অ্যাপের সব ডাটা মুছে ফেলতে চাইলে নিচের বাটনে ক্লিক করুন।</p>
                 <button onClick={resetAppData} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2">
                   <Trash2 size={20} /> সমস্ত ডাটা মুছে ফেলুন
                 </button>
               </div>
             </div>
          )}
        </div>
      </main>
    </div>
  );
};

const DashboardView: React.FC<{ farmData: FarmState, stats: any }> = ({ farmData, stats }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="মোট মুরগি" value={(stats.totalBirds || 0).toLocaleString()} icon={<Bird className="text-blue-500" />} />
      <StatCard title="মোট মৃত্যু" value={(stats.totalMortality || 0).toLocaleString()} icon={<Skull className="text-rose-500" />} highlight="text-rose-600" />
      <StatCard title="মৃত্যুর হার" value={`${(stats.mortalityRate || 0).toFixed(1)}%`} icon={<AlertTriangle className="text-amber-500" />} />
      <StatCard title="ব্যালেন্স" value={`৳${(stats.balance || 0).toLocaleString()}`} icon={<History className="text-amber-500" />} highlight={stats.balance < 0 ? 'text-rose-600' : 'text-emerald-600'} />
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-[400px]">
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
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
            <YAxis stroke="#94a3b8" fontSize={10} unit="g" />
            <Tooltip />
            <Area type="monotone" dataKey="average_weight" stroke="#3b82f6" fillOpacity={1} fill="url(#colorWeight)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-6">স্টক অ্যালার্ট</h3>
        <div className="space-y-4">
          {(farmData.inventory || []).filter(i => Number(i.current_quantity || 0) < Number(i.min_threshold || 0)).map(item => (
            <div key={item.id} className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-3">
              <AlertTriangle className="text-rose-500" />
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">ব্যাচ ব্যবস্থাপনা</h3>
        <button onClick={() => setIsAdding(!isAdding)} className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-lg">
          {isAdding ? 'বাতিল' : <><Plus size={18} /> নতুন ব্যাচ</>}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <input type="text" placeholder="ব্যাচের নাম" className="w-full p-3 border rounded-xl" value={formState.batch_name} onChange={e => setFormState({...formState, batch_name: e.target.value})} />
            <input type="text" placeholder="জাত" className="w-full p-3 border rounded-xl" value={formState.breed} onChange={e => setFormState({...formState, breed: e.target.value})} />
            <input type="number" placeholder="শুরুর সংখ্যা" className="w-full p-3 border rounded-xl" value={formState.initial_count || ''} onChange={e => { const v = parseInt(e.target.value) || 0; setFormState({...formState, initial_count: v, current_count: v}); }} />
            <input type="date" className="w-full p-3 border rounded-xl" value={formState.start_date} onChange={e => setFormState({...formState, start_date: e.target.value})} />
          </div>
          <button onClick={() => { onAdd(formState); setIsAdding(false); setFormState({ batch_name: '', breed: 'ক্লব ৫০০', initial_count: 0, current_count: 0, start_date: new Date().toISOString().split('T')[0] }); }} className="mt-6 px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold">সেভ করুন</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {(farmData.flocks || []).map(flock => (
          <div key={flock.id} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
            <div className="p-8 bg-emerald-600 text-white flex justify-between items-start">
               <div>
                  <h4 className="text-3xl font-black">{flock.batch_name}</h4>
                  <p className="text-emerald-100 mt-2">{flock.breed} • {flock.start_date}</p>
               </div>
               <button onClick={() => onDelete(flock.id)} className="p-2 bg-white/10 hover:bg-rose-500 rounded-xl"><Trash2 size={16} /></button>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase">বর্তমান সংখ্যা</p>
                  <p className="text-2xl font-black text-slate-800">{flock.current_count || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase">মৃত্যু</p>
                  <p className="text-2xl font-black text-rose-600">{(flock.mortalityLogs || []).reduce((s, m) => s + Number(m.count || 0), 0)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase">ওজন (গড়)</p>
                  <p className="text-2xl font-black text-blue-600">{(flock.weightLogs && flock.weightLogs.length > 0) ? `${flock.weightLogs[flock.weightLogs.length - 1].average_weight}g` : '-'}</p>
                </div>
              </div>

              {activeLogFlockId?.id === flock.id ? (
                <div className="bg-slate-50 p-6 rounded-3xl border border-emerald-100 animate-in zoom-in-95">
                  <div className="flex justify-between items-center mb-4">
                    <h5 className="font-bold text-emerald-800 text-sm">
                      {activeLogFlockId.type === 'weight' ? 'ওজন রেকর্ড' : 
                       activeLogFlockId.type === 'mortality' ? 'মৃত্যু রেকর্ড' : 
                       'খাদ্য রেকর্ড'}
                    </h5>
                    <button onClick={() => setActiveLogFlockId(null)}><X size={16} /></button>
                  </div>
                  
                  {activeLogFlockId.type === 'weight' && (
                    <div className="space-y-3">
                      <input type="number" placeholder="ওজন (গ্রাম)" className="w-full p-3 border rounded-xl" value={weightForm.average_weight || ''} onChange={e => setWeightForm({...weightForm, average_weight: parseInt(e.target.value) || 0})} />
                      <button onClick={() => { onAddWeight(flock.id, weightForm); setActiveLogFlockId(null); }} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">সংরক্ষণ করুন</button>
                    </div>
                  )}
                  {activeLogFlockId.type === 'mortality' && (
                    <div className="space-y-3">
                      <input type="number" placeholder="সংখ্যা" className="w-full p-3 border rounded-xl" value={mortalityForm.count || ''} onChange={e => setMortalityForm({...mortalityForm, count: parseInt(e.target.value) || 0})} />
                      <button onClick={() => { onAddMortality(flock.id, mortalityForm); setActiveLogFlockId(null); }} className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold">সংরক্ষণ করুন</button>
                    </div>
                  )}
                  {activeLogFlockId.type === 'feed' && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input type="number" placeholder="পরিমাণ" className="flex-1 p-3 border rounded-xl" value={feedForm.amount || ''} onChange={e => setFeedForm({...feedForm, amount: parseFloat(e.target.value) || 0})} />
                        <select className="p-3 border rounded-xl font-bold bg-white" value={feedForm.unit} onChange={e => setFeedForm({...feedForm, unit: e.target.value})}>
                          <option value="কেজি">কেজি</option>
                          <option value="ব্যাগ">ব্যাগ</option>
                        </select>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold ml-1">১ ব্যাগ = ৫০ কেজি (ইনভেন্টরি থেকে অটো বিয়োগ হবে)</p>
                      <button onClick={() => { onAddFeed(flock.id, feedForm); setActiveLogFlockId(null); }} className="w-full py-3 bg-amber-500 text-white rounded-xl font-bold">সংরক্ষণ করুন</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => setActiveLogFlockId({ id: flock.id, type: 'weight' })} className="flex flex-col items-center p-4 border rounded-2xl hover:bg-slate-50">
                    <Scale size={20} className="text-blue-500 mb-1" />
                    <span className="text-[10px] font-bold">ওজন</span>
                  </button>
                  <button onClick={() => setActiveLogFlockId({ id: flock.id, type: 'mortality' })} className="flex flex-col items-center p-4 border rounded-2xl hover:bg-slate-50">
                    <Skull size={20} className="text-rose-500 mb-1" />
                    <span className="text-[10px] font-bold">মৃত্যু</span>
                  </button>
                  <button onClick={() => setActiveLogFlockId({ id: flock.id, type: 'feed' })} className="flex flex-col items-center p-4 border rounded-2xl hover:bg-slate-50">
                    <UtensilsCrossed size={20} className="text-amber-500 mb-1" />
                    <span className="text-[10px] font-bold">খাদ্য</span>
                  </button>
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
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
      <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-black text-slate-800 text-xl flex items-center gap-3"><History className="text-emerald-600" /> আর্থিক খতিয়ান</h3>
        <button onClick={() => setIsAdding(!isAdding)} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black shadow-lg shadow-slate-200">{isAdding ? 'বাতিল' : <><Plus size={18} /> নতুন হিসাব</>}</button>
      </div>
      {isAdding && (
        <div className="p-8 bg-slate-50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-5 gap-4">
          <select value={newTx.type} onChange={(e) => setNewTx({...newTx, type: e.target.value as any})} className="p-3 border rounded-xl font-bold bg-white"><option value={TransactionType.INCOME}>আয়</option><option value={TransactionType.EXPENSE}>ব্যয়</option></select>
          <select value={newTx.category} onChange={(e) => setNewTx({...newTx, category: e.target.value as any})} className="p-3 border rounded-xl font-bold bg-white">{Object.values(Category).map(c => <option key={c} value={c}>{CATEGORY_NAMES[c]}</option>)}</select>
          <input type="number" placeholder="পরিমাণ" className="p-3 border rounded-xl font-bold" value={newTx.amount || ''} onChange={(e) => setNewTx({...newTx, amount: Number(e.target.value)})} />
          <input type="text" placeholder="বিবরণ" className="p-3 border rounded-xl font-bold" value={newTx.description} onChange={(e) => setNewTx({...newTx, description: e.target.value})} />
          <button onClick={() => { onAdd(newTx); setIsAdding(false); }} className="bg-emerald-600 text-white rounded-xl font-black py-3">সেভ করুন</button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest">
            <tr><th className="px-8 py-6">তারিখ</th><th className="px-8 py-6">বিভাগ</th><th className="px-8 py-6">বিবরণ</th><th className="px-8 py-6 text-right">পরিমাণ</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(farmData.transactions || []).map(t => (
              <tr key={t.id}>
                <td className="px-8 py-5 text-slate-500 font-bold text-sm">{t.date}</td>
                <td className="px-8 py-5"><span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm ${t.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{CATEGORY_NAMES[t.category]}</span></td>
                <td className="px-8 py-5 text-slate-800 font-bold text-sm">{t.description}</td>
                <td className={`px-8 py-5 text-right font-black text-base ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>{t.type === TransactionType.INCOME ? '+' : '-'}৳{(t.amount || 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const InventoryView: React.FC<{ farmData: FarmState, onAdd: (item: any) => void, onUpdate: (id: string, item: any) => void, onDelete: (id: string) => void }> = ({ farmData, onAdd, onUpdate, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formState, setFormState] = useState({ name: '', category: Category.FEED, current_quantity: 0, unit: 'কেজি', min_threshold: 5 });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">স্টক ও ইনভেন্টরি</h3>
        <button onClick={() => setIsAdding(!isAdding)} className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-700">
          {isAdding ? 'বাতিল' : <><Plus size={18} /> নতুন আইটেম</>}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <input type="text" placeholder="আইটেম নাম" className="p-3 border rounded-xl font-bold" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} />
            <select className="p-3 border rounded-xl font-bold bg-white" value={formState.category} onChange={e => setFormState({...formState, category: e.target.value as any})}><option value={Category.FEED}>ফিড</option><option value={Category.MEDICINE}>ওষুধ</option></select>
            <input type="number" placeholder="বর্তমান পরিমাণ" className="p-3 border rounded-xl font-bold" value={formState.current_quantity || ''} onChange={e => setFormState({...formState, current_quantity: parseInt(e.target.value) || 0})} />
            <select className="p-3 border rounded-xl font-bold bg-white" value={formState.unit} onChange={e => setFormState({...formState, unit: e.target.value})}>
               <option value="কেজি">কেজি</option>
               <option value="ব্যাগ">ব্যাগ (৫০ কেজি)</option>
               <option value="বোতল">বোতল</option>
            </select>
            <input type="number" placeholder="সীমা" className="p-3 border rounded-xl font-bold" value={formState.min_threshold || ''} onChange={e => setFormState({...formState, min_threshold: parseInt(e.target.value) || 0})} />
          </div>
          <button onClick={() => { onAdd(formState); setIsAdding(false); }} className="mt-4 px-8 py-3 bg-emerald-600 text-white rounded-xl font-black">সংরক্ষণ করুন</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {(farmData.inventory || []).map(item => (
          <div key={item.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={() => onDelete(item.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg"><Trash2 size={16} /></button>
            </div>
            {Number(item.current_quantity || 0) < Number(item.min_threshold || 0) && (
              <div className="absolute top-0 left-0 px-4 py-2 bg-rose-500 text-white text-[10px] font-black uppercase rounded-br-2xl">Low Stock</div>
            )}
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 mt-4">{item.category}</p>
            <h4 className="text-2xl font-black text-slate-800 mb-6">{item.name}</h4>
            <div className="flex justify-between items-end">
              <div><p className="text-4xl font-black text-slate-900">{parseFloat(Number(item.current_quantity || 0).toFixed(2))}</p><p className="text-xs font-bold text-slate-400 mt-1 uppercase">{item.unit}</p></div>
              <div className="text-right opacity-60"><p className="text-[9px] font-black uppercase mb-1">সতর্কতা সীমা</p><p className="text-sm font-black text-slate-700">{item.min_threshold || 0} {item.unit}</p></div>
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
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md"><BrainCircuit size={48} className="animate-pulse" /></div>
          <div><h3 className="text-4xl font-black">HenGPT উপদেষ্টা</h3><p className="text-emerald-100 text-xs font-bold uppercase tracking-widest">AI Strategic Poultry Guide</p></div>
        </div>
        <button onClick={onFetch} disabled={loading} className="px-12 py-4 bg-white text-emerald-700 rounded-2xl font-black flex items-center gap-3 shadow-xl disabled:opacity-50">
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
            <ul className="space-y-4">{(insights.warnings || []).map((w: string, i: number) => (<li key={i} className="flex gap-4 text-rose-700 font-bold"><div className="w-2 h-2 rounded-full bg-rose-400 mt-2 shrink-0" />{w}</li>))}</ul>
          </div>
          <div className="bg-emerald-50 p-10 rounded-[2.5rem] border border-emerald-100">
            <h4 className="font-black text-emerald-800 mb-6 flex items-center gap-3 text-xl"><Check /> প্রয়োজনীয় পদক্ষেপ</h4>
            <ul className="space-y-4">{(insights.recommendations || []).map((r: string, i: number) => (<li key={i} className="flex gap-4 text-emerald-700 font-bold"><Check className="text-emerald-500 shrink-0" />{r}</li>))}</ul>
          </div>
        </div>
      </div>
    )}
  </div>
);

export default App;
