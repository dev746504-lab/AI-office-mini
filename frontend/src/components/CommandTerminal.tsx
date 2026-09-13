import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import './CommandTerminal.css';
import { AgentBadge } from './AgentBadge';
import { getEntryVisual } from '../agentTheme';
import type { AiConfigEntry } from '../types';

interface CommandTerminalProps {
  entry: AiConfigEntry | null;
  content: string;
  onChange: (value: string) => void;
  isDirty: boolean;
  saving: boolean;
  loadingContent: boolean;
  fileMissing: boolean;
  contentError: string | null;
  onSave: () => void;
}

const EQ_BARS = [0, 1, 2, 3, 4];

export function CommandTerminal({
  entry,
  content,
  onChange,
  isDirty,
  saving,
  loadingContent,
  fileMissing,
  contentError,
  onSave,
}: CommandTerminalProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<number | undefined>(undefined);
  const [isTyping, setIsTyping] = useState(false);

  const lineCount = useMemo(() => Math.max(1, content.split('\n').length), [content]);

  useEffect(() => () => window.clearTimeout(typingTimeout.current), []);

  const handleChange = (value: string) => {
    onChange(value);
    setIsTyping(true);
    window.clearTimeout(typingTimeout.current);
    typingTimeout.current = window.setTimeout(() => setIsTyping(false), 450);
  };

  const handleScroll = () => {
    if (gutterRef.current && textareaRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  if (!entry) {
    return (
      <div className="glass-panel glass-edge-glow relative flex flex-1 items-center justify-center rounded-3xl">
        <p className="font-mono text-sm" style={{ color: 'var(--color-mono-dim)' }}>
          &gt; Chọn một AI bên trái để bắt đầu ra chỉ thị...
        </p>
      </div>
    );
  }

  const { color, icon } = getEntryVisual(entry);
  const canSave = isDirty && !saving && !loadingContent;

  return (
    <div
      className={`glass-panel glass-edge-glow relative flex flex-1 flex-col overflow-hidden rounded-3xl transition-shadow duration-300 ${
        isTyping ? 'terminal-border-active' : ''
      }`}
    >
      <div className="scanline" />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 border-b border-white/8 px-5 py-4">
        <AgentBadge color={color} icon={icon} size={38} />
        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={entry.agentName}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="truncate font-display text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--color-ink)' }}>
                {entry.label}
              </h1>
              <p className="truncate font-mono text-[11px]" style={{ color: 'var(--color-mono-dim)' }}>
                .claude/{entry.path}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Audio visualizer khi dang go phim */}
        <div className="hidden items-end gap-[3px] sm:flex" style={{ height: 18 }} aria-hidden="true">
          {EQ_BARS.map((i) => (
            <span
              key={i}
              className="eq-bar w-[3px] rounded-full"
              style={{
                height: '100%',
                background: color,
                boxShadow: `0 0 6px ${color}`,
                animationDelay: `${i * 0.09}s`,
                animationPlayState: isTyping ? 'running' : 'paused',
                opacity: isTyping ? 1 : 0.15,
              }}
            />
          ))}
        </div>

        <span
          className="rounded-full px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-wider transition-colors"
          style={
            isDirty
              ? { background: 'rgba(251,191,36,0.12)', color: 'var(--color-amber)', border: '1px solid rgba(251,191,36,0.3)' }
              : { background: 'rgba(52,211,153,0.12)', color: 'var(--color-green)', border: '1px solid rgba(52,211,153,0.3)' }
          }
        >
          {isDirty ? 'Chưa lưu' : 'Đã lưu'}
        </span>
      </div>

      {/* Banners */}
      <div className="relative z-10 flex flex-col gap-2 px-5 pt-3">
        {fileMissing && (
          <div
            className="rounded-lg px-3 py-2 font-mono text-xs"
            style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', color: 'var(--color-amber)' }}
          >
            File này chưa tồn tại. Nhập nội dung rồi bấm "Lưu Chỉ Thị" để tạo mới.
          </div>
        )}
        {contentError && (
          <div
            className="rounded-lg px-3 py-2 font-mono text-xs"
            style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', color: 'var(--color-red)' }}
          >
            {contentError}
          </div>
        )}
      </div>

      {/* Command editor body */}
      <div className="relative z-10 flex flex-1 overflow-hidden px-5 py-4">
        <div
          ref={gutterRef}
          className="terminal-gutter select-none overflow-hidden pr-3 text-right"
          style={{ color: 'var(--color-mono-dim)' }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(event) => handleChange(event.target.value)}
          onScroll={handleScroll}
          disabled={loadingContent}
          spellCheck={false}
          wrap="off"
          placeholder="// Nhập chỉ thị / quy tắc cho AI này bằng văn bản thường..."
          className="terminal-code terminal-textarea flex-1 resize-none border-l border-white/8 bg-transparent pl-3 outline-none disabled:opacity-40"
          style={{ color: 'var(--color-ink)' }}
        />
      </div>

      {/* Deploy button */}
      <div className="relative z-10 flex items-center justify-end px-5 pb-5">
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          className="group relative h-11 w-48 overflow-hidden rounded-xl font-display text-[11px] font-bold uppercase tracking-[0.12em] transition-opacity disabled:cursor-not-allowed disabled:opacity-35"
          style={{
            background: 'linear-gradient(135deg, var(--color-cyan), #0891b2)',
            color: '#031018',
          }}
        >
          <span className="laser-sweep absolute inset-0" />
          <AnimatePresence mode="wait" initial={false}>
            {saving ? (
              <motion.div
                key="saving"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative flex h-full w-full items-center justify-center gap-2"
              >
                <span className="relative h-1.5 w-24 overflow-hidden rounded-full bg-black/25">
                  <span className="progress-indeterminate absolute inset-y-0 left-0 w-1/2 rounded-full bg-[#031018]/70" />
                </span>
                <span>Triển khai...</span>
              </motion.div>
            ) : (
              <motion.span
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative flex h-full w-full items-center justify-center gap-2"
              >
                🚀 Lưu Chỉ Thị
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );
}
