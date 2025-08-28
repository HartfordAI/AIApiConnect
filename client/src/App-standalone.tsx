import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ChatStandalone from "@/pages/chat-standalone";

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <ChatStandalone />
    </TooltipProvider>
  );
}

export default App;