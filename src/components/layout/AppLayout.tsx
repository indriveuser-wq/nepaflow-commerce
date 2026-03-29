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
      <div className="min-h-screen flex w-full">
        {!isMobile && <AppSidebar />}
        <div className="flex-1 flex flex-col min-w-0">
          {!isMobile && (
            <header className="h-14 flex items-center border-b px-4 bg-card/50 backdrop-blur-sm sticky top-0 z-30">
              <SidebarTrigger className="mr-4" />
              <div className="flex-1" />
              {role && (
                <Badge variant="outline" className="capitalize text-xs">
                  {role}
                </Badge>
              )}
              {profile?.full_name && (
                <span className="ml-3 text-sm text-muted-foreground">{profile.full_name}</span>
              )}
            </header>
          )}
          <main className={`flex-1 p-3 md:p-6 overflow-auto ${isMobile ? 'pb-20' : ''}`}>
            {children}
          </main>
        </div>
        {isMobile && <MobileBottomNav />}
      </div>
    </SidebarProvider>
  );
}
