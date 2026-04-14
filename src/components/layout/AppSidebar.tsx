import {
  LayoutDashboard, Package, Warehouse, ShoppingCart, Store, Users, CreditCard,
  Truck, BarChart3, UserCog, Settings, FileText, LogOut,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type NavItem = { title: string; url: string; icon: React.ComponentType<{ className?: string }>; roles?: string[] };

const mainItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "POS", url: "/pos", icon: Store },
  { title: "Orders", url: "/orders", icon: ShoppingCart },
  { title: "Products", url: "/products", icon: Package },
  { title: "Inventory", url: "/inventory", icon: Warehouse },
  { title: "Customers", url: "/customers", icon: Users },
];

const financeItems: NavItem[] = [
  { title: "Payments", url: "/payments", icon: CreditCard, roles: ['admin', 'manager'] },
  { title: "Invoices", url: "/invoices", icon: FileText },
];

const operationItems: NavItem[] = [
  { title: "Logistics", url: "/logistics", icon: Truck, roles: ['admin', 'manager'] },
  { title: "Analytics", url: "/analytics", icon: BarChart3, roles: ['admin', 'manager'] },
  { title: "Staff", url: "/staff", icon: UserCog, roles: ['admin'] },
  { title: "Settings", url: "/settings", icon: Settings, roles: ['admin'] },
];

function NavGroup({ label, items }: { label: string; items: NavItem[] }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { role } = useAuth();

  const visibleItems = items.filter(item => !item.roles || (role && item.roles.includes(role)));
  if (visibleItems.length === 0) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 font-semibold mb-1">{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.url || location.pathname.startsWith(item.url + '/');
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <NavLink
                    to={item.url}
                    end={item.url === '/dashboard'}
                    className={`relative rounded-lg transition-all duration-150 group/nav ${isActive ? 'sidebar-glow text-sidebar-primary font-semibold' : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60'}`}
                    activeClassName=""
                  >
                    <item.icon className={`mr-2.5 h-[18px] w-[18px] shrink-0 transition-colors ${isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/50 group-hover/nav:text-sidebar-foreground/80'}`} />
                    {!collapsed && <span className="text-sm">{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { profile, signOut } = useAuth();
  const [businessName, setBusinessName] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.business_id) return;
    supabase.from('businesses').select('name').eq('id', profile.business_id).single()
      .then(({ data }) => { if (data) setBusinessName(data.name); });
  }, [profile?.business_id]);

  const displayName = businessName || 'My Store';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <Sidebar collapsible="icon" className="border-r-0 overflow-hidden">
      <SidebarHeader className="p-4 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/70 text-sidebar-primary-foreground font-display font-bold text-sm shadow-lg shadow-sidebar-primary/20">
            {initial}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="font-display font-bold text-base text-sidebar-accent-foreground tracking-tight block truncate">{displayName}</span>
              <span className="text-[10px] text-sidebar-foreground/40 font-medium">Admin Panel</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="overflow-y-auto scrollbar-none px-2">
        <NavGroup label="Main" items={mainItems} />
        <NavGroup label="Finance" items={financeItems} />
        <NavGroup label="Operations" items={operationItems} />
      </SidebarContent>
      <SidebarFooter className="p-3 space-y-2 border-t border-sidebar-border">
        {!collapsed && profile?.full_name && (
          <div className="px-2 py-1">
            <p className="text-xs font-medium text-sidebar-foreground/80 truncate">{profile.full_name}</p>
            <p className="text-[10px] text-sidebar-foreground/40 truncate">{profile.email}</p>
          </div>
        )}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={signOut} className="h-8 w-8 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
