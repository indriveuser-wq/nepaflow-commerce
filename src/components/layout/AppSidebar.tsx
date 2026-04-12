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
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {visibleItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={location.pathname === item.url || location.pathname.startsWith(item.url + '/')}>
                <NavLink to={item.url} end={item.url === '/dashboard'} className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                  <item.icon className="mr-2 h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
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
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-display font-bold text-sm">{initial}</div>
          {!collapsed && <span className="font-display font-bold text-lg tracking-tight">{displayName}</span>}
        </div>
      </SidebarHeader>
      <SidebarContent className="overflow-y-auto scrollbar-none">
        <NavGroup label="Main" items={mainItems} />
        <NavGroup label="Finance" items={financeItems} />
        <NavGroup label="Operations" items={operationItems} />
      </SidebarContent>
      <SidebarFooter className="p-3 space-y-2">
        {!collapsed && profile?.full_name && (
          <p className="text-xs text-sidebar-foreground/60 truncate px-2">{profile.full_name}</p>
        )}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={signOut} className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
