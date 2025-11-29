'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

interface DeployGuideModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  slug: string
}

export function DeployGuideModal({ open, onOpenChange, slug }: DeployGuideModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white text-slate-900 border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-slate-900">Deploy to Vercel</DialogTitle>
          <DialogDescription className="text-slate-700">
            Push the generated repo to GitHub, then import on Vercel.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-[14px] leading-7 text-slate-700">
          <p className="text-slate-900">Steps</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Click <span className="font-mono">Download Repo</span> after generating a dossier.
            </li>
            <li>
              Unzip &rarr; <span className="font-mono">cd &lt;{slug}&gt;</span> &rarr; initialize
              git and push:
              <pre className="mt-2 rounded bg-slate-50 p-3 border border-slate-200 whitespace-pre-wrap text-[13px]">
{`git init
git add -A
git commit -m "init"
git branch -M main
git remote add origin https://github.com/YOUR-USER/${slug}.git
git push -u origin main`}
              </pre>
            </li>
            <li>
              Open{' '}
              <a
                className="underline"
                href="https://vercel.com/new"
                target="_blank"
                rel="noreferrer"
              >
                vercel.com/new
              </a>{' '}
              &rarr; Import the repo &rarr; Deploy.
            </li>
            <li>
              Optional: set env <span className="font-mono">NEXT_PUBLIC_API_BASE</span> to your
              backend URL; toggle <span className="font-mono">Live backend</span> here to use it.
            </li>
          </ol>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
