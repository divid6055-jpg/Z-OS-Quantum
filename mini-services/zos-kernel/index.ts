import { createServer } from 'http'
import { Server } from 'socket.io'
import { v4 as uuidv4 } from 'uuid'
import { execSync, exec } from 'child_process'
import * as os from 'os'
import * as fs from 'fs'
import * as path from 'path'

const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/',
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// ═══════════════════════════════════════════════════════════
// Z-OS KERNEL - Advanced Operating System Core
// ═══════════════════════════════════════════════════════════

interface Process {
  pid: number
  name: string
  user: string
  cpu: number
  memory: number
  status: 'running' | 'sleeping' | 'zombie' | 'stopped'
  priority: number
  threads: number
  startTime: number
  cmd: string
}

interface FileSystemNode {
  name: string
  type: 'file' | 'directory' | 'symlink' | 'device' | 'socket' | 'pipe'
  permissions: string
  owner: string
  group: string
  size: number
  modified: Date
  content?: string
  target?: string
  children?: Map<string, FileSystemNode>
  encrypted?: boolean
  compressed?: boolean
  hash?: string
}

interface Service {
  name: string
  status: 'active' | 'inactive' | 'failed' | 'loading'
  type: 'system' | 'user' | 'network' | 'security'
  port?: number
  pid?: number
  uptime: number
  description: string
  autoStart: boolean
  dependencies: string[]
  log: string[]
}

interface NetworkInterface {
  name: string
  ip: string
  mac: string
  status: 'up' | 'down'
  speed: string
  rxBytes: number
  txBytes: number
  type: 'ethernet' | 'wifi' | 'loopback' | 'vpn'
}

interface FirewallRule {
  id: string
  action: 'allow' | 'deny' | 'redirect'
  direction: 'in' | 'out' | 'both'
  protocol: 'tcp' | 'udp' | 'icmp' | 'all'
  source: string
  destination: string
  port: string
  enabled: boolean
  logHits: number
}

interface Vulnerability {
  id: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  title: string
  description: string
  affected: string
  solution: string
  cve?: string
  status: 'open' | 'patched' | 'ignored'
}

interface Package {
  name: string
  version: string
  description: string
  size: string
  category: string
  installed: boolean
  dependencies: string[]
  repository: string
}

interface Session {
  id: string
  email: string
  token: string
  hostname: string
  username: string
  cwd: string
  connectedAt: Date
  pidCounter: number
  env: Record<string, string>
  history: string[]
  aliases: Record<string, string>
  variables: Record<string, string>
  runningProcesses: Process[]
  lastActivity: Date
}

// ═══════════════════════════════════════════════
// Z-OS FILESYSTEM - Advanced Hierarchical FS
// ═══════════════════════════════════════════════

function createFile(name: string, perms: string, owner: string, group: string, content: string = ''): FileSystemNode {
  return {
    name, type: 'file', permissions: perms, owner, group,
    size: Buffer.byteLength(content, 'utf8'),
    modified: new Date(), content,
    hash: hashContent(content),
  }
}

function createDir(name: string, perms: string, owner: string, group: string, children?: FileSystemNode[]): FileSystemNode {
  const map = new Map<string, FileSystemNode>()
  if (children) children.forEach(c => map.set(c.name, c))
  return {
    name, type: 'directory', permissions: perms, owner, group,
    size: 4096, modified: new Date(), children: map,
  }
}

function createSymlink(name: string, target: string, owner: string): FileSystemNode {
  return {
    name, type: 'symlink', permissions: 'lrwxrwxrwx', owner, group: owner,
    size: target.length, modified: new Date(), target,
  }
}

function createDevice(name: string, perms: string, owner: string): FileSystemNode {
  return {
    name, type: 'device', permissions: perms, owner, group: 'devices',
    size: 0, modified: new Date(),
  }
}

function hashContent(content: string): string {
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}

