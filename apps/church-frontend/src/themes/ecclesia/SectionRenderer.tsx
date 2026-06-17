import React from 'react';
import type { ContentBlock, BlockData, SectionData } from '../../types';
import HeroSection from './sections/HeroSection';
import FeatureCardsSection from './sections/FeatureCardsSection';
import AboutPanelSection from './sections/AboutPanelSection';
import SermonsGridSection from './sections/SermonsGridSection';
import GivingCTASection from './sections/GivingCTASection';
import ServiceTimesSection from './sections/ServiceTimesSection';
import MinistriesSection from './sections/MinistriesSection';

function blockPayload(block: BlockData): Record<string, any> {
  return {
    ...(block.properties || {}),
    ...(block.data || {}),
  };
}

function normalizedType(type: string): string {
  return type.toLowerCase().replace(/_/g, '-');
}

function renderFallback(key: string, title: string, data: Record<string, any>) {
  const heading = data.heading || data.headline || data.title || title;
  const text = data.subheading || data.subtitle || data.text || data.storyText || data.description || '';

  if (!heading && !text && !data.content) return null;

  return (
    <section key={key} className="section">
      <div className="section-head">
        <div>
          {heading && <h2>{heading}</h2>}
        </div>
        {text && <p className="section-note">{text}</p>}
      </div>
      {data.content && <div dangerouslySetInnerHTML={{ __html: data.content }} />}
    </section>
  );
}

function renderStructuredBlock(section: SectionData, block: BlockData, key: string) {
  const data = blockPayload(block);
  const type = normalizedType(String(data.type || block.type || section.key || ''));

  if (type === 'hero') {
    return <HeroSection key={key} data={data} />;
  }

  if (type === 'service-times' || type === 'service-times-section') {
    return <ServiceTimesSection key={key} data={data} />;
  }

  if (type === 'ministries-list' || type === 'ministry-grid' || type === 'dynamic-ministry-directory') {
    return <MinistriesSection key={key} data={{ ...data, heading: data.heading || data.title }} />;
  }

  if (type === 'about-template' || type === 'welcome-section' || type === 'leadership-team') {
    return (
      <AboutPanelSection
        key={key}
        data={{
          ...data,
          heading: data.heading || data.headline || data.title,
          text: data.text || data.storyText || data.subheading,
        }}
      />
    );
  }

  if (
    type === 'sermon-grid' ||
    type === 'sermon-highlights' ||
    type === 'dynamic-sermon-grid' ||
    type === 'dynamic-media-library'
  ) {
    return <SermonsGridSection key={key} data={{ ...data, heading: data.heading || data.title }} />;
  }

  if (type === 'giving-cta' || type === 'giving' || type === 'dynamic-giving-campaign') {
    return (
      <GivingCTASection
        key={key}
        data={{
          ...data,
          heading: data.heading || data.title,
          ctaLabel: data.ctaLabel || data.buttonText,
          ctaUrl: data.ctaUrl || data.buttonUrl,
        }}
      />
    );
  }

  if (
    type === 'feature-grid' ||
    type === 'feature-cards' ||
    type === 'upcoming-events' ||
    type === 'events-preview' ||
    type === 'dynamic-events-grid' ||
    type === 'livestream-cta' ||
    type === 'dynamic-livestream' ||
    type === 'prayer-request-form' ||
    type === 'prayer-cta' ||
    type === 'dynamic-prayer-wall' ||
    type === 'testimony-wall' ||
    type === 'contact-form' ||
    type === 'contact-section' ||
    type === 'cta-section'
  ) {
    return <FeatureCardsSection key={key} data={{ ...data, heading: data.heading || data.title, note: data.subheading || data.text }} />;
  }

  return renderFallback(key, section.title, data);
}

function renderLegacyBlock(block: ContentBlock, index: number) {
  const data = block.data || {};
  const key = `${block.slotKey}-${index}`;

  switch (block.slotKey) {
    case 'hero':
      return <HeroSection key={key} data={data} />;
    case 'features':
    case 'feature-cards':
      return <FeatureCardsSection key={key} data={data} />;
    case 'about':
    case 'about-panel':
      return <AboutPanelSection key={key} data={data} />;
    case 'sermons':
    case 'sermons-grid':
      return <SermonsGridSection key={key} data={data} />;
    case 'giving':
    case 'giving-cta':
      return <GivingCTASection key={key} data={data} />;
    case 'service-times':
      return <ServiceTimesSection key={key} data={data} />;
    case 'ministries':
      return <MinistriesSection key={key} data={data} />;
    default:
      if (data.content) {
        return (
          <section key={key} className="section">
            <div dangerouslySetInnerHTML={{ __html: data.content }} />
          </section>
        );
      }
      return null;
  }
}

export function renderContentBlocks(contentBlocks: ContentBlock[]): React.ReactNode[] {
  return contentBlocks.flatMap((block, blockIndex) => {
    const sections = block.data?.sections;
    if (Array.isArray(sections) && sections.length > 0) {
      return sections.flatMap((section, sectionIndex) => {
        const blocks = Array.isArray(section.blocks) ? section.blocks : [];
        return blocks.map((sectionBlock, sectionBlockIndex) =>
          renderStructuredBlock(section, sectionBlock, `${block.slotKey}-${blockIndex}-${section.id || sectionIndex}-${sectionBlock.id || sectionBlockIndex}`)
        );
      });
    }

    return [renderLegacyBlock(block, blockIndex)];
  }).filter(Boolean);
}
