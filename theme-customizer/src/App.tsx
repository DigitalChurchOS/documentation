import { useState, useEffect, useMemo } from "react";
import { Preview } from "./components/Preview";
import { SettingsPanel } from "./components/SettingsPanel";
import { CustomizerPanel } from "./components/CustomizerPanel";
import { EditorPanel } from "./components/EditorPanel";
import type { ThemeState } from "./utils/domParser";
import {
  parseHtml,
  serializeHtml,
  injectThemeTokens,
  applyThemeStructure,
  cssPath,
  changeElementTag,
  changeButtonRole,
  changeCardRole,
  optimizeStylesIntoTokens,
  cleanPageForExport,
} from "./utils/domParser";
import {
  Monitor,
  Laptop,
  Tablet,
  Smartphone,
  Maximize2,
  Minimize2,
  X,
  MousePointerClick,
  Navigation,
  Download,
  Settings,
  ChevronDown,
} from "lucide-react";

const defaultPageTemplate = `<!DOCTYPE html>
<html>
<head>
<title>GraceHouse Church</title>
<style>
html{width:100%;max-width:100%;overflow-x:hidden;scrollbar-gutter:stable}
*{box-sizing:border-box}
body{margin:0;width:100%;max-width:100%;overflow-x:hidden;background:var(--site-bg);color:var(--site-text);font-family:var(--font-body);transition:transform var(--duration) var(--ease)}
img,video,canvas,svg{max-width:100%;height:auto}
header{width:100%;max-width:100%;min-width:0;height:74px;display:flex;align-items:center;justify-content:space-between;padding:0 clamp(24px,4vw,34px);background:var(--site-surface);border-bottom:1px solid var(--site-border)}
.logo{font-weight:900;min-width:0}
nav{display:flex;gap:20px;color:var(--site-muted);font-size:14px;min-width:0;flex-wrap:wrap}
nav a{color:var(--site-muted);text-decoration:none;white-space:nowrap}
section{width:100%;max-width:100%;padding:var(--section) clamp(28px,5vw,var(--padding))}
.hero{background:linear-gradient(135deg,var(--site-soft),var(--site-bg));min-height:520px}
.badge{display:inline-block;background:var(--primary-soft);color:var(--primary);padding:8px 14px;border-radius:999px;font-weight:800;margin-bottom:18px}
h1{font-family:var(--font-title);font-size:clamp(42px,7vw,var(--title-size));line-height:1;letter-spacing:var(--title-spacing,-.06em);max-width:760px;margin:0 0 18px;overflow-wrap:anywhere;text-wrap:balance}
p{font-size:clamp(17px,2.4vw,var(--subtitle-size));color:var(--site-muted);line-height:1.45;max-width:670px;overflow-wrap:anywhere}
button,.btn{display:inline-block;background:var(--primary);color:#fff;border:0;border-radius:var(--radius);padding:13px 20px;font-weight:500!important;transition:all var(--duration) var(--ease);text-decoration:none}
.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--gap);padding:clamp(28px,5vw,var(--padding));background:var(--site-bg);max-width:100%}
.card{display:block;min-width:0;background:var(--site-surface);border:1px solid var(--site-border);border-radius:var(--radius);padding:24px;box-shadow:var(--shadow-soft);text-decoration:none;color:var(--site-text)}
.card p{font-size:var(--body-size)}
footer{width:100%;max-width:100%;padding:42px;background:var(--site-soft);color:var(--site-muted);overflow:hidden}
.footer-widgets{display:grid;grid-template-columns:1.45fr 1fr 1fr 1fr;gap:24px;margin-bottom:28px}
.footer-widget{min-width:0}
.footer-widget h4{color:var(--site-text);margin-bottom:10px}
.footer-widget p{font-size:14px}
.footer-widget a{display:block;color:var(--site-muted);text-decoration:none;margin:8px 0;font-size:14px}
.footer-bottom{display:flex;align-items:center;justify-content:space-between;gap:18px;border-top:1px solid var(--site-border);padding-top:18px}
.footer-bottom p{font-size:14px;margin:0}
.footer-legal{display:flex;gap:16px;flex-wrap:wrap}
.footer-legal a{color:var(--site-muted);text-decoration:none;font-size:14px}
.ec-mobile-menu-toggle{display:none}
.ec-mobile-drawer,.ec-mobile-overlay{display:none}
@media(max-width:900px){
  .grid{grid-template-columns:1fr}
  h1{font-size:clamp(38px,8vw,62px)}
}
</style>
</head>
<body>
<header data-editor-type="header" data-editor-label="Header">
  <div class="logo" data-editor-type="title">GraceHouse</div>
  <nav>
    <a href="#home" data-editor-type="button">Home</a>
    <a href="#about" data-editor-type="button">About</a>
    <a href="#events" data-editor-type="button">Events</a>
  </nav>
</header>

<section id="home" class="hero" data-editor-type="section" data-editor-label="Hero Section">
  <span class="badge" data-editor-type="badge">Welcome Home</span>
  <h1 data-editor-type="title">A church website shaped by one simple Theme DNA.</h1>
  <p data-editor-type="description">This page uses Ecclesia tokens and can be edited intelligently.</p>
  <a class="btn" href="#about" data-editor-type="button">Visit Us</a>
</section>

<section id="about" class="grid" data-editor-type="section" data-editor-label="Cards Section">
  <a href="#one" class="card" data-editor-type="card">
    <h3 data-editor-type="title">One Visual DNA</h3>
    <p data-editor-type="description">Every page follows the same design system.</p>
  </a>
  <a href="#preview" class="card" data-editor-type="card">
    <h3 data-editor-type="title">Live Preview</h3>
    <p data-editor-type="description">Preview across devices.</p>
  </a>
  <a href="#publish" class="card" data-editor-type="card">
    <h3 data-editor-type="title">Simple Publishing</h3>
    <p data-editor-type="description">Simple and powerful.</p>
  </a>
</section>

<footer data-editor-type="footer" data-editor-label="Footer">
  <div class="footer-widgets">
    <div class="footer-widget" data-editor-type="card" data-editor-label="Footer Brand">
      <h4 data-editor-type="title">GraceHouse</h4>
      <p data-editor-type="description">A welcoming church community shaped by faith, love, and purpose.</p>
    </div>
    <div class="footer-widget" data-editor-type="card" data-editor-label="Footer Menu">
      <h4 data-editor-type="title">Explore</h4>
      <a href="#home" data-editor-type="button">Home</a>
      <a href="#about" data-editor-type="button">About</a>
      <a href="#events" data-editor-type="button">Events</a>
    </div>
    <div class="footer-widget" data-editor-type="card" data-editor-label="Footer Ministries">
      <h4 data-editor-type="title">Ministries</h4>
      <a href="#kids" data-editor-type="button">Kids</a>
      <a href="#youth" data-editor-type="button">Youth</a>
      <a href="#care" data-editor-type="button">Care</a>
    </div>
    <div class="footer-widget" data-editor-type="card" data-editor-label="Footer Contact">
      <h4 data-editor-type="title">Visit</h4>
      <p data-editor-type="description">Join us this Sunday and experience a warm church family.</p>
    </div>
  </div>

  <div class="footer-bottom">
    <p class="footer-copy" data-editor-type="description">© GraceHouse Church. All rights reserved.</p>
    <div class="footer-legal">
      <a class="privacy-link" href="#privacy" data-editor-type="button">Privacy Policy</a>
      <a class="terms-link" href="#terms" data-editor-type="button">Terms of Use</a>
    </div>
  </div>
</footer>
</body>
</html>`;

