
import React, { useState, useEffect, useMemo } from 'react';
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
  AlertTriangle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { FarmState, TransactionType, Category, Transaction, FlockRecord, InventoryItem } from './types';
import { getFarmInsights } from './services/geminiService';

// Initial state helpers
const INITIAL_STATE: FarmState = {
  transactions: [
    { id: '1', date: '2023-10-01', type: TransactionType.EXPENSE, category: Category.CHICKEN_PURCHASE, amount: 1500, description: '500 Day-old chicks' },
    { id: '2', date: '2023-10-05', type: TransactionType.EXPENSE, category: Category.FEED, amount: 800, description: 'Starter Feed 20 bags', quantity: 20, unit: 'bags' },
    { id: '3', date: '2023-11-15', type: TransactionType.INCOME, category: Category.SALES, amount: 4500, description: 'Sold 400 chickens' }
  ],
  flocks: [
    {
      id: 'f1',
      batchName: 'Batch Oct-2023',
      startDate: '2023-10-01',
      initialCount: 500,
      currentCount: 485,
      breed: 'Cobb 500',
      weightLogs: [
        { id: 'w1', date: '2023-10-07', averageWeight: 180, sampleSize: 20 },
        { id: 'w2', date: '2023-10-14', averageWeight: 450, sampleSize: 20 },
        { id: 'w3', date: '2023-10-21', averageWeight: 900, sampleSize: 20 },
        { id: 'w4', date: '2023-10-28', averageWeight: 1400, sampleSize: 20 },
      ],
      mortalityLogs: [{ id: 'm1', date: '2023-10-10', count: 5, reason: 'Heat stress' }]
    }
  ],
  inventory: [
    { id: 'i1', name: 'Starter Feed', category: Category.FEED, currentQuantity: 5, unit: 'bags', minThreshold: 10 },
    { id: 'i2', name: 'Grower Feed', category: Category.FEED, currentQuantity: 45, unit: 'bags', minThreshold: 15 },
    { id: 'i3', name: 'Antibiotics Type-A', category: Category.MEDICINE, currentQuantity: 12, unit: 'bottles', minThreshold: 5 }
  ]
};

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

const App: React.FC = () => {
  const [farmData, setFarmData] = useState<FarmState>(() => {
    const saved = localStorage.getItem('poultry_pro_data');
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'flocks' | 'inventory' | 'ai'>('dashboard');
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('poultry_pro_data', JSON.stringify(farmData));
  }, [farmData]);

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

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newT = { ...t, id: Date.now().toString() };
    setFarmData(prev => ({ ...prev, transactions: [newT, ...prev.transactions] }));
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
            <Bird size={24} />
          </div>
          <h1 className="font-bold text-xl tracking-tight text-emerald-900">PoultryPro</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <SidebarLink 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarLink 
            icon={<Bird size={20} />} 
            label="Flock Management" 
            active={activeTab === 'flocks'} 
            onClick={() => setActiveTab('flocks')} 
          />
          <SidebarLink 
            icon={<TrendingUp size={20} />} 
            label="Financials" 
            active={activeTab === 'transactions'} 
            onClick={() => setActiveTab('transactions')} 
          />
          <SidebarLink 
            icon={<Package size={20} />} 
            label="Inventory" 
            active={activeTab === 'inventory'} 
            onClick={() => setActiveTab('inventory')} 
          />
          <SidebarLink 
            icon={<BrainCircuit size={20} />} 
            label="AI Insights" 
            active={activeTab === 'ai'} 
            onClick={() => setActiveTab('ai')} 
          />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button className="flex items-center gap-3 w-full p-2 text-slate-500 hover:text-red-600 transition-colors">
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 px-8 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800 capitalize">{activeTab}</h2>
            <p className="text-sm text-slate-500">Welcome back, Farmer Joe</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 transition-colors">
              <Plus size={24} />
            </button>
            <div className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300"></div>
          </div>
        </header>

        <div className="p-8">
          {activeTab === 'dashboard' && <DashboardView farmData={farmData} stats={stats} />}
          {activeTab === 'flocks' && <FlockView farmData={farmData} />}
          {activeTab === 'transactions' && <TransactionView farmData={farmData} onAdd={addTransaction} />}
          {activeTab === 'inventory' && <InventoryView farmData={farmData} />}
          {activeTab === 'ai' && <AiView loading={isAiLoading} insights={aiInsights} onFetch={handleFetchAiInsights} />}
        </div>
      </main>
    </div>
  );
};

