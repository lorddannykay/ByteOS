'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

interface SidebarContentContextValue {
  content: ReactNode
  setSidebarContent: (node: ReactNode) => void
}

const SidebarContentContext = createContext<SidebarContentContextValue | null>(null)

export function SidebarContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ReactNode>(null)
  const setSidebarContent = useCallback((node: ReactNode) => setContent(node), [])
  return (
    <SidebarContentContext.Provider value={{ content, setSidebarContent }}>
      {children}
    </SidebarContentContext.Provider>
  )
}

export function useSidebarContent() {
  return useContext(SidebarContentContext)
}
