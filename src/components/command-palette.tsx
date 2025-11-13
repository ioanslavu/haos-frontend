/**
 * Global Command Palette - 2025 Edition
 *
 * Features:
 * - ⌘K / Ctrl+K keyboard shortcut
 * - Smart navigation (recent pages, quick access)
 * - Global search across entities
 * - Action commands (create, export, etc.)
 * - Recent searches and history
 * - Keyboard-first navigation
 * - Grouped and prioritized results
 */

import * as React from "react"
import { useNavigate } from "react-router-dom"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import {
  FileText,
  Users,
  LayoutDashboard,
  Music,
  Settings,
  Search,
  Plus,
  FileSpreadsheet,
  Calendar,
  Bell,
  Clock,
  TrendingUp,
  Hash,
  Building2,
  UserCircle,
  Briefcase,
  FileSignature,
} from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"

// Command types for type safety
type CommandAction = () => void
type CommandRoute = string

interface CommandItem {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  shortcut?: string
  keywords?: string[]
  action?: CommandAction
  route?: CommandRoute
  group: "navigation" | "actions" | "recent" | "search"
  priority?: number
}

// Context for managing command palette state
const CommandPaletteContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
  recentPages: string[]
  addToRecent: (page: string) => void
  searchHistory: string[]
  addToHistory: (query: string) => void
  clearHistory: () => void
} | null>(null)

// Provider component
export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const [recentPages, setRecentPages] = React.useState<string[]>([])
  const [searchHistory, setSearchHistory] = React.useState<string[]>([])

  // ===== SEARCH BAR KEYBOARD SHORTCUT DISABLED (2025-01-13) =====
  // To re-enable:
  // 1. Uncomment the useEffect block below
  // 2. Uncomment search bar UI in TopBar.tsx (lines ~40-54)
  // 3. Uncomment onClick handler in TopBar.tsx (line ~42)
  // Reason: Temporarily disabled per user request
  // ================================================================

  // Keyboard shortcut handler
  // React.useEffect(() => {
  //   const down = (e: KeyboardEvent) => {
  //     if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
  //       e.preventDefault()
  //       setOpen((open) => !open)
  //     }
  //   }

  //   document.addEventListener("keydown", down)
  //   return () => document.removeEventListener("keydown", down)
  // }, [])

  // Load from localStorage
  React.useEffect(() => {
    const savedRecent = localStorage.getItem("command-palette-recent")
    const savedHistory = localStorage.getItem("command-palette-history")

    if (savedRecent) {
      try {
        setRecentPages(JSON.parse(savedRecent))
      } catch (e) {
      }
    }

    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory))
      } catch (e) {
      }
    }
  }, [])

  const addToRecent = React.useCallback((page: string) => {
    setRecentPages((prev) => {
      const updated = [page, ...prev.filter((p) => p !== page)].slice(0, 5)
      localStorage.setItem("command-palette-recent", JSON.stringify(updated))
      return updated
    })
  }, [])

  const addToHistory = React.useCallback((query: string) => {
    if (!query.trim()) return
    setSearchHistory((prev) => {
      const updated = [query, ...prev.filter((q) => q !== query)].slice(0, 10)
      localStorage.setItem("command-palette-history", JSON.stringify(updated))
      return updated
    })
  }, [])

  const clearHistory = React.useCallback(() => {
    setSearchHistory([])
    localStorage.removeItem("command-palette-history")
  }, [])

  const value = React.useMemo(
    () => ({
      open,
      setOpen,
      recentPages,
      addToRecent,
      searchHistory,
      addToHistory,
      clearHistory,
    }),
    [open, recentPages, searchHistory, addToRecent, addToHistory, clearHistory]
  )

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
    </CommandPaletteContext.Provider>
  )
}

// Hook to use command palette context
export function useCommandPalette() {
  const context = React.useContext(CommandPaletteContext)
  if (!context) {
    throw new Error("useCommandPalette must be used within CommandPaletteProvider")
  }
  return context
}

