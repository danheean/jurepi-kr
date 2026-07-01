'use client';

interface Props {
  message: string;
  details: string;
}

export function MalformedSequenceError({ message, details }: Props) {
  return (
    <div className="rounded-lg bg-danger/10 border border-danger/30 p-4 space-y-2">
      <p className="font-semibold text-danger-ink text-sm">{message}</p>
      <p className="text-xs text-text-secondary whitespace-pre-wrap">{details}</p>
    </div>
  );
}
