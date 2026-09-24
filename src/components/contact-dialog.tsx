import { useState } from "react";
import { Mail, MessageSquare, X, Send, Phone } from "lucide-react";
import { toast } from "sonner";
import type { Lang } from "@/lib/lang";

export const COORDINATOR = {
  name: "Dr. Espérance Kamala",
  role: { fr: "Coordonnatrice terrain · Nord-Kivu", en: "Field coordinator · North Kivu" },
  email: "coordination@sitrep-nk.org",
  phone: "+243 970 000 000",
};

type Msg = { from: "user" | "coord"; text: string };

export function ContactDialog({
  open,
  onClose,
  lang,
}: {
  open: boolean;
  onClose: () => void;
  lang: Lang;
}) {
  const fr = lang === "fr";
  const [tab, setTab] = useState<"mail" | "chat">("mail");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<Msg[]>([
    {
      from: "coord",
      text: fr
        ? "Bonjour, ici la coordination HUMASAFE. Comment pouvons-nous vous aider ?"
        : "Hello, HUMASAFE coordination here. How can we help you?",
    },
  ]);
  const [draft, setDraft] = useState("");

  if (!open) return null;

  const sendMail = (e: React.FormEvent) => {
    e.preventDefault();
    const body = `${message}\n\n—\n${name} (${email})`;
    window.location.href = `mailto:${COORDINATOR.email}?subject=${encodeURIComponent(
      subject || (fr ? "Contact depuis HUMASAFE" : "Contact from HUMASAFE"),
    )}&body=${encodeURIComponent(body)}`;
    toast.success(fr ? "Message préparé" : "Message ready", {
      description: fr
        ? "Votre client mail s'ouvre avec le message."
        : "Your mail client is opening with the message.",
    });
  };

  const sendChat = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setChat((c) => [...c, { from: "user", text }]);
    setDraft("");
    setTimeout(() => {
      setChat((c) => [
        ...c,
        {
          from: "coord",
          text: fr
            ? "Message reçu. Un membre de la coordination vous répond sous 24 h ouvrées."
            : "Message received. A coordinator will reply within 24 working hours.",
        },
      ]);
    }, 900);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={fr ? "Contactez-nous" : "Contact us"}
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl sm:rounded-2xl"
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {fr ? "Contactez-nous" : "Contact us"}
            </div>
            <div className="truncate text-sm font-semibold">{COORDINATOR.name}</div>
            <div className="truncate text-[11px] text-muted-foreground">
              {COORDINATOR.role[lang]}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={fr ? "Fermer" : "Close"}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-1 border-b border-border px-4 py-2 sm:px-5">
          {(["mail", "chat"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition " +
                (tab === k
                  ? "bg-primary/15 text-foreground"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {k === "mail" ? <Mail className="h-3.5 w-3.5" /> : <MessageSquare className="h-3.5 w-3.5" />}
              {k === "mail" ? "Email" : "Chat"}
            </button>
          ))}
        </div>

        {tab === "mail" ? (
          <form onSubmit={sendMail} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={fr ? "Nom" : "Name"} value={name} onChange={setName} required />
              <Field label="Email" value={email} onChange={setEmail} type="email" required />
            </div>
            <Field label={fr ? "Objet" : "Subject"} value={subject} onChange={setSubject} />
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Message
              </span>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              <Send className="h-4 w-4" />
              {fr ? "Envoyer au coordonnateur" : "Send to coordinator"}
            </button>
            <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3 w-3" /> {COORDINATOR.email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3 w-3" /> {COORDINATOR.phone}
              </span>
            </div>
          </form>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4 sm:px-5">
              {chat.map((m, i) => (
                <div
                  key={i}
                  className={
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm " +
                    (m.from === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-muted text-foreground")
                  }
                >
                  {m.text}
                </div>
              ))}
            </div>
            <form onSubmit={sendChat} className="flex items-center gap-2 border-t border-border px-4 py-3 sm:px-5">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={fr ? "Écrire un message…" : "Write a message…"}
                className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <button
                type="submit"
                aria-label={fr ? "Envoyer" : "Send"}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition hover:opacity-90"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}
