import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import POS from "./pages/POS";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/products" element={<AppLayout><Products /></AppLayout>} />
          <Route path="/inventory" element={<AppLayout><Inventory /></AppLayout>} />
          <Route path="/orders" element={<AppLayout><Orders /></AppLayout>} />
          <Route path="/orders/:id" element={<AppLayout><OrderDetail /></AppLayout>} />
          <Route path="/pos" element={<AppLayout><POS /></AppLayout>} />
          <Route path="/customers" element={<AppLayout><Customers /></AppLayout>} />
          <Route path="/customers/:id" element={<AppLayout><CustomerDetail /></AppLayout>} />
          <Route path="/payments" element={<AppLayout><Payments /></AppLayout>} />
          <Route path="/invoices" element={<AppLayout><Invoices /></AppLayout>} />
          <Route path="/invoices/:id" element={<AppLayout><InvoiceView /></AppLayout>} />
          <Route path="/logistics" element={<AppLayout><Logistics /></AppLayout>} />
          <Route path="/analytics" element={<AppLayout><Analytics /></AppLayout>} />
          <Route path="/staff" element={<AppLayout><Staff /></AppLayout>} />
          <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
