import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ShoppingBag,
  Users,
  Truck,
  Settings,
  Bell,
  Search,
  Menu,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Sales", href: "/sales", icon: ShoppingCart },
  { name: "Purchases", href: "/purchases", icon: ShoppingBag },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Suppliers", href: "/suppliers", icon: Truck },
  { name: "Settings", href: "/settings", icon: Settings },
];

function SidebarContent() {
  const [location] = useLocation();

  return (
    <div className="flex h-full flex-col glass-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-white/5">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-8 w-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.3)]">
            <Zap className="h-4 w-4 text-cyan-400" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Inven<span className="text-cyan-400">Trade</span>
          </span>
        </Link>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 px-3 py-5">
        <div className="mb-2 px-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25">Navigation</p>
        </div>
        <nav className="flex flex-col gap-1">
          {navigation.map((item, i) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <Link
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/20 shadow-[0_0_15px_rgba(0,212,255,0.1)]"
                      : "text-white/50 hover:bg-white/5 hover:text-white/80 border border-transparent"
                  }`}
                >
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
                    isActive
                      ? "bg-cyan-500/20 text-cyan-400"
                      : "bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white/70"
                  }`}>
                    <item.icon className="h-3.5 w-3.5" />
                  </div>
                  <span>{item.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(0,212,255,0.8)]"
                    />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-white/3 hover:bg-white/5 transition-colors cursor-pointer border border-white/5">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-purple-600 text-white text-xs font-bold">
              OM
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-white/80 leading-none truncate">Ops Manager</span>
            <span className="text-[11px] text-cyan-400/70 mt-1">Administrator</span>
          </div>
          <div className="ml-auto h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between glass-header px-4 sm:px-6">
      <div className="flex items-center md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2 text-white/60 hover:text-white hover:bg-white/10">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 border-none bg-transparent">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
      <div className="flex items-center gap-3 w-full justify-end">
        <div className="hidden md:flex relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
          <Input
            type="search"
            placeholder="Quick search..."
            className="w-full pl-9 bg-white/5 border-white/10 text-white/70 placeholder:text-white/25 focus-visible:ring-cyan-500/40 focus-visible:border-cyan-500/30 rounded-xl text-sm"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-white/50 hover:text-white hover:bg-white/8 rounded-xl border border-white/5 h-9 w-9"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-cyan-400 border border-cyan-400 shadow-[0_0_6px_rgba(0,212,255,0.8)]" />
        </Button>
      </div>
    </header>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-[100dvh] w-full overflow-hidden" style={{ background: "hsl(228,30%,5%)" }}>
      {/* Ambient background orbs */}
      <div className="orb h-[500px] w-[500px] top-[-150px] left-[200px] opacity-[0.07]"
        style={{ background: "radial-gradient(circle, #00d4ff 0%, transparent 70%)" }} />
      <div className="orb h-[400px] w-[400px] bottom-[-100px] right-[300px] opacity-[0.06]"
        style={{ background: "radial-gradient(circle, #a855f7 0%, transparent 70%)" }} />
      <div className="orb h-[300px] w-[300px] top-[40%] right-[5%] opacity-[0.05]"
        style={{ background: "radial-gradient(circle, #34d399 0%, transparent 70%)" }} />

      {/* Subtle grid overlay */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(0,212,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Desktop Sidebar */}
      <aside className="relative z-20 hidden w-64 shrink-0 md:block">
        <div className="sticky top-0 h-screen">
          <SidebarContent />
        </div>
      </aside>

      {/* Main */}
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
