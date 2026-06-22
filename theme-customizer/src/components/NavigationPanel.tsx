import React, { useState, useEffect } from "react";
import { 
  Menu, 
  Plus, 
  Trash2, 
  Save, 
  ArrowUp, 
  ArrowDown, 
  Loader2, 
  Check, 
  Info,
  Navigation
} from "lucide-react";

export interface MenuItem {
  label: string;
  url: string;
}

export interface NavigationMenuData {
  id?: string;
  name: string;
  items: string; // JSON string
  websiteId: string;
  isActive: boolean;
}

interface NavigationPanelProps {
  apiFetch: (method: string, path: string, body?: any) => Promise<any>;
  websiteId: string;
}

const DEFAULT_MENUS = [
  {
    name: "Header Menu",
    items: [
      { label: 'Home', url: '/' },
      { label: 'Connect', url: '/services' },
      { label: 'About', url: '/about' },
      { label: 'Events', url: '/events' },
      { label: 'Ministries', url: '/ministries' },
      { label: 'Contact', url: '/contact' }
    ]
  },
  {
    name: "Rail Navigation",
    items: [
      { label: 'Media', url: '/media' },
      { label: 'Blogs', url: '/blog' },
      { label: 'Resources', url: '/library' },
      { label: 'Podcasts', url: '/podcast' },
      { label: 'Fellowship', url: '/cells' },
      { label: 'Store', url: '/store' },
      { label: 'Devotion', url: '/devotion' }
    ]
  },
  {
    name: "Footer Menu 1",
    items: [
      { label: 'Connect', url: '/services' },
      { label: 'Plan a Visit', url: '/first-time' },
      { label: 'Get in touch', url: '/contact' }
    ]
  },
  {
    name: "Footer Menu 2",
    items: [
      { label: 'Prayer', url: '/prayer' },
      { label: 'Worship', url: '/worship' },
      { label: 'Study', url: '/courses' },
      { label: 'Cells', url: '/cells' },
      { label: 'Giving', url: '/giving' }
    ]
  },
  {
    name: "Main Mobile Drawer Menu",
    items: [
      { label: 'Connect', url: '/services' },
      { label: 'About', url: '/about' },
      { label: 'Events', url: '/events' },
      { label: 'Ministries', url: '/ministries' },
      { label: 'Contact', url: '/contact' }
    ]
  },
  {
    name: "Bottom Mobile Menu",
    items: [
      { label: 'Home', url: '/' },
      { label: 'Media', url: '/media' },
      { label: 'Connect', url: '/services' },
      { label: 'Devotion', url: '/devotion' },
      { label: 'Fellowship', url: '/cells' }
    ]
  },
  {
    name: "Mobile Rail Navigation",
    items: [
      { label: 'Media', url: '/media' },
      { label: 'Blogs', url: '/blog' },
      { label: 'Resources', url: '/library' },
      { label: 'Podcasts', url: '/podcast' },
      { label: 'Fellowship', url: '/cells' },
      { label: 'Store', url: '/store' },
      { label: 'Devotion', url: '/devotion' }
    ]
  }
];

