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

// Hook to manage command palette state
export function useCommandPalette() {
  const [open, setOpen] = React.useState(false)
  const [recentPages, setRecentPages] = React.useState<string[]>([])
  const [searchHistory, setSearchHistory] = React.useState<string[]>([])

  // Keyboard shortcut handler
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Load from localStorage
  React.useEffect(() => {
    const savedRecent = localStorage.getItem("command-palette-recent")
    const savedHistory = localStorage.getItem("command-palette-history")

    if (savedRecent) {
      try {
        setRecentPages(JSON.parse(savedRecent))
      } catch (e) {
        console.error("Failed to parse recent pages", e)
      }
    }

    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory))
      } catch (e) {
        console.error("Failed to parse search history", e)
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

  return {
    open,
    setOpen,
    recentPages,
    addToRecent,
    searchHistory,
    addToHistory,
    clearHistory,
  }
}

// Main Command Palette Component
export function CommandPalette() {
  const navigate = useNavigate()
  const { open, setOpen, recentPages, addToRecent, searchHistory, addToHistory } =
    useCommandPalette()
  const [search, setSearch] = React.useState("")

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
        id: "nav-crm",
        label: "CRM",
        icon: Users,
        route: "/crm",
        keywords: ["clients", "customers", "relationships"],
        group: "navigation",
        priority: 9,
      },
      {
        id: "nav-clients",
        label: "Clients",
        icon: UserCircle,
        route: "/crm?tab=clients",
        keywords: ["customers", "contacts"],
        group: "navigation",
        priority: 7,
      },
      {
        id: "nav-campaigns",
        label: "Campaigns",
        icon: TrendingUp,
        route: "/crm?tab=campaigns",
        keywords: ["deals", "pipeline"],
        group: "navigation",
        priority: 7,
      },
      {
        id: "nav-catalog",
        label: "Catalog",
        icon: Music,
        route: "/catalog/works",
        keywords: ["music", "works", "recordings"],
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
        id: "action-new-client",
        label: "Add New Client",
        icon: Plus,
        keywords: ["add client", "create contact"],
        group: "actions",
        priority: 8,
        action: () => {
          navigate("/crm?tab=clients")
          // Trigger new client dialog
        },
      },
      {
        id: "action-new-campaign",
        label: "Create Campaign",
        icon: Plus,
        keywords: ["add campaign", "new deal"],
        group: "actions",
        priority: 7,
        action: () => {
          navigate("/crm?tab=campaigns")
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
          console.log("Export action")
        },
      },
    ],
    [navigate]
  )

  // Filter commands based on search
  const filteredCommands = React.useMemo(() => {
    if (!search) return commands

    const searchLower = search.toLowerCase()
    return commands.filter((cmd) => {
      const matchLabel = cmd.label.toLowerCase().includes(searchLower)
      const matchKeywords = cmd.keywords?.some((kw) =>
        kw.toLowerCase().includes(searchLower)
      )
      return matchLabel || matchKeywords
    })
  }, [commands, search])

  // Group commands
  const groupedCommands = React.useMemo(() => {
    const groups: Record<string, CommandItem[]> = {
      recent: [],
      navigation: [],
      actions: [],
      search: [],
    }

    // Add recent pages
    if (!search && recentPages.length > 0) {
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
  }, [filteredCommands, recentPages, search, commands])

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
    <>
      {/* Trigger button (optional - could be in TopBar) */}
      <button
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground md:flex"
      >
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Type a command or search..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>
            <div className="py-6 text-center text-sm">
              <p className="text-muted-foreground">No results found.</p>
              {search && (
                <p className="mt-2 text-xs text-muted-foreground">
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
                    className="gap-2"
                  >
                    {cmd.icon && <cmd.icon className="h-4 w-4" />}
                    <span>{cmd.label}</span>
                    <Clock className="ml-auto h-3 w-3 text-muted-foreground" />
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
                    className="gap-2"
                  >
                    {cmd.icon && <cmd.icon className="h-4 w-4" />}
                    <span>{cmd.label}</span>
                    {cmd.shortcut && (
                      <CommandShortcut>{cmd.shortcut}</CommandShortcut>
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
                    className="gap-2"
                  >
                    {cmd.icon && <cmd.icon className="h-4 w-4" />}
                    <span>{cmd.label}</span>
                    {cmd.shortcut && (
                      <CommandShortcut>{cmd.shortcut}</CommandShortcut>
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
                    className="gap-2"
                  >
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{query}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>

        {/* Footer hint */}
        <div className="border-t px-4 py-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>
              Press <kbd className="rounded border px-1 font-mono">↑↓</kbd> to
              navigate
            </span>
            <span>
              Press <kbd className="rounded border px-1 font-mono">Enter</kbd> to
              select
            </span>
            <span>
              Press <kbd className="rounded border px-1 font-mono">Esc</kbd> to
              close
            </span>
          </div>
        </div>
      </CommandDialog>
    </>
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
