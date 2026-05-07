import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import SetupBusiness from "./pages/SetupBusiness";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import POS from "./pages/POS";
import POSScannerTest from "./pages/POSScannerTest";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import Payments from "./pages/Payments";
import Invoices from "./pages/Invoices";
import InvoiceView from "./pages/InvoiceView";
import Logistics from "./pages/Logistics";
import Analytics from "./pages/Analytics";
import Staff from "./pages/Staff";
import Settings from "./pages/Settings";
import NewOrder from "./pages/NewOrder";
import NotFound from "./pages/NotFound";
import PublicShop from "./pages/public/PublicShop";
import TrackOrder from "./pages/public/TrackOrder";

const queryClient = new QueryClient();

const P = ({ children, roles }: { children: React.ReactNode; roles?: ('admin' | 'manager' | 'cashier')[] }) => (
  <ProtectedRoute allowedRoles={roles}>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/setup-business" element={<SetupBusiness />} />
            <Route path="/shop/:slug" element={<PublicShop />} />
            <Route path="/shop/:slug/track" element={<TrackOrder />} />
            <Route path="/dashboard" element={<P><Dashboard /></P>} />
            <Route path="/products" element={<P><Products /></P>} />
            <Route path="/inventory" element={<P><Inventory /></P>} />
            <Route path="/orders" element={<P><Orders /></P>} />
            <Route path="/orders/new" element={<P roles={['admin', 'manager', 'cashier']}><NewOrder /></P>} />
            <Route path="/orders/:id" element={<P><OrderDetail /></P>} />
            <Route path="/pos" element={<P><POS /></P>} />
            <Route path="/pos/test" element={<P><POSScannerTest /></P>} />
            <Route path="/customers" element={<P><Customers /></P>} />
            <Route path="/customers/:id" element={<P><CustomerDetail /></P>} />
            <Route path="/payments" element={<P roles={['admin', 'manager']}><Payments /></P>} />
            <Route path="/invoices" element={<P><Invoices /></P>} />
            <Route path="/invoices/:id" element={<P><InvoiceView /></P>} />
            <Route path="/logistics" element={<P roles={['admin', 'manager']}><Logistics /></P>} />
            <Route path="/analytics" element={<P roles={['admin', 'manager']}><Analytics /></P>} />
            <Route path="/staff" element={<P roles={['admin']}><Staff /></P>} />
            <Route path="/settings" element={<P roles={['admin']}><Settings /></P>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
