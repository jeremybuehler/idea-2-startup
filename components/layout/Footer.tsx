'use client'

import React from 'react'

export function Footer() {
  return (
    <footer className="py-10 text-center text-xs text-slate-500">
      &copy; {new Date().getFullYear()} Launchloom &mdash; Preview build
    </footer>
  )
}
