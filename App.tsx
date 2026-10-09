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
  key: "GROQ_API_KEY" | "OPENROUTER_API_KEY" | "OPENAI_API_KEY" | "ANTHROPIC_API_KEY";
  value: string;
  isVisible: boolean;
}

// ============================================================================
// INITIAL STATE & PLACEHOLDERS
// ============================================================================
const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Welcome to Nova. I'm your AI-powered app builder. Tell me what you want to create, and I'll generate the scaffolding, components, and configuration for you.",
    timestamp: new Date(Date.now() - 60000),
  },
];

const FALLBACK_MOCK_CODE = `// Welcome to Nova Studio!
// Describe the app you want to build in the chat.
// Example: "Build a modern pricing table for a SaaS product."
// I will connect to Groq AI and generate the React code here.`;

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
  const [generatedCode, setGeneratedCode] = useState<string>(FALLBACK_MOCK_CODE);
  
  // API Keys State
  const [apiKeys, setApiKeys] = useState<ApiKeyConfig[]>([
    { label: "Groq", key: "GROQ_API_KEY", value: "", isVisible: false },
    { label: "OpenRouter", key: "OPENROUTER_API_KEY", value: "", isVisible: false },
    { label: "OpenAI", key: "OPENAI_API_KEY", value: "", isVisible: false },
    { label: "Anthropic", key: "ANTHROPIC_API_KEY", value: "", isVisible: false },
  ]);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load API Keys from Local Storage on Mount
  useEffect(() => {
    const savedKeys = localStorage.getItem("novaApiKeys");
    if (savedKeys) {
      try {
        const parsedKeys = JSON.parse(savedKeys);
        setApiKeys((prev) =>
          prev.map((k) => ({
            ...k,
            value: parsedKeys[k.key] || k.value,
          }))
        );
      } catch (e) {
        console.error("Failed to parse API keys from storage");
      }
    }
  }, []);

  // Save API Keys to Local Storage when they change
  useEffect(() => {
    const keysToSave = apiKeys.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);
    localStorage.setItem("novaApiKeys", JSON.stringify(keysToSave));
  }, [apiKeys]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --------------------------------------------------------------------------
  // GROQ API INTEGRATION (REAL FETCH)
  // --------------------------------------------------------------------------
  const generateCodeWithGroq = async (userPrompt: string) => {
    const groqKeyConfig = apiKeys.find((k) => k.key === "GROQ_API_KEY");
    const groqKey = groqKeyConfig?.value;

    if (!groqKey) {
      setGeneratedCode("// ERROR: Missing Groq API Key.\n// Please enter your API key in the Admin panel (gear icon top right) to generate code.");
      return "I need a Groq API key to generate code. Please add it in the Admin settings.";
    }

    try {
      // Prepare the history for context
      const chatHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-70b-versatile", // Powerful model for coding
          messages: [
            {
              role: "system",
              content: "You are an expert React developer. The user will ask you to build UI components. Generate a single, clean, production-ready React component (App.tsx) using Tailwind CSS and 'lucide-react' icons. ONLY RETURN THE RAW CODE BLOCK. Do not use markdown backticks (```tsx) in your response, just the raw text of the code. Provide a brief 1-sentence summary of what you built at the very end as a comment."
            },
            ...chatHistory,
            {
              role: "user",
              content: userPrompt
            }
          ],
          temperature: 0.5,
          max_tokens: 3000,
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq API Error: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      const aiResponseContent = data.choices[0].message.content;

      // Extract code (removing any accidental markdown)
      const cleanCode = aiResponseContent.replace(/```jsx|```tsx|```javascript|```/g, "").trim();
      setGeneratedCode(cleanCode);
      setActiveTab("code"); // Switch to code view to show result

      return "I have generated the component based on your request. Check the 'Code' tab to view and copy the result!";
      
    } catch (error: any) {
      console.error(error);
      setGeneratedCode(`// ERROR communicating with Groq:\n// ${error.message}`);
      return `I encountered an error while trying to generate the code: ${error.message}`;
    }
  };

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
    const currentInput = inputValue; // Save it before clearing
    setInputValue("");
    setIsLoading(true);

    // Call Groq API
    const aiTextResponse = await generateCodeWithGroq(currentInput);

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: aiTextResponse,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  // --------------------------------------------------------------------------
  // ADMIN PANEL HANDLERS
  // --------------------------------------------------------------------------
  const toggleKeyVisibility = (key: keyof typeof API_KEYS) => {
    setApiKeys((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, isVisible: !item.isVisible } : item
      )
    );
  };

  const copyToClipboard = (key: keyof typeof API_KEYS, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

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
      style={{ backgroundColor: "#0a0a0a" }}
    >
      {/* HEADER BAR */}
      <header className="border-b border-neutral-800 bg-black/50 backdrop-blur px-6 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-cyan-500" />
            <span className="text-sm font-semibold text-neutral-200">Nova Workspace</span>
          </div>
          <span className="text-xs text-neutral-500 hidden sm:inline-block">AI Code Generation Engine</span>
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
          <div className="hidden md:flex items-center gap-2 text-xs text-neutral-500">
            <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            {isLoading ? "Generating..." : "System ready"}
          </div>
        </div>
      </header>

      {/* MAIN WORKSPACE (Split-pane layout) */}
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
                  className={`max-w-xs px-4 py-3 rounded-lg text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-cyan-600/20 border border-cyan-500/30 text-neutral-100 rounded-tr-sm"
                      : "bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-tl-sm"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-neutral-900 border border-neutral-800 px-4 py-3 rounded-lg rounded-tl-sm">
                  <div className="flex gap-1.5 items-center h-4">
                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce delay-100" />
                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-neutral-800 p-4 bg-black/50">
            <div className="flex gap-2 items-end">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Describe your app..."
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-600 outline-none focus:border-neutral-700 transition resize-none min-h-[42px] max-h-32"
                rows={1}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="p-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:bg-neutral-800 disabled:text-neutral-600 text-white rounded-lg transition"
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
          <div className="flex-1 overflow-hidden relative">
            {activeTab === "preview" ? (
              <PreviewPane />
            ) : (
              <CodePane code={generatedCode} />
            )}
            
            {/* ADMIN PANEL (Overlay inside right pane) */}
            {role === "Admin" && showAdminPanel && (
              <div className="absolute top-0 right-0 w-80 h-full border-l border-neutral-800 bg-neutral-950/95 backdrop-blur shadow-2xl z-50">
                 <AdminPanel
                  apiKeys={apiKeys}
                  copiedKey={copiedKey}
                  onToggleVisibility={toggleKeyVisibility}
                  onCopyKey={copyToClipboard}
                  onUpdateKey={updateApiKey}
                  onClose={() => setShowAdminPanel(false)}
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ============================================================================
// PREVIEW PANE COMPONENT
// ============================================================================
function PreviewPane() {
  return (
    <div className="h-full overflow-auto bg-black p-4 flex items-center justify-center">
      {/* Fake Browser Frame for Future Live Preview */}
      <div className="w-full max-w-4xl h-full max-h-[800px] bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden flex flex-col shadow-2xl">
        <div className="bg-neutral-950 border-b border-neutral-800 px-4 py-3 flex items-center gap-4">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-black/50 border border-neutral-800 rounded-md px-4 py-1 text-xs text-neutral-500 font-mono">
              localhost:3000
            </div>
          </div>
          <div className="w-10"></div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-black/20">
          <Terminal className="w-12 h-12 text-neutral-700 mb-4" />
          <h2 className="text-xl font-medium text-neutral-300 mb-2">Live Preview Engine</h2>
          <p className="text-sm text-neutral-500 max-w-md">
            The code generated by Groq AI is available in the <strong className="text-cyan-500 font-medium">Code Tab</strong>. A live renderer will execute it here in future updates.
          </p>
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
    <div className="h-full overflow-hidden flex flex-col bg-black relative">
      <div className="absolute top-4 right-6 z-10">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800/80 border border-neutral-700 rounded-md hover:bg-neutral-700 transition text-xs text-neutral-300 backdrop-blur"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy Code
            </>
          )}
        </button>
      </div>

      <pre className="flex-1 overflow-auto p-6 bg-black text-neutral-300 text-[13px] leading-relaxed font-mono custom-scrollbar">
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
  onToggleVisibility: (key: any) => void;
  onCopyKey: (key: any, value: string) => void;
  onUpdateKey: (key: any, value: string) => void;
  onClose: () => void;
}

function AdminPanel({ apiKeys, copiedKey, onToggleVisibility, onCopyKey, onUpdateKey, onClose }: AdminPanelProps) {
  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-cyan-500" />
          <h3 className="text-sm font-semibold text-neutral-200">Configuration</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-neutral-800 rounded text-neutral-500">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4 overflow-y-auto pr-2">
        <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg mb-6">
          <p className="text-xs text-cyan-400/80">
            Enter your API keys to enable live AI code generation. Keys are saved securely in your browser's local storage.
          </p>
        </div>

        {apiKeys.map((item) => (
          <div key={item.key} className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
            <p className="text-xs font-medium text-neutral-400 mb-2 flex items-center justify-between">
              {item.label}
              {item.key === "GROQ_API_KEY" && <span className="text-[10px] bg-neutral-800 px-1.5 rounded text-neutral-500">Required</span>}
            </p>
            <div className="flex gap-1">
              <input
                type={item.isVisible ? "text" : "password"}
                value={item.value}
                onChange={(e) => onUpdateKey(item.key, e.target.value)}
                placeholder="sk-..."
                className="flex-1 bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-xs text-neutral-200 outline-none focus:border-neutral-500 transition"
              />
              <button onClick={() => onToggleVisibility(item.key)} className="p-1.5 hover:bg-neutral-700 rounded transition text-neutral-500">
                {item.isVisible ? <Eye className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
