import { useState, useEffect } from "react";
import type { ThemeState } from "../utils/domParser";
import { Edit3, LayoutTemplate, PanelTop, PanelBottom, ChevronLeft, Trash2, Copy, RotateCcw } from "lucide-react";

interface SelectedElementData {
  path: string;
  type: string;
  label: string;
  text: string;
  href: string;
  src: string;
  alt: string;
  tagName?: string;
}

interface EditorPanelProps {
  state: ThemeState;
  selectedElement: SelectedElementData | null;
  sections: { path: string; type: string; label: string }[];
  childrenOfSection: { path: string; type: string; label: string; text: string }[];
  onChange: (updates: Partial<ThemeState>) => void;
  onSelectElementByPath: (path: string) => void;
  onSaveElement: (path: string, updates: { text?: string; href?: string; src?: string; alt?: string }) => void;
  onRewriteTag: (path: string, newTag: string) => void;
  onChangeButtonRole: (path: string, role: "primary" | "soft" | "light") => void;
  onChangeCardRole: (path: string, role: "generic" | "icon" | "person") => void;
  onDuplicateElement: (path: string) => void;
  onDeleteElement: (path: string) => void;
  onSelectSection: (path: string) => void;
  activeSectionPath: string | null;
  onSaveSectionStyles: (path: string, bg: string, bgImg: string) => void;
  onBackToSections: () => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  state,
  selectedElement,
  sections,
  childrenOfSection,
  onChange,
  onSelectElementByPath,
  onSaveElement,
  onRewriteTag,
  onChangeButtonRole,
  onChangeCardRole,
  onDuplicateElement,
  onDeleteElement,
  onSelectSection,
  activeSectionPath,
  onSaveSectionStyles,
  onBackToSections,
}) => {
  const [subView, setSubView] = useState<"sections" | "section-detail" | "header" | "footer" | "element">("sections");
  const [localTab, setLocalTab] = useState<string>("style");
  
  // Element edit fields state
  const [editText, setEditText] = useState("");
  const [editHref, setEditHref] = useState("");
  const [editSrc, setEditSrc] = useState("");
  const [editAlt, setEditAlt] = useState("");
  const [editTag, setEditTag] = useState("h1");
  const [editButtonRole, setEditButtonRole] = useState<"primary" | "soft" | "light">("primary");
  const [editCardRole, setEditCardRole] = useState<"generic" | "icon" | "person">("generic");

  // Section style fields state
  const [sectionBg, setSectionBg] = useState("");
  const [sectionBgImg, setSectionBgImg] = useState("");

  // Sync state with selected element
  useEffect(() => {
    if (selectedElement) {
      if (selectedElement.type === "header") {
        setSubView("header");
      } else if (selectedElement.type === "footer") {
        setSubView("footer");
      } else {
        setSubView("element");
      }
      setEditText(selectedElement.text);
      setEditHref(selectedElement.href);
      setEditSrc(selectedElement.src);
      setEditAlt(selectedElement.alt);
      
      // Extract tag name from path or tagName
      const tag = selectedElement.tagName || selectedElement.path.split(">").pop()?.split(":")[0] || "div";
      setEditTag(tag.toLowerCase());

      // Guess current button role from classes
      if (selectedElement.type === "button") {
        // Since we modify iframe classes, let's keep track of current role selection
        setEditButtonRole("primary"); // Default
      }
    } else if (activeSectionPath) {
      setSubView("section-detail");
    } else {
      setSubView("sections");
    }
  }, [selectedElement, activeSectionPath]);

  const handleSaveElement = () => {
    if (!selectedElement) return;
    onSaveElement(selectedElement.path, {
      text: editText,
      href: editHref,
      src: editSrc,
      alt: editAlt,
    });
  };

  const handleRewriteTag = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTag = e.target.value;
    setEditTag(newTag);
    if (selectedElement) {
      onRewriteTag(selectedElement.path, newTag);
    }
  };

  const handleButtonRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const role = e.target.value as "primary" | "soft" | "light";
    setEditButtonRole(role);
    if (selectedElement) {
      onChangeButtonRole(selectedElement.path, role);
    }
  };

  const handleCardRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const role = e.target.value as "generic" | "icon" | "person";
    setEditCardRole(role);
    if (selectedElement) {
      onChangeCardRole(selectedElement.path, role);
    }
  };

  const handleSaveSection = () => {
    if (activeSectionPath) {
      onSaveSectionStyles(activeSectionPath, sectionBg, sectionBgImg);
    }
  };

  const openHeaderEditor = () => {
    setSubView("header");
    setLocalTab("style");
  };

  const openFooterEditor = () => {
    setSubView("footer");
    setLocalTab("style");
  };

  // 1. SECTIONS LIST OUTLET
  if (subView === "sections") {
    return (
      <div className="sidebar-view">
        <div className="panel">
          <div className="section-title">
            <div className="title-icon">
              <LayoutTemplate size={18} />
            </div>
            <h3>Page Sections</h3>
          </div>

          {sections.length > 0 ? (
            sections.map((section, idx) => (
              <button
                key={idx}
                className="editor-card"
                onClick={() => {
                  if (section.type === "header") openHeaderEditor();
                  else if (section.type === "footer") openFooterEditor();
                  else onSelectSection(section.path);
                }}
              >
                <strong>{section.label}</strong>
                <span>
                  {section.type === "header"
                    ? "Header Layout & Navigation styles"
                    : section.type === "footer"
                    ? "Footer Layout, columns & bottom credits"
                    : "Section background styles & elements"}
                </span>
              </button>
            ))
          ) : (
            <div className="edit-box">
              <p>No editable sections found. Import a page or add HTML elements to get started.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. SECTION DETAIL OUTLET
  if (subView === "section-detail" && activeSectionPath) {
    return (
      <div className="sidebar-view">
        <div className="panel">
          <div className="section-title">
            <div className="title-icon">
              <PanelTop size={18} />
            </div>
            <h3>Section Editor</h3>
          </div>

          <div className="edit-box">
            <h4>Section Styles</h4>
            <p>Customize the presentation attributes of the containing section block.</p>
            
            <div className="field">
              <label>Background Color</label>
              <input
                type="text"
                placeholder="#ffffff or transparent"
                value={sectionBg}
                onChange={(e) => setSectionBg(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Background Image URL</label>
              <input
                type="text"
                placeholder="https://images.unsplash.com/..."
                value={sectionBgImg}
                onChange={(e) => setSectionBgImg(e.target.value)}
              />
            </div>

            <div className="action-grid">
              <button className="small-btn primary" onClick={handleSaveSection}>
                Save
              </button>
              <button className="small-btn" onClick={onBackToSections}>
                <ChevronLeft size={12} style={{ marginRight: "4px" }} /> Sections
              </button>
            </div>
          </div>

          <div className="edit-box">
            <h4>Section Elements</h4>
            <p>Click any child element below or click it directly inside the preview frame to modify properties.</p>
            {childrenOfSection.length > 0 ? (
              childrenOfSection.map((child, idx) => (
                <button
                  key={idx}
                  className="editor-card"
                  onClick={() => onSelectElementByPath(child.path)}
                >
                  <strong>{child.label}</strong>
                  <span>{child.text || child.type}</span>
                </button>
              ))
            ) : (
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                No editable title, button, image, or description tags found in this section.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. HEADER EDITOR OUTLET
  if (subView === "header") {
    return (
      <div className="sidebar-view">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '24px' }}>
          <div className="editor-local-tabs four-tabs" style={{ flex: 1, marginBottom: 0 }}>
            {["style", "layout", "effect", "mobile"].map((tab) => (
              <button
                key={tab}
                className={`local-tab ${localTab === tab ? "active" : ""}`}
                onClick={() => setLocalTab(tab)}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
          <button 
            className="local-tab" 
            style={{ width: 'auto', padding: '0 14px', height: '100%' }} 
            title="Reset Header to Defaults"
            onClick={() => onChange({
              headerStyle: "full",
              headerLook: "shadow",
              headerGlass: false,
              headerBorder: false,
              headerBorderSize: "small",
              headerBorderColor: "accent",
              headerLayout: "logo-left",
              headerEffect: "static",
              mobileMenuPosition: "right",
              mobileDrawerMode: "reveal",
              mobileHamburgerShape: "circle",
              mobileDrawerButtonsFullWidth: false
            })}
          >
            <RotateCcw size={14} />
          </button>
        </div>

        <div className="panel">
          <div className="section-title">
            <div className="title-icon">
              <PanelTop size={18} />
            </div>
            <h3>Header customizer</h3>
          </div>

          {localTab === "style" && (
            <>
            <div className="edit-box">
              <h4>Header Base Style</h4>
              <p>Choose the placement and outer layout parameters of the header block.</p>
              <div className="choice-grid">
                {[
                  { key: "full", name: "Full Header", desc: "Attached edge-to-edge header" },
                  { key: "transparent", name: "Transparent", desc: "Blends seamlessly into the page background" },
                  { key: "floating", name: "Floating", desc: "Raised header with custom padding edges" },
                  { key: "detached", name: "Detached", desc: "Boxed and centered to align with page grid" },
                ].map((item) => (
                  <div
                    key={item.key}
                    className={`visual-card ${state.headerStyle === item.key ? "active" : ""}`}
                    onClick={() => onChange({ headerStyle: item.key })}
                    style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.desc}</span>
                    </div>
                    {(item.key === 'full' || item.key === 'transparent') && state.headerStyle === item.key && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          onChange({ headerContentBoxed: !state.headerContentBoxed });
                        }}
                        style={{ padding: '4px', pointerEvents: 'auto' }}
                      >
                        <button 
                          className={`tiny-switch ${state.headerContentBoxed ? 'on' : 'off'}`}
                          style={{ flexShrink: 0, margin: 0 }}
                          title={state.headerContentBoxed ? "Currently Boxed: Click to make full width" : "Currently Full Width: Click to box content"}
                        >
                          <div className="tiny-knob"></div>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="edit-box" style={{ marginTop: '24px' }}>
              <h4>Header Look & Aesthetics</h4>
              <p>Configure the physical visual appearance of the header.</p>
              
              <div className="field-group" style={{ marginBottom: '24px' }}>
                <div className="choice-grid">
                  {[
                    { key: "flat", name: "Flat", desc: "Clean and flush without shadows" },
                    { key: "glass", name: "Glassmorphism", desc: "Frosted glass effect with background blur" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      className={`visual-card ${state.headerLook === item.key ? "active" : ""}`}
                      onClick={() => onChange({ headerLook: item.key as any })}
                    >
                      <strong>{item.name}</strong>
                      <span>{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', marginBottom: '24px' }}>
                <div className="field-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', paddingBottom: '12px' }}>Border</label>
                  <button 
                    className={`tiny-switch ${state.headerBorder ? 'on' : 'off'}`}
                    onClick={() => onChange({ headerBorder: !state.headerBorder })}
                    style={{ flexShrink: 0 }}
                  >
                    <div className="tiny-knob"></div>
                  </button>
                </div>

                {state.headerBorder && (
                  <>
                    <div className="field-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, paddingBottom: '17px' }}>
                        <span>Border Size</span>
                        <span style={{ color: 'var(--text-muted)' }}>{state.headerBorderSize || '1'}</span>
                      </label>
                      <input 
                        type="range" 
                        min="1" 
                        max="7" 
                        step="1"
                        value={state.headerBorderSize === 'small' ? '1' : state.headerBorderSize === 'medium' ? '3' : state.headerBorderSize === 'large' ? '7' : (state.headerBorderSize || '1')}
                        onChange={(e) => onChange({ headerBorderSize: e.target.value })}
                        style={{ width: '100%', accentColor: 'var(--primary)', margin: 0, display: 'block' }}
                      />
                    </div>

                    <div className="field-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', paddingBottom: '12px' }}>Themed</label>
                      <button 
                        className={`tiny-switch ${state.headerBorderColor === 'accent' ? 'on' : 'off'}`}
                        onClick={() => onChange({ headerBorderColor: state.headerBorderColor === 'accent' ? 'white' : 'accent' })}
                        style={{ flexShrink: 0 }}
                      >
                        <div className="tiny-knob"></div>
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div className="field-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', paddingBottom: '12px' }}>Shadow</label>
                  <button 
                    className={`tiny-switch ${state.headerShadow ? 'on' : 'off'}`}
                    onClick={() => onChange({ headerShadow: !state.headerShadow })}
                    style={{ flexShrink: 0 }}
                  >
                    <div className="tiny-knob"></div>
                  </button>
                </div>
                {state.headerShadow && (
                  <>
                    <div className="field-group" style={{ flexGrow: 1, marginBottom: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '12px', fontWeight: 600 }}>
                        <span>Intensity</span>
                        <span style={{ color: 'var(--muted)' }}>{state.headerShadowIntensity === 'light' ? '1' : state.headerShadowIntensity === 'medium' ? '2' : state.headerShadowIntensity === 'heavy' ? '3' : '2'}</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="3" 
                        step="1"
                        value={state.headerShadowIntensity === 'light' ? '1' : state.headerShadowIntensity === 'medium' ? '2' : state.headerShadowIntensity === 'heavy' ? '3' : '2'}
                        onChange={(e) => {
                          const val = e.target.value;
                          onChange({ headerShadowIntensity: val === '1' ? 'light' : val === '2' ? 'medium' : 'heavy' });
                        }}
                        style={{ width: '100%', accentColor: 'var(--primary)', margin: 0, display: 'block' }}
                      />
                    </div>

                    <div className="field-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', paddingBottom: '12px' }}>Themed</label>
                      <button 
                        className={`tiny-switch ${state.headerShadowThemed ? 'on' : 'off'}`}
                        onClick={() => onChange({ headerShadowThemed: !state.headerShadowThemed })}
                        style={{ flexShrink: 0 }}
                      >
                        <div className="tiny-knob"></div>
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '24px' }}>
                <div className="field-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', paddingBottom: '12px' }}>Solid Themed Background</label>
                  <button 
                    className={`tiny-switch ${state.headerSolidThemed ? 'on' : 'off'}`}
                    onClick={() => onChange({ headerSolidThemed: !state.headerSolidThemed })}
                    style={{ flexShrink: 0 }}
                  >
                    <div className="tiny-knob"></div>
                  </button>
                </div>
              </div>
            </div>
            </>
          )}

          {localTab === "layout" && (
            <div className="edit-box">
              <h4>Menu Alignment</h4>
              <p>Reposition logo alignment and inline navigation menus.</p>
              <div className="choice-grid">
                {[
                  { key: "logo-left", name: "Logo Left", desc: "Logo left, menu right" },
                  { key: "logo-right", name: "Logo Right", desc: "Menu left, logo right" },
                  { key: "stacked", name: "Logo Above", desc: "Logo above menu" },
                  { key: "menu-top", name: "Menu Above", desc: "Menu above logo" },
                ].map((item) => (
                  <button
                    key={item.key}
                    className={`visual-card ${state.headerLayout === item.key ? "active" : ""}`}
                    onClick={() => onChange({ headerLayout: item.key })}
                  >
                    <strong>{item.name}</strong>
                    <span>{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {localTab === "effect" && (
            <div className="edit-box">
              <h4>Scroll Effects</h4>
              <p>Set position behaviors when users scroll through content pages.</p>
              <div className="choice-grid">
                {[
                  { key: "static", name: "Static", desc: "Header scrolls normally with the page" },
                  { key: "sticky", name: "Sticky", desc: "Header remains pinned to top" },
                  { key: "reveal", name: "Reveal On Scroll Up", desc: "Hides on downscroll, slides back on upscroll" },
                  { key: "hide", name: "Auto Hide", desc: "Slides away after scrolling down" },
                  { key: "floating-sticky", name: "Floating Sticky", desc: "Floating header style pins to top" },
                ].map((item) => (
                  <button
                    key={item.key}
                    className={`visual-card ${state.headerEffect === item.key ? "active" : ""}`}
                    onClick={() => onChange({ headerEffect: item.key })}
                  >
                    <strong>{item.name}</strong>
                    <span>{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {localTab === "mobile" && (
            <div>
              <div className="edit-box">
                <h4>Mobile Toggle Side</h4>
                <div className="choice-grid">
                  {[
                    { key: "right", name: "Right Hamburger", desc: "Menu icon on right side" },
                    { key: "left", name: "Left Hamburger", desc: "Menu icon on left side" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      className={`visual-card ${state.mobileMenuPosition === item.key ? "active" : ""}`}
                      onClick={() => onChange({ mobileMenuPosition: item.key })}
                    >
                      <strong>{item.name}</strong>
                      <span>{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="edit-box">
                <h4>Shape</h4>
                <div className="choice-grid">
                  {[
                    { key: "plain", name: "Plain Icon", desc: "Hamburger icon without surrounding frame" },
                    { key: "circle", name: "Circle", desc: "Hamburger inside a circular container" },
                    { key: "square", name: "Square", desc: "Hamburger inside a square container" },
                    { key: "rounded", name: "Rounded", desc: "Hamburger inside a rounded container" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      className={`visual-card ${state.mobileHamburgerShape === item.key ? "active" : ""}`}
                      onClick={() => onChange({ mobileHamburgerShape: item.key })}
                    >
                      <strong>{item.name}</strong>
                      <span>{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="edit-box">
                <h4>Drawer Transition Behavior</h4>
                <div className="choice-grid">
                  {[
                    { key: "overlay", name: "Overlay", desc: "Mobile drawer sits on top of page content" },
                    { key: "push", name: "Push", desc: "Drawer pushes page content sideways" },
                    { key: "reveal", name: "Reveal", desc: "Page slides away to reveal the drawer underneath" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      className={`visual-card ${state.mobileDrawerMode === item.key ? "active" : ""}`}
                      onClick={() => onChange({ mobileDrawerMode: item.key })}
                    >
                      <strong>{item.name}</strong>
                      <span>{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="edit-box" style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div>
                    <h4 style={{ margin: 0 }}>Full Width Actions</h4>
                    <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginTop: '2px' }}>Make drawer buttons span full width</span>
                  </div>
                  <button 
                    className={`tiny-switch ${state.mobileDrawerButtonsFullWidth ? 'on' : 'off'}`}
                    onClick={() => onChange({ mobileDrawerButtonsFullWidth: !state.mobileDrawerButtonsFullWidth })}
                    style={{ flexShrink: 0, cursor: 'pointer' }}
                  >
                    <div className="tiny-knob"></div>
                  </button>
                </div>
              </div>
            </div>
          )}

          <button className="small-btn" style={{ width: "100%", marginTop: "10px" }} onClick={onBackToSections}>
            Back to Sections
          </button>
        </div>
      </div>
    );
  }

  // 4. FOOTER EDITOR OUTLET
  if (subView === "footer") {
    return (
      <div className="sidebar-view">
        <div className="editor-local-tabs">
          {["style", "widgets", "bottom"].map((tab) => (
            <button
              key={tab}
              className={`local-tab ${localTab === tab ? "active" : ""}`}
              onClick={() => setLocalTab(tab)}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="panel">
          <div className="section-title">
            <div className="title-icon">
              <PanelBottom size={18} />
            </div>
            <h3>Footer customizer</h3>
          </div>

          {localTab === "style" && (
            <div className="edit-box">
              <h4>Footer Presentation</h4>
              <div className="choice-grid">
                {[
                  { key: "classic", name: "Classic Footer", desc: "Standard full dark-background footer" },
                  { key: "minimal", name: "Minimal Footer", desc: "Clean layout without large widget sections" },
                  { key: "floating", name: "Floating Footer", desc: "Detached and padded styled container" },
                  { key: "boxed", name: "Boxed Footer", desc: "Contained footer block matching content width" },
                  { key: "compact", name: "Compact Footer", desc: "Small single row line bar" },
                ].map((item) => (
                  <button
                    key={item.key}
                    className={`visual-card ${state.footerStyle === item.key ? "active" : ""}`}
                    onClick={() => onChange({ footerStyle: item.key, footerManual: true })}
                  >
                    <strong>{item.name}</strong>
                    <span>{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {localTab === "widgets" && (
            <div>
              <div className="edit-box">
                <div className="mini-toggle-row">
                  <div>
                    <strong>Show Widget Columns</strong>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Toggle footer top link lists.</span>
                  </div>
                  <button
                    className={`tiny-switch ${state.footerWidgets === "show" ? "on" : ""}`}
                    onClick={() => onChange({ footerWidgets: state.footerWidgets === "show" ? "hidden" : "show" })}
                  >
                    <span className="tiny-knob" />
                  </button>
                </div>
              </div>

              <div className="edit-box">
                <h4>Widget Column Spacings</h4>
                <div className="choice-grid">
                  {[
                    { key: "equal", name: "Equal Columns", desc: "Four equal width widget columns" },
                    { key: "feature", name: "Featured Column", desc: "Larger left column with church profile description" },
                    { key: "compact", name: "Compact Four", desc: "Tighter spacing grids" },
                    { key: "stacked", name: "Stacked Layout", desc: "Columns collapsed and centered vertically" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      className={`visual-card ${state.footerWidgetLayout === item.key ? "active" : ""}`}
                      onClick={() => onChange({ footerWidgetLayout: item.key })}
                    >
                      <strong>{item.name}</strong>
                      <span>{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {localTab === "bottom" && (
            <div className="edit-box">
              <h4>Legal Info & Bottom Credits</h4>
              
              <div className="field">
                <label>Copyright Text</label>
                <input
                  type="text"
                  value={state.copyrightText}
                  onChange={(e) => onChange({ copyrightText: e.target.value })}
                />
              </div>

              <div className="field">
                <label>Privacy Policy Label</label>
                <input
                  type="text"
                  value={state.privacyLabel}
                  onChange={(e) => onChange({ privacyLabel: e.target.value })}
                />
              </div>

              <div className="field">
                <label>Privacy Link Destination</label>
                <input
                  type="text"
                  value={state.privacyHref}
                  onChange={(e) => onChange({ privacyHref: e.target.value })}
                />
              </div>

              <div className="field">
                <label>Terms of Use Label</label>
                <input
                  type="text"
                  value={state.termsLabel}
                  onChange={(e) => onChange({ termsLabel: e.target.value })}
                />
              </div>

              <div className="field">
                <label>Terms Link Destination</label>
                <input
                  type="text"
                  value={state.termsHref}
                  onChange={(e) => onChange({ termsHref: e.target.value })}
                />
              </div>

              <div className="action-grid" style={{ marginTop: "12px" }}>
                <button
                  className={`small-btn ${state.footerLegal === "show" ? "" : "danger"}`}
                  onClick={() => onChange({ footerLegal: state.footerLegal === "show" ? "hidden" : "show" })}
                >
                  {state.footerLegal === "show" ? "Hide Legal Links" : "Show Legal Links"}
                </button>
                <button
                  className="small-btn"
                  onClick={() => onChange({ footerBottom: state.footerBottom === "split" ? "center" : "split" })}
                >
                  Toggle Center/Split
                </button>
              </div>
            </div>
          )}

          <button className="small-btn" style={{ width: "100%", marginTop: "10px" }} onClick={onBackToSections}>
            Back to Sections
          </button>
        </div>
      </div>
    );
  }

  // 5. INDIVIDUAL ELEMENT EDITOR OUTLET
  if (subView === "element" && selectedElement) {
    return (
      <div className="sidebar-view">
        <div className="panel">
          <div className="section-title">
            <div className="title-icon">
              <Edit3 size={18} />
            </div>
            <h3>Edit Element</h3>
          </div>

          <div className="edit-box">
            <p style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic", wordBreak: "break-all" }}>
              Target: {selectedElement.label} ({selectedElement.path})
            </p>

            {/* Smart Tag Role Switchers */}
            {selectedElement.type === "title" && (
              <div className="field">
                <label>Heading Level (Tag Role)</label>
                <select value={editTag} onChange={handleRewriteTag}>
                  <option value="h1">H1 - Hero Title</option>
                  <option value="h2">H2 - Section Heading</option>
                  <option value="h3">H3 - Subtitle / Card Heading</option>
                  <option value="h4">H4 - Small Label</option>
                  <option value="h5">H5 - Fine Text</option>
                </select>
              </div>
            )}

            {selectedElement.type === "button" && (
              <div className="field">
                <label>Button Theme Role</label>
                <select value={editButtonRole} onChange={handleButtonRoleChange}>
                  <option value="primary">Primary Accent Fill</option>
                  <option value="soft">Soft Tint Transparent</option>
                  <option value="light">Outline / Borders Solid</option>
                </select>
              </div>
            )}

            {selectedElement.type === "card" && (
              <div className="field">
                <label>Card Type Layout</label>
                <select value={editCardRole} onChange={handleCardRoleChange}>
                  <option value="generic">Standard Info Card</option>
                  <option value="icon">Featured Icon Box</option>
                  <option value="person">Pastoral Profile Card</option>
                </select>
              </div>
            )}

            {/* Common Inputs */}
            {["title", "description", "button"].includes(selectedElement.type) && (
              <div className="field">
                <label>Text Content</label>
                {selectedElement.type === "description" ? (
                  <textarea value={editText} onChange={(e) => setEditText(e.target.value)} />
                ) : (
                  <input type="text" value={editText} onChange={(e) => setEditText(e.target.value)} />
                )}
              </div>
            )}

            {["button", "card"].includes(selectedElement.type) && (
              <div className="field">
                <label>Hyperlink Target (href)</label>
                <input type="text" value={editHref} onChange={(e) => setEditHref(e.target.value)} />
              </div>
            )}

            {selectedElement.type === "image" && (
              <div>
                <div className="field">
                  <label>Image Source URL (src)</label>
                  <input type="text" value={editSrc} onChange={(e) => setEditSrc(e.target.value)} />
                </div>
                <div className="field">
                  <label>Accessibility Alt Description</label>
                  <input type="text" value={editAlt} onChange={(e) => setEditAlt(e.target.value)} />
                </div>
              </div>
            )}

            <div className="action-grid" style={{ marginBottom: "10px" }}>
              <button className="small-btn primary" onClick={handleSaveElement}>
                Save Changes
              </button>
              <button className="small-btn" onClick={onBackToSections}>
                Cancel
              </button>
            </div>

            <div className="action-grid">
              <button
                className="small-btn"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                onClick={() => onDuplicateElement(selectedElement.path)}
              >
                <Copy size={13} /> Duplicate
              </button>
              <button
                className="small-btn danger"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                onClick={() => onDeleteElement(selectedElement.path)}
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
