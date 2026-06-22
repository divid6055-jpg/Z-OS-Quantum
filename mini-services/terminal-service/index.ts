import { createServer } from 'http'
import { Server } from 'socket.io'
import { exec } from 'child_process'
import { v4 as uuidv4 } from 'uuid'

const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/',
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// Store sessions
interface Session {
  id: string
  email: string
  token: string
  hostname: string
  username: string
  cwd: string
  connectedAt: Date
}

const sessions = new Map<string, Session>()

// Simulated RAW Linux environment info
const RAW_PLAN_INFO = {
  plan: 'Free',
  cpu: '1 vCPU',
  ram: '512 MB',
  storage: '2 GB SSD',
  bandwidth: 'Unlimited',
  os: 'Ubuntu 24.04 LTS',
  region: 'US-East'
}

// Simulated filesystem
const fileSystem: Record<string, string> = {
  '/etc/os-release': `NAME="Ubuntu"\nVERSION="24.04 LTS (Noble Numbat)"\nID=ubuntu\nPRETTY_NAME="Ubuntu 24.04 LTS"\nVERSION_ID="24.04"`,
  '/etc/hostname': 'raw-server',
  '/home/raw-user/.bashrc': `# ~/.bashrc: executed by bash(1) for non-login shells.\nexport PATH=$PATH:/usr/local/bin\nalias ll='ls -la'\nalias cls='clear'`,
  '/home/raw-user/welcome.txt': `Welcome to RAW Linux Free Plan!\n\nYour server is ready. Here are the details:\n- Plan: ${RAW_PLAN_INFO.plan}\n- CPU: ${RAW_PLAN_INFO.cpu}\n- RAM: ${RAW_PLAN_INFO.ram}\n- Storage: ${RAW_PLAN_INFO.storage}\n- OS: ${RAW_PLAN_INFO.os}\n\nType 'help' for available commands.`,
}

