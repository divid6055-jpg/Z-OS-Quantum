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
  Settings,
  Monitor,
  Activity,
  Lock,
  Unlock,
  RefreshCw,
  Maximize2,
  Minimize2,
  X,
  Minus,
  Copy,
  Trash2,
  FolderOpen,
  FileText,
  Network,
  Search,
  Package,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react'

interface PlanInfo {
  name: string
  cpu: string
  ram: string
  storage: string
  bandwidth: string
  os: string
  region: string
  security: string
}

interface Metrics {
  uptime: number
  cpuUsage: number
  memUsed: number
  memTotal: number
  diskUsed: number
  diskTotal: number
  netRx: number
  netTx: number
  loadAvg: string[]
  processes: number
  threads: number
  threats: number
  blockedIPs: number
}

interface TerminalLine {
  id: string
  content: string
  type: 'input' | 'output' | 'system' | 'error' | 'welcome'
}

export default function ZOSDesktop() {
  // Auth state
  const [showAuthDialog, setShowAuthDialog] = useState(true)
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Connection state
  const [isConnected, setIsConnected] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)

  // Terminal state
  const [lines, setLines] = useState<TerminalLine[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [cwd, setCwd] = useState('/home/z-user')
  const [username, setUsername] = useState('z-user')
  const [hostname, setHostname] = useState('z-mainframe')
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Boot state
  const [booting, setBooting] = useState(false)
  const [bootProgress, setBootProgress] = useState(0)
  const [bootStep, setBootStep] = useState('')
  const [bootPhase, setBootPhase] = useState(0)

  // UI state
  const [activeTab, setActiveTab] = useState<string>('terminal')
  const [showMetrics, setShowMetrics] = useState(false)

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
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 15000,
    })

    setSocket(socketInstance)

    socketInstance.on('connect', () => {
      setIsConnected(true)
      console.log('[Z-OS] Connected to kernel')
    })

    socketInstance.on('disconnect', () => {
      setIsConnected(false)
      console.log('[Z-OS] Disconnected from kernel')
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

    socketInstance.on('output', (data: { output: string; cwd?: string }) => {
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
    })

    socketInstance.on('metrics', (data: Metrics) => {
      setMetrics(data)
    })

    socketInstance.on('tab-complete-result', (data: { completion?: string; suggestions?: string[] }) => {
      if (data.completion) {
        setCurrentInput(prev => prev + data.completion)
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
    setBootPhase(0)

    const bootPhases = [
      {
        steps: [
          { step: '[ Z-KERNEL ] Initializing quantum kernel module...', progress: 5 },
          { step: '[ Z-KERNEL ] Loading z-kernel-6.2.0-quantum...', progress: 15 },
          { step: '[ Z-KERNEL ] Mounting ZFS root filesystem...', progress: 25 },
          { step: '[ Z-KERNEL ] Starting AI process scheduler...', progress: 35 },
        ],
        phase: 0
      },
      {
        steps: [
          { step: '[ SECURITY ] Loading quantum-resistant crypto module...', progress: 45 },
          { step: '[ SECURITY ] Initializing z-kernel-guard (intrusion detection)...', progress: 52 },
          { step: '[ SECURITY ] Starting z-firewall (247 rules, AI-powered)...', progress: 58 },
          { step: '[ SECURITY ] Enabling zero-trust architecture...', progress: 62 },
        ],
        phase: 1
      },
      {
        steps: [
          { step: '[ NETWORK ] Bringing up z0 interface (10 Gbps)...', progress: 68 },
          { step: '[ NETWORK ] Configuring DNS-over-HTTPS...', progress: 72 },
          { step: '[  SYSTEM  ] Starting system services (13 daemons)...', progress: 78 },
          { step: `[  SYSTEM  ] Allocating ${plan.cpu}...`, progress: 82 },
        ],
        phase: 2
      },
      {
        steps: [
          { step: `[  MEMORY  ] Configuring ${plan.ram}...`, progress: 88 },
          { step: `[ STORAGE  ] Mounting ${plan.storage} (ZFS encrypted)...`, progress: 92 },
          { step: '[  READY   ] All systems operational!', progress: 100 },
        ],
        phase: 3
      },
    ]

    let phaseIdx = 0
    let stepIdx = 0

    const interval = setInterval(() => {
      if (phaseIdx < bootPhases.length) {
        const phase = bootPhases[phaseIdx]
        if (stepIdx < phase.steps.length) {
          setBootPhase(phase.phase)
          setBootStep(phase.steps[stepIdx].step)
          setBootProgress(phase.steps[stepIdx].progress)
          stepIdx++
        } else {
          phaseIdx++
          stepIdx = 0
        }
      } else {
        clearInterval(interval)
        setBooting(false)
        addLine(
          `\x1b[1;36m╔════════════════════════════════════════════════════════════════╗\x1b[0m
\x1b[1;36m║               \x1b[1;33mZ-OS 3.0 Quantum - Ready\x1b[1;36m                                 ║\x1b[0m
\x1b[1;36m║               \x1b[0mAll systems operational. Security: PARANOID             \x1b[1;36m║\x1b[0m
\x1b[1;36m║               \x1b[0mType \x1b[36mhelp\x1b[0m for commands, \x1b[36mztour\x1b[0m for guided tour       \x1b[1;36m║\x1b[0m
\x1b[1;36m╚════════════════════════════════════════════════════════════════╝\x1b[0m`,
          'welcome'
        )
      }
    }, 400)
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

  const parseAnsi = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = []
    const regex = /\x1b\[([0-9;]*)m/g
    let lastIndex = 0
    let currentStyle: React.CSSProperties = {}
    let key = 0

    const styleMap: Record<string, React.CSSProperties> = {
      '0': {},
      '1': { fontWeight: 'bold' },
      '30': { color: '#555' },
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
        parts.push(<span key={key++} style={currentStyle}>{segment}</span>)
      }
      const codes = match[1].split(';')
      if (codes.length === 1) {
        const code = codes[0]
        if (code === '0') currentStyle = {}
        else if (code === '1') currentStyle = { ...currentStyle, fontWeight: 'bold' }
        else if (styleMap[code]) currentStyle = { ...currentStyle, ...styleMap[code] }
      } else {
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
      parts.push(<span key={key++} style={currentStyle}>{text.slice(lastIndex)}</span>)
    }
    return parts.length > 0 ? parts : [<span key={0}>{text}</span>]
  }

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${h}h ${m}m`
  }

  const bootPhaseIcons = ['🔧', '🛡️', '🌐', '⚡']
  const bootPhaseNames = ['Kernel', 'Security', 'Network', 'System']

  return (
    <div className="min-h-screen bg-[#0a0e17] text-[#e0e8f0] flex flex-col" dir="ltr">
      {/* Auth Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={(open) => { if (isAuthenticated) setShowAuthDialog(false) }}>
        <DialogContent className="sm:max-w-lg bg-[#0d1321] border-[#1a2744] text-white" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Server className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent font-bold text-2xl tracking-tight">
                  Z-OS
                </span>
                <span className="text-gray-400 text-xs ml-2 block">Quantum Edition v3.0</span>
              </div>
            </DialogTitle>
            <DialogDescription className="text-gray-400 pt-2 text-sm">
              أدخل بيانات الاعتماد للاتصال بخادم Z-OS Quantum - النظام الذي يتفوق على لينكس
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Plan info */}
            <div className="bg-[#0a0e17] rounded-lg p-4 border border-[#1a2744]">
              <div className="text-xs text-cyan-400 font-medium mb-2 uppercase tracking-wider">معلومات النظام</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 text-gray-400">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Z-Quantum 4C/4.2GHz</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <MemoryStick className="w-3.5 h-3.5 text-purple-400" />
                  <span>16 GB DDR5</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                  <span>64 GB NVMe (ZFS)</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>PARANOID Security</span>
                </div>
              </div>
            </div>

            {/* Z-OS Advantages */}
            <div className="bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-purple-500/5 rounded-lg p-3 border border-[#1a2744]">
              <div className="text-[10px] text-cyan-300 font-medium mb-1.5 uppercase tracking-wider">مزايا Z-OS على لينكس</div>
              <div className="grid grid-cols-2 gap-1 text-[10px] text-gray-400">
                <span className="flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5 text-emerald-400" /> AI جدولة ذكية (+40%)</span>
                <span className="flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5 text-emerald-400" /> تشفير مقاوم للكم</span>
                <span className="flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5 text-emerald-400" /> نظام ملفات ذاتي الإصلاح</span>
                <span className="flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5 text-emerald-400" /> بنية Zero-Trust</span>
                <span className="flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5 text-emerald-400" /> تصحيح لحظي بدون إعادة تشغيل</span>
                <span className="flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5 text-emerald-400" /> كشف تهديدات AI 99.97%</span>
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                البريد الإلكتروني
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="user@z-os.cloud"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setAuthError('') }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAuth() }}
                className="bg-[#0a0e17] border-[#1a2744] text-white placeholder:text-gray-600 focus:border-cyan-500 focus:ring-cyan-500/20"
                disabled={authLoading}
                dir="ltr"
              />
            </div>

            {/* Token Input */}
            <div className="space-y-2">
              <Label htmlFor="token" className="text-gray-300 text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                التوكن (API Token)
              </Label>
              <div className="relative">
                <Input
                  id="token"
                  type={showToken ? 'text' : 'password'}
                  placeholder="zos_quantum_xxxxxxxxxxxxxxxx"
                  value={token}
                  onChange={(e) => { setToken(e.target.value); setAuthError('') }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAuth() }}
                  className="bg-[#0a0e17] border-[#1a2744] text-white placeholder:text-gray-600 focus:border-cyan-500 focus:ring-cyan-500/20 font-mono pr-10"
                  disabled={authLoading}
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {authError && (
              <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 text-red-300 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {authError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={handleAuth}
              disabled={authLoading || !email.trim() || !token.trim()}
              className="w-full bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-medium"
            >
              {authLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  جاري تهيئة النظام الكمومي...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  اتصال بـ Z-OS Quantum
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Boot Screen */}
      {booting && (
        <div className="fixed inset-0 z-50 bg-[#0a0e17] flex items-center justify-center">
          <div className="max-w-lg w-full px-6 text-center">
            <div className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-cyan-500/30 animate-pulse">
              <Server className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Z-OS 3.0 Quantum</h2>
            <p className="text-gray-500 text-xs mb-8">Initializing quantum kernel...</p>

            {/* Phase indicators */}
            <div className="flex justify-center gap-2 mb-6">
              {[0, 1, 2, 3].map((phase) => (
                <div key={phase} className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] transition-all ${
                  bootPhase > phase ? 'bg-emerald-500/20 text-emerald-400' :
                  bootPhase === phase ? 'bg-cyan-500/20 text-cyan-400' :
                  'bg-gray-800/50 text-gray-600'
                }`}>
                  <span>{bootPhaseIcons[phase]}</span>
                  <span className="hidden sm:inline">{bootPhaseNames[phase]}</span>
                  {bootPhase > phase ? <CheckCircle className="w-3 h-3" /> : null}
                </div>
              ))}
            </div>

            <div className="bg-[#0d1321] rounded-lg p-3 mb-4 font-mono text-xs text-left h-24 overflow-hidden border border-[#1a2744]">
              <p className="text-cyan-400">{bootStep}</p>
            </div>

            <Progress value={bootProgress} className="h-2 bg-[#1a2744]" />
            <div className="flex justify-between mt-2 text-[10px] text-gray-600">
              <span>Quantum Kernel</span>
              <span>{bootProgress}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Desktop */}
      {!booting && (
        <>
          {/* Top Bar */}
          <div className="bg-[#0d1321] border-b border-[#1a2744] px-3 py-1.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Server className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Z-OS
                  </span>
                  <span className="text-[9px] text-gray-500 font-mono">QUANTUM v3.0</span>
                  <Badge variant="outline" className="text-[8px] border-cyan-700 text-cyan-400 h-3.5 px-1">
                    PARANOID
                  </Badge>
                </div>
                <span className="text-[10px] text-gray-600 font-mono">{username}@{hostname}:{cwd}</span>
              </div>
            </div>

            {/* Metrics Bar */}
            {metrics && (
              <div className="hidden md:flex items-center gap-4 text-[10px] text-gray-500 font-mono">
                <div className="flex items-center gap-1" title="CPU Usage">
                  <Cpu className="w-3 h-3 text-cyan-400" />
                  <span className={metrics.cpuUsage > 80 ? 'text-red-400' : metrics.cpuUsage > 50 ? 'text-yellow-400' : 'text-emerald-400'}>
                    {metrics.cpuUsage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center gap-1" title="Memory">
                  <MemoryStick className="w-3 h-3 text-purple-400" />
                  <span>{(metrics.memUsed / 1024).toFixed(0)}G/{(metrics.memTotal / 1024).toFixed(0)}G</span>
                </div>
                <div className="flex items-center gap-1" title="Disk">
                  <HardDrive className="w-3 h-3 text-blue-400" />
                  <span>{metrics.diskUsed}G/{metrics.diskTotal}G</span>
                </div>
                <div className="flex items-center gap-1" title="Uptime">
                  <Activity className="w-3 h-3 text-emerald-400" />
                  <span>{formatUptime(metrics.uptime)}</span>
                </div>
                <div className="flex items-center gap-1" title="Threats">
                  <Shield className="w-3 h-3 text-amber-400" />
                  <span className={metrics.threats > 0 ? 'text-red-400' : 'text-emerald-400'}>
                    {metrics.threats === 0 ? 'Secure' : `${metrics.threats} threats`}
                  </span>
                </div>
                <div className="flex items-center gap-1" title="Blocked IPs">
                  <Lock className="w-3 h-3 text-red-400" />
                  <span>{metrics.blockedIPs} blocked</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              {isConnected ? (
                <Badge variant="outline" className="text-[9px] border-emerald-600 text-emerald-400 h-5 gap-1">
                  <Wifi className="w-2.5 h-2.5" />
                  متصل
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[9px] border-red-600 text-red-400 h-5 gap-1">
                  <WifiOff className="w-2.5 h-2.5" />
                  غير متصل
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-500 hover:text-white"
                onClick={() => setShowMetrics(!showMetrics)}
                title="مراقبة النظام"
              >
                <Activity className="w-3.5 h-3.5" />
              </Button>
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

          {/* Tab Bar */}
          <div className="bg-[#0d1321] border-b border-[#1a2744] px-3 flex items-center gap-1 shrink-0">
            {[
              { id: 'terminal', label: 'Terminal', icon: TerminalIcon },
              { id: 'files', label: 'Files', icon: FolderOpen },
              { id: 'monitor', label: 'Monitor', icon: Activity },
              { id: 'network', label: 'Network', icon: Globe },
              { id: 'security', label: 'Security', icon: Shield },
              { id: 'packages', label: 'Packages', icon: Package },
              { id: 'containers', label: 'Containers', icon: Server },
              { id: 'databases', label: 'DB', icon: HardDrive },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-t-md transition-all ${
                  activeTab === id
                    ? 'bg-[#0a0e17] text-cyan-400 border-t border-x border-[#1a2744]'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 min-h-0 relative flex">
            {/* Main Panel */}
            <div className="flex-1 min-h-0 relative">
            {/* Terminal Tab */}
            {activeTab === 'terminal' && (
              <div className="absolute inset-0 flex flex-col">
                {/* Terminal Window */}
                <div className="flex-1 mx-2 sm:mx-4 mt-2 mb-4 rounded-xl overflow-hidden border border-[#1a2744] shadow-2xl shadow-black/50 flex flex-col">
                  {/* Title Bar */}
                  <div className="bg-[#0d1321] px-4 py-2 flex items-center justify-between border-b border-[#1a2744] shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                        <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                        <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                      </div>
                      <span className="text-gray-500 text-xs ml-3 font-mono">
                        zsh — {username}@{hostname}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-white"
                        onClick={() => { navigator.clipboard.writeText(lines.map(l => l.content).join('\n')) }}
                        title="نسخ">
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-white"
                        onClick={() => setLines([])} title="مسح">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Terminal Content */}
                  <div
                    ref={terminalRef}
                    className="flex-1 bg-[#080c14] p-3 sm:p-4 overflow-y-auto font-mono text-[13px] leading-relaxed cursor-text min-h-0"
                    onClick={() => inputRef.current?.focus()}
                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#1a2744 transparent' }}
                  >
                    {!isAuthenticated ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center space-y-3">
                          <Server className="w-12 h-12 text-gray-600 mx-auto" />
                          <p className="text-gray-500">غير متصل. أدخل بيانات الاعتماد للاتصال.</p>
                          <Button onClick={() => setShowAuthDialog(true)} variant="outline"
                            className="border-cyan-600 text-cyan-400 hover:bg-cyan-900/30">
                            اتصال بـ Z-OS
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {lines.map((line) => (
                          <div key={line.id} className="whitespace-pre-wrap break-all">
                            {line.type === 'input' && (
                              <span className="text-cyan-400">{parseAnsi(line.content)}</span>
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
                        {isAuthenticated && (
                          <div className="flex items-center whitespace-pre">
                            <span className="text-cyan-400">{username}@{hostname}</span>
                            <span className="text-gray-500">:</span>
                            <span className="text-blue-400">{cwd}</span>
                            <span className="text-gray-500">$ </span>
                            <span className="text-white">{currentInput}</span>
                            <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse ml-0.5" />
                          </div>
                        )}
                        <div ref={linesEndRef} />
                      </>
                    )}
                  </div>

                  {/* Input Bar */}
                  {isAuthenticated && (
                    <div className="bg-[#0d1321] border-t border-[#1a2744] px-3 sm:px-4 py-2 flex items-center gap-2 shrink-0">
                      <ChevronRight className="w-4 h-4 text-cyan-500 shrink-0" />
                      <input
                        ref={inputRef}
                        type="text"
                        value={currentInput}
                        onChange={(e) => setCurrentInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-transparent text-white font-mono text-sm outline-none placeholder:text-gray-600"
                        placeholder="أدخل أمراً... (help للأوامر)"
                        dir="ltr"
                        autoComplete="off"
                        spellCheck={false}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Files Tab */}
            {activeTab === 'files' && (
              <div className="absolute inset-0 mx-2 sm:mx-4 mt-2 mb-4 bg-[#0d1321] rounded-xl border border-[#1a2744] overflow-auto p-4">
                <h3 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  نظام الملفات Z-OS (ZFS)
                </h3>
                <div className="space-y-1 text-xs font-mono">
                  <div className="text-yellow-400 cursor-pointer hover:text-yellow-300" onClick={() => { setActiveTab('terminal'); setTimeout(() => { setCurrentInput('ls -la /'); handleCommand(); }, 100) }}>/</div>
                  <div className="pl-4 text-blue-400 cursor-pointer hover:text-blue-300" onClick={() => { setActiveTab('terminal'); setTimeout(() => { setCurrentInput('ls -la /bin'); handleCommand(); }, 100) }}>bin/</div>
                  <div className="pl-4 text-blue-400 cursor-pointer hover:text-blue-300" onClick={() => { setActiveTab('terminal'); setTimeout(() => { setCurrentInput('ls -la /etc'); handleCommand(); }, 100) }}>etc/</div>
                  <div className="pl-4 text-blue-400 cursor-pointer hover:text-blue-300" onClick={() => { setActiveTab('terminal'); setTimeout(() => { setCurrentInput('ls -la /home'); handleCommand(); }, 100) }}>home/</div>
                  <div className="pl-8 text-blue-400 cursor-pointer hover:text-blue-300" onClick={() => { setActiveTab('terminal'); setTimeout(() => { setCurrentInput('ls -la /home/z-user'); handleCommand(); }, 100) }}>z-user/</div>
                  <div className="pl-12 text-green-400 cursor-pointer hover:text-green-300" onClick={() => { setActiveTab('terminal'); setTimeout(() => { setCurrentInput('cat /home/z-user/.zshrc'); handleCommand(); }, 100) }}>.zshrc</div>
                  <div className="pl-12 text-green-400 cursor-pointer hover:text-green-300" onClick={() => { setActiveTab('terminal'); setTimeout(() => { setCurrentInput('cat /home/z-user/welcome.txt'); handleCommand(); }, 100) }}>welcome.txt</div>
                  <div className="pl-8 text-blue-400 cursor-pointer hover:text-blue-300" onClick={() => { setActiveTab('terminal'); setTimeout(() => { setCurrentInput('ls -la /var'); handleCommand(); }, 100) }}>var/</div>
                  <div className="pl-4 text-blue-400 cursor-pointer hover:text-blue-300" onClick={() => { setActiveTab('terminal'); setTimeout(() => { setCurrentInput('ls -la /usr'); handleCommand(); }, 100) }}>usr/</div>
                  <div className="pl-4 text-gray-400 cursor-pointer hover:text-gray-300" onClick={() => { setActiveTab('terminal'); setTimeout(() => { setCurrentInput('tree /'); handleCommand(); }, 100) }}>...عرض الكل (tree /)</div>
                </div>
                <div className="mt-4 p-3 bg-[#0a0e17] rounded-lg border border-[#1a2744]">
                  <p className="text-[10px] text-gray-500">💡 انقر على أي مسار لعرض محتواه في الطرفية. استخدم أوامر <span className="text-cyan-400">ls</span>, <span className="text-cyan-400">cat</span>, <span className="text-cyan-400">tree</span> للتصفح.</p>
                </div>
              </div>
            )}

            {/* Network Tab */}
            {activeTab === 'network' && (
              <div className="absolute inset-0 mx-2 sm:mx-4 mt-2 mb-4 bg-[#0d1321] rounded-xl border border-[#1a2744] overflow-auto p-4">
                <h3 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  الشبكة
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-[#0a0e17] rounded-lg border border-[#1a2744]">
                    <div className="text-[10px] text-cyan-400 uppercase tracking-wider mb-2">واجهات الشبكة</div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between text-emerald-400">
                        <span>z0 (Ethernet)</span><span>10.0.0.1</span>
                      </div>
                      <div className="flex items-center justify-between text-emerald-400">
                        <span>z-wifi0 (WiFi)</span><span>192.168.1.100</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-400">
                        <span>lo (Loopback)</span><span>127.0.0.1</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-[#0a0e17] rounded-lg border border-[#1a2744]">
                    <div className="text-[10px] text-purple-400 uppercase tracking-wider mb-2">DNS & Security</div>
                    <div className="space-y-1 text-xs text-gray-400">
                      <div>DNS-over-HTTPS: <span className="text-emerald-400">Enabled</span></div>
                      <div>DNSSEC: <span className="text-emerald-400">Validating</span></div>
                      <div>VPN: <span className="text-yellow-400">Available (z-vpn)</span></div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-[10px] text-gray-500">
                  💡 استخدم <span className="text-cyan-400">znet status</span>, <span className="text-cyan-400">znet scan</span>, <span className="text-cyan-400">znet trace</span> في الطرفية للمزيد.
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="absolute inset-0 mx-2 sm:mx-4 mt-2 mb-4 bg-[#0d1321] rounded-xl border border-[#1a2744] overflow-auto p-4">
                <h3 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  مركز الأمان
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                  <div className="p-2 bg-emerald-900/20 border border-emerald-800/50 rounded-lg text-center">
                    <Shield className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                    <div className="text-[10px] text-emerald-400">PARANOID</div>
                    <div className="text-[9px] text-gray-500">Security Level</div>
                  </div>
                  <div className="p-2 bg-emerald-900/20 border border-emerald-800/50 rounded-lg text-center">
                    <Lock className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                    <div className="text-[10px] text-emerald-400">AES-256</div>
                    <div className="text-[9px] text-gray-500">Encryption</div>
                  </div>
                  <div className="p-2 bg-red-900/20 border border-red-800/50 rounded-lg text-center">
                    <AlertTriangle className="w-5 h-5 text-red-400 mx-auto mb-1" />
                    <div className="text-[10px] text-red-400">{metrics?.threats ?? 0}</div>
                    <div className="text-[9px] text-gray-500">Active Threats</div>
                  </div>
                  <div className="p-2 bg-amber-900/20 border border-amber-800/50 rounded-lg text-center">
                    <Lock className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                    <div className="text-[10px] text-amber-400">{metrics?.blockedIPs ?? 0}</div>
                    <div className="text-[9px] text-gray-500">Blocked IPs</div>
                  </div>
                </div>
                <div className="text-[10px] text-gray-500">
                  💡 استخدم <span className="text-cyan-400">zsec scan</span> لفحص الثغرات، <span className="text-cyan-400">zsec harden</span> لتقوية الأمان، <span className="text-cyan-400">zfirewall status</span> لإدارة الجدار الناري.
                </div>
              </div>
            )}

            {/* Packages Tab */}
            {activeTab === 'packages' && (
              <div className="absolute inset-0 mx-2 sm:mx-4 mt-2 mb-4 bg-[#0d1321] rounded-xl border border-[#1a2744] overflow-auto p-4">
                <h3 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  مدير الحزم Z-PKG
                </h3>
                <div className="space-y-1.5 text-xs font-mono">
                  {[
                    { pkg: 'z-kernel', ver: '6.2.0-3', desc: 'Quantum Kernel', installed: true },
                    { pkg: 'z-firewall', ver: '3.1.2', desc: 'AI-Powered Firewall', installed: true },
                    { pkg: 'z-ai-detect', ver: '3.0.1', desc: 'AI Threat Detection', installed: true },
                    { pkg: 'z-quantum-crypto', ver: '2.0.0', desc: 'Quantum-Resistant Crypto', installed: true },
                    { pkg: 'nginx', ver: '1.27.0', desc: 'Web Server', installed: true },
                    { pkg: 'z-monitor', ver: '2.5.0', desc: 'System Monitor', installed: true },
                    { pkg: 'z-audit', ver: '4.0.0', desc: 'Security Audit Framework', installed: true },
                    { pkg: 'z-desktop', ver: '3.0.0', desc: 'Quantum Desktop', installed: true },
                    { pkg: 'python3', ver: '3.13.0', desc: 'Python Language', installed: true },
                    { pkg: 'nodejs', ver: '22.0.0', desc: 'Node.js Runtime', installed: true },
                    { pkg: 'gcc', ver: '14.1.0', desc: 'GNU Compiler', installed: true },
                    { pkg: 'git', ver: '2.45.0', desc: 'Version Control', installed: true },
                    { pkg: 'docker', ver: '26.1.0', desc: 'Container Runtime', installed: false },
                    { pkg: 'z-vpn', ver: '1.2.0', desc: 'WireGuard VPN', installed: false },
                    { pkg: 'postgresql', ver: '17.0', desc: 'Database Server', installed: false },
                    { pkg: 'redis', ver: '8.0', desc: 'In-Memory Data Store', installed: false },
                    { pkg: 'rust', ver: '1.78.0', desc: 'Rust Language', installed: false },
                    { pkg: 'go', ver: '1.22.0', desc: 'Go Language', installed: false },
                  ].map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-[#0a0e17] rounded border border-[#1a2744]">
                      <div className="flex items-center gap-2">
                        <span className={p.installed ? 'text-emerald-400' : 'text-gray-600'}>
                          {p.installed ? '✓' : '○'}
                        </span>
                        <span className="text-white">{p.pkg}</span>
                        <span className="text-gray-500 text-[10px]">{p.ver}</span>
                      </div>
                      <span className="text-gray-400 text-[10px]">{p.desc}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-[10px] text-gray-500">
                  💡 استخدم <span className="text-cyan-400">zpkg list</span>, <span className="text-cyan-400">zpkg install &lt;pkg&gt;</span>, <span className="text-cyan-400">zpkg update</span> في الطرفية.
                </div>
              </div>
            )}

            {/* Monitor Tab */}
            {activeTab === 'monitor' && (
              <div className="absolute inset-0 mx-2 sm:mx-4 mt-2 mb-4 bg-[#0d1321] rounded-xl border border-[#1a2744] overflow-auto p-4">
                <h3 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  مراقبة الأداء اللحظي
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                  <div className="p-3 bg-[#0a0e17] rounded-lg border border-[#1a2744] text-center">
                    <Cpu className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                    <div className="text-lg font-bold text-white">{metrics?.cpuUsage.toFixed(1) ?? '0'}%</div>
                    <div className="text-[9px] text-gray-500">CPU Usage</div>
                    <div className="mt-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all" style={{width: `${metrics?.cpuUsage ?? 0}%`}} />
                    </div>
                  </div>
                  <div className="p-3 bg-[#0a0e17] rounded-lg border border-[#1a2744] text-center">
                    <MemoryStick className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                    <div className="text-lg font-bold text-white">{metrics ? (metrics.memUsed/1024).toFixed(0) : '0'}G</div>
                    <div className="text-[9px] text-gray-500">RAM Used / 16G</div>
                    <div className="mt-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all" style={{width: `${metrics ? (metrics.memUsed/metrics.memTotal*100) : 0}%`}} />
                    </div>
                  </div>
                  <div className="p-3 bg-[#0a0e17] rounded-lg border border-[#1a2744] text-center">
                    <HardDrive className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                    <div className="text-lg font-bold text-white">{metrics?.diskUsed ?? 0}G</div>
                    <div className="text-[9px] text-gray-500">Disk / {metrics?.diskTotal ?? 64}G</div>
                    <div className="mt-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all" style={{width: `${metrics ? (metrics.diskUsed/metrics.diskTotal*100) : 0}%`}} />
                    </div>
                  </div>
                  <div className="p-3 bg-[#0a0e17] rounded-lg border border-[#1a2744] text-center">
                    <Shield className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                    <div className="text-lg font-bold text-emerald-400">{metrics?.threats === 0 ? 'Safe' : metrics?.threats ?? 0}</div>
                    <div className="text-[9px] text-gray-500">Security Status</div>
                    <div className="mt-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{width: '100%'}} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-[#0a0e17] rounded border border-[#1a2744]">
                    <div className="text-[10px] text-cyan-400 uppercase tracking-wider mb-1">Services</div>
                    <div className="space-y-0.5 text-[10px]">
                      <div className="flex justify-between text-emerald-400"><span>z-kernel-guard</span><span>Active</span></div>
                      <div className="flex justify-between text-emerald-400"><span>z-firewall</span><span>Active</span></div>
                      <div className="flex justify-between text-emerald-400"><span>z-ai-detect</span><span>Active</span></div>
                      <div className="flex justify-between text-emerald-400"><span>z-quantum-crypto</span><span>Active</span></div>
                      <div className="flex justify-between text-emerald-400"><span>nginx</span><span>Active</span></div>
                    </div>
                  </div>
                  <div className="p-2 bg-[#0a0e17] rounded border border-[#1a2744]">
                    <div className="text-[10px] text-purple-400 uppercase tracking-wider mb-1">Scheduler</div>
                    <div className="space-y-0.5 text-[10px] text-gray-400">
                      <div>Context switches: 12,450/s</div>
                      <div>Avg latency: 0.8μs</div>
                      <div>Processes: {metrics?.processes ?? 142}</div>
                      <div>Threads: {metrics?.threads ?? 547}</div>
                      <div>Load: {metrics?.loadAvg.join(', ') ?? '0.08, 0.03, 0.01'}</div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-[10px] text-gray-500">
                  💡 استخدم <span className="text-cyan-400">zperf</span> لأداء مفصل، <span className="text-cyan-400">zps</span> للعمليات، <span className="text-cyan-400">zservice list</span> للخدمات.
                </div>
              </div>
            )}

            {/* Containers Tab */}
            {activeTab === 'containers' && (
              <div className="absolute inset-0 mx-2 sm:mx-4 mt-2 mb-4 bg-[#0d1321] rounded-xl border border-[#1a2744] overflow-auto p-4">
                <h3 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  إدارة الحاويات Z-Container
                </h3>
                <div className="space-y-2 text-xs font-mono">
                  {[
                    { id: 'a1b2c3', image: 'z-os/nginx:latest', status: 'Up 2h', port: '80', name: 'web-server' },
                    { id: 'f6e5d4', image: 'z-os/redis:latest', status: 'Up 2h', port: '6379', name: 'cache' },
                    { id: '1a2b3c', image: 'z-os/node:22', status: 'Up 45m', port: '3000', name: 'app-server' },
                  ].map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-[#0a0e17] rounded border border-[#1a2744]">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400">●</span>
                        <span className="text-white">{c.id}</span>
                        <span className="text-gray-400">{c.image}</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-400">
                        <span>{c.status}</span>
                        <span className="text-blue-400">:{c.port}</span>
                        <span className="text-white">{c.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-[10px] text-gray-500">
                  💡 استخدم <span className="text-cyan-400">zdocker ps</span>, <span className="text-cyan-400">zdocker images</span>, <span className="text-cyan-400">zdocker compose</span> في الطرفية.
                </div>
              </div>
            )}

            {/* Databases Tab */}
            {activeTab === 'databases' && (
              <div className="absolute inset-0 mx-2 sm:mx-4 mt-2 mb-4 bg-[#0d1321] rounded-xl border border-[#1a2744] overflow-auto p-4">
                <h3 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
                  <HardDrive className="w-4 h-4" />
                  إدارة قواعد البيانات Z-DB
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-[#0a0e17] rounded-lg border border-[#1a2744]">
                    <div className="text-[10px] text-cyan-400 uppercase tracking-wider mb-2">أوامر قاعدة البيانات</div>
                    <div className="space-y-1 text-[10px] text-gray-400">
                      <div><span className="text-emerald-400">zdb create</span> mydb — إنشاء قاعدة بيانات جديدة</div>
                      <div><span className="text-emerald-400">zdb tables</span> — عرض جميع قواعد البيانات</div>
                      <div><span className="text-emerald-400">zdb query</span> &quot;SELECT * FROM users&quot; — تنفيذ استعلام</div>
                    </div>
                  </div>
                  <div className="p-3 bg-[#0a0e17] rounded-lg border border-[#1a2744]">
                    <div className="text-[10px] text-purple-400 uppercase tracking-wider mb-2">حاويات قواعد البيانات المتاحة</div>
                    <div className="space-y-1 text-[10px] text-gray-400">
                      <div className="flex items-center gap-2"><span className="text-yellow-400">○</span> PostgreSQL 17 — <span className="text-cyan-400">zpkg install postgresql</span></div>
                      <div className="flex items-center gap-2"><span className="text-yellow-400">○</span> Redis 8 — <span className="text-cyan-400">zpkg install redis</span></div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-[10px] text-gray-500">
                  💡 أنشئ قاعدة بيانات محلية بـ <span className="text-cyan-400">zdb create mydb</span> أو ثبّت PostgreSQL بـ <span className="text-cyan-400">zpkg install postgresql</span>.
                </div>
              </div>
            )}
            </div>{/* End Main Panel */}

            {/* Quick Actions Sidebar - Only show on terminal tab */}
            {activeTab === 'terminal' && (
              <div className="hidden lg:flex w-52 shrink-0 flex-col border-l border-[#1a2744] bg-[#0d1321] overflow-y-auto p-2 gap-1.5">
                <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-1 px-1">أوامر سريعة</div>
                {[
                  { label: 'System Info', cmd: 'zsysinfo', icon: '🖥️' },
                  { label: 'Security Scan', cmd: 'zsec scan', icon: '🛡️' },
                  { label: 'Harden System', cmd: 'zsec harden', icon: '🔒' },
                  { label: 'AI Diagnose', cmd: 'zai diagnose', icon: '🤖' },
                  { label: 'Performance', cmd: 'zperf', icon: '⚡' },
                  { label: 'Network', cmd: 'znet status', icon: '🌐' },
                  { label: 'Firewall', cmd: 'zfirewall status', icon: '🔥' },
                  { label: 'Processes', cmd: 'zps', icon: '📊' },
                  { label: 'Benchmark', cmd: 'zbenchmark', icon: '🏆' },
                  { label: 'Services', cmd: 'zservice list', icon: '⚙️' },
                  { label: 'Packages', cmd: 'zpkg list', icon: '📦' },
                  { label: 'Backup', cmd: 'zbackup list', icon: '💾' },
                  { label: 'ZFS Status', cmd: 'zfs list', icon: '💿' },
                  { label: 'System Log', cmd: 'zlog', icon: '📋' },
                  { label: 'Update System', cmd: 'zupdate', icon: '🔄' },
                  { label: 'Neofetch', cmd: 'neofetch', icon: '🎨' },
                ].map((action) => (
                  <button
                    key={action.cmd}
                    className="flex items-center gap-2 px-2 py-1.5 text-[11px] text-gray-400 hover:text-cyan-400 hover:bg-[#1a2744]/50 rounded transition-all text-right"
                    dir="rtl"
                    onClick={() => {
                      setCurrentInput(action.cmd)
                      inputRef.current?.focus()
                    }}
                  >
                    <span className="text-xs">{action.icon}</span>
                    <span>{action.label}</span>
                  </button>
                ))}
                <div className="mt-2 px-1">
                  <div className="text-[9px] text-gray-600">💡 انقر لتعبة الأمر في الطرفية ثم اضغط Enter</div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Status Bar */}
          <div className="bg-[#0d1321] border-t border-[#1a2744] px-3 py-1 flex items-center justify-between text-[10px] font-mono shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-emerald-400 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Z-Kernel
              </span>
              <span className="text-gray-500">{username}@{hostname}</span>
              <span className="text-gray-600">|</span>
              <span className="text-gray-500">{cwd}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-500">
              {metrics && (
                <>
                  <span>CPU: <span className={metrics.cpuUsage > 80 ? 'text-red-400' : metrics.cpuUsage > 50 ? 'text-yellow-400' : 'text-emerald-400'}>{metrics.cpuUsage.toFixed(1)}%</span></span>
                  <span>MEM: <span className="text-purple-400">{(metrics.memUsed / 1024).toFixed(0)}G/{(metrics.memTotal / 1024).toFixed(0)}G</span></span>
                </>
              )}
              <span className="text-cyan-400">Z-OS 3.0</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}