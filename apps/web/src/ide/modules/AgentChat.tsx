import type { AgentMessage, AgentProvider } from '@sawadev/shared';
import { useEffect, useRef, useState } from 'react';
import { useAgentMessages, useApiKeys, useClearChat, useSendChat } from '../../api/hooks';
import { HIcon } from '../../icons';
import { PROVIDER_LABEL } from '../../providers';
import { AIMark, Typing } from '../../ui';
import { Markdown, looksLikeMarkdown } from '../../ui/Markdown';
import { Menu } from '../../ui/Menu';
import { ProviderLogo } from '../../ui/ProviderLogo';
import { useSpeechToText } from '../../ui/useSpeechToText';
import { useIde } from '../ide-context';

/** Provider effectif : celui mémorisé s'il est disponible, sinon Gemma (défaut, sans clé). */
export function resolveProvider(
  stored: AgentProvider | null,
  connected: AgentProvider[],
): AgentProvider {
  if (stored && connected.includes(stored)) return stored;
  return 'gemma';
}

/** Sélecteur de fournisseur d'agent (chip + menu des clés connectées). Réutilisable. */
export function AgentProviderPicker({
  provider,
  connected,
  onChange,
}: {
  provider: AgentProvider;
  connected: AgentProvider[];
  onChange: (p: AgentProvider) => void;
}) {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  return (
    <>
      <button
        type="button"
        className="chip chip-sm chip-press"
        onClick={(e) => setMenu({ x: e.clientX, y: e.clientY })}
      >
        <ProviderLogo provider={provider} size={14} />
        {PROVIDER_LABEL[provider]}
        <HIcon name="chevD" size={12} color="var(--muted)" />
      </button>
      {menu && (
        <Menu
          anchor={{ x: menu.x, y: menu.y }}
          items={connected.map((p) => ({
            label: PROVIDER_LABEL[p],
            icon: <ProviderLogo provider={p} size={16} />,
            onClick: () => onChange(p),
          }))}
          onClose={() => setMenu(null)}
        />
      )}
    </>
  );
}

const AVA_STYLE = { float: 'left', margin: '1px 7px 1px 0' } as const;

/** Corps d'un message : markdown rendu si détecté, sinon texte brut (logs/erreurs préservés). */
function MessageBody({ text }: { text: string }) {
  if (looksLikeMarkdown(text)) return <Markdown text={text} />;
  return <span style={{ whiteSpace: 'pre-wrap' }}>{text}</span>;
}

function Bubble({ msg }: { msg: AgentMessage }) {
  const user = msg.role === 'user';
  return (
    <div className={`chat-row ${user ? 'me' : ''}`}>
      <div className={`chat-bubble ${user ? 'me' : ''}`}>
        {!user &&
          (msg.provider ? (
            <ProviderLogo provider={msg.provider} size={18} badge round style={AVA_STYLE} />
          ) : (
            <AIMark size={18} r={9} style={AVA_STYLE} />
          ))}
        {user ? (
          <span style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</span>
        ) : (
          <MessageBody text={msg.text} />
        )}
      </div>
    </div>
  );
}

/**
 * AI Agent : chat requête/réponse (enveloppe l'agent CLI en mode print).
 * Le fournisseur est **mémorisé par workspace** (via l'état IDE) et **conditionné à
 * l'existence d'une clé**. `showPicker=false` masque le sélecteur du composer (le dock
 * l'affiche dans son header).
 */
