import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Rocket,
  Workflow,
  FileText,
  Cpu,
  LineChart,
  Shield,
  Layout,
  Hammer,
  Boxes,
  TerminalSquare,
  GitBranch,
  CheckCircle2,
  Loader2,
  Download,
  Cloud,
  ServerCog,
  Github,
  HelpCircle,
  Info,
  Sparkles
} from "lucide-react";

// Ensure all required icons exist
function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden>
      <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 4.256 11.93l4.282 4.282a.75.75 0 1 0 1.06-1.06l-4.282-4.282A6.75 6.75 0 0 0 10.5 3.75Zm-5.25 6.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Z" clipRule="evenodd" />
    </svg>
  );
}

// Stub shadcn/ui components if not available
const Button = (props: any) => <button {...props} />;
const Card = (props: any) => <div {...props} />;
const CardContent = (props: any) => <div {...props} />;
const CardDescription = (props: any) => <p {...props} />;
const CardHeader = (props: any) => <div {...props} />;
const CardTitle = (props: any) => <h3 {...props} />;
const Input = (props: any) => <input {...props} />;
const Textarea = (props: any) => <textarea {...props} />;
const Tabs = (props: any) => <div {...props} />;
const TabsContent = (props: any) => <div {...props} />;
const TabsList = (props: any) => <div {...props} />;
const TabsTrigger = (props: any) => <button {...props} />;
const Badge = (props: any) => <span {...props} />;
const Progress = (props: any) => <progress {...props} />;
const Label = (props: any) => <label {...props} />;
const Switch = (props: any) => <input type="checkbox" {...props} />;
const ScrollArea = (props: any) => <div {...props} />;
const Dialog = (props: any) => <div {...props} />;
const DialogContent = (props: any) => <div {...props} />;
const DialogDescription = (props: any) => <p {...props} />;
const DialogFooter = (props: any) => <div {...props} />;
const DialogHeader = (props: any) => <div {...props} />;
const DialogTitle = (props: any) => <h2 {...props} />;

// First-run guidance overlay
function FirstRunGuide({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-lg max-w-md p-6 space-y-4 text-slate-800">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="size-5 text-indigo-600"/> Welcome to Idea→Startup Studio
        </h2>
        <p className="text-sm">Here’s how to get started:</p>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Enter a project title, one-liner, and your idea details.</li>
          <li>Choose <span className="font-mono">Simulated</span> (default) or set an API base URL for <span className="font-mono">Live API</span>.</li>
          <li>Click <span className="font-semibold">Generate Dossier</span> to see PRD, wireframes, code, and runbook.</li>
          <li>Export with <span className="font-semibold">Download Repo</span> or push directly via <span className="font-semibold">Add Repo to GitHub</span>.</li>
        </ol>
        <div className="flex justify-end">
          <Button onClick={onDismiss} className="px-4 py-2 bg-indigo-600 text-white rounded-md">Got it</Button>
        </div>
      </div>
    </div>
  );
}

export default function I2SApp() {
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("i2s_seen_guide");
    if (!seen) {
      setShowGuide(true);
    }
  }, []);

  function dismissGuide() {
    localStorage.setItem("i2s_seen_guide", "true");
    setShowGuide(false);
  }

  return (
    <div>
      App Loaded
      {showGuide && <FirstRunGuide onDismiss={dismissGuide} />}
    </div>
  );
}

// Self tests to ensure stubs exist
(function runSelfTests(){
  try {
    console.assert(typeof SearchIcon === 'function', 'SearchIcon should exist');
    console.assert(typeof Button === 'function', 'Button stub exists');
    console.log("Minimal build-safe version loaded");
  } catch (err) {
    console.error("Self-tests failed", err);
  }
})();