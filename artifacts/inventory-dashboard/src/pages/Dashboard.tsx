import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DollarSign, ShoppingCart, TrendingUp, CreditCard, Landmark, AlertTriangle } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { ChartContainer } from "@/components/dashboard/ChartContainer";
import { formatCurrency } from "@/lib/format";
import {
  useGetDashboardSummary,
  useGetSalesTrend,
  useGetTopCustomers,
  useGetSalesByCategory,
  useGetPurchasesByLocation,
  useGetLowStockItems,
} from "@workspace/api-client-react";

const NEON_COLORS = ["#00d4ff", "#a855f7", "#34d399", "#f97316", "#f43f5e", "#fbbf24", "#60a5fa"];

const TOOLTIP_STYLE = {
  background: "rgba(8,14,36,0.92)",
  border: "1px solid rgba(0,212,255,0.2)",
  borderRadius: "12px",
  fontSize: "12px",
  color: "#e2e8f0",
  backdropFilter: "blur(20px)",
  boxShadow: "0 0 30px rgba(0,212,255,0.08)",
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

export default function Dashboard() {
  const { data: summary } = useGetDashboardSummary();
  const { data: trend = [] } = useGetSalesTrend();
  const { data: topCustomers = [] } = useGetTopCustomers();
  const { data: salesByCategory = [] } = useGetSalesByCategory();
  const { data: purchasesByLocation = [] } = useGetPurchasesByLocation();
  const { data: lowStock = [] } = useGetLowStockItems();

  const kpiCards = [
    { title: "Total Sales", value: summary ? formatCurrency(summary.totalSales) : "$0", icon: ShoppingCart, accent: "cyan" as const },
    { title: "Total Purchases", value: summary ? formatCurrency(summary.totalPurchases) : "$0", icon: Landmark, accent: "purple" as const },
    { title: "Net Profit", value: summary ? formatCurrency(summary.netProfit) : "$0", icon: TrendingUp, accent: "emerald" as const },
    { title: "Total Receivable", value: summary ? formatCurrency(summary.totalReceivable) : "$0", icon: DollarSign, accent: "orange" as const },
    { title: "Total Payable", value: summary ? formatCurrency(summary.totalPayable) : "$0", icon: CreditCard, accent: "pink" as const },
  ];

  return (
    <div className="space-y-8">
      {/* Page title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-white/35 mt-1">Real-time overview of your business performance</p>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
      >
        {kpiCards.map((card, i) => (
          <DashboardCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            accent={card.accent}
            delay={i * 0.08}
          />
        ))}
      </motion.div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartContainer
            title="Sales Trend"
            description="Revenue vs. cost over the last 30 days"
            isEmpty={trend.length === 0}
          >
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "rgba(255,255,255,0.3)" }}
                  tickFormatter={(v) => {
                    const d = new Date(v + "T00:00:00");
                    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "rgba(255,255,255,0.3)" }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip formatter={(value: number) => [formatCurrency(value)]} contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }} />
                <Area type="monotone" dataKey="sales" name="Sales" stroke="#00d4ff" strokeWidth={2} fill="url(#colorSales)" dot={false} />
                <Area type="monotone" dataKey="purchases" name="Purchases" stroke="#a855f7" strokeWidth={2} fill="url(#colorPurchases)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        <div>
          <ChartContainer
            title="Sales by Category"
            description="Revenue breakdown by product category"
            isEmpty={salesByCategory.length === 0}
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={salesByCategory}
                  dataKey="totalAmount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={0}
                  paddingAngle={2}
                  label={({ category, percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {salesByCategory.map((_, index) => (
                    <Cell
                      key={index}
                      fill={NEON_COLORS[index % NEON_COLORS.length]}
                      style={{ filter: `drop-shadow(0 0 6px ${NEON_COLORS[index % NEON_COLORS.length]}88)` }}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [formatCurrency(value), "Revenue"]} contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartContainer
            title="Top 10 Customers"
            description="Customers ranked by total purchase value"
            isEmpty={topCustomers.length === 0}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topCustomers} layout="vertical" margin={{ left: 60, right: 20, top: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "rgba(255,255,255,0.3)" }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="customerName"
                  tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }}
                  tickLine={false}
                  axisLine={false}
                  width={55}
                />
                <Tooltip formatter={(value: number) => [formatCurrency(value), "Total"]} contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="totalAmount" name="Total" fill="url(#barGrad)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        <div>
          <ChartContainer
            title="Purchases by Location"
            description="Purchase volume by supplier country"
            isEmpty={purchasesByLocation.length === 0}
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={purchasesByLocation}
                  dataKey="totalAmount"
                  nameKey="location"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={52}
                  paddingAngle={3}
                >
                  {purchasesByLocation.map((_, index) => (
                    <Cell
                      key={index}
                      fill={NEON_COLORS[index % NEON_COLORS.length]}
                      style={{ filter: `drop-shadow(0 0 6px ${NEON_COLORS[index % NEON_COLORS.length]}88)` }}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [formatCurrency(value), "Total"]} contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStock.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div
            className="rounded-2xl overflow-hidden glass"
            style={{
              border: "1px solid rgba(251,146,60,0.2)",
              boxShadow: "0 0 30px rgba(251,146,60,0.05)",
            }}
          >
            <div className="flex items-center gap-3 px-6 py-4 border-b border-orange-500/10">
              <div className="h-8 w-8 rounded-lg bg-orange-500/15 border border-orange-500/20 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white/80 text-sm">Low Stock Alerts</h3>
                <p className="text-xs text-orange-400/70">{lowStock.length} item{lowStock.length !== 1 ? "s" : ""} need attention</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-white/30">Product</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-white/30">SKU</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-white/30">Category</th>
                    <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-widest text-white/30">Qty</th>
                    <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-widest text-white/30">Reorder</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((item, i) => (
                    <tr
                      key={item.id}
                      className="border-b border-white/4 last:border-0 hover:bg-white/3 transition-colors"
                    >
                      <td className="px-6 py-3 font-medium text-white/75">{item.name}</td>
                      <td className="px-6 py-3 text-white/40 font-mono text-xs">{item.sku}</td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-1 rounded-md bg-white/5 text-white/50 text-xs border border-white/8">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="font-bold text-red-400 tabular-nums">{item.quantity}</span>
                      </td>
                      <td className="px-6 py-3 text-right text-orange-400/70 tabular-nums">{item.reorderLevel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
