import React, { useEffect, useRef } from "react";

interface PreviewProps {
  html: string;
  deviceSize: "desktop" | "laptop" | "tablet" | "mobile";
  editorMode: boolean;
  onElementSelect: (data: {
    path: string;
    type: string;
    label: string;
    text: string;
    href: string;
    src: string;
    alt: string;
  }) => void;
}

export const Preview: React.FC<PreviewProps> = ({
  html,
  deviceSize,
  editorMode,
  onElementSelect,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Injected selection capture script
  const captureScript = `
    (function() {
      if (document.__ecclesiaBound) {
        // Just update editing mode state class
        document.body.classList.toggle("ec-editing", ${editorMode});
        if (!${editorMode}) {
          document.querySelectorAll("*").forEach(el => {
            el.style.outline = "";
            el.style.outlineOffset = "";
          });
        }
        return;
      }
      document.__ecclesiaBound = true;

      document.body.classList.toggle("ec-editing", ${editorMode});

      document.addEventListener("pointerdown", function(e) {
        if (!document.body.classList.contains("ec-editing")) return;

        // Prevent click actions
        e.preventDefault();
        e.stopPropagation();

        // Handle mobile menu toggle in editing mode
        const toggle = e.target.closest(".ec-mobile-menu-toggle");
        if (toggle) {
          document.body.classList.toggle("ec-mobile-drawer-open");
        }
        const closeBtn = e.target.closest(".ec-mobile-drawer-close");
        const overlay = e.target.closest(".ec-mobile-overlay");
        if (closeBtn || overlay) {
          document.body.classList.remove("ec-mobile-drawer-open");
        }

        let target = e.target;
        
        // Target resolving helper
        const header = target.closest("header,[data-editor-type='header']");
        const footer = target.closest("footer,[data-editor-type='footer']");

        if (header) {
          const child = target.closest(".ec-mobile-menu-toggle,a,button,img,h1,h2,h3,h4,p,[data-editor-type='title'],[data-editor-type='button'],[data-editor-type='image'],[data-editor-type='description']");
          if (child && child !== header) target = child;
          else target = header;
        } else if (footer) {
          const child = target.closest("a,button,img,h1,h2,h3,h4,p,[data-editor-type='title'],[data-editor-type='button'],[data-editor-type='image'],[data-editor-type='description']");
          if (child && child !== footer) target = child;
          else target = footer;
        } else {
          const card = target.closest("[data-editor-type='card'],.card,.feature-card,.person-card");
          if (card) {
            const inner = target.closest("h1,h2,h3,h4,p,button,a,img,[data-editor-type='title'],[data-editor-type='description'],[data-editor-type='button'],[data-editor-type='image']");
            if (inner && inner !== card) target = inner;
            else target = card;
          } else {
            target = target.closest("[data-editor-type],h1,h2,h3,h4,p,button,a,img,section,main") || target;
          }
        }

        // Apply visual outline marker
        document.querySelectorAll("*").forEach(el => {
          el.style.outline = "";
          el.style.outlineOffset = "";
        });
        target.style.outline = "3px solid #0284c7";
        target.style.outlineOffset = "3px";

        // Generate selector path
        const path = (function(el) {
          const parts = [];
          while (el && el.nodeType === 1 && el !== document.body) {
            let index = 1;
            let sibling = el;
            while (sibling = sibling.previousElementSibling) {
              if (sibling.tagName === el.tagName) index++;
            }
            parts.unshift(el.tagName.toLowerCase() + ":nth-of-type(" + index + ")");
            el = el.parentElement;
          }
          return parts.join(">");
        })(target);

        // Determine element editing type properties
        let type = "element";
        if (target.dataset.editorType) type = target.dataset.editorType;
        else if (target.tagName === "HEADER") type = "header";
        else if (target.tagName === "FOOTER") type = "footer";
        else if (["H1","H2","H3","H4","H5","H6"].includes(target.tagName)) type = "title";
        else if (target.tagName === "P") type = "description";
        else if (["A","BUTTON"].includes(target.tagName)) type = "button";
        else if (target.tagName === "IMG") type = "image";
        else if (target.classList.contains("card") || target.classList.contains("feature-card") || target.classList.contains("person-card")) type = "card";
        else if (["SECTION","MAIN"].includes(target.tagName)) type = "section";

        const label = target.dataset.editorLabel || (
          type === "header" ? "Header" :
          type === "footer" ? "Footer" :
          type === "section" ? "Section" :
          type === "title" ? "Title" :
          type === "description" ? "Description" :
          type === "button" ? "Button" :
          type === "image" ? "Image" :
          type === "card" ? "Card" :
          "Element"
        );

        window.parent.postMessage({
          type: "ec-element-selected",
          data: {
            path,
            type,
            label,
            text: target.innerText || "",
            href: target.getAttribute("href") || "",
            src: target.getAttribute("src") || "",
            alt: target.getAttribute("alt") || ""
          }
        }, "*");
      }, true);

      document.addEventListener("click", function(e) {
        if (document.body.classList.contains("ec-editing")) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        // Handle mobile menu toggle
        const toggle = e.target.closest(".ec-mobile-menu-toggle");
        if (toggle) {
          e.preventDefault();
          e.stopPropagation();
          document.body.classList.toggle("ec-mobile-drawer-open");
          return;
        }

        // Handle mobile menu close via overlay or close button
        const closeBtn = e.target.closest(".ec-mobile-drawer-close");
        const overlay = e.target.closest(".ec-mobile-overlay");
        if (closeBtn || overlay) {
          e.preventDefault();
          e.stopPropagation();
          document.body.classList.remove("ec-mobile-drawer-open");
          return;
        }

        const anchor = e.target.closest("a");
        if (anchor) {
          const href = anchor.getAttribute("href");
          if (href && !href.startsWith("http") && !href.startsWith("#") && !href.startsWith("mailto:") && !href.startsWith("tel:")) {
            e.preventDefault();
            e.stopPropagation();
            window.parent.postMessage({
              type: "ec-navigate",
              href: href
            }, "*");
            return;
          }
        }
      }, true);

      // Mobile/Tablet drag-to-scroll logic
      let isDragging = false;
      let startY = 0;
      let scrollTop = 0;

      document.addEventListener("mousedown", (e) => {
        if (document.body.classList.contains("ec-editing")) return;
        if (window.innerWidth > 1024) return;
        
        isDragging = true;
        startY = e.pageY - window.scrollY;
        scrollTop = window.scrollY;
        document.body.style.cursor = "grabbing";
      });

      document.addEventListener("mouseleave", () => {
        isDragging = false;
        document.body.style.cursor = "";
      });

      document.addEventListener("mouseup", () => {
        isDragging = false;
        document.body.style.cursor = "";
      });

      document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        if (document.body.classList.contains("ec-editing")) {
          isDragging = false;
          document.body.style.cursor = "";
          return;
        }
        e.preventDefault();
        const y = e.pageY - window.scrollY;
        const walk = (y - startY) * 1.5;
        window.scrollTo(0, scrollTop - walk);
      });
    })();
  `;

  // Listener to capture frame select messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "ec-element-selected") {
        onElementSelect(event.data.data);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onElementSelect]);

  // Sync edit mode to preview iframe
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc && doc.body) {
      doc.body.classList.toggle("ec-editing", editorMode);
      if (!editorMode) {
        // Clear outline styles if editor mode turned off
        const els = doc.querySelectorAll<HTMLElement>("*");
        els.forEach((el) => {
          el.style.outline = "";
          el.style.outlineOffset = "";
        });
      }
    }
  }, [editorMode, html]);

  // Inject tracking script once the frame is loaded
  const handleLoad = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      // Create and inject the select handler script
      const scriptEl = doc.createElement("script");
      scriptEl.textContent = captureScript;
      doc.body.appendChild(scriptEl);
    }
  };

  return (
    <section className="preview-area">
      <div className={`device-frame ${deviceSize}`}>
        <div className="preview-shell">
          <iframe
            key={html.length + (editorMode ? 1 : 0)}
            ref={iframeRef}
            srcDoc={html}
            className="preview-frame"
            title="Ecclesia Theme Customizer Preview"
            onLoad={handleLoad}
          />
        </div>
      </div>
    </section>
  );
};
