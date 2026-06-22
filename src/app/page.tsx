'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Terminal as TerminalIcon,
  Server,
  Wifi,
  WifiOff,
  Cpu,
  HardDrive,
  MemoryStick,
  Globe,
  Shield,
  ChevronRight,
  Zap,
  X,
  Minus,
  Square,
  Copy,
  Trash2,
  Settings,
} from 'lucide-react'

interface PlanInfo {
  plan: string
  cpu: string
  ram: string
  storage: string
  bandwidth: string
  os: string
  region: string
}

interface TerminalLine {
  id: string
  content: string
  type: 'input' | 'output' | 'system' | 'error' | 'welcome'
}

export default function RAWTerminal() {
  // Auth state
  const [showAuthDialog, setShowAuthDialog] = useState(true)
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Connection state
  const [isConnected, setIsConnected] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null)

  // Terminal state
  const [lines, setLines] = useState<TerminalLine[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [cwd, setCwd] = useState('/home/raw-user')
  const [username, setUsername] = useState('raw-user')
  const [hostname, setHostname] = useState('raw-server')
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Boot state
  const [booting, setBooting] = useState(false)
  const [bootProgress, setBootProgress] = useState(0)
  const [bootStep, setBootStep] = useState('')

  // Refs
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const linesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll
  useEffect(() => {
    linesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  // Focus input
  useEffect(() => {
    if (isAuthenticated && !booting) {
      inputRef.current?.focus()
    }
  }, [isAuthenticated, booting])

  // Initialize socket
  useEffect(() => {
    const socketInstance = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    })

    setSocket(socketInstance)

    socketInstance.on('connect', () => {
      setIsConnected(true)
      console.log('Socket connected')
    })

    socketInstance.on('disconnect', () => {
      setIsConnected(false)
      console.log('Socket disconnected')
    })

    socketInstance.on('authenticated', (data: { sessionId: string; hostname: string; username: string; plan: PlanInfo }) => {
      setHostname(data.hostname)
      setUsername(data.username)
      setPlanInfo(data.plan)
      setAuthLoading(false)
      setIsAuthenticated(true)
      setShowAuthDialog(false)
      startBootSequence(data.plan)
    })

    socketInstance.on('auth-error', (data: { message: string }) => {
      setAuthLoading(false)
      setAuthError(data.message)
    })

    socketInstance.on('auth-required', () => {
      setShowAuthDialog(true)
      setIsAuthenticated(false)
    })

    socketInstance.on('output', (data: { output: string; cwd: string }) => {
      if (data.cwd) setCwd(data.cwd)
      if (data.output) {
        addLine(data.output, 'output')
      }
    })

    socketInstance.on('clear', () => {
      setLines([])
    })

    socketInstance.on('disconnected', (data: { message: string }) => {
      addLine(data.message, 'system')
      setIsAuthenticated(false)
    })

    socketInstance.on('tab-complete-result', (data: { completion?: string; suggestions?: string[] }) => {
      if (data.completion) {
        setCurrentInput(prev => prev + data.completion!)
      } else if (data.suggestions && data.suggestions.length > 0) {
        addLine(data.suggestions.join('  '), 'system')
      }
    })

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  const addLine = useCallback((content: string, type: TerminalLine['type']) => {
    const id = Math.random().toString(36).substr(2, 9)
    setLines(prev => [...prev, { id, content, type }])
  }, [])

  const startBootSequence = (plan: PlanInfo) => {
    setBooting(true)
    setBootProgress(0)

    const bootSteps = [
      { step: 'Initializing RAW Cloud instance...', progress: 10 },
      { step: `Loading ${plan.os}...`, progress: 25 },
      { step: 'Configuring network interfaces...', progress: 40 },
      { step: `Allocating ${plan.cpu}...`, progress: 55 },
      { step: `Mounting ${plan.storage} storage...`, progress: 70 },
      { step: `Assigning ${plan.ram} RAM...`, progress: 85 },
      { step: 'Starting system services...', progress: 95 },
      { step: 'Ready!', progress: 100 },
    ]

    let i = 0
    const interval = setInterval(() => {
      if (i < bootSteps.length) {
        setBootStep(bootSteps[i].step)
        setBootProgress(bootSteps[i].progress)
        i++
      } else {
        clearInterval(interval)
        setBooting(false)
        // Show welcome message
        addLine(
          `╔══════════════════════════════════════════════════════════════╗
║  \x1b[1;33mRAW Cloud Linux Terminal\x1b[0m - Free Plan                       ║
║  Connected as: ${username}@${hostname}                             ║
║  Type 'help' for available commands, 'plan' for plan details ║
╚══════════════════════════════════════════════════════════════╝`,
          'welcome'
        )
      }
    }, 500)
  }

  const handleAuth = () => {
    if (!email.trim() || !token.trim()) {
      setAuthError('البريد الإلكتروني والتوكن مطلوبان')
      return
    }
    setAuthError('')
    setAuthLoading(true)
    if (socket && isConnected) {
      socket.emit('authenticate', { email: email.trim(), token: token.trim() })
    } else {
      setAuthLoading(false)
      setAuthError('غير متصل بالخادم. يرجى المحاولة مرة أخرى.')
    }
  }

  const handleCommand = () => {
    const cmd = currentInput.trim()
    if (!cmd) {
      addLine(`${username}@${hostname}:${cwd}$ `, 'input')
      setCurrentInput('')
      return
    }

    addLine(`${username}@${hostname}:${cwd}$ ${cmd}`, 'input')
    setCommandHistory(prev => [...prev, cmd])
    setHistoryIndex(-1)

    if (socket && isAuthenticated) {
      socket.emit('command', { command: cmd })
    }

    setCurrentInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommand()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIndex)
        setCurrentInput(commandHistory[newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1)
          setCurrentInput('')
        } else {
          setHistoryIndex(newIndex)
          setCurrentInput(commandHistory[newIndex])
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      if (socket && currentInput.trim()) {
        socket.emit('tab-complete', { input: currentInput.trim() })
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      setLines([])
    }
  }

  const handleTerminalClick = () => {
    inputRef.current?.focus()
  }

  // Parse ANSI color codes for rendering
  const parseAnsi = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = []
    const regex = /\x1b\[([0-9;]*)m/g
    let lastIndex = 0
    let currentStyle: React.CSSProperties = {}
    let key = 0

    const styleMap: Record<string, React.CSSProperties> = {
      '0': {},
      '1': { fontWeight: 'bold' },
      '30': { color: '#000000' },
      '31': { color: '#ff6b6b' },
      '32': { color: '#51cf66' },
      '33': { color: '#fcc419' },
      '34': { color: '#339af0' },
      '35': { color: '#cc5de8' },
      '36': { color: '#22b8cf' },
      '37': { color: '#ffffff' },
    }

    let match
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const segment = text.slice(lastIndex, match.index)
        parts.push(
          <span key={key++} style={currentStyle}>
            {segment}
          </span>
        )
      }

      const codes = match[1].split(';')
      if (codes.length === 1) {
        const code = codes[0]
        if (code === '0') {
          currentStyle = {}
        } else if (code === '1') {
          currentStyle = { ...currentStyle, fontWeight: 'bold' }
        } else if (styleMap[code]) {
          currentStyle = { ...currentStyle, ...styleMap[code] }
        }
      } else {
        // Handle combined codes like 1;33
        const newStyle: React.CSSProperties = {}
        for (const c of codes) {
          if (c === '1') Object.assign(newStyle, { fontWeight: 'bold' })
          else if (styleMap[c]) Object.assign(newStyle, styleMap[c])
        }
        currentStyle = { ...currentStyle, ...newStyle }
      }

      lastIndex = regex.lastIndex
    }

    if (lastIndex < text.length) {
      parts.push(
        <span key={key++} style={currentStyle}>
          {text.slice(lastIndex)}
        </span>
      )
    }

    return parts.length > 0 ? parts : [<span key={0}>{text}</span>]
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] flex flex-col" dir="ltr">
      {/* Auth Dialog - Popup for Email & Token */}
      <Dialog open={showAuthDialog} onOpenChange={(open) => {
        if (isAuthenticated) setShowAuthDialog(false)
      }}>
        <DialogContent className="sm:max-w-md bg-[#1a1a2e] border-[#2d2d5e] text-white" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Server className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  RAW Cloud
                </span>
                <span className="text-gray-400 text-sm ml-2">Free Plan</span>
              </div>
            </DialogTitle>
            <DialogDescription className="text-gray-400 pt-2">
              أدخل بيانات الاعتماد الخاصة بك للاتصال بخادم RAW Cloud Linux
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Plan info */}
            <div className="bg-[#0d0d1a] rounded-lg p-3 border border-[#2d2d5e]">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 text-gray-400">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  <span>1 vCPU</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <MemoryStick className="w-3.5 h-3.5 text-emerald-400" />
                  <span>512 MB RAM</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                  <span>2 GB SSD</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Unlimited BW</span>
                </div>
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                البريد الإلكتروني
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setAuthError('') }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAuth() }}
                className="bg-[#0d0d1a] border-[#2d2d5e] text-white placeholder:text-gray-600 focus:border-emerald-500 focus:ring-emerald-500/20"
                disabled={authLoading}
                dir="ltr"
              />
            </div>

            {/* Token Input */}
            <div className="space-y-2">
              <Label htmlFor="token" className="text-gray-300 text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                التوكن (API Token)
              </Label>
              <Input
                id="token"
                type="password"
                placeholder="raw_xxxxxxxxxxxxxxxx"
                value={token}
                onChange={(e) => { setToken(e.target.value); setAuthError('') }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAuth() }}
                className="bg-[#0d0d1a] border-[#2d2d5e] text-white placeholder:text-gray-600 focus:border-emerald-500 focus:ring-emerald-500/20 font-mono"
                disabled={authLoading}
                dir="ltr"
              />
            </div>

            {authError && (
              <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 text-red-300 text-sm">
                {authError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={handleAuth}
              disabled={authLoading || !email.trim() || !token.trim()}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium"
            >
              {authLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  جاري الاتصال...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  اتصال بالخادم
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Boot Screen */}
      {booting && (
        <div className="fixed inset-0 z-40 bg-[#0a0a0a] flex items-center justify-center">
          <div className="max-w-md w-full px-6 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center animate-pulse">
              <Server className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">RAW Cloud Linux</h2>
            <p className="text-gray-400 text-sm mb-6">{bootStep}</p>
            <Progress value={bootProgress} className="h-2 bg-[#1a1a2e]" />
            <p className="text-gray-600 text-xs mt-3">{bootProgress}%</p>
          </div>
        </div>
      )}

      {/* Main Terminal Interface */}
      {!booting && (
        <>
          {/* Top Bar */}
          <div className="bg-[#16161e] border-b border-[#2a2a3e] px-4 py-2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Server className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">RAW Cloud Terminal</span>
                  <Badge variant="outline" className="text-[10px] border-emerald-600 text-emerald-400 h-4">
                    FREE
                  </Badge>
                </div>
                <span className="text-[11px] text-gray-500">{username}@{hostname}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-[11px] text-gray-500">
                <div className="flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-emerald-500" />
                  <span>1 vCPU</span>
                </div>
                <div className="flex items-center gap-1">
                  <MemoryStick className="w-3 h-3 text-emerald-500" />
                  <span>512MB</span>
                </div>
                <div className="flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-emerald-500" />
                  <span>2GB SSD</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {isConnected ? (
                  <Badge variant="outline" className="text-[10px] border-emerald-600 text-emerald-400 h-5 gap-1">
                    <Wifi className="w-2.5 h-2.5" />
                    متصل
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] border-red-600 text-red-400 h-5 gap-1">
                    <WifiOff className="w-2.5 h-2.5" />
                    غير متصل
                  </Badge>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-500 hover:text-white"
                onClick={() => setShowAuthDialog(true)}
                title="إعدادات الاتصال"
              >
                <Settings className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Terminal Window */}
          <div className="flex-1 flex flex-col mx-2 sm:mx-4 mt-2 mb-4 rounded-xl overflow-hidden border border-[#2a2a3e] shadow-2xl shadow-black/50">
            {/* Terminal Title Bar */}
            <div className="bg-[#1a1a2e] px-4 py-2.5 flex items-center justify-between border-b border-[#2a2a3e] shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f57] cursor-pointer hover:brightness-110" />
                  <div className="w-3 h-3 rounded-full bg-[#febc2e] cursor-pointer hover:brightness-110" />
                  <div className="w-3 h-3 rounded-full bg-[#28c840] cursor-pointer hover:brightness-110" />
                </div>
                <span className="text-gray-500 text-xs ml-3 font-mono">
                  {username}@{hostname}: {cwd}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-gray-500 hover:text-white"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      lines.map(l => l.content).join('\n')
                    )
                  }}
                  title="نسخ"
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-gray-500 hover:text-white"
                  onClick={() => setLines([])}
                  title="مسح"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Terminal Content */}
            <div
              ref={terminalRef}
              className="flex-1 bg-[#0d0d1a] p-4 overflow-y-auto font-mono text-sm cursor-text min-h-0"
              onClick={handleTerminalClick}
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#2d2d5e transparent',
              }}
            >
              {!isAuthenticated ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-3">
                    <Server className="w-12 h-12 text-gray-600 mx-auto" />
                    <p className="text-gray-500">غير متصل. أدخل بيانات الاعتماد للاتصال.</p>
                    <Button
                      onClick={() => setShowAuthDialog(true)}
                      variant="outline"
                      className="border-emerald-600 text-emerald-400 hover:bg-emerald-900/30"
                    >
                      اتصال بالخادم
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {lines.map((line) => (
                    <div key={line.id} className="whitespace-pre-wrap break-all leading-relaxed">
                      {line.type === 'input' && (
                        <span className="text-emerald-400">{parseAnsi(line.content)}</span>
                      )}
                      {line.type === 'output' && (
                        <span>{parseAnsi(line.content)}</span>
                      )}
                      {line.type === 'system' && (
                        <span className="text-yellow-400">{line.content}</span>
                      )}
                      {line.type === 'error' && (
                        <span className="text-red-400">{line.content}</span>
                      )}
                      {line.type === 'welcome' && (
                        <span className="text-cyan-300">{parseAnsi(line.content)}</span>
                      )}
                    </div>
                  ))}

                  {/* Current Input Line */}
                  {isAuthenticated && (
                    <div className="flex items-center whitespace-pre">
                      <span className="text-emerald-400">
                        {username}@{hostname}
                      </span>
                      <span className="text-gray-500">:</span>
                      <span className="text-blue-400">{cwd}</span>
                      <span className="text-gray-500">$ </span>
                      <span className="text-white">{currentInput}</span>
                      <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse ml-0.5" />
                    </div>
                  )}
                  <div ref={linesEndRef} />
                </>
              )}
            </div>

            {/* Input Bar */}
            {isAuthenticated && (
              <div className="bg-[#1a1a2e] border-t border-[#2a2a3e] px-4 py-2 flex items-center gap-2 shrink-0">
                <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent text-white font-mono text-sm outline-none placeholder:text-gray-600"
                  placeholder="أدخل أمراً..."
                  dir="ltr"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
