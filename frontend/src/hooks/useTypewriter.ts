import { useEffect, useState } from 'react';

export function useTypewriter(text: string, speed = 14): string {
  const [output, setOutput] = useState('');

  useEffect(() => {
    setOutput('');
    if (!text) return;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setOutput(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, speed);
    return () => window.clearInterval(id);
  }, [text, speed]);

  return output;
}