export function App() {
  // Customizer state
  const [themeState, setThemeState] = useState<ThemeState>(() => {
    const saved = localStorage.getItem("ec_autosave_theme");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      preset: "Horizon",
      personality: "Modern",
      typography: "Modern Sans",
      typeSize: "Balanced",
      family: "Ocean",
      style: "Rich",
      shape: "Soft",
      visual: "Elevated",
      density: "Comfortable",
      motion: "Gentle",
      atmosphere: "Light",
      previewMode: "light",
      headerStyle: "full",
      headerLayout: "logo-left",
      headerEffect: "static",
      mobileMenuPosition: "right",
      mobileDrawerMode: "overlay",
      mobileHamburgerShape: "circle",
      footerStyle: "classic",
      footerWidgets: "show",
      footerWidgetLayout: "feature",
      footerBottom: "split",
      footerLegal: "show",
      footerManual: false,
      copyrightText: "© GraceHouse Church. All rights reserved.",
      privacyLabel: "Privacy Policy",
      privacyHref: "#privacy",
      termsLabel: "Terms of Use",
      termsHref: "#terms",
    };
  });

  // UI state
  const [deviceSize, setDeviceSize] = useState<"desktop" | "laptop" | "tablet" | "mobile">("desktop");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editorMode, setEditorMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"settings" | "customizer" | "editor">("customizer");
  const [isPageMenuOpen, setIsPageMenuOpen] = useState(false);

  // HTML Page state
  const [rawHtml, setRawHtml] = useState<string>(() => {
    return localStorage.getItem("ec_autosave_html") || defaultPageTemplate;
  });
  const [importedFilename, setImportedFilename] = useState<string>(() => {
    return localStorage.getItem("ec_autosave_filename") || "default-theme-page.html";
  });
  
  // Element selection state
  const [selectedElement, setSelectedElement] = useState<{
    path: string;
    type: string;
    label: string;
    text: string;
    href: string;
    src: string;
    alt: string;
    tagName?: string;
  } | null>(null);

  const [activeSectionPath, setActiveSectionPath] = useState<string | null>(null);
  const [optimizationReport, setOptimizationReport] = useState<{ count: number; details: string[] } | null>(null);

  // Auto-save effects
  useEffect(() => {
    localStorage.setItem("ec_autosave_theme", JSON.stringify(themeState));
  }, [themeState]);

  useEffect(() => {
    localStorage.setItem("ec_autosave_html", rawHtml);
  }, [rawHtml]);

  useEffect(() => {
    localStorage.setItem("ec_autosave_filename", importedFilename);
  }, [importedFilename]);

  // Parse sections inside HTML
  const sections = useMemo(() => {
    const doc = parseHtml(rawHtml);
    const nodes = Array.from(doc.querySelectorAll("header, section, footer, main, [data-editor-type='header'], [data-editor-type='section'], [data-editor-type='footer']"));
    return nodes.map((node) => {
      const path = cssPath(node);
      const tag = node.tagName.toLowerCase();
      let label = (node as HTMLElement).dataset.editorLabel || "Section";
      if (tag === "header") label = "Header";
      if (tag === "footer") label = "Footer";

      return {
        path,
        type: tag === "header" ? "header" : tag === "footer" ? "footer" : "section",
        label,
      };
    });
  }, [rawHtml]);

  // Parse children of current active section
  const childrenOfSection = useMemo(() => {
    if (!activeSectionPath) return [];
    const doc = parseHtml(rawHtml);
    const parent = doc.querySelector(activeSectionPath);
    if (!parent) return [];

    const nodes = Array.from(parent.querySelectorAll("[data-editor-type], h1, h2, h3, h4, p, button, a, img, .card, .feature-card, .person-card"));
    return nodes
      .filter((n) => n !== parent)
      .map((node) => {
        const path = cssPath(node);
        const tag = node.tagName.toLowerCase();
        let type = "element";
        if ((node as HTMLElement).dataset.editorType) type = (node as HTMLElement).dataset.editorType!;
        else if (["h1", "h2", "h3", "h4"].includes(tag)) type = "title";
        else if (tag === "p") type = "description";
        else if (["a", "button"].includes(tag)) type = "button";
        else if (tag === "img") type = "image";
        else if (node.classList.contains("card") || node.classList.contains("feature-card") || node.classList.contains("person-card")) type = "card";

        return {
          path,
          type,
          label: (node as HTMLElement).dataset.editorLabel || type.toUpperCase(),
          text: (node as HTMLElement).innerText || (node as HTMLImageElement).alt || type,
        };
      });
  }, [rawHtml, activeSectionPath]);

  // Compute live HTML to render in iframe (applies theme styling dynamically)
  const renderedHtml = useMemo(() => {
    const doc = parseHtml(rawHtml);
    injectThemeTokens(doc, themeState);
    applyThemeStructure(doc, themeState);
    return serializeHtml(doc);
  }, [rawHtml, themeState]);

  const fetchPage = async (filename: string) => {
    try {
      // Strip any leading slashes or full paths to keep relative resolving clean
      const baseName = filename.split("/").pop() || "index.html";
      const timestamp = new Date().getTime();
      const response = await fetch(`/themes/ecclesia/${baseName}?t=${timestamp}`);
      if (response.ok) {
        const text = await response.text();
        setRawHtml(text);
        setImportedFilename(baseName);
        setSelectedElement(null);
        setActiveSectionPath(null);
        setOptimizationReport(null);
      }
    } catch (err) {
      console.warn("Fetch error, keeping current template", err);
    }
  };

  // Load default index.html on mount
  useEffect(() => {
    fetchPage("index.html");
  }, []);

  // Sync scroll lock on escape key and listen for frame navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFullscreen(false);
      }
    };
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "ec-navigate") {
        fetchPage(event.data.href);
      }
    };
    window.addEventListener("keydown", handleKey);
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const handleImport = (content: string, filename: string) => {
    setRawHtml(content);
    setImportedFilename(filename);
    setSelectedElement(null);
    setActiveSectionPath(null);
    setOptimizationReport(null);
  };

  const handleSaveElementProperties = (
    path: string,
    updates: { text?: string; href?: string; src?: string; alt?: string }
  ) => {
    const doc = parseHtml(rawHtml);
    const el = doc.querySelector(path);
    if (el) {
      if (updates.text !== undefined) (el as HTMLElement).innerText = updates.text;
      if (updates.href !== undefined) el.setAttribute("href", updates.href);
      if (updates.src !== undefined) el.setAttribute("src", updates.src);
      if (updates.alt !== undefined) el.setAttribute("alt", updates.alt);
      setRawHtml(serializeHtml(doc));
      
      // Update local selection state
      if (selectedElement && selectedElement.path === path) {
        setSelectedElement({
          ...selectedElement,
          text: updates.text !== undefined ? updates.text : selectedElement.text,
          href: updates.href !== undefined ? updates.href : selectedElement.href,
          src: updates.src !== undefined ? updates.src : selectedElement.src,
          alt: updates.alt !== undefined ? updates.alt : selectedElement.alt,
        });
      }
    }
  };

  const handleRewriteTag = (path: string, newTag: string) => {
    const doc = parseHtml(rawHtml);
    const newPath = changeElementTag(doc, path, newTag);
    setRawHtml(serializeHtml(doc));
    
    // Update local selection path to match new node type
    if (selectedElement && selectedElement.path === path) {
      setSelectedElement({
        ...selectedElement,
        path: newPath,
        tagName: newTag.toUpperCase(),
      });
    }
  };

  const handleChangeButtonRole = (path: string, role: "primary" | "soft" | "light") => {
    const doc = parseHtml(rawHtml);
    changeButtonRole(doc, path, role);
    setRawHtml(serializeHtml(doc));
  };

  const handleChangeCardRole = (path: string, role: "generic" | "icon" | "person") => {
    const doc = parseHtml(rawHtml);
    changeCardRole(doc, path, role);
    setRawHtml(serializeHtml(doc));
  };

  const handleDuplicateElement = (path: string) => {
    const doc = parseHtml(rawHtml);
    const el = doc.querySelector(path);
    if (el) {
      const clone = el.cloneNode(true);
      el.after(clone);
      setRawHtml(serializeHtml(doc));
      setSelectedElement(null);
    }
  };

  const handleDeleteElement = (path: string) => {
    const doc = parseHtml(rawHtml);
    const el = doc.querySelector(path);
    if (el) {
      el.remove();
      setRawHtml(serializeHtml(doc));
      setSelectedElement(null);
    }
  };

  const handleSaveSectionStyles = (path: string, bg: string, bgImg: string) => {
    const doc = parseHtml(rawHtml);
    const el = doc.querySelector(path);
    if (el) {
      if (bg) (el as HTMLElement).style.background = bg;
      if (bgImg) (el as HTMLElement).style.backgroundImage = `url('${bgImg}')`;
      setRawHtml(serializeHtml(doc));
    }
  };

  const handleOptimizeTokens = () => {
    const doc = parseHtml(rawHtml);
    const report = optimizeStylesIntoTokens(doc);
    setRawHtml(serializeHtml(doc));
    setOptimizationReport(report);
  };

  const handleExport = () => {
    const doc = parseHtml(renderedHtml);
    const cleaned = cleanPageForExport(doc);

    const blob = new Blob([cleaned], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `optimized-${importedFilename}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`app ${isFullscreen ? "fullscreen" : ""}`} id="app">
      <header className="topbar">
        <div className="brand">
          <strong>Churched Theme Customizer</strong>
        </div>

        <div className="page-switcher">
          <label>Page</label>
          <div className="custom-dropdown" 
               tabIndex={0} 
               onBlur={(e) => {
                 if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                   setIsPageMenuOpen(false);
                 }
               }}
          >
            <div className="dropdown-selected" onClick={() => setIsPageMenuOpen(!isPageMenuOpen)}>
              <span className="dropdown-label">{
                [
                  { value: "index.html", label: "Home Page (index.html)" },
                  { value: "about.html", label: "About Page (about.html)" },
                  { value: "ministries.html", label: "Ministries Page (ministries.html)" },
                  { value: "sermons.html", label: "Sermons Archive (sermons.html)" },
                  { value: "media-single.html", label: "Single Sermon (media-single.html)" },
                  { value: "livestream-page.html", label: "Livestream Page (livestream-page.html)" },
                  { value: "events.html", label: "Events (events.html)" },
                  { value: "event-single.html", label: "Single Event (event-single.html)" },
                  { value: "blog-archive.html", label: "Blog Archive (blog-archive.html)" },
                  { value: "blog-single.html", label: "Single Blog Post (blog-single.html)" },
                  { value: "giving.html", label: "Giving Page (giving.html)" },
                  { value: "prayer.html", label: "Prayer & Testimony (prayer.html)" },
                  { value: "contact.html", label: "Contact Page (contact.html)" },
                  { value: "event-register.html", label: "Forms & Registration (event-register.html)" },
                  { value: "worship.html", label: "Style Guide (worship.html)" },
                  { value: "prayer-room.html", label: "System States (prayer-room.html)" }
                ].find(p => p.value === importedFilename)?.label || `${importedFilename} (Custom)`
              }</span>
              <ChevronDown size={14} className={`dropdown-icon ${isPageMenuOpen ? "open" : ""}`} />
            </div>
            {isPageMenuOpen && (
              <div className="dropdown-options">
                {[
                  { value: "index.html", label: "Home Page (index.html)" },
                  { value: "about.html", label: "About Page (about.html)" },
                  { value: "ministries.html", label: "Ministries Page (ministries.html)" },
                  { value: "sermons.html", label: "Sermons Archive (sermons.html)" },
                  { value: "media-single.html", label: "Single Sermon (media-single.html)" },
                  { value: "livestream-page.html", label: "Livestream Page (livestream-page.html)" },
                  { value: "events.html", label: "Events (events.html)" },
                  { value: "event-single.html", label: "Single Event (event-single.html)" },
                  { value: "blog-archive.html", label: "Blog Archive (blog-archive.html)" },
                  { value: "blog-single.html", label: "Single Blog Post (blog-single.html)" },
                  { value: "giving.html", label: "Giving Page (giving.html)" },
                  { value: "prayer.html", label: "Prayer & Testimony (prayer.html)" },
                  { value: "contact.html", label: "Contact Page (contact.html)" },
                  { value: "event-register.html", label: "Forms & Registration (event-register.html)" },
                  { value: "worship.html", label: "Style Guide (worship.html)" },
                  { value: "prayer-room.html", label: "System States (prayer-room.html)" }
                ].map((opt) => (
                  <div
                    key={opt.value}
                    className={`dropdown-item ${importedFilename === opt.value ? "active" : ""}`}
                    onClick={() => {
                      fetchPage(opt.value);
                      setIsPageMenuOpen(false);
                    }}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="top-actions">
          <button
            className={`editor-switch ${!editorMode ? "browse" : ""}`}
            onClick={() => setEditorMode(!editorMode)}
            title={editorMode ? "Switch to Browse Mode" : "Switch to Editor Mode"}
          >
            <span className="switch-knob">
              {editorMode ? <MousePointerClick /> : <Navigation />}
            </span>
          </button>

          <div className="screen-switcher">
            <button
              className={`screen-btn ${deviceSize === "desktop" ? "active" : ""}`}
              onClick={() => setDeviceSize("desktop")}
            >
              <Monitor />
              <span>Desktop</span>
            </button>
            <button
              className={`screen-btn ${deviceSize === "laptop" ? "active" : ""}`}
              onClick={() => setDeviceSize("laptop")}
            >
              <Laptop />
              <span>Laptop</span>
            </button>
            <button
              className={`screen-btn ${deviceSize === "tablet" ? "active" : ""}`}
              onClick={() => setDeviceSize("tablet")}
            >
              <Tablet />
              <span>Tablet</span>
            </button>
            <button
              className={`screen-btn ${deviceSize === "mobile" ? "active" : ""}`}
              onClick={() => setDeviceSize("mobile")}
            >
              <Smartphone />
              <span>Mobile</span>
            </button>
          </div>

          <button className="icon-btn" onClick={() => setIsFullscreen(!isFullscreen)}>
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button className="publish-btn" onClick={handleExport} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Download size={14} /> Publish
          </button>
        </div>
      </header>

      {/* Floating Toolbar when Fullscreen */}
      <div className="fullscreen-floating">
        <button className="icon-btn" onClick={() => setIsFullscreen(false)}>
          <X />
        </button>
        <button
          className={`screen-btn ${deviceSize === "desktop" ? "active" : ""}`}
          onClick={() => setDeviceSize("desktop")}
        >
          <Monitor />
        </button>
        <button
          className={`screen-btn ${deviceSize === "laptop" ? "active" : ""}`}
          onClick={() => setDeviceSize("laptop")}
        >
          <Laptop />
        </button>
        <button
          className={`screen-btn ${deviceSize === "tablet" ? "active" : ""}`}
          onClick={() => setDeviceSize("tablet")}
        >
          <Tablet />
        </button>
        <button
          className={`screen-btn ${deviceSize === "mobile" ? "active" : ""}`}
          onClick={() => setDeviceSize("mobile")}
        >
          <Smartphone />
        </button>
      </div>

      <main className="workspace">
        <aside className="sidebar">
          <div className="active-style">
            <strong>Active Style</strong>
            <span>
              {themeState.preset} · {themeState.previewMode.toUpperCase()} · {themeState.personality} ·{" "}
              {themeState.typography} · {themeState.typeSize} · {themeState.family} · {themeState.style} ·{" "}
              {themeState.shape} · {themeState.visual} · {themeState.density} · {themeState.motion} ·{" "}
              {themeState.atmosphere}
            </span>
          </div>

          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            {activeTab === "settings" && (
              <SettingsPanel
                htmlContent={rawHtml}
                onImport={handleImport}
                onOptimize={handleOptimizeTokens}
                optimizationReport={optimizationReport}
              />
            )}
            
            {activeTab === "customizer" && (
              <CustomizerPanel
                state={themeState}
                onChange={(updates) => setThemeState((prev) => ({ ...prev, ...updates }))}
              />
            )}

            {activeTab === "editor" && (
              <EditorPanel
                state={themeState}
                selectedElement={selectedElement}
                sections={sections}
                childrenOfSection={childrenOfSection}
                onChange={(updates) => setThemeState((prev) => ({ ...prev, ...updates }))}
                onSelectElementByPath={(path) => {
                  const doc = parseHtml(rawHtml);
                  const node = doc.querySelector(path);
                  if (node) {
                    const tag = node.tagName.toLowerCase();
                    let type = "element";
                    if ((node as HTMLElement).dataset.editorType) type = (node as HTMLElement).dataset.editorType!;
                    else if (["h1", "h2", "h3", "h4"].includes(tag)) type = "title";
                    else if (tag === "p") type = "description";
                    else if (["a", "button"].includes(tag)) type = "button";
                    else if (tag === "img") type = "image";
                    else if (node.classList.contains("card") || node.classList.contains("feature-card") || node.classList.contains("person-card")) type = "card";

                    setSelectedElement({
                      path,
                      type,
                      label: (node as HTMLElement).dataset.editorLabel || type.toUpperCase(),
                      text: (node as HTMLElement).innerText || (node as HTMLImageElement).alt || "",
                      href: node.getAttribute("href") || "",
                      src: node.getAttribute("src") || "",
                      alt: node.getAttribute("alt") || "",
                    });
                  }
                }}
                onSaveElement={handleSaveElementProperties}
                onRewriteTag={handleRewriteTag}
                onChangeButtonRole={handleChangeButtonRole}
                onChangeCardRole={handleChangeCardRole}
                onDuplicateElement={handleDuplicateElement}
                onDeleteElement={handleDeleteElement}
                onSelectSection={(path) => {
                  setActiveSectionPath(path);
                  setSelectedElement(null);
                }}
                activeSectionPath={activeSectionPath}
                onSaveSectionStyles={handleSaveSectionStyles}
                onBackToSections={() => {
                  setActiveSectionPath(null);
                  setSelectedElement(null);
                }}
              />
            )}
          </div>

          <div className="bottom-tabs">
            <button
              className={`bottom-tab ${activeTab === "settings" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("settings");
                setSelectedElement(null);
                setActiveSectionPath(null);
              }}
              title="Settings"
            >
              <Settings size={18} />
            </button>
            <button
              className={`bottom-tab ${activeTab === "customizer" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("customizer");
                setSelectedElement(null);
                setActiveSectionPath(null);
              }}
            >
              Interface
            </button>
            <button
              className={`bottom-tab ${activeTab === "editor" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("editor");
                setSelectedElement(null);
                setActiveSectionPath(null);
              }}
            >
              Editor
            </button>
          </div>
        </aside>

        <Preview
          html={renderedHtml}
          deviceSize={deviceSize}
          editorMode={editorMode}
          onElementSelect={(data) => {
            setSelectedElement(data);
            setActiveTab("editor");
          }}
        />
      </main>
    </div>
  );
}
export default App;
