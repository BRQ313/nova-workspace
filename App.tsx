import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  ArrowUp,
  Bot,
  Code2,
  Eye,
  Settings,
  Send,
  MessageSquare,
  ChevronDown,
  Copy,
  Check,
  Lock,
  Unlock,
  RotateCcw,
  Menu,
  X,
  Globe,
  Sparkles,
  TrendingUp,
  Users,
  Shield,
  Zap,
  MoreVertical,
  KeyRound,
  Terminal,
} from "lucide-react";

// ============================================================================
// API KEY CONSTANTS (Replace with your actual keys)
// ============================================================================
const API_KEYS = {
  GROQ_API_KEY: "INSERT_KEY_HERE",
  OPENROUTER_API_KEY: "INSERT_KEY_HERE",
  OPENAI_API_KEY: "INSERT_KEY_HERE",
  ANTHROPIC_API_KEY: "INSERT_KEY_HERE",
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
type RoleMode = "Admin" | "Guest";
type ViewTab = "preview" | "code";
type Direction = "ltr" | "rtl";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ApiKeyConfig {
  label: string;
  key: keyof typeof API_KEYS;
  value: string;
  isVisible: boolean;
}

// ============================================================================
// INITIAL STATE
// ============================================================================
const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Welcome to Nova. I'm your AI-powered app builder. Tell me what you want to create, and I'll generate the scaffolding, components, and configuration for you.",
    timestamp: new Date(Date.now() - 60000),
  },
  {
    id: "2",
    role: "user",
    content: "Build a financial analytics dashboard with real-time data and a dark theme.",
    timestamp: new Date(Date.now() - 45000),
  },
  {
    id: "3",
    role: "assistant",
    content:
      "Perfect. I'll create a modular dashboard with KPI cards, interactive charts, and a responsive layout. Would you prefer a desktop-first or mobile-responsive design?",
    timestamp: new Date(Date.now() - 30000),
  },
];

