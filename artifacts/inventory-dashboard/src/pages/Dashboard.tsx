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
import { formatCurrency, formatDate } from "@/lib/format";
import {
  useGetDashboardSummary,
  useGetSalesTrend,
  useGetTopCustomers,
  useGetSalesByCategory,
  useGetPurchasesByLocation,
  useGetLowStockItems,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"];

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
    {
      title: "Total Sales",
      value: summary ? formatCurrency(summary.totalSales) : "$0",
      icon: ShoppingCart,
    },
    {
      title: "Total Purchases",
      value: summary ? formatCurrency(summary.totalPurchases) : "$0",
      icon: Landmark,
    },
    {
      title: "Net Profit",
      value: summary ? formatCurrency(summary.netProfit) : "$0",
      icon: TrendingUp,
    },
    {
      title: "Total Receivable",
      value: summary ? formatCurrency(summary.totalReceivable) : "$0",
      icon: DollarSign,
    },
    {
      title: "Total Payable",
      value: summary ? formatCurrency(summary.totalPayable) : "$0",
      icon: CreditCard,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time overview of your business performance</p>
      </div>

      {/* KPI Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
      >
        {kpiCards.map((card, i) => (
          <DashboardCard key={card.title} title={card.title} value={card.value} icon={card.icon} delay={i * 0.08} />
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
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => {
                    const d = new Date(v + "T00:00:00");
                    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value)]}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Area type="monotone" dataKey="sales" name="Sales" stroke="#3b82f6" strokeWidth={2} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="purchases" name="Purchases" stroke="#10b981" strokeWidth={2} fill="url(#colorPurchases)" />
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
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {salesByCategory.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
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
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="customerName"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  width={55}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), "Total"]}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="totalAmount" name="Total" fill="#3b82f6" radius={[0, 4, 4, 0]} />
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
                  innerRadius={55}
                >
                  {purchasesByLocation.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), "Total"]}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStock.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold text-amber-900">Low Stock Alerts ({lowStock.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-amber-700 border-b border-amber-200">
                    <th className="pb-2 text-left font-medium">Product</th>
                    <th className="pb-2 text-left font-medium">SKU</th>
                    <th className="pb-2 text-left font-medium">Category</th>
                    <th className="pb-2 text-right font-medium">Qty</th>
                    <th className="pb-2 text-right font-medium">Reorder Level</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((item) => (
                    <tr key={item.id} className="border-b border-amber-100 last:border-0">
                      <td className="py-2 text-amber-900 font-medium">{item.name}</td>
                      <td className="py-2 text-amber-700">{item.sku}</td>
                      <td className="py-2 text-amber-700">{item.category}</td>
                      <td className="py-2 text-right font-bold text-red-600">{item.quantity}</td>
                      <td className="py-2 text-right text-amber-700">{item.reorderLevel}</td>
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
