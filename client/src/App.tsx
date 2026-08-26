import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DreamDetail from "./pages/DreamDetail";
import Dreams from "./pages/Dreams";
import AdminDreams from "./pages/AdminDreams";
import AdminAgents from "./pages/AdminAgents";
import AdminOverview from "./pages/AdminOverview";
import AdminResults from "./pages/AdminResults";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import ResultDetail from "./pages/ResultDetail";
import Results from "./pages/Results";
import AgentActivation from "./pages/AgentActivation";
import AgentHome from "./pages/AgentHome";
import AgentPassword from "./pages/AgentPassword";
import PlayerAccount from "./pages/PlayerAccount";
import PlayerActivation from "./pages/PlayerActivation";

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/results" component={Results} />
    <Route path="/results/:id" component={ResultDetail} />
    <Route path="/dreams" component={Dreams} />
    <Route path="/dreams/:slug" component={DreamDetail} />
    <Route path="/player" component={PlayerAccount} />
    <Route path="/player/activate" component={PlayerActivation} />
    <Route path="/agent/login" component={AgentActivation} />
    <Route path="/agent/activate" component={AgentActivation} />
    <Route path="/agent/password" component={AgentPassword} />
    <Route path="/agent" component={AgentHome} />
    <Route path="/admin" component={AdminOverview} />
    <Route path="/admin/results" component={AdminResults} />
    <Route path="/admin/dreams" component={AdminDreams} />
    <Route path="/admin/agents" component={AdminAgents} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="dark"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
