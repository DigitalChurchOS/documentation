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

const AVAILABLE_BLOCKS = [
  // Layout & Sections
  {
    id: "hero",
    category: "section",
    name: "Hero Section",
    description: "Large landing header with text and floating media",
    html: `<section class="hero" data-editor-type="section" data-editor-label="Hero Section">
  <div class="hero-copy">
    <span class="section-kicker" data-editor-type="badge">Welcome Home</span>
    <h1 data-editor-type="title">Enter Your Hero Heading Here</h1>
    <p data-editor-type="description">Add a short description about your church or event to guide your visitors.</p>
    <div class="hero-actions">
      <a class="btn btn-primary" href="#" data-editor-type="button">Plan Your Visit</a>
      <a class="btn btn-light" href="#" data-editor-type="button">Watch Live</a>
    </div>
  </div>
  <div class="hero-media">
    <div class="floating-service">
      <h3 data-editor-type="title">Worship Service</h3>
      <p data-editor-type="description">Sunday Services at 9:00 AM & 11:00 AM</p>
    </div>
  </div>
</section>`
  },
  {
    id: "cards-3",
    category: "section",
    name: "3-Column Grid",
    description: "Grid of 3 cards for core ministries or features",
    html: `<section data-editor-type="section" data-editor-label="3-Column Cards" style="padding: 54px 22px;">
  <div class="cards-3">
    <div class="feature-card" data-editor-type="card">
      <div class="feature-icon"><i data-lucide="sun"></i></div>
      <h3 data-editor-type="title">Youth Ministry</h3>
      <p data-editor-type="description">Connecting the next generation to faith, purpose, and community.</p>
    </div>
    <div class="feature-card" data-editor-type="card">
      <div class="feature-icon"><i data-lucide="users"></i></div>
      <h3 data-editor-type="title">Small Groups</h3>
      <p data-editor-type="description">Do life together in circles, not just rows. Find a group today.</p>
    </div>
    <div class="feature-card" data-editor-type="card">
      <div class="feature-icon"><i data-lucide="heart"></i></div>
      <h3 data-editor-type="title">Outreach</h3>
      <p data-editor-type="description">Serving our local city and global partners through active love.</p>
    </div>
  </div>
</section>`
  },
  {
    id: "wide-panel",
    category: "section",
    name: "Featured Wide Panel",
    description: "A wide banner with an image on the left and content on the right",
    html: `<section data-editor-type="section" data-editor-label="Wide Panel" style="padding: 54px 22px;">
  <div class="wide-panel">
    <div class="wide-image" style="background-image: url('https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=85');"></div>
    <div class="wide-content">
      <h2 data-editor-type="title">Our Beliefs & Values</h2>
      <p data-editor-type="description">We are a welcoming community shaped by grace and love. Discover our core doctrines, statement of faith, and vision for the future.</p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="#" data-editor-type="button">What We Believe</a>
      </div>
    </div>
  </div>
</section>`
  },
  {
    id: "split-columns",
    category: "section",
    name: "2-Column Split",
    description: "Side-by-side blocks for announcements or testimonies",
    html: `<section data-editor-type="section" data-editor-label="2-Column Split" style="padding: 54px 22px;">
  <div class="split">
    <div class="prayer-box" data-editor-type="card">
      <h3 data-editor-type="title">Need Prayer?</h3>
      <p data-editor-type="description">Our prayer team is here to support you. Submit your requests and let us stand in faith with you.</p>
      <div style="margin-top: 20px;">
        <a class="btn btn-primary" href="#" data-editor-type="button">Request Prayer</a>
      </div>
    </div>
    <div class="testimony-box" data-editor-type="card">
      <h3 data-editor-type="title">Latest Story</h3>
      <p class="quote">"Finding this church family completely changed my life. I found real belonging and support."</p>
      <div class="person">
        <div class="avatar">JM</div>
        <div>
          <strong style="display: block; font-size: 14px;">John Miller</strong>
          <span style="color: var(--muted); font-size: 12px;">Member since 2024</span>
        </div>
      </div>
    </div>
  </div>
</section>`
  },
  {
    id: "giving",
    category: "section",
    name: "Giving Callout",
    description: "Bold full-width call to action to support ministries",
    html: `<section class="giving" data-editor-type="section" data-editor-label="Giving Section">
  <h2 data-editor-type="title">Support Our Mission</h2>
  <p data-editor-type="description">Your generosity helps us make a difference in our community and around the world. Secure online giving is simple and fast.</p>
  <a class="btn btn-primary" href="#" data-editor-type="button">Give Online Now</a>
</section>`
  },
  {
    id: "location-map",
    category: "section",
    name: "Location & Times",
    description: "Sunday times, address, and interactive map card",
    html: `<section data-editor-type="section" data-editor-label="Location & Map" style="padding: 54px 22px;">
  <div class="location-grid">
    <div class="location-card" data-editor-type="card">
      <h2 data-editor-type="title">Join Us This Sunday</h2>
      <div class="info-row">
        <i data-lucide="map-pin"></i>
        <span data-editor-type="description">123 Grace Street, Cityville</span>
      </div>
      <div class="info-row">
        <i data-lucide="clock"></i>
        <span data-editor-type="description">Sunday Services at 9:00 AM & 11:00 AM</span>
      </div>
    </div>
    <div class="map-card">
      <div class="map-pin">
        <i data-lucide="navigation" style="width: 28px; height: 28px;"></i>
      </div>
    </div>
  </div>
</section>`
  },
  {
    id: "contact-form",
    category: "section",
    name: "Contact Form",
    description: "Standard input form inside a container card",
    html: `<section data-editor-type="section" data-editor-label="Contact Form" style="padding: 54px 22px;">
  <div class="form-card" data-editor-type="card">
    <h3 data-editor-type="title" style="margin-top: 0; margin-bottom: 20px;">Contact Us</h3>
    <form class="form-grid" onsubmit="event.preventDefault();">
      <input type="text" class="input" placeholder="First Name" />
      <input type="text" class="input" placeholder="Last Name" />
      <input type="email" class="input full" placeholder="Email Address" />
      <textarea placeholder="Your Message"></textarea>
      <div class="full" style="text-align: right; margin-top: 10px;">
        <button type="submit" class="btn btn-primary" data-editor-type="button">Submit Message</button>
      </div>
    </form>
  </div>
</section>`
  },
  
  // Elements
  {
    id: "heading",
    category: "element",
    name: "Section Heading",
    description: "Standard section title (H2)",
    html: `<h2 data-editor-type="title">New Heading Element</h2>`
  },
  {
    id: "paragraph",
    category: "element",
    name: "Paragraph Text",
    description: "Standard body description text",
    html: `<p data-editor-type="description">New description copy. Click to type new text or adjust settings.</p>`
  },
  {
    id: "button",
    category: "element",
    name: "Action Button",
    description: "Interactive themed call to action link",
    html: `<a class="btn btn-primary" href="#" data-editor-type="button">Click Here</a>`
  },
  {
    id: "image",
    category: "element",
    name: "Image Element",
    description: "Standard image node",
    html: `<img data-editor-type="image" src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=85" alt="New Image Element" style="width: 100%; border-radius: var(--radius-lg);" />`
  },
  {
    id: "accordion",
    category: "element",
    name: "Accordion Item",
    description: "Collapsible details box for FAQs",
    html: `<details class="mini-card" style="margin-bottom: 12px; cursor: pointer; width: 100%;" data-editor-type="card">
  <summary style="font-weight: bold; font-size: 15px; outline: none; margin-bottom: 4px;" data-editor-type="title">FAQ / Accordion Question</summary>
  <p style="margin-top: 8px;" data-editor-type="description">Provide a detailed answer or collapsible content details here.</p>
</details>`
  },
  {
    id: "tabs",
    category: "element",
    name: "Tabs Component",
    description: "Clickable mock tabs interface block",
    html: `<div class="mini-card" data-editor-type="card" style="margin-bottom: 12px; width: 100%;">
  <div style="display: flex; gap: 8px; border-bottom: 1px solid var(--border); padding-bottom: 8px; margin-bottom: 8px;">
    <span style="font-weight: bold; color: var(--accent);" data-editor-type="title">Active Tab</span>
    <span style="color: var(--muted);" data-editor-type="title">Second Tab</span>
  </div>
  <p data-editor-type="description">Active tab content description details. Customize text and links inside.</p>
</div>`
  }
];

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
  onDragStart?: (blockData: { blockType: string; category: string; html: string }) => void;
  onDragEnd?: () => void;
}

