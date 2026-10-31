'use client';

import { useEffect, useState } from 'react';

export function TodayLabel() {
  const [label, setLabel] = useState('');

  useEffect(() => {
    setLabel(
      new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeZone: 'Asia/Kolkata',
      }).format(new Date()),
    );
  }, []);

  return (
    <p className="shrink-0 text-xs text-muted-foreground tabular-nums" suppressHydrationWarning>
      {label || 'Today'}
    </p>
  );
}
