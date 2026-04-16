/**
 * ChatWindow.tsx
 * Main chat interface component with streaming and skill selection.
 *
 * @version 1.0.0
 */

import { useState, useEffect, useRef } from 'preact/hooks';
import { useInjection } from '../hooks/useInjection';
import { RunAgentTurnUseCase } from '@application/usecases/RunAgentTurnUseCase';
import { TOKENS } from '@infrastructure/di/tokens';
import { IEventEmitter } from '@domain/ports/IEventEmitter';
import { IMemoryStore } from '@domain/ports/IMemoryStore';
import { Skill } from '@domain/skill/Skill';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  isStreaming?: boolean;
}

export function ChatWindow() {
  const runTurn = useInjection<RunAgentTurnUseCase>(RunAgentTurnUseCase);
  const eventBus = useInjection<IEventEmitter>(TOKENS.EventBus);
  const memoryStore = useInjection<IMemoryStore>(TOKENS.MemoryStore);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [activeSkillId, setActiveSkillId] = useState<string>('');
  const messagesEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    memoryStore.listSkills().then(r => r.ok && setSkills(r.value));
  }, []);

  useEffect(() => {
    if (convId) {
      memoryStore.getConversation(convId as any).then(r => {
        if (r.ok) {
          const msgs: Message[] = [];
          r.value.turns.forEach(t => {
            msgs.push({ id: t.id, role: 'user', content: t.userMessage });
            msgs.push({ id: t.id + '-a', role: 'assistant', content: t.assistantResponse });
          });
          setMessages(msgs);
        }
      });
    }
  }, [convId]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const unsubToken = eventBus.on('llm:stream:token', ({ token }: any) => {
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && last.isStreaming) {
          return [
            ...prev.slice(0, -1),
            { ...last, content: last.content + token }
          ];
        }
        return [...prev, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: token,
          isStreaming: true
        }];
      });
    });

    const unsubComplete = eventBus.on('orchestrator:turn:completed', () => {
      setMessages(prev => prev.map((m, i) =>
        i === prev.length - 1 && m.isStreaming
          ? { ...m, isStreaming: false }
          : m
      ));
      setLoading(false);
    });

    return () => { unsubToken(); unsubComplete(); };
  }, [eventBus]);

  const haptic = () => 'vibrate' in navigator && navigator.vibrate(10);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    haptic();
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    const result = await runTurn.execute({
      conversationId: convId as any,
      userMessage: input,
      activeSkillId: activeSkillId || undefined
    });
    if (!result.ok) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Error: ${result.error.message}`
      }]);
      setLoading(false);
    } else if (!convId) {
      setConvId(result.value.conversation.id);
    }
  };

  return (
    <div class="chat-window">
      <div class="messages">
        {messages.map(m => (
          <div key={m.id} class={`message ${m.role}`}>
            <strong>{m.role === 'user' ? 'You' : 'Genesis'}:</strong> {m.content}
            {m.isStreaming && <span class="cursor">▌</span>}
          </div>
        ))}
        <div ref={messagesEnd} />
      </div>
      <form class="input-form" onSubmit={handleSubmit}>
        <select value={activeSkillId} onChange={e => setActiveSkillId(e.currentTarget.value)}>
          <option value="">Default</option>
          {skills.map(s => <option value={s.id}>{s.name}</option>)}
        </select>
        <input
          type="text"
          value={input}
          onInput={e => setInput(e.currentTarget.value)}
          placeholder="Message Genesis..."
          disabled={loading}
        />
        <button type="submit" disabled={loading}>Send</button>
      </form>
    </div>
  );
}
