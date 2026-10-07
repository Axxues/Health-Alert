import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  BookOpenCheck,
  Check,
  ClipboardList,
  Copy,
  Download,
  Droplets,
  Edit2,
  PanelLeftOpen,
  Plus,
  Search,
  Send,
  Syringe,
  Trash2,
  Wind,
  X,
} from "lucide-react";
import { askLibrary } from "@/services/rag/api";
import type { RagAnswer, RagCitation } from "@/services/rag/types";
import { CitationCard } from "./CitationCard";

const SUGGESTED_QUERIES = [
  {
    icon: <Droplets className="h-4 w-4" />,
    title: "Warning signs",
    prompt: "How do we manage dengue warning signs and fluid resuscitation?",
  },
  {
    icon: <Syringe className="h-4 w-4" />,
    title: "Prophylaxis",
    prompt: "What is the DOH Doxycycline prophylaxis regimen for flood exposure?",
  },
  {
    icon: <ClipboardList className="h-4 w-4" />,
    title: "Case reporting",
    prompt: "What are the EDCS-IS reporting deadlines for Category 1 outbreaks?",
  },
  {
    icon: <Wind className="h-4 w-4" />,
    title: "Surge triggers",
    prompt: "What environmental threshold triggers the asthma surge response?",
  },
];

export interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  text: string;
  citations: RagCitation[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMsg[];
  updatedAt: number;
}

const LS_KEY = "ha.rag.sessions.v1";

// ponytail: sessions live in localStorage; server /rag/ask stays stateless per query.
// Move to server-side sessions when history must follow the user across devices.
export function sessionTitle(firstQuery: string): string {
  const t = firstQuery.trim().replace(/\s+/g, " ");
  return t.length > 42 ? `${t.slice(0, 42)}…` : t;
}

