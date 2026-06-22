/* ── Ecclesia Generic Page ──────────────────────────────── */
import React from 'react';
import type { ContentBlock } from '../../types';
import { renderContentBlocks } from './SectionRenderer';

interface Props {
  title: string;
  contentBlocks?: ContentBlock[];
}

const GenericPage: React.FC<Props> = ({ title, contentBlocks = [] }) => {
  return (
    <div className="generic-page">
      {/* Page header banner */}
      <header className="page-header" style={{ padding: '80px 24px', background: 'var(--surface-soft)', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
        <div style={{ maxWidth: 'var(--max)', margin: '0 auto' }}>
          <h1 style={{ fontSize: '3.2rem', fontFamily: 'var(--font-heading)', margin: '0 0 12px 0' }}>{title}</h1>
          <p style={{ color: 'var(--muted)', fontSize: '1.1rem', margin: 0 }}>Digital Church OS · Ecclesia Theme</p>
        </div>
      </header>

      {/* Page Content */}
      <div className="page-content" style={{ maxWidth: 'var(--max)', margin: '0 auto', padding: '60px 24px' }}>
        {contentBlocks.length === 0 ? (
          <article className="prose">
            <p>Welcome to the {title} page. This page is currently under construction. Please check back soon!</p>
          </article>
        ) : (
          renderContentBlocks(contentBlocks)
        )}
      </div>
    </div>
  );
};

export default GenericPage;
