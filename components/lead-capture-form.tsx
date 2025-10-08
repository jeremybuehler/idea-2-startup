'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { motion, AnimatePresence } from 'framer-motion'

const captureEndpoint = process.env.NEXT_PUBLIC_LEAD_CAPTURE_URL || 'https://formspree.io/f/mgeglbpz'

interface Payload {
  email: string
  company?: string
  context?: string
}

export function LeadCaptureForm() {
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [context, setContext] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string>('')

  const disabled = status === 'loading'

  const reset = () => {
    setEmail('')
    setCompany('')
    setContext('')
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email.trim()) {
      setStatus('error')
      setMessage('Please enter a valid email address.')
      return
    }

    const payload: Payload = {
      email: email.trim(),
      company: company.trim() || undefined,
      context: context.trim() || undefined
    }

    if (!captureEndpoint) {
      setStatus('success')
      setMessage('Thanks! We will reach out shortly via hello@launchloom.com.')
      reset()
      return
    }

    try {
      setStatus('loading')
      setMessage('')

      const response = await fetch(captureEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`)
      }

      setStatus('success')
      setMessage('Thanks! We’ll reach out with availability within one business day.')
      reset()
    } catch (error) {
      console.error('Lead capture error', error)
      setStatus('error')
      setMessage('Something went wrong sending your request. Email us at hello@launchloom.com and we’ll jump in.')
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
      <h3 className="text-xl font-semibold text-slate-900">Ready to see Launchloom on your idea?</h3>
      <p className="text-slate-600 text-sm mt-1">Share your email and we’ll schedule a concierge run and walkthrough.</p>
      <form onSubmit={handleSubmit} className="mt-5 grid gap-4" noValidate>
        <div className="grid gap-2">
          <label htmlFor="launchloom-email" className="text-sm font-medium text-slate-700">Work email *</label>
          <Input
            id="launchloom-email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-11"
            required
            disabled={disabled}
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="launchloom-company" className="text-sm font-medium text-slate-700">Company / team</label>
          <Input
            id="launchloom-company"
            placeholder="Launch team, venture studio, innovation lab..."
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            className="h-11"
            disabled={disabled}
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="launchloom-context" className="text-sm font-medium text-slate-700">What should we know?</label>
          <Textarea
            id="launchloom-context"
            placeholder="Idea focus, timeline, existing assets..."
            value={context}
            onChange={(event) => setContext(event.target.value)}
            rows={4}
            disabled={disabled}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" className="h-11 px-6" disabled={disabled}>
            {status === 'loading' ? 'Sending…' : 'Request concierge run'}
          </Button>
          {!captureEndpoint && (
            <span className="text-xs text-slate-500">
              Tip: Set <code>NEXT_PUBLIC_LEAD_CAPTURE_URL</code> to connect Formspree, Airtable, or your CRM webhook.
            </span>
          )}
        </div>
      </form>
      <AnimatePresence>
        {status !== 'idle' && message && (
          <motion.p
            key={status}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={`mt-3 text-sm ${status === 'success' ? 'text-emerald-600' : 'text-red-600'}`}
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
