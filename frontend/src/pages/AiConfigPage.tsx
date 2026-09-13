import { useCallback, useEffect, useMemo, useState } from 'react';
import { BackgroundScene } from '../components/BackgroundScene';
import { AgentSidebar } from '../components/AgentSidebar';
import { CommandTerminal } from '../components/CommandTerminal';
import { CommandToast, type CommandToastState } from '../components/CommandToast';
import { fetchConfigContent, fetchConfigList, saveConfigContent } from '../api';
import type { AiConfigEntry, ApiError } from '../types';

export default function AiConfigPage() {
  const [entries, setEntries] = useState<AiConfigEntry[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const [content, setContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [fileMissing, setFileMissing] = useState(false);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);
  const [saving, setSaving] = useState(false);

  const [listError, setListError] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [toast, setToast] = useState<CommandToastState | null>(null);

  const isDirty = content !== savedContent;

  const showToast = useCallback((message: string, type: CommandToastState['type']) => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3800);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingList(true);

    fetchConfigList()
      .then((data) => {
        if (cancelled) return;
        setEntries(data);
        setListError(null);
        if (data.length > 0) setSelected((current) => current ?? data[0].agentName);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setListError((err as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoadingList(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const loadContent = useCallback((agentName: string) => {
    setLoadingContent(true);
    setContentError(null);
    setFileMissing(false);

    fetchConfigContent(agentName)
      .then((data) => {
        setContent(data.content);
        setSavedContent(data.content);
      })
      .catch((err: unknown) => {
        const apiError = err as ApiError;
        if (apiError.status === 404) {
          setFileMissing(true);
          setContent('');
          setSavedContent('');
        } else {
          setContentError(apiError.message);
        }
      })
      .finally(() => setLoadingContent(false));
  }, []);

  useEffect(() => {
    if (selected) loadContent(selected);
  }, [selected, loadContent]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const handleSelect = (agentName: string) => {
    if (agentName === selected) return;
    if (isDirty) {
      const confirmed = window.confirm('Bạn có chỉ thị chưa lưu. Chuyển AI khác và huỷ thay đổi này?');
      if (!confirmed) return;
    }
    setSelected(agentName);
  };

  const handleSave = async () => {
    if (!selected || !isDirty) return;
    setSaving(true);
    try {
      const result = await saveConfigContent(selected, content);
      setSavedContent(result.content);
      setFileMissing(false);
      showToast(`Đã cập nhật chỉ thị cho "${result.label}".`, 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const departments = useMemo(() => entries.filter((e) => e.group === 'department'), [entries]);
  const activeEntry = useMemo(() => entries.find((e) => e.agentName === selected) ?? null, [entries, selected]);

  return (
    <div className="relative flex h-full flex-col gap-4 p-4 md:p-6">
      <BackgroundScene departments={departments} activeAgent={selected} />

      <div className="relative z-10">
        <h1 className="font-display text-lg font-bold tracking-wider" style={{ color: 'var(--color-ink)' }}>
          WAR ROOM — CẤU HÌNH AI
        </h1>
        <p className="font-mono text-[11px] tracking-widest" style={{ color: 'var(--color-mono-dim)' }}>
          // QUẢN LÝ KỊCH BẢN AI
        </p>
      </div>

      <div className="relative z-10 flex flex-1 flex-col gap-4 overflow-hidden pb-36 md:flex-row md:pb-44">
        {loadingList ? (
          <div className="font-mono text-xs" style={{ color: 'var(--color-mono-dim)' }}>
            &gt; Đang kết nối tới hệ thống...
          </div>
        ) : listError ? (
          <div className="font-mono text-xs" style={{ color: 'var(--color-red)' }}>
            {listError}
          </div>
        ) : (
          <AgentSidebar
            entries={entries}
            selected={selected}
            dirtyAgent={isDirty ? selected : null}
            onSelect={handleSelect}
          />
        )}

        <CommandTerminal
          entry={activeEntry}
          content={content}
          onChange={setContent}
          isDirty={isDirty}
          saving={saving}
          loadingContent={loadingContent}
          fileMissing={fileMissing}
          contentError={contentError}
          onSave={handleSave}
        />
      </div>

      <CommandToast toast={toast} />
    </div>
  );
}