export function AgentChat({
  workspaceId,
  showPicker = true,
}: {
  workspaceId: string;
  showPicker?: boolean;
}) {
  const ide = useIde();
  const { data: messages = [] } = useAgentMessages(workspaceId);
  const { data: keys = [] } = useApiKeys();
  const send = useSendChat(workspaceId);
  const clear = useClearChat(workspaceId);

  // Gemma (local) est toujours disponible, sans clé → l'agent par défaut.
  const connected: AgentProvider[] = [
    ...keys.filter((k) => k.connected).map((k) => k.provider),
    'gemma',
  ];
  const provider = resolveProvider(ide.agentProvider, connected);
  const setProvider = ide.setAgentProvider;

  const [input, setInput] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const [slowHint, setSlowHint] = useState(false);
  const hasKey = connected.length > 0; // toujours vrai (≥ Gemma) → chat jamais désactivé
  const scroller = useRef<HTMLDivElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);

  // Auto-grandit le textarea jusqu'à 5 lignes, puis scrollable.
  useEffect(() => {
    const ta = textarea.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const cs = getComputedStyle(ta);
    const lh = Number.parseFloat(cs.lineHeight) || Number.parseFloat(cs.fontSize) * 1.5;
    const max = lh * 5 + Number.parseFloat(cs.paddingTop) + Number.parseFloat(cs.paddingBottom);
    ta.style.height = `${Math.min(ta.scrollHeight, max)}px`;
    ta.style.overflowY = ta.scrollHeight > max ? 'auto' : 'hidden';
  }, [input]);

  // Dictée vocale (Web Speech API) : le transcript s'ajoute au texte déjà saisi.
  const dictateBase = useRef('');
  const stt = useSpeechToText((transcript) => {
    const base = dictateBase.current;
    setInput(base && transcript ? `${base} ${transcript}` : base || transcript);
  });
  const toggleMic = () => {
    if (!stt.listening) dictateBase.current = input.trim();
    stt.toggle();
  };

  // Scroll en bas à chaque nouveau message / état d'envoi.
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll au changement de longueur
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages.length, pending]);

  // 1er message avec Gemma : si > 10 s, le modèle est probablement en cours de téléchargement.
  useEffect(() => {
    if (!(send.isPending && provider === 'gemma' && messages.length === 0)) {
      setSlowHint(false);
      return;
    }
    const t = setTimeout(() => setSlowHint(true), 10_000);
    return () => clearTimeout(t);
  }, [send.isPending, provider, messages.length]);

  const submit = () => {
    const prompt = input.trim();
    if (!prompt || send.isPending || !hasKey) return;
    setInput('');
    setPending(prompt);
    send.mutate({ provider, prompt }, { onSettled: () => setPending(null) });
  };

  const empty = messages.length === 0 && !pending;

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div ref={scroller} style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 8 }}>
        {empty ? (
          <div className="chat-empty">
            <AIMark size={34} />
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-2)' }}>
              Ask the agent
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', maxWidth: 240, lineHeight: 1.5 }}>
              It runs in your workspace and can read your files. Try a question or a task.
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                justifyContent: 'center',
                marginTop: 4,
              }}
            >
              {['Explain this project', 'Find and fix a bug', 'Write tests'].map((s) => (
                <button
                  key={s}
                  type="button"
                  className="chip chip-sm chip-press"
                  disabled={!hasKey}
                  onClick={() => setInput(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {messages.map((m) => (
              <Bubble key={m.id} msg={m} />
            ))}
            {pending && (
              <Bubble msg={{ id: 'pending', role: 'user', text: pending, createdAt: 0 }} />
            )}
            {send.isPending && (
              <div className="chat-row">
                <div className="chat-bubble">
                  <ProviderLogo provider={provider} size={18} badge round style={AVA_STYLE} />
                  <Typing />
                  {slowHint && (
                    <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4 }}>
                      First call to Gemma — the local model may still be downloading, this can take
                      a minute…
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="chat-composer">
        {/* Sélecteur de provider + reset : seulement hors dock (le dock les met dans son header). */}
        {showPicker && (hasKey || messages.length > 0) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            {hasKey && (
              <AgentProviderPicker
                provider={provider}
                connected={connected}
                onChange={setProvider}
              />
            )}
            <div style={{ flex: 1 }} />
            {messages.length > 0 && (
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                aria-label="Reset chat"
                title="Reset chat"
                onClick={() => clear.mutate()}
              >
                <HIcon name="trash" size={14} color="var(--muted)" />
              </button>
            )}
          </div>
        )}
        <div className="chat-input">
          <textarea
            ref={textarea}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={hasKey ? 'Message the agent…' : 'Add an API key in Settings to chat'}
            disabled={!hasKey}
            rows={1}
          />
          {stt.supported && (
            <button
              type="button"
              className={`btn btn-ghost btn-icon btn-sm${stt.listening ? ' mic-live' : ''}`}
              aria-label={stt.listening ? 'Stop dictation' : 'Voice input'}
              title={stt.listening ? 'Stop dictation' : 'Voice input'}
              disabled={!hasKey}
              onClick={toggleMic}
            >
              <HIcon
                name="mic"
                size={15}
                color={stt.listening ? 'var(--danger)' : 'var(--muted)'}
              />
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary btn-icon btn-sm"
            aria-label="Send"
            disabled={!input.trim() || send.isPending || !hasKey}
            onClick={submit}
          >
            <HIcon name="send" size={15} color="var(--on-accent)" />
          </button>
        </div>
      </div>
    </div>
  );
}
