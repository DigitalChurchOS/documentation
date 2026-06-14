import { useState } from "react";
import type { ThemeState } from "../utils/domParser";
import { colorMap } from "../utils/domParser";
import {
  Type,
  Palette,
  SwatchBook,
  Paintbrush,
  Maximize2,
  Layers,
  AlignVerticalSpaceAround,
  Wand2,
  CloudSun,
  Sun,
  Moon,
} from "lucide-react";

interface CustomizerPanelProps {
  state: ThemeState;
  onChange: (updates: Partial<ThemeState>) => void;
}

const advancedRailItems = [
  { id: "typography", icon: Type, label: "Type" },
  { id: "personality", icon: Palette, label: "Person" },
  { id: "family", icon: SwatchBook, label: "Accent" },
  { id: "style", icon: Paintbrush, label: "Style" },
  { id: "shape", icon: Maximize2, label: "Shape" },
  { id: "visual", icon: Layers, label: "Visual" },
  { id: "density", icon: AlignVerticalSpaceAround, label: "Density" },
  { id: "motion", icon: Wand2, label: "Motion" },
  { id: "atmosphere", icon: CloudSun, label: "Aura" },
];

const presets = {
  horizon: { preset: "Horizon", personality: "Modern", typography: "Modern Sans", typeSize: "Balanced", family: "Blue", style: "Rich", shape: "Soft", visual: "Elevated", density: "Comfortable", motion: "Gentle", atmosphere: "Light" },
  aura: { preset: "Aura", personality: "Premium", typography: "Grace Serif", typeSize: "Heroic", family: "Orchid", style: "Elegant", shape: "Soft", visual: "Glass", density: "Spacious", motion: "Gentle", atmosphere: "Elegant" },
  summit: { preset: "Summit", personality: "Bold", typography: "Bold", typeSize: "Heroic", family: "Red", style: "Vibrant", shape: "Sharp", visual: "Elevated", density: "Comfortable", motion: "Dynamic", atmosphere: "Celebration" },
  canvas: { preset: "Canvas", personality: "Minimal", typography: "Editorial", typeSize: "Reader", family: "Neutral", style: "Soft", shape: "Soft", visual: "Flat", density: "Spacious", motion: "None", atmosphere: "Light" },
  ember: { preset: "Ember", personality: "Modern", typography: "Grace Serif", typeSize: "Balanced", family: "Orange", style: "Rich", shape: "Round", visual: "Soft", density: "Comfortable", motion: "Gentle", atmosphere: "Warm" },
  pulse: { preset: "Pulse", personality: "Youth", typography: "Bold", typeSize: "Heroic", family: "Rose", style: "Vibrant", shape: "Round", visual: "Glass", density: "Comfortable", motion: "Dynamic", atmosphere: "Celebration" },
  eclipse: { preset: "Eclipse", personality: "Premium", typography: "Editorial", typeSize: "Heroic", family: "Purple", style: "Rich", shape: "Soft", visual: "Immersive", density: "Spacious", motion: "Cinematic", atmosphere: "Light" },
  forest: { preset: "Forest", personality: "Modern", typography: "Modern Sans", typeSize: "Balanced", family: "Green", style: "Rich", shape: "Soft", visual: "Elevated", density: "Comfortable", motion: "Gentle", atmosphere: "Light" },
  sunset: { preset: "Sunset", personality: "Bold", typography: "Bold", typeSize: "Heroic", family: "Gold", style: "Vibrant", shape: "Sharp", visual: "Elevated", density: "Comfortable", motion: "Dynamic", atmosphere: "Celebration" },
  ocean: { preset: "Ocean", personality: "Premium", typography: "Editorial", typeSize: "Heroic", family: "Ocean", style: "Rich", shape: "Soft", visual: "Glass", density: "Spacious", motion: "Cinematic", atmosphere: "Light" },
};

