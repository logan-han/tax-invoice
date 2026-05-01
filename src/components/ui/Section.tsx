import type { ReactNode } from 'react';

interface SectionProps {
  n: number;
  title: string;
  meta?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}

export default function Section({ n, title, meta, action, children }: SectionProps) {
  return (
    <section className="section">
      <div className="section-head">
        <div className="section-head-left">
          <span className="section-num">{String(n).padStart(2, '0')}</span>
          <h2 className="section-title">{title}</h2>
        </div>
        <div className="hstack-8">
          {meta && <span className="section-meta">{meta}</span>}
          {action}
        </div>
      </div>
      <div className="section-body">{children}</div>
    </section>
  );
}