const renderBlockIcon = (type: string) => {
  switch (type) {
    case "hero":
      return (
        <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="6" width="40" height="4" rx="1" fill="var(--primary)" opacity="0.3"/>
          <rect x="6" y="16" width="20" height="4" rx="1" fill="var(--primary)"/>
          <rect x="6" y="24" width="16" height="2" rx="0.5" fill="var(--text-muted)" opacity="0.7"/>
          <rect x="6" y="28" width="12" height="2" rx="0.5" fill="var(--text-muted)" opacity="0.7"/>
          <rect x="6" y="34" width="8" height="4" rx="1" fill="var(--primary)"/>
          <rect x="16" y="34" width="8" height="4" rx="1" fill="var(--text-muted)" opacity="0.4"/>
          <rect x="30" y="14" width="12" height="26" rx="2" fill="var(--text-muted)" opacity="0.25"/>
        </svg>
      );
    case "cards-3":
      return (
        <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="10" width="11" height="28" rx="1.5" fill="var(--text-muted)" opacity="0.15" stroke="var(--border)" strokeWidth="1"/>
          <rect x="18" y="10" width="11" height="28" rx="1.5" fill="var(--text-muted)" opacity="0.15" stroke="var(--border)" strokeWidth="1"/>
          <rect x="32" y="10" width="11" height="28" rx="1.5" fill="var(--text-muted)" opacity="0.15" stroke="var(--border)" strokeWidth="1"/>
          <circle cx="9.5" cy="16" r="2.5" fill="var(--primary)"/>
          <circle cx="23.5" cy="16" r="2.5" fill="var(--primary)"/>
          <circle cx="37.5" cy="16" r="2.5" fill="var(--primary)"/>
          <rect x="6" y="24" width="7" height="1.5" rx="0.5" fill="var(--text-muted)" opacity="0.7"/>
          <rect x="20" y="24" width="7" height="1.5" rx="0.5" fill="var(--text-muted)" opacity="0.7"/>
          <rect x="34" y="24" width="7" height="1.5" rx="0.5" fill="var(--text-muted)" opacity="0.7"/>
        </svg>
      );
    case "wide-panel":
      return (
        <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="10" width="40" height="28" rx="2" fill="var(--text-muted)" opacity="0.1" stroke="var(--border)" strokeWidth="1"/>
          <rect x="4" y="10" width="16" height="28" rx="2" fill="var(--text-muted)" opacity="0.25"/>
          <circle cx="12" cy="24" r="3" fill="var(--text-muted)" opacity="0.4"/>
          <rect x="24" y="16" width="16" height="3" rx="1" fill="var(--primary)"/>
          <rect x="24" y="23" width="14" height="1.5" rx="0.5" fill="var(--text-muted)" opacity="0.7"/>
          <rect x="24" y="27" width="12" height="1.5" rx="0.5" fill="var(--text-muted)" opacity="0.7"/>
        </svg>
      );
    case "split-columns":
      return (
        <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="10" width="18" height="28" rx="2" fill="var(--text-muted)" opacity="0.15" stroke="var(--border)" strokeWidth="1"/>
          <rect x="26" y="10" width="18" height="28" rx="2" fill="var(--text-muted)" opacity="0.15" stroke="var(--border)" strokeWidth="1"/>
          <rect x="7" y="16" width="12" height="3" rx="0.5" fill="var(--primary)"/>
          <rect x="7" y="23" width="10" height="1.5" rx="0.5" fill="var(--text-muted)" opacity="0.7"/>
          <circle cx="35" cy="16" r="3" fill="var(--primary)"/>
          <rect x="30" y="23" width="10" height="1.5" rx="0.5" fill="var(--text-muted)" opacity="0.7"/>
        </svg>
      );
    case "giving":
      return (
        <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="10" width="40" height="28" rx="3" fill="var(--primary)" opacity="0.15" stroke="var(--primary)" strokeWidth="1"/>
          <path d="M24 29C24 29 17 25 17 20C17 17 19 14.5 22 14.5C23.2 14.5 23.8 15 24 15.5C24.2 15 24.8 14.5 26 14.5C29 14.5 31 17 31 20C31 25 24 29 24 29Z" fill="var(--primary)"/>
          <rect x="14" y="10" width="20" height="2" rx="0.5" fill="var(--primary)" opacity="0.5"/>
        </svg>
      );
    case "location-map":
      return (
        <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="10" width="18" height="28" rx="2" fill="var(--text-muted)" opacity="0.15" stroke="var(--border)"/>
          <rect x="7" y="15" width="12" height="2" rx="0.5" fill="var(--primary)"/>
          <rect x="7" y="21" width="10" height="1.5" rx="0.5" fill="var(--text-muted)" opacity="0.7"/>
          <rect x="26" y="10" width="18" height="28" rx="2" fill="var(--text-muted)" opacity="0.1" stroke="var(--border)"/>
          <circle cx="35" cy="18" r="3" fill="var(--primary)" opacity="0.3"/>
          <path d="M35 14C33.5 14 32.5 15 32.5 16.5C32.5 18.5 35 22 35 22C35 22 37.5 18.5 37.5 16.5C37.5 15 36.5 14 35 14Z" fill="var(--primary)"/>
        </svg>
      );
    case "contact-form":
      return (
        <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="8" width="36" height="32" rx="3" fill="var(--text-muted)" opacity="0.1" stroke="var(--border)" strokeWidth="1"/>
          <rect x="10" y="13" width="13" height="3" rx="1" fill="var(--text-muted)" opacity="0.2"/>
          <rect x="25" y="13" width="13" height="3" rx="1" fill="var(--text-muted)" opacity="0.2"/>
          <rect x="10" y="20" width="28" height="3" rx="1" fill="var(--text-muted)" opacity="0.2"/>
          <rect x="10" y="27" width="28" height="7" rx="1" fill="var(--text-muted)" opacity="0.2"/>
        </svg>
      );
    case "heading":
      return (
        <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 14H32M24 14V30" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round"/>
          <rect x="12" y="32" width="24" height="2" rx="1" fill="var(--text-muted)" opacity="0.4"/>
        </svg>
      );
    case "paragraph":
      return (
        <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="14" width="32" height="2.5" rx="1" fill="var(--text-muted)"/>
          <rect x="8" y="22" width="32" height="2.5" rx="1" fill="var(--text-muted)"/>
          <rect x="8" y="30" width="20" height="2.5" rx="1" fill="var(--text-muted)"/>
        </svg>
      );
    case "button":
      return (
        <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="18" width="32" height="12" rx="6" fill="var(--primary)"/>
          <rect x="16" y="23" width="16" height="2" rx="1" fill="white"/>
        </svg>
      );
    case "image":
      return (
        <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="10" width="36" height="28" rx="2" fill="var(--text-muted)" opacity="0.1" stroke="var(--border)" strokeWidth="2"/>
          <circle cx="30" cy="18" r="3" fill="var(--primary)" opacity="0.6"/>
          <path d="M6 34L18 22L30 32L36 26L42 32" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round"/>
        </svg>
      );
    case "accordion":
      return (
        <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="10" width="36" height="7" rx="1.5" fill="var(--text-muted)" opacity="0.15" stroke="var(--border)"/>
          <rect x="6" y="20" width="36" height="7" rx="1.5" fill="var(--text-muted)" opacity="0.15" stroke="var(--border)"/>
          <rect x="6" y="30" width="36" height="7" rx="1.5" fill="var(--text-muted)" opacity="0.15" stroke="var(--border)"/>
          <path d="M35 13L37 14.5L35 16" stroke="var(--text-muted)" strokeWidth="1.5" fill="none"/>
          <path d="M35 23L37 24.5L35 26" stroke="var(--text-muted)" strokeWidth="1.5" fill="none"/>
          <path d="M35 33L37 34.5L35 36" stroke="var(--text-muted)" strokeWidth="1.5" fill="none"/>
        </svg>
      );
    case "tabs":
      return (
        <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="10" width="12" height="4" rx="1" fill="var(--primary)"/>
          <rect x="20" y="10" width="12" height="4" rx="1" fill="var(--text-muted)" opacity="0.3"/>
          <rect x="6" y="14" width="36" height="24" rx="2" fill="var(--text-muted)" opacity="0.15" stroke="var(--border)"/>
          <rect x="10" y="20" width="28" height="1.5" rx="0.5" fill="var(--text-muted)" opacity="0.7"/>
          <rect x="10" y="25" width="22" height="1.5" rx="0.5" fill="var(--text-muted)" opacity="0.7"/>
        </svg>
      );
    default:
      return null;
  }
};

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
  onDragStart,
  onDragEnd,
}) => {
  const [subView, setSubView] = useState<"sections" | "section-detail" | "header" | "footer" | "element">("sections");
  const [localTab, setLocalTab] = useState<string>("style");
  const [editorSubTab, setEditorSubTab] = useState<"sections" | "blocks">("sections");
  
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
        <div className="mode-tabs" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <button
            className={`mode-tab ${editorSubTab === "sections" ? "active" : ""}`}
            onClick={() => setEditorSubTab("sections")}
          >
            Sections
          </button>
          <button
            className={`mode-tab ${editorSubTab === "blocks" ? "active" : ""}`}
            onClick={() => setEditorSubTab("blocks")}
          >
            Blocks
          </button>
        </div>

        <div className="panel">
          {editorSubTab === "sections" ? (
            <>
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
            </>
          ) : (
            <>
              <div className="section-title">
                <div className="title-icon">
                  <LayoutTemplate size={18} />
                </div>
                <h3>Drag Blocks</h3>
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "16px", lineHeight: "1.4" }}>
                Drag a layout or element from below and drop it onto the live preview site page to build content.
              </div>

              <h4 style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "8px", marginTop: "16px" }}>
                Layout & Sections
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {AVAILABLE_BLOCKS.filter(b => b.category === "section").map((block) => (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/json", JSON.stringify({
                        blockType: block.id,
                        category: block.category,
                        html: block.html
                      }));
                      e.dataTransfer.setData("text/plain", JSON.stringify({
                        blockType: block.id,
                        category: block.category,
                        html: block.html
                      }));
                      e.dataTransfer.effectAllowed = "copy";
                      if (onDragStart) onDragStart({
                        blockType: block.id,
                        category: block.category,
                        html: block.html
                      });
                      
                      const iframe = document.querySelector(".preview-frame") as HTMLIFrameElement;
                      if (iframe && iframe.contentWindow) {
                        iframe.contentWindow.postMessage({
                          type: "ec-drag-start",
                          category: block.category
                        }, "*");
                      }
                    }}
                    onDragEnd={() => {
                      const iframe = document.querySelector(".preview-frame") as HTMLIFrameElement;
                      if (iframe && iframe.contentWindow) {
                        iframe.contentWindow.postMessage({
                          type: "ec-drag-end"
                        }, "*");
                      }
                      if (onDragEnd) onDragEnd();
                    }}
                    className="preset-card"
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "12px", 
                      textAlign: "left", 
                      padding: "10px",
                      cursor: "grab",
                      width: "100%",
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      boxSizing: "border-box",
                      marginBottom: "0px"
                    }}
                  >
                    <div
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '6px',
                        background: 'rgba(0, 0, 0, 0.2)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {renderBlockIcon(block.id)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ display: "block", fontSize: "14px" }}>{block.name}</strong>
                      <span style={{ fontSize: "11px", color: "var(--muted)", display: "block", marginTop: "2px", whiteSpace: "normal", lineHeight: "1.3" }}>
                        {block.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <h4 style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "8px", marginTop: "24px" }}>
                Inner Elements
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {AVAILABLE_BLOCKS.filter(b => b.category === "element").map((block) => (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/json", JSON.stringify({
                        blockType: block.id,
                        category: block.category,
                        html: block.html
                      }));
                      e.dataTransfer.setData("text/plain", JSON.stringify({
                        blockType: block.id,
                        category: block.category,
                        html: block.html
                      }));
                      e.dataTransfer.effectAllowed = "copy";
                      if (onDragStart) onDragStart({
                        blockType: block.id,
                        category: block.category,
                        html: block.html
                      });

                      const iframe = document.querySelector(".preview-frame") as HTMLIFrameElement;
                      if (iframe && iframe.contentWindow) {
                        iframe.contentWindow.postMessage({
                          type: "ec-drag-start",
                          category: block.category
                        }, "*");
                      }
                    }}
                    onDragEnd={() => {
                      const iframe = document.querySelector(".preview-frame") as HTMLIFrameElement;
                      if (iframe && iframe.contentWindow) {
                        iframe.contentWindow.postMessage({
                          type: "ec-drag-end"
                        }, "*");
                      }
                      if (onDragEnd) onDragEnd();
                    }}
                    className="preset-card"
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "12px", 
                      textAlign: "left", 
                      padding: "10px",
                      cursor: "grab",
                      width: "100%",
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      boxSizing: "border-box",
                      marginBottom: "0px"
                    }}
                  >
                    <div
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '6px',
                        background: 'rgba(0, 0, 0, 0.2)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {renderBlockIcon(block.id)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ display: "block", fontSize: "14px" }}>{block.name}</strong>
                      <span style={{ fontSize: "11px", color: "var(--muted)", display: "block", marginTop: "2px", whiteSpace: "normal", lineHeight: "1.3" }}>
                        {block.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
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
