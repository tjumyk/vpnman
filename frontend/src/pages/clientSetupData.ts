import type { Locale } from '@/i18n/translations'

export type SetupSection = {
  key: string
  label: string
  title: string
  steps: string[]
  links?: { label: string; href: string }[]
}

type SetupSectionsByLocale = Record<Locale, SetupSection[]>

const sectionsByLocale: SetupSectionsByLocale = {
  en: [
  {
    key: 'Windows',
    label: 'Windows',
    title: 'Setup in Windows',
    steps: [
      'Download Windows installer from OpenVPN community downloads page.',
      'Install OpenVPN with the downloaded installer.',
      'Download your client configuration file from this portal.',
      'Move the file to C:\\Program Files\\OpenVPN\\config.',
      'Open the OpenVPN tray app and choose Connect for the imported profile.',
    ],
    links: [{ label: 'OpenVPN Community Downloads Page', href: 'https://openvpn.net/community-downloads/' }],
  },
  {
    key: 'Mac OS',
    label: 'Mac OS',
    title: 'Setup in Mac OS',
    steps: [
      'Install a client that supports OpenVPN protocol (Tunnelblick recommended).',
      'Download your client configuration file from this portal.',
      'Double-click the config file to import it.',
      'Use the Tunnelblick menu in the top bar to connect.',
      'If asked for same public IP check, disable it for split-tunnel behavior.',
    ],
    links: [{ label: 'Tunnelblick Homepage', href: 'https://tunnelblick.net/' }],
  },
  {
    key: 'Linux',
    label: 'Linux',
    title: 'Setup in Linux',
    steps: [
      'Install NetworkManager OpenVPN plugin (e.g. sudo apt-get install network-manager-openvpn-gnome).',
      'Download your Linux client configuration file from this portal.',
      'Import the configuration into your Network Manager.',
      'Enable split-tunnel option: use this connection only for resources on its network.',
      'Connect from the network menu.',
      'Alternative CLI: sudo openvpn --config YOUR_CLIENT_CONFIG.ovpn',
    ],
    links: [{ label: 'OpenVPN Community Downloads Page', href: 'https://openvpn.net/community-downloads/' }],
  },
  {
    key: 'iOS',
    label: 'iOS',
    title: 'Setup in iOS',
    steps: [
      'Install OpenVPN Connect from Apple App Store.',
      'Download your client configuration file from this portal.',
      'Open OpenVPN Connect and import the file.',
      'Start connection from imported profile.',
    ],
    links: [{ label: 'OpenVPN Connect (App Store)', href: 'https://apps.apple.com/us/app/id590379981' }],
  },
  {
    key: 'Android',
    label: 'Android',
    title: 'Setup in Android',
    steps: [
      'Install OpenVPN Connect from Google Play.',
      'Download your client configuration file from this portal.',
      'Open OpenVPN Connect and import the file.',
      'Start connection from imported profile.',
    ],
    links: [{ label: 'OpenVPN Connect (Google Play)', href: 'https://play.google.com/store/apps/details?id=net.openvpn.openvpn' }],
  },
  {
    key: 'Other',
    label: 'Other',
    title: 'Setup in Other OS',
    steps: [
      'Use an OpenVPN-compatible client for your operating system.',
      'Download your configuration file from this portal.',
      'Import the file into the client.',
      'Start connection from imported profile.',
    ],
    links: [{ label: 'OpenVPN Community Downloads Page', href: 'https://openvpn.net/community-downloads/' }],
  },
  ],
  'zh-Hans': [
    {
      key: 'Windows',
      label: 'Windows',
      title: 'Windows 配置步骤',
      steps: [
        '从 OpenVPN 社区下载页面下载 Windows 安装包。',
        '使用下载的安装包安装 OpenVPN。',
        '在本系统下载客户端配置文件。',
        '将配置文件移动到 C:\\Program Files\\OpenVPN\\config。',
        '打开系统托盘中的 OpenVPN 应用并连接已导入配置。',
      ],
      links: [{ label: 'OpenVPN 下载页面', href: 'https://openvpn.net/community-downloads/' }],
    },
    {
      key: 'Mac OS',
      label: 'Mac OS',
      title: 'Mac OS 配置步骤',
      steps: [
        '安装支持 OpenVPN 协议的客户端（推荐 Tunnelblick）。',
        '在本系统下载客户端配置文件。',
        '双击配置文件完成导入。',
        '在顶部菜单栏使用 Tunnelblick 发起连接。',
        '如提示 same public IP check，请关闭以保持分流行为。',
      ],
      links: [{ label: 'Tunnelblick 官网', href: 'https://tunnelblick.net/' }],
    },
    {
      key: 'Linux',
      label: 'Linux',
      title: 'Linux 配置步骤',
      steps: [
        '安装 NetworkManager OpenVPN 插件（例如 sudo apt-get install network-manager-openvpn-gnome）。',
        '在本系统下载 Linux 客户端配置文件。',
        '将配置导入系统网络管理器。',
        '开启分流：仅将此连接用于其网络资源。',
        '在网络菜单中连接。',
        '也可命令行连接：sudo openvpn --config YOUR_CLIENT_CONFIG.ovpn',
      ],
      links: [{ label: 'OpenVPN 下载页面', href: 'https://openvpn.net/community-downloads/' }],
    },
    {
      key: 'iOS',
      label: 'iOS',
      title: 'iOS 配置步骤',
      steps: [
        '从 App Store 安装 OpenVPN Connect。',
        '在本系统下载客户端配置文件。',
        '打开 OpenVPN Connect 并导入配置文件。',
        '在已导入配置中启动连接。',
      ],
      links: [{ label: 'OpenVPN Connect（App Store）', href: 'https://apps.apple.com/us/app/id590379981' }],
    },
    {
      key: 'Android',
      label: 'Android',
      title: 'Android 配置步骤',
      steps: [
        '从 Google Play 安装 OpenVPN Connect。',
        '在本系统下载客户端配置文件。',
        '打开 OpenVPN Connect 并导入配置文件。',
        '在已导入配置中启动连接。',
      ],
      links: [
        { label: 'OpenVPN Connect（Google Play）', href: 'https://play.google.com/store/apps/details?id=net.openvpn.openvpn' },
      ],
    },
    {
      key: 'Other',
      label: '其他',
      title: '其他系统配置步骤',
      steps: ['为您的系统选择支持 OpenVPN 的客户端。', '在本系统下载配置文件。', '将配置导入客户端。', '在客户端中启动连接。'],
      links: [{ label: 'OpenVPN 下载页面', href: 'https://openvpn.net/community-downloads/' }],
    },
  ],
}

export function getSetupSections(locale: Locale): SetupSection[] {
  return sectionsByLocale[locale]
}
