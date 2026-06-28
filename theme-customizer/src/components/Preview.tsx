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
  isDragging: boolean;
  dragData: { blockType: string; category: string; html: string } | null;
}

export const Preview: React.FC<PreviewProps> = ({
  html,
  deviceSize,
  editorMode,
  onElementSelect,
  isDragging,
  dragData,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Injected selection capture script
  const captureScript = `
    (function() {
      // Check if there is a newly added block that we should focus
      const justAdded = document.querySelector("[data-ec-just-added='true']");
      if (justAdded) {
        justAdded.removeAttribute("data-ec-just-added");

        setTimeout(() => {
          justAdded.scrollIntoView({ behavior: "smooth", block: "center" });

          // Flash outline effect
          const originalOutline = justAdded.style.outline;
          const originalOutlineOffset = justAdded.style.outlineOffset;
          
          justAdded.style.outline = "4px dashed #3b82f6";
          justAdded.style.outlineOffset = "4px";
          setTimeout(() => {
            justAdded.style.outline = "4px solid #3b82f6";
            justAdded.style.outlineOffset = "4px";
            setTimeout(() => {
              justAdded.style.outline = originalOutline;
              justAdded.style.outlineOffset = originalOutlineOffset;
            }, 1000);
          }, 600);

          // Auto-trigger selection for the parent customizer inspector
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
          })(justAdded);

          let type = "element";
          if (justAdded.dataset.editorType) type = justAdded.dataset.editorType;
          else if (justAdded.tagName === "HEADER") type = "header";
          else if (justAdded.tagName === "FOOTER") type = "footer";
          else if (["H1","H2","H3","H4","H5","H6"].includes(justAdded.tagName)) type = "title";
          else if (justAdded.tagName === "P") type = "description";
          else if (["A","BUTTON"].includes(justAdded.tagName)) type = "button";
          else if (justAdded.tagName === "IMG") type = "image";
          else if (justAdded.classList.contains("card") || justAdded.classList.contains("feature-card") || justAdded.classList.contains("person-card")) type = "card";
          else if (["SECTION","MAIN"].includes(justAdded.tagName)) type = "section";

          const label = justAdded.dataset.editorLabel || (
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
              text: justAdded.innerText || "",
              href: justAdded.getAttribute("href") || "",
              src: justAdded.getAttribute("src") || "",
              alt: justAdded.getAttribute("alt") || ""
            }
          }, "*");
        }, 150);
      }

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

      // Drag & Drop State
      let dragCategory = "";
      let lastDropTarget = null;
      let lastDropPosition = "";
      let dropIndicator = null;

      // Custom message listener for parent drag signals and overlay coordination
      window.addEventListener("message", function(e) {
        if (e.data && e.data.type === "ec-drag-start") {
          dragCategory = e.data.category;
          document.body.classList.add("ec-dragging");
        } else if (e.data && e.data.type === "ec-drag-end") {
          dragCategory = "";
          document.body.classList.remove("ec-dragging");
          hideDropIndicator();
        }
        else if (e.data && e.data.type === "ec-drag-hover") {
          const { x, y, category } = e.data;
          document.body.classList.add("ec-dragging");

          const target = document.elementFromPoint(x, y);
          if (!target) { hideDropIndicator(); return; }

          if (category === "section") {
            let container = target.closest("header, section, footer, [data-editor-type='header'], [data-editor-type='section'], [data-editor-type='footer']");
            if (!container) {
              container = document.body.querySelector("footer, section, header") || document.body.firstElementChild;
            }
            if (container) {
              const rect = container.getBoundingClientRect();
              const relY = y - rect.top;
              const position = relY < rect.height / 2 ? "before" : "after";
              lastDropTarget = container;
              lastDropPosition = position;
              showDropIndicator(container, position);
            } else {
              hideDropIndicator();
            }
          } else if (category === "element") {
            let element = target.closest("[data-editor-type], h1, h2, h3, h4, h5, p, button, a, img, .card, .feature-card, .person-card, details, summary");
            if (!element) {
              element = target.closest("section, header, footer, [data-editor-type='header'], [data-editor-type='section'], [data-editor-type='footer']");
            }
            if (element) {
              const tag = element.tagName.toLowerCase();
              if (["section", "header", "footer"].includes(tag)) {
                lastDropTarget = element;
                lastDropPosition = "inside";
                showDropIndicator(element, "before");
              } else {
                const rect = element.getBoundingClientRect();
                const relY = y - rect.top;
                const position = relY < rect.height / 2 ? "before" : "after";
                lastDropTarget = element;
                lastDropPosition = position;
                showDropIndicator(element, position);
              }
            } else {
              hideDropIndicator();
            }
          }
        }
        else if (e.data && e.data.type === "ec-drag-leave") {
          hideDropIndicator();
        }
        else if (e.data && e.data.type === "ec-finalize-drop") {
          if (!lastDropTarget) return;

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
          })(lastDropTarget);

          const blockData = e.data.dragData;

          window.parent.postMessage({
            type: "ec-block-dropped",
            data: {
              targetPath: path,
              position: lastDropPosition,
              blockType: blockData.blockType,
              html: blockData.html,
              category: blockData.category
            }
          }, "*");

          hideDropIndicator();
          document.body.classList.remove("ec-dragging");
          lastDropTarget = null;
          lastDropPosition = "";
        }
      });

      function showDropIndicator(targetEl, position) {
        if (!dropIndicator) {
          dropIndicator = document.createElement("div");
          dropIndicator.className = "ec-drop-indicator";
          dropIndicator.style.position = "absolute";
          dropIndicator.style.height = "5px";
          dropIndicator.style.background = "#3b82f6";
          dropIndicator.style.boxShadow = "0 0 10px rgba(59, 130, 246, 0.8)";
          dropIndicator.style.zIndex = "999999";
          dropIndicator.style.pointerEvents = "none";
          dropIndicator.style.borderRadius = "3px";
          dropIndicator.style.transition = "all 0.08s ease";
          document.body.appendChild(dropIndicator);
        }

        const rect = targetEl.getBoundingClientRect();
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;

        dropIndicator.style.width = rect.width + "px";
        dropIndicator.style.left = (rect.left + scrollX) + "px";

        if (position === "before") {
          dropIndicator.style.top = (rect.top + scrollY - 2.5) + "px";
        } else {
          dropIndicator.style.top = (rect.bottom + scrollY - 2.5) + "px";
        }
        dropIndicator.style.display = "block";
      }

      function hideDropIndicator() {
        if (dropIndicator) {
          dropIndicator.style.display = "none";
        }
      }

      document.body.classList.toggle("ec-editing", ${editorMode});

      document.addEventListener("pointerdown", function(e) {
        if (!document.body.classList.contains("ec-editing")) return;

        // Handle mobile menu toggle bypass in editing mode
        const toggle = e.target.closest(".mobile-menu-btn");
        if (toggle) {
          const drawer = document.querySelector(".mobile-drawer");
          if (drawer) drawer.classList.toggle("open");
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        // Prevent click actions
        e.preventDefault();
        e.stopPropagation();

        let target = e.target;
        
        // Target resolving helper
        const header = target.closest("header,[data-editor-type='header']");
        const footer = target.closest("footer,[data-editor-type='footer']");
        const rail = target.closest(".left-rail, .right-rail, .rail-menu-horizontal");

        if (header) {
          const child = target.closest(".ec-mobile-menu-toggle,a,button,img,h1,h2,h3,h4,p,[data-editor-type='title'],[data-editor-type='button'],[data-editor-type='image'],[data-editor-type='description']");
          if (child && child !== header) target = child;
          else target = header;
        } else if (footer) {
          const child = target.closest("a,button,img,h1,h2,h3,h4,p,[data-editor-type='title'],[data-editor-type='button'],[data-editor-type='image'],[data-editor-type='description']");
          if (child && child !== footer) target = child;
          else target = footer;
        } else if (rail) {
          target = rail;
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
        else if (target.classList.contains("left-rail") || target.classList.contains("right-rail") || target.classList.contains("rail-menu-horizontal") || target.classList.contains("rail-nav") || target.closest(".left-rail, .right-rail, .rail-menu-horizontal, .rail-nav")) type = "rail";
        else if (["H1","H2","H3","H4","H5","H6"].includes(target.tagName)) type = "title";
        else if (target.tagName === "P") type = "description";
        else if (["A","BUTTON"].includes(target.tagName)) type = "button";
        else if (target.tagName === "IMG") type = "image";
        else if (target.classList.contains("card") || target.classList.contains("feature-card") || target.classList.contains("person-card")) type = "card";
        else if (["SECTION","MAIN"].includes(target.tagName)) type = "section";

        const label = target.dataset.editorLabel || (
          type === "header" ? "Header" :
          type === "footer" ? "Footer" :
          type === "rail" ? "Rail Navigation" :
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
          // Allow native menu toggles to work
          const toggle = e.target.closest(".mobile-menu-btn");
          if (toggle) {
            const drawer = document.querySelector(".mobile-drawer");
            if (drawer) drawer.classList.toggle("open");
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          
          e.preventDefault();
          e.stopPropagation();
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
      doc.body.setAttribute("data-in-customizer", "true");
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
      if (doc.body) {
        doc.body.setAttribute("data-in-customizer", "true");
      }
      // Create and inject the select handler script
      const scriptEl = doc.createElement("script");
      scriptEl.textContent = captureScript;
      doc.body.appendChild(scriptEl);
    }
  };

  return (
    <section className="preview-area">
      <div className={`device-frame ${deviceSize}`}>
        <div className="preview-shell" style={{ position: 'relative' }}>
          <iframe
            key={html.length + (editorMode ? 1 : 0)}
            ref={iframeRef}
            srcDoc={html}
            className="preview-frame"
            title="Ecclesia Theme Customizer Preview"
            onLoad={handleLoad}
          />
          {isDragging && (
            <div
              className="drag-overlay"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 10,
                cursor: 'copy',
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';

                // Calculate position relative to the iframe
                const iframe = iframeRef.current;
                if (!iframe) return;
                const iframeRect = iframe.getBoundingClientRect();
                const x = e.clientX - iframeRect.left;
                const y = e.clientY - iframeRect.top;

                // Send coordinates to iframe for indicator display
                iframe.contentWindow?.postMessage({
                  type: 'ec-drag-hover',
                  x,
                  y,
                  category: dragData?.category || 'section'
                }, '*');
              }}
              onDragLeave={(e) => {
                // Only hide if truly leaving the overlay
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  const iframe = iframeRef.current;
                  iframe?.contentWindow?.postMessage({ type: 'ec-drag-leave' }, '*');
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                const iframe = iframeRef.current;
                iframe?.contentWindow?.postMessage({
                  type: 'ec-finalize-drop',
                  dragData
                }, '*');
              }}
            />
          )}
        </div>
      </div>
    </section>
  );
};