export function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function GuidelinesPanel({ onClose }: { onClose?: () => void }) {
  const [sessions, setSessions] = useState<ChatSession[]>(() => loadSessions());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exportCopied, setExportCopied] = useState(false);
  // ponytail: gate transitions until after first paint, else the drawer slides out on mount (flash)
  const [animOn, setAnimOn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimOn(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const streamRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const active = sessions.find((s) => s.id === activeId) ?? null;

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(sessions));
    } catch {
      /* storage full or unavailable — sessions just won't persist */
    }
  }, [sessions]);

  useEffect(() => {
    const el = streamRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [active?.messages.length, loading, activeId]);

  const filtered = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    const sorted = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);
    if (!needle) return sorted;
    return sorted.filter(
      (s) =>
        s.title.toLowerCase().includes(needle) ||
        s.messages.some((m) => m.text.toLowerCase().includes(needle))
    );
  }, [sessions, searchQuery]);

  function autoGrow() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  async function handleAsk(queryText: string) {
    const text = queryText.trim();
    if (!text || loading) return;
    setError("");
    setQ("");
    requestAnimationFrame(() => {
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    });
    setLoading(true);

    const userMsg: ChatMsg = { id: `u-${Date.now()}`, role: "user", text, citations: [] };
    let sid = activeId;
    if (!sid) {
      sid = `s-${Date.now()}`;
      setSessions((prev) => [{ id: sid as string, title: sessionTitle(text), messages: [userMsg], updatedAt: Date.now() }, ...prev]);
      setActiveId(sid);
    } else {
      setSessions((prev) => prev.map((s) => (s.id === sid ? { ...s, messages: [...s.messages, userMsg], updatedAt: Date.now() } : s)));
    }

    try {
      const res: RagAnswer = await askLibrary(text);
      const asst: ChatMsg = { id: `a-${Date.now()}`, role: "assistant", text: res.answer, citations: res.citations };
      const target = sid;
      setSessions((prev) => prev.map((s) => (s.id === target ? { ...s, messages: [...s.messages, asst], updatedAt: Date.now() } : s)));
    } catch {
      setError("Unable to reach the guidelines assistant. Check connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function newChat() {
    setActiveId(null);
    setQ("");
    setError("");
    setHistoryOpen(false);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function deleteSession(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeId === id) {
      setActiveId(null);
      setError("");
    }
  }

  function renameSession(id: string, title: string) {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, title, updatedAt: Date.now() } : s)));
    setEditingId(null);
  }

  async function handleCopy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  async function handleExportChat() {
    if (!active) return;
    const date = new Date(active.updatedAt).toLocaleDateString();
    let md = `# Guidelines consultation: ${active.title}\n*Exported on ${date}*\n\n---\n\n`;
    active.messages.forEach((m) => {
      md += m.role === "user" ? `**You:**\n\n${m.text}\n\n` : `**Guidelines assistant:**\n\n${m.text}\n\n`;
      m.citations.forEach((c) => {
        md += `*Source: ${c.doc}, ${c.chapter}, page ${c.page}*\n`;
      });
      md += `\n---\n\n`;
    });
    try {
      await navigator.clipboard.writeText(md);
      setExportCopied(true);
      window.setTimeout(() => setExportCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  const historyPanel = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="p-3">
        <button
          type="button"
          onClick={newChat}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          New chat
        </button>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-8 text-xs text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-2">
        {filtered.length === 0 && (
          <p className="px-2 py-6 text-center text-[11px] text-muted-foreground">
            {sessions.length === 0 ? "No conversations yet. Ask something to start one." : "No conversations found."}
          </p>
        )}
        {filtered.map((s) => {
          const selected = s.id === activeId;
          const preview =
            s.messages.length > 0 ? s.messages[s.messages.length - 1].text.slice(0, 60) : "No messages yet";
          return (
            <div
              key={s.id}
              className={`group relative rounded-xl border px-3 py-2.5 transition-all ${
                selected ? "border-border bg-muted shadow-sm" : "border-transparent hover:bg-muted/50"
              }`}
            >
              {editingId === s.id ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => editingTitle.trim() && renameSession(s.id, editingTitle.trim())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && editingTitle.trim()) renameSession(s.id, editingTitle.trim());
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    autoFocus
                    aria-label="Rename conversation"
                    className="w-full rounded border border-primary bg-background px-1.5 py-0.5 text-xs font-bold text-foreground outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => editingTitle.trim() && renameSession(s.id, editingTitle.trim())}
                    className="rounded p-1 text-primary hover:bg-primary/20"
                    aria-label="Save title"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setActiveId(s.id);
                    setError("");
                    setHistoryOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveId(s.id);
                      setError("");
                      setHistoryOpen(false);
                    }
                  }}
                  className="flex w-full items-start gap-2.5 text-left cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold tracking-tight text-foreground">{s.title}</p>
                    <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{preview}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(s.id);
                        setEditingTitle(s.title);
                      }}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      title="Rename conversation"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(s.id);
                      }}
                      className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      title="Delete conversation"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-border/70 p-3">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${error ? "bg-destructive" : "bg-emerald-500"}`} />
            {error ? "Reconnection needed" : "Guidelines index ready"}
          </span>
          <span className="tabular-nums">{sessions.length} sessions</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative flex h-full w-full bg-background" style={{ minHeight: 0 }}>
      <div
        className={`absolute inset-0 z-10 flex transition-[visibility] duration-0 motion-reduce:transition-none ${historyOpen ? "visible delay-0" : "invisible delay-300"}`}
        aria-hidden={!historyOpen}
        inert={!historyOpen}
      >
        <div
          className={`absolute inset-0 bg-black/40 ${animOn ? "transition-opacity duration-300 motion-reduce:transition-none" : ""} ${historyOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setHistoryOpen(false)}
        />
        <div
          className={`relative flex w-80 max-w-[85%] flex-col bg-card shadow-2xl ${animOn ? "transition-transform duration-300 ease-out motion-reduce:transition-none" : ""} ${historyOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
            <div className="flex items-center justify-between border-b border-border p-3">
              <span className="text-xs font-bold text-foreground">Conversations</span>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                aria-label="Close chat history"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {historyPanel}
          </div>
        </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-card overflow-hidden">
        <div className="flex shrink-0 items-center justify-between border-b border-border/70 px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              aria-label="Open chat history"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpenCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-[14px] font-extrabold tracking-tight text-foreground">
                Guidelines assistant
              </h1>
              <p className="truncate text-[12px] text-muted-foreground">
                {active?.title ?? "DOH, WHO, and LGU protocols"}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => void handleExportChat()}
              title="Copy conversation as markdown"
              aria-label="Copy conversation as markdown"
              disabled={!active}
              className="rounded-xl p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground cursor-pointer disabled:opacity-40"
            >
              {exportCopied ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={newChat}
              title="New chat"
              aria-label="New chat"
              className="rounded-xl bg-primary p-2 text-primary-foreground transition-all hover:bg-primary/90 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                aria-label="Close guidelines assistant"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div ref={streamRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
          <div>
            {!active ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted text-primary">
                  <BookOpenCheck className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-[18px] font-extrabold tracking-tight text-foreground">
                  What does the guideline say?
                </h2>
                <p className="mt-1.5 max-w-md text-[12.5px] text-muted-foreground leading-relaxed">
                  Ask about case definitions, dosage protocols, or outbreak response. Every answer cites its source.
                </p>
                <div className="mt-6 grid w-full grid-cols-1 gap-2">
                  {SUGGESTED_QUERIES.map((item) => (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => void handleAsk(item.prompt)}
                      disabled={loading}
                      className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-all hover:border-muted-foreground/30 hover:shadow-sm active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
                        {item.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12.5px] font-bold tracking-tight text-foreground">{item.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-[12px] text-muted-foreground">{item.prompt}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {active.messages.map((m) =>
                  m.role === "user" ? (
                    <div key={m.id} className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-[13px] text-primary-foreground">
                        <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                      </div>
                    </div>
                  ) : (
                    <div key={m.id} className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-primary">
                        <BookOpenCheck className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-border bg-card px-4 py-3">
                        <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{m.text}</div>
                        <CitationCard citations={m.citations} />
                        <div className="mt-2 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => void handleCopy(m.id, m.text)}
                            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                            title="Copy response"
                          >
                            {copiedId === m.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                )}
                {loading && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-primary">
                      <BookOpenCheck className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-border bg-card px-4 py-3">
                      <div className="flex items-center gap-1.5 py-1" aria-label="Searching guidelines">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.3s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.15s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="mt-3 flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
                <AlertCircle size={16} strokeWidth={2} />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-border/70">
          <div className="w-full px-4 py-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleAsk(q);
              }}
            >
              <div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2 transition-all focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
                <textarea
                  ref={textareaRef}
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    autoGrow();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleAsk(q);
                    }
                  }}
                  placeholder={
                    loading ? "Searching guidelines..." : "Ask about case definitions, dosage, reporting..."
                  }
                  rows={1}
                  disabled={loading}
                  autoFocus
                  aria-label="Ask the guidelines"
                  className="max-h-40 min-h-[2.5rem] flex-1 resize-none bg-transparent px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
                />
                <div className="flex items-center gap-1.5 pb-0.5">
                  <button
                    type="submit"
                    disabled={!q.trim() || loading}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </form>
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Answers cite DOH and WHO guidelines</span>
              <span>Enter to send</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
