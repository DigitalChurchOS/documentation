import React, { useRef, useState } from "react";
import { Settings, FileUp, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, Palette } from "lucide-react";

export interface ThemeInfo {
  id: string;
  name: string;
  description: string;
  folderName: string;
  thumbnail: string;
}

interface SettingsPanelProps {
  htmlContent: string;
  onImport: (content: string, filename: string) => void;
  onOptimize: () => void;
  optimizationReport: { count: number; details: string[] } | null;
  currentTheme: string;
  onSelectTheme: (folderName: string) => void;
  themes: ThemeInfo[];
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  htmlContent,
  onImport,
  onOptimize,
  optimizationReport,
  currentTheme,
  onSelectTheme,
  themes,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importedName, setImportedName] = useState<string>("default-theme-page.html");
  const [report, setReport] = useState<{
    overall: number;
    rows: { name: string; score: number; passed: boolean }[];
  } | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const content = await file.text();
    setImportedName(file.name);
    onImport(content, file.name);
    setReport(null); // Clear previous reports on new imports
  };

  const runCompatibilityTest = () => {
    const html = htmlContent.toLowerCase();

    const checks = {
      "Theme Tokens": ["--primary", "--site-bg", "--site-text", "--radius"],
      "Responsive Safety": ["overflow-x:hidden", "max-width:100%", "box-sizing:border-box"],
      "Editor Markup": ["data-editor-type", "data-editor-label"],
      "Header/Footer": ["header", "footer"],
      "Mobile Drawer": ["ec-mobile-menu-toggle", "ec-mobile-drawer"],
    };

    let totalScore = 0;
    const rows = Object.entries(checks).map(([name, tokens]) => {
      const matched = tokens.filter((token) => html.includes(token.toLowerCase())).length;
      const score = Math.round((matched / tokens.length) * 100);
      totalScore += score;
      return {
        name,
        score,
        passed: score >= 50,
      };
    });

    const overall = Math.round(totalScore / Object.keys(checks).length);
    setReport({ overall, rows });
  };

  return (
    <div className="panel">
      <div className="section-title">
        <div className="title-icon">
          <Settings size={20} />
        </div>
        <h3>Settings</h3>
      </div>

      <div className="edit-box">
        <h4 style={{ display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase" }}>
          <Palette size={14} style={{ color: "var(--primary)" }} /> Active Theme
        </h4>
        <p>Select a native church theme from the catalog to load its pages, customize design system tokens, and publish.</p>
        
        <div className="themes-grid" style={{ marginBottom: "10px" }}>
          {themes.map((theme) => (
            <div
              key={theme.id}
              className={`theme-card ${currentTheme === theme.folderName ? "active" : ""}`}
              onClick={() => onSelectTheme(theme.folderName)}
            >
              <div className="theme-thumbnail-wrapper">
                <img
                  src={theme.thumbnail}
                  alt={`${theme.name} Thumbnail`}
                  className="theme-thumbnail"
                />
              </div>
              <div className="theme-info">
                <div className="theme-name">
                  <span>{theme.name}</span>
                  {currentTheme === theme.folderName && (
                    <span className="theme-active-tag">Active</span>
                  )}
                </div>
                <div className="theme-desc">{theme.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="edit-box">
        <h4>Import HTML Page</h4>
        <p>Import any custom church HTML page to style, optimize, and edit within the customizer dashboard.</p>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".html,text/html"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        <div className="field">
          <label>Active File</label>
          <div style={{ fontSize: "12px", color: "#cbd5e1", background: "rgba(255,255,255,0.05)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "8px" }}>
            <FileUp size={16} style={{ color: "var(--primary)" }} />
            <span>{importedName}</span>
          </div>
        </div>

        <div className="action-grid">
          <button
            className="small-btn primary"
            onClick={() => fileInputRef.current?.click()}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
          >
            <FileUp size={14} /> Import HTML
          </button>
          <button
            className="small-btn"
            onClick={runCompatibilityTest}
          >
            Test Page
          </button>
        </div>
      </div>

      {report && (
        <div className="report">
          <h4>Compatibility Report</h4>
          <p style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "600", color: report.overall > 60 ? "#10b981" : "#f59e0b" }}>
            {report.overall > 60 ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
            <span>Coverage Index: {report.overall}%</span>
          </p>

          <div style={{ marginTop: "12px" }}>
            {report.rows.map((row) => (
              <div key={row.name} className="report-row">
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {row.passed ? (
                    <CheckCircle2 size={13} style={{ color: "#10b981" }} />
                  ) : (
                    <AlertTriangle size={13} style={{ color: "#f59e0b" }} />
                  )}
                  <strong>{row.name}</strong>
                </div>
                <span>{row.score}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="edit-box">
        <h4>Token Optimization Engine</h4>
        <p>Scans the DOM, translates hardcoded style parameters (hex values, fonts) into the Ecclesia Theme Token system automatically.</p>
        <button
          className="small-btn"
          onClick={onOptimize}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
        >
          <Sparkles size={14} style={{ color: "var(--primary)" }} /> Optimize Design Tokens
        </button>

        {optimizationReport && (
          <div style={{ marginTop: "12px", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
            <p style={{ fontSize: "12px", fontWeight: "600", color: "#10b981", marginBottom: "6px" }}>
              Successfully optimized {optimizationReport.count} element styles:
            </p>
            <div style={{ maxHeight: "120px", overflowY: "auto", fontSize: "11px", color: "var(--text-muted)", lineHeight: "1.4" }}>
              {optimizationReport.details.length > 0 ? (
                optimizationReport.details.map((detail, index) => (
                  <div key={index} style={{ marginBottom: "4px", paddingBottom: "4px", borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                    - {detail}
                  </div>
                ))
              ) : (
                <div>No hardcoded styles needed optimization (already fully tokenized!).</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