// Build the complete filesystem tree
const rootFS = createDir('/', 'drwxr-xr-x', 'root', 'root', [
  // /bin - Essential binaries
  createDir('bin', 'drwxr-xr-x', 'root', 'root', [
    createFile('zsh', '-rwxr-xr-x', 'root', 'root', '#!/bin/zsh\nZ-OS Shell v3.0'),
    createFile('zpkg', '-rwxr-xr-x', 'root', 'root', '#!/bin/zsh\nZ-OS Package Manager'),
    createFile('znet', '-rwxr-xr-x', 'root', 'root', '#!/bin/zsh\nZ-OS Network Manager'),
    createFile('zsec', '-rwxr-xr-x', 'root', 'root', '#!/bin/zsh\nZ-OS Security Center'),
    createFile('zmon', '-rwxr-xr-x', 'root', 'root', '#!/bin/zsh\nZ-OS System Monitor'),
    createFile('zfs', '-rwxr-xr-x', 'root', 'root', '#!/bin/zsh\nZ-OS Filesystem Tool'),
    createFile('bash', '-rwxr-xr-x', 'root', 'root', '#!/bin/bash\nBash compatibility layer'),
    createFile('ls', '-rwxr-xr-x', 'root', 'root'),
    createFile('cat', '-rwxr-xr-x', 'root', 'root'),
    createFile('grep', '-rwxr-xr-x', 'root', 'root'),
    createFile('find', '-rwxr-xr-x', 'root', 'root'),
    createFile('ps', '-rwxr-xr-x', 'root', 'root'),
    createFile('top', '-rwxr-xr-x', 'root', 'root'),
    createFile('kill', '-rwxr-xr-x', 'root', 'root'),
    createFile('chmod', '-rwxr-xr-x', 'root', 'root'),
    createFile('chown', '-rwxr-xr-x', 'root', 'root'),
    createFile('nano', '-rwxr-xr-x', 'root', 'root'),
    createFile('vim', '-rwxr-xr-x', 'root', 'root'),
    createFile('python3', '-rwxr-xr-x', 'root', 'root'),
    createFile('node', '-rwxr-xr-x', 'root', 'root'),
    createFile('gcc', '-rwxr-xr-x', 'root', 'root'),
    createFile('git', '-rwxr-xr-x', 'root', 'root'),
    createFile('curl', '-rwxr-xr-x', 'root', 'root'),
    createFile('wget', '-rwxr-xr-x', 'root', 'root'),
    createFile('docker', '-rwxr-xr-x', 'root', 'root'),
  ]),

  // /sbin - System binaries
  createDir('sbin', 'drwx------', 'root', 'root', [
    createFile('init', '-rwx------', 'root', 'root'),
    createFile('systemctl', '-rwx------', 'root', 'root'),
    createFile('fdisk', '-rwx------', 'root', 'root'),
    createFile('mkfs', '-rwx------', 'root', 'root'),
    createFile('mount', '-rwx------', 'root', 'root'),
    createFile('iptables', '-rwx------', 'root', 'root'),
    createFile('zfirewall', '-rwx------', 'root', 'root'),
    createFile('zaudit', '-rwx------', 'root', 'root'),
    createFile('zscan', '-rwx------', 'root', 'root'),
  ]),

  // /etc - Configuration
  createDir('etc', 'drwxr-xr-x', 'root', 'root', [
    createFile('z-os-release', '-rw-r--r--', 'root', 'root',
      'NAME="Z-OS"\nVERSION="3.0.0 Quantum"\nID=zos\nBUILD=2026062201\nKERNEL=z-kernel-6.2.0\nARCH=x86_64\nPRETTY_NAME="Z-OS 3.0 Quantum"\nHOME_URL="https://z-os.cloud"\nBUG_REPORT_URL="https://z-os.cloud/bugs"\nLICENSE=ZPL-3.0'),
    createFile('hostname', '-rw-r--r--', 'root', 'root', 'z-mainframe'),
    createFile('hosts', '-rw-r--r--', 'root', 'root', '127.0.0.1\tlocalhost\n127.0.0.1\tz-mainframe\n::1\t\tlocalhost'),
    createFile('passwd', '-rw-r--r--', 'root', 'root', 'root:x:0:0:root:/root:/bin/zsh\nz-user:x:1000:1000:Z-OS User:/home/z-user:/bin/zsh\nwww:x:33:33:Web Server:/var/www:/bin/nologin'),
    createFile('shadow', '-rw-------', 'root', 'root', 'root:$6$rounds=65536$z$salt:19000:0:99999:7:::'),
    createFile('fstab', '-rw-r--r--', 'root', 'root', '# Z-OS Filesystem Table\n/dev/zroot\t/\tzfs\tdefaults,compress=zstd\t0 0\n/dev/zroot/home\t/home\tzfs\tdefaults,compress=zstd\t0 0\ntmpfs\t/tmp\ttmpfs\tdefaults,size=2G\t0 0'),
    createFile('resolv.conf', '-rw-r--r--', 'root', 'root', 'nameserver 1.1.1.1\nnameserver 8.8.8.8\nsearch z-os.local'),
    createFile('zfirewall.conf', '-rw-------', 'root', 'root', '[DEFAULT]\npolicy=deny\nlog=enabled\nrate_limit=100/s\n'),
    createDir('z-security', 'drwx------', 'root', 'root', [
      createFile('audit.conf', '-rw-------', 'root', 'root', 'AUDIT_LEVEL=PARANOID\nLOG_RETENTION=365d\nALERT_EMAIL=admin@z-os.cloud\nAUTO_PATCH=enabled'),
      createFile('encryption.conf', '-rw-------', 'root', 'root', 'DEFAULT_CIPHER=AES-256-GCM\nKEY_ROTATION=24h\nTLS_VERSION=1.3\nHSTS=enabled'),
      createFile('hardening.conf', '-rw-------', 'root', 'root', 'ASLR=full\nNX=enabled\nSTACK_PROTECTOR=strong\nFORTIFY_SOURCE=2\nPIE=always\nRELRO=full\nSECCOMP=strict'),
    ]),
    createDir('z-network', 'drwxr-xr-x', 'root', 'root', [
      createFile('interfaces', '-rw-r--r--', 'root', 'root', 'auto z0\niface z0 inet dhcp\n  hwaddress ether 00:1A:2B:3C:4D:5E'),
      createFile('dns.conf', '-rw-r--r--', 'root', 'root', 'dns-over-https=enabled\ndnssec=validate\nfallback=9.9.9.9'),
    ]),
    createDir('nginx', 'drwxr-xr-x', 'root', 'root', [
      createFile('nginx.conf', '-rw-r--r--', 'root', 'root', 'worker_processes auto;\nevents { worker_connections 1024; }\nhttp { server { listen 80; } }'),
    ]),
  ]),

  // /home - User directories
  createDir('home', 'drwxr-xr-x', 'root', 'root', [
    createDir('z-user', 'drwxr-xr-x', 'z-user', 'z-user', [
      createFile('.zshrc', '-rw-r--r--', 'z-user', 'z-user',
        '# Z-OS Shell Configuration\nexport SHELL=/bin/zsh\nexport TERM=xterm-256color\nexport EDITOR=nano\nexport LANG=en_US.UTF-8\n\n# Z-OS Aliases\nalias ll="ls -lah --color=auto"\nalias la="ls -A --color=auto"\nalias cls="clear"\nalias update="zpkg update && zpkg upgrade"\nalias scan="zsec scan --full"\nalias mon="zmon --realtime"\nalias net="znet status"\nalias firewall="zfirewall status"\n\n# Z-Script Functions\nzinfo() {\n  echo "Z-OS $(cat /etc/z-os-release | grep VERSION | cut -d= -f2)"\n  echo "Kernel: $(uname -r)"\n  echo "Uptime: $(uptime -p)"\n}\n\n# Prompt\nPS1="\\[\\e[1;32m\\]\\u@\\h\\[\\e[0m\\]:\\[\\e[1;34m\\]\\w\\[\\e[0m\\]\\$ "'),
      createFile('.zprofile', '-rw-r--r--', 'z-user', 'z-user', '# Z-OS Profile\nsource ~/.zshrc'),
      createFile('.zhistory', '-rw-------', 'z-user', 'z-user', ''),
      createFile('welcome.txt', '-rw-r--r--', 'z-user', 'z-user',
        '╔═══════════════════════════════════════════════════════╗\n║  Welcome to Z-OS 3.0 Quantum - The Future of Computing ║\n║                                                       ║\n║  Type "help" for commands, "ztour" for a guided tour  ║\n║  Type "zsec scan" to run a security audit             ║\n╚═══════════════════════════════════════════════════════╝'),
      createDir('documents', 'drwxr-xr-x', 'z-user', 'z-user', [
        createFile('readme.md', '-rw-r--r--', 'z-user', 'z-user', '# Z-OS Documentation\n\nZ-OS is a next-generation operating system built from the ground up.\n\n## Features\n- Quantum-resistant encryption\n- AI-powered threat detection\n- Zero-trust architecture\n- Self-healing filesystem\n- Real-time security auditing'),
        createFile('notes.txt', '-rw-r--r--', 'z-user', 'z-user', 'Meeting notes - Project Z-OS\n- Review security scan results\n- Update firewall rules\n- Deploy new services'),
      ]),
      createDir('projects', 'drwxr-xr-x', 'z-user', 'z-user', [
        createDir('web-app', 'drwxr-xr-x', 'z-user', 'z-user', [
          createFile('index.html', '-rw-r--r--', 'z-user', 'z-user', '<!DOCTYPE html>\n<html><head><title>Z-OS App</title></head>\n<body><h1>Hello from Z-OS</h1></body></html>'),
          createFile('style.css', '-rw-r--r--', 'z-user', 'z-user', 'body { font-family: "Z-Font", sans-serif; margin: 0; }'),
          createFile('app.js', '-rw-r--r--', 'z-user', 'z-user', 'const app = {\n  name: "Z-OS Web App",\n  version: "1.0.0"\n};'),
        ]),
        createDir('scripts', 'drwxr-xr-x', 'z-user', 'z-user', [
          createFile('backup.zs', '-rwxr-xr-x', 'z-user', 'z-user', '#!/bin/zsh\n# Z-Script: Automated Backup\necho "Starting Z-OS backup..."\nzfs snapshot zroot/home@backup-$(date +%Y%m%d)\necho "Backup complete!"'),
          createFile('monitor.zs', '-rwxr-xr-x', 'z-user', 'z-user', '#!/bin/zsh\n# Z-Script: System Monitor\nwhile true; do\n  clear\n  zmon --snapshot\n  sleep 5\ndone'),
        ]),
      ]),
      createDir('downloads', 'drwxr-xr-x', 'z-user', 'z-user', []),
      createDir('.ssh', 'drwx------', 'z-user', 'z-user', [
        createFile('id_ed25519.pub', '-rw-r--r--', 'z-user', 'z-user', 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI z-user@z-mainframe'),
        createFile('authorized_keys', '-rw-------', 'z-user', 'z-user', 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI z-user@z-mainframe'),
        createFile('config', '-rw-------', 'z-user', 'z-user', 'Host *\n  AddKeysToAgent yes\n  IdentityFile ~/.ssh/id_ed25519'),
      ]),
      createDir('.config', 'drwxr-xr-x', 'z-user', 'z-user', []),
    ]),
  ]),

  // /var - Variable data
  createDir('var', 'drwxr-xr-x', 'root', 'root', [
    createDir('log', 'drwxr-xr-x', 'root', 'root', [
      createFile('syslog', '-rw-r-----', 'root', 'root', ''),
      createFile('auth.log', '-rw-r-----', 'root', 'root', ''),
      createFile('zfirewall.log', '-rw-r-----', 'root', 'root', ''),
      createFile('zaudit.log', '-rw-------', 'root', 'root', ''),
    ]),
    createDir('www', 'drwxr-xr-x', 'www', 'www', [
      createFile('index.html', '-rw-r--r--', 'www', 'www', '<h1>Welcome to Z-OS Web Server</h1>'),
    ]),
    createDir('lib', 'drwxr-xr-x', 'root', 'root', []),
    createDir('cache', 'drwx------', 'root', 'root', []),
    createDir('tmp', 'drwxrwxrwt', 'root', 'root', []),
  ]),

  // /usr - User programs
  createDir('usr', 'drwxr-xr-x', 'root', 'root', [
    createDir('bin', 'drwxr-xr-x', 'root', 'root', []),
    createDir('lib', 'drwxr-xr-x', 'root', 'root', []),
    createDir('share', 'drwxr-xr-x', 'root', 'root', [
      createDir('z-os', 'drwxr-xr-x', 'root', 'root', [
        createFile('themes.json', '-rw-r--r--', 'root', 'root', '{"theme": "quantum-dark"}'),
      ]),
    ]),
    createDir('local', 'drwxr-xr-x', 'root', 'root', [
      createDir('bin', 'drwxr-xr-x', 'root', 'root', []),
    ]),
  ]),

  // /tmp - Temporary
  createDir('tmp', 'drwxrwxrwt', 'root', 'root', []),

  // /opt - Optional
  createDir('opt', 'drwxr-xr-x', 'root', 'root', [
    createDir('z-ai', 'drwxr-xr-x', 'root', 'root', [
      createFile('model.conf', '-rw-r--r--', 'root', 'root', 'model=z-llm-7b\ncontext=8192\nquantization=int4'),
    ]),
  ]),

  // /dev - Devices
  createDir('dev', 'drwxr-xr-x', 'root', 'root', [
    createDevice('null', 'crw-rw-rw-', 'root'),
    createDevice('zero', 'crw-rw-rw-', 'root'),
    createDevice('random', 'crw-rw-rw-', 'root'),
    createDevice('urandom', 'crw-rw-rw-', 'root'),
    createDevice('zroot', 'brw-rw----', 'root'),
    createDevice('tty0', 'crw--w----', 'root'),
    createDevice('console', 'crw-------', 'root'),
  ]),

  // /proc - Process info (virtual)
  createDir('proc', 'dr-xr-xr-x', 'root', 'root', [
    createFile('cpuinfo', '-r--r--r--', 'root', 'root', 'processor\t: 0\nmodel name\t: Z-Quantum vCPU @ 4.2GHz\ncpu cores\t: 4\ncache size\t: 16384 KB\nflags\t\t: avx avx2 avx512 quantum sse4_2 aes-ni'),
    createFile('meminfo', '-r--r--r--', 'root', 'root', 'MemTotal:       16777216 kB\nMemFree:         8388608 kB\nMemAvailable:   12582912 kB\nBuffers:          524288 kB\nCached:          2097152 kB\nSwapTotal:       8388608 kB\nSwapFree:        8388608 kB'),
    createFile('version', '-r--r--r--', 'root', 'root', 'Z-OS version 6.2.0-z-quantum (gcc version 14.1.0) #1 SMP PREEMPT_DYNAMIC'),
    createFile('uptime', '-r--r--r--', 'root', 'root', `${Math.floor(process.uptime())} ${process.uptime() * 100}`),
  ]),

  // /sys - System info (virtual)
  createDir('sys', 'dr-xr-xr-x', 'root', 'root', [
    createDir('kernel', 'dr-xr-xr-x', 'root', 'root', [
      createFile('version', '-r--r--r--', 'root', 'root', '6.2.0-z-quantum'),
    ]),
  ]),

  // /root - Root home
  createDir('root', 'drwx------', 'root', 'root', [
    createFile('.zshrc', '-rw-r--r--', 'root', 'root', '# Root shell config\nPS1="\\[\\e[1;31m\\]root@\\h\\[\\e[0m\\]:\\[\\e[1;34m\\]\\w\\[\\e[0m\\]# "'),
  ]),

  // /boot - Boot files
  createDir('boot', 'drwxr-xr-x', 'root', 'root', [
    createFile('vmlinuz-6.2.0-z-quantum', '-rw-r--r--', 'root', 'root', '[kernel binary]'),
    createFile('initramfs-z.img', '-rw-r--r--', 'root', 'root', '[initramfs image]'),
    createDir('grub', 'drwxr-xr-x', 'root', 'root', [
      createFile('grub.cfg', '-rw-------', 'root', 'root', 'menuentry "Z-OS Quantum" {\n  linux /boot/vmlinuz-6.2.0-z-quantum root=/dev/zroot\n  initrd /boot/initramfs-z.img\n}'),
    ]),
  ]),

  // /run - Runtime data
  createDir('run', 'drwxrwxrwt', 'root', 'root', []),
])

// ═══════════════════════════════════════════
// Z-OS SERVICES - System Daemons
// ═══════════════════════════════════════════

const systemServices: Service[] = [
  { name: 'z-init', status: 'active', type: 'system', pid: 1, uptime: 0, description: 'Z-OS Init System - Process Manager', autoStart: true, dependencies: [], log: ['Started successfully', 'All services loaded'] },
  { name: 'z-kernel-guard', status: 'active', type: 'security', pid: 2, uptime: 0, description: 'Kernel-level intrusion detection & prevention', autoStart: true, dependencies: ['z-init'], log: ['Monitoring kernel syscalls', '0 threats detected'] },
  { name: 'z-firewall', status: 'active', type: 'security', pid: 3, uptime: 0, description: 'Next-gen AI-powered Firewall', autoStart: true, dependencies: ['z-init'], log: ['Firewall rules loaded: 247 active', 'Blocking 12 suspicious IPs'] },
  { name: 'z-netmanager', status: 'active', type: 'network', pid: 4, uptime: 0, description: 'Network Connection Manager', autoStart: true, dependencies: ['z-init'], log: ['Interface z0: connected', 'DNS-over-HTTPS: active'] },
  { name: 'z-auditd', status: 'active', type: 'security', pid: 5, uptime: 0, description: 'Real-time Security Audit Daemon', autoStart: true, dependencies: ['z-kernel-guard'], log: ['Audit level: PARANOID', 'Logging all privileged operations'] },
  { name: 'z-quantum-crypto', status: 'active', type: 'security', pid: 6, uptime: 0, description: 'Quantum-resistant Encryption Service', autoStart: true, dependencies: ['z-init'], log: ['AES-256-GCM active', 'Key rotation in 24h', 'TLS 1.3 enforced'] },
  { name: 'z-ai-detect', status: 'active', type: 'security', pid: 7, uptime: 0, description: 'AI-Powered Threat Detection Engine', autoStart: true, dependencies: ['z-kernel-guard', 'z-firewall'], log: ['AI model: z-threat-v3 loaded', 'Scanning network patterns', 'Anomaly detection: active'] },
  { name: 'z-fs-monitor', status: 'active', type: 'system', pid: 8, uptime: 0, description: 'Self-healing Filesystem Monitor', autoStart: true, dependencies: ['z-init'], log: ['ZFS scrub: healthy', 'No filesystem errors'] },
  { name: 'z-scheduler', status: 'active', type: 'system', pid: 9, uptime: 0, description: 'Quantum Process Scheduler', autoStart: true, dependencies: ['z-init'], log: ['CPU scheduling: real-time priority', 'Load balancing: optimal'] },
  { name: 'nginx', status: 'active', type: 'network', port: 80, pid: 10, uptime: 0, description: 'Web Server (NGINX)', autoStart: true, dependencies: ['z-netmanager'], log: ['Listening on port 80', 'Serving /var/www'] },
  { name: 'sshd', status: 'active', type: 'network', port: 22, pid: 11, uptime: 0, description: 'Secure Shell Server', autoStart: true, dependencies: ['z-netmanager', 'z-quantum-crypto'], log: ['Listening on port 22', 'Ed25519 keys only'] },
  { name: 'z-packagekit', status: 'active', type: 'system', pid: 12, uptime: 0, description: 'Package Management Daemon', autoStart: true, dependencies: ['z-init'], log: ['Repository: z-os-quantum', 'Packages available: 42,000+'] },
  { name: 'docker', status: 'inactive', type: 'system', pid: 0, uptime: 0, description: 'Container Runtime', autoStart: false, dependencies: ['z-init'], log: ['Not started'] },
  { name: 'z-vpn', status: 'inactive', type: 'network', port: 1194, pid: 0, uptime: 0, description: 'WireGuard VPN Service', autoStart: false, dependencies: ['z-netmanager'], log: ['Not started'] },
  { name: 'z-tor', status: 'inactive', type: 'network', port: 9050, pid: 0, uptime: 0, description: 'Tor Anonymity Network', autoStart: false, dependencies: ['z-netmanager'], log: ['Not started'] },
]

// ═══════════════════════════════════════════
// Z-OS NETWORK INTERFACES
// ═══════════════════════════════════════════

const networkInterfaces: NetworkInterface[] = [
  { name: 'z0', ip: '10.0.0.1', mac: '00:1A:2B:3C:4D:5E', status: 'up', speed: '10 Gbps', rxBytes: 1073741824, txBytes: 536870912, type: 'ethernet' },
  { name: 'z-wifi0', ip: '192.168.1.100', mac: '00:1A:2B:3C:4D:5F', status: 'up', speed: '1.2 Gbps', rxBytes: 524288000, txBytes: 262144000, type: 'wifi' },
  { name: 'lo', ip: '127.0.0.1', mac: '00:00:00:00:00:00', status: 'up', speed: '∞', rxBytes: 1048576, txBytes: 1048576, type: 'loopback' },
  { name: 'z-vpn0', ip: '10.8.0.1', mac: '00:1A:2B:3C:4D:60', status: 'down', speed: '1 Gbps', rxBytes: 0, txBytes: 0, type: 'vpn' },
]

// ═══════════════════════════════════════════
// Z-OS FIREWALL RULES
// ═══════════════════════════════════════════

const firewallRules: FirewallRule[] = [
  { id: 'fw001', action: 'allow', direction: 'in', protocol: 'tcp', source: '0.0.0.0/0', destination: '0.0.0.0/0', port: '22', enabled: true, logHits: 145 },
  { id: 'fw002', action: 'allow', direction: 'in', protocol: 'tcp', source: '0.0.0.0/0', destination: '0.0.0.0/0', port: '80', enabled: true, logHits: 8923 },
  { id: 'fw003', action: 'allow', direction: 'in', protocol: 'tcp', source: '0.0.0.0/0', destination: '0.0.0.0/0', port: '443', enabled: true, logHits: 15640 },
  { id: 'fw004', action: 'deny', direction: 'in', protocol: 'all', source: '0.0.0.0/0', destination: '0.0.0.0/0', port: '*', enabled: true, logHits: 45230 },
  { id: 'fw005', action: 'deny', direction: 'in', protocol: 'tcp', source: '185.220.101.0/24', destination: '0.0.0.0/0', port: '*', enabled: true, logHits: 892 },
  { id: 'fw006', action: 'deny', direction: 'in', protocol: 'tcp', source: '45.33.32.0/24', destination: '0.0.0.0/0', port: '*', enabled: true, logHits: 445 },
  { id: 'fw007', action: 'allow', direction: 'out', protocol: 'all', source: '0.0.0.0/0', destination: '0.0.0.0/0', port: '*', enabled: true, logHits: 23451 },
  { id: 'fw008', action: 'deny', direction: 'out', protocol: 'tcp', source: '0.0.0.0/0', destination: '0.0.0.0/0', port: '25', enabled: true, logHits: 23 },
  { id: 'fw009', action: 'allow', direction: 'in', protocol: 'icmp', source: '0.0.0.0/0', destination: '0.0.0.0/0', port: '*', enabled: false, logHits: 0 },
  { id: 'fw010', action: 'redirect', direction: 'in', protocol: 'tcp', source: '0.0.0.0/0', destination: '0.0.0.0/0', port: '8080', enabled: true, logHits: 156 },
]

// ═══════════════════════════════════════════
// Z-OS VULNERABILITY DATABASE
// ═══════════════════════════════════════════

const vulnerabilityDB: Vulnerability[] = [
  { id: 'ZVE-2026-001', severity: 'critical', title: 'Kernel Privilege Escalation via Z-Syscall', description: 'A flaw in z_syscall_handler allows unprivileged users to execute arbitrary kernel code through crafted syscall sequences', affected: 'z-kernel < 6.2.0-3', solution: 'Update to z-kernel 6.2.0-3 or later', cve: 'CVE-2026-1234', status: 'patched' },
  { id: 'ZVE-2026-002', severity: 'high', title: 'ZFS Buffer Overflow in Snapshot Handler', description: 'A buffer overflow in zfs_snapshot_create() can lead to kernel panic or privilege escalation when processing specially crafted snapshot names', affected: 'zfs-utils < 2.3.1', solution: 'Update zfs-utils to 2.3.1', cve: 'CVE-2026-1235', status: 'open' },
  { id: 'ZVE-2026-003', severity: 'high', title: 'SSH Key Confusion Attack', description: 'Improper validation of Ed25519 keys allows authentication bypass when multiple keys are presented', affected: 'z-openssh < 9.8p1', solution: 'Update to z-openssh 9.8p1', cve: 'CVE-2026-1236', status: 'patched' },
  { id: 'ZVE-2026-004', severity: 'medium', title: 'Z-Firewall Rule Bypass via Fragmented Packets', description: 'Specially crafted IPv4 fragments can bypass certain firewall rules when reassembly is delayed', affected: 'z-firewall < 3.1.2', solution: 'Update z-firewall and enable strict reassembly', status: 'open' },
  { id: 'ZVE-2026-005', severity: 'medium', title: 'Information Leak in /proc/z-status', description: 'Kernel pointer values are exposed in /proc/z-status, potentially aiding kernel exploit development', affected: 'z-kernel < 6.2.0-2', solution: 'Enable kptr_restrict=2 in sysctl', status: 'patched' },
  { id: 'ZVE-2026-006', severity: 'low', title: 'Weak Default Cipher in Z-VPN', description: 'Z-VPN defaults to ChaCha20-Poly1305 instead of AES-256-GCM when hardware acceleration is unavailable', affected: 'z-vpn < 1.2.0', solution: 'Configure preferred cipher in /etc/z-network/vpn.conf', status: 'open' },
  { id: 'ZVE-2026-007', severity: 'critical', title: 'Z-Package Signature Verification Bypass', description: 'A race condition in zpkg allows installation of unsigned packages when signature verification is performed asynchronously', affected: 'zpkg < 5.0.3', solution: 'Update zpkg to 5.0.3 which enforces synchronous verification', cve: 'CVE-2026-1237', status: 'open' },
  { id: 'ZVE-2026-008', severity: 'info', title: 'Default SSH Banner Exposes Version', description: 'The default SSH banner reveals exact software version information', affected: 'z-openssh all versions', solution: 'Configure Banner none in sshd_config', status: 'ignored' },
]

// ═══════════════════════════════════════════
// Z-OS PACKAGE REPOSITORY
// ═══════════════════════════════════════════

const packageDB: Package[] = [
  { name: 'z-kernel', version: '6.2.0-3', description: 'Z-OS Quantum Kernel', size: '128 MB', category: 'system', installed: true, dependencies: [], repository: 'z-os-core' },
  { name: 'z-firewall', version: '3.1.2', description: 'AI-Powered Next-Gen Firewall', size: '24 MB', category: 'security', installed: true, dependencies: ['z-kernel'], repository: 'z-os-security' },
  { name: 'z-ai-detect', version: '3.0.1', description: 'AI Threat Detection Engine', size: '256 MB', category: 'security', installed: true, dependencies: ['z-kernel', 'z-firewall'], repository: 'z-os-security' },
  { name: 'z-quantum-crypto', version: '2.0.0', description: 'Quantum-Resistant Cryptography', size: '32 MB', category: 'security', installed: true, dependencies: ['z-kernel'], repository: 'z-os-security' },
  { name: 'nginx', version: '1.27.0', description: 'High-performance Web Server', size: '8 MB', category: 'network', installed: true, dependencies: [], repository: 'z-os-net' },
  { name: 'z-openssh', version: '9.8p1', description: 'Secure Shell with Z-OS enhancements', size: '4 MB', category: 'network', installed: true, dependencies: ['z-quantum-crypto'], repository: 'z-os-net' },
  { name: 'docker', version: '26.1.0', description: 'Container Runtime', size: '128 MB', category: 'dev', installed: false, dependencies: ['z-kernel'], repository: 'z-os-dev' },
  { name: 'python3', version: '3.13.0', description: 'Python Programming Language', size: '64 MB', category: 'dev', installed: true, dependencies: [], repository: 'z-os-dev' },
  { name: 'nodejs', version: '22.0.0', description: 'Node.js JavaScript Runtime', size: '48 MB', category: 'dev', installed: true, dependencies: [], repository: 'z-os-dev' },
  { name: 'gcc', version: '14.1.0', description: 'GNU Compiler Collection', size: '96 MB', category: 'dev', installed: true, dependencies: [], repository: 'z-os-dev' },
  { name: 'git', version: '2.45.0', description: 'Distributed Version Control', size: '16 MB', category: 'dev', installed: true, dependencies: [], repository: 'z-os-dev' },
  { name: 'z-vpn', version: '1.2.0', description: 'WireGuard VPN Client/Server', size: '6 MB', category: 'network', installed: false, dependencies: ['z-kernel'], repository: 'z-os-net' },
  { name: 'z-tor', version: '0.4.8', description: 'Tor Anonymity Network', size: '12 MB', category: 'network', installed: false, dependencies: [], repository: 'z-os-net' },
  { name: 'postgresql', version: '17.0', description: 'Advanced Database Server', size: '64 MB', category: 'database', installed: false, dependencies: [], repository: 'z-os-data' },
  { name: 'redis', version: '8.0', description: 'In-Memory Data Store', size: '8 MB', category: 'database', installed: false, dependencies: [], repository: 'z-os-data' },
  { name: 'z-monitor', version: '2.5.0', description: 'System Monitoring Dashboard', size: '32 MB', category: 'system', installed: true, dependencies: ['z-kernel'], repository: 'z-os-core' },
  { name: 'z-audit', version: '4.0.0', description: 'Security Audit Framework', size: '16 MB', category: 'security', installed: true, dependencies: ['z-kernel', 'z-firewall'], repository: 'z-os-security' },
  { name: 'rust', version: '1.78.0', description: 'Rust Programming Language', size: '256 MB', category: 'dev', installed: false, dependencies: [], repository: 'z-os-dev' },
  { name: 'go', version: '1.22.0', description: 'Go Programming Language', size: '128 MB', category: 'dev', installed: false, dependencies: [], repository: 'z-os-dev' },
  { name: 'z-desktop', version: '3.0.0', description: 'Z-OS Quantum Desktop Environment', size: '128 MB', category: 'desktop', installed: true, dependencies: ['z-kernel'], repository: 'z-os-desktop' },
]

// ═══════════════════════════════════════════
// SESSIONS & SYSTEM STATE
// ═══════════════════════════════════════════

const sessions = new Map<string, Session>()
const startTime = Date.now()
let totalConnections = 0
let totalCommands = 0

// ═══════════════════════════════════════════
// FILESYSTEM NAVIGATION HELPERS
// ═══════════════════════════════════════════

function resolvePath(inputPath: string, cwd: string): string {
  if (!inputPath || inputPath === '') return cwd
  if (inputPath === '~') return '/home/z-user'
  if (inputPath.startsWith('~/')) return '/home/z-user/' + inputPath.slice(2)
  if (inputPath.startsWith('/')) {
    return normalizePath(inputPath)
  }
  return normalizePath(cwd + '/' + inputPath)
}

function normalizePath(p: string): string {
  const parts = p.split('/').filter(Boolean)
  const result: string[] = []
  for (const part of parts) {
    if (part === '..') result.pop()
    else if (part !== '.') result.push(part)
  }
  return '/' + result.join('/')
}

function getNodeAtPath(path: string): FileSystemNode | null {
  if (path === '/') return rootFS
  const parts = path.split('/').filter(Boolean)
  let current: FileSystemNode = rootFS
  for (const part of parts) {
    if (!current.children) return null
    const child = current.children.get(part)
    if (!child) return null
    if (child.type === 'symlink' && child.target) {
      return getNodeAtPath(child.target)
    }
    current = child
  }
  return current
}

function getParentAndName(path: string): { parent: FileSystemNode | null, name: string } {
  const parts = path.split('/').filter(Boolean)
  if (parts.length === 0) return { parent: null, name: '/' }
  const name = parts.pop()!
  const parentPath = '/' + parts.join('/')
  return { parent: getNodeAtPath(parentPath), name }
}

// ═══════════════════════════════════════════
// SYSTEM METRICS (Dynamic)
// ═══════════════════════════════════════════

function getSystemMetrics() {
  const uptime = Math.floor((Date.now() - startTime) / 1000)
  const cpuUsage = 5 + Math.random() * 20
  const memUsed = 4096 + Math.random() * 4096
  const memTotal = 16384
  const diskUsed = 8.2
  const diskTotal = 64
  const netRx = Math.floor(Math.random() * 1000000)
  const netTx = Math.floor(Math.random() * 500000)
  const loadAvg = [(Math.random() * 2).toFixed(2), (Math.random() * 1.5).toFixed(2), (Math.random() * 1).toFixed(2)]
  const processes = 142 + Math.floor(Math.random() * 20)
  const threads = 547 + Math.floor(Math.random() * 50)
  const threats = Math.floor(Math.random() * 3)
  const blockedIPs = 12 + Math.floor(Math.random() * 5)

  return { uptime, cpuUsage, memUsed, memTotal, diskUsed, diskTotal, netRx, netTx, loadAvg, processes, threads, threats, blockedIPs }
}

// ═══════════════════════════════════════════
// COMMAND PROCESSOR - The Heart of Z-OS
// ═══════════════════════════════════════════

function processCommand(rawInput: string, session: Session): { output: string; cwd?: string; action?: string } {
  totalCommands++
  session.lastActivity = new Date()

  // Handle aliases
  let input = rawInput.trim()
  if (!input) return { output: '' }

  // Process aliases
  for (const [alias, replacement] of Object.entries(session.aliases)) {
    if (input === alias || input.startsWith(alias + ' ')) {
      input = replacement + input.slice(alias.length)
      break
    }
  }

  // Handle pipes (simplified)
  const pipeParts = input.split('|').map(p => p.trim())
  let lastOutput = ''

  for (const pipePart of pipeParts) {
    const parts = pipePart.split(/\s+/)
    const cmd = parts[0].toLowerCase()
    const args = parts.slice(1)

    // If piped, prepend last output as virtual file
    const effectiveArgs = lastOutput ? [...args] : args

    const result = executeSingleCommand(cmd, effectiveArgs, session, lastOutput)
    lastOutput = result.output

    if (result.cwd) session.cwd = result.cwd
    if (result.action === 'disconnect') return { output: lastOutput, action: 'disconnect' }
    if (result.action === 'clear') return { output: '', action: 'clear' }
  }

  return { output: lastOutput, cwd: session.cwd }
}

function executeSingleCommand(cmd: string, args: string[], session: Session, pipeInput: string): { output: string; cwd?: string; action?: string } {
  switch (cmd) {
    // ═══════════════════════════════
    // CORE SYSTEM COMMANDS
    // ═══════════════════════════════
    case 'help': {
      if (args[0] === 'advanced' || args[0] === '-a') {
        return { output: `\x1b[1;36m╔════════════════════════════════════════════════════════════════╗\x1b[0m
\x1b[1;36m║          \x1b[1;33mZ-OS Advanced Commands Reference\x1b[1;36m                        ║\x1b[0m
\x1b[1;36m╠════════════════════════════════════════════════════════════════╣\x1b[0m
\x1b[1;36m║\x1b[0m \x1b[1;32mSYSTEM\x1b[0m                                                        \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   zsysinfo       Full system information                    \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   zbenchmark     Run system benchmarks                      \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   ztopology      Show system topology                      \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   ztrace         System call tracer                        \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                                                                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m \x1b[1;32mSECURITY\x1b[0m                                                      \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   zsec scan       Full security vulnerability scan          \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   zsec harden     Apply security hardening                 \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   zsec audit      View security audit log                  \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   zsec encrypt    Encrypt files/directories                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   zsec decrypt    Decrypt files/directories                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   zfirewall       Manage AI firewall                      \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                                                                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m \x1b[1;32mNETWORK\x1b[0m                                                      \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   znet status     Network interface status                 \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   znet scan       Network port scanner                     \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   znet trace      Traceroute to host                       \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   znet dns        DNS lookup tool                          \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   znet monitor    Real-time network monitor                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                                                                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m \x1b[1;32mPACKAGES\x1b[0m                                                     \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   zpkg list       List available packages                  \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   zpkg install    Install packages                         \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   zpkg remove     Remove packages                          \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   zpkg update     Update all packages                      \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   zpkg search     Search packages                          \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                                                                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m \x1b[1;32mPROCESSES & SERVICES\x1b[0m                                        \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   zps             Advanced process viewer                  \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   zservice        Manage system services                   \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   zkill           Kill processes with AI prioritization    \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                                                                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m \x1b[1;32mZ-SCRIPT\x1b[0m                                                     \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   zrun            Execute Z-Script programs                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   zcompile        Compile Z-Script to bytecode             \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   zdebug          Debug Z-Script programs                  \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                                                                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m \x1b[1;32mPOWER USER\x1b[0m                                                   \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   alias           Create command aliases                   \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   export          Set environment variables                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   zhistory        Enhanced command history                 \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   ztour           Interactive Z-OS tour                    \x1b[1;36m║\x1b[0m
\x1b[1;36m╚════════════════════════════════════════════════════════════════╝\x1b[0m` }
      }
      return { output: `\x1b[1;36m╔════════════════════════════════════════════════════════════════╗\x1b[0m
\x1b[1;36m║          \x1b[1;33mZ-OS 3.0 Quantum - Command Reference\x1b[1;36m                      ║\x1b[0m
\x1b[1;36m╠════════════════════════════════════════════════════════════════╣\x1b[0m
\x1b[1;36m║\x1b[0m                                                                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m \x1b[1;32mNavigation & Files\x1b[0m                                            \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[33mls\x1b[0m [\x1b[36m-la\x1b[0m] [\x1b[36mpath\x1b[0m]    List directory contents              \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[33mcd\x1b[0m [\x1b[36mpath\x1b[0m]           Change directory                     \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[33mpwd\x1b[0m                  Print working directory              \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[33mcat\x1b[0m [\x1b[36mfile\x1b[0m]          Display file contents                 \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[33mmkdir\x1b[0m [\x1b[36mdir\x1b[0m]         Create directory                      \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[33mtouch\x1b[0m [\x1b[36mfile\x1b[0m]        Create empty file                     \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[33mrm\x1b[0m [\x1b[36m-rf\x1b[0m] [\x1b[36mtarget\x1b[0m]   Remove file/directory                 \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[33mcp\x1b[0m [\x1b[36msrc\x1b[0m] [\x1b[36mdst\x1b[0m]     Copy files                            \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[33mmv\x1b[0m [\x1b[36msrc\x1b[0m] [\x1b[36mdst\x1b[0m]     Move/rename files                     \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[33mfind\x1b[0m [\x1b[36mpath\x1b[0m] [\x1b[36mname\x1b[0m]   Search for files                      \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[33mgrep\x1b[0m [\x1b[36mpattern\x1b[0m] [\x1b[36mfile\x1b[0m] Search text in files                  \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[33mchmod\x1b[0m [\x1b[36mperms\x1b[0m] [\x1b[36mfile\x1b[0m] Change file permissions               \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                                                                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m \x1b[1;32mSystem Information\x1b[0m                                             \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[33muname\x1b[0m [\x1b[36m-a\x1b[0m]           System information                    \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[33mwhoami\x1b[0m               Current user                          \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[33mhostname\x1b[0m             System hostname                       \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[33mdate\x1b[0m                  Current date/time                     \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[33muptime\x1b[0m               System uptime                         \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[33mneofetch\x1b[0m             System info with ASCII art            \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[33mfree\x1b[0m [\x1b[36m-h\x1b[0m]           Memory usage                          \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[33mdf\x1b[0m [\x1b[36m-h\x1b[0m]            Disk space usage                      \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[33mps\x1b[0m [\x1b[36maux\x1b[0m]            Process list                          \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[33mtop\x1b[0m                  System resources                      \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                                                                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m \x1b[1;32mZ-OS Exclusive Commands\x1b[0m                                        \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[33mzsysinfo\x1b[0m             Full Z-OS system report               \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[33mzsec scan\x1b[0m            Security vulnerability scan            \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[33mzfirewall\x1b[0m            AI firewall management                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[33mznet status\x1b[0m          Network status                        \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[33mzpkg list\x1b[0m            Package manager                       \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[33mzservice\x1b[0m             Service management                    \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[33mztour\x1b[0m               Interactive Z-OS tour                  \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                                                                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m \x1b[1;32mOther\x1b[0m                                                          \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[33mecho\x1b[0m [\x1b[36mtext\x1b[0m]          Print text                            \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[33mclear\x1b[0m                Clear terminal                        \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[33mexit\x1b[0m                Disconnect                            \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[33mhelp -a\x1b[0m              Advanced commands                     \x1b[1;36m║\x1b[0m
\x1b[1;36m╚════════════════════════════════════════════════════════════════╝\x1b[0m` }
    }

    case 'ls': {
      const showHidden = args.includes('-a') || args.includes('-la') || args.includes('-al')
      const longFormat = args.includes('-l') || args.includes('-la') || args.includes('-al')
      const targetPath = args.find(a => !a.startsWith('-')) || session.cwd
      const resolvedPath = resolvePath(targetPath, session.cwd)
      const node = getNodeAtPath(resolvedPath)

      if (!node) return { output: `\x1b[31mls: cannot access '${targetPath}': No such file or directory\x1b[0m` }
      if (node.type !== 'directory') return { output: node.name }

      const entries = Array.from(node.children!.values())
        .filter(e => showHidden || !e.name.startsWith('.'))

      if (entries.length === 0) return { output: '' }

      if (longFormat) {
        const lines = entries.map(e => {
          const color = e.type === 'directory' ? '\x1b[1;34m' : e.type === 'symlink' ? '\x1b[1;36m' : e.permissions.includes('x') ? '\x1b[1;32m' : '\x1b[0m'
          const suffix = e.type === 'directory' ? '/' : e.type === 'symlink' ? ` -> ${e.target}` : ''
          const date = e.modified.toISOString().split('T')[0]
          return `${e.permissions} 1 ${e.owner.padEnd(6)} ${e.group.padEnd(6)} ${String(e.size).padStart(8)} ${date} ${color}${e.name}${suffix}\x1b[0m`
        })
        lines.unshift(`total ${entries.length}`)
        return { output: lines.join('\n') }
      }

      return { output: entries.map(e => {
        const color = e.type === 'directory' ? '\x1b[1;34m' : e.type === 'symlink' ? '\x1b[1;36m' : e.permissions.includes('x') ? '\x1b[1;32m' : ''
        const suffix = e.type === 'directory' ? '/' : e.type === 'symlink' ? '@' : ''
        return `${color}${e.name}${suffix}\x1b[0m`
      }).join('  ') }
    }

    case 'cd': {
      const target = args[0] || '/home/z-user'
      const newPath = resolvePath(target, session.cwd)
      const node = getNodeAtPath(newPath)
      if (!node || node.type !== 'directory') {
        return { output: `\x1b[31mcd: no such file or directory: ${target}\x1b[0m` }
      }
      return { output: '', cwd: newPath }
    }

    case 'pwd':
      return { output: session.cwd }

    case 'cat': {
      if (!args[0]) return { output: '\x1b[31mcat: missing operand\x1b[0m' }
      const filePath = resolvePath(args[0], session.cwd)
      const node = getNodeAtPath(filePath)
      if (!node) return { output: `\x1b[31mcat: ${args[0]}: No such file or directory\x1b[0m` }
      if (node.type === 'directory') return { output: `\x1b[31mcat: ${args[0]}: Is a directory\x1b[0m` }
      if (node.encrypted) return { output: `\x1b[33mcat: ${args[0]}: File is encrypted. Use 'zsec decrypt' first.\x1b[0m` }
      return { output: node.content || '' }
    }

    case 'echo':
      return { output: args.join(' ').replace(/^["']|["']$/g, '') }

    case 'mkdir': {
      if (!args[0]) return { output: '\x1b[31mmkdir: missing operand\x1b[0m' }
      const dirPath = resolvePath(args[0], session.cwd)
      const { parent, name } = getParentAndName(dirPath)
      if (!parent || !parent.children) return { output: `\x1b[31mmkdir: cannot create directory '${args[0]}': No such file or directory\x1b[0m` }
      if (parent.children.has(name)) return { output: `\x1b[31mmkdir: cannot create directory '${args[0]}': File exists\x1b[0m` }
      parent.children.set(name, createDir(name, 'drwxr-xr-x', session.username, session.username))
      return { output: '' }
    }

    case 'touch': {
      if (!args[0]) return { output: '\x1b[31mtouch: missing operand\x1b[0m' }
      const filePath = resolvePath(args[0], session.cwd)
      const { parent, name } = getParentAndName(filePath)
      if (!parent || !parent.children) return { output: `\x1b[31mtouch: cannot touch '${args[0]}': No such file or directory\x1b[0m` }
      if (!parent.children.has(name)) {
        parent.children.set(name, createFile(name, '-rw-r--r--', session.username, session.username))
      } else {
        parent.children.get(name)!.modified = new Date()
      }
      return { output: '' }
    }

    case 'rm': {
      const force = args.includes('-r') || args.includes('-rf') || args.includes('-fr')
      const target = args.find(a => !a.startsWith('-'))
      if (!target) return { output: '\x1b[31mrm: missing operand\x1b[0m' }
      const targetPath = resolvePath(target, session.cwd)
      const { parent, name } = getParentAndName(targetPath)
      if (!parent || !parent.children || !parent.children.has(name)) {
        return { output: `\x1b[31mrm: cannot remove '${target}': No such file or directory\x1b[0m` }
      }
      const node = parent.children.get(name)!
      if (node.type === 'directory' && !force) {
        return { output: `\x1b[31mrm: cannot remove '${target}': Is a directory (use -r)\x1b[0m` }
      }
      parent.children.delete(name)
      return { output: '' }
    }

    case 'cp': {
      if (args.length < 2) return { output: '\x1b[31mcp: missing operand\x1b[0m' }
      const srcPath = resolvePath(args[0], session.cwd)
      const srcNode = getNodeAtPath(srcPath)
      if (!srcNode) return { output: `\x1b[31mcp: cannot stat '${args[0]}': No such file or directory\x1b[0m` }
      const dstPath = resolvePath(args[1], session.cwd)
      const { parent, name } = getParentAndName(dstPath)
      if (!parent || !parent.children) return { output: `\x1b[31mcp: cannot create '${args[1]}'\x1b[0m` }
      const copy = { ...srcNode, name, modified: new Date() }
      if (copy.children) copy.children = new Map(copy.children)
      parent.children.set(name, copy)
      return { output: '' }
    }

    case 'mv': {
      if (args.length < 2) return { output: `\x1b[31mmv: missing operand\x1b[0m` }
      const srcPath = resolvePath(args[0], session.cwd)
      const srcParent = getParentAndName(srcPath)
      if (!srcParent.parent || !srcParent.parent.children || !srcParent.parent.children.has(srcParent.name)) {
        return { output: `\x1b[31mmv: cannot stat '${args[0]}'\x1b[0m` }
      }
      const node = srcParent.parent.children.get(srcParent.name)!
      srcParent.parent.children.delete(srcParent.name)
      const dstPath = resolvePath(args[1], session.cwd)
      const dstParent = getParentAndName(dstPath)
      if (!dstParent.parent || !dstParent.parent.children) return { output: `\x1b[31mmv: cannot move to '${args[1]}'\x1b[0m` }
      node.name = dstParent.name
      node.modified = new Date()
      dstParent.parent.children.set(dstParent.name, node)
      return { output: '' }
    }

    case 'find': {
      const searchPath = args[0] || session.cwd
      const namePattern = args.indexOf('-name') >= 0 ? args[args.indexOf('-name') + 1] : null
      const resolvedPath = resolvePath(searchPath, session.cwd)
      const results: string[] = []

      function walk(node: FileSystemNode, currentPath: string) {
        if (namePattern) {
          const regex = new RegExp(namePattern.replace(/\*/g, '.*').replace(/\?/g, '.'))
          if (regex.test(node.name)) results.push(currentPath)
        } else {
          results.push(currentPath)
        }
        if (node.children) {
          for (const [name, child] of node.children) {
            walk(child, currentPath + '/' + name)
          }
        }
      }

      const rootNode = getNodeAtPath(resolvedPath)
      if (!rootNode) return { output: `\x1b[31mfind: '${searchPath}': No such file or directory\x1b[0m` }
      walk(rootNode, resolvedPath)
      return { output: results.join('\n') }
    }

    case 'grep': {
      if (args.length < 2) return { output: '\x1b[31mgrep: missing arguments\x1b[0m' }
      const pattern = args[0]
      const filePath = resolvePath(args[1], session.cwd)
      const node = getNodeAtPath(filePath)
      if (!node || node.type === 'directory') return { output: `\x1b[31mgrep: ${args[1]}: No such file\x1b[0m` }
      const content = node.content || ''
      const lines = content.split('\n').filter(l => l.includes(pattern))
      return { output: lines.map(l => l.replace(new RegExp(pattern, 'g'), `\x1b[1;31m${pattern}\x1b[0m`)).join('\n') }
    }

    case 'chmod': {
      if (args.length < 2) return { output: '\x1b[31mchmod: missing operand\x1b[0m' }
      const filePath = resolvePath(args[1], session.cwd)
      const node = getNodeAtPath(filePath)
      if (!node) return { output: `\x1b[31mchmod: cannot access '${args[1]}'\x1b[0m` }
      node.permissions = args[0].startsWith('-') ? args[0] : '-' + args[0]
      return { output: '' }
    }

    case 'whoami':
      return { output: session.username }

    case 'hostname':
      return { output: session.hostname }

    case 'uname': {
      if (args.includes('-a')) {
        return { output: `Z-OS z-mainframe 6.2.0-z-quantum #1 SMP PREEMPT_DYNAMIC x86_64 Quantum/Z GNU/Z-OS` }
      }
      if (args.includes('-r')) return { output: '6.2.0-z-quantum' }
      return { output: 'Z-OS' }
    }

    case 'date':
      return { output: new Date().toString() }

    case 'uptime': {
      const m = getSystemMetrics()
      return { output: ` ${new Date().toLocaleTimeString()} up ${Math.floor(m.uptime/3600)}:${String(Math.floor((m.uptime%3600)/60)).padStart(2,'0')}, ${sessions.size} users, load average: ${m.loadAvg.join(', ')}` }
    }

    case 'free': {
      const m = getSystemMetrics()
      if (args.includes('-h')) {
        return { output: `              total        used        free      shared  buff/cache   available
Mem:          16Gi       ${Math.floor(m.memUsed/1024)}Gi       ${Math.floor((m.memTotal-m.memUsed)/1024)}Gi       128Mi       2.0Gi        ${Math.floor((m.memTotal-m.memUsed+2048)/1024)}Gi
Swap:         8.0Gi         0Bi       8.0Gi` }
      }
      return { output: `              total        used        free      shared  buff/cache   available
Mem:        16777216     ${Math.floor(m.memUsed*1024)}   ${Math.floor((m.memTotal-m.memUsed)*1024)}      131072     2097152    ${Math.floor((m.memTotal-m.memUsed+2048)*1024)}
Swap:        8388608           0     8388608` }
    }

    case 'df': {
      if (args.includes('-h')) {
        return { output: `Filesystem      Size  Used Avail Use% Mounted on
/dev/zroot       64G  8.2G   52G  14% /
/dev/zroot/home  32G  2.1G   29G   7% /home
tmpfs           2.0G     0  2.0G   0% /tmp
/dev/zroot/var  16G  980M   14G   7% /var` }
      }
      return { output: `Filesystem     1K-blocks    Used Available Use% Mounted on
/dev/zroot      67108864 8598324 55243540  14% /
/dev/zroot/home 33554432 2202008 29724424   7% /home
tmpfs            2097152       0   2097152   0% /tmp
/dev/zroot/var  16777216  998400  14788816   7% /var` }
    }

    case 'ps': {
      if (args.includes('aux') || args.includes('-ef')) {
        const procs = generateProcesses()
        return { output: `USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
${procs.map(p => `${p.user.padEnd(8)} ${String(p.pid).padStart(5)} ${p.cpu.toFixed(1).padStart(4)} ${p.memory.toFixed(1).padStart(4)} ${String(Math.floor(Math.random()*500000)).padStart(7)} ${String(Math.floor(Math.random()*50000)).padStart(6)} pts/0    ${p.status === 'running' ? 'Ssl' : 'S'}   ${new Date(p.startTime*1000).toLocaleTimeString().slice(0,5)}   0:${String(Math.floor(Math.random()*59)).padStart(2)}.${String(Math.floor(Math.random()*99)).padStart(2)} ${p.cmd}`).join('\n')}` }
      }
      return { output: `  PID TTY          TIME CMD
    1 pts/0    00:00:02 z-init
  142 pts/0    00:00:00 zsh
  389 pts/0    00:00:01 ps` }
    }

    case 'top': {
      const m = getSystemMetrics()
      return { output: `\x1b[1;36mtop - ${new Date().toLocaleTimeString()} up ${Math.floor(m.uptime/3600)}:${String(Math.floor((m.uptime%3600)/60)).padStart(2,'0')}, ${sessions.size} users, load average: ${m.loadAvg.join(', ')}\x1b[0m
Tasks: \x1b[32m${m.processes} total\x1b[0m, ${Math.floor(Math.random()*3)+1} running, ${m.processes-2} sleeping, 0 stopped, 0 zombie
%Cpu(s): \x1b[32m${m.cpuUsage.toFixed(1)}% us\x1b[0m, ${(Math.random()*3).toFixed(1)}% sy, 0.0% ni, ${(100-m.cpuUsage-3).toFixed(1)}% id
MiB Mem:  16384.0 total,  ${(m.memTotal-m.memUsed)/1024*4|0}.0 free,  ${m.memUsed/1024*4|0}.0 used,   2048.0 buff/cache
MiB Swap:  8192.0 total,   8192.0 free,      0.0 used.  ${(m.memTotal-m.memUsed+2048)/1024*4|0}.0 avail Mem

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
    1 root      20   0  102340  12480   8960 S   0.0   0.1   0:02.45 z-init
    2 root      20   0   24560   8420   6240 S   0.3   0.0   0:01.23 z-kernel-guard
    3 root      20   0   18240   5120   4096 S   0.0   0.0   0:00.34 z-firewall
    4 root      20   0   30720   6144   5120 S   0.1   0.0   0:00.56 z-netmanager
    5 root      -2   0   40960  10240   8192 S   0.0   0.1   0:00.12 z-quantum-crypto
    6 root      20   0   65536  25600  20480 S   0.2   0.2   0:01.89 z-ai-detect
    7 root      20   0   12800   3072   2560 S   0.0   0.0   0:00.08 z-auditd
   10 www-data  20   0   24560   8420   6240 S   0.0   0.0   0:00.23 nginx
  142 z-user    20   0   10240   4120   3200 S   0.0   0.0   0:00.12 zsh` }
    }

    case 'neofetch': {
      const m = getSystemMetrics()
      return { output: `\x1b[1;32m        ╔══════════════╗\x1b[0m       \x1b[1;33m${session.username}@${session.hostname}\x1b[0m
\x1b[1;32m        ║  ╔══╗  ╔══╗  ║\x1b[0m       \x1b[1;33m──────────────────────────\x1b[0m
\x1b[1;32m        ║  ║ Z║  ║OS║  ║\x1b[0m       \x1b[1;33mOS:\x1b[0m Z-OS 3.0 Quantum x86_64
\x1b[1;32m        ║  ╚══╝  ╚══╝  ║\x1b[0m       \x1b[1;33mHost:\x1b[0m Z-Cloud Quantum Instance
\x1b[1;32m        ║  ╔════════╗  ║\x1b[0m       \x1b[1;33mKernel:\x1b[0m 6.2.0-z-quantum
\x1b[1;32m        ║  ║QUANTUM║  ║\x1b[0m       \x1b[1;33mUptime:\x1b[0m ${Math.floor(m.uptime/3600)} hours, ${Math.floor((m.uptime%3600)/60)} mins
\x1b[1;32m        ║  ╚════════╝  ║\x1b[0m       \x1b[1;33mCPU:\x1b[0m Z-Quantum vCPU (4) @ 4.2GHz
\x1b[1;32m        ║  ╔══╗╔══╗╔══╗║\x1b[0m       \x1b[1;33mMemory:\x1b[0m ${Math.floor(m.memUsed/1024*4)}MiB / 16384MiB
\x1b[1;32m        ║  ║01║║10║║11║║\x1b[0m       \x1b[1;33mDisk:\x1b[0m ${m.diskUsed}G / ${m.diskTotal}G (${Math.floor(m.diskUsed/m.diskTotal*100)}%)
\x1b[1;32m        ║  ╚══╝╚══╝╚══╝║\x1b[0m       \x1b[1;33mNetwork:\x1b[0m z0 (10 Gbps)
\x1b[1;32m        ╚══════════════╝\x1b[0m       \x1b[1;33mSecurity:\x1b[0m \x1b[32mPARANOID (max hardening)\x1b[0m
                                  \x1b[1;33mFirewall:\x1b[0m \x1b[32mAI-Powered (247 rules active)\x1b[0m
                                  \x1b[1;33mThreats blocked:\x1b[0m \x1b[31m${m.blockedIPs} IPs\x1b[0m
                                  \x1b[1;33mEncryption:\x1b[0m AES-256-GCM + Quantum-safe
                                  \x1b[1;33mShell:\x1b[0m zsh 5.9
                                  \x1b[1;33mResolution:\x1b[0m ${args.includes('-r') ? '3840x2160' : 'terminal'}
                                  \x1b[1;33mPackages:\x1b[0m 42000 (zpkg)
                                  \x1b[1;33mSession:\x1b[0m ${session.id.slice(0,8)}` }
    }

    // ═══════════════════════════════
    // Z-OS EXCLUSIVE COMMANDS
    // ═══════════════════════════════

    case 'zsysinfo': {
      const m = getSystemMetrics()
      return { output: `\x1b[1;36m╔════════════════════════════════════════════════════════════════════╗\x1b[0m
\x1b[1;36m║               \x1b[1;33mZ-OS 3.0 Quantum - System Report\x1b[1;36m                          ║\x1b[0m
\x1b[1;36m╠════════════════════════════════════════════════════════════════════╣\x1b[0m
\x1b[1;36m║\x1b[0m \x1b[1;34mSYSTEM\x1b[0m                                                            \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   Kernel:     6.2.0-z-quantum (PREEMPT_DYNAMIC)                   \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   Arch:       x86_64 (Quantum/Z)                                 \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   Uptime:     ${Math.floor(m.uptime/3600)}h ${Math.floor((m.uptime%3600)/60)}m                                         \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   Load:       ${m.loadAvg.join(', ')}                                  \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   Processes:  ${m.processes} (${m.threads} threads)                               \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                                                                   \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m \x1b[1;34mRESOURCES\x1b[0m                                                        \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   CPU:        Z-Quantum vCPU (4 cores) @ 4.2GHz                  \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   CPU Usage:  ${m.cpuUsage.toFixed(1)}%                                          \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   Memory:     ${Math.floor(m.memUsed/1024*4)}MiB / 16384MiB (${(m.memUsed/m.memTotal*100).toFixed(1)}%)                     \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   Disk:       ${m.diskUsed}G / ${m.diskTotal}G (${Math.floor(m.diskUsed/m.diskTotal*100)}%)                             \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   Network:    RX: ${(m.netRx/1024/1024).toFixed(1)}MB / TX: ${(m.netTx/1024/1024).toFixed(1)}MB                  \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                                                                   \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m \x1b[1;34mSECURITY\x1b[0m                                                        \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   Level:      \x1b[32mPARANOID\x1b[0m (Maximum Hardening)                        \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   Firewall:   \x1b[32mActive\x1b[0m (247 rules, AI-powered)                    \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   Blocked:    \x1b[31m${m.blockedIPs} IPs\x1b[0m                                          \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   Encryption: \x1b[32mAES-256-GCM + Kyber-1024\x1b[0m (Quantum-safe)              \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   ASLR:       Full + Randomized Stack                            \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   Threats:    ${m.threats === 0 ? '\x1b[32m0 active threats\x1b[0m' : `\x1b[31m${m.threats} active threats\x1b[0m`}                              \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                                                                   \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m \x1b[1;34mZ-OS ADVANTAGES OVER LINUX\x1b[0m                                      \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   + AI-powered process scheduling (40% faster context switches)    \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   + Quantum-resistant encryption by default                        \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   + Self-healing ZFS filesystem with auto-repair                   \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   + Zero-trust architecture at kernel level                        \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   + Real-time kernel patching (no reboot needed)                   \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   + AI threat detection with 99.97% accuracy                       \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   + Memory deduplication (saves up to 30% RAM)                     \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   + nanosecond-resolution process scheduling                        \x1b[1;36m║\x1b[0m
\x1b[1;36m╚════════════════════════════════════════════════════════════════════╝\x1b[0m` }
    }

    case 'zsec': {
      if (args[0] === 'scan') {
        const vulns = vulnerabilityDB
        const critical = vulns.filter(v => v.severity === 'critical').length
        const high = vulns.filter(v => v.severity === 'high').length
        const medium = vulns.filter(v => v.severity === 'medium').length
        const low = vulns.filter(v => v.severity === 'low').length
        const patched = vulns.filter(v => v.status === 'patched').length
        const open = vulns.filter(v => v.status === 'open').length

        return { output: `\x1b[1;36m╔════════════════════════════════════════════════════════════════╗\x1b[0m
\x1b[1;36m║           \x1b[1;31mZ-OS Security Vulnerability Scan Report\x1b[1;36m                    ║\x1b[0m
\x1b[1;36m╠════════════════════════════════════════════════════════════════╣\x1b[0m
\x1b[1;36m║\x1b[0m                                                                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  \x1b[1;33mScan Summary:\x1b[0m                                                  \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m    Total vulnerabilities found: ${vulns.length}                              \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m    \x1b[31mCritical: ${critical}\x1b[0m  \x1b[33mHigh: ${high}\x1b[0m  \x1b[36mMedium: ${medium}\x1b[0m  \x1b[32mLow: ${low}\x1b[0m                    \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m    \x1b[32mPatched: ${patched}\x1b[0m  \x1b[31mOpen: ${open}\x1b[0m                                     \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                                                                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  \x1b[1;33mVulnerability Details:\x1b[0m                                         \x1b[1;36m║\x1b[0m
${vulns.map(v => {
  const sevColor = v.severity === 'critical' ? '\x1b[1;31m' : v.severity === 'high' ? '\x1b[33m' : v.severity === 'medium' ? '\x1b[36m' : v.severity === 'low' ? '\x1b[32m' : '\x1b[0m'
  const statusIcon = v.status === 'patched' ? '\x1b[32m[PATCHED]\x1b[0m' : v.status === 'open' ? '\x1b[31m[OPEN]\x1b[0m' : '\x1b[33m[IGNORED]\x1b[0m'
  return `\x1b[1;36m║\x1b[0m  ${sevColor}[${v.severity.toUpperCase().padEnd(8)}]\x1b[0m ${v.id} - ${v.title.slice(0,32).padEnd(34)}\x1b[1;36m║\x1b[0m\n\x1b[1;36m║\x1b[0m           ${statusIcon} ${v.affected.padEnd(40)}\x1b[1;36m║\x1b[0m`
}).join('\n')}
\x1b[1;36m║\x1b[0m                                                                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  \x1b[1;33mRecommendation:\x1b[0m Run \x1b[36mzsec harden\x1b[0m to apply security patches        \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                     Run \x1b[36mzpkg update\x1b[0m to update vulnerable packages       \x1b[1;36m║\x1b[0m
\x1b[1;36m╚════════════════════════════════════════════════════════════════╝\x1b[0m` }
      }
      if (args[0] === 'harden') {
        return { output: `\x1b[1;36m╔════════════════════════════════════════════════════════════════╗\x1b[0m
\x1b[1;36m║              \x1b[1;32mZ-OS Security Hardening - In Progress\x1b[1;36m                       ║\x1b[0m
\x1b[1;36m╠════════════════════════════════════════════════════════════════╣\x1b[0m
\x1b[1;36m║\x1b[0m  \x1b[32m✓\x1b[0m Enabling ASLR with full randomization...                      \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  \x1b[32m✓\x1b[0m Activating NX bit on all memory segments...                   \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  \x1b[32m✓\x1b[0m Enabling Stack Smashing Protector (SSP) - strong mode...      \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  \x1b[32m✓\x1b[0m Enabling FORTIFY_SOURCE=2 on all binaries...                   \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  \x1b[32m✓\x1b[0m Enabling PIE (Position Independent Executables)...              \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  \x1b[32m✓\x1b[0m Enabling full RELRO (RELocation Read-Only)...                   \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  \x1b[32m✓\x1b[0m Enabling SECCOMP strict mode...                                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  \x1b[32m✓\x1b[0m Enabling AppArmor profiles for all services...                  \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  \x1b[32m✓\x1b[0m Rotating encryption keys...                                     \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  \x1b[32m✓\x1b[0m Patching ZVE-2026-001 (Kernel Privilege Escalation)...         \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  \x1b[32m✓\x1b[0m Patching ZVE-2026-003 (SSH Key Confusion)...                   \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  \x1b[32m✓\x1b[0m Patching ZVE-2026-005 (/proc info leak)...                     \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  \x1b[32m✓\x1b[0m Patching ZVE-2026-007 (Package Signature Bypass)...            \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  \x1b[32m✓\x1b[0m Disabling unnecessary kernel modules...                        \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  \x1b[32m✓\x1b[0m Setting kernel.unprivileged_bpf_disabled=1...                  \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  \x1b[32m✓\x1b[0m Setting kernel.kptr_restrict=2...                               \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  \x1b[32m✓\x1b[0m Setting kernel.dmesg_restrict=1...                              \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  \x1b[32m✓\x1b[0m Enabling AI threat detection auto-response...                  \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                                                                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  \x1b[1;32mHardening Complete! Security Score: 98/100\x1b[0m                       \x1b[1;36m║\x1b[0m
\x1b[1;36m╚════════════════════════════════════════════════════════════════╝\x1b[0m` }
      }
      if (args[0] === 'audit') {
        return { output: `\x1b[1;36mZ-OS Security Audit Log\x1b[0m
────────────────────────────────────────────────────────
\x1b[32m[2026-06-22 10:00:01]\x1b[0m System boot - All security modules loaded
\x1b[32m[2026-06-22 10:00:02]\x1b[0m z-kernel-guard: Monitoring 342 syscalls
\x1b[32m[2026-06-22 10:00:03]\x1b[0m z-firewall: 247 rules loaded, AI-model active
\x1b[32m[2026-06-22 10:00:04]\x1b[0m z-quantum-crypto: AES-256-GCM keys rotated
\x1b[33m[2026-06-22 10:15:22]\x1b[0m z-ai-detect: Anomalous connection from 185.220.101.42
\x1b[31m[2026-06-22 10:15:23]\x1b[0m z-firewall: BLOCKED 185.220.101.42 (Tor exit node)
\x1b[32m[2026-06-22 10:30:45]\x1b[0m z-auditd: Privileged operation by root (apt update)
\x1b[33m[2026-06-22 11:02:11]\x1b[0m z-ai-detect: Port scan detected from 45.33.32.156
\x1b[31m[2026-06-22 11:02:12]\x1b[0m z-firewall: BLOCKED 45.33.32.156 (port scanner)
\x1b[32m[2026-06-22 11:30:00]\x1b[0m z-quantum-crypto: Key rotation scheduled in 12h
\x1b[32m[2026-06-22 12:00:00]\x1b[0m z-fs-monitor: ZFS scrub completed - 0 errors
\x1b[33m[2026-06-22 12:15:33]\x1b[0m z-ai-detect: Brute force attempt on SSH from 103.21.244.0/24
\x1b[31m[2026-06-22 12:15:34]\x1b[0m z-firewall: BLOCKED 103.21.244.0/24 (brute force)
\x1b[32m[2026-06-22 12:45:00]\x1b[0m z-kernel-guard: Kernel integrity check passed` }
      }
      if (args[0] === 'encrypt') {
        if (!args[1]) return { output: '\x1b[31mzsec encrypt: missing filename\x1b[0m' }
        const filePath = resolvePath(args[1], session.cwd)
        const node = getNodeAtPath(filePath)
        if (!node) return { output: `\x1b[31mzsec encrypt: ${args[1]}: No such file\x1b[0m` }
        node.encrypted = true
        node.content = Buffer.from(node.content || '').toString('base64')
        return { output: `\x1b[32mFile '${args[1]}' encrypted with AES-256-GCM\x1b[0m` }
      }
      if (args[0] === 'decrypt') {
        if (!args[1]) return { output: '\x1b[31mzsec decrypt: missing filename\x1b[0m' }
        const filePath = resolvePath(args[1], session.cwd)
        const node = getNodeAtPath(filePath)
        if (!node) return { output: `\x1b[31mzsec decrypt: ${args[1]}: No such file\x1b[0m` }
        if (!node.encrypted) return { output: `\x1b[33mzsec decrypt: ${args[1]}: File is not encrypted\x1b[0m` }
        node.encrypted = false
        try { node.content = Buffer.from(node.content || '', 'base64').toString('utf8') } catch {}
        return { output: `\x1b[32mFile '${args[1]}' decrypted successfully\x1b[0m` }
      }
      return { output: `\x1b[33mUsage: zsec [scan|harden|audit|encrypt|decrypt] [args]\x1b[0m` }
    }

    case 'zfirewall': {
      if (args[0] === 'status' || args.length === 0) {
        return { output: `\x1b[1;36mZ-Firewall Status - AI-Powered Next-Gen Firewall\x1b[0m
────────────────────────────────────────────────────────
Status:         \x1b[32mACTIVE\x1b[0m
Policy:         \x1b[33mDEFAULT DENY\x1b[0m
AI Engine:      \x1b[32mOnline\x1b[0m (z-threat-v3)
Rules:          ${firewallRules.length} total, ${firewallRules.filter(r => r.enabled).length} active
Blocked IPs:    12 entries
Log Hits:       ${firewallRules.reduce((a, r) => a + r.logHits, 0).toLocaleString()} total

\x1b[1;33mActive Rules:\x1b[0m
${firewallRules.filter(r => r.enabled).map(r =>
  `  ${r.action === 'allow' ? '\x1b[32mALLOW' : r.action === 'deny' ? '\x1b[31mDENY ' : '\x1b[33mREDIR'}\x1b[0m ${r.direction.padEnd(4)} ${r.protocol.padEnd(4)} ${r.source.padEnd(16)} -> ${r.destination.padEnd(16)} :${r.port} [${r.logHits} hits]`
).join('\n')}

\x1b[1;33mDisabled Rules:\x1b[0m
${firewallRules.filter(r => !r.enabled).map(r =>
  `  \x1b[90m${r.action.toUpperCase().padEnd(5)} ${r.direction.padEnd(4)} ${r.protocol.padEnd(4)} ${r.source.padEnd(16)} -> ${r.destination.padEnd(16)} :${r.port}\x1b[0m`
).join('\n')}` }
      }
      if (args[0] === 'block' && args[1]) {
        return { output: `\x1b[31mBlocked IP: ${args[1]}\x1b[0m - Rule added to firewall` }
      }
      if (args[0] === 'allow' && args[1]) {
        return { output: `\x1b[32mAllowed IP: ${args[1]}\x1b[0m - Rule added to firewall` }
      }
      return { output: `\x1b[33mUsage: zfirewall [status|block|allow] [ip/port]\x1b[0m` }
    }

    case 'znet': {
      if (args[0] === 'status' || args.length === 0) {
        return { output: `\x1b[1;36mZ-Network Status\x1b[0m
────────────────────────────────────────────────────────
${networkInterfaces.map(i =>
  `${i.status === 'up' ? '\x1b[32m▲' : '\x1b[31m▼'} ${i.name.padEnd(10)} ${i.ip.padEnd(16)} ${i.mac.padEnd(19)} ${i.speed.padEnd(8)} ${i.type}\x1b[0m\n  RX: ${(i.rxBytes/1024/1024).toFixed(1)} MB  TX: ${(i.txBytes/1024/1024).toFixed(1)} MB`
).join('\n\n')}

DNS: 1.1.1.1, 8.8.8.8 (DoH enabled, DNSSEC validating)
Gateway: 10.0.0.254` }
      }
      if (args[0] === 'scan') {
        const target = args[1] || 'localhost'
        return { output: `\x1b[1;36mZ-Network Port Scan: ${target}\x1b[0m
────────────────────────────────────────────────────────
Port     State     Service         Version
22/tcp   \x1b[32mopen\x1b[0m      ssh             Z-OpenSSH 9.8p1
80/tcp   \x1b[32mopen\x1b[0m      http            nginx 1.27.0
443/tcp  \x1b[32mopen\x1b[0m      https           nginx 1.27.0
3000/tcp \x1b[32mopen\x1b[0m      z-desktop       Z-Desktop 3.0
3306/tcp \x1b[33mfiltered\x1b[0m  mysql           (firewall)
5432/tcp \x1b[31mclosed\x1b[0m    postgresql
8080/tcp \x1b[32mopen\x1b[0m      z-proxy         Z-Proxy 1.0
9090/tcp \x1b[33mfiltered\x1b[0m  z-admin         (firewall)

Scan complete: 4 open, 2 filtered, 1 closed` }
      }
      if (args[0] === 'dns') {
        const domain = args[1] || 'z-os.cloud'
        return { output: `\x1b[1;36mDNS Lookup: ${domain}\x1b[0m
────────────────────────────────────────────────────────
Question:    ${domain} IN A
Answer:      ${domain} 300 IN A 93.184.216.34
Authority:   ${domain} 3600 IN NS ns1.z-os.cloud
Additional:  ns1.z-os.cloud 3600 IN A 93.184.216.1
DNSSEC:      \x1b[32mvalidated\x1b[0m (RSASHA256)
DoH:         \x1b[32menabled\x1b[0m (https://dns.z-os.cloud/dns-query)
Query time:  3 ms
Server:      1.1.1.1#53 (Cloudflare)` }
      }
      if (args[0] === 'trace') {
        const target = args[1] || 'z-os.cloud'
        return { output: `\x1b[1;36mTraceroute to ${target}\x1b[0m
────────────────────────────────────────────────────────
 1  _gateway (10.0.0.254)      0.5 ms   0.4 ms   0.3 ms
 2  isp-router.net (72.14.215.85)  1.2 ms   1.1 ms   1.0 ms
 3  core-backbone.net (4.69.210.49)  5.3 ms   5.1 ms   5.2 ms
 4  exchange.nyc.net (206.223.115.1)  12.4 ms  12.2 ms  12.3 ms
 5  cdn-edge.z-os.cloud (93.184.216.1)  11.8 ms  11.6 ms  11.7 ms
 6  ${target} (93.184.216.34)  11.5 ms  11.3 ms  11.4 ms` }
      }
      return { output: `\x1b[33mUsage: znet [status|scan|dns|trace] [target]\x1b[0m` }
    }

    case 'zpkg': {
      if (args[0] === 'list') {
        const installed = packageDB.filter(p => p.installed)
        const available = packageDB.filter(p => !p.installed)
        return { output: `\x1b[1;36mZ-Package Manager - Package List\x1b[0m
────────────────────────────────────────────────────────
\x1b[1;32mInstalled (${installed.length}):\x1b[0m
${installed.map(p => `  \x1b[32m✓\x1b[0m ${p.name.padEnd(18)} ${p.version.padEnd(12)} ${p.description}`).join('\n')}

\x1b[1;33mAvailable (${available.length}):\x1b[0m
${available.map(p => `  ○ ${p.name.padEnd(18)} ${p.version.padEnd(12)} ${p.description}`).join('\n')}

Repository: z-os-quantum | Total packages: 42,000+` }
      }
      if (args[0] === 'install' && args[1]) {
        const pkg = packageDB.find(p => p.name === args[1])
        if (!pkg) return { output: `\x1b[31mzpkg: package '${args[1]}' not found\x1b[0m` }
        if (pkg.installed) return { output: `\x1b[33mzpkg: '${args[1]}' is already installed\x1b[0m` }
        pkg.installed = true
        return { output: `\x1b[32mInstalling ${args[1]}-${pkg.version}...\x1b[0m
Resolving dependencies... done
Downloading... done (${pkg.size})
Verifying signature... \x1b[32mpassed\x1b[0m
Extracting... done
Configuring... done
\x1b[32m${args[1]}-${pkg.version} installed successfully.\x1b[0m` }
      }
      if (args[0] === 'remove' && args[1]) {
        const pkg = packageDB.find(p => p.name === args[1])
        if (!pkg || !pkg.installed) return { output: `\x1b[31mzpkg: '${args[1]}' is not installed\x1b[0m` }
        pkg.installed = false
        return { output: `\x1b[32mRemoving ${args[1]}...\x1b[0m
Stopping services... done
Removing files... done
Cleaning config... done
\x1b[32m${args[1]} removed successfully.\x1b[0m` }
      }
      if (args[0] === 'update') {
        return { output: `\x1b[32mChecking for updates...\x1b[0m
Fetching package lists... done
Calculating upgrade... done
3 packages can be upgraded:
  z-firewall     3.1.1 -> 3.1.2
  z-ai-detect    3.0.0 -> 3.0.1
  nginx          1.26.0 -> 1.27.0
Downloading... done
Upgrading... done
\x1b[32m3 packages upgraded. 0 security vulnerabilities remaining.\x1b[0m` }
      }
      if (args[0] === 'search' && args[1]) {
        const results = packageDB.filter(p => p.name.includes(args[1]) || p.description.toLowerCase().includes(args[1].toLowerCase()))
        if (results.length === 0) return { output: `\x1b[33mNo packages found matching '${args[1]}'\x1b[0m` }
        return { output: results.map(p => `  ${p.installed ? '\x1b[32m✓' : '○'}\x1b[0m ${p.name.padEnd(18)} ${p.version.padEnd(12)} ${p.description}`).join('\n') }
      }
      return { output: `\x1b[33mUsage: zpkg [list|install|remove|update|search] [package]\x1b[0m` }
    }

    case 'zservice': {
      if (args[0] === 'list' || args.length === 0) {
        return { output: `\x1b[1;36mZ-OS Service Manager\x1b[0m
────────────────────────────────────────────────────────
${systemServices.map(s => {
  const statusIcon = s.status === 'active' ? '\x1b[32m●' : s.status === 'failed' ? '\x1b[31m●' : s.status === 'loading' ? '\x1b[33m◎' : '\x1b[90m○'
  return `${statusIcon}\x1b[0m ${s.name.padEnd(18)} ${s.status.padEnd(8)} ${s.type.padEnd(10)} ${s.description}`
}).join('\n')}` }
      }
      if (args[0] === 'start' && args[1]) {
        const svc = systemServices.find(s => s.name === args[1])
        if (!svc) return { output: `\x1b[31mzservice: '${args[1]}' not found\x1b[0m` }
        svc.status = 'active'
        return { output: `\x1b[32mService '${args[1]}' started successfully.\x1b[0m` }
      }
      if (args[0] === 'stop' && args[1]) {
        const svc = systemServices.find(s => s.name === args[1])
        if (!svc) return { output: `\x1b[31mzservice: '${args[1]}' not found\x1b[0m` }
        svc.status = 'inactive'
        return { output: `\x1b[33mService '${args[1]}' stopped.\x1b[0m` }
      }
      if (args[0] === 'restart' && args[1]) {
        const svc = systemServices.find(s => s.name === args[1])
        if (!svc) return { output: `\x1b[31mzservice: '${args[1]}' not found\x1b[0m` }
        svc.status = 'loading'
        setTimeout(() => { svc.status = 'active' }, 1000)
        return { output: `\x1b[33mService '${args[1]}' restarting...\x1b[0m` }
      }
      return { output: `\x1b[33mUsage: zservice [list|start|stop|restart] [service]\x1b[0m` }
    }

    case 'zps': {
      const procs = generateProcesses()
      return { output: `\x1b[1;36mZ-OS Process Viewer (AI-Optimized)\x1b[0m
────────────────────────────────────────────────────────
PID     USER       CPU%   MEM%   STATUS    PRI   THREADS  NAME
${procs.map(p => {
  const statusColor = p.status === 'running' ? '\x1b[32m' : p.status === 'zombie' ? '\x1b[31m' : '\x1b[33m'
  return `${String(p.pid).padStart(5)}   ${p.user.padEnd(8)} ${p.cpu.toFixed(1).padStart(5)}  ${p.memory.toFixed(1).padStart(5)}  ${statusColor}${p.status.padEnd(8)}\x1b[0m ${String(p.priority).padStart(3)}   ${String(p.threads).padStart(7)}  ${p.name}`
}).join('\n')}

Total: ${procs.length} processes, ${procs.reduce((a,p) => a+p.threads, 0)} threads` }
    }

    case 'ztour': {
      return { output: `\x1b[1;36m╔════════════════════════════════════════════════════════════════╗\x1b[0m
\x1b[1;36m║              \x1b[1;33mWelcome to Z-OS Interactive Tour!\x1b[1;36m                        ║\x1b[0m
\x1b[1;36m╠════════════════════════════════════════════════════════════════╣\x1b[0m
\x1b[1;36m║\x1b[0m                                                                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  \x1b[1;32mZ-OS\x1b[0m is a next-generation operating system that surpasses   \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  Linux in every aspect. Here is what makes it superior:       \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                                                                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  \x1b[33m1. AI-Powered Kernel\x1b[0m                                           \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m     The z-kernel uses AI for intelligent process scheduling,    \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m     achieving 40% faster context switches than Linux.           \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                                                                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  \x1b[33m2. Quantum-Resistant Security\x1b[0m                                  \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m     Built-in Kyber-1024 encryption protects against quantum     \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m     computer attacks. Linux still relies on RSA.                 \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                                                                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  \x1b[33m3. Self-Healing Filesystem\x1b[0m                                    \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m     ZFS with AI auto-repair detects and fixes corruption in      \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m     real-time. Linux ext4 has no such capability.                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                                                                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  \x1b[33m4. Zero-Trust Architecture\x1b[0m                                    \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m     Every process is sandboxed at kernel level. Linux relies    \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m     on optional SELinux/AppArmor that most users disable.         \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                                                                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  \x1b[33m5. Real-Time Kernel Patching\x1b[0m                                  \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m     Patch security vulnerabilities without rebooting. Linux     \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m     requires Kernel Live Patching with paid subscriptions.        \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                                                                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  \x1b[33m6. AI Threat Detection\x1b[0m                                        \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m     99.97% accuracy in detecting zero-day attacks. Linux        \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m]     requires separate IDS/IPS installation.                       \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                                                                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  Try these commands to explore:                                  \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m    \x1b[36mzsysinfo\x1b[0m    - Full system information                       \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m    \x1b[36mzsec scan\x1b[0m   - Security vulnerability scan                  \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m    \x1b[36mzfirewall\x1b[0m  - AI firewall management                      \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m    \x1b[36mznet status\x1b[0m - Network interface status                     \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m    \x1b[36mzpkg list\x1b[0m  - Package manager                               \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m    \x1b[36mzservice\x1b[0m   - Service management                           \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m    \x1b[36mzps\x1b[0m        - Advanced process viewer                      \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m    \x1b[36mneofetch\x1b[0m   - System info with ASCII art                   \x1b[1;36m║\x1b[0m
\x1b[1;36m╚════════════════════════════════════════════════════════════════╝\x1b[0m` }
    }

    case 'zbenchmark': {
      return { output: `\x1b[1;36m╔════════════════════════════════════════════════════════════════╗\x1b[0m
\x1b[1;36m║              \x1b[1;33mZ-OS vs Linux Benchmark Results\x1b[1;36m                             ║\x1b[0m
\x1b[1;36m╠════════════════════════════════════════════════════════════════╣\x1b[0m
\x1b[1;36m║\x1b[0m                                                                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  \x1b[1;33mTest                    Z-OS 3.0     Linux 6.5     Winner\x1b[0m       \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  ──────────────────────────────────────────────────────────── \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  Context Switch         \x1b[32m0.8μs\x1b[0m        1.3μs          \x1b[32mZ-OS\x1b[0m       \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  Syscall Latency        \x1b[32m0.15μs\x1b[0m       0.24μs         \x1b[32mZ-OS\x1b[0m       \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  Process Creation       \x1b[32m0.3ms\x1b[0m        0.5ms          \x1b[32mZ-OS\x1b[0m       \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  File I/O (seq read)    \x1b[32m3.2GB/s\x1b[0m      2.8GB/s        \x1b[32mZ-OS\x1b[0m       \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  File I/O (random)      \x1b[32m1.8GB/s\x1b[0m      1.2GB/s        \x1b[32mZ-OS\x1b[0m       \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  Memory Allocation      \x1b[32m45ns\x1b[0m        78ns           \x1b[32mZ-OS\x1b[0m       \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  Network Throughput     \x1b[32m9.8Gbps\x1b[0m      8.2Gbps        \x1b[32mZ-OS\x1b[0m       \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  Encryption (AES-256)   \x1b[32m12GB/s\x1b[0m       8GB/s          \x1b[32mZ-OS\x1b[0m       \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  Boot Time              \x1b[32m1.2s\x1b[0m        3.8s           \x1b[32mZ-OS\x1b[0m       \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  Container Startup      \x1b[32m80ms\x1b[0m        350ms          \x1b[32mZ-OS\x1b[0m       \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  Security Scan          \x1b[32m2.3s\x1b[0m        12.5s          \x1b[32mZ-OS\x1b[0m       \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  Threat Detection       \x1b[32m99.97%\x1b[0m       94.2%          \x1b[32mZ-OS\x1b[0m       \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                                                                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  \x1b[1;32mZ-OS wins 12/12 benchmarks against Linux\x1b[0m                      \x1b[1;36m║\x1b[0m
\x1b[1;36m╚════════════════════════════════════════════════════════════════╝\x1b[0m` }
    }

    case 'zhistory': {
      return { output: session.history.length === 0
        ? '\x1b[33mNo command history yet.\x1b[0m'
        : session.history.map((cmd, i) => `  ${String(i + 1).padStart(4)}  ${cmd}`).join('\n')
      }
    }

    case 'alias': {
      if (args.length === 0) {
        const aliases = Object.entries(session.aliases)
        return { output: aliases.length === 0
          ? '\x1b[33mNo aliases defined. Usage: alias name="command"\x1b[0m'
          : aliases.map(([k, v]) => `  alias ${k}='${v}'`).join('\n')
        }
      }
      const aliasDef = args.join(' ')
      const eqIdx = aliasDef.indexOf('=')
      if (eqIdx === -1) return { output: '\x1b[31malias: invalid format. Usage: alias name="command"\x1b[0m' }
      const name = aliasDef.slice(0, eqIdx).trim()
      const value = aliasDef.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
      session.aliases[name] = value
      return { output: `\x1b[32malias ${name}='${value}' created\x1b[0m` }
    }

    case 'export': {
      if (args.length === 0) {
        return { output: Object.entries(session.env).map(([k, v]) => `  export ${k}="${v}"`).join('\n') }
      }
      const expDef = args.join(' ')
      const eqIdx = expDef.indexOf('=')
      if (eqIdx === -1) return { output: '\x1b[31mexport: invalid format. Usage: export VAR="value"\x1b[0m' }
      const name = expDef.slice(0, eqIdx).trim()
      const value = expDef.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
      session.env[name] = value
      return { output: '' }
    }

    case 'env':
      return { output: Object.entries({ ...session.env, ...session.variables }).map(([k, v]) => `${k}=${v}`).join('\n') }

    case 'tree': {
      const targetPath = args[0] ? resolvePath(args[0], session.cwd) : session.cwd
      const node = getNodeAtPath(targetPath)
      if (!node || node.type !== 'directory') return { output: `\x1b[31mtree: '${targetPath}': Not a directory\x1b[0m` }
      const lines: string[] = [targetPath]
      function walk(n: FileSystemNode, prefix: string) {
        if (!n.children) return
        const entries = Array.from(n.children.values())
        entries.forEach((e, i) => {
          const isLast = i === entries.length - 1
          const connector = isLast ? '└── ' : '├── '
          const color = e.type === 'directory' ? '\x1b[1;34m' : e.type === 'symlink' ? '\x1b[1;36m' : ''
          lines.push(`${prefix}${connector}${color}${e.name}${e.type === 'directory' ? '/' : ''}\x1b[0m`)
          if (e.type === 'directory') walk(e, prefix + (isLast ? '    ' : '│   '))
        })
      }
      walk(node, '')
      return { output: lines.join('\n') }
    }

    case 'head': {
      if (!args[0]) return { output: '\x1b[31mhead: missing operand\x1b[0m' }
      const n = args.includes('-n') ? parseInt(args[args.indexOf('-n') + 1]) || 10 : 10
      const file = args.find(a => !a.startsWith('-') && !a.match(/^\d+$/)) || args[args.length - 1]
      const filePath = resolvePath(file, session.cwd)
      const node = getNodeAtPath(filePath)
      if (!node || node.type === 'directory') return { output: `\x1b[31mhead: ${file}: No such file\x1b[0m` }
      return { output: (node.content || '').split('\n').slice(0, n).join('\n') }
    }

    case 'tail': {
      if (!args[0]) return { output: '\x1b[31mtail: missing operand\x1b[0m' }
      const n = args.includes('-n') ? parseInt(args[args.indexOf('-n') + 1]) || 10 : 10
      const file = args.find(a => !a.startsWith('-') && !a.match(/^\d+$/)) || args[args.length - 1]
      const filePath = resolvePath(file, session.cwd)
      const node = getNodeAtPath(filePath)
      if (!node || node.type === 'directory') return { output: `\x1b[31mtail: ${file}: No such file\x1b[0m` }
      return { output: (node.content || '').split('\n').slice(-n).join('\n') }
    }

    case 'wc': {
      if (!args[0]) return { output: '\x1b[31mwc: missing operand\x1b[0m' }
      const filePath = resolvePath(args[0], session.cwd)
      const node = getNodeAtPath(filePath)
      if (!node || node.type === 'directory') return { output: `\x1b[31mwc: ${args[0]}: No such file\x1b[0m` }
      const content = node.content || ''
      return { output: `  ${content.split('\n').length}  ${content.split(/\s+/).filter(Boolean).length}  ${content.length} ${args[0]}` }
    }

    case 'ping': {
      const host = args[0] || 'z-os.cloud'
      return { output: `PING ${host} (93.184.216.34) 56(84) bytes of data.
64 bytes from ${host}: icmp_seq=1 ttl=56 time=3.2 ms
64 bytes from ${host}: icmp_seq=2 ttl=56 time=2.8 ms
64 bytes from ${host}: icmp_seq=3 ttl=56 time=3.1 ms

--- ${host} ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2003ms
rtt min/avg/max/mdev = 2.800/3.033/3.200/0.171 ms` }
    }

    case 'clear':
      return { output: '', action: 'clear' }

    case 'exit':
      return { output: '\x1b[33mConnection closed. Goodbye from Z-OS!\x1b[0m', action: 'disconnect' }

    case 'history':
      return { output: session.history.map((cmd, i) => `  ${String(i + 1).padStart(4)}  ${cmd}`).join('\n') }

    case 'id':
      return { output: `uid=1000(z-user) gid=1000(z-user) groups=1000(z-user),27(sudo),33(www-data)` }

    case 'which': {
      if (!args[0]) return { output: '\x1b[31mwhich: missing argument\x1b[0m' }
      const bins = ['zsh', 'zpkg', 'znet', 'zsec', 'zmon', 'bash', 'ls', 'cat', 'grep', 'find', 'ps', 'top', 'kill', 'chmod', 'chown', 'nano', 'vim', 'python3', 'node', 'gcc', 'git', 'curl', 'wget', 'docker']
      if (bins.includes(args[0])) return { output: `/usr/bin/${args[0]}` }
      return { output: `\x1b[31mwhich: no ${args[0]} in PATH\x1b[0m` }
    }

    case 'man': {
      if (!args[0]) return { output: '\x1b[33mWhat manual page do you want?\x1b[0m' }
      return { output: `\x1b[1;36mZ-OS Manual - ${args[0].toUpperCase()}\x1b[0m

NAME
    ${args[0]} - Z-OS system command

DESCRIPTION
    This command is part of the Z-OS Quantum operating system.
    For detailed documentation, visit https://docs.z-os.cloud/commands/${args[0]}

SEE ALSO
    zsysinfo(1), zsec(8), zpkg(1), znet(8)` }
    }

    case 'sudo':
      return { output: `\x1b[33m[sudo] password for ${session.username}: \x1b[0m
\x1b[32mZ-OS uses zero-trust architecture. Elevated privileges require multi-factor authentication.\x1b[0m
\x1b[33mPlease use 'zauth' for privilege escalation.\x1b[0m` }

    default:
      if (cmd === '') return { output: '' }
      return { output: `\x1b[31mzsh: command not found: ${cmd}\x1b[0m
\x1b[33mHint: Type 'help' for available commands or 'ztour' for an interactive tour.\x1b[0m` }
  }
}

function generateProcesses(): Process[] {
  const base: Process[] = [
    { pid: 1, name: 'z-init', user: 'root', cpu: 0.0, memory: 0.1, status: 'running', priority: 0, threads: 1, startTime: 0, cmd: '/sbin/z-init' },
    { pid: 2, name: 'z-kernel-guard', user: 'root', cpu: 0.3, memory: 0.5, status: 'running', priority: -2, threads: 4, startTime: 0, cmd: '/sbin/z-kernel-guard' },
    { pid: 3, name: 'z-firewall', user: 'root', cpu: 0.2, memory: 0.8, status: 'running', priority: -2, threads: 8, startTime: 0, cmd: '/sbin/z-firewall --ai-mode' },
    { pid: 4, name: 'z-netmanager', user: 'root', cpu: 0.1, memory: 0.6, status: 'running', priority: 0, threads: 4, startTime: 0, cmd: '/sbin/z-netmanager' },
    { pid: 5, name: 'z-quantum-crypto', user: 'root', cpu: 0.1, memory: 1.0, status: 'running', priority: -2, threads: 2, startTime: 0, cmd: '/sbin/z-quantum-crypto' },
    { pid: 6, name: 'z-ai-detect', user: 'root', cpu: 2.5, memory: 2.5, status: 'running', priority: -1, threads: 12, startTime: 0, cmd: '/sbin/z-ai-detect --model=z-threat-v3' },
    { pid: 7, name: 'z-auditd', user: 'root', cpu: 0.1, memory: 0.3, status: 'running', priority: 0, threads: 2, startTime: 0, cmd: '/sbin/z-auditd --level=paranoid' },
    { pid: 8, name: 'z-fs-monitor', user: 'root', cpu: 0.2, memory: 0.4, status: 'running', priority: 0, threads: 2, startTime: 0, cmd: '/sbin/z-fs-monitor' },
    { pid: 9, name: 'z-scheduler', user: 'root', cpu: 0.4, memory: 0.2, status: 'running', priority: -20, threads: 4, startTime: 0, cmd: '/sbin/z-scheduler --quantum' },
    { pid: 10, name: 'nginx', user: 'www-data', cpu: 0.3, memory: 0.8, status: 'running', priority: 0, threads: 4, startTime: 0, cmd: 'nginx: worker process' },
    { pid: 11, name: 'sshd', user: 'root', cpu: 0.0, memory: 0.3, status: 'running', priority: 0, threads: 1, startTime: 0, cmd: '/usr/sbin/sshd -D' },
    { pid: 12, name: 'z-packagekit', user: 'root', cpu: 0.0, memory: 0.2, status: 'sleeping', priority: 0, threads: 2, startTime: 0, cmd: '/usr/lib/z-packagekit' },
    { pid: 142, name: 'zsh', user: 'z-user', cpu: 0.0, memory: 0.4, status: 'running', priority: 0, threads: 1, startTime: Math.floor(Date.now()/1000) - 300, cmd: '-zsh' },
  ]
  return base
}

// ═══════════════════════════════════════════
// SOCKET.IO CONNECTION HANDLING
// ═══════════════════════════════════════════

io.on('connection', (socket) => {
  console.log(`[Z-OS] Connection: ${socket.id}`)
  totalConnections++
  let session: Session | null = null

  socket.on('authenticate', (data: { email: string; token: string }) => {
    const { email, token } = data
    if (!email || !token) {
      socket.emit('auth-error', { message: 'Email and token are required' })
      return
    }

    session = {
      id: uuidv4(),
      email,
      token,
      hostname: 'z-mainframe',
      username: 'z-user',
      cwd: '/home/z-user',
      connectedAt: new Date(),
      pidCounter: 200,
      env: {
        PATH: '/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin',
        HOME: '/home/z-user',
        USER: 'z-user',
        SHELL: '/bin/zsh',
        TERM: 'xterm-256color',
        LANG: 'en_US.UTF-8',
        Z_OS_VERSION: '3.0.0-quantum',
      },
      history: [],
      aliases: {
        ll: 'ls -lah --color=auto',
        la: 'ls -A --color=auto',
        cls: 'clear',
        update: 'zpkg update',
        scan: 'zsec scan',
        mon: 'zmon --realtime',
      },
      variables: {},
      runningProcesses: generateProcesses(),
      lastActivity: new Date(),
    }

    sessions.set(socket.id, session)

    socket.emit('authenticated', {
      sessionId: session.id,
      hostname: session.hostname,
      username: session.username,
      plan: {
        name: 'Quantum',
        cpu: 'Z-Quantum vCPU (4 cores) @ 4.2GHz',
        ram: '16 GB DDR5',
        storage: '64 GB NVMe SSD (ZFS)',
        bandwidth: '10 Gbps',
        os: 'Z-OS 3.0 Quantum',
        region: 'Quantum-Region-1',
        security: 'PARANOID',
      },
      services: systemServices,
      network: networkInterfaces,
      firewall: firewallRules,
      vulnerabilities: vulnerabilityDB,
      packages: packageDB,
    })

    console.log(`[Z-OS] Authenticated: ${email} (session: ${session.id.slice(0,8)})`)
  })

  socket.on('command', (data: { command: string }) => {
    if (!session) {
      socket.emit('auth-required', { message: 'Please authenticate first' })
      return
    }

    const input = data.command.trim()
    if (input) session.history.push(input)

    const result = processCommand(input, session)

    if (result.action === 'clear') {
      socket.emit('clear', {})
    } else if (result.action === 'disconnect') {
      socket.emit('disconnected', { message: result.output })
      socket.disconnect()
    } else {
      socket.emit('output', { output: result.output, cwd: session.cwd })
    }
  })

  socket.on('tab-complete', (data: { input: string }) => {
    if (!session) return
    const allCmds = ['help', 'ls', 'cd', 'pwd', 'cat', 'echo', 'mkdir', 'touch', 'rm', 'cp', 'mv',
      'find', 'grep', 'chmod', 'chown', 'whoami', 'hostname', 'uname', 'date', 'uptime', 'free',
      'df', 'ps', 'top', 'neofetch', 'zsysinfo', 'zsec', 'zfirewall', 'znet', 'zpkg', 'zservice',
      'zps', 'ztour', 'zbenchmark', 'zhistory', 'alias', 'export', 'env', 'tree', 'head', 'tail',
      'wc', 'ping', 'clear', 'exit', 'history', 'id', 'which', 'man', 'sudo',
      ...Object.keys(session.aliases)]
    const input = data.input.trim().toLowerCase()
    const matches = allCmds.filter(c => c.startsWith(input))
    if (matches.length === 1) {
      socket.emit('tab-complete-result', { completion: matches[0].slice(input.length) + ' ' })
    } else if (matches.length > 1) {
      socket.emit('tab-complete-result', { suggestions: matches })
    }
  })

  socket.on('get-metrics', () => {
    socket.emit('metrics', getSystemMetrics())
  })

  socket.on('disconnect', () => {
    if (session) {
      sessions.delete(socket.id)
      console.log(`[Z-OS] Disconnected: ${session.email}`)
    }
  })

  socket.on('error', (error) => {
    console.error(`[Z-OS] Socket error (${socket.id}):`, error)
  })
})

// Metrics broadcast every 2 seconds
setInterval(() => {
  io.emit('metrics', getSystemMetrics())
}, 2000)

const PORT = 3003
httpServer.listen(PORT, () => {
  console.log(`[Z-OS] Kernel running on port ${PORT}`)
  console.log(`[Z-OS] Version 3.0.0-quantum`)
  console.log(`[Z-OS] AI modules loaded`)
  console.log(`[Z-OS] Security level: PARANOID`)
})

process.on('SIGTERM', () => {
  console.log('[Z-OS] SIGTERM received, shutting down...')
  httpServer.close(() => process.exit(0))
})

process.on('SIGINT', () => {
  console.log('[Z-OS] SIGINT received, shutting down...')
  httpServer.close(() => process.exit(0))
})
