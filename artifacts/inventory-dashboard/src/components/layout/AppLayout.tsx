import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
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
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="flex h-14 items-center border-b border-sidebar-border px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Package className="h-6 w-6 text-sidebar-primary" />
          <span className="tracking-tight text-lg">InvenTrade</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 px-4 py-4">
        <nav className="flex flex-col gap-1">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <div className="mt-auto p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 rounded-md px-3 py-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">OM</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-none">Ops Manager</span>
            <span className="text-xs text-sidebar-foreground/60 mt-1">Admin</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b bg-white/95 px-4 sm:px-6 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex items-center md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2 md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 border-none">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
      <div className="flex items-center gap-4 w-full justify-between md:justify-end">
        <div className="hidden md:flex relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Quick search..." 
            className="w-full bg-muted/50 pl-9 border-none focus-visible:ring-1 focus-visible:ring-primary shadow-none" 
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive border-2 border-white"></span>
            <span className="sr-only">Notifications</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] w-full bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 md:block">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
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