// Main Command Palette Component
export function CommandPalette() {
  const navigate = useNavigate()
  const { open, setOpen, recentPages, addToRecent, searchHistory, addToHistory } =
    useCommandPalette()
  const [search, setSearch] = React.useState("")

  // Debounce search to improve performance (300ms delay)
  const debouncedSearch = useDebounce(search, 300)

  // Define all available commands
  const commands: CommandItem[] = React.useMemo(
    () => [
      // Navigation
      {
        id: "nav-dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        route: "/",
        keywords: ["home", "overview", "main"],
        group: "navigation",
        shortcut: "G D",
        priority: 10,
      },
      {
        id: "nav-contracts",
        label: "Contracts",
        icon: FileSignature,
        route: "/contracts",
        keywords: ["agreements", "documents"],
        group: "navigation",
        shortcut: "G C",
        priority: 9,
      },
      {
        id: "nav-templates",
        label: "Templates",
        icon: FileText,
        route: "/templates",
        keywords: ["contract templates"],
        group: "navigation",
        priority: 8,
      },
      {
        id: "nav-users",
        label: "Users",
        icon: Users,
        route: "/users",
        keywords: ["team", "members", "staff"],
        group: "navigation",
        priority: 6,
      },
      {
        id: "nav-settings",
        label: "Settings",
        icon: Settings,
        route: "/company-settings",
        keywords: ["preferences", "configuration"],
        group: "navigation",
        shortcut: "G S",
        priority: 5,
      },

      // Actions
      {
        id: "action-new-contract",
        label: "Create New Contract",
        icon: Plus,
        keywords: ["add", "new contract", "generate"],
        group: "actions",
        priority: 10,
        action: () => {
          navigate("/contracts")
          // Trigger new contract dialog - would need to be implemented
        },
      },
      {
        id: "action-export",
        label: "Export Data",
        icon: FileSpreadsheet,
        keywords: ["download", "csv", "export"],
        group: "actions",
        priority: 5,
        action: () => {
          // Would trigger export dialog
        },
      },
    ],
    [navigate]
  )

  // Filter commands based on debounced search (improves performance)
  const filteredCommands = React.useMemo(() => {
    if (!debouncedSearch) return commands

    const searchLower = debouncedSearch.toLowerCase()
    return commands.filter((cmd) => {
      const matchLabel = cmd.label.toLowerCase().includes(searchLower)
      const matchKeywords = cmd.keywords?.some((kw) =>
        kw.toLowerCase().includes(searchLower)
      )
      return matchLabel || matchKeywords
    })
  }, [commands, debouncedSearch])

  // Group commands
  const groupedCommands = React.useMemo(() => {
    const groups: Record<string, CommandItem[]> = {
      recent: [],
      navigation: [],
      actions: [],
      search: [],
    }

    // Add recent pages
    if (!debouncedSearch && recentPages.length > 0) {
      groups.recent = commands
        .filter((cmd) => recentPages.includes(cmd.route || ""))
        .slice(0, 5)
    }

    // Group filtered commands
    filteredCommands.forEach((cmd) => {
      if (groups[cmd.group]) {
        groups[cmd.group].push(cmd)
      }
    })

    // Sort by priority
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => (b.priority || 0) - (a.priority || 0))
    })

    return groups
  }, [filteredCommands, recentPages, debouncedSearch, commands])

  const handleSelect = React.useCallback(
    (cmd: CommandItem) => {
      if (cmd.action) {
        cmd.action()
      } else if (cmd.route) {
        navigate(cmd.route)
        addToRecent(cmd.route)
      }

      if (search) {
        addToHistory(search)
      }

      setOpen(false)
      setSearch("")
    },
    [navigate, addToRecent, addToHistory, search, setOpen]
  )

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>
            <div className="py-12 text-center">
              <div className="mb-3">
                <Search className="h-12 w-12 mx-auto text-muted-foreground/40" />
              </div>
              <p className="text-base font-medium text-foreground mb-2">No results found</p>
              {search && (
                <p className="text-sm text-muted-foreground">
                  Try searching for: contracts, clients, templates
                </p>
              )}
            </div>
          </CommandEmpty>

          {/* Recent Pages */}
          {groupedCommands.recent.length > 0 && (
            <>
              <CommandGroup heading="Recent">
                {groupedCommands.recent.map((cmd) => (
                  <CommandItem
                    key={cmd.id}
                    onSelect={() => handleSelect(cmd)}
                    className="gap-3"
                  >
                    {cmd.icon && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                        <cmd.icon className="h-4 w-4" />
                      </div>
                    )}
                    <span className="flex-1 font-medium">{cmd.label}</span>
                    <Clock className="h-4 w-4 text-muted-foreground/50" />
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {/* Navigation */}
          {groupedCommands.navigation.length > 0 && (
            <>
              <CommandGroup heading="Navigation">
                {groupedCommands.navigation.map((cmd) => (
                  <CommandItem
                    key={cmd.id}
                    onSelect={() => handleSelect(cmd)}
                    className="gap-3"
                  >
                    {cmd.icon && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                        <cmd.icon className="h-4 w-4" />
                      </div>
                    )}
                    <span className="flex-1 font-medium">{cmd.label}</span>
                    {cmd.shortcut && (
                      <kbd className="hidden sm:inline-flex px-2 py-1 rounded-md border border-white/20 bg-white/40 dark:bg-white/10 font-mono text-xs font-medium">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {/* Actions */}
          {groupedCommands.actions.length > 0 && (
            <>
              <CommandGroup heading="Actions">
                {groupedCommands.actions.map((cmd) => (
                  <CommandItem
                    key={cmd.id}
                    onSelect={() => handleSelect(cmd)}
                    className="gap-3"
                  >
                    {cmd.icon && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                        <cmd.icon className="h-4 w-4" />
                      </div>
                    )}
                    <span className="flex-1 font-medium">{cmd.label}</span>
                    {cmd.shortcut && (
                      <kbd className="hidden sm:inline-flex px-2 py-1 rounded-md border border-white/20 bg-white/40 dark:bg-white/10 font-mono text-xs font-medium">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* Search History */}
          {!search && searchHistory.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Recent Searches">
                {searchHistory.slice(0, 5).map((query, idx) => (
                  <CommandItem
                    key={`history-${idx}`}
                    onSelect={() => setSearch(query)}
                    className="gap-3"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-500/20 to-gray-500/20">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="flex-1 font-medium text-muted-foreground">{query}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>

        {/* Footer hint */}
        <div className="border-t border-white/10 px-5 py-4 bg-white/30 dark:bg-white/5 backdrop-blur-xl">
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <kbd className="px-2 py-1 rounded-lg border border-white/20 bg-white/40 dark:bg-white/10 font-mono text-xs font-medium shadow-sm">↑↓</kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-2 py-1 rounded-lg border border-white/20 bg-white/40 dark:bg-white/10 font-mono text-xs font-medium shadow-sm">⏎</kbd>
              <span>Select</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-2 py-1 rounded-lg border border-white/20 bg-white/40 dark:bg-white/10 font-mono text-xs font-medium shadow-sm">Esc</kbd>
              <span>Close</span>
            </span>
          </div>
        </div>
      </CommandDialog>
  )
}

// Keyboard shortcuts help dialog (bonus feature)
export function KeyboardShortcutsDialog() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "?" && (e.shiftKey || e.metaKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const shortcuts = [
    { keys: ["⌘", "K"], description: "Open command palette" },
    { keys: ["G", "D"], description: "Go to Dashboard" },
    { keys: ["G", "C"], description: "Go to Contracts" },
    { keys: ["G", "S"], description: "Go to Settings" },
    { keys: ["?"], description: "Show keyboard shortcuts" },
    { keys: ["Esc"], description: "Close dialog / Clear selection" },
  ]

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <div className="p-4">
        <h2 className="mb-4 text-lg font-semibold">Keyboard Shortcuts</h2>
        <div className="space-y-3">
          {shortcuts.map((shortcut, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="text-sm">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, keyIdx) => (
                  <kbd
                    key={keyIdx}
                    className="inline-flex h-6 min-w-[24px] items-center justify-center rounded border bg-muted px-2 font-mono text-xs font-medium"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </CommandDialog>
  )
}
