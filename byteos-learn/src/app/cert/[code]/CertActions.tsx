'use client'

import { useState } from 'react'

export function CertActions() {
  const [copied, setCopied] = useState(false)

  function handlePrint() {
    window.print()
  }

  function handleCopyLink() {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="print:hidden mt-6 flex items-center gap-3">
      <button
        type="button"
        onClick={handlePrint}
        className="px-5 py-2.5 bg-primary hover:opacity-90 text-primary-foreground text-sm font-medium rounded-button transition-colors"
      >
        Print / Save as PDF
      </button>
      <button
        type="button"
        onClick={handleCopyLink}
        className="px-5 py-2.5 bg-card hover:bg-muted text-card-foreground text-sm font-medium rounded-button border border-border transition-colors"
      >
        {copied ? '✓ Copied!' : 'Copy link'}
      </button>
    </div>
  )
}
