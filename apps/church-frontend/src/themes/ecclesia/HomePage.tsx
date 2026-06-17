/* ── Ecclesia Homepage ────────────────────────────────── */
import React from 'react';
import type { ContentBlock } from '../../types';
import HeroSection from './sections/HeroSection';
import FeatureCardsSection from './sections/FeatureCardsSection';
import AboutPanelSection from './sections/AboutPanelSection';
import SermonsGridSection from './sections/SermonsGridSection';
import GivingCTASection from './sections/GivingCTASection';
import ServiceTimesSection from './sections/ServiceTimesSection';
import MinistriesSection from './sections/MinistriesSection';
import { renderContentBlocks } from './SectionRenderer';

interface Props {
  contentBlocks?: ContentBlock[];
}

const HomePage: React.FC<Props> = ({ contentBlocks = [] }) => {
  if (!contentBlocks || contentBlocks.length === 0) {
    // Default fallback layout if no CMS blocks are provided
    return (
      <>
        <HeroSection data={{}} />
        <FeatureCardsSection />
        <AboutPanelSection />
        <SermonsGridSection />
        <GivingCTASection />
        <ServiceTimesSection />
        <MinistriesSection />
      </>
    );
  }

  return <>{renderContentBlocks(contentBlocks)}</>;
};

export default HomePage;
