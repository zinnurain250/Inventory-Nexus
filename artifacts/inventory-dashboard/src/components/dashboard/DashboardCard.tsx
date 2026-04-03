import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface DashboardCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  delay?: number;
  accent?: "cyan" | "purple" | "emerald" | "orange" | "pink";
}

const accentMap = {
  cyan: {
    iconBg: "bg-cyan-500/15",
    iconBorder: "border-cyan-500/20",
    iconText: "text-cyan-400",
    glow: "shadow-[0_0_20px_rgba(0,212,255,0.15)]",
    borderGlow: "border-cyan-500/20",
    bar: "bg-gradient-to-r from-cyan-500 to-cyan-400",
    dot: "bg-cyan-400",
  },
  purple: {
    iconBg: "bg-purple-500/15",
    iconBorder: "border-purple-500/20",
    iconText: "text-purple-400",
    glow: "shadow-[0_0_20px_rgba(168,85,247,0.15)]",
    borderGlow: "border-purple-500/20",
    bar: "bg-gradient-to-r from-purple-500 to-purple-400",
    dot: "bg-purple-400",
  },
  emerald: {
    iconBg: "bg-emerald-500/15",
    iconBorder: "border-emerald-500/20",
    iconText: "text-emerald-400",
    glow: "shadow-[0_0_20px_rgba(52,211,153,0.15)]",
    borderGlow: "border-emerald-500/20",
    bar: "bg-gradient-to-r from-emerald-500 to-emerald-400",
    dot: "bg-emerald-400",
  },
  orange: {
    iconBg: "bg-orange-500/15",
    iconBorder: "border-orange-500/20",
    iconText: "text-orange-400",
    glow: "shadow-[0_0_20px_rgba(251,146,60,0.15)]",
    borderGlow: "border-orange-500/20",
    bar: "bg-gradient-to-r from-orange-500 to-orange-400",
    dot: "bg-orange-400",
  },
  pink: {
    iconBg: "bg-pink-500/15",
    iconBorder: "border-pink-500/20",
    iconText: "text-pink-400",
    glow: "shadow-[0_0_20px_rgba(236,72,153,0.15)]",
    borderGlow: "border-pink-500/20",
    bar: "bg-gradient-to-r from-pink-500 to-pink-400",
    dot: "bg-pink-400",
  },
};

export function DashboardCard({
  title,
  value,
  icon: Icon,
  trend,
  delay = 0,
  accent = "cyan",
}: DashboardCardProps) {
  const a = accentMap[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={`relative group rounded-2xl overflow-hidden glass neon-border-cyan ${a.glow} cursor-default`}
      style={{ border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {/* Top neon line */}
      <div className={`absolute top-0 left-6 right-6 h-px ${a.bar} opacity-60`} />

      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className={`h-10 w-10 rounded-xl ${a.iconBg} border ${a.iconBorder} flex items-center justify-center transition-all duration-300 group-hover:scale-110`}
            style={{ boxShadow: "0 0 15px rgba(0,212,255,0.1)" }}>
            <Icon className={`h-4.5 w-4.5 ${a.iconText}`} style={{ width: "18px", height: "18px" }} />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
              trend.isPositive
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                : "bg-red-500/10 text-red-400 border border-red-500/15"
            }`}>
              {trend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>

        <p className="text-xs font-medium text-white/40 uppercase tracking-widest mb-1.5">{title}</p>
        <h3 className="text-2xl font-bold text-white tracking-tight leading-none">{value}</h3>
      </div>

      {/* Bottom accent bar */}
      <div className={`h-0.5 w-full ${a.bar} opacity-20`} />
    </motion.div>
  );
}