const SidebarLink: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 w-full p-3 rounded-lg font-medium transition-all ${
      active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const DashboardView: React.FC<{ farmData: FarmState, stats: any }> = ({ farmData, stats }) => {
  const chartData = useMemo(() => {
    // Group transactions by date for a simple area chart
    const last30Days = farmData.transactions.slice(0, 10).reverse();
    return last30Days.map(t => ({
      date: t.date,
      amount: t.type === TransactionType.INCOME ? t.amount : -t.amount
    }));
  }, [farmData.transactions]);

  const birdStats = farmData.flocks[0]?.weightLogs.map(l => ({
    date: l.date,
    weight: l.averageWeight
  })) || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Birds" value={stats.totalBirds.toLocaleString()} icon={<Bird className="text-blue-500" />} />
        <StatCard title="Total Income" value={`$${stats.totalIncome.toLocaleString()}`} icon={<TrendingUp className="text-emerald-500" />} />
        <StatCard title="Total Expenses" value={`$${stats.totalExpense.toLocaleString()}`} icon={<TrendingDown className="text-rose-500" />} />
        <StatCard title="Net Profit" value={`$${stats.balance.toLocaleString()}`} icon={<History className="text-amber-500" />} highlight={stats.balance < 0 ? 'text-rose-600' : 'text-emerald-600'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800">Growth Performance (Avg. Weight)</h3>
            <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-600 rounded">Cobb 500 Batch</span>
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
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} unit="g" />
                <Tooltip />
                <Area type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">Critical Inventory</h3>
          <div className="space-y-4">
            {farmData.inventory.filter(i => i.currentQuantity < i.minThreshold).map(item => (
              <div key={item.id} className="flex items-center gap-4 p-3 bg-rose-50 rounded-xl">
                <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                  <AlertTriangle size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-slate-800">{item.name}</p>
                  <p className="text-xs text-rose-600">Only {item.currentQuantity} {item.unit} left</p>
                </div>
                <button className="text-rose-600 font-bold text-xs uppercase hover:underline">Restock</button>
              </div>
            ))}
            {farmData.inventory.filter(i => i.currentQuantity < i.minThreshold).length === 0 && (
              <div className="text-center py-10">
                <Package className="mx-auto text-slate-300 mb-2" size={32} />
                <p className="text-slate-500 text-sm">All inventory levels are healthy</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string, value: string, icon: React.ReactNode, highlight?: string }> = ({ title, value, icon, highlight }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
    <div>
      <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
      <h4 className={`text-2xl font-bold ${highlight || 'text-slate-900'}`}>{value}</h4>
    </div>
    <div className="p-3 bg-slate-50 rounded-xl">
      {icon}
    </div>
  </div>
);

const FlockView: React.FC<{ farmData: FarmState }> = ({ farmData }) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-bold text-slate-800">Active Flocks</h3>
      <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
        <Plus size={18} />
        New Batch
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {farmData.flocks.map(flock => (
        <div key={flock.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 bg-emerald-600 text-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-xl font-bold">{flock.batchName}</h4>
                <p className="text-emerald-100 text-sm">Started: {flock.startDate}</p>
              </div>
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
                {flock.breed}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-emerald-100 text-xs">Current Count</p>
                <p className="text-2xl font-bold">{flock.currentCount}</p>
              </div>
              <div>
                <p className="text-emerald-100 text-xs">Avg. Weight</p>
                <p className="text-2xl font-bold">
                  {flock.weightLogs.length > 0 
                    ? `${flock.weightLogs[flock.weightLogs.length - 1].averageWeight}g` 
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <h5 className="font-bold text-sm text-slate-800 mb-3 uppercase tracking-wider">Weight History</h5>
            <div className="space-y-3">
              {flock.weightLogs.slice(-3).reverse().map(log => (
                <div key={log.id} className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">{log.date}</span>
                  <span className="font-semibold text-slate-800">{log.averageWeight}g (n={log.sampleSize})</span>
                </div>
              ))}
            </div>
            <button className="mt-6 w-full py-2 border border-emerald-600 text-emerald-600 font-bold rounded-lg hover:bg-emerald-50 transition-colors">
              Record Measurements
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const TransactionView: React.FC<{ farmData: FarmState, onAdd: (t: any) => void }> = ({ farmData, onAdd }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTx, setNewTx] = useState({
    type: TransactionType.EXPENSE,
    category: Category.FEED,
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-bold text-slate-800">Financial Ledger</h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
          {isAdding ? 'Cancel' : <><Plus size={18} /> New Entry</>}
        </button>
      </div>

      {isAdding && (
        <div className="p-6 bg-slate-50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-5 gap-4">
          <select 
            value={newTx.type}
            onChange={(e) => setNewTx({...newTx, type: e.target.value as TransactionType})}
            className="p-2 border border-slate-300 rounded-lg"
          >
            <option value={TransactionType.INCOME}>Income</option>
            <option value={TransactionType.EXPENSE}>Expense</option>
          </select>
          <select 
             value={newTx.category}
             onChange={(e) => setNewTx({...newTx, category: e.target.value as Category})}
             className="p-2 border border-slate-300 rounded-lg"
          >
            {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input 
            type="number" 
            placeholder="Amount" 
            className="p-2 border border-slate-300 rounded-lg"
            onChange={(e) => setNewTx({...newTx, amount: Number(e.target.value)})}
          />
          <input 
            type="text" 
            placeholder="Description" 
            className="p-2 border border-slate-300 rounded-lg"
            onChange={(e) => setNewTx({...newTx, description: e.target.value})}
          />
          <button 
            onClick={() => {
              onAdd(newTx);
              setIsAdding(false);
            }}
            className="bg-emerald-600 text-white py-2 rounded-lg font-bold"
          >
            Save
          </button>
        </div>
      )}

      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
          <tr>
            <th className="px-6 py-4">Date</th>
            <th className="px-6 py-4">Category</th>
            <th className="px-6 py-4">Description</th>
            <th className="px-6 py-4 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {farmData.transactions.map(t => (
            <tr key={t.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 text-sm text-slate-500">{t.date}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                  t.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {t.category}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-slate-800 font-medium">{t.description}</td>
              <td className={`px-6 py-4 text-right font-bold text-sm ${
                t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {t.type === TransactionType.INCOME ? '+' : '-'}${t.amount.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const InventoryView: React.FC<{ farmData: FarmState }> = ({ farmData }) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-bold text-slate-800">Resource Stock</h3>
      <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
        <Plus size={18} />
        Add Inventory
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {farmData.inventory.map(item => (
        <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          {item.currentQuantity < item.minThreshold && (
            <div className="absolute top-0 right-0 p-2 bg-rose-500 text-white">
              <AlertTriangle size={16} />
            </div>
          )}
          <p className="text-slate-400 text-xs font-bold uppercase mb-1">{item.category}</p>
          <h4 className="font-bold text-slate-800 mb-4">{item.name}</h4>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold text-slate-900">{item.currentQuantity}</p>
              <p className="text-slate-500 text-sm font-medium">{item.unit}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 mb-1">Min Threshold</p>
              <p className="text-sm font-bold text-slate-600">{item.minThreshold} {item.unit}</p>
            </div>
          </div>
          <div className="mt-4 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${item.currentQuantity < item.minThreshold ? 'bg-rose-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, (item.currentQuantity / (item.minThreshold * 2)) * 100)}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AiView: React.FC<{ loading: boolean, insights: any, onFetch: () => void }> = ({ loading, insights, onFetch }) => (
  <div className="max-w-4xl mx-auto space-y-8">
    <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-8 rounded-3xl text-white shadow-xl shadow-emerald-100 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
      <div className="relative z-10">
        <h3 className="text-3xl font-bold mb-4">HenGPT Farm Advisor</h3>
        <p className="text-emerald-50 mb-8 max-w-lg">
          Powered by Gemini 3, our AI analyzes your flock's weight trends, feed consumption, and expenses to give you expert-level recommendations.
        </p>
        <button 
          onClick={onFetch}
          disabled={loading}
          className="px-8 py-3 bg-white text-emerald-700 rounded-xl font-bold hover:bg-emerald-50 transition-all flex items-center gap-3 disabled:opacity-50"
        >
          {loading ? 'Analyzing Data...' : <><BrainCircuit size={20} /> Generate AI Insights</>}
        </button>
      </div>
    </div>

    {insights && (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-500" />
            Executive Summary
          </h4>
          <p className="text-slate-600 leading-relaxed">{insights.summary}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
            <h4 className="font-bold text-rose-800 mb-4 flex items-center gap-2">
              <AlertTriangle size={18} />
              Health & Operational Warnings
            </h4>
            <ul className="space-y-3">
              {insights.warnings.map((w: string, i: number) => (
                <li key={i} className="flex gap-3 text-sm text-rose-700">
                  <ChevronRight size={16} className="shrink-0 mt-0.5" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
            <h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2">
              <TrendingUp size={18} />
              Recommendations
            </h4>
            <ul className="space-y-3">
              {insights.recommendations.map((r: string, i: number) => (
                <li key={i} className="flex gap-3 text-sm text-emerald-700">
                  <ChevronRight size={16} className="shrink-0 mt-0.5" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    )}

    {!insights && !loading && (
      <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-3xl">
        <BrainCircuit size={48} className="mx-auto text-slate-300 mb-4" />
        <h4 className="text-slate-800 font-bold mb-1">Ready for Analysis</h4>
        <p className="text-slate-500 text-sm">Click the button above to start your AI-powered farm review.</p>
      </div>
    )}
  </div>
);

export default App;
