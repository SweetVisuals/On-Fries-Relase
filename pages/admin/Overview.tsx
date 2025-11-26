import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { useStore } from '../../context/StoreContext';
import { DollarSign, ShoppingCart, TrendingUp, Users, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, PieChart, Pie } from 'recharts';

export const OverviewPage = () => {
  const { orders, stock, customers, getRevenueData, getCategorySales, getTopProducts, getOrderVolume } = useStore();
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [chartData, setChartData] = useState<{ name: string; value: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [topProductsData, setTopProductsData] = useState<{ name: string; value: number }[]>([]);
  const [orderVolumeData, setOrderVolumeData] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(false);

  // Calculate Real Stats
  const today = new Date().toDateString();
  const todaysOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
  const todaysRevenue = todaysOrders.reduce((acc, curr) => acc + curr.total, 0);

  const activeOrders = orders.filter(o => ['pending', 'cooking', 'ready'].includes(o.status)).length;
  const lowStockCount = stock.filter(s => s.quantity <= s.lowStockThreshold).length;

  // Date Logic


  // Calculate Revenue Trend based on Date Range
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isSingleDay = diffDays <= 1;

  const periodOrders = orders.filter(o => {
    const orderDate = new Date(o.createdAt);
    return orderDate >= start && orderDate <= end && o.status !== 'cancelled';
  });

  const periodRevenue = periodOrders.reduce((acc, curr) => acc + curr.total, 0);
  const revenueLabel = isSingleDay ? "Daily Revenue" : "Period Revenue";

  // Fetch chart data when dates change
  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      try {
        const data = await getRevenueData(startDate, endDate);
        setChartData(data);
      } catch (error) {
        console.error('Error fetching revenue data:', error);
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [startDate, endDate, getRevenueData]);

  // Fetch category and other chart data on mount/date change
  useEffect(() => {
    const fetchAdditionalData = async () => {
      try {
        const category = await getCategorySales(startDate, endDate);
        setCategoryData(category);

        const topProducts = await getTopProducts(startDate, endDate);
        setTopProductsData(topProducts);

        const volume = await getOrderVolume(startDate, endDate);
        setOrderVolumeData(volume);
      } catch (error) {
        console.error('Error fetching additional data:', error);
        setCategoryData([]);
        setTopProductsData([]);
        setOrderVolumeData([]);
      }
    };

    fetchAdditionalData();
  }, [getCategorySales, getTopProducts, getOrderVolume, startDate, endDate]);

  const chartTitle = isSingleDay ? "Hourly Revenue" : (diffDays > 14 ? "Weekly Trend" : "Daily Trend");

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg shadow-xl">
          <p className="text-zinc-400 text-xs mb-1 font-heading uppercase tracking-wider">{label}</p>
          <p className="text-brand-yellow font-bold text-lg">£{payload[0].value.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <AdminLayout>
      <div className="flex flex-col space-y-8 max-w-7xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-4 border-b border-zinc-800 gap-4">
          <div>
            <h2 className="text-4xl font-bold text-white mb-1 font-heading uppercase">Dashboard</h2>
            <p className="text-zinc-400 font-sans">Welcome back, here's what's happening.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-zinc-500 text-sm font-medium">{new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            {/* Date Range Picker */}
            <div className="flex items-center bg-zinc-900 rounded-lg border border-zinc-800 p-1">
              <div className="flex items-center gap-2 px-3 py-1.5 border-r border-zinc-800">
                <Calendar className="w-4 h-4 text-zinc-500" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-white text-sm focus:outline-none font-medium [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert opacity-90 hover:opacity-100 cursor-pointer"
                />
              </div>
              <div className="px-3 py-1.5">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-white text-sm focus:outline-none font-medium [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert opacity-90 hover:opacity-100 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: revenueLabel, value: `£${periodRevenue.toFixed(2)}`, sub: isSingleDay ? "Today's sales" : "Selected period", icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
            { title: "Active Orders", value: activeOrders, sub: "Requiring attention", icon: Clock, color: "text-brand-yellow", bg: "bg-brand-yellow/10", border: "border-brand-yellow/20" },
            { title: "Total Customers", value: customers.length, sub: "Lifetime unique", icon: Users, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
            { title: "Low Stock Alerts", value: lowStockCount, sub: "Items below threshold", icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
          ].map((stat, i) => (
            <div key={i} className={`bg-zinc-900/50 border ${stat.border} p-6 rounded-2xl hover:bg-zinc-900 transition-all duration-300 group`}>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                {i === 1 && activeOrders > 0 && <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-yellow opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-yellow"></span>
                </span>}
              </div>
              <div className="text-3xl font-bold text-white mb-1 tracking-tight">{stat.value}</div>
              <h3 className="text-zinc-400 text-sm font-medium">{stat.title}</h3>
              <div className="text-xs text-zinc-600 mt-1">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="font-bold text-white text-lg capitalize">{chartTitle}</h3>
                <p className="text-zinc-500 text-sm">Revenue performance</p>
              </div>
            </div>
            <div className="h-72">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-zinc-400">Loading chart data...</div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FFC107" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#FFC107" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `£${value}`} dx={-10} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="value" stroke="#FFC107" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Order Volume Chart */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="font-bold text-white text-lg">Order Volume</h3>
                <p className="text-zinc-500 text-sm">Number of orders</p>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orderVolumeData}>
                  <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                    itemStyle={{ color: '#fbbf24' }}
                    cursor={{ fill: '#27272a' }}
                  />
                  <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Products Chart */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="font-bold text-white text-lg">Top Products</h3>
                <p className="text-zinc-500 text-sm">Best selling items</p>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsData} layout="vertical" margin={{ left: 40 }}>
                  <XAxis type="number" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} width={100} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                    itemStyle={{ color: '#fbbf24' }}
                    cursor={{ fill: '#27272a' }}
                  />
                  <Bar dataKey="value" fill="#10B981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sales Mix */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-sm flex flex-col">
            <div className="mb-4">
              <h3 className="font-bold text-white text-lg">Sales Distribution</h3>
              <p className="text-zinc-500 text-sm">By category</p>
            </div>
            <div className="flex-1 min-h-[200px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0)" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-white">100%</span>
                <span className="text-xs text-zinc-500">Total</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {categoryData.map((cat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                  <span className="text-sm text-zinc-300">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};