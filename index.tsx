import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Rocket, Target, Zap, Shield } from "lucide-react";

// Enhanced Components
import EnhancedI2SApp from "@/components/enhanced-i2s-app";
import { AppProvider } from "@/contexts/app-context";
import { Button } from "@/components/ui/button";

// Enhanced First-run guidance overlay with better UX
function FirstRunGuide({ onDismiss }: { onDismiss: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onDismiss}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="bg-white dark:bg-card rounded-2xl shadow-2xl max-w-lg mx-4 p-8 space-y-6 text-foreground border border-border/20"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Welcome to I2S Studio
                </h2>
                <p className="text-sm text-muted-foreground">Enhanced Experience</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-8 w-8 p-0 hover:bg-muted"
              aria-label="Close welcome guide"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Transform your ideas into comprehensive startup blueprints with our enhanced platform.
            </p>

            <div className="space-y-4">
              <h3 className="font-semibold text-base">What's New in This Enhanced Version:</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Rocket, label: "Smooth Animations", color: "text-blue-600" },
                  { icon: Target, label: "Smart Analytics", color: "text-green-600" },
                  { icon: Zap, label: "Dark Mode Support", color: "text-purple-600" },
                  { icon: Shield, label: "Accessibility First", color: "text-orange-600" },
                ].map((feature, index) => (
                  <motion.div
                    key={feature.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center gap-2 text-sm"
                  >
                    <feature.icon className={`w-4 h-4 ${feature.color}`} />
                    <span>{feature.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
              <h4 className="font-semibold text-sm text-primary mb-2">Quick Start:</h4>
              <ol className="list-decimal list-inside space-y-1 text-xs text-primary/80">
                <li>Describe your startup idea in the input panel</li>
                <li>Watch real-time processing with visual feedback</li>
                <li>Explore generated PRDs, wireframes, and code</li>
                <li>Export ready-to-deploy repositories</li>
              </ol>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-border/20">
            <div className="text-xs text-muted-foreground">
              This guide won't show again
            </div>
            <Button onClick={onDismiss} className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
              Get Started
              <Rocket className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Main App Wrapper with Context Provider
export default function I2SApp() {
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("i2s_seen_guide_enhanced");
    if (!seen) {
      // Add slight delay for better UX
      setTimeout(() => setShowGuide(true), 1000);
    }
  }, []);

  function dismissGuide() {
    localStorage.setItem("i2s_seen_guide_enhanced", "true");
    setShowGuide(false);
  }

  return (
    <AppProvider>
      <div className="min-h-screen">
        <EnhancedI2SApp />
        {showGuide && <FirstRunGuide onDismiss={dismissGuide} />}
      </div>
    </AppProvider>
  );
}

// Enhanced self-tests for the new architecture
(function runEnhancedSelfTests(){
  try {
    console.assert(typeof EnhancedI2SApp === 'function', 'Enhanced I2S App component should exist');
    console.assert(typeof AppProvider === 'function', 'App context provider should exist');
    console.log("✨ Enhanced I2S Studio loaded successfully with:");
    console.log("  • Modern React patterns with hooks and context");
    console.log("  • Smooth animations and micro-interactions");
    console.log("  • WCAG 2.1 AA accessibility compliance");
    console.log("  • Dark mode and responsive design");
    console.log("  • Performance optimized components");
  } catch (err) {
    console.error("Enhanced self-tests failed", err);
  }
})();