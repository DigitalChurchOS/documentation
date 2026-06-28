(function () {
  // Product Database
  const PRODUCTS = {
    p1: {
      id: "p1",
      category: "Apparel",
      price: 25.00,
      title: "Kingdom Culture Tee",
      desc: "Premium heavyweight cotton t-shirt featuring our signature minimalist logo. Pre-shrunk and built to last.",
      img: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&h=800&q=85",
      sizes: ["S", "M", "L", "XL"],
      colors: [
        { name: "Charcoal Black", hex: "#111827" },
        { name: "Classic White", hex: "#f3f4f6" },
        { name: "Navy Blue", hex: "#1e3a8a" }
      ],
      gallery: [
        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&h=800&q=85",
        "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&h=800&q=85"
      ]
    },
    p2: {
      id: "p2",
      category: "Books",
      price: 15.00,
      title: "The Power of Grace",
      desc: "A study on living under the abundance of God's grace and favor by Lead Pastor Daniel Grace.",
      img: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&h=800&q=85",
      sizes: [],
      colors: [],
      gallery: [
        "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&h=800&q=85"
      ]
    },
    p3: {
      id: "p3",
      category: "Music",
      price: 9.99,
      title: "Grace Worship EP",
      desc: "6 live-recorded worship tracks by Grace City Worship. Featuring 'Welcome Home' and 'River of Grace'.",
      img: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&h=800&q=85",
      sizes: [],
      colors: [],
      gallery: [
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&h=800&q=85"
      ]
    },
    p4: {
      id: "p4",
      category: "Resources",
      price: 5.00,
      title: "Small Group Study Guide",
      desc: "Weekly scripture readings, outlines, and discussion questions for home cells and small group leaders.",
      img: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&h=800&q=85",
      sizes: [],
      colors: [],
      gallery: [
        "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&h=800&q=85"
      ]
    },
    p5: {
      id: "p5",
      category: "Resources",
      price: 12.50,
      title: "Volunteer Ministry Handbook",
      desc: "Essential guidelines, culture outlines, and safety policies for serving teams and coordinators.",
      img: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&h=800&q=85",
      sizes: [],
      colors: [],
      gallery: [
        "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&h=800&q=85"
      ]
    },
    p6: {
      id: "p6",
      category: "Apparel",
      price: 45.00,
      title: "Kingdom Culture Hoodie",
      desc: "Ultra-soft heavy fleece hoodie with premium embroidery on chest. Perfect for cooler weather.",
      img: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&h=800&q=85",
      sizes: ["S", "M", "L", "XL"],
      colors: [
        { name: "Charcoal Black", hex: "#111827" },
        { name: "Heather Grey", hex: "#9ca3af" }
      ],
      gallery: [
        "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&h=800&q=85"
      ]
    }
  };

  // State Management
  let cart = [];
  try {
    cart = JSON.parse(localStorage.getItem("church_store_cart") || "[]");
  } catch (e) {
    cart = [];
  }

  // Initialize Elements & Event Listeners
  function initStore() {
    setupCartUI();
    
    // Check if on Product Detail page or Archive catalog page
    if (document.getElementById("productTitle")) {
      initDetailPage();
    } else if (document.getElementById("productGrid")) {
      initArchivePage();
    }
    
    // Setup Lucide icons if loaded
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // CART STATE & UI METHODS
  function setupCartUI() {
    const backdrop = document.getElementById("cartBackdrop");
    const drawer = document.getElementById("cartDrawer");
    const closeBtn = document.getElementById("cartCloseBtn");
    const toggleBtn = document.getElementById("cartToggleBtn");

    if (toggleBtn && drawer && backdrop) {
      toggleBtn.addEventListener("click", () => openCart());
    }
    if (closeBtn && drawer && backdrop) {
      closeBtn.addEventListener("click", () => closeCart());
      backdrop.addEventListener("click", () => closeCart());
    }

    // Checkout Form
    const checkoutBtn = document.getElementById("checkoutBtn");

    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => {
        closeCart();
        if (window.navigateToPage) {
          window.navigateToPage("checkout.html");
        } else {
          window.location.href = "checkout.html";
        }
      });
    }

    renderCartItems();
  }

  function openCart() {
    const backdrop = document.getElementById("cartBackdrop");
    const drawer = document.getElementById("cartDrawer");
    if (backdrop && drawer) {
      backdrop.classList.add("open");
      drawer.classList.add("open");
    }
  }

  function closeCart() {
    const backdrop = document.getElementById("cartBackdrop");
    const drawer = document.getElementById("cartDrawer");
    if (backdrop && drawer) {
      backdrop.classList.remove("open");
      drawer.classList.remove("open");
    }
  }

  function saveCart() {
    localStorage.setItem("church_store_cart", JSON.stringify(cart));
    renderCartItems();
  }

  function clearCart() {
    cart = [];
    saveCart();
  }

  function addToCart(id, title, price, img, quantity = 1, size = "", color = "") {
    const existing = cart.find(item => item.id === id && item.size === size && item.color === color);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ id, title, price: parseFloat(price), img, quantity, size, color });
    }
    saveCart();
    openCart();
  }

  function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
  }

  function updateCartItemQty(index, qty) {
    if (qty <= 0) {
      removeFromCart(index);
    } else {
      cart[index].quantity = qty;
      saveCart();
    }
  }

  function renderCartItems() {
    const container = document.getElementById("cartItemsContainer");
    const countBadge = document.getElementById("cartCountBadge");
    const emptyState = document.getElementById("cartEmptyState");
    const footer = document.getElementById("cartFooter");
    const subtotalText = document.getElementById("cartSubtotal");
    const totalText = document.getElementById("cartTotal");

    if (!container) return;

    // Calculate totals
    let totalItems = 0;
    let subtotal = 0;

    // Clear previous items
    const itemElements = container.querySelectorAll(".cart-drawer-item");
    itemElements.forEach(el => el.remove());

    if (cart.length === 0) {
      if (emptyState) emptyState.style.display = "flex";
      if (footer) footer.style.display = "none";
      if (countBadge) countBadge.textContent = "0";
      return;
    }

    if (emptyState) emptyState.style.display = "none";
    if (footer) footer.style.display = "flex";

    cart.forEach((item, index) => {
      totalItems += item.quantity;
      subtotal += item.price * item.quantity;

      const itemEl = document.createElement("div");
      itemEl.className = "cart-drawer-item";
      itemEl.innerHTML = `
        <img class="cart-drawer-item-img" src="${item.img}" alt="${item.title}">
        <div class="cart-drawer-item-details">
          <h4 class="cart-drawer-item-title">${item.title}</h4>
          <span class="cart-drawer-item-meta">
            ${item.size ? `Size: ${item.size}` : ""} ${item.color ? `· Color: ${item.color}` : ""}
          </span>
          <div style="display:flex; align-items:center; gap:10px; margin-top:6px;">
            <div class="qty-counter" style="scale: 0.8; transform-origin: left center;">
              <button class="qty-btn minus-btn"><i data-lucide="minus" style="width:14px; height:14px;"></i></button>
              <input type="text" class="qty-input" value="${item.quantity}" readonly style="width:30px;">
              <button class="qty-btn plus-btn"><i data-lucide="plus" style="width:14px; height:14px;"></i></button>
            </div>
            <span class="cart-drawer-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        </div>
        <button class="cart-drawer-item-remove"><i data-lucide="trash-2" style="width:16px; height:16px;"></i></button>
      `;

      // Event Listeners for quantity adjustments
      itemEl.querySelector(".minus-btn").addEventListener("click", () => {
        updateCartItemQty(index, item.quantity - 1);
      });
      itemEl.querySelector(".plus-btn").addEventListener("click", () => {
        updateCartItemQty(index, item.quantity + 1);
      });
      itemEl.querySelector(".cart-drawer-item-remove").addEventListener("click", () => {
        removeFromCart(index);
      });

      container.appendChild(itemEl);
    });

    if (countBadge) countBadge.textContent = totalItems.toString();
    if (subtotalText) subtotalText.textContent = `$${subtotal.toFixed(2)}`;
    if (totalText) totalText.textContent = `$${subtotal.toFixed(2)}`;

    if (window.lucide) {
      window.lucide.createIcons({
        nodeList: container.querySelectorAll('[data-lucide]')
      });
    }
  }

  // ARCHIVE / CATALOG PAGE METHODS
  function initArchivePage() {
    const grid = document.getElementById("productGrid");
    const cards = Array.from(grid.querySelectorAll(".product-card"));
    const searchInput = document.getElementById("searchInput");
    const categoryFilter = document.getElementById("categoryFilter");
    const sortFilter = document.getElementById("sortFilter");
    const clearBtn = document.getElementById("clearFilters");
    const categoryTabs = document.querySelectorAll(".category-tab");
    const resultCount = document.getElementById("resultCount");
    const emptyState = document.getElementById("emptyState");

    // Add to Cart buttons
    grid.addEventListener("click", (e) => {
      const btn = e.target.closest(".add-to-cart-btn");
      if (!btn) return;
      const id = btn.getAttribute("data-id");
      const title = btn.getAttribute("data-title");
      const price = btn.getAttribute("data-price");
      const img = btn.getAttribute("data-img");
      addToCart(id, title, price, img, 1);
    });

    // Filtering logic
    let activeCategory = "";

    function filterProducts() {
      const query = (searchInput?.value || "").toLowerCase().trim();
      const catSelectVal = categoryFilter?.value || "";
      const cat = activeCategory || catSelectVal;
      let visibleCount = 0;

      cards.forEach(card => {
        const title = (card.getAttribute("data-title") || "").toLowerCase();
        const category = card.getAttribute("data-category") || "";
        const tags = (card.getAttribute("data-tags") || "").toLowerCase();
        const matchesQuery = title.includes(query) || tags.includes(query);
        const matchesCategory = !cat || category === cat;

        if (matchesQuery && matchesCategory) {
          card.style.display = "flex";
          visibleCount++;
        } else {
          card.style.display = "none";
        }
      });

      // Update counters & empty states
      if (resultCount) {
        resultCount.textContent = `${visibleCount} item${visibleCount === 1 ? "" : "s"} found`;
      }
      if (emptyState) {
        emptyState.style.display = visibleCount === 0 ? "block" : "none";
      }

      sortProducts();
    }

    function sortProducts() {
      const sortBy = sortFilter?.value || "featured";
      const sortedCards = [...cards].filter(card => card.style.display !== "none");

      if (sortBy === "price-low") {
        sortedCards.sort((a, b) => parseFloat(a.getAttribute("data-price")) - parseFloat(b.getAttribute("data-price")));
      } else if (sortBy === "price-high") {
        sortedCards.sort((a, b) => parseFloat(b.getAttribute("data-price")) - parseFloat(a.getAttribute("data-price")));
      } else if (sortBy === "az") {
        sortedCards.sort((a, b) => a.getAttribute("data-title").localeCompare(b.getAttribute("data-title")));
      } else if (sortBy === "za") {
        sortedCards.sort((a, b) => b.getAttribute("data-title").localeCompare(a.getAttribute("data-title")));
      } else if (sortBy === "oldest") {
        sortedCards.sort((a, b) => {
          const idA = a.getAttribute("data-id") || "";
          const idB = b.getAttribute("data-id") || "";
          return idB.localeCompare(idA);
        });
      } else {
        // default/featured/newest
        sortedCards.sort((a, b) => {
          const idA = a.getAttribute("data-id") || "";
          const idB = b.getAttribute("data-id") || "";
          return idA.localeCompare(idB);
        });
      }

      // Re-append sorted cards in order
      sortedCards.forEach(card => grid.appendChild(card));
    }

    // Set up tabs click
    categoryTabs.forEach(tab => {
      tab.addEventListener("click", () => {
        categoryTabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        activeCategory = tab.getAttribute("data-category");

        if (categoryFilter) {
          categoryFilter.value = activeCategory;
        }
        filterProducts();
      });
    });

    if (categoryFilter) {
      categoryFilter.addEventListener("change", () => {
        const val = categoryFilter.value;
        activeCategory = val;
        categoryTabs.forEach(tab => {
          if (tab.getAttribute("data-category") === val) {
            tab.classList.add("active");
          } else {
            tab.classList.remove("active");
          }
        });
        filterProducts();
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", filterProducts);
    }
    if (sortFilter) {
      sortFilter.addEventListener("change", sortProducts);
    }

    // View mode toggle (grid/list)
    document.querySelectorAll('[name="view"]').forEach(r => {
      r.addEventListener('change', () => {
        grid.classList.toggle('list', r.value === 'list');
      });
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        if (categoryFilter) categoryFilter.value = "";
        if (sortFilter) sortFilter.value = "featured";
        activeCategory = "";
        categoryTabs.forEach((tab, index) => {
          if (index === 0) tab.classList.add("active");
          else tab.classList.remove("active");
        });
        const gridViewRadio = document.querySelector('[name="view"][value="grid"]');
        if (gridViewRadio) gridViewRadio.checked = true;
        grid.classList.remove('list');
        filterProducts();
      });
    }
  }

  // PRODUCT DETAIL PAGE METHODS
  function initDetailPage() {
    // 1. Resolve Product ID from query parameters
    const params = new URLSearchParams(window.location.search);
    const prodId = params.get("id") || "p1";
    const product = PRODUCTS[prodId] || PRODUCTS.p1;

    // 2. Hydrate UI elements
    const catEl = document.getElementById("productCategory");
    const titleEl = document.getElementById("productTitle");
    const priceEl = document.getElementById("productPrice");
    const descEl = document.getElementById("productDesc");
    const mainImgEl = document.getElementById("mainProductImg");
    const thumbContainer = document.getElementById("thumbGallery");
    const sizeGroup = document.getElementById("sizeGroup");
    const colorGroup = document.getElementById("colorGroup");

    if (catEl) catEl.textContent = product.category;
    if (titleEl) titleEl.textContent = product.title;
    if (priceEl) priceEl.textContent = `$${product.price.toFixed(2)}`;
    if (descEl) descEl.textContent = product.desc;
    if (mainImgEl) {
      mainImgEl.src = product.img;
      mainImgEl.alt = product.title;
    }

    // 3. Hydrate thumbnails
    if (thumbContainer && product.gallery && product.gallery.length > 0) {
      thumbContainer.innerHTML = "";
      product.gallery.forEach((imgSrc, idx) => {
        const btn = document.createElement("button");
        btn.className = `gallery-thumb ${idx === 0 ? "active" : ""}`;
        btn.innerHTML = `<img src="${imgSrc}" alt="Thumb">`;
        btn.addEventListener("click", () => {
          thumbContainer.querySelectorAll(".gallery-thumb").forEach(t => t.classList.remove("active"));
          btn.classList.add("active");
          if (mainImgEl) mainImgEl.src = imgSrc;
        });
        thumbContainer.appendChild(btn);
      });
    }

    // 4. Hydrate sizes
    const sizeSelector = document.getElementById("sizeSelector");
    let selectedSize = "";
    if (product.sizes && product.sizes.length > 0) {
      if (sizeGroup) sizeGroup.style.display = "flex";
      if (sizeSelector) {
        sizeSelector.innerHTML = "";
        product.sizes.forEach((size, idx) => {
          const btn = document.createElement("button");
          btn.className = `size-btn ${idx === 0 ? "active" : ""}`;
          btn.textContent = size;
          if (idx === 0) selectedSize = size;

          btn.addEventListener("click", () => {
            sizeSelector.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            selectedSize = size;
          });
          sizeSelector.appendChild(btn);
        });
      }
    } else {
      if (sizeGroup) sizeGroup.style.display = "none";
    }

    // 5. Hydrate colors
    const colorSelector = document.getElementById("colorSelector");
    let selectedColor = "";
    if (product.colors && product.colors.length > 0) {
      if (colorGroup) colorGroup.style.display = "flex";
      if (colorSelector) {
        colorSelector.innerHTML = "";
        product.colors.forEach((color, idx) => {
          const dot = document.createElement("span");
          dot.className = `color-dot ${idx === 0 ? "active" : ""}`;
          dot.style.backgroundColor = color.hex;
          dot.setAttribute("data-color", color.name);
          if (idx === 0) selectedColor = color.name;

          dot.addEventListener("click", () => {
            colorSelector.querySelectorAll(".color-dot").forEach(d => d.classList.remove("active"));
            dot.classList.add("active");
            selectedColor = color.name;
          });
          colorSelector.appendChild(dot);
        });
      }
    } else {
      if (colorGroup) colorGroup.style.display = "none";
    }

    // 6. Quantity Adjustments
    const qtyInput = document.getElementById("qtyInput");
    const qtyMinus = document.getElementById("qtyMinus");
    const qtyPlus = document.getElementById("qtyPlus");

    if (qtyMinus && qtyInput) {
      qtyMinus.addEventListener("click", () => {
        let val = parseInt(qtyInput.value) || 1;
        if (val > 1) {
          qtyInput.value = (val - 1).toString();
        }
      });
    }

    if (qtyPlus && qtyInput) {
      qtyPlus.addEventListener("click", () => {
        let val = parseInt(qtyInput.value) || 1;
        qtyInput.value = (val + 1).toString();
      });
    }

    // 7. Add to Cart action
    const addToCartBtn = document.getElementById("detailAddToCartBtn");
    if (addToCartBtn) {
      addToCartBtn.addEventListener("click", () => {
        const qty = parseInt(qtyInput?.value || "1") || 1;
        addToCart(
          product.id,
          product.title,
          product.price,
          product.img,
          qty,
          selectedSize,
          selectedColor
        );
      });
    }
  }

  // Trigger init on DOM Content Load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initStore);
  } else {
    initStore();
  }

  // Hook for custom PJAX page transitions (if present in customizer env)
  window.addEventListener("pjax:complete", () => {
    initStore();
  });
})();