export const NavigationPanel: React.FC<NavigationPanelProps> = ({ apiFetch, websiteId }) => {
  const [menus, setMenus] = useState<NavigationMenuData[]>([]);
  const [selectedMenuName, setSelectedMenuName] = useState<string>("Header Menu");
  const [itemsList, setItemsList] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Load all menus and seed if necessary
  const loadMenus = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("GET", "/api/cms/navigation");
      let existingMenus: NavigationMenuData[] = res?.data || [];

      // Check if any of the default 7 menus are missing and seed them
      const missingMenus = DEFAULT_MENUS.filter(
        (def) => !existingMenus.some((ex) => ex.name.toLowerCase() === def.name.toLowerCase())
      );

      if (missingMenus.length > 0 && websiteId) {
        console.log(`Seeding ${missingMenus.length} missing navigation menus...`);
        for (const missing of missingMenus) {
          const seeded = await apiFetch("POST", "/api/cms/navigation", {
            websiteId,
            name: missing.name,
            items: missing.items,
            isActive: true
          });
          if (seeded?.data) {
            existingMenus.push(seeded.data);
          }
        }
      }

      setMenus(existingMenus);
      
      // Load items for currently selected menu name
      const activeMenu = existingMenus.find(m => m.name.toLowerCase() === selectedMenuName.toLowerCase());
      if (activeMenu) {
        const parsedItems = JSON.parse(activeMenu.items || "[]");
        setItemsList(parsedItems);
      } else {
        setItemsList([]);
      }
    } catch (err) {
      console.error("Failed to load navigation menus:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenus();
  }, [websiteId]);

  // Update items display when selecting a different menu
  const handleSelectMenuName = (name: string) => {
    setSelectedMenuName(name);
    const activeMenu = menus.find(m => m.name.toLowerCase() === name.toLowerCase());
    if (activeMenu) {
      try {
        setItemsList(JSON.parse(activeMenu.items || "[]"));
      } catch (e) {
        setItemsList([]);
      }
    } else {
      // Fallback to default if not yet seeded/loaded
      const def = DEFAULT_MENUS.find(d => d.name.toLowerCase() === name.toLowerCase());
      setItemsList(def ? def.items : []);
    }
    setSaveSuccess(false);
  };

  const handleItemChange = (index: number, field: keyof MenuItem, value: string) => {
    const updated = [...itemsList];
    updated[index] = { ...updated[index], [field]: value };
    setItemsList(updated);
    setSaveSuccess(false);
  };

  const handleAddItem = () => {
    setItemsList([...itemsList, { label: "New Link", url: "/" }]);
    setSaveSuccess(false);
  };

  const handleDeleteItem = (index: number) => {
    setItemsList(itemsList.filter((_, i) => i !== index));
    setSaveSuccess(false);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...itemsList];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setItemsList(updated);
    setSaveSuccess(false);
  };

  const handleMoveDown = (index: number) => {
    if (index === itemsList.length - 1) return;
    const updated = [...itemsList];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setItemsList(updated);
    setSaveSuccess(false);
  };

  const handleSaveMenu = async () => {
    if (!websiteId) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const activeMenu = menus.find(m => m.name.toLowerCase() === selectedMenuName.toLowerCase());
      
      const payload: any = {
        websiteId,
        name: selectedMenuName,
        items: itemsList,
        isActive: true
      };

      if (activeMenu?.id) {
        payload.id = activeMenu.id;
      }

      const res = await apiFetch("POST", "/api/cms/navigation", payload);
      
      if (res?.data) {
        // Update local menus cache
        setMenus(prev => {
          const index = prev.findIndex(m => m.name.toLowerCase() === selectedMenuName.toLowerCase());
          if (index > -1) {
            const copy = [...prev];
            copy[index] = res.data;
            return copy;
          } else {
            return [...prev, res.data];
          }
        });
        setSaveSuccess(true);
      }
    } catch (err) {
      console.error("Failed to save menu:", err);
      alert("Error saving navigation menu: " + err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px 20px' }}>
        <Loader2 className="animate-spin" size={24} style={{ color: "var(--primary)", marginBottom: "12px" }} />
        <span style={{ fontSize: "13px", color: "var(--muted)" }}>Loading navigators...</span>
      </div>
    );
  }

  return (
    <div className="panel" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="section-title" style={{ marginBottom: "16px" }}>
        <div className="title-icon">
          <Navigation size={20} />
        </div>
        <h3>Navigators</h3>
      </div>

      <div style={{ padding: "0 16px 12px 16px" }}>
        <label style={{ display: "block", fontSize: "11px", textTransform: "uppercase", color: "var(--muted)", fontWeight: 700, marginBottom: "6px" }}>
          Select Menu to Configure
        </label>
        <div className="custom-dropdown" style={{ width: "100%" }}>
          <select 
            value={selectedMenuName} 
            onChange={(e) => handleSelectMenuName(e.target.value)}
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "10px 14px",
              color: "white",
              fontSize: "14px",
              cursor: "pointer",
              outline: "none"
            }}
          >
            {DEFAULT_MENUS.map((menu) => (
              <option key={menu.name} value={menu.name} style={{ background: "#1e293b", color: "white" }}>
                {menu.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="edit-box" style={{ flex: 1, overflowY: "auto", padding: "16px", margin: "0 16px 16px 16px", border: "1px solid var(--border)", borderRadius: "10px", background: "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h4 style={{ margin: 0, fontSize: "13px", color: "var(--muted)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px" }}>
            <Menu size={14} /> Links ({itemsList.length})
          </h4>
          <button 
            className="small-btn primary"
            onClick={handleAddItem}
            style={{ padding: "4px 8px", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px", borderRadius: "6px" }}
          >
            <Plus size={12} /> Add Link
          </button>
        </div>

        {itemsList.length === 0 ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "30px", border: "1px dashed var(--border)", borderRadius: "8px", color: "var(--muted)" }}>
            <Info size={24} style={{ marginBottom: "8px", opacity: 0.5 }} />
            <span style={{ fontSize: "12px" }}>No items in this menu. Click Add Link above to begin.</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {itemsList.map((item, index) => (
              <div 
                key={index} 
                style={{ 
                  background: "rgba(255,255,255,0.03)", 
                  border: "1px solid var(--border)", 
                  borderRadius: "8px", 
                  padding: "10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  position: "relative"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="text"
                    value={item.label}
                    placeholder="Link Label (e.g. Home)"
                    onChange={(e) => handleItemChange(index, "label", e.target.value)}
                    style={{
                      flex: 1,
                      background: "rgba(0,0,0,0.2)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      padding: "6px 8px",
                      color: "white",
                      fontSize: "12px",
                      outline: "none"
                    }}
                  />
                  <div style={{ display: "flex", gap: "2px" }}>
                    <button 
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      style={{ background: "transparent", border: 0, cursor: index === 0 ? "not-allowed" : "pointer", padding: "4px", color: index === 0 ? "rgba(255,255,255,0.15)" : "var(--muted)" }}
                      title="Move Up"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button 
                      onClick={() => handleMoveDown(index)}
                      disabled={index === itemsList.length - 1}
                      style={{ background: "transparent", border: 0, cursor: index === itemsList.length - 1 ? "not-allowed" : "pointer", padding: "4px", color: index === itemsList.length - 1 ? "rgba(255,255,255,0.15)" : "var(--muted)" }}
                      title="Move Down"
                    >
                      <ArrowDown size={12} />
                    </button>
                    <button 
                      onClick={() => handleDeleteItem(index)}
                      style={{ background: "transparent", border: 0, cursor: "pointer", padding: "4px", color: "#f87171" }}
                      title="Delete Link"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={item.url}
                  placeholder="URL Path (e.g. /about)"
                  onChange={(e) => handleItemChange(index, "url", e.target.value)}
                  style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.2)",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                    padding: "6px 8px",
                    color: "var(--muted)",
                    fontSize: "11px",
                    outline: "none"
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "0 16px 16px 16px" }}>
        <button
          className="small-btn primary"
          onClick={handleSaveMenu}
          disabled={saving}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "12px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
            background: saveSuccess ? "#10b981" : "var(--primary)",
            borderColor: saveSuccess ? "#10b981" : "var(--primary)",
            cursor: saving ? "not-allowed" : "pointer",
            transition: "all 0.2s"
          }}
        >
          {saving ? (
            <Loader2 className="animate-spin" size={16} />
          ) : saveSuccess ? (
            <Check size={16} />
          ) : (
            <Save size={16} />
          )}
          <span>{saving ? "Saving Menu..." : saveSuccess ? "Saved Successfully" : `Save ${selectedMenuName}`}</span>
        </button>
      </div>
    </div>
  );
};
