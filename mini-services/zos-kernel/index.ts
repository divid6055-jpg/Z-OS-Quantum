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
// UBUNTU 24.04 LTS KERNEL - Linux Terminal Emulator
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
  compressed?: boolean
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
  isRoot: boolean
}

// ═══════════════════════════════════════════════
// UBUNTU FILESYSTEM
// ═══════════════════════════════════════════════

function createFile(name: string, perms: string, owner: string, group: string, content: string = ''): FileSystemNode {
  return {
    name, type: 'file', permissions: perms, owner, group,
    size: Buffer.byteLength(content, 'utf8'),
    modified: new Date(), content,
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
    name, type: 'device', permissions: perms, owner, group: 'disk',
    size: 0, modified: new Date(),
  }
}

// Build the complete Ubuntu filesystem tree
const rootFS = createDir('/', 'drwxr-xr-x', 'root', 'root', [
  // /bin - Essential binaries
  createDir('bin', 'drwxr-xr-x', 'root', 'root', [
    createFile('bash', '-rwxr-xr-x', 'root', 'root', '#!/bin/bash\nGNU Bash 5.2.21'),
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
    createFile('ufw', '-rwx------', 'root', 'root'),
    createFile('reboot', '-rwx------', 'root', 'root'),
    createFile('shutdown', '-rwx------', 'root', 'root'),
  ]),

  // /etc - Configuration
  createDir('etc', 'drwxr-xr-x', 'root', 'root', [
    createFile('os-release', '-rw-r--r--', 'root', 'root',
      'NAME="Ubuntu"\nVERSION="24.04 LTS (Noble Numbat)"\nID=ubuntu\nID_LIKE=debian\nPRETTY_NAME="Ubuntu 24.04 LTS"\nVERSION_ID="24.04"\nHOME_URL="https://www.ubuntu.com/"\nSUPPORT_URL="https://help.ubuntu.com/"\nBUG_REPORT_URL="https://bugs.launchpad.net/ubuntu/"\nPRIVACY_POLICY_URL="https://www.ubuntu.com/legal/terms-and-policies/privacy-policy"\nVERSION_CODENAME=noble\nUBUNTU_CODENAME=noble'),
    createFile('hostname', '-rw-r--r--', 'root', 'root', 'ubuntu-server'),
    createFile('hosts', '-rw-r--r--', 'root', 'root', '127.0.0.1\tlocalhost\n127.0.1.1\tubuntu-server\n::1\t\tlocalhost ip6-localhost ip6-loopback'),
    createFile('passwd', '-rw-r--r--', 'root', 'root', 'root:x:0:0:root:/root:/bin/bash\nubuntu:x:1000:1000:Ubuntu User:/home/ubuntu:/bin/bash\nwww-data:x:33:33:Web Server:/var/www:/usr/sbin/nologin'),
    createFile('shadow', '-rw-------', 'root', 'root', 'root:$6$rounds=65536$ub$salt:19000:0:99999:7:::'),
    createFile('fstab', '-rw-r--r--', 'root', 'root', '# /etc/fstab: static file system information.\n#\n# <file system>  <mount point>  <type>  <options>       <dump>  <pass>\n/dev/sda1        /              ext4    defaults        0       1\ntmpfs            /tmp           tmpfs   defaults,size=2G 0       0'),
    createFile('resolv.conf', '-rw-r--r--', 'root', 'root', 'nameserver 127.0.0.53\noptions edns0 trust-ad\nsearch localdomain'),
    createDir('apt', 'drwxr-xr-x', 'root', 'root', [
      createFile('sources.list', '-rw-r--r--', 'root', 'root', 'deb http://archive.ubuntu.com/ubuntu noble main restricted\ndeb http://archive.ubuntu.com/ubuntu noble-updates main restricted\ndeb http://archive.ubuntu.com/ubuntu noble universe\ndeb http://archive.ubuntu.com/ubuntu noble-security main restricted universe'),
    ]),
    createDir('nginx', 'drwxr-xr-x', 'root', 'root', [
      createFile('nginx.conf', '-rw-r--r--', 'root', 'root', 'worker_processes auto;\nevents { worker_connections 1024; }\nhttp { server { listen 80; } }'),
    ]),
    createDir('ssh', 'drwxr-xr-x', 'root', 'root', [
      createFile('sshd_config', '-rw-r--r--', 'root', 'root', 'Port 22\nPermitRootLogin no\nPubkeyAuthentication yes\nPasswordAuthentication yes'),
    ]),
    createDir('ufw', 'drwxr-xr-x', 'root', 'root', [
      createFile('user.rules', '-rw-------', 'root', 'root', '## RULES ##\n\n### tuple ### allow any 22 0.0.0.0/0 any 0.0.0.0/0\n### tuple ### allow any 80 0.0.0.0/0 any 0.0.0.0/0\n### tuple ### allow any 443 0.0.0.0/0 any 0.0.0.0/0'),
    ]),
  ]),

  // /home - User directories
  createDir('home', 'drwxr-xr-x', 'root', 'root', [
    createDir('ubuntu', 'drwxr-xr-x', 'ubuntu', 'ubuntu', [
      createFile('.bashrc', '-rw-r--r--', 'ubuntu', 'ubuntu',
        '# ~/.bashrc: executed by bash(1) for non-login shells.\nexport SHELL=/bin/bash\nexport TERM=xterm-256color\nexport EDITOR=nano\nexport LANG=en_US.UTF-8\n\n# Aliases\nalias ll="ls -lah --color=auto"\nalias la="ls -A --color=auto"\nalias cls="clear"\nalias update="sudo apt update && sudo apt upgrade"\nalias ..="cd .."\nalias ...="cd ../.."\n\n# Prompt\nif [ "$(id -u)" -eq 0 ]; then\n  PS1="\\[\\e[1;31m\\]\\u@\\h\\[\\e[0m\\]:\\[\\e[1;34m\\]\\w\\[\\e[0m\\]# "\nelse\n  PS1="\\[\\e[1;32m\\]\\u@\\h\\[\\e[0m\\]:\\[\\e[1;34m\\]\\w\\[\\e[0m\\]\\$ "\nfi'),
      createFile('.profile', '-rw-r--r--', 'ubuntu', 'ubuntu', '# ~/.profile: executed by the command interpreter for login shells.\nif [ -f ~/.bashrc ]; then\n  . ~/.bashrc\nfi'),
      createFile('.bash_history', '-rw-------', 'ubuntu', 'ubuntu', ''),
      createFile('welcome.txt', '-rw-r--r--', 'ubuntu', 'ubuntu',
        'Welcome to Ubuntu 24.04 LTS (GNU/Linux 6.8.0-45-generic x86_64)\n\n * Documentation:  https://help.ubuntu.com\n * Management:     https://landscape.canonical.com\n * Support:        https://ubuntu.com/pro\n\nSystem information as of ' + new Date().toLocaleDateString() + '\n\n  System load:  0.12               Processes:           142\n  Usage of /:   14.2% of 63.89GB   Users logged in:     1\n  Memory usage: 51%                IPv4 address eth0:   10.0.0.1\n  Swap usage:   0%                 IPv4 address lo:     127.0.0.1\n\nLast login: ' + new Date().toLocaleString()),
      createDir('documents', 'drwxr-xr-x', 'ubuntu', 'ubuntu', [
        createFile('readme.md', '-rw-r--r--', 'ubuntu', 'ubuntu', '# Ubuntu Server Documentation\n\nUbuntu 24.04 LTS (Noble Numbat)\n\n## Features\n- Long Term Support until 2029\n- Linux kernel 6.8\n- Enhanced security with AppArmor\n- Cloud-init support\n- snap and apt package managers'),
        createFile('notes.txt', '-rw-r--r--', 'ubuntu', 'ubuntu', 'Meeting notes - Server Setup\n- Install nginx\n- Configure firewall rules\n- Set up Docker containers'),
      ]),
      createDir('projects', 'drwxr-xr-x', 'ubuntu', 'ubuntu', [
        createDir('web-app', 'drwxr-xr-x', 'ubuntu', 'ubuntu', [
          createFile('index.html', '-rw-r--r--', 'ubuntu', 'ubuntu', '<!DOCTYPE html>\n<html><head><title>My App</title></head>\n<body><h1>Hello from Ubuntu</h1></body></html>'),
          createFile('style.css', '-rw-r--r--', 'ubuntu', 'ubuntu', 'body { font-family: sans-serif; margin: 0; }'),
          createFile('app.js', '-rw-r--r--', 'ubuntu', 'ubuntu', 'const app = {\n  name: "Web App",\n  version: "1.0.0"\n};'),
        ]),
        createDir('scripts', 'drwxr-xr-x', 'ubuntu', 'ubuntu', [
          createFile('backup.sh', '-rwxr-xr-x', 'ubuntu', 'ubuntu', '#!/bin/bash\n# Automated Backup\necho "Starting backup..."\ntar czf /tmp/backup-$(date +%Y%m%d).tar.gz /home/ubuntu\necho "Backup complete!"'),
          createFile('monitor.sh', '-rwxr-xr-x', 'ubuntu', 'ubuntu', '#!/bin/bash\n# System Monitor\nwhile true; do\n  clear\n  top -bn1 | head -20\n  sleep 5\ndone'),
        ]),
      ]),
      createDir('downloads', 'drwxr-xr-x', 'ubuntu', 'ubuntu', []),
      createDir('.ssh', 'drwx------', 'ubuntu', 'ubuntu', [
        createFile('id_ed25519.pub', '-rw-r--r--', 'ubuntu', 'ubuntu', 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI ubuntu@ubuntu-server'),
        createFile('authorized_keys', '-rw-------', 'ubuntu', 'ubuntu', 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI ubuntu@ubuntu-server'),
        createFile('config', '-rw-------', 'ubuntu', 'ubuntu', 'Host *\n  AddKeysToAgent yes\n  IdentityFile ~/.ssh/id_ed25519'),
      ]),
      createDir('.config', 'drwxr-xr-x', 'ubuntu', 'ubuntu', []),
    ]),
  ]),

  // /var - Variable data
  createDir('var', 'drwxr-xr-x', 'root', 'root', [
    createDir('log', 'drwxr-xr-x', 'root', 'root', [
      createFile('syslog', '-rw-r-----', 'syslog', 'adm', ''),
      createFile('auth.log', '-rw-r-----', 'syslog', 'adm', ''),
      createFile('kern.log', '-rw-r-----', 'syslog', 'adm', ''),
      createFile('dpkg.log', '-rw-r--r--', 'root', 'root', ''),
    ]),
    createDir('www', 'drwxr-xr-x', 'www-data', 'www-data', [
      createFile('index.html', '-rw-r--r--', 'www-data', 'www-data', '<h1>Welcome to nginx on Ubuntu!</h1>'),
    ]),
    createDir('lib', 'drwxr-xr-x', 'root', 'root', []),
    createDir('cache', 'drwx------', 'root', 'root', [
      createDir('apt', 'drwxr-xr-x', 'root', 'root', []),
    ]),
    createDir('tmp', 'drwxrwxrwt', 'root', 'root', []),
  ]),

  // /usr - User programs
  createDir('usr', 'drwxr-xr-x', 'root', 'root', [
    createDir('bin', 'drwxr-xr-x', 'root', 'root', []),
    createDir('lib', 'drwxr-xr-x', 'root', 'root', []),
    createDir('share', 'drwxr-xr-x', 'root', 'root', [
      createDir('ubuntu', 'drwxr-xr-x', 'root', 'root', []),
    ]),
    createDir('local', 'drwxr-xr-x', 'root', 'root', [
      createDir('bin', 'drwxr-xr-x', 'root', 'root', []),
    ]),
  ]),

  // /tmp - Temporary
  createDir('tmp', 'drwxrwxrwt', 'root', 'root', []),

  // /opt - Optional
  createDir('opt', 'drwxr-xr-x', 'root', 'root', []),

  // /dev - Devices
  createDir('dev', 'drwxr-xr-x', 'root', 'root', [
    createDevice('null', 'crw-rw-rw-', 'root'),
    createDevice('zero', 'crw-rw-rw-', 'root'),
    createDevice('random', 'crw-rw-rw-', 'root'),
    createDevice('urandom', 'crw-rw-rw-', 'root'),
    createDevice('sda1', 'brw-rw----', 'root'),
    createDevice('tty0', 'crw--w----', 'root'),
    createDevice('console', 'crw-------', 'root'),
  ]),

  // /proc - Process info (virtual)
  createDir('proc', 'dr-xr-xr-x', 'root', 'root', [
    createFile('cpuinfo', '-r--r--r--', 'root', 'root', 'processor\t: 0\nvendor_id\t: GenuineIntel\nmodel name\t: Intel(R) Xeon(R) CPU @ 2.80GHz\ncpu cores\t: 4\ncache size\t: 16384 KB\nflags\t\t: fpu vme de pse tsc msr pae mce cx8 apic sep mtrr pge mca cmov pat pse36 clflush mmx fxsr sse sse2 ht syscall nx rdtscp lm avx avx2 aes-ni'),
    createFile('meminfo', '-r--r--r--', 'root', 'root', 'MemTotal:       16777216 kB\nMemFree:         8388608 kB\nMemAvailable:   12582912 kB\nBuffers:          524288 kB\nCached:          2097152 kB\nSwapTotal:       8388608 kB\nSwapFree:        8388608 kB'),
    createFile('version', '-r--r--r--', 'root', 'root', 'Linux version 6.8.0-45-generic (buildd@lcy02-amd64-051) (x86_64-linux-gnu-gcc-13 (Ubuntu 13.2.0-23ubuntu4) 13.2.0, GNU ld (GNU Binutils for Ubuntu) 2.42) #45-Ubuntu SMP x86_64'),
    createFile('uptime', '-r--r--r--', 'root', 'root', `${Math.floor(process.uptime())} ${process.uptime() * 100}`),
  ]),

  // /sys - System info (virtual)
  createDir('sys', 'dr-xr-xr-x', 'root', 'root', [
    createDir('kernel', 'dr-xr-xr-x', 'root', 'root', [
      createFile('version', '-r--r--r--', 'root', 'root', '6.8.0-45-generic'),
    ]),
  ]),

  // /root - Root home
  createDir('root', 'drwx------', 'root', 'root', [
    createFile('.bashrc', '-rw-r--r--', 'root', 'root', '# Root shell config\nPS1="\\[\\e[1;31m\\]root@\\h\\[\\e[0m\\]:\\[\\e[1;34m\\]\\w\\[\\e[0m\\]# "'),
  ]),

  // /boot - Boot files
  createDir('boot', 'drwxr-xr-x', 'root', 'root', [
    createFile('vmlinuz-6.8.0-45-generic', '-rw-r--r--', 'root', 'root', '[kernel binary]'),
    createFile('initrd.img-6.8.0-45-generic', '-rw-r--r--', 'root', 'root', '[initramfs image]'),
    createDir('grub', 'drwxr-xr-x', 'root', 'root', [
      createFile('grub.cfg', '-rw-------', 'root', 'root', 'menuentry "Ubuntu 24.04 LTS" {\n  linux /boot/vmlinuz-6.8.0-45-generic root=/dev/sda1\n  initrd /boot/initrd.img-6.8.0-45-generic\n}'),
    ]),
  ]),

  // /run - Runtime data
  createDir('run', 'drwxrwxrwt', 'root', 'root', []),
])

// ═══════════════════════════════════════════
// UBUNTU SERVICES
// ═══════════════════════════════════════════

const systemServices: Service[] = [
  { name: 'systemd', status: 'active', type: 'system', pid: 1, uptime: 0, description: 'System and Service Manager', autoStart: true, dependencies: [], log: ['Started successfully', 'All services loaded'] },
  { name: 'ufw', status: 'active', type: 'security', pid: 234, uptime: 0, description: 'Uncomplicated Firewall', autoStart: true, dependencies: ['systemd'], log: ['Firewall rules loaded', 'Status: active'] },
  { name: 'NetworkManager', status: 'active', type: 'network', pid: 456, uptime: 0, description: 'Network Connection Manager', autoStart: true, dependencies: ['systemd'], log: ['Interface eth0: connected', 'DNS: 127.0.0.53'] },
  { name: 'sshd', status: 'active', type: 'network', port: 22, pid: 567, uptime: 0, description: 'OpenSSH Server', autoStart: true, dependencies: ['NetworkManager'], log: ['Listening on port 22', 'Ed25519 keys supported'] },
  { name: 'nginx', status: 'active', type: 'network', port: 80, pid: 890, uptime: 0, description: 'Web Server (NGINX)', autoStart: true, dependencies: ['NetworkManager'], log: ['Listening on port 80', 'Serving /var/www'] },
  { name: 'cron', status: 'active', type: 'system', pid: 345, uptime: 0, description: 'Regular background program processing', autoStart: true, dependencies: ['systemd'], log: ['Cron daemon running'] },
  { name: 'rsyslog', status: 'active', type: 'system', pid: 210, uptime: 0, description: 'System Logging Service', autoStart: true, dependencies: ['systemd'], log: ['Logging to /var/log/syslog'] },
  { name: 'snapd', status: 'active', type: 'system', pid: 678, uptime: 0, description: 'Snap Daemon', autoStart: true, dependencies: ['systemd'], log: ['snapd running', 'Auto-refresh enabled'] },
  { name: 'dbus', status: 'active', type: 'system', pid: 123, uptime: 0, description: 'D-Bus System Message Bus', autoStart: true, dependencies: ['systemd'], log: ['D-Bus daemon running'] },
  { name: 'accounts-daemon', status: 'active', type: 'system', pid: 432, uptime: 0, description: 'Accounts Service', autoStart: true, dependencies: ['dbus'], log: ['Accounts service running'] },
  { name: 'docker', status: 'inactive', type: 'system', pid: 0, uptime: 0, description: 'Docker Application Container Engine', autoStart: false, dependencies: ['systemd'], log: ['Not started'] },
  { name: 'postgresql', status: 'inactive', type: 'system', pid: 0, uptime: 0, description: 'PostgreSQL RDBMS', autoStart: false, dependencies: ['systemd'], log: ['Not started'] },
  { name: 'mysql', status: 'inactive', type: 'system', pid: 0, uptime: 0, description: 'MySQL Community Server', autoStart: false, dependencies: ['systemd'], log: ['Not started'] },
]

// ═══════════════════════════════════════════
// UBUNTU NETWORK INTERFACES
// ═══════════════════════════════════════════

const networkInterfaces: NetworkInterface[] = [
  { name: 'eth0', ip: '10.0.0.1', mac: '00:1A:2B:3C:4D:5E', status: 'up', speed: '1 Gbps', rxBytes: 1073741824, txBytes: 536870912, type: 'ethernet' },
  { name: 'lo', ip: '127.0.0.1', mac: '00:00:00:00:00:00', status: 'up', speed: '∞', rxBytes: 1048576, txBytes: 1048576, type: 'loopback' },
]

// ═══════════════════════════════════════════
// UFW FIREWALL RULES
// ═══════════════════════════════════════════

const firewallRules: FirewallRule[] = [
  { id: 'fw001', action: 'allow', direction: 'in', protocol: 'tcp', source: '0.0.0.0/0', destination: '0.0.0.0/0', port: '22', enabled: true, logHits: 145 },
  { id: 'fw002', action: 'allow', direction: 'in', protocol: 'tcp', source: '0.0.0.0/0', destination: '0.0.0.0/0', port: '80', enabled: true, logHits: 8923 },
  { id: 'fw003', action: 'allow', direction: 'in', protocol: 'tcp', source: '0.0.0.0/0', destination: '0.0.0.0/0', port: '443', enabled: true, logHits: 15640 },
  { id: 'fw004', action: 'deny', direction: 'in', protocol: 'all', source: '0.0.0.0/0', destination: '0.0.0.0/0', port: '*', enabled: true, logHits: 45230 },
]

// ═══════════════════════════════════════════
// UBUNTU PACKAGE DATABASE
// ═══════════════════════════════════════════

const packageDB: Package[] = [
  { name: 'linux-image-generic', version: '6.8.0-45.45', description: 'Linux kernel image', size: '14 MB', category: 'kernel', installed: true, dependencies: [], repository: 'main' },
  { name: 'bash', version: '5.2.21-2ubuntu4', description: 'GNU Bourne Again SHell', size: '1.8 MB', category: 'shells', installed: true, dependencies: [], repository: 'main' },
  { name: 'coreutils', version: '9.4-3ubuntu6', description: 'GNU core utilities', size: '6.2 MB', category: 'utils', installed: true, dependencies: [], repository: 'main' },
  { name: 'sudo', version: '1.9.15p5-3ubuntu5', description: 'Execute commands as another user', size: '1.4 MB', category: 'admin', installed: true, dependencies: [], repository: 'main' },
  { name: 'apt', version: '2.7.14build2', description: 'Advanced Package Tool', size: '3.8 MB', category: 'admin', installed: true, dependencies: [], repository: 'main' },
  { name: 'nginx', version: '1.24.0-2ubuntu7', description: 'High-performance web server', size: '196 kB', category: 'web', installed: true, dependencies: [], repository: 'universe' },
  { name: 'openssh-server', version: '1:9.6p1-3ubuntu13', description: 'Secure shell server', size: '450 kB', category: 'net', installed: true, dependencies: [], repository: 'main' },
  { name: 'ufw', version: '0.36.2-6', description: 'Uncomplicated Firewall', size: '180 kB', category: 'admin', installed: true, dependencies: [], repository: 'main' },
  { name: 'python3', version: '3.12.3-0ubuntu2', description: 'Python 3 interpreter', size: '60 kB', category: 'python', installed: true, dependencies: [], repository: 'main' },
  { name: 'nodejs', version: '18.19.1-1ubuntu3', description: 'Node.js JavaScript runtime', size: '24 MB', category: 'web', installed: true, dependencies: [], repository: 'universe' },
  { name: 'gcc', version: '4:13.2.0-7ubuntu1', description: 'GNU C compiler', size: '56 kB', category: 'devel', installed: true, dependencies: [], repository: 'main' },
  { name: 'git', version: '1:2.43.0-1ubuntu7', description: 'Distributed version control system', size: '3.5 MB', category: 'vcs', installed: true, dependencies: [], repository: 'main' },
  { name: 'curl', version: '8.5.0-2ubuntu10', description: 'Command line tool for transferring data', size: '260 kB', category: 'web', installed: true, dependencies: [], repository: 'main' },
  { name: 'wget', version: '1.21.4-1ubuntu4', description: 'Retrieves files from the web', size: '370 kB', category: 'web', installed: true, dependencies: [], repository: 'main' },
  { name: 'docker.io', version: '24.0.7-0ubuntu4', description: 'Linux container runtime', size: '48 MB', category: 'admin', installed: false, dependencies: [], repository: 'universe' },
  { name: 'postgresql', version: '16+246build1', description: 'Object-relational SQL database', size: '120 kB', category: 'database', installed: false, dependencies: [], repository: 'main' },
  { name: 'redis-server', version: '5:7.0.15-1build1', description: 'Persistent key-value database', size: '260 kB', category: 'database', installed: false, dependencies: [], repository: 'universe' },
  { name: 'vim', version: '2:9.1.0016-1ubuntu7', description: 'Vi IMproved - enhanced vi editor', size: '1.5 MB', category: 'editors', installed: true, dependencies: [], repository: 'main' },
  { name: 'nano', version: '7.2-2build1', description: 'Small, friendly text editor', size: '330 kB', category: 'editors', installed: true, dependencies: [], repository: 'main' },
  { name: 'htop', version: '3.3.0-4build1', description: 'Interactive processes viewer', size: '120 kB', category: 'utils', installed: true, dependencies: [], repository: 'universe' },
  { name: 'tmux', version: '3.4-2build1', description: 'Terminal multiplexer', size: '340 kB', category: 'shells', installed: true, dependencies: [], repository: 'main' },
  { name: 'net-tools', version: '2.10-0.1ubuntu1', description: 'NET-3 networking toolkit', size: '180 kB', category: 'net', installed: true, dependencies: [], repository: 'main' },
  { name: 'lynx', version: '2.9.0rel.0-3ubuntu1', description: 'Text-mode WWW browser', size: '1.2 MB', category: 'web', installed: true, dependencies: [], repository: 'universe' },
  { name: 'w3m', version: '0.5.3+git20230121-2build1', description: 'WWW browsable pager', size: '840 kB', category: 'web', installed: true, dependencies: [], repository: 'universe' },
  { name: 'xfce4', version: '4.18', description: 'XFCE desktop environment', size: '64 MB', category: 'x11', installed: true, dependencies: [], repository: 'universe' },
  { name: 'xorg', version: '1:7.7+23ubuntu3', description: 'X.Org X Window System', size: '32 MB', category: 'x11', installed: true, dependencies: [], repository: 'main' },
  { name: 'firefox', version: '126.0+build1-0ubuntu1', description: 'Mozilla Firefox web browser', size: '85 MB', category: 'web', installed: true, dependencies: [], repository: 'main' },
  { name: 'build-essential', version: '12.10ubuntu1', description: 'Informational list of build-essential packages', size: '4 kB', category: 'devel', installed: true, dependencies: [], repository: 'main' },
  { name: 'cmake', version: '3.28.3-1build1', description: 'Cross-platform make system', size: '6.5 MB', category: 'devel', installed: true, dependencies: [], repository: 'main' },
  { name: 'golang-go', version: '1.22.2-1ubuntu1', description: 'Go programming language compiler', size: '64 MB', category: 'devel', installed: false, dependencies: [], repository: 'universe' },
  { name: 'rustc', version: '1.75.0+dfsg0ubuntu1', description: 'Rust systems programming language', size: '35 MB', category: 'devel', installed: false, dependencies: [], repository: 'universe' },
  { name: 'mysql-server', version: '8.0.37-0ubuntu0.24.04', description: 'MySQL database server', size: '12 MB', category: 'database', installed: false, dependencies: [], repository: 'main' },
]

// ═══════════════════════════════════════════
// SIMULATED WEBSITES FOR curl/wget
// ═══════════════════════════════════════════

const simulatedWebsites: Record<string, { content: string; headers: Record<string, string> }> = {
  'example.com': {
    content: `<!doctype html>
<html>
<head>
    <title>Example Domain</title>
    <meta charset="utf-8" />
    <meta http-equiv="Content-type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body>
<div>
    <h1>Example Domain</h1>
    <p>This domain is for use in illustrative examples in documents. You may use this domain in literature without prior coordination or asking for permission.</p>
    <p><a href="https://www.iana.org/domains/example">More information...</a></p>
</div>
</body>
</html>`,
    headers: { 'Content-Type': 'text/html; charset=UTF-8', 'Server': 'ECS (dcb/7F84)', 'Content-Length': '1256', 'Date': new Date().toUTCString() },
  },
  'google.com': {
    content: `<!doctype html>
<html itemscope="" itemtype="http://schema.org/WebPage" lang="en">
<head><meta content="Search the world's information" name="description"/><title>Google</title></head>
<body><div><form action="/search"><input name="q" type="text"/></form></div></body>
</html>`,
    headers: { 'Content-Type': 'text/html; charset=ISO-8859-1', 'Server': 'gws', 'Content-Length': '15648', 'Date': new Date().toUTCString() },
  },
  'github.com': {
    content: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>GitHub: Let's build from here</title></head>
<body>
<div><h1>Let's build from here</h1><p>The world's leading AI-powered developer platform.</p></div>
</body>
</html>`,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Server': 'GitHub.com', 'Content-Length': '84520', 'Date': new Date().toUTCString() },
  },
  'ubuntu.com': {
    content: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Ubuntu - The leading platform for AI, IoT and cloud</title></head>
<body>
<div><h1>Ubuntu</h1><p>The leading platform for AI, IoT and cloud</p><p>Enterprise open source, supported and secured.</p></div>
</body>
</html>`,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Server': 'nginx', 'Content-Length': '52340', 'Date': new Date().toUTCString() },
  },
  'stackoverflow.com': {
    content: `<!DOCTYPE html>
<html>
<head><title>Stack Overflow - Where Developers Learn, Share, & Build Careers</title></head>
<body>
<div><h1>Stack Overflow</h1><p>Where developers learn, share, & build careers.</p></div>
</body>
</html>`,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Server': 'cloudflare', 'Content-Length': '112340', 'Date': new Date().toUTCString() },
  },
  'wikipedia.org': {
    content: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Wikipedia, the free encyclopedia</title></head>
<body>
<div><h1>Wikipedia</h1><p>The Free Encyclopedia</p></div>
</body>
</html>`,
    headers: { 'Content-Type': 'text/html; charset=UTF-8', 'Server': 'mw-api-ext', 'Content-Length': '78900', 'Date': new Date().toUTCString() },
  },
}

// ═══════════════════════════════════════════
// SESSIONS & SYSTEM STATE
// ═══════════════════════════════════════════

const sessions = new Map<string, Session>()
const startTime = Date.now()
let totalConnections = 0
let totalCommands = 0
let ufwEnabled = true

// ═══════════════════════════════════════════
// FILESYSTEM NAVIGATION HELPERS
// ═══════════════════════════════════════════

function resolvePath(inputPath: string, cwd: string): string {
  if (!inputPath || inputPath === '') return cwd
  if (inputPath === '~') return '/home/ubuntu'
  if (inputPath.startsWith('~/')) return '/home/ubuntu/' + inputPath.slice(2)
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

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

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

  return { uptime, cpuUsage, memUsed, memTotal, diskUsed, diskTotal, netRx, netTx, loadAvg, processes, threads }
}

// ═══════════════════════════════════════════
// COMMAND PROCESSOR - The Heart of Ubuntu
// ═══════════════════════════════════════════

function processCommand(rawInput: string, session: Session): { output: string; cwd?: string; action?: string } {
  totalCommands++
  session.lastActivity = new Date()

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
\x1b[1;36m║          \x1b[1;33mUbuntu Advanced Commands Reference\x1b[0m                        \x1b[1;36m║\x1b[0m
\x1b[1;36m╠════════════════════════════════════════════════════════════════╣\x1b[0m
\x1b[1;36m║\x1b[0m \x1b[1;33mSYSTEM\x1b[0m                                                        \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   systemctl      Manage system services                      \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   ufw            Manage firewall rules                        \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   apt            Package management                           \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   dpkg           Debian package manager                       \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   ip             Network configuration                        \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   ss             Socket statistics                            \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                                                                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m \x1b[1;33mNETWORK\x1b[0m                                                      \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   curl           Transfer data from URLs                      \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   wget           Download files from the web                  \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   ssh            Secure shell client                          \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   scp            Secure copy                                  \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                                                                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[1;33mPACKAGES\x1b[0m                                                     \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   apt update     Update package lists                         \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   apt upgrade    Upgrade installed packages                   \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   apt install    Install packages                             \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   apt remove     Remove packages                              \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   apt search     Search packages                              \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   apt list       List packages                                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   apt show       Show package details                         \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                                                                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[1;33mDESKTOP\x1b[0m                                                      \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   startx         Start X Window System                        \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                                                                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[1;33mPOWER USER\x1b[0m                                                   \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   alias          Create command aliases                       \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   export         Set environment variables                    \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   history        Command history                              \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   sudo           Execute as superuser                         \x1b[1;36m║\x1b[0m
\x1b[1;36m╚════════════════════════════════════════════════════════════════╝\x1b[0m` }
      }
      return { output: `\x1b[1;36m╔════════════════════════════════════════════════════════════════╗\x1b[0m
\x1b[1;36m║          \x1b[1;33mUbuntu 24.04 LTS - Command Reference\x1b[0m                       \x1b[1;36m║\x1b[0m
\x1b[1;36m╠════════════════════════════════════════════════════════════════╣\x1b[0m
\x1b[1;36m║\x1b[0m                                                                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m \x1b[1;33mNavigation & Files\x1b[0m                                            \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[36mls\x1b[0m [\x1b-la\x1b] [\x1bpath\x1b]    List directory contents              \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[36mcd\x1b[0m [\x1bpath\x1b]           Change directory                     \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[36mpwd\x1b[0m                  Print working directory              \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[36mcat\x1b[0m [\x1bfile\x1b]          Display file contents                 \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[36mmkdir\x1b[0m [\x1bdir\x1b]         Create directory                      \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[36mtouch\x1b[0m [\x1bfile\x1b]        Create empty file                     \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[36mrm\x1b[0m [\x1b-rf\x1b] [\x1btarget\x1b]   Remove file/directory                 \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[36mcp\x1b[0m [\x1bsrc\x1b] [\x1bdst\x1b]     Copy files                            \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[36mmv\x1b[0m [\x1bsrc\x1b] [\x1bdst\x1b]     Move/rename files                     \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[36mfind\x1b[0m [\x1bpath\x1b] [\x1bname\x1b]   Search for files                      \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[36mgrep\x1b[0m [\x1bpattern\x1b] [\x1bfile\x1b] Search text in files                  \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[36mchmod\x1b[0m [\x1bperms\x1b] [\x1bfile\x1b] Change file permissions               \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                                                                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m \x1b[1;33mSystem Information\x1b[0m                                             \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[36muname\x1b[0m [\x1b-a\x1b]           System information                    \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[36mwhoami\x1b[0m               Current user                          \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[36mhostname\x1b[0m             System hostname                       \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[36mdate\x1b[0m                  Current date/time                     \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[36muptime\x1b[0m               System uptime                         \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[36mneofetch\x1b[0m             System info with ASCII art            \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[36mfree\x1b[0m [\x1b-h\x1b]           Memory usage                          \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[36mdf\x1b[0m [\x1b-h\x1b]            Disk space usage                      \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[36mps\x1b[0m [\x1baux\x1b]            Process list                          \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[36mtop\x1b[0m                  System resources                      \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                                                                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m \x1b[1;33mPackage Management\x1b[0m                                           \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[36mapt update\x1b[0m          Update package lists                   \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[36mapt upgrade\x1b[0m         Upgrade packages                       \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[36mapt install\x1b[0m <pkg>  Install a package                      \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[36mapt remove\x1b[0m <pkg>   Remove a package                       \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[36mapt search\x1b[0m <term>  Search for packages                    \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                                                                \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m \x1b[1;33mOther\x1b[0m                                                          \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[36mecho\x1b[0m [\x1btext\x1b]          Print text                            \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[36mclear\x1b[0m                Clear terminal                        \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[36mexit\x1b[0m                Disconnect                            \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m   \x1b[36mhelp -a\x1b[0m              Advanced commands                     \x1b[1;36m║\x1b[0m
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
          return `${e.permissions} 1 ${e.owner.padEnd(8)} ${e.group.padEnd(8)} ${String(e.size).padStart(8)} ${date} ${color}${e.name}${suffix}\x1b[0m`
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
      const target = args[0] || '/home/ubuntu'
      const newPath = resolvePath(target, session.cwd)
      const node = getNodeAtPath(newPath)
      if (!node || node.type !== 'directory') {
        return { output: `\x1b[31mbash: cd: ${target}: No such file or directory\x1b[0m` }
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
      return { output: session.isRoot ? 'root' : session.username }

    case 'hostname':
      return { output: session.hostname }

    case 'uname': {
      if (args.includes('-a')) {
        return { output: `Linux ubuntu-server 6.8.0-45-generic #45-Ubuntu SMP x86_64 GNU/Linux` }
      }
      if (args.includes('-r')) return { output: '6.8.0-45-generic' }
      return { output: 'Linux' }
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
Mem:           16Gi       ${Math.floor(m.memUsed/1024)}Gi       ${Math.floor((m.memTotal-m.memUsed)/1024)}Gi       128Mi       2.0Gi        ${Math.floor((m.memTotal-m.memUsed+2048)/1024)}Gi
Swap:         8.0Gi         0Bi       8.0Gi` }
      }
      return { output: `              total        used        free      shared  buff/cache   available
Mem:        16777216     ${Math.floor(m.memUsed*1024)}   ${Math.floor((m.memTotal-m.memUsed)*1024)}      131072     2097152    ${Math.floor((m.memTotal-m.memUsed+2048)*1024)}
Swap:        8388608           0     8388608` }
    }

    case 'df': {
      if (args.includes('-h')) {
        return { output: `Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        64G  8.2G   52G  14% /
tmpfs           2.0G     0  2.0G   0% /tmp` }
      }
      return { output: `Filesystem     1K-blocks    Used Available Use% Mounted on
/dev/sda1      67108864 8598324 55243540  14% /
tmpfs            2097152       0   2097152   0% /tmp` }
    }

    case 'ps': {
      if (args.includes('aux') || args.includes('-ef')) {
        const procs = generateProcesses()
        return { output: `USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
${procs.map(p => `${p.user.padEnd(8)} ${String(p.pid).padStart(5)} ${p.cpu.toFixed(1).padStart(4)} ${p.memory.toFixed(1).padStart(4)} ${String(Math.floor(Math.random()*500000)).padStart(7)} ${String(Math.floor(Math.random()*50000)).padStart(6)} pts/0    ${p.status === 'running' ? 'Ssl' : 'S'}   ${new Date(p.startTime*1000).toLocaleTimeString().slice(0,5)}   0:${String(Math.floor(Math.random()*59)).padStart(2)}.${String(Math.floor(Math.random()*99)).padStart(2)} ${p.cmd}`).join('\n')}` }
      }
      return { output: `  PID TTY          TIME CMD
    1 pts/0    00:00:02 systemd
  142 pts/0    00:00:00 bash
  389 pts/0    00:00:01 ps` }
    }

    case 'top': {
      const m = getSystemMetrics()
      return { output: `\x1b[1;36mtop - ${new Date().toLocaleTimeString()} up ${Math.floor(m.uptime/3600)}:${String(Math.floor((m.uptime%3600)/60)).padStart(2,'0')}, ${sessions.size} users, load average: ${m.loadAvg.join(', ')}\x1b[0m
Tasks: \x1b[32m${m.processes} total\x1b[0m, ${Math.floor(Math.random()*3)+1} running, ${m.processes-2} sleeping, 0 stopped, 0 zombie
%Cpu(s): \x1b[32m${m.cpuUsage.toFixed(1)}% us\x1b[0m, ${(Math.random()*3).toFixed(1)}% sy, 0.0% ni, ${(100-m.cpuUsage-3).toFixed(1)}% id
MiB Mem:  16384.0 total,  ${(m.memTotal-m.memUsed)/1024*4|0}.0 free,  ${m.memUsed/1024*4|0}.0 used,   2048.0 buff/cache
MiB Swap:  8192.0 total,   8192.0 free,      0.0 used.  ${((m.memTotal-m.memUsed+2048)/m.memTotal*100).toFixed(1)} avail Mem

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
    1 root      20   0  168932  12644   8412 S   0.0   0.1   0:02.34 systemd
  234 root      20   0   48356   5234   3421 S   0.0   0.0   0:00.12 ufw
  456 root      20   0  285672  23456  12345 S   0.1   0.1   0:01.23 NetworkManager
  567 root      20   0  154234  10234   6789 S   0.0   0.1   0:00.56 sshd
  890 www-data  20   0   45678   5678   3456 S   0.1   0.0   0:00.89 nginx
  142 ubuntu    20   0   23456   4567   2345 S   0.0   0.0   0:00.12 bash` }
    }

    case 'neofetch': {
      const m = getSystemMetrics()
      return { output: `\x1b[1;33m            .-/+oossssoo+/-.\x1b[0m       \x1b[1;33mubuntu\x1b[0m@\x1b[1;33mubuntu-server\x1b[0m
\x1b[1;33m        \`:+sssssssssssssssssss+:\`\x1b[0m   ─────────────────
\x1b[1;33m      -+sssssssssssssssssssssss+-\x1b[0m   \x1b[1;33mOS:\x1b[0m Ubuntu 24.04 LTS x86_64
\x1b[1;33m    .ossssssssssssssssssssssssso.\x1b[0m    \x1b[1;33mHost:\x1b[0m KVM/QEMU Virtual Machine
\x1b[1;33m   +sssssssssssssssssssssssssssss+\x1b[0m   \x1b[1;33mKernel:\x1b[0m 6.8.0-45-generic
\x1b[1;33m  .ossssssssssssssssssssssssssssso.\x1b[0m   \x1b[1;33mUptime:\x1b[0m ${formatUptime(m.uptime)}
\x1b[1;33m  +sssssssssssssssssssssssssssss+\x1b[0m    \x1b[1;33mPackages:\x1b[0m ${packageDB.filter(p => p.installed).length} (apt)
\x1b[1;33m  .ossssssssssssssssssssssssssssso.\x1b[0m   \x1b[1;33mShell:\x1b[0m bash 5.2.21
\x1b[1;33m   +sssssssssssssssssssssssssssss+\x1b[0m   \x1b[1;33mTerminal:\x1b[0m xterm-256color
\x1b[1;33m    .ossssssssssssssssssssssssso.\x1b[0m    \x1b[1;33mCPU:\x1b[0m Intel Xeon (4) @ 2.800GHz
\x1b[1;33m     -+sssssssssssssssssssssss+-\x1b[0m    \x1b[1;33mMemory:\x1b[0m ${Math.floor(m.memUsed/1024*4)}MiB / 16384MiB
\x1b[1;33m       \`:+sssssssssssssssssss+:\`\x1b[0m
\x1b[1;33m            .-/+oossssoo+/-.\x1b[0m       \x1b[40m   \x1b[41m   \x1b[42m   \x1b[43m   \x1b[44m   \x1b[45m   \x1b[46m   \x1b[47m   \x1b[0m
                                        \x1b[40m   \x1b[41m   \x1b[42m   \x1b[43m   \x1b[44m   \x1b[45m   \x1b[46m   \x1b[47m   \x1b[0m` }
    }

    case 'clear':
      return { output: '', action: 'clear' }

    case 'exit':
      return { output: '\x1b[33mlogout\nConnection to ubuntu-server closed.\x1b[0m', action: 'disconnect' }

    case 'history':
      return { output: session.history.map((cmd, i) => `  ${String(i + 1).padStart(4)}  ${cmd}`).join('\n') }

    case 'id': {
      if (session.isRoot) {
        return { output: `uid=0(root) gid=0(root) groups=0(root)` }
      }
      return { output: `uid=1000(ubuntu) gid=1000(ubuntu) groups=1000(ubuntu),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev)` }
    }

    case 'which': {
      if (!args[0]) return { output: '\x1b[31mwhich: missing argument\x1b[0m' }
      const bins = ['bash', 'apt', 'systemctl', 'ufw', 'ip', 'ss', 'dpkg', 'ls', 'cat', 'grep', 'find', 'ps', 'top', 'kill', 'chmod', 'chown', 'nano', 'vim', 'python3', 'node', 'gcc', 'git', 'curl', 'wget', 'docker', 'ssh', 'startx', 'sudo']
      if (bins.includes(args[0])) return { output: `/usr/bin/${args[0]}` }
      return { output: `\x1b[31mwhich: no ${args[0]} in (/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin)\x1b[0m` }
    }

    case 'man': {
      if (!args[0]) return { output: '\x1b[33mWhat manual page do you want?\x1b[0m' }
      return { output: `\x1b[1;36m${args[0].toUpperCase()}(1)\x1b[0m

NAME
    ${args[0]} - system command

DESCRIPTION
    See \`info ${args[0]}\` or \`${args[0]} --help\` for more information.

SEE ALSO
    bash(1), apt(8), systemctl(1)` }
    }

    case 'sudo': {
      if (!args[0]) return { output: '\x1b[31musage: sudo [-hknV] command\x1b[0m' }
      const savedIsRoot = session.isRoot
      session.isRoot = true
      const savedUsername = session.username
      session.username = 'root'
      const result = executeSingleCommand(args[0], args.slice(1), session, pipeInput)
      session.isRoot = savedIsRoot
      session.username = savedUsername
      return result
    }

    // ═══════════════════════════════
    // APT PACKAGE MANAGER
    // ═══════════════════════════════

    case 'apt': {
      const subcmd = args[0]
      if (subcmd === 'update') {
        return { output: `\x1b[33mHit:1 http://archive.ubuntu.com/ubuntu noble InRelease\x1b[0m
\x1b[33mHit:2 http://archive.ubuntu.com/ubuntu noble-updates InRelease\x1b[0m
\x1b[33mHit:3 http://archive.ubuntu.com/ubuntu noble-backports InRelease\x1b[0m
\x1b[33mHit:4 http://security.ubuntu.com/ubuntu noble-security InRelease\x1b[0m
Reading package lists... Done
Building dependency tree... Done
All packages are up to date.` }
      }
      if (subcmd === 'upgrade') {
        return { output: `Reading package lists... Done
Building dependency tree... Done
Calculating upgrade... Done
0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.` }
      }
      if (subcmd === 'install' && args[1]) {
        const pkgName = args[1]
        const pkg = packageDB.find(p => p.name === pkgName)
        if (pkg && pkg.installed) {
          return { output: `Reading package lists... Done
Building dependency tree... Done
${pkgName} is already the newest version (${pkg.version}).
0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.` }
        }
        const version = pkg ? pkg.version : '1.0.0-1ubuntu1'
        const size = pkg ? pkg.size : '256 kB'
        const sizeBytes = parseInt(size) * (size.includes('MB') ? 1048576 : size.includes('kB') ? 1024 : 1)
        const needSize = size.includes('MB') ? `${(sizeBytes/1048576).toFixed(1)} MB` : size.includes('kB') ? `${(sizeBytes/1024).toFixed(0)} kB` : size
        const deps = pkg && pkg.dependencies.length > 0 ? `\n  ${pkg.dependencies.join(' ')}` : ''
        return { output: `Reading package lists... Done
Building dependency tree... Done
The following NEW packages will be installed:
  ${pkgName}${deps}
0 upgraded, 1 newly installed, 0 to remove and 0 not upgraded.
Need to get ${needSize} of archives.
After this operation, ${needSize} of additional disk space will be used.
Get:1 http://archive.ubuntu.com/ubuntu noble/main amd64 ${pkgName} amd64 ${version} [${needSize}]\x1b[0m
Fetched ${needSize} in 1s (${size}/s)
Selecting previously unselected package ${pkgName}.
(Reading database ... 145234 files and directories currently installed.)
Preparing to unpack .../${pkgName}_${version}_amd64.deb ...
Unpacking ${pkgName} (${version}) ...
Setting up ${pkgName} (${version}) ...` }
      }
      if (subcmd === 'remove' && args[1]) {
        const pkgName = args[1]
        const pkg = packageDB.find(p => p.name === pkgName)
        if (!pkg || !pkg.installed) {
          return { output: `\x1b[31mE: Package '${pkgName}' is not installed\x1b[0m` }
        }
        return { output: `Reading package lists... Done
Building dependency tree... Done
The following packages will be REMOVED:
  ${pkgName}
0 upgraded, 0 newly installed, 1 to remove and 0 not upgraded.
After this operation, ${pkg.size} disk space will be freed.
(Reading database ... 145234 files and directories currently installed.)
Removing ${pkgName} (${pkg.version}) ...` }
      }
      if (subcmd === 'search' && args[1]) {
        const term = args[1].toLowerCase()
        const results = packageDB.filter(p => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term))
        if (results.length === 0) {
          return { output: `Sorting... Done
Full Text Search... Done` }
        }
        return { output: `Sorting... Done
Full Text Search... Done
${results.map(p => `${p.name}/${p.repository} ${p.version} amd64\n  ${p.description}`).join('\n\n')}` }
      }
      if (subcmd === 'list') {
        const installed = args.includes('--installed')
        const pkgs = installed ? packageDB.filter(p => p.installed) : packageDB
        return { output: `Listing... Done
${pkgs.map(p => `${p.name}/${p.repository} ${p.version} ${p.installed ? '[installed]' : ''}`).join('\n')}` }
      }
      if (subcmd === 'show' && args[1]) {
        const pkgName = args[1]
        const pkg = packageDB.find(p => p.name === pkgName)
        if (!pkg) return { output: `\x1b[31mE: Unable to locate package ${pkgName}\x1b[0m` }
        return { output: `Package: ${pkg.name}
Version: ${pkg.version}
Priority: optional
Section: ${pkg.category}
Installed-Size: ${pkg.size}
Maintainer: Ubuntu Developers <ubuntu-devel-discuss@lists.ubuntu.com>
Architecture: amd64
Depends: ${pkg.dependencies.join(', ') || 'none'}
Description: ${pkg.description}
Original-Maintainer: Debian/Ubuntu Maintainers` }
      }
      return { output: `Usage: apt [options] command

apt is a commandline package manager and provides commands for
searching and managing as well as querying information about packages.

Commands:
  update      - Update package lists
  upgrade     - Upgrade installed packages
  install     - Install new packages
  remove      - Remove packages
  search      - Search in package descriptions
  list        - List packages
  show        - Show package details` }
    }

    // ═══════════════════════════════
    // SYSTEMCTL
    // ═══════════════════════════════

    case 'systemctl': {
      const subcmd = args[0]
      if (subcmd === 'list-units' || (!subcmd)) {
        return { output: `  UNIT                    LOAD   ACTIVE SUB     DESCRIPTION
  systemd-journald.service loaded active running Journal Service
  systemd-udevd.service    loaded active running udev Kernel Device Manager
  systemd-timesyncd.service loaded active running Network Time Synchronization
  dbus.service             loaded active running D-Bus System Message Bus
  systemd-logind.service   loaded active running Login Service
  NetworkManager.service   loaded active running Network Manager
  ssh.service              loaded active running OpenBSD Secure Shell server
  nginx.service            loaded active running A high performance web server
  ufw.service              loaded active running Uncomplicated Firewall
  cron.service             loaded active running Regular background program
  rsyslog.service          loaded active running System Logging Service
  snapd.service            loaded active running Snap Daemon
  accounts-daemon.service  loaded active running Accounts Service
  docker.service           loaded inactive dead    Docker Application Container
  postgresql.service       loaded inactive dead    PostgreSQL RDBMS
  mysql.service            loaded inactive dead    MySQL Community Server

16 loaded units listed.` }
      }
      if (subcmd === 'start' && args[1]) {
        const svc = systemServices.find(s => s.name === args[1])
        if (svc) {
          svc.status = 'active'
          return { output: `` }
        }
        return { output: `\x1b[31mFailed to start ${args[1]}.service: Unit ${args[1]}.service not found.\x1b[0m` }
      }
      if (subcmd === 'stop' && args[1]) {
        const svc = systemServices.find(s => s.name === args[1])
        if (svc) {
          svc.status = 'inactive'
          return { output: `` }
        }
        return { output: `\x1b[31mFailed to stop ${args[1]}.service: Unit ${args[1]}.service not found.\x1b[0m` }
      }
      if (subcmd === 'restart' && args[1]) {
        const svc = systemServices.find(s => s.name === args[1])
        if (svc) {
          return { output: `` }
        }
        return { output: `\x1b[31mFailed to restart ${args[1]}.service: Unit ${args[1]}.service not found.\x1b[0m` }
      }
      if (subcmd === 'status' && args[1]) {
        const svc = systemServices.find(s => s.name === args[1])
        if (!svc) return { output: `\x1b[31mUnit ${args[1]}.service could not be found.\x1b[0m` }
        const activeStr = svc.status === 'active' ? '\x1b[32mactive (running)\x1b[0m' : svc.status === 'inactive' ? '\x1b[31minactive (dead)\x1b[0m' : '\x1b[33mfailed\x1b[0m'
        const pidStr = svc.pid ? `   Main PID: ${svc.pid}` : ''
        return { output: `\x1b[1m● ${svc.name}.service\x1b[0m - ${svc.description}
     Loaded: loaded (/lib/systemd/system/${svc.name}.service; ${svc.autoStart ? 'enabled' : 'disabled'}; vendor preset: enabled)
     Active: ${activeStr}
${pidStr}
   CGroup: /system.slice/${svc.name}.service` }
      }
      if (subcmd === 'enable' && args[1]) {
        const svc = systemServices.find(s => s.name === args[1])
        if (svc) {
          svc.autoStart = true
          return { output: `Created symlink /etc/systemd/system/multi-user.target.wants/${args[1]}.service → /lib/systemd/system/${args[1]}.service.` }
        }
        return { output: `\x1b[31mFailed to enable unit: Unit ${args[1]}.service not found.\x1b[0m` }
      }
      if (subcmd === 'disable' && args[1]) {
        const svc = systemServices.find(s => s.name === args[1])
        if (svc) {
          svc.autoStart = false
          return { output: `Removed /etc/systemd/system/multi-user.target.wants/${args[1]}.service.` }
        }
        return { output: `\x1b[31mFailed to disable unit: Unit ${args[1]}.service not found.\x1b[0m` }
      }
      return { output: `Usage: systemctl [command] [unit]

Commands:
  list-units   List units
  start        Start a unit
  stop         Stop a unit
  restart      Restart a unit
  status       Show unit status
  enable       Enable auto-start
  disable      Disable auto-start` }
    }

    // ═══════════════════════════════
    // UFW FIREWALL
    // ═══════════════════════════════

    case 'ufw': {
      const subcmd = args[0]
      if (subcmd === 'status') {
        if (!ufwEnabled) return { output: `Status: inactive` }
        return { output: `Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
22/tcp (v6)                ALLOW       Anywhere (v6)
80/tcp (v6)                ALLOW       Anywhere (v6)
443/tcp (v6)               ALLOW       Anywhere (v6)` }
      }
      if (subcmd === 'allow' && args[1]) {
        return { output: `Rule added
Rule added (v6)` }
      }
      if (subcmd === 'deny' && args[1]) {
        return { output: `Rule added
Rule added (v6)` }
      }
      if (subcmd === 'enable') {
        ufwEnabled = true
        return { output: `Firewall is active and enabled on system startup` }
      }
      if (subcmd === 'disable') {
        ufwEnabled = false
        return { output: `Firewall stopped and disabled on system startup` }
      }
      return { output: `Usage: ufw [command]

Commands:
  status       Show firewall status
  allow PORT   Allow traffic on port
  deny PORT    Deny traffic on port
  enable       Enable the firewall
  disable      Disable the firewall` }
    }

    // ═══════════════════════════════
    // IP COMMAND
    // ═══════════════════════════════

    case 'ip': {
      if (args[0] === 'addr' || args[0] === 'a') {
        return { output: `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    link/ether 00:1a:2b:3c:4d:5e brd ff:ff:ff:ff:ff:ff
    altname enp0s3
    inet 10.0.0.1/24 brd 10.0.0.255 scope global eth0
       valid_lft forever preferred_lft forever
    inet6 fe80::21a:2bff:fe3c:4d5e/64 scope link
       valid_lft forever preferred_lft forever` }
      }
      if (args[0] === 'link' || args[0] === 'l') {
        return { output: `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN mode DEFAULT group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP mode DEFAULT group default qlen 1000
    link/ether 00:1a:2b:3c:4d:5e brd ff:ff:ff:ff:ff:ff
    altname enp0s3` }
      }
      return { output: `Usage: ip [ command ] [ arguments ]

Commands:
  addr   Show/manage addresses
  link   Show/manage network devices` }
    }

    // ═══════════════════════════════
    // SS COMMAND
    // ═══════════════════════════════

    case 'ss': {
      if (args.includes('-tlnp') || args.includes('-t') || args.includes('-l')) {
        return { output: `State    Recv-Q   Send-Q     Local Address:Port     Peer Address:Port  Process
LISTEN   0        128              0.0.0.0:22            0.0.0.0:*      users:(("sshd",pid=567,fd=3))
LISTEN   0        511              0.0.0.0:80            0.0.0.0:*      users:(("nginx",pid=890,fd=6))
LISTEN   0        128              0.0.0.0:443           0.0.0.0:*      users:(("nginx",pid=890,fd=7))
LISTEN   0        128                 [::]:22               [::]:*      users:(("sshd",pid=567,fd=4))
LISTEN   0        511                 [::]:80               [::]:*      users:(("nginx",pid=890,fd=8))` }
      }
      return { output: `Netid  State   Recv-Q  Send-Q   Local Address:Port    Peer Address:Port` }
    }

    // ═══════════════════════════════
    // DPKG COMMAND
    // ═══════════════════════════════

    case 'dpkg': {
      if (args[0] === '-l' || args[0] === '--list') {
        return { output: `Desired=Unknown/Install/Remove/Purge/Hold
| Status=Not/Inst/Conf-files/Unpacked/halF-conf/Half-inst/trig-aWait/Trig-pend
|/ Err?=(none)/Reinst-required (Status,Err: uppercase=bad)
||/ Name                   Version                     Architecture Description
+++-======================-===========================-============-=================================
ii  adduser                3.137ubuntu1                all          add and remove users and groups
ii  apt                    2.7.14build2                amd64        commandline package manager
ii  base-files             13ubuntu10                  amd64        Debian base system miscellaneous files
ii  base-passwd            3.6.3build1                 amd64        Debian base system master password and group files
ii  bash                   5.2.21-2ubuntu4             amd64        GNU Bourne Again SHell
ii  bsdutils               1:2.39.3-9ubuntu6          amd64        basic utilities from 4.4BSD-Lite
ii  coreutils              9.4-3ubuntu6                amd64        GNU core utilities
ii  curl                   8.5.0-2ubuntu10             amd64        command line tool for transferring data
ii  dpkg                   1.22.6ubuntu5               amd64        Debian package management system
ii  gcc-13-base            13.2.0-23ubuntu4            amd64        GCC, the GNU Compiler Collection (base package)
ii  git                    1:2.43.0-1ubuntu7           amd64        distributed version control system
ii  gpgv                   2.4.4-2ubuntu17             amd64        GNU privacy guard - signature verification tool
ii  grep                   3.11-4build1                amd64        GNU grep, egrep and fgrep
ii  gzip                   1.12-1ubuntu3               amd64        GNU compression utilities
ii  htop                   3.3.0-4build1               amd64        interactive processes viewer
ii  libc6                  2.39-0ubuntu8               amd64        GNU C Library: Shared libraries
ii  libssl3t64             3.2.1-1ubuntu3              amd64        Secure Sockets Layer toolkit - shared libraries
ii  linux-image-generic    6.8.0-45.45                 amd64        Linux kernel image
ii  nano                   7.2-2build1                 amd64        small, friendly text editor
ii  nginx                  1.24.0-2ubuntu7             amd64        high performance web server
ii  openssh-server         1:9.6p1-3ubuntu13           amd64        secure shell (SSH) server
ii  python3                3.12.3-0ubuntu2             amd64        interactive high-level object-oriented language
ii  sudo                   1.9.15p5-3ubuntu5           amd64        Execute commands as another user
ii  tmux                   3.4-2build1                 amd64        terminal multiplexer
ii  ufw                    0.36.2-6                    all          program for managing a netfilter firewall
ii  vim                    2:9.1.0016-1ubuntu7         amd64        Vi IMproved - enhanced vi editor
ii  wget                   1.21.4-1ubuntu4             amd64        retrieves files from the web` }
      }
      return { output: `Usage: dpkg [options] command

Commands:
  -l, --list     List packages
  -i, --install  Install package
  -r, --remove   Remove package
  -s, --status   Show package status` }
    }

    // ═══════════════════════════════
    // CURL COMMAND
    // ═══════════════════════════════

    case 'curl': {
      if (!args[0] && !args.find(a => a.startsWith('http'))) return { output: '\x1b[31mcurl: no URL specified\x1b[0m' }

      const urlArg = args.find(a => a.startsWith('http')) || args[args.length - 1]
      const headersOnly = args.includes('-I') || args.includes('--head')
      const silent = args.includes('-s') || args.includes('--silent')

      const domain = urlArg.replace(/^https?:\/\//, '').split('/')[0]
      const site = simulatedWebsites[domain]

      if (headersOnly) {
        const hdrs = site ? site.headers : {
          'Content-Type': 'text/html; charset=UTF-8',
          'Server': 'nginx/1.24.0 (Ubuntu)',
          'Content-Length': '4096',
          'Date': new Date().toUTCString(),
        }
        return { output: `HTTP/1.1 200 OK\n${Object.entries(hdrs).map(([k, v]) => `${k}: ${v}`).join('\n')}` }
      }

      if (silent) {
        return { output: site ? site.content : `<!DOCTYPE html>\n<html><head><title>${domain}</title></head>\n<body><h1>${domain}</h1><p>Generic response from ${domain}</p></body>\n</html>` }
      }

      const content = site ? site.content : `<!DOCTYPE html>\n<html><head><title>${domain}</title></head>\n<body><h1>${domain}</h1><p>Generic response from ${domain}</p></body>\n</html>`
      const contentLength = Buffer.byteLength(content, 'utf8')

      return { output: `  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  ${contentLength}  100  ${contentLength}    0     0  ${contentLength}      0  0:00:01  0:00:01 --:--:-- ${contentLength}

${content}` }
    }

    // ═══════════════════════════════
    // WGET COMMAND
    // ═══════════════════════════════

    case 'wget': {
      if (!args[0]) return { output: '\x1b[31mwget: missing URL\x1b[0m' }
      const urlArg = args.find(a => a.startsWith('http')) || args[args.length - 1]
      const domain = urlArg.replace(/^https?:\/\//, '').split('/')[0]
      const pathPart = urlArg.replace(/^https?:\/\//, '').split('/').slice(1).join('/')
      const fileName = pathPart ? pathPart.split('/').pop()! : 'index.html'

      const site = simulatedWebsites[domain]
      const content = site ? site.content : `<!DOCTYPE html>\n<html><head><title>${domain}</title></head>\n<body><h1>${domain}</h1><p>Generic response</p></body>\n</html>`
      const contentLength = Buffer.byteLength(content, 'utf8')

      // Save file to filesystem
      const filePath = resolvePath(fileName, session.cwd)
      const { parent, name } = getParentAndName(filePath)
      if (parent && parent.children) {
        parent.children.set(name, createFile(name, '-rw-r--r--', session.username, session.username, content))
      }

      return { output: `--${new Date().toISOString()}--  ${urlArg}
Resolving ${domain} (${domain})... 93.184.216.34
Connecting to ${domain} (${domain})|93.184.216.34|:80... connected.
HTTP request sent, awaiting response... 200 OK
Length: ${contentLength} [text/html]
Saving to: '${fileName}'

${fileName}          100%[===================>]  ${contentLength}  --.-KB/s    in 0s

${new Date().toISOString()} - '${fileName}' saved [${contentLength}/${contentLength}]` }
    }

    // ═══════════════════════════════
    // STARTX COMMAND
    // ═══════════════════════════════

    case 'startx': {
      return { output: `\x1b[33mX.Org X Server 1.21.1.11
X Protocol Version 11, Revision 0
Current Operating System: Linux ubuntu-server 6.8.0-45-generic x86_64
Kernel command line: BOOT_IMAGE=/boot/vmlinuz-6.8.0-45-generic root=/dev/sda1
xorg-server 2:21.1.12-1ubuntu1\x1b[0m

\x1b[32m(II) Module "glx" loaded\x1b[0m
\x1b[32m(II) Module "fb" loaded\x1b[0m
\x1b[32m(II) Setting vga mode\x1b[0m
\x1b[32m(II) xfce4-session started\x1b[0m

\x1b[1;36m╔══════════════════════════════════════════════════════════════════════════════════════════╗\x1b[0m
\x1b[1;36m║\x1b[0m \x1b[1;37m Applications  ▾ │ Places ▾ │ System ▾ │                    │ 🔔 📶 🔋 12:34 \x1b[1;36m║\x1b[0m
\x1b[1;36m╠══════════════════════════════════════════════════════════════════════════════════════════╣\x1b[0m
\x1b[1;36m║\x1b[0m                                                                                            \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  \x1b[1;34m 📁 Documents\x1b[0m    \x1b[1;36m╔══════════════════════════════════════════════════╗\x1b[0m  \x1b[1;36m╔═══════════════╗\x1b[0m  \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  \x1b[1;34m 📁 Downloads\x1b[0m    \x1b[1;36m║\x1b[0m \x1b[1;32mubuntu@ubuntu-server: ~\x1b[0m                         \x1b[1;36m║\x1b[0m  \x1b[1;36m║\x1b[0m \x1b[1;33mSystem Monitor\x1b[0m \x1b[1;36m║\x1b[0m  \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  \x1b[1;32m 💻 Terminal\x1b[0m     \x1b[1;36m╠══════════════════════════════════════════════════╣\x1b[0m  \x1b[1;36m╠═══════════════╣\x1b[0m  \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  \x1b[36m 📂 File Manager\x1b[0m \x1b[1;36m║\x1b[0m $ ls -lah                                 \x1b[1;36m║\x1b[0m  \x1b[1;36m║\x1b[0m CPU: 12.3%     \x1b[1;36m║\x1b[0m  \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                   \x1b[1;36m║\x1b[0m total 32K                                   \x1b[1;36m║\x1b[0m  \x1b[1;36m║\x1b[0m MEM: 51%       \x1b[1;36m║\x1b[0m  \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                   \x1b[1;36m║\x1b[0m drwxr-xr-x  ubuntu ubuntu  .              \x1b[1;36m║\x1b[0m  \x1b[1;36m║\x1b[0m DISK: 14.2%    \x1b[1;36m║\x1b[0m  \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                   \x1b[1;36m║\x1b[0m drwxr-xr-x  ubuntu ubuntu  ..             \x1b[1;36m║\x1b[0m  \x1b[1;36m║\x1b[0m NET: 1 Gbps    \x1b[1;36m║\x1b[0m  \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                   \x1b[1;36m║\x1b[0m drwxr-xr-x  ubuntu ubuntu  documents/     \x1b[1;36m║\x1b[0m  \x1b[1;36m╚═══════════════╝\x1b[0m  \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                   \x1b[1;36m║\x1b[0m drwxr-xr-x  ubuntu ubuntu  projects/      \x1b[1;36m║\x1b[0m                           \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                   \x1b[1;36m║\x1b[0m drwxr-xr-x  ubuntu ubuntu  downloads/     \x1b[1;36m║\x1b[0m                           \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                   \x1b[1;36m║\x1b[0m $ _                                        \x1b[1;36m║\x1b[0m                           \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                   \x1b[1;36m╚══════════════════════════════════════════════════╝\x1b[0m                           \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m                                                                                            \x1b[1;36m║\x1b[0m
\x1b[1;36m╠══════════════════════════════════════════════════════════════════════════════════════════╣\x1b[0m
\x1b[1;36m║\x1b[0m  🐧 Ubuntu 24.04 LTS │ bash │ 12:34 PM │ CPU: 12% │ MEM: 51% │ eth0: 10.0.0.1         \x1b[1;36m║\x1b[0m
\x1b[1;36m╚══════════════════════════════════════════════════════════════════════════════════════════╝\x1b[0m` }
    }

    // ═══════════════════════════════
    // STAT, FILE, DU, LN, DIFF
    // ═══════════════════════════════

    case 'stat': {
      if (!args[0]) return { output: '\x1b[31mstat: missing operand\x1b[0m' }
      const filePath = resolvePath(args[0], session.cwd)
      const node = getNodeAtPath(filePath)
      if (!node) return { output: `\x1b[31mstat: cannot stat '${args[0]}': No such file or directory\x1b[0m` }
      const ftype = node.type === 'directory' ? 'directory' : node.type === 'symlink' ? 'symbolic link' : node.type === 'device' ? 'device' : 'regular file'
      return { output: `  File: ${args[0]}
  Size: ${node.size}\tBlocks: ${Math.ceil(node.size/512)}\t${ftype}
Access: (${node.permissions})\tUid: (${node.owner})\tGid: (${node.group})
Access: ${node.modified.toISOString()}
Modify: ${node.modified.toISOString()}
Change: ${node.modified.toISOString()}` }
    }

    case 'file': {
      if (!args[0]) return { output: '\x1b[31mfile: missing operand\x1b[0m' }
      const filePath = resolvePath(args[0], session.cwd)
      const node = getNodeAtPath(filePath)
      if (!node) return { output: `\x1b[31mfile: ${args[0]}: cannot open\x1b[0m` }
      if (node.type === 'directory') return { output: `${args[0]}: directory` }
      if (node.type === 'symlink') return { output: `${args[0]}: symbolic link to '${node.target}'` }
      if (node.type === 'device') return { output: `${args[0]}: device` }
      const content = node.content || ''
      if (content.startsWith('#!/bin/')) return { output: `${args[0]}: Bourne-Again shell script, ASCII text executable` }
      if (content.startsWith('<!DOCTYPE') || content.startsWith('<html')) return { output: `${args[0]}: HTML document, UTF-8 Unicode text` }
      if (content.startsWith('{') || content.startsWith('[')) return { output: `${args[0]}: JSON data, UTF-8 Unicode text` }
      if (content.includes('function') || content.includes('const ') || content.includes('import ')) return { output: `${args[0]}: source code, UTF-8 Unicode text` }
      return { output: `${args[0]}: ASCII text` }
    }

    case 'du': {
      const targetPath = args[0] ? resolvePath(args[0], session.cwd) : session.cwd
      const node = getNodeAtPath(targetPath)
      if (!node) return { output: `\x1b[31mdu: cannot access '${args[0]}'\x1b[0m` }
      function calcSize(n: FileSystemNode): number {
        if (n.type === 'directory' && n.children) {
          let total = n.size
          for (const child of n.children.values()) total += calcSize(child)
          return total
        }
        return n.size
      }
      const human = args.includes('-h') || args.includes('-sh')
      const totalSize = calcSize(node)
      const format = (s: number) => human ? s >= 1073741824 ? `${(s/1073741824).toFixed(1)}G` : s >= 1048576 ? `${(s/1048576).toFixed(1)}M` : s >= 1024 ? `${(s/1024).toFixed(1)}K` : `${s}` : `${s}`
      return { output: `${format(totalSize)}\t${targetPath}` }
    }

    case 'ln': {
      if (args.length < 2) return { output: '\x1b[31mln: missing operand\x1b[0m' }
      const symbolic = args.includes('-s')
      const srcArg = args.find(a => !a.startsWith('-')) || args[args.length - 2]
      const dstArg = args[args.length - 1]
      if (symbolic) {
        const dstPath = resolvePath(dstArg, session.cwd)
        const { parent, name } = getParentAndName(dstPath)
        if (!parent || !parent.children) return { output: `\x1b[31mln: cannot create '${dstArg}'\x1b[0m` }
        parent.children.set(name, createSymlink(name, srcArg, session.username))
        return { output: '' }
      }
      return { output: `\x1b[31mln: failed to create hard link '${dstArg}': Operation not permitted\x1b[0m` }
    }

    case 'diff': {
      if (args.length < 2) return { output: '\x1b[31mdiff: need two files\x1b[0m' }
      const node1 = getNodeAtPath(resolvePath(args[0], session.cwd))
      const node2 = getNodeAtPath(resolvePath(args[1], session.cwd))
      if (!node1 || node1.type === 'directory') return { output: `\x1b[31mdiff: ${args[0]}: Not a file\x1b[0m` }
      if (!node2 || node2.type === 'directory') return { output: `\x1b[31mdiff: ${args[1]}: Not a file\x1b[0m` }
      const lines1 = (node1.content || '').split('\n')
      const lines2 = (node2.content || '').split('\n')
      const maxLen = Math.max(lines1.length, lines2.length)
      const diffs: string[] = []
      for (let i = 0; i < maxLen; i++) {
        const l1 = lines1[i] ?? ''
        const l2 = lines2[i] ?? ''
        if (l1 !== l2) {
          diffs.push(`\x1b[31m< ${l1}\x1b[0m`)
          diffs.push(`\x1b[32m> ${l2}\x1b[0m`)
        }
      }
      return { output: diffs.length > 0 ? diffs.join('\n') : '\x1b[32mFiles are identical\x1b[0m' }
    }

    case 'sort': {
      if (!args[0]) return { output: '\x1b[31msort: missing operand\x1b[0m' }
      const node = getNodeAtPath(resolvePath(args[0], session.cwd))
      if (!node || node.type === 'directory') return { output: `\x1b[31msort: ${args[0]}: No such file\x1b[0m` }
      const reverse = args.includes('-r')
      const numeric = args.includes('-n')
      const lines = (node.content || '').split('\n').filter(Boolean)
      lines.sort((a, b) => numeric ? parseFloat(a) - parseFloat(b) : a.localeCompare(b))
      if (reverse) lines.reverse()
      return { output: lines.join('\n') }
    }

    case 'uniq': {
      if (!args[0]) return { output: '\x1b[31muniq: missing operand\x1b[0m' }
      const node = getNodeAtPath(resolvePath(args[0], session.cwd))
      if (!node || node.type === 'directory') return { output: `\x1b[31muniq: ${args[0]}: No such file\x1b[0m` }
      const lines = (node.content || '').split('\n').filter(Boolean)
      const unique = lines.filter((line, i) => i === 0 || line !== lines[i - 1])
      return { output: unique.join('\n') }
    }

    case 'sed': {
      if (args.length < 3) return { output: '\x1b[31msed: usage: sed s/old/new/ file\x1b[0m' }
      const expr = args[0]
      const filePath = resolvePath(args[1], session.cwd)
      const node = getNodeAtPath(filePath)
      if (!node || node.type === 'directory') return { output: `\x1b[31msed: ${args[1]}: No such file\x1b[0m` }
      const match = expr.match(/^s\/(.+?)\/(.*)\/([gi]?)$/)
      if (!match) return { output: '\x1b[31msed: invalid expression\x1b[0m' }
      const [, pattern, replacement, flags] = match
      const regex = new RegExp(pattern, flags)
      node.content = (node.content || '').replace(regex, replacement)
      node.modified = new Date()
      return { output: '' }
    }

    case 'awk': {
      if (args.length < 2) return { output: '\x1b[31mawk: usage: awk \'{print $1}\' file\x1b[0m' }
      const program = args[0].replace(/^'|'$/g, '')
      const filePath = resolvePath(args[args.length - 1], session.cwd)
      const node = getNodeAtPath(filePath)
      if (!node || node.type === 'directory') return { output: `\x1b[31mawk: cannot open file\x1b[0m` }
      const printMatch = program.match(/\{print\s+\$(\d+)\}/)
      if (!printMatch) return { output: '\x1b[33mawk: simplified mode - supports {print $N}\x1b[0m' }
      const fieldIdx = parseInt(printMatch[1]) - 1
      const lines = (node.content || '').split('\n').filter(Boolean)
      const result = lines.map(line => {
        const fields = line.split(/\s+/)
        return fields[fieldIdx] || ''
      })
      return { output: result.join('\n') }
    }

    case 'tee': {
      if (!args[0]) return { output: '\x1b[31mtee: missing operand\x1b[0m' }
      const append = args.includes('-a')
      const fileName = args.find(a => !a.startsWith('-')) || ''
      if (!fileName) return { output: '\x1b[31mtee: missing file\x1b[0m' }
      return { output: `\x1b[32mOutput will be ${append ? 'appended to' : 'written to'} '${fileName}'\x1b[0m` }
    }

    case 'xz': case 'gzip': case 'compress': {
      if (!args[0]) return { output: `\x1b[31m${cmd}: missing operand\x1b[0m` }
      const filePath = resolvePath(args[0], session.cwd)
      const node = getNodeAtPath(filePath)
      if (!node || node.type === 'directory') return { output: `\x1b[31m${cmd}: ${args[0]}: No such file\x1b[0m` }
      node.compressed = true
      node.size = Math.floor(node.size * 0.35)
      return { output: `\x1b[32m${args[0]}: compressed (ratio: 65% reduction)\x1b[0m` }
    }

    case 'unxz': case 'gunzip': case 'decompress': {
      if (!args[0]) return { output: `\x1b[31m${cmd}: missing operand\x1b[0m` }
      const filePath = resolvePath(args[0], session.cwd)
      const node = getNodeAtPath(filePath)
      if (!node) return { output: `\x1b[31m${cmd}: ${args[0]}: No such file\x1b[0m` }
      if (!node.compressed) return { output: `\x1b[33m${cmd}: ${args[0]}: Not compressed\x1b[0m` }
      node.compressed = false
      node.size = Math.floor(node.size / 0.35)
      return { output: `\x1b[32m${args[0]}: decompressed\x1b[0m` }
    }

    case 'md5sum': case 'sha256sum': case 'sha512sum': {
      if (!args[0]) return { output: `\x1b[31m${cmd}: missing operand\x1b[0m` }
      const filePath = resolvePath(args[0], session.cwd)
      const node = getNodeAtPath(filePath)
      if (!node || node.type === 'directory') return { output: `\x1b[31m${cmd}: ${args[0]}: No such file\x1b[0m` }
      const content = node.content || ''
      let hash = 0
      for (let i = 0; i < content.length; i++) {
        hash = ((hash << 5) - hash) + content.charCodeAt(i)
        hash = hash & hash
      }
      const hashLen = cmd === 'md5sum' ? 32 : cmd === 'sha256sum' ? 64 : 128
      const hashStr = Math.abs(hash).toString(16).padStart(8, '0').repeat(Math.ceil(hashLen / 8)).slice(0, hashLen)
      return { output: `${hashStr}  ${args[0]}` }
    }

    case 'chown': {
      if (args.length < 2) return { output: '\x1b[31mchown: missing operand\x1b[0m' }
      const [owner, group] = args[0].split(':')
      const filePath = resolvePath(args[1], session.cwd)
      const node = getNodeAtPath(filePath)
      if (!node) return { output: `\x1b[31mchown: cannot access '${args[1]}'\x1b[0m` }
      node.owner = owner
      if (group) node.group = group
      return { output: '' }
    }

    case 'chgrp': {
      if (args.length < 2) return { output: '\x1b[31mchgrp: missing operand\x1b[0m' }
      const filePath = resolvePath(args[1], session.cwd)
      const node = getNodeAtPath(filePath)
      if (!node) return { output: `\x1b[31mchgrp: cannot access '${args[1]}'\x1b[0m` }
      node.group = args[0]
      return { output: '' }
    }

    case 'tree': {
      const targetPath = args[0] ? resolvePath(args[0], session.cwd) : session.cwd
      const node = getNodeAtPath(targetPath)
      if (!node || node.type !== 'directory') return { output: `\x1b[31mtree: ${targetPath}: Not a directory\x1b[0m` }
      const lines: string[] = [targetPath]
      function walk(nd: FileSystemNode, prefix: string) {
        const entries = nd.children ? Array.from(nd.children.values()) : []
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
      const host = args[0] || 'ubuntu.com'
      return { output: `PING ${host} (93.184.216.34) 56(84) bytes of data.
64 bytes from ${host}: icmp_seq=1 ttl=56 time=3.2 ms
64 bytes from ${host}: icmp_seq=2 ttl=56 time=2.8 ms
64 bytes from ${host}: icmp_seq=3 ttl=56 time=3.1 ms

--- ${host} ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2003ms
rtt min/avg/max/mdev = 2.800/3.033/3.200/0.171 ms` }
    }

    // ═══════════════════════════════
    // NETWORK TOOLS
    // ═══════════════════════════════

    case 'ssh': {
      if (!args[0]) return { output: '\x1b[31mssh: missing destination\x1b[0m' }
      return { output: `The authenticity of host '${args[0]}' can't be established.
ED25519 key fingerprint is SHA256:a4Bc6DeF8gHi0JkL2mNo4PqRsTuVwXy6zA8bCdEfGh
Are you sure you want to continue connecting (yes/no/[fingerprint])? ` }
    }

    case 'scp': {
      if (args.length < 2) return { output: '\x1b[31mscp: missing arguments\x1b[0m' }
      return { output: `\x1b[32mSecure copy initiated...\x1b[0m
Progress: ████████████████████ 100%
\x1b[32mTransfer complete.\x1b[0m` }
    }

    case 'kill': {
      if (!args[0]) return { output: '\x1b[31mkill: missing PID\x1b[0m' }
      return { output: `\x1b[32mProcess ${args[0]} terminated.\x1b[0m` }
    }

    case 'killall': {
      if (!args[0]) return { output: '\x1b[31mkillall: missing process name\x1b[0m' }
      return { output: `\x1b[32mAll instances of '${args[0]}' terminated.\x1b[0m` }
    }

    case 'reboot': {
      return { output: `\x1b[33mSystem is going down for reboot NOW!\x1b[0m` }
    }

    case 'shutdown': {
      return { output: `\x1b[33mSystem is going down for power-off NOW!\x1b[0m` }
    }

    case 'dmesg': {
      return { output: `[    0.000000] Linux version 6.8.0-45-generic (buildd@lcy02-amd64-051) (x86_64-linux-gnu-gcc-13 (Ubuntu 13.2.0-23ubuntu4) 13.2.0, GNU ld (GNU Binutils for Ubuntu) 2.42) #45-Ubuntu SMP x86_64
[    0.000000] Command line: BOOT_IMAGE=/boot/vmlinuz-6.8.0-45-generic root=/dev/sda1
[    0.000001] BIOS-provided physical RAM map:
[    0.000002] BIOS-e820: [mem 0x0000000000000000-0x000000000009fbff] usable
[    0.001234] x86/fpu: x87 FPU on chip
[    0.002456] ACPI: RSDP 0x00000000000F5A00 000024 (v02 BOCHS )
[    0.003789] Memory: 16384MB available
[    0.004012] CPU: Intel(R) Xeon(R) CPU @ 2.80GHz (4 cores)
[    0.005234] NET: Registered PF_INET6 protocol family
[    0.006456] EXT4-fs (sda1): mounted filesystem
[    0.007890] systemd[1]: systemd 255.4-1ubuntu8 running in system mode
[    0.009012] systemd[1]: Detected architecture x86-64` }
    }

    case 'lsof': {
      if (!args[0]) return { output: `COMMAND    PID   USER   FD   TYPE   DEVICE   SIZE/OFF   NAME
bash       142   ubuntu  0r   CHR    0,6      0t0        /dev/tty0
bash       142   ubuntu  1w   CHR    0,6      0t0        /dev/tty0
bash       142   ubuntu  2w   CHR    0,6      0t0        /dev/tty0
nginx      890   www-data 4u  IPv4   12643    0t0        TCP *:80
sshd       567   root   3u   IPv4   12892    0t0        TCP *:22` }
      return { output: `\x1b[33mUse lsof without arguments for a full list.\x1b[0m` }
    }

    case 'sysctl': {
      if (args.length === 0) {
        return { output: `kernel.osrelease = 6.8.0-45-generic
kernel.ostype = Linux
kernel.hostname = ubuntu-server
kernel.version = #45-Ubuntu SMP x86_64
kernel.pid_max = 4194304
net.ipv4.ip_forward = 0
net.ipv4.tcp_syncookies = 1
net.ipv4.icmp_echo_ignore_all = 0
net.core.somaxconn = 4096
vm.swappiness = 10
vm.overcommit_memory = 0
fs.file-max = 9223372036854775807` }
      }
      if (args[0] === '-w' && args[1]) {
        return { output: `${args[1]}` }
      }
      return { output: `\x1b[33mUsage: sysctl [-w] [variable=value]\x1b[0m` }
    }

    // ═══════════════════════════════
    // DOCKER
    // ═══════════════════════════════

    case 'docker': {
      if (args[0] === 'ps' || args.length === 0) {
        return { output: `CONTAINER ID   IMAGE          STATUS      PORTS                  NAMES
a1b2c3d4e5f6   nginx:latest   Up 2h        0.0.0.0:80->80/tcp     web-server
f6e5d4c3b2a1   redis:7        Up 2h        0.0.0.0:6379->6379     cache
1a2b3c4d5e6f   node:22        Up 45m       0.0.0.0:3000->3000     app-server` }
      }
      if (args[0] === 'images') {
        return { output: `REPOSITORY   TAG       SIZE
nginx        latest    187MB
redis        7         138MB
node         22        1.1GB
python       3.12      1.0GB
postgres     16        432MB` }
      }
      if (args[0] === 'run' && args[1]) {
        return { output: `\x1b[32mUnable to find image '${args[1]}' locally\x1b[0m
latest: Pulling from library/${args[1]}
a480a496ba95: Pull complete
...
Digest: sha256:a1b2c3d4e5f6
Status: Downloaded newer image
Container started on port ${8000 + Math.floor(Math.random() * 1000)}` }
      }
      if (args[0] === 'build' && args[1]) {
        return { output: `\x1b[32mBuilding image '${args[1]}'...\x1b[0m
Step 1/5 : FROM ubuntu:24.04
Step 2/5 : COPY . /app
Step 3/5 : RUN apt-get install -y deps
Step 4/5 : EXPOSE 8080
Step 5/5 : CMD ["./start"]
\x1b[32mSuccessfully built image '${args[1]}'\x1b[0m` }
      }
      return { output: `\x1b[33mUsage: docker [ps|images|run|build] [args]\x1b[0m` }
    }

    // ═══════════════════════════════
    // GIT
    // ═══════════════════════════════

    case 'git': {
      if (args[0] === 'status' || args.length === 0) {
        return { output: `On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  \x1b[31mmodified:   src/app.ts\x1b[0m
  \x1b[31mmodified:   config/nginx.conf\x1b[0m

Untracked files:
  \x1b[31mnew-file:  src/utils.ts\x1b[0m
  \x1b[31mnew-file:  README.md\x1b[0m` }
      }
      if (args[0] === 'log') {
        const commits = [
          { hash: 'a1b2c3d', msg: 'feat: add user authentication module', time: '2 hours ago' },
          { hash: 'e4f5g6h', msg: 'fix: nginx config for SSL redirect', time: '5 hours ago' },
          { hash: 'i7j8k9l', msg: 'feat: add Docker compose setup', time: '1 day ago' },
          { hash: 'm0n1o2p', msg: 'docs: update README with setup instructions', time: '2 days ago' },
          { hash: 'q3r4s5t', msg: 'chore: update dependencies', time: '3 days ago' },
        ]
        return { output: commits.map(c => `\x1b[33m${c.hash}\x1b[0m ${c.msg} \x1b[90m(${c.time})\x1b[0m`).join('\n') }
      }
      if (args[0] === 'branch') {
        return { output: `* \x1b[32mmain\x1b[0m\n  develop\n  feature/auth\n  feature/docker-setup\n  hotfix/ssl-config` }
      }
      if (args[0] === 'diff') {
        return { output: `\x1b[33mdiff --git a/src/app.ts b/src/app.ts\x1b[0m
index a1b2c3d..e4f5g6h 100644
--- a/src/app.ts
+++ b/src/app.ts
@@ -42,6 +42,8 @@
   const auth = new AuthModule();
+  auth.enableJWT();
+  auth.setTokenExpiry('24h');` }
      }
      return { output: `\x1b[33musage: git [status|log|branch|diff] [args]\x1b[0m` }
    }

    // ═══════════════════════════════
    // USER MANAGEMENT
    // ═══════════════════════════════

    case 'useradd': {
      if (!args[0]) return { output: '\x1b[31museradd: missing username\x1b[0m' }
      return { output: `\x1b[32mUser '${args[0]}' created (UID: ${1001 + Math.floor(Math.random() * 100)})\x1b[0m` }
    }

    case 'usermod': {
      if (!args[0]) return { output: '\x1b[31musermod: missing arguments\x1b[0m' }
      return { output: `\x1b[32mUser modified.\x1b[0m` }
    }

    case 'passwd': {
      if (!args[0]) return { output: `\x1b[33mChanging password for ${session.username}.\nNew password: \x1b[0m` }
      return { output: `\x1b[32mPassword for '${args[0]}' updated.\x1b[0m` }
    }

    // ═══════════════════════════════
    // OTHER COMMANDS
    // ═══════════════════════════════

    case 'watch': {
      if (!args[0]) return { output: '\x1b[31mwatch: missing command\x1b[0m' }
      const result = executeSingleCommand(args[0], args.slice(1), session, '')
      return { output: `Every 2.0s: ${args.join(' ')}\n${new Date().toLocaleString()}\n\n${result.output}` }
    }

    case 'sleep':
      return { output: `` }

    case 'env': {
      return { output: Object.entries(session.env).map(([k, v]) => `${k}=${v}`).join('\n') }
    }

    case 'export': {
      if (args.length === 0) return { output: Object.entries(session.env).map(([k, v]) => `declare -x ${k}="${v}"`).join('\n') }
      const expr = args.join(' ')
      const eqIdx = expr.indexOf('=')
      if (eqIdx > 0) {
        const key = expr.slice(0, eqIdx).trim()
        const val = expr.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
        session.env[key] = val
        return { output: '' }
      }
      return { output: '' }
    }

    case 'alias': {
      if (args.length === 0) {
        return { output: Object.entries(session.aliases).map(([k, v]) => `alias ${k}='${v}'`).join('\n') || 'No aliases defined.' }
      }
      const expr = args.join(' ')
      const eqIdx = expr.indexOf('=')
      if (eqIdx > 0) {
        const key = expr.slice(0, eqIdx).trim()
        const val = expr.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
        session.aliases[key] = val
        return { output: '' }
      }
      return { output: `\x1b[33mUsage: alias name='command'\x1b[0m` }
    }

    default:
      if (cmd === '') return { output: '' }
      return { output: `\x1b[31mbash: ${cmd}: command not found\x1b[0m` }
  }
}

function generateProcesses(): Process[] {
  const base: Process[] = [
    { pid: 1, name: 'systemd', user: 'root', cpu: 0.0, memory: 0.1, status: 'running', priority: 0, threads: 1, startTime: 0, cmd: '/sbin/init' },
    { pid: 123, name: 'dbus-daemon', user: 'root', cpu: 0.0, memory: 0.2, status: 'running', priority: 0, threads: 1, startTime: 0, cmd: 'dbus-daemon --system' },
    { pid: 210, name: 'rsyslogd', user: 'syslog', cpu: 0.0, memory: 0.2, status: 'running', priority: 0, threads: 4, startTime: 0, cmd: '/usr/sbin/rsyslogd -n' },
    { pid: 234, name: 'ufw', user: 'root', cpu: 0.1, memory: 0.3, status: 'running', priority: 0, threads: 2, startTime: 0, cmd: '/usr/sbin/ufw' },
    { pid: 345, name: 'cron', user: 'root', cpu: 0.0, memory: 0.1, status: 'running', priority: 0, threads: 1, startTime: 0, cmd: '/usr/sbin/cron -f' },
    { pid: 432, name: 'accounts-daemon', user: 'root', cpu: 0.0, memory: 0.3, status: 'running', priority: 0, threads: 3, startTime: 0, cmd: '/usr/lib/accountsservice/accounts-daemon' },
    { pid: 456, name: 'NetworkManager', user: 'root', cpu: 0.1, memory: 0.6, status: 'running', priority: 0, threads: 4, startTime: 0, cmd: '/usr/sbin/NetworkManager' },
    { pid: 567, name: 'sshd', user: 'root', cpu: 0.0, memory: 0.3, status: 'running', priority: 0, threads: 1, startTime: 0, cmd: 'sshd: /usr/sbin/sshd -D' },
    { pid: 678, name: 'snapd', user: 'root', cpu: 0.2, memory: 1.2, status: 'running', priority: 0, threads: 12, startTime: 0, cmd: '/usr/lib/snapd/snapd' },
    { pid: 890, name: 'nginx', user: 'www-data', cpu: 0.3, memory: 0.8, status: 'running', priority: 0, threads: 4, startTime: 0, cmd: 'nginx: worker process' },
    { pid: 142, name: 'bash', user: 'ubuntu', cpu: 0.0, memory: 0.4, status: 'running', priority: 0, threads: 1, startTime: Math.floor(Date.now()/1000) - 300, cmd: '-bash' },
  ]
  return base
}

// ═══════════════════════════════════════════
// SOCKET.IO CONNECTION HANDLING
// ═══════════════════════════════════════════

io.on('connection', (socket) => {
  console.log(`[Ubuntu] Connection: ${socket.id}`)
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
      hostname: 'ubuntu-server',
      username: 'ubuntu',
      cwd: '/home/ubuntu',
      connectedAt: new Date(),
      pidCounter: 200,
      env: {
        PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
        HOME: '/home/ubuntu',
        USER: 'ubuntu',
        SHELL: '/bin/bash',
        TERM: 'xterm-256color',
        LANG: 'en_US.UTF-8',
      },
      history: [],
      aliases: {
        ll: 'ls -lah --color=auto',
        la: 'ls -A --color=auto',
        cls: 'clear',
        update: 'sudo apt update && sudo apt upgrade',
        'cd..': 'cd ..',
      },
      variables: {},
      runningProcesses: generateProcesses(),
      lastActivity: new Date(),
      isRoot: false,
    }

    sessions.set(socket.id, session)

    socket.emit('authenticated', {
      sessionId: session.id,
      hostname: session.hostname,
      username: session.username,
      plan: {
        name: 'Ubuntu Server',
        cpu: 'Intel Xeon (4 cores) @ 2.80GHz',
        ram: '16 GB DDR4',
        storage: '64 GB SSD (ext4)',
        bandwidth: '1 Gbps',
        os: 'Ubuntu 24.04 LTS',
        region: 'us-east-1',
        security: 'Standard',
      },
      services: systemServices,
      network: networkInterfaces,
      firewall: firewallRules,
      packages: packageDB,
    })

    console.log(`[Ubuntu] Authenticated: ${email} (session: ${session.id.slice(0,8)})`)
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
      'find', 'grep', 'chmod', 'chown', 'chgrp', 'whoami', 'hostname', 'uname', 'date', 'uptime', 'free',
      'df', 'ps', 'top', 'neofetch', 'apt', 'systemctl', 'ufw', 'ip', 'ss', 'dpkg',
      'alias', 'export', 'env', 'tree', 'head', 'tail',
      'wc', 'ping', 'clear', 'exit', 'history', 'id', 'which', 'man', 'sudo',
      'stat', 'file', 'du', 'ln', 'diff', 'sort', 'uniq', 'sed', 'awk', 'tee',
      'gzip', 'gunzip', 'xz', 'unxz', 'compress', 'decompress',
      'md5sum', 'sha256sum', 'sha512sum',
      'docker', 'git', 'curl', 'wget', 'ssh', 'scp',
      'kill', 'killall', 'reboot', 'shutdown', 'dmesg', 'lsof', 'sysctl',
      'watch', 'sleep', 'useradd', 'usermod', 'passwd', 'startx',
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
      console.log(`[Ubuntu] Disconnected: ${session.email}`)
    }
  })

  socket.on('error', (error) => {
    console.error(`[Ubuntu] Socket error (${socket.id}):`, error)
  })
})

// Metrics broadcast every 2 seconds
setInterval(() => {
  io.emit('metrics', getSystemMetrics())
}, 2000)

const PORT = 3003
httpServer.listen(PORT, () => {
  console.log(`[Ubuntu] Server running on port ${PORT}`)
  console.log(`[Ubuntu] Ubuntu 24.04 LTS (Noble Numbat)`)
  console.log(`[Ubuntu] Kernel 6.8.0-45-generic`)
})