const MOCK_CODE = `import React from 'react';
import { TrendingUp, Users, Shield } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="bg-black text-white p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold">Analytics</h1>
        <p className="text-neutral-400 mt-2">Real-time financial insights</p>
      </header>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-500 text-sm">Revenue</p>
              <p className="text-3xl font-bold mt-2">$84.6K</p>
            </div>
            <TrendingUp className="text-emerald-500" size={24} />
          </div>
          <p className="text-emerald-500 text-xs mt-4">+18.2% this month</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-500 text-sm">Active Users</p>
              <p className="text-3xl font-bold mt-2">24.3K</p>
            </div>
            <Users className="text-cyan-500" size={24} />
          </div>
          <p className="text-cyan-500 text-xs mt-4">+6.8% growth</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-500 text-sm">Security</p>
              <p className="text-3xl font-bold mt-2">99.9%</p>
            </div>
            <Shield className="text-violet-500" size={24} />
          </div>
          <p className="text-violet-500 text-xs mt-4">All systems healthy</p>
        </div>
      </div>

      <div className="mt-8 bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Revenue Trend</h2>
        <div className="h-32 flex items-end gap-1">
          {[40, 50, 45, 65, 55, 80, 90, 70, 85, 95, 80, 100].map((h) => (
            <div
              key={h}
              className="flex-1 bg-gradient-to-t from-cyan-500 to-emerald-500 rounded-t"
              style={{ height: \`\${h}%\` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}`;

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function App() {
  const [role, setRole] = useState<RoleMode>("Admin");
  const [direction, setDirection] = useState<Direction>("ltr");
  const [activeTab, setActiveTab] = useState<ViewTab>("preview");
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeyConfig[]>([
    {
      label: "Groq",
      key: "GROQ_API_KEY",
      value: API_KEYS.GROQ_API_KEY,
      isVisible: false,
    },
    {
      label: "OpenRouter",
      key: "OPENROUTER_API_KEY",
      value: API_KEYS.OPENROUTER_API_KEY,
      isVisible: false,
    },
    {
      label: "OpenAI",
      key: "OPENAI_API_KEY",
      value: API_KEYS.OPENAI_API_KEY,
      isVisible: false,
    },
    {
      label: "Anthropic",
      key: "ANTHROPIC_API_KEY",
      value: API_KEYS.ANTHROPIC_API_KEY,
      isVisible: false,
    },
  ]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle message submission
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Simulate AI response delay
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I've captured your requirements. I'm generating the component structure, API integrations, and styling now. The scaffold will be ready in the Code View.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  // Toggle API key visibility
  const toggleKeyVisibility = (key: keyof typeof API_KEYS) => {
    setApiKeys((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, isVisible: !item.isVisible } : item
      )
    );
  };

  // Copy API key to clipboard
  const copyToClipboard = (key: keyof typeof API_KEYS, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Update API key value
  const updateApiKey = (key: keyof typeof API_KEYS, value: string) => {
    setApiKeys((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, value } : item
      )
    );
  };

  const roleIndicator = useMemo(
    () => (role === "Admin" ? "🔑 Admin Mode" : "👤 Guest Mode"),
    [role]
  );

  return (
    <div
      dir={direction}
      className="min-h-screen bg-black text-neutral-200 flex flex-col"
      style={{
        backgroundColor: "#0a0a0a",
      }}
    >
      {/* ====================================================================
          HEADER BAR
          ==================================================================== */}
      <header className="border-b border-neutral-800 bg-black/50 backdrop-blur px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-cyan-500" />
            <span className="text-sm font-semibold text-neutral-200">Nova</span>
          </div>
          <span className="text-xs text-neutral-500">Prompt-to-App Builder</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Role Toggle */}
          <div className="inline-flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded px-2 py-1">
            {(["Admin", "Guest"] as RoleMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setRole(mode)}
                className={`px-2 py-1 text-xs font-medium rounded transition ${
                  role === mode
                    ? "bg-neutral-800 text-neutral-100"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Direction Toggle */}
          <button
            onClick={() => setDirection((prev) => (prev === "ltr" ? "rtl" : "ltr"))}
            className="px-3 py-1.5 text-xs font-medium bg-neutral-900 border border-neutral-800 rounded hover:bg-neutral-800 transition flex items-center gap-2 text-neutral-400 hover:text-neutral-200"
          >
            <Globe className="w-3.5 h-3.5" />
            {direction.toUpperCase()}
          </button>

          {/* Status Indicator */}
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            System ready
          </div>
        </div>
      </header>

      {/* ====================================================================
          MAIN WORKSPACE (Split-pane layout)
          ==================================================================== */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANE: AI CHAT SIDEBAR */}
        <aside className="w-[420px] border-r border-neutral-800 bg-black/30 flex flex-col">
          {/* Chat Header */}
          <div className="border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-500" />
              <span className="text-sm font-semibold text-neutral-200">AI Copilot</span>
            </div>
            <button className="p-1 hover:bg-neutral-800 rounded transition text-neutral-500 hover:text-neutral-300">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-cyan-600/20 border border-cyan-500/30 text-neutral-100"
                      : "bg-neutral-900 border border-neutral-800 text-neutral-300"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-lg">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce delay-100" />
                    <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-neutral-800 p-4 bg-black/50">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Describe your app..."
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-600 outline-none focus:border-neutral-700 transition"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="p-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-neutral-800 disabled:text-neutral-600 text-white rounded transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* RIGHT PANE: MAIN WORKSPACE */}
        <main className="flex-1 flex flex-col bg-black">
          {/* Tab Bar */}
          <div className="border-b border-neutral-800 px-6 py-3 flex items-center justify-between bg-black/50">
            <div className="flex gap-4">
              {(["preview", "code"] as ViewTab[]).map((tab) => {
                const Icon = tab === "preview" ? Eye : Code2;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-2 text-sm font-medium pb-1 border-b-2 transition ${
                      activeTab === tab
                        ? "border-cyan-500 text-neutral-100"
                        : "border-transparent text-neutral-500 hover:text-neutral-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab === "preview" ? "Preview" : "Code"}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className={`p-2 rounded hover:bg-neutral-800 transition ${
                showAdminPanel
                  ? "text-cyan-500 bg-neutral-800/50"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "preview" ? (
              <PreviewPane />
            ) : (
              <CodePane code={MOCK_CODE} />
            )}
          </div>
        </main>
      </div>

      {/* ====================================================================
          ADMIN PANEL (Slide-out, below the main layout)
          ==================================================================== */}
      {role === "Admin" && showAdminPanel && (
        <AdminPanel
          apiKeys={apiKeys}
          copiedKey={copiedKey}
          onToggleVisibility={toggleKeyVisibility}
          onCopyKey={copyToClipboard}
          onUpdateKey={updateApiKey}
        />
      )}
    </div>
  );
}

// ============================================================================
// PREVIEW PANE COMPONENT
// ============================================================================
function PreviewPane() {
  return (
    <div className="h-full overflow-auto bg-black p-4">
      {/* Fake Browser Frame */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden flex flex-col h-full">
        {/* Browser Top Bar */}
        <div className="bg-neutral-950 border-b border-neutral-800 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
          </div>
          <div className="flex-1 ml-4">
            <div className="text-xs text-neutral-500 bg-neutral-900 rounded px-3 py-1 text-center">
              nova-dashboard.local
            </div>
          </div>
          <button className="p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-neutral-300">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        {/* Browser Content */}
        <div className="flex-1 overflow-auto bg-black">
          <div className="p-8">
            {/* Dashboard Content */}
            <div className="max-w-5xl">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-neutral-100">Analytics Dashboard</h1>
                <p className="text-neutral-500 text-sm mt-2">Real-time financial insights and performance metrics</p>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  {
                    label: "Revenue",
                    value: "$84.6K",
                    change: "+18.2%",
                    icon: TrendingUp,
                    color: "emerald",
                  },
                  {
                    label: "Active Users",
                    value: "24.3K",
                    change: "+6.8%",
                    icon: Users,
                    color: "cyan",
                  },
                  {
                    label: "Security Score",
                    value: "99.9%",
                    change: "Healthy",
                    icon: Shield,
                    color: "violet",
                  },
                ].map((card, idx) => {
                  const Icon = card.icon;
                  const colorClass =
                    card.color === "emerald"
                      ? "text-emerald-500"
                      : card.color === "cyan"
                      ? "text-cyan-500"
                      : "text-violet-500";
                  return (
                    <div
                      key={idx}
                      className="bg-neutral-900 border border-neutral-800 rounded-lg p-6"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-neutral-500 text-sm">
                            {card.label}
                          </p>
                          <p className="text-2xl font-bold text-neutral-100 mt-2">
                            {card.value}
                          </p>
                          <p className={`text-xs mt-2 ${colorClass}`}>
                            {card.change}
                          </p>
                        </div>
                        <Icon className={`w-5 h-5 ${colorClass}`} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chart Area */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-neutral-100 mb-4">Revenue Trend</h2>
                <div className="h-40 flex items-end gap-1">
                  {[40, 50, 45, 65, 55, 80, 90, 70, 85, 95, 80, 100].map(
                    (height, idx) => (
                      <div
                        key={idx}
                        className="flex-1 bg-gradient-to-t from-cyan-500 to-emerald-500 rounded-t opacity-80 hover:opacity-100 transition"
                        style={{ height: `${height}%` }}
                      />
                    )
                  )}
                </div>
                <div className="flex gap-4 mt-4 text-xs text-neutral-500">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full" />
                    Baseline
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    Current
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                {[
                  { label: "Retention", value: "92.4%", accent: "emerald" },
                  { label: "Latency", value: "214ms", accent: "cyan" },
                  { label: "Risk Score", value: "0.03%", accent: "violet" },
                ].map((metric, idx) => (
                  <div
                    key={idx}
                    className="bg-neutral-900 border border-neutral-800 rounded-lg p-4"
                  >
                    <p className="text-neutral-500 text-xs">{metric.label}</p>
                    <p className="text-xl font-bold text-neutral-100 mt-2">
                      {metric.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CODE PANE COMPONENT
// ============================================================================
function CodePane({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full overflow-hidden flex flex-col bg-black">
      <div className="border-b border-neutral-800 px-6 py-3 flex items-center justify-between bg-neutral-950">
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <Terminal className="w-4 h-4" />
          <span>Dashboard.tsx</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded hover:bg-neutral-800 transition text-xs text-neutral-400 hover:text-neutral-200"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy
            </>
          )}
        </button>
      </div>

      <pre className="flex-1 overflow-auto p-6 bg-black text-neutral-300 text-xs leading-relaxed font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ============================================================================
// ADMIN PANEL COMPONENT
// ============================================================================
interface AdminPanelProps {
  apiKeys: ApiKeyConfig[];
  copiedKey: string | null;
  onToggleVisibility: (key: keyof typeof API_KEYS) => void;
  onCopyKey: (key: keyof typeof API_KEYS, value: string) => void;
  onUpdateKey: (key: keyof typeof API_KEYS, value: string) => void;
}

function AdminPanel({
  apiKeys,
  copiedKey,
  onToggleVisibility,
  onCopyKey,
  onUpdateKey,
}: AdminPanelProps) {
  return (
    <div className="border-t border-neutral-800 bg-neutral-950 px-6 py-4 max-h-80 overflow-y-auto">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="w-4 h-4 text-cyan-500" />
          <h3 className="text-sm font-semibold text-neutral-200">API Key Configuration</h3>
          <Lock className="w-3.5 h-3.5 text-amber-500 ml-auto" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {apiKeys.map((item) => (
            <div
              key={item.key}
              className="bg-neutral-900 border border-neutral-800 rounded-lg p-3"
            >
              <p className="text-xs font-medium text-neutral-400 mb-2">{item.label}</p>
              <div className="flex gap-1">
                <input
                  type={item.isVisible ? "text" : "password"}
                  value={item.value}
                  onChange={(e) => onUpdateKey(item.key, e.target.value)}
                  className="flex-1 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-200 outline-none focus:border-neutral-600 transition"
                />
                <button
                  onClick={() => onToggleVisibility(item.key)}
                  className="p-1 hover:bg-neutral-700 rounded transition text-neutral-500 hover:text-neutral-300"
                >
                  {item.isVisible ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <X className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => onCopyKey(item.key, item.value)}
                  className="p-1 hover:bg-neutral-700 rounded transition text-neutral-500 hover:text-neutral-300"
                >
                  {copiedKey === item.key ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-neutral-600 mt-3">
          🔒 Keys are encrypted at rest. Use admin mode only for configuration.
        </p>
      </div>
    </div>
  );
}
