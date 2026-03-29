import { LayoutDashboard, Store, ShoppingCart, Package, Users, MoreHorizontal } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Warehouse, CreditCard, FileText, Truck, BarChart3, UserCog, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type NavItem = { title: string; url: string; icon: React.ComponentType<{ className?: string }>; roles?: string[] };

const mainTabs: NavItem[] = [
  { title: "Home", url: "/dashboard", icon: LayoutDashboard },
  { title: "POS", url: "/pos", icon: Store },
  { title: "Orders", url: "/orders", icon: ShoppingCart },
  { title: "Products", url: "/products", icon: Package },
  { title: "More", url: "#more", icon: MoreHorizontal },
];

const moreItems: NavItem[] = [
  { title: "Inventory", url: "/inventory", icon: Warehouse },
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Payments", url: "/payments", icon: CreditCard, roles: ['admin', 'manager'] },
  { title: "Invoices", url: "/invoices", icon: FileText },
  { title: "Logistics", url: "/logistics", icon: Truck, roles: ['admin', 'manager'] },
  { title: "Analytics", url: "/analytics", icon: BarChart3, roles: ['admin', 'manager'] },
  { title: "Staff", url: "/staff", icon: UserCog, roles: ['admin'] },
  { title: "Settings", url: "/settings", icon: Settings, roles: ['admin'] },
];

export function MobileBottomNav() {
  const [showMore, setShowMore] = useState(false);
  const location = useLocation();
  const { role } = useAuth();

  const visibleMore = moreItems.filter(item => !item.roles || (role && item.roles.includes(role)));

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-md md:hidden">
        <div className="flex items-center justify-around h-14">
          {mainTabs.map((tab) => {
            if (tab.url === "#more") {
              const isMoreActive = visibleMore.some(m => location.pathname.startsWith(m.url));
              return (
                <button key={tab.title} onClick={() => setShowMore(true)}
                  className={cn("flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-muted-foreground transition-colors", isMoreActive && "text-primary")}>
                  <tab.icon className="h-5 w-5" /><span className="text-[10px] font-medium">{tab.title}</span>
                </button>
              );
            }
            const isActive = location.pathname === tab.url || location.pathname.startsWith(tab.url + '/');
            return (
              <NavLink key={tab.title} to={tab.url}
                className={cn("flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-muted-foreground transition-colors", isActive && "text-primary")}>
                <tab.icon className="h-5 w-5" /><span className="text-[10px] font-medium">{tab.title}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      <Sheet open={showMore} onOpenChange={setShowMore}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader><SheetTitle className="font-display">More</SheetTitle></SheetHeader>
          <div className="grid grid-cols-4 gap-3 py-4">
            {visibleMore.map((item) => {
              const isActive = location.pathname.startsWith(item.url);
              return (
                <NavLink key={item.title} to={item.url} onClick={() => setShowMore(false)}
                  className={cn("flex flex-col items-center gap-1.5 rounded-xl p-3 transition-colors hover:bg-accent", isActive && "bg-primary/10 text-primary")}>
                  <item.icon className="h-5 w-5" /><span className="text-xs font-medium">{item.title}</span>
                </NavLink>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
