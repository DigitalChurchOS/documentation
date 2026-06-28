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
  SquareStack,
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
  { id: "cards", icon: SquareStack, label: "Cards" },
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

              {activeRail === "cards" && (
                <section>
                  <div className="section-title">
                    <div className="title-icon">
                      <SquareStack size={18} />
                    </div>
                    <h3>Cards</h3>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {/* Thumbnail Fit Section */}
                    <div>
                      <h4 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#71717a", marginBottom: "12px" }}>Thumbnails</h4>
                      
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                        {/* Padded Option */}
                        <div 
                          onClick={() => handleValueChange("cardThumbnailStyle", "padded")}
                          style={{
                            cursor: "pointer",
                            border: `2px solid ${state.cardThumbnailStyle === "padded" ? "var(--accent, #3b82f6)" : "rgba(255,255,255,0.06)"}`,
                            borderRadius: "10px",
                            padding: "12px",
                            background: state.cardThumbnailStyle === "padded" ? "rgba(59,130,246,0.05)" : "rgba(255,255,255,0.02)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            transition: "all 0.25s ease"
                          }}
                        >
                          {/* Visual representation of Padded Card */}
                          <div style={{
                            width: "85px",
                            height: "75px",
                            borderRadius: "8px",
                            background: "var(--bg, #1e293b)",
                            border: "1px solid var(--border, rgba(255,255,255,0.1))",
                            padding: "6px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            boxShadow: "0 4px 6px rgba(0,0,0,0.15)",
                            marginBottom: "8px",
                            boxSizing: "border-box"
                          }}>
                            {/* Inner thumbnail */}
                            <div style={{
                              width: "100%",
                              height: "38px",
                              borderRadius: "5px",
                              background: "linear-gradient(135deg, var(--accent, #3b82f6) 40%, var(--primary-soft, #60a5fa))",
                              opacity: 0.95
                            }}></div>
                            {/* Text lines */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                              <div style={{ width: "80%", height: "4px", background: "var(--text, #e4e4e7)", opacity: 0.3, borderRadius: "2px" }}></div>
                              <div style={{ width: "50%", height: "4px", background: "var(--text, #e4e4e7)", opacity: 0.3, borderRadius: "2px" }}></div>
                            </div>
                          </div>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: state.cardThumbnailStyle === "padded" ? "var(--accent, #3b82f6)" : "var(--text-muted, #71717a)" }}>Padded</span>
                        </div>

                        {/* Full-bleed Option */}
                        <div 
                          onClick={() => handleValueChange("cardThumbnailStyle", "full-bleed")}
                          style={{
                            cursor: "pointer",
                            border: `2px solid ${state.cardThumbnailStyle === "full-bleed" ? "var(--accent, #3b82f6)" : "rgba(255,255,255,0.06)"}`,
                            borderRadius: "10px",
                            padding: "12px",
                            background: state.cardThumbnailStyle === "full-bleed" ? "rgba(59,130,246,0.05)" : "rgba(255,255,255,0.02)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            transition: "all 0.25s ease"
                          }}
                        >
                          {/* Visual representation of Full-bleed Card */}
                          <div style={{
                            width: "85px",
                            height: "75px",
                            borderRadius: "8px",
                            background: "var(--bg, #1e293b)",
                            border: "1px solid var(--border, rgba(255,255,255,0.1))",
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            boxShadow: "0 4px 6px rgba(0,0,0,0.15)",
                            marginBottom: "8px",
                            boxSizing: "border-box"
                          }}>
                            {/* Inner thumbnail full bleed */}
                            <div style={{
                              width: "100%",
                              height: "46px",
                              background: "linear-gradient(135deg, var(--accent, #3b82f6) 40%, var(--primary-soft, #60a5fa))",
                              opacity: 0.95
                            }}></div>
                            {/* Text lines */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "3px", padding: "0 6px 6px 6px" }}>
                              <div style={{ width: "80%", height: "4px", background: "var(--text, #e4e4e7)", opacity: 0.3, borderRadius: "2px" }}></div>
                              <div style={{ width: "50%", height: "4px", background: "var(--text, #e4e4e7)", opacity: 0.3, borderRadius: "2px" }}></div>
                            </div>
                          </div>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: state.cardThumbnailStyle === "full-bleed" ? "var(--accent, #3b82f6)" : "var(--text-muted, #71717a)" }}>Full Edge</span>
                        </div>
                      </div>
                    </div>

                    {/* Grid Gap Override Section */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <h4 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#71717a", margin: 0 }}>Grid Gap</h4>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--accent, #3b82f6)" }}>
                          {state.cardGridGapOverride === "small" ? "Small (25px)" :
                           state.cardGridGapOverride === "medium" ? "Medium (35px)" :
                           state.cardGridGapOverride === "big" ? "Big (40px)" : "Large (45px)"}
                        </span>
                      </div>
                      
                      <div style={{ padding: "0 4px", position: "relative" }}>
                        <input 
                          type="range" 
                          min="1" 
                          max="4" 
                          step="1"
                          value={
                            state.cardGridGapOverride === "small" ? "1" :
                            state.cardGridGapOverride === "medium" ? "2" :
                            state.cardGridGapOverride === "big" ? "3" : "4"
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            const mapped = val === "1" ? "small" : val === "2" ? "medium" : val === "3" ? "big" : "large";
                            handleValueChange("cardGridGapOverride", mapped);
                          }}
                          style={{
                            width: "100%",
                            cursor: "pointer",
                            accentColor: "var(--accent, #3b82f6)",
                            background: "rgba(255,255,255,0.08)",
                            borderRadius: "4px",
                            height: "6px",
                            outline: "none",
                            border: "none"
                          }}
                        />
                        
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", padding: "0 2px" }}>
                          <span style={{ fontSize: "10px", fontWeight: 500, color: "#52525b" }}>25px</span>
                          <span style={{ fontSize: "10px", fontWeight: 500, color: "#52525b" }}>35px</span>
                          <span style={{ fontSize: "10px", fontWeight: 500, color: "#52525b" }}>40px</span>
                          <span style={{ fontSize: "10px", fontWeight: 500, color: "#52525b" }}>45px</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Padding Override Section */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <h4 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#71717a", marginBottom: "12px" }}>Padding</h4>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--accent, #3b82f6)" }}>
                          {state.cardPaddingOverride === "small" ? "Small (10px / 15px)" :
                           state.cardPaddingOverride === "medium" ? "Medium (15px / 20px)" :
                           state.cardPaddingOverride === "big" ? "Big (20px / 25px)" : "Large (25px / 30px)"}
                        </span>
                      </div>
                      
                      <div style={{ padding: "0 4px", position: "relative" }}>
                        <input 
                          type="range" 
                          min="1" 
                          max="4" 
                          step="1"
                          value={
                            state.cardPaddingOverride === "small" ? "1" :
                            state.cardPaddingOverride === "medium" ? "2" :
                            state.cardPaddingOverride === "big" ? "3" : "4"
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            const mapped = val === "1" ? "small" : val === "2" ? "medium" : val === "3" ? "big" : "large";
                            handleValueChange("cardPaddingOverride", mapped);
                          }}
                          style={{
                            width: "100%",
                            cursor: "pointer",
                            accentColor: "var(--accent, #3b82f6)",
                            background: "rgba(255,255,255,0.08)",
                            borderRadius: "4px",
                            height: "6px",
                            outline: "none",
                            border: "none"
                          }}
                        />
                        
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", padding: "0 2px" }}>
                          <span style={{ fontSize: "10px", fontWeight: 500, color: "#52525b", display: "inline-block" }}>
                            <div>10px</div>
                            <div style={{ opacity: 0.6 }}>15px</div>
                          </span>
                          <span style={{ fontSize: "10px", fontWeight: 500, color: "#52525b", display: "inline-block", textAlign: "center" }}>
                            <div>15px</div>
                            <div style={{ opacity: 0.6 }}>20px</div>
                          </span>
                          <span style={{ fontSize: "10px", fontWeight: 500, color: "#52525b", display: "inline-block", textAlign: "center" }}>
                            <div>20px</div>
                            <div style={{ opacity: 0.6 }}>25px</div>
                          </span>
                          <span style={{ fontSize: "10px", fontWeight: 500, color: "#52525b", display: "inline-block", textAlign: "right" }}>
                            <div>25px</div>
                            <div style={{ opacity: 0.6 }}>30px</div>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Hover Effect Section */}
                    <div>
                      <h4 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#71717a", marginBottom: "12px" }}>Hover Effect</h4>
                      
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                        {/* None (Static) Option */}
                        <div 
                          onClick={() => handleValueChange("cardHoverEffect", "none")}
                          style={{
                            cursor: "pointer",
                            border: `2px solid ${state.cardHoverEffect === "none" ? "var(--accent, #3b82f6)" : "rgba(255,255,255,0.06)"}`,
                            borderRadius: "10px",
                            padding: "12px",
                            background: state.cardHoverEffect === "none" ? "rgba(59,130,246,0.05)" : "rgba(255,255,255,0.02)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            transition: "all 0.25s ease"
                          }}
                        >
                          <div style={{ height: "65px", display: "flex", alignItems: "center" }}>
                            <div 
                              style={{
                                width: "70px",
                                height: "48px",
                                borderRadius: "6px",
                                background: "var(--bg, #1e293b)",
                                border: "1px solid var(--border, rgba(255,255,255,0.1))",
                                display: "flex",
                                flexDirection: "column",
                                padding: "4px",
                                gap: "4px",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                                boxSizing: "border-box"
                              }}
                            >
                              <div style={{ width: "100%", height: "22px", background: "var(--primary-soft, rgba(255,255,255,0.05))", borderRadius: "3px" }}></div>
                              <div style={{ width: "70%", height: "3px", background: "var(--text, #e4e4e7)", opacity: 0.3, borderRadius: "1.5px" }}></div>
                            </div>
                          </div>
                          <span style={{ fontSize: "12px", fontWeight: 600, marginTop: "8px", color: state.cardHoverEffect === "none" ? "var(--accent, #3b82f6)" : "var(--text-muted, #71717a)" }}>None</span>
                        </div>

                        {/* Grow Option */}
                        <div 
                          onClick={() => handleValueChange("cardHoverEffect", "grow")}
                          className="hover-card-preview-container"
                          style={{
                            cursor: "pointer",
                            border: `2px solid ${state.cardHoverEffect === "grow" ? "var(--accent, #3b82f6)" : "rgba(255,255,255,0.06)"}`,
                            borderRadius: "10px",
                            padding: "12px",
                            background: state.cardHoverEffect === "grow" ? "rgba(59,130,246,0.05)" : "rgba(255,255,255,0.02)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            transition: "all 0.25s ease"
                          }}
                        >
                          <div style={{ height: "65px", display: "flex", alignItems: "center" }}>
                            <div 
                              className="mockup-card-grow"
                              style={{
                                width: "70px",
                                height: "48px",
                                borderRadius: "6px",
                                background: "var(--bg, #1e293b)",
                                border: "1px solid var(--border, rgba(255,255,255,0.1))",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                                transition: "all 0.3s ease",
                                display: "flex",
                                flexDirection: "column",
                                padding: "4px",
                                gap: "4px",
                                boxSizing: "border-box"
                              }}
                            >
                              <div style={{ width: "100%", height: "22px", background: "var(--primary-soft, rgba(255,255,255,0.05))", borderRadius: "3px" }}></div>
                              <div style={{ width: "70%", height: "3px", background: "var(--text, #e4e4e7)", opacity: 0.3, borderRadius: "1.5px" }}></div>
                            </div>
                          </div>
                          <span style={{ fontSize: "12px", fontWeight: 600, marginTop: "8px", color: state.cardHoverEffect === "grow" ? "var(--accent, #3b82f6)" : "var(--text-muted, #71717a)" }}>Grow</span>
                        </div>

                        {/* Lift Card Option */}
                        <div 
                          onClick={() => handleValueChange("cardHoverEffect", "lift")}
                          className="hover-card-preview-container"
                          style={{
                            cursor: "pointer",
                            border: `2px solid ${state.cardHoverEffect === "lift" ? "var(--accent, #3b82f6)" : "rgba(255,255,255,0.06)"}`,
                            borderRadius: "10px",
                            padding: "12px",
                            background: state.cardHoverEffect === "lift" ? "rgba(59,130,246,0.05)" : "rgba(255,255,255,0.02)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            transition: "all 0.25s ease"
                          }}
                        >
                          <div style={{ height: "65px", display: "flex", alignItems: "center" }}>
                            <div 
                              className="mockup-card-lift"
                              style={{
                                width: "70px",
                                height: "48px",
                                borderRadius: "6px",
                                background: "var(--bg, #1e293b)",
                                border: "1px solid var(--border, rgba(255,255,255,0.1))",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                                transition: "all 0.3s ease",
                                display: "flex",
                                flexDirection: "column",
                                padding: "4px",
                                gap: "4px",
                                boxSizing: "border-box"
                              }}
                            >
                              <div style={{ width: "100%", height: "22px", background: "var(--primary-soft, rgba(255,255,255,0.05))", borderRadius: "3px" }}></div>
                              <div style={{ width: "70%", height: "3px", background: "var(--text, #e4e4e7)", opacity: 0.3, borderRadius: "1.5px" }}></div>
                            </div>
                          </div>
                          <span style={{ fontSize: "12px", fontWeight: 600, marginTop: "8px", color: state.cardHoverEffect === "lift" ? "var(--accent, #3b82f6)" : "var(--text-muted, #71717a)" }}>Lift Card</span>
                        </div>

                        {/* Drop Shadow Option */}
                        <div 
                          onClick={() => handleValueChange("cardHoverEffect", "shadow")}
                          className="hover-card-preview-container"
                          style={{
                            cursor: "pointer",
                            border: `2px solid ${state.cardHoverEffect === "shadow" ? "var(--accent, #3b82f6)" : "rgba(255,255,255,0.06)"}`,
                            borderRadius: "10px",
                            padding: "12px",
                            background: state.cardHoverEffect === "shadow" ? "rgba(59,130,246,0.05)" : "rgba(255,255,255,0.02)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            transition: "all 0.25s ease"
                          }}
                        >
                          <div style={{ height: "65px", display: "flex", alignItems: "center" }}>
                            <div 
                              className="mockup-card-shadow"
                              style={{
                                width: "70px",
                                height: "48px",
                                borderRadius: "6px",
                                background: "var(--bg, #1e293b)",
                                border: "1px solid var(--border, rgba(255,255,255,0.1))",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                                transition: "all 0.3s ease",
                                display: "flex",
                                flexDirection: "column",
                                padding: "4px",
                                gap: "4px",
                                boxSizing: "border-box"
                              }}
                            >
                              <div style={{ width: "100%", height: "22px", background: "var(--primary-soft, rgba(255,255,255,0.05))", borderRadius: "3px" }}></div>
                              <div style={{ width: "70%", height: "3px", background: "var(--text, #e4e4e7)", opacity: 0.3, borderRadius: "1.5px" }}></div>
                            </div>
                          </div>
                          <span style={{ fontSize: "12px", fontWeight: 600, marginTop: "8px", color: state.cardHoverEffect === "shadow" ? "var(--accent, #3b82f6)" : "var(--text-muted, #71717a)" }}>Drop Shadow</span>
                        </div>

                        {/* Zoom Image Option */}
                        <div 
                          onClick={() => handleValueChange("cardHoverEffect", "zoom")}
                          className="hover-card-preview-container"
                          style={{
                            cursor: "pointer",
                            border: `2px solid ${state.cardHoverEffect === "zoom" ? "var(--accent, #3b82f6)" : "rgba(255,255,255,0.06)"}`,
                            borderRadius: "10px",
                            padding: "12px",
                            background: state.cardHoverEffect === "zoom" ? "rgba(59,130,246,0.05)" : "rgba(255,255,255,0.02)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            transition: "all 0.25s ease"
                          }}
                        >
                          <div style={{ height: "65px", display: "flex", alignItems: "center" }}>
                            <div 
                              style={{
                                width: "70px",
                                height: "48px",
                                borderRadius: "6px",
                                background: "var(--bg, #1e293b)",
                                border: "1px solid var(--border, rgba(255,255,255,0.1))",
                                overflow: "hidden",
                                display: "flex",
                                flexDirection: "column",
                                padding: "4px",
                                gap: "4px",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                                boxSizing: "border-box"
                              }}
                            >
                              <div style={{ width: "100%", height: "22px", overflow: "hidden", borderRadius: "3px" }}>
                                <div className="mockup-img-zoom" style={{ width: "100%", height: "100%", background: "var(--accent, #3b82f6)", opacity: 0.8, transition: "transform 0.3s ease" }}></div>
                              </div>
                              <div style={{ width: "70%", height: "3px", background: "var(--text, #e4e4e7)", opacity: 0.3, borderRadius: "1.5px" }}></div>
                            </div>
                          </div>
                          <span style={{ fontSize: "12px", fontWeight: 600, marginTop: "8px", color: state.cardHoverEffect === "zoom" ? "var(--accent, #3b82f6)" : "var(--text-muted, #71717a)" }}>Zoom Image</span>
                        </div>

                        {/* Accent Glow Option */}
                        <div 
                          onClick={() => handleValueChange("cardHoverEffect", "glow")}
                          className="hover-card-preview-container"
                          style={{
                            cursor: "pointer",
                            border: `2px solid ${state.cardHoverEffect === "glow" ? "var(--accent, #3b82f6)" : "rgba(255,255,255,0.06)"}`,
                            borderRadius: "10px",
                            padding: "12px",
                            background: state.cardHoverEffect === "glow" ? "rgba(59,130,246,0.05)" : "rgba(255,255,255,0.02)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            transition: "all 0.25s ease"
                          }}
                        >
                          <div style={{ height: "65px", display: "flex", alignItems: "center" }}>
                            <div 
                              className="mockup-card-glow"
                              style={{
                                width: "70px",
                                height: "48px",
                                borderRadius: "6px",
                                background: "var(--bg, #1e293b)",
                                border: "1px solid var(--border, rgba(255,255,255,0.1))",
                                transition: "all 0.3s ease",
                                display: "flex",
                                flexDirection: "column",
                                padding: "4px",
                                gap: "4px",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                                boxSizing: "border-box"
                              }}
                            >
                              <div style={{ width: "100%", height: "22px", background: "var(--primary-soft, rgba(255,255,255,0.05))", borderRadius: "3px" }}></div>
                              <div style={{ width: "70%", height: "3px", background: "var(--text, #e4e4e7)", opacity: 0.3, borderRadius: "1.5px" }}></div>
                            </div>
                          </div>
                          <span style={{ fontSize: "12px", fontWeight: 600, marginTop: "8px", color: state.cardHoverEffect === "glow" ? "var(--accent, #3b82f6)" : "var(--text-muted, #71717a)" }}>Accent Glow</span>
                        </div>
                      </div>
                    </div>
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