export const CustomizerPanel: React.FC<CustomizerPanelProps> = ({ state, onChange }) => {
  const [customizerMode, setCustomizerMode] = useState<"simple" | "advanced">("simple");
  const [activeRail, setActiveRail] = useState<string>("typography");
  const [typoTab, setTypoTab] = useState<"style" | "size">("style");

  const applyPreset = (key: keyof typeof presets) => {
    onChange({ ...presets[key], preset: presets[key].preset });
  };

  const handleValueChange = (key: keyof ThemeState, value: string) => {
    onChange({ [key]: value, preset: "Custom" });
  };

  return (
    <div className="sidebar-view">
      <div className="mode-tabs">
        <button
          className={`mode-tab ${customizerMode === "simple" ? "active" : ""}`}
          onClick={() => setCustomizerMode("simple")}
        >
          Presets
        </button>
        <button
          className={`mode-tab ${customizerMode === "advanced" ? "active" : ""}`}
          onClick={() => setCustomizerMode("advanced")}
        >
          Custom
        </button>
        <button
          className="preview-mode-btn"
          onClick={() => onChange({ previewMode: state.previewMode === "light" ? "dark" : "light" })}
        >
          {state.previewMode === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>

      <div className={`content-shell ${customizerMode === "simple" ? "no-rail" : ""}`}>
        {customizerMode === "advanced" && (
          <nav className="rail">
            {advancedRailItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  className={`rail-btn ${activeRail === item.id ? "active" : ""}`}
                  onClick={() => setActiveRail(item.id)}
                >
                  <IconComponent />
                  {item.label}
                </button>
              );
            })}
          </nav>
        )}

        <div className="panel">
          {customizerMode === "simple" ? (
            <div className="choice-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
              {Object.entries(presets).map(([key, data]) => (
                <button
                  key={key}
                  className={`preset-card ${state.preset.toLowerCase() === data.preset.toLowerCase() ? "active" : ""}`}
                  onClick={() => applyPreset(key as keyof typeof presets)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', padding: '10px' }}
                >
                  <img 
                    src={`${import.meta.env.BASE_URL}images/presets/${key}.png`} 
                    alt={data.preset} 
                    style={{ width: '60px', height: '60px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
                  />
                  <div>
                    <strong style={{ display: 'block', fontSize: '14px' }}>{data.preset}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginTop: '2px' }}>
                      {data.personality} · {data.family} · {data.visual} · {data.atmosphere}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div>
              {activeRail === "typography" && (
                <section>
                  <div className="section-title">
                    <div className="title-icon">
                      <Type size={18} />
                    </div>
                    <h3>Typography</h3>
                  </div>

                  <div className="tab-switch">
                    <button
                      className={`tab-btn ${typoTab === "style" ? "active" : ""}`}
                      onClick={() => setTypoTab("style")}
                    >
                      Style
                    </button>
                    <button
                      className={`tab-btn ${typoTab === "size" ? "active" : ""}`}
                      onClick={() => setTypoTab("size")}
                    >
                      Size
                    </button>
                  </div>

                  {typoTab === "style" ? (
                    <div className="choice-grid">
                      {[
                        { name: "Modern Sans", desc: "Clean and confident", family: "Inter, sans-serif" },
                        { name: "Grace Serif", desc: "Refined and graceful", family: "Georgia, serif" },
                        { name: "Editorial", desc: "Story-rich and elegant", family: "Georgia, 'Times New Roman'" },
                        { name: "Bold", desc: "Strong and energetic", family: "'Bebas Neue', Impact" },
                      ].map((item) => (
                        <button
                          key={item.name}
                          className={`type-card ${state.typography === item.name ? "active" : ""}`}
                          onClick={() => handleValueChange("typography", item.name)}
                        >
                          <div className="type-card-name">{item.name}</div>
                          <div className="type-preview-title" style={{ 
                            fontFamily: item.family,
                            letterSpacing: item.name === "Bold" ? "0.04em" : "inherit"
                          }}>
                            Welcome Home
                          </div>
                          <span>{item.desc}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="choice-grid">
                      {[
                        { name: "Balanced", desc: "Natural readable scale" },
                        { name: "Compact", desc: "Smaller tighter scale" },
                        { name: "Heroic", desc: "Large hero-first scale" },
                        { name: "Reader", desc: "Comfortable body reading" },
                      ].map((item) => (
                        <button
                          key={item.name}
                          className={`type-card ${state.typeSize === item.name ? "active" : ""}`}
                          onClick={() => handleValueChange("typeSize", item.name)}
                        >
                          <div className="type-card-name">{item.name}</div>
                          <span>{item.desc}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {activeRail === "personality" && (
                <section>
                  <div className="section-title">
                    <div className="title-icon">
                      <Palette size={18} />
                    </div>
                    <h3>Personality</h3>
                  </div>
                  <div className="choice-grid">
                    {[
                      { name: "Minimal", desc: "Clean and quiet" },
                      { name: "Modern", desc: "Balanced and polished" },
                      { name: "Bold", desc: "Strong visual impact" },
                      { name: "Classic", desc: "Formal and timeless" },
                      { name: "Youth", desc: "Energetic and expressive" },
                      { name: "Premium", desc: "Elegant and refined" },
                    ].map((item) => (
                      <button
                        key={item.name}
                        className={`choice-btn ${state.personality === item.name ? "active" : ""}`}
                        onClick={() => handleValueChange("personality", item.name)}
                      >
                        <strong>{item.name}</strong>
                        <span>{item.desc}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {activeRail === "family" && (
                <section>
                  <div className="section-title">
                    <div className="title-icon">
                      <SwatchBook size={18} />
                    </div>
                    <h3>Accent Color</h3>
                  </div>
                  <div className="choice-grid two-cols">
                    {Object.entries(colorMap).map(([name, hex]) => (
                      <button
                        key={name}
                        className={`choice-btn color-btn ${state.family === name ? "active" : ""}`}
                        style={{ "--dot": hex } as React.CSSProperties}
                        onClick={() => handleValueChange("family", name)}
                      >
                        <strong>{name}</strong>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {activeRail === "style" && (
                <section>
                  <div className="section-title">
                    <div className="title-icon">
                      <Paintbrush size={18} />
                    </div>
                    <h3>Style</h3>
                  </div>
                  <div className="choice-grid">
                    {[
                      { name: "Soft", desc: "Gentle and light colors" },
                      { name: "Vibrant", desc: "High energy contrasts" },
                      { name: "Rich", desc: "Deep saturated tones" },
                      { name: "Elegant", desc: "Sophisticated and muted" },
                    ].map((item) => (
                      <button
                        key={item.name}
                        className={`choice-btn ${state.style === item.name ? "active" : ""}`}
                        onClick={() => handleValueChange("style", item.name)}
                      >
                        <strong>{item.name}</strong>
                        <span>{item.desc}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {activeRail === "shape" && (
                <section>
                  <div className="section-title">
                    <div className="title-icon">
                      <Maximize2 size={18} />
                    </div>
                    <h3>Shape</h3>
                  </div>
                  <div className="choice-grid">
                    {[
                      { name: "Sharp", desc: "Clean boxy layout" },
                      { name: "Soft", desc: "Smooth rounded corners" },
                      { name: "Round", desc: "Pillow-soft curves" },
                    ].map((item) => (
                      <button
                        key={item.name}
                        className={`choice-btn ${state.shape === item.name ? "active" : ""}`}
                        onClick={() => handleValueChange("shape", item.name)}
                      >
                        <strong>{item.name}</strong>
                        <span>{item.desc}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {activeRail === "visual" && (
                <section>
                  <div className="section-title">
                    <div className="title-icon">
                      <Layers size={18} />
                    </div>
                    <h3>Visual</h3>
                  </div>
                  <div className="choice-grid">
                    {[
                      { name: "Flat", desc: "Solid shapes, no shadows" },
                      { name: "Soft", desc: "Subtle card outlines" },
                      { name: "Glass", desc: "Frosted glass texture" },
                      { name: "Elevated", desc: "Realistic soft card shadows" },
                      { name: "Immersive", desc: "Deep shadows and overlays" },
                    ].map((item) => (
                      <button
                        key={item.name}
                        className={`choice-btn ${state.visual === item.name ? "active" : ""}`}
                        onClick={() => handleValueChange("visual", item.name)}
                      >
                        <strong>{item.name}</strong>
                        <span>{item.desc}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {activeRail === "density" && (
                <section>
                  <div className="section-title">
                    <div className="title-icon">
                      <AlignVerticalSpaceAround size={18} />
                    </div>
                    <h3>Density</h3>
                  </div>
                  <div className="choice-grid">
                    {[
                      { name: "Compact", desc: "Tighter spacing for data-rich pages" },
                      { name: "Comfortable", desc: "Perfect standard margins" },
                      { name: "Spacious", desc: "Open breathing room" },
                    ].map((item) => (
                      <button
                        key={item.name}
                        className={`choice-btn ${state.density === item.name ? "active" : ""}`}
                        onClick={() => handleValueChange("density", item.name)}
                      >
                        <strong>{item.name}</strong>
                        <span>{item.desc}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {activeRail === "motion" && (
                <section>
                  <div className="section-title">
                    <div className="title-icon">
                      <Wand2 size={18} />
                    </div>
                    <h3>Motion</h3>
                  </div>
                  <div className="choice-grid">
                    {[
                      { name: "None", desc: "No animations, instant transitions" },
                      { name: "Gentle", desc: "Subtle fades and micro-hover shifts" },
                      { name: "Dynamic", desc: "Responsive transitions and entries" },
                      { name: "Cinematic", desc: "Sweeping dramatic motion effects" },
                    ].map((item) => (
                      <button
                        key={item.name}
                        className={`choice-btn ${state.motion === item.name ? "active" : ""}`}
                        onClick={() => handleValueChange("motion", item.name)}
                      >
                        <strong>{item.name}</strong>
                        <span>{item.desc}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {activeRail === "atmosphere" && (
                <section>
                  <div className="section-title">
                    <div className="title-icon">
                      <CloudSun size={18} />
                    </div>
                    <h3>Aura</h3>
                  </div>
                  <div className="choice-grid">
                    {[
                      { name: "Light", desc: "Bright clean morning light" },
                      { name: "Warm", desc: "Cozy sepia candle aura" },
                      { name: "Worship", desc: "Contemplative deep rich color" },
                      { name: "Prayer", desc: "Muted focused reading aura" },
                      { name: "Celebration", desc: "Joyful celebratory contrast" },
                      { name: "Elegant", desc: "Premium dark-tinted design" },
                    ].map((item) => (
                      <button
                        key={item.name}
                        className={`choice-btn ${state.atmosphere === item.name ? "active" : ""}`}
                        onClick={() => handleValueChange("atmosphere", item.name)}
                      >
                        <strong>{item.name}</strong>
                        <span>{item.desc}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