// Command handlers
function handleCommand(cmd: string, args: string[], session: Session): string {
  const originalCmd = `${cmd} ${args.join(' ')}`.trim()
  
  switch (cmd) {
    case 'help':
      return `\x1b[1;36mAvailable Commands:\x1b[0m
  \x1b[33mls\x1b[0m       - List directory contents
  \x1b[33mcd\x1b[0m       - Change directory
  \x1b[33mpwd\x1b[0m      - Print working directory
  \x1b[33mcat\x1b[0m      - Display file contents
  \x1b[33mecho\x1b[0m     - Display a line of text
  \x1b[33mwhoami\x1b[0m   - Display current user
  \x1b[33mhostname\x1b[0m - Display system hostname
  \x1b[33muname\x1b[0m    - Print system information
  \x1b[33mdate\x1b[0m     - Display current date and time
  \x1b[33muptime\x1b[0m   - Show system uptime
  \x1b[33mfree\x1b[0m     - Display memory usage
  \x1b[33mdf\x1b[0m       - Display disk space usage
  \x1b[33mps\x1b[0m       - Display running processes
  \x1b[33mtop\x1b[0m      - Display system resources
  \x1b[33mmkdir\x1b[0m    - Create directory
  \x1b[33mtouch\x1b[0m    - Create empty file
  \x1b[33mrm\x1b[0m       - Remove file or directory
  \x1b[33mclear\x1b[0m    - Clear terminal screen
  \x1b[33mneofetch\x1b[0m - Display system information
  \x1b[33mplan\x1b[0m     - Show your RAW plan details
  \x1b[33mexit\x1b[0m     - Disconnect from terminal`

    case 'ls': {
      const targetPath = args[0] ? resolvePath(args[0], session.cwd) : session.cwd
      return listDirectory(targetPath)
    }

    case 'cd': {
      const target = args[0] || '/home/raw-user'
      const newPath = resolvePath(target, session.cwd)
      if (isValidDirectory(newPath)) {
        session.cwd = newPath
        return ''
      }
      return `\x1b[31mbash: cd: ${target}: No such file or directory\x1b[0m`
    }

    case 'pwd':
      return session.cwd

    case 'cat': {
      if (!args[0]) return '\x1b[31mbash: cat: missing operand\x1b[0m'
      const filePath = resolvePath(args[0], session.cwd)
      if (fileSystem[filePath]) {
        return fileSystem[filePath]
      }
      return `\x1b[31mbash: cat: ${args[0]}: No such file or directory\x1b[0m`
    }

    case 'echo':
      return args.join(' ').replace(/["']/g, '')

    case 'whoami':
      return session.username

    case 'hostname':
      return session.hostname

    case 'uname': {
      if (args.includes('-a')) {
        return `Linux ${session.hostname} 6.5.0-44-generic #44~22.04.1-Ubuntu SMP x86_64 GNU/Linux`
      }
      return 'Linux'
    }

    case 'date':
      return new Date().toString()

    case 'uptime': {
      const uptimeSec = Math.floor((Date.now() - session.connectedAt.getTime()) / 1000)
      const hours = Math.floor(uptimeSec / 3600)
      const mins = Math.floor((uptimeSec % 3600) / 60)
      return ` ${new Date().toLocaleTimeString()} up ${hours}:${mins.toString().padStart(2, '0')}, 1 user, load average: 0.08, 0.03, 0.01`
    }

    case 'free': {
      if (args.includes('-h')) {
        return `              total        used        free      shared  buff/cache   available
Mem:          512Mi       128Mi       256Mi       8.0Mi       128Mi       356Mi
Swap:         256Mi         0Bi       256Mi`
      }
      return `              total        used        free      shared  buff/cache   available
Mem:         524288      131072      262144        8192      131072      364544
Swap:        262144           0      262144`
    }

    case 'df': {
      if (args.includes('-h')) {
        return `Filesystem      Size  Used Avail Use% Mounted on
/dev/vda1       2.0G  485M  1.4G  26% /
tmpfs           256M   12M  244M   5% /dev/shm
/dev/vda2       512M   24M  488M   5% /boot`
      }
      return `Filesystem     1K-blocks    Used Available Use% Mounted on
/dev/vda1        2097152  496640   1494016  26% /
tmpfs             262144   12288    249856   5% /dev/shm
/dev/vda2         524288   24576    499712   5% /boot`
    }

    case 'ps':
      return `  PID TTY          TIME CMD
    1 ?        00:00:02 systemd
  142 ?        00:00:00 sshd
  256 ?        00:00:01 cron
  389 ?        00:00:00 nginx
  512 pts/0    00:00:00 bash
  789 pts/0    00:00:00 ps`

    case 'top':
      return `\x1b[1;36mtop - ${new Date().toLocaleTimeString()} up 1:23, 1 user, load average: 0.08, 0.03, 0.01\x1b[0m
Tasks:  \x1b[32m42 total\x1b[0m, 1 running, 41 sleeping, 0 stopped, 0 zombie
%Cpu(s): 2.3 us, 0.7 sy, 0.0 ni, 96.8 id, 0.2 wa, 0.0 hi, 0.0 si
MiB Mem:   512.0 total,   256.0 free,   128.0 used,   128.0 buff/cache
MiB Swap:  256.0 total,   256.0 free,     0.0 used.   356.0 avail Mem

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
  389 www-data  20   0   24560   8420   6240 S   0.3   1.6   0:01.23 nginx
  512 raw-user  20   0   10240   4120   3200 S   0.0   0.8   0:00.12 bash
    1 root      20   0  102340  12480   8960 S   0.0   2.4   0:02.45 systemd
  142 root      20   0   10256   5120   4096 S   0.0   1.0   0:00.34 sshd`

    case 'mkdir': {
      if (!args[0]) return '\x1b[31mbash: mkdir: missing operand\x1b[0m'
      return `\x1b[32mDirectory '${args[0]}' created\x1b[0m`
    }

    case 'touch': {
      if (!args[0]) return '\x1b[31mbash: touch: missing operand\x1b[0m'
      return `\x1b[32mFile '${args[0]}' created\x1b[0m`
    }

    case 'rm': {
      if (!args[0]) return '\x1b[31mbash: rm: missing operand\x1b[0m'
      return `\x1b[32mRemoved '${args[0]}'\x1b[0m`
    }

    case 'clear':
      return '\x1b[CLEAR]'

    case 'neofetch':
      return `\x1b[1;32m        .-/+oossssoo+/-.\x1b[0m       \x1b[1;33m${session.username}@${session.hostname}\x1b[0m
\x1b[1;32m    \`:+sssssssssssssssssss+:\`\x1b[0m   \x1b[1;33m--------------------------\x1b[0m
\x1b[1;32m  -+sssssssssssssssssssssss+-\x1b[0m   \x1b[1;33mOS:\x1b[0m Ubuntu 24.04 LTS x86_64
\x1b[1;32m .ossssssssssssssssssssssssso.\x1b[0m  \x1b[1;33mHost:\x1b[0m RAW Cloud VPS
\x1b[1;32m+sssssssssssssssssssssssssssss+\x1b[0m \x1b[1;33mKernel:\x1b[0m 6.5.0-44-generic
\x1b[1;32mossssssssssssssssssssssssssssso\x1b[0m \x1b[1;33mUptime:\x1b[0m ${Math.floor((Date.now() - session.connectedAt.getTime()) / 60000)} mins
\x1b[1;32mossssssssssssssssssssssssssssso\x1b[0m \x1b[1;33mShell:\x1b[0m bash 5.2.21
\x1b[1;32m+sssssssssssssssssssssssssssss+\x1b[0m \x1b[1;33mCPU:\x1b[0m ${RAW_PLAN_INFO.cpu}
\x1b[1;32m .ossssssssssssssssssssssssso.\x1b[0m  \x1b[1;33mMemory:\x1b[0m 128MiB / 512MiB
\x1b[1;32m  -+sssssssssssssssssssssss+-\x1b[0m   \x1b[1;33mDisk:\x1b[0m 485M / 2.0G (26%)
\x1b[1;32m    \`:+sssssssssssssssssss+:\`\x1b[0m   \x1b[1;33mPlan:\x1b[0m ${RAW_PLAN_INFO.plan}
\x1b[1;32m        .-/+oossssoo+/-.\x1b[0m       \x1b[1;33mRegion:\x1b[0m ${RAW_PLAN_INFO.region}`

    case 'plan':
      return `\x1b[1;36m╔══════════════════════════════════════╗\x1b[0m
\x1b[1;36m║     \x1b[1;33mRAW Cloud - Free Plan\x1b[1;36m           ║\x1b[0m
\x1b[1;36m╠══════════════════════════════════════╣\x1b[0m
\x1b[1;36m║\x1b[0m  CPU:       ${RAW_PLAN_INFO.cpu.padEnd(24)}\x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  RAM:       ${RAW_PLAN_INFO.ram.padEnd(24)}\x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  Storage:   ${RAW_PLAN_INFO.storage.padEnd(24)}\x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  Bandwidth: ${RAW_PLAN_INFO.bandwidth.padEnd(24)}\x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  OS:        ${RAW_PLAN_INFO.os.padEnd(24)}\x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  Region:    ${RAW_PLAN_INFO.region.padEnd(24)}\x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  Email:     ${session.email.padEnd(24)}\x1b[1;36m║\x1b[0m
\x1b[1;36m╚══════════════════════════════════════╝\x1b[0m`

    case 'exit':
      return '\x1b[DISCONNECT]'

    case 'apt':
    case 'apt-get': {
      if (args.includes('update')) {
        return `\x1b[33mReading package lists... Done\x1b[0m
\x1b[33mBuilding dependency tree... Done\x1b[0m
\x1b[32mAll packages are up to date.\x1b[0m`
      }
      if (args.includes('install') && args.length > 1) {
        const pkg = args[args.indexOf('install') + 1]
        return `\x1b[33mReading package lists... Done\x1b[0m
\x1b[33mBuilding dependency tree... Done\x1b[0m
The following NEW packages will be installed:
  ${pkg}
0 upgraded, 1 newly installed, 0 to remove.
\x1b[32mSetting up ${pkg}...\x1b[0m
\x1b[32m${pkg} installed successfully.\x1b[0m`
      }
      return `\x1b[31mE: Invalid operation.\x1b[0m`
    }

    case 'ping': {
      if (!args[0]) return '\x1b[31mbash: ping: missing host operand\x1b[0m'
      const host = args[0]
      return `PING ${host} (93.184.216.34) 56(84) bytes of data.
64 bytes from ${host}: icmp_seq=1 ttl=56 time=11.2 ms
64 bytes from ${host}: icmp_seq=2 ttl=56 time=10.8 ms
64 bytes from ${host}: icmp_seq=3 ttl=56 time=11.1 ms

--- ${host} ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2003ms
rtt min/avg/max/mdev = 10.800/11.033/11.200/0.171 ms`
    }

    case 'curl': {
      if (!args[0]) return "\x1b[31mcurl: try 'curl --help' for more information\x1b[0m"
      return `\x1b[33m  % Total    % Received % Xferd  Speed   Time    Time     Time  Current\x1b[0m
                                 Dload  Upload   Total   Spent    Left  Speed
100   256  100   256    0     0   1024      0 --:--:-- --:--:-- --:--:--  1024
\x1b[32mResponse received successfully.\x1b[0m`
    }

    case 'wget': {
      if (!args[0]) return '\x1b[31mwget: missing URL\x1b[0m'
      return `\x1b[33m--${new Date().toISOString()}--  ${args[0]}\x1b[0m
Resolving ${args[0]}... 93.184.216.34
Connecting... connected.
HTTP request sent, awaiting response... 200 OK
Length: 256 [text/html]
Saving to: 'index.html'
index.html          100%[===================>]     256  --.-KB/s    in 0s
\x1b[32mDownloaded successfully.\x1b[0m`
    }

    case 'nano':
    case 'vim':
    case 'vi':
      return `\x1b[33mEditor not available in web terminal. Use 'cat' with redirection instead.\x1b[0m`

    case 'sudo':
      return `\x1b[33m[sudo] password for ${session.username}: \x1b[0m\x1b[31mSorry, sudo is restricted on the Free plan.\x1b[0m`

    case 'ssh':
      return `\x1b[31mSSH outbound connections are not allowed on the Free plan.\x1b[0m`

    case 'history':
      return `\x1b[33mCommand history is stored in your browser session.\x1b[0m`

    default:
      if (cmd === '') return ''
      return `\x1b[31mbash: ${cmd}: command not found\x1b[0m`
  }
}

// Helper functions
function resolvePath(path: string, cwd: string): string {
  if (path.startsWith('/')) return normalizePath(path)
  if (path.startsWith('~')) return normalizePath('/home/raw-user' + path.slice(1))
  if (path === '..') {
    const parts = cwd.split('/').filter(Boolean)
    parts.pop()
    return '/' + parts.join('/')
  }
  if (path.startsWith('../')) {
    const parts = cwd.split('/').filter(Boolean)
    parts.pop()
    return normalizePath('/' + parts.join('/') + '/' + path.slice(3))
  }
  return normalizePath(cwd + '/' + path)
}

function normalizePath(path: string): string {
  const parts = path.split('/').filter(Boolean)
  const result: string[] = []
  for (const part of parts) {
    if (part === '..') result.pop()
    else if (part !== '.') result.push(part)
  }
  return '/' + result.join('/')
}

function isValidDirectory(path: string): boolean {
  const validDirs = [
    '/',
    '/home',
    '/home/raw-user',
    '/etc',
    '/var',
    '/var/log',
    '/var/www',
    '/usr',
    '/usr/local',
    '/usr/local/bin',
    '/opt',
    '/tmp',
    '/root',
  ]
  return validDirs.includes(path)
}

function listDirectory(path: string): string {
  const dirContents: Record<string, string[]> = {
    '/': ['\x1b[1;34mbin\x1b[0m', '\x1b[1;34mboot\x1b[0m', '\x1b[1;34mdev\x1b[0m', '\x1b[1;34metc\x1b[0m', '\x1b[1;34mhome\x1b[0m', '\x1b[1;34mlib\x1b[0m', '\x1b[1;34mopt\x1b[0m', '\x1b[1;34mproc\x1b[0m', '\x1b[1;34mroot\x1b[0m', '\x1b[1;34msbin\x1b[0m', '\x1b[1;34mtmp\x1b[0m', '\x1b[1;34musr\x1b[0m', '\x1b[1;34mvar\x1b[0m'],
    '/home': ['\x1b[1;34mraw-user\x1b[0m'],
    '/home/raw-user': ['\x1b[0m.bashrc\x1b[0m', '\x1b[0mwelcome.txt\x1b[0m', '\x1b[1;34mdocuments\x1b[0m', '\x1b[1;34mprojects\x1b[0m'],
    '/etc': ['\x1b[0mos-release\x1b[0m', '\x1b[0mhostname\x1b[0m', '\x1b[1;34mnginx\x1b[0m', '\x1b[1;34mssh\x1b[0m'],
    '/var': ['\x1b[1;34mlog\x1b[0m', '\x1b[1;34mwww\x1b[0m'],
    '/var/log': ['\x1b[0msyslog\x1b[0m', '\x1b[0mauth.log\x1b[0m', '\x1b[0mnginx\x1b[0m'],
    '/var/www': ['\x1b[0mindex.html\x1b[0m'],
    '/usr': ['\x1b[1;34mlocal\x1b[0m', '\x1b[1;34mbin\x1b[0m', '\x1b[1;34mlib\x1b[0m'],
    '/usr/local': ['\x1b[1;34mbin\x1b[0m'],
    '/usr/local/bin': ['\x1b[0mnode\x1b[0m', '\x1b[0mpython3\x1b[0m'],
    '/opt': [],
    '/tmp': [],
    '/root': ['\x1b[0m.bashrc\x1b[0m'],
  }

  if (dirContents[path] !== undefined) {
    if (dirContents[path].length === 0) return ''
    return dirContents[path].join('  ')
  }
  return `\x1b[31mls: cannot access '${path}': No such file or directory\x1b[0m`
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Connection established: ${socket.id}`)
  let session: Session | null = null

  // Authenticate with email and token
  socket.on('authenticate', (data: { email: string; token: string }) => {
    const { email, token } = data
    
    if (!email || !token) {
      socket.emit('auth-error', { message: 'Email and token are required' })
      return
    }

    // Create session
    session = {
      id: uuidv4(),
      email,
      token,
      hostname: 'raw-server',
      username: 'raw-user',
      cwd: '/home/raw-user',
      connectedAt: new Date()
    }

    sessions.set(socket.id, session)
    
    socket.emit('authenticated', { 
      sessionId: session.id,
      hostname: session.hostname,
      username: session.username,
      plan: RAW_PLAN_INFO
    })

    console.log(`User authenticated: ${email} (session: ${session.id})`)
  })

  // Handle terminal commands
  socket.on('command', (data: { command: string }) => {
    if (!session) {
      socket.emit('auth-required', { message: 'Please authenticate first' })
      return
    }

    const input = data.command.trim()
    if (!input) {
      socket.emit('output', { output: '', cwd: session.cwd })
      return
    }

    // Parse command
    const parts = input.split(/\s+/)
    const cmd = parts[0].toLowerCase()
    const args = parts.slice(1)

    // Handle special commands
    const output = handleCommand(cmd, args, session)
    
    if (output === '\x1b[CLEAR]') {
      socket.emit('clear', {})
    } else if (output === '\x1b[DISCONNECT]') {
      socket.emit('disconnected', { message: 'Connection closed. Goodbye!' })
      socket.disconnect()
    } else {
      socket.emit('output', { output, cwd: session.cwd })
    }
  })

  // Handle tab completion
  socket.on('tab-complete', (data: { input: string }) => {
    if (!session) return
    
    const commands = ['help', 'ls', 'cd', 'pwd', 'cat', 'echo', 'whoami', 'hostname',
      'uname', 'date', 'uptime', 'free', 'df', 'ps', 'top', 'mkdir', 'touch',
      'rm', 'clear', 'neofetch', 'plan', 'exit', 'apt', 'apt-get', 'ping',
      'curl', 'wget', 'nano', 'vim', 'vi', 'sudo', 'ssh', 'history']
    
    const input = data.input.trim().toLowerCase()
    const matches = commands.filter(c => c.startsWith(input))
    
    if (matches.length === 1) {
      socket.emit('tab-complete-result', { completion: matches[0].slice(input.length) + ' ' })
    } else if (matches.length > 1) {
      socket.emit('tab-complete-result', { suggestions: matches })
    }
  })

  socket.on('disconnect', () => {
    if (session) {
      sessions.delete(socket.id)
      console.log(`User disconnected: ${session.email} (session: ${session.id})`)
    }
  })

  socket.on('error', (error) => {
    console.error(`Socket error (${socket.id}):`, error)
  })
})

const PORT = 3003
httpServer.listen(PORT, () => {
  console.log(`Terminal WebSocket server running on port ${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down...')
  httpServer.close(() => process.exit(0))
})

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down...')
  httpServer.close(() => process.exit(0))
})
