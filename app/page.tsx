'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
} from 'lucide-react'

// Import UI components (we'll create these next)
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

// First-run guidance overlay
function FirstRunGuide({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-indigo-600"/> 
            Welcome to Idea→Startup Studio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Here's how to get started:</p>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Enter a project title, one-liner, and your idea details.</li>
            <li>Choose <span className="font-mono">Simulated</span> (default) or set an API base URL for <span className="font-mono">Live API</span>.</li>
            <li>Click <span className="font-semibold">Generate Dossier</span> to see PRD, wireframes, code, and runbook.</li>
            <li>Export with <span className="font-semibold">Download Repo</span> or push directly via <span className="font-semibold">Add Repo to GitHub</span>.</li>
          </ol>
          <div className="flex justify-end">
            <Button onClick={onDismiss}>Got it</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Main Studio Interface Component
function StudioInterface() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
            Idea→Startup Studio
          </h1>
          <p className="text-lg text-muted-foreground mt-4">
            Transform raw ideas into structured startup scaffolds in minutes
          </p>
        </motion.div>
        
        {/* Mode Badge */}
        <Badge className="mode-badge simulated">
          <div className="w-2 h-2 bg-blue-500 rounded-full" />
          Simulated Mode
        </Badge>
      </div>

      {/* Pipeline Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="size-5" />
            Pipeline Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {[
              { name: 'Normalize', icon: Brain, status: 'pending' },
              { name: 'Research', icon: FileText, status: 'pending' },
              { name: 'Feasibility', icon: Cpu, status: 'pending' },
              { name: 'Market & Moat', icon: LineChart, status: 'pending' },
              { name: 'Risk', icon: Shield, status: 'pending' },
              { name: 'UX', icon: Layout, status: 'pending' },
              { name: 'Scaffold', icon: Hammer, status: 'pending' },
              { name: 'Export', icon: Download, status: 'pending' },
            ].map((stage, index) => {
              const Icon = stage.icon
              return (
                <div key={stage.name} className={`pipeline-stage ${stage.status}`}>
                  <Icon className="size-6 mb-2" />
                  <span className="text-sm font-medium">{stage.name}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Interface */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Idea Input Panel */}
        <Card className="idea-input-panel">
          <CardHeader>
            <CardTitle>Your Startup Idea</CardTitle>
            <CardDescription>
              Tell us about your idea and we'll generate a complete startup dossier
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title</Label>
              <Input id="title" placeholder="Enter your startup name..." />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="oneLiner">One-liner</Label>
              <Input id="oneLiner" placeholder="Describe your startup in one sentence..." />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="idea">Idea Details</Label>
              <Textarea 
                id="idea" 
                placeholder="Describe your startup idea, target market, problem you're solving..."
                rows={8}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch id="api-mode" />
              <Label htmlFor="api-mode">Use Live API (requires API key)</Label>
            </div>
            
            <Button className="w-full" size="lg">
              <Sparkles className="size-4 mr-2" />
              Generate Dossier
            </Button>
          </CardContent>
        </Card>

        {/* Output Preview Panel */}
        <Card className="output-preview">
          <CardHeader>
            <CardTitle>Generated Outputs</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="prd" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="prd">PRD</TabsTrigger>
                <TabsTrigger value="wireframes">Wireframes</TabsTrigger>
                <TabsTrigger value="code">Code</TabsTrigger>
                <TabsTrigger value="runbook">Runbook</TabsTrigger>
              </TabsList>
              
              <TabsContent value="prd" className="space-y-4">
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="size-12 mx-auto mb-4 opacity-50" />
                  <p>Generate your idea to see the PRD appear here</p>
                </div>
              </TabsContent>
              
              <TabsContent value="wireframes" className="space-y-4">
                <div className="text-center py-12 text-muted-foreground">
                  <Layout className="size-12 mx-auto mb-4 opacity-50" />
                  <p>Wireframes will be generated based on your startup type</p>
                </div>
              </TabsContent>
              
              <TabsContent value="code" className="space-y-4">
                <div className="text-center py-12 text-muted-foreground">
                  <Boxes className="size-12 mx-auto mb-4 opacity-50" />
                  <p>Code scaffold and project structure will appear here</p>
                </div>
              </TabsContent>
              
              <TabsContent value="runbook" className="space-y-4">
                <div className="text-center py-12 text-muted-foreground">
                  <TerminalSquare className="size-12 mx-auto mb-4 opacity-50" />
                  <p>Agent runbook with step-by-step instructions</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Export Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="size-5" />
            Export Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" disabled>
              <Download className="size-4 mr-2" />
              Download ZIP
            </Button>
            <Button variant="outline" disabled>
              <Github className="size-4 mr-2" />
              Push to GitHub
            </Button>
            <Button variant="outline" disabled>
              <Cloud className="size-4 mr-2" />
              Deploy Preview
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Export options will be available after generating your dossier
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function I2SPage() {
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem('i2s_seen_guide')
    if (!seen) {
      setShowGuide(true)
    }
  }, [])

  function dismissGuide() {
    localStorage.setItem('i2s_seen_guide', 'true')
    setShowGuide(false)
  }

  return (
    <>
      <StudioInterface />
      {showGuide && <FirstRunGuide onDismiss={dismissGuide} />}
    </>
  )
}
