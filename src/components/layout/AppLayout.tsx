import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const { profile, role } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {!isMobile && <AppSidebar />}
        <div className="flex-1 flex flex-col min-w-0">
          {!isMobile && (
            <header className="h-14 flex items-center border-b px-5 glass-surface sticky top-0 z-30">
              <SidebarTrigger className="mr-4 hover:bg-accent transition-colors rounded-lg" />
              <div className="flex-1" />
              {role && (
                <Badge variant="outline" className="capitalize text-[10px] font-semibold tracking-wide border-primary/20 text-primary bg-primary/5">
                  {role}
                </Badge>
              )}
              {profile?.full_name && (
                <div className="ml-3 flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-primary-foreground text-xs font-bold">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">{profile.full_name}</span>
                </div>
              )}
            </header>
          )}
          <main className={`flex-1 p-4 md:p-7 overflow-auto ${isMobile ? 'pb-20' : ''}`}>
            {children}
          </main>
        </div>
        {isMobile && <MobileBottomNav />}
      </div>
    </SidebarProvider>
  );
}
