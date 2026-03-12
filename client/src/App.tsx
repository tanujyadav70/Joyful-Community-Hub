import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import NotFound from "@/pages/not-found.tsx";
import { Toaster } from "@/components/ui/toaster.tsx";
import { TooltipProvider } from "@/components/ui/tooltip.tsx";

// Pages
import AuthPage from "@/pages/auth";
import HomeFeed from "@/pages/home";
import EventsPage from "@/pages/events";
import StudentDashboard from "@/pages/student-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import ProfilePage from "@/pages/profile";

import AppLayout from "@/components/layout/AppLayout";

function Router() {
  return (
    <Switch>
      <Route path="/" component={AuthPage} />
      <Route path="/login" component={AuthPage} />
      <Route path="/register" component={AuthPage} />
      
      {/* Protected Routes wrapped in AppLayout */}
      <Route>
        <AppLayout>
          <Switch>
            <Route path="/home" component={HomeFeed} />
            <Route path="/events" component={EventsPage} />
            <Route path="/student/dashboard" component={StudentDashboard} />
            <Route path="/admin/dashboard" component={AdminDashboard} />
            <Route path="/faculty-command" component={AdminDashboard} />
            <Route path="/profile/:id" component={ProfilePage} />
            <Route component={NotFound} />
          </Switch>
        </AppLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;