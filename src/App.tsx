import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { SidebarProvider } from "@/components/ui/sidebar";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Threats from "./pages/Threats";
import Network from "./pages/Network";
import AIAnalysis from "./pages/AIAnalysis";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import SystemMonitor from "./pages/SystemMonitor";
import ThreatHistory from "./pages/ThreatHistory";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AppSidebar } from "./components/navigation/AppSidebar";

const queryClient = new QueryClient();

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        {children}
      </div>
    </SidebarProvider>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="sentinel-theme" attribute="class">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedLayout><Index /></ProtectedLayout>} />
            <Route path="/threats" element={<ProtectedLayout><Threats /></ProtectedLayout>} />
            <Route path="/network" element={<ProtectedLayout><Network /></ProtectedLayout>} />
            <Route path="/ai-analysis" element={<ProtectedLayout><AIAnalysis /></ProtectedLayout>} />
            <Route path="/reports" element={<ProtectedLayout><Reports /></ProtectedLayout>} />
            <Route path="/notifications" element={<ProtectedLayout><Notifications /></ProtectedLayout>} />
            <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />
            <Route path="/system-monitor" element={<ProtectedLayout><SystemMonitor /></ProtectedLayout>} />
            <Route path="/threat-history" element={<ProtectedLayout><ThreatHistory /></ProtectedLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
