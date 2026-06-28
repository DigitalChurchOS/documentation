/**
 * checkout.js — ChurchOS Ecclesia Theme Checkout Module
 * Handles: cart rendering (desktop & mobile), payment gateway selection, WhatsApp orders, and simulated payments.
 */
(function () {
  'use strict';

  // ── Configuration ──────────────────────────────────────
  const WHATSAPP_NUMBER = '+256783335335';
  const CHURCH_NAME = 'Grace City Church';
  const TAX_RATE = 0.08; // 8% tax
  const ORDER_PREFIX = 'GC';

  // ── Payment Gateways ──────────────────────────────────
  const PAYMENT_GATEWAYS = [
    {
      id: 'whatsapp',
      name: 'WhatsApp Order',
      desc: 'Send your order via WhatsApp message',
      icon: 'message-circle',
      active: true,
      badge: 'Active',
      color: '#25D366'
    },
    {
      id: 'stripe',
      name: 'Stripe',
      desc: 'Credit/Debit card via Stripe',
      icon: 'credit-card',
      active: false,
      badge: 'Coming Soon',
      color: '#635BFF'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      desc: 'Pay securely with PayPal',
      icon: 'wallet',
      active: false,
      badge: 'Coming Soon',
      color: '#003087'
    },
    {
      id: 'flutterwave',
      name: 'Flutterwave',
      desc: 'Mobile money & cards (Africa)',
      icon: 'zap',
      active: false,
      badge: 'Coming Soon',
      color: '#F5A623'
    },
    {
      id: 'yo-payments',
      name: 'Yo-Payments',
      desc: 'Mobile money (Uganda)',
      icon: 'smartphone',
      active: false,
      badge: 'Coming Soon',
      color: '#E53935'
    },
    {
      id: 'pesapal',
      name: 'Pesapal',
      desc: 'Mobile money & cards (East Africa)',
      icon: 'globe',
      active: false,
      badge: 'Coming Soon',
      color: '#00AEEF'
    },
    {
      id: 'google-pay',
      name: 'Google Pay',
      desc: 'Fast checkout with Google Pay',
      icon: 'smartphone',
      active: false,
      badge: 'Coming Soon',
      color: '#4285F4'
    },
    {
      id: 'apple-pay',
      name: 'Apple Pay',
      desc: 'Secure payment with Apple Pay',
      icon: 'smartphone',
      active: false,
      badge: 'Coming Soon',
      color: '#000000'
    }
  ];

  // ── Multi-Step Checkout State ──────────────────────────
  let currentStep = 1;

  // ── Cart State ─────────────────────────────────────────
  function getCart() {
    try {
      return JSON.parse(localStorage.getItem('church_store_cart') || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem('church_store_cart', JSON.stringify(cart));
  }

  function clearCart() {
    localStorage.removeItem('church_store_cart');
  }

  function generateOrderId() {
    const num = Math.floor(100000 + Math.random() * 900000);
    return `${ORDER_PREFIX}-${num}`;
  }

  function calcSubtotal(cart) {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  function calcTax(subtotal) {
    return subtotal * TAX_RATE;
  }

  function getShippingCost() {
    const radio = document.querySelector('input[name="shipping"]:checked');
    return radio && radio.value === 'express' ? 9.99 : 0;
  }

  // ── Multi-Step Checkout Navigation ─────────────────────
  function validateStep1() {
    const email = document.getElementById('co-email')?.value?.trim();
    const phone = document.getElementById('co-phone')?.value?.trim();
    const fname = document.getElementById('co-fname')?.value?.trim();
    const lname = document.getElementById('co-lname')?.value?.trim();
    const addr1 = document.getElementById('co-addr1')?.value?.trim();
    const city = document.getElementById('co-city')?.value?.trim();
    const state = document.getElementById('co-state')?.value?.trim();
    const zip = document.getElementById('co-zip')?.value?.trim();

    if (!email || !phone || !fname || !lname || !addr1 || !city || !state || !zip) {
      showAlert('error', 'Please fill in all required fields in Contact Information and Shipping Address.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert('error', 'Please enter a valid email address.');
      return false;
    }

    // Clear alert when validation succeeds
    document.querySelectorAll('.co-alert').forEach(a => a.classList.remove('visible'));
    return true;
  }

  function goToStep(stepNum) {
    if (stepNum === 2 && !validateStep1()) {
      return;
    }
    if (stepNum === 3) {
      if (currentStep === 1 && !validateStep1()) {
        return;
      }
      // Validate Step 2: if pickup is chosen, require a campus selection
      const shippingMethod = document.querySelector('input[name="shipping"]:checked')?.value;
      if (shippingMethod === 'pickup') {
        const campusSelect = document.getElementById('co-pickup-campus');
        if (!campusSelect || !campusSelect.value) {
          showAlert('error', 'Please select a pickup campus location.');
          return;
        }
      }
    }

    currentStep = stepNum;

    // Toggle visibility of step containers
    document.querySelectorAll('.checkout-step-container').forEach((container) => {
      const stepId = parseInt(container.getAttribute('id')?.replace('step-', '') || '0');
      if (stepId === stepNum) {
        container.style.display = 'block';
        container.classList.add('active');
      } else {
        container.style.display = 'none';
        container.classList.remove('active');
      }
    });

    // Update breadcrumbs
    const breadcrumb = document.querySelector('.checkout-breadcrumb');
    if (breadcrumb) {
      const crumbSteps = breadcrumb.querySelectorAll('.crumb-step');
      crumbSteps.forEach((span) => {
        const stepIndex = parseInt(span.getAttribute('data-step') || '0');
        span.className = 'crumb-step';
        if (stepIndex === stepNum) {
          span.classList.add('crumb-active');
        } else if (stepIndex < stepNum) {
          span.classList.add('clickable');
        }
      });
    }

    // Scroll to top of forms container smoothly
    const formsContainer = document.querySelector('.checkout-forms');
    if (formsContainer) {
      formsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Re-initialize dynamic Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // ── Cart Page Logic ─────────────────────────────────────
  function initCartPage() {
    const tableBody = document.getElementById('cartTableBody');
    const mobileItems = document.getElementById('cartMobileItems');
    const emptyState = document.getElementById('cartEmptyState');
    const layoutContainer = document.getElementById('cartPageLayout');
    const orderSummaryDiv = document.getElementById('orderSummary');

    if (!tableBody && !mobileItems) return;

    const cart = getCart();

    if (cart.length === 0) {
      if (layoutContainer) layoutContainer.style.display = 'none';
      if (emptyState) emptyState.style.display = 'flex';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (layoutContainer) layoutContainer.style.display = 'grid';

    // Clear contents
    if (tableBody) tableBody.innerHTML = '';
    if (mobileItems) mobileItems.innerHTML = '';

    cart.forEach((item, index) => {
      const lineTotal = (item.price * item.quantity).toFixed(2);
      const variant = [item.size ? `Size: ${item.size}` : '', item.color ? `Color: ${item.color}` : ''].filter(Boolean).join(' · ') || 'Standard';

      // Desktop table row
      if (tableBody) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <div class="cart-product">
              <img src="${item.img}" alt="${item.title}" class="cart-product-img">
              <div class="cart-product-info">
                <a href="store-single.html?id=${item.id}" class="cart-product-title">${item.title}</a>
                <span class="cart-product-variant">${variant}</span>
              </div>
            </div>
          </td>
          <td><span class="cart-unit-price">$${item.price.toFixed(2)}</span></td>
          <td>
            <div class="cart-qty" data-index="${index}">
              <button aria-label="Decrease quantity" class="qty-minus-btn"><i data-lucide="minus" style="width:14px;height:14px;"></i></button>
              <input type="number" class="cart-qty-value" value="${item.quantity}" min="1" max="99" aria-label="Quantity" readonly>
              <button aria-label="Increase quantity" class="qty-plus-btn"><i data-lucide="plus" style="width:14px;height:14px;"></i></button>
            </div>
          </td>
          <td><span class="cart-line-total">$${lineTotal}</span></td>
          <td><button class="cart-remove-btn" data-index="${index}" aria-label="Remove item"><i data-lucide="trash-2" style="width:18px;height:18px;"></i></button></td>
        `;
        tableBody.appendChild(tr);
      }

      // Mobile list card
      if (mobileItems) {
        const div = document.createElement('div');
        div.className = 'cart-mobile-item';
        div.innerHTML = `
          <img src="${item.img}" alt="${item.title}" class="cart-product-img">
          <div class="cart-mobile-details">
            <div class="cart-mobile-top">
              <div>
                <a href="store-single.html?id=${item.id}" class="cart-product-title">${item.title}</a>
                <span class="cart-product-variant">${variant}</span>
              </div>
              <button class="cart-remove-btn" data-index="${index}" aria-label="Remove item"><i data-lucide="trash-2" style="width:16px;height:16px;"></i></button>
            </div>
            <div class="cart-mobile-bottom">
              <div class="cart-qty" data-index="${index}">
                <button aria-label="Decrease" class="qty-minus-btn"><i data-lucide="minus" style="width:14px;height:14px;"></i></button>
                <input type="number" class="cart-qty-value" value="${item.quantity}" min="1" max="99" aria-label="Quantity" readonly>
                <button aria-label="Increase" class="qty-plus-btn"><i data-lucide="plus" style="width:14px;height:14px;"></i></button>
              </div>
              <span class="cart-line-total">$${lineTotal}</span>
            </div>
          </div>
        `;
        mobileItems.appendChild(div);
      }
    });

    // Event Delegation for Qty and Remove Buttons
    const handleQtyOrRemove = (e) => {
      const minus = e.target.closest('.qty-minus-btn');
      const plus = e.target.closest('.qty-plus-btn');
      const remove = e.target.closest('.cart-remove-btn');

      if (minus || plus) {
        const qtyContainer = e.target.closest('.cart-qty');
        const idx = parseInt(qtyContainer.getAttribute('data-index'));
        const currentCart = getCart();

        if (minus && currentCart[idx].quantity > 1) {
          currentCart[idx].quantity--;
        } else if (plus) {
          currentCart[idx].quantity++;
        }

        saveCart(currentCart);
        initCartPage();
        updateCartBadge();
      } else if (remove) {
        const idx = parseInt(remove.getAttribute('data-index'));
        const currentCart = getCart();
        currentCart.splice(idx, 1);

        saveCart(currentCart);
        initCartPage();
        updateCartBadge();
      }
    };

    if (tableBody) {
      tableBody.removeEventListener('click', handleQtyOrRemove);
      tableBody.addEventListener('click', handleQtyOrRemove);
    }
    if (mobileItems) {
      mobileItems.removeEventListener('click', handleQtyOrRemove);
      mobileItems.addEventListener('click', handleQtyOrRemove);
    }

    updateCartSummary(cart);
    updateCartBadge();

    if (window.lucide) {
      window.lucide.createIcons({
        nodeList: document.querySelectorAll('#cartTableBody [data-lucide], #cartMobileItems [data-lucide]')
      });
    }
  }

  function updateCartSummary(cart) {
    const subtotal = calcSubtotal(cart);
    const tax = calcTax(subtotal);
    const total = subtotal + tax;
    const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

    // Update summary rows in cart.html Order Summary Card
    const orderSummary = document.getElementById('orderSummary');
    if (!orderSummary) return;

    const rows = orderSummary.querySelectorAll('.summary-row');
    if (rows.length >= 3) {
      // Row 1: Subtotal
      const subtotalLabel = rows[0].querySelector('span:first-child');
      const subtotalVal = rows[0].querySelector('span:last-child');
      if (subtotalLabel) subtotalLabel.innerHTML = `Subtotal <span style="font-weight:600; color:var(--muted);">(${totalItems} items)</span>`;
      if (subtotalVal) subtotalVal.textContent = `$${subtotal.toFixed(2)}`;

      // Row 2: Shipping (usually static Free, but let's make sure it matches)
      // Row 3: Tax
      const taxVal = rows[2].querySelector('span:last-child');
      if (taxVal) taxVal.textContent = `$${tax.toFixed(2)}`;

      // Row 4: Total
      const totalRow = orderSummary.querySelector('.summary-total');
      if (totalRow) {
        const totalVal = totalRow.querySelector('span:last-child');
        if (totalVal) totalVal.textContent = `$${total.toFixed(2)}`;
      }
    }
  }

  function updateCartBadge() {
    const cart = getCart();
    const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
    const badges = document.querySelectorAll('#cartCountBadge');
    badges.forEach(b => b.textContent = totalItems.toString());
  }

  const CAMPUS_ADDRESSES = {
    main: '450 Mission Street, Downtown Area, Kampala',
    north: '120 Landmark Boulevard, Westhaven Sector, Kampala',
    south: '89 Pinecone Avenue, Oakridge Heights, Kampala',
    east: '210 Riverbend Road, Riverview Plaza, Kampala'
  };

  // ── Checkout Page Logic ────────────────────────────────
  function initCheckoutPage() {
    const paymentContainer = document.getElementById('paymentMethodContainer');
    const orderSummaryItems = document.getElementById('orderSummaryItems');
    if (!paymentContainer && !orderSummaryItems) return;

    const cart = getCart();

    // Redirect to store if cart empty
    if (cart.length === 0 && orderSummaryItems) {
      const msg = document.createElement('div');
      msg.style.cssText = 'text-align:center; padding:32px; color:var(--muted);';
      msg.innerHTML = '<p>Your cart is empty.</p><a href="store-archive.html" class="btn primary" style="margin-top:16px;">Browse Store</a>';
      orderSummaryItems.parentElement.insertBefore(msg, orderSummaryItems);
      orderSummaryItems.style.display = 'none';
    }

    // Render order summary items
    if (orderSummaryItems) {
      orderSummaryItems.innerHTML = '';
      cart.forEach(item => {
        const variant = [item.size ? `Size: ${item.size}` : '', item.color ? item.color : ''].filter(Boolean).join(' · ') || 'Standard';
        const div = document.createElement('div');
        div.className = 'summary-item';
        div.innerHTML = `
          <div class="summary-item-thumb-wrap">
            <img class="summary-item-thumb" src="${item.img}" alt="${item.title}">
            <span class="summary-item-qty">${item.quantity}</span>
          </div>
          <div class="summary-item-details">
            <div class="summary-item-title">${item.title}</div>
            <div class="summary-item-variant">${variant}</div>
          </div>
          <span class="summary-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
        `;
        orderSummaryItems.appendChild(div);
      });
    }

    // Render payment gateways
    if (paymentContainer) {
      renderPaymentGateways(paymentContainer);
    }

    // Update totals
    updateCheckoutTotals(cart);

    // Initialize step navigation to Step 1
    goToStep(1);

    // Campus selection change listener to show address
    const campusSelect = document.getElementById('co-pickup-campus');
    const campusAddressDiv = document.getElementById('pickupCampusAddress');
    if (campusSelect && campusAddressDiv) {
      campusSelect.addEventListener('change', () => {
        const selectedValue = campusSelect.value;
        const address = CAMPUS_ADDRESSES[selectedValue] || '';
        if (address) {
          campusAddressDiv.innerHTML = `<strong>Pickup Address:</strong><br>${address}`;
          campusAddressDiv.style.display = 'block';
        } else {
          campusAddressDiv.style.display = 'none';
        }
      });
    }

    // Bind step navigation buttons
    const nextToShippingBtn = document.getElementById('nextToShippingBtn');
    if (nextToShippingBtn) {
      nextToShippingBtn.addEventListener('click', () => {
        goToStep(2);
      });
    }

    const nextToPaymentBtn = document.getElementById('nextToPaymentBtn');
    if (nextToPaymentBtn) {
      nextToPaymentBtn.addEventListener('click', () => {
        goToStep(3);
      });
    }

    const backToInfoBtn = document.getElementById('backToInfoBtn');
    if (backToInfoBtn) {
      backToInfoBtn.addEventListener('click', () => {
        goToStep(1);
      });
    }

    const backToShippingBtn = document.getElementById('backToShippingBtn');
    if (backToShippingBtn) {
      backToShippingBtn.addEventListener('click', () => {
        goToStep(2);
      });
    }

    // Bind breadcrumb step clicks
    document.querySelectorAll('.checkout-breadcrumb .crumb-step').forEach(crumb => {
      crumb.addEventListener('click', () => {
        const stepNum = parseInt(crumb.getAttribute('data-step') || '1');
        if (stepNum < currentStep) {
          goToStep(stepNum);
        } else if (stepNum > currentStep) {
          if (stepNum === 2 && validateStep1()) {
            goToStep(2);
          } else if (stepNum === 3 && validateStep1()) {
            goToStep(3);
          }
        }
      });
    });

    // Shipping radio toggle
    document.querySelectorAll('.shipping-option').forEach(opt => {
      opt.addEventListener('click', () => {
        document.querySelectorAll('.shipping-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        const radio = opt.querySelector('input[type="radio"]');
        radio.checked = true;

        // Show/hide campus selector dropdown
        const campusContainer = document.getElementById('pickupCampusContainer');
        if (campusContainer) {
          if (radio.value === 'pickup') {
            campusContainer.style.display = 'block';
          } else {
            campusContainer.style.display = 'none';
          }
        }

        updateCheckoutTotals(getCart());
      });
    });

    // Complete Order button
    const completeBtn = document.getElementById('completeOrderBtn');
    if (completeBtn) {
      completeBtn.addEventListener('click', () => handleCompleteOrder());
    }

    // Simulate Success button
    const simSuccessBtn = document.getElementById('simSuccessBtn');
    if (simSuccessBtn) {
      simSuccessBtn.addEventListener('click', () => {
        simulateOrder('success');
      });
    }

    // Simulate Failed button
    const simFailBtn = document.getElementById('simFailBtn');
    if (simFailBtn) {
      simFailBtn.addEventListener('click', () => {
        simulateOrder('failed');
      });
    }
  }

  function renderPaymentGateways(container) {
    container.innerHTML = '';
    let selectedGateway = 'whatsapp'; // default

    PAYMENT_GATEWAYS.forEach(gw => {
      const card = document.createElement('label');
      card.className = `pay-option ${gw.id === selectedGateway ? 'selected' : ''} ${!gw.active ? 'disabled' : ''}`;
      card.setAttribute('data-gateway', gw.id);
      card.innerHTML = `
        <input type="radio" name="payment_gateway" value="${gw.id}" ${gw.id === selectedGateway ? 'checked' : ''} ${!gw.active ? 'disabled' : ''}>
        <div class="pay-option-icon" style="background: ${gw.active ? gw.color : 'var(--muted)'};">
          <i data-lucide="${gw.icon}" style="width:20px;height:20px;color:white;"></i>
        </div>
        <div class="pay-option-info">
          <strong>${gw.name}</strong>
          <span>${gw.desc}</span>
        </div>
        <span class="pay-badge ${gw.active ? 'pay-badge-active' : 'pay-badge-soon'}">${gw.badge}</span>
      `;

      if (gw.active) {
        card.addEventListener('click', () => {
          container.querySelectorAll('.pay-option').forEach(o => o.classList.remove('selected'));
          card.classList.add('selected');
          card.querySelector('input[type="radio"]').checked = true;
          selectedGateway = gw.id;
          togglePaymentFields(gw.id);
        });
      }

      container.appendChild(card);
    });

    // Show WhatsApp fields by default
    togglePaymentFields(selectedGateway);

    if (window.lucide) {
      window.lucide.createIcons({ nodeList: container.querySelectorAll('[data-lucide]') });
    }
  }

  function togglePaymentFields(gatewayId) {
    // Hide all payment-specific panels
    document.querySelectorAll('.pay-panel').forEach(p => p.style.display = 'none');

    const panel = document.getElementById(`panel-${gatewayId}`);
    if (panel) panel.style.display = 'block';

    // Update submit button text
    const btn = document.getElementById('completeOrderBtn');
    if (!btn) return;

    if (gatewayId === 'whatsapp') {
      btn.innerHTML = '<i data-lucide="message-circle" style="width:18px;height:18px;"></i> Send Order via WhatsApp';
      btn.style.background = '#25D366';
    } else {
      btn.innerHTML = '<i data-lucide="lock" style="width:18px;height:18px;"></i> Complete Order';
      btn.style.background = '';
    }

    if (window.lucide) {
      window.lucide.createIcons({ nodeList: btn.querySelectorAll('[data-lucide]') });
    }
  }

  function updateCheckoutTotals(cart) {
    const subtotal = calcSubtotal(cart);
    const shipping = getShippingCost();
    const tax = calcTax(subtotal);
    const total = subtotal + shipping + tax;

    const setEl = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    setEl('coSubtotal', `$${subtotal.toFixed(2)}`);
    setEl('coShipping', shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`);
    setEl('coTax', `$${tax.toFixed(2)}`);
    setEl('coTotal', `$${total.toFixed(2)}`);
  }

  // ── Order Processing ───────────────────────────────────
  function handleCompleteOrder() {
    const selectedRadio = document.querySelector('input[name="payment_gateway"]:checked');
    if (!selectedRadio) {
      showAlert('error', 'Please select a payment method.');
      return;
    }

    const gateway = selectedRadio.value;
    const cart = getCart();

    if (cart.length === 0) {
      showAlert('error', 'Your cart is empty. Add items before checking out.');
      return;
    }

    // Full validation of information step fields
    if (!validateStep1()) {
      return;
    }

    if (gateway === 'whatsapp') {
      processWhatsAppOrder(cart);
    } else {
      showAlert('info', `${getGatewayName(gateway)} integration is coming soon. Use WhatsApp Order or the simulation buttons below.`);
    }
  }

  function processWhatsAppOrder(cart) {
    const orderId = generateOrderId();
    const subtotal = calcSubtotal(cart);
    const shipping = getShippingCost();
    const tax = calcTax(subtotal);
    const total = subtotal + shipping + tax;

    // Gather customer info
    const email = document.getElementById('co-email')?.value || '';
    const phone = document.getElementById('co-phone')?.value || '';
    const fname = document.getElementById('co-fname')?.value || '';
    const lname = document.getElementById('co-lname')?.value || '';
    const addr1 = document.getElementById('co-addr1')?.value || '';
    const addr2 = document.getElementById('co-addr2')?.value || '';
    const city = document.getElementById('co-city')?.value || '';
    const state = document.getElementById('co-state')?.value || '';
    const zip = document.getElementById('co-zip')?.value || '';
    const country = document.getElementById('co-country')?.selectedOptions[0]?.text || '';

    const shippingMethod = document.querySelector('input[name="shipping"]:checked')?.value || 'standard';
    const campusSelect = document.getElementById('co-pickup-campus');
    const campusValue = campusSelect?.value;
    const campusName = (shippingMethod === 'pickup' && campusSelect) ? campusSelect.options[campusSelect.selectedIndex]?.text : '';
    const campusAddress = (shippingMethod === 'pickup' && campusValue) ? CAMPUS_ADDRESSES[campusValue] : '';

    // Build WhatsApp message
    let msg = `🛒 *NEW ORDER — ${CHURCH_NAME} Store*\n`;
    msg += `📋 Order ID: *${orderId}*\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n\n`;

    msg += `👤 *Customer Details*\n`;
    msg += `Name: ${fname} ${lname}\n`;
    msg += `Email: ${email}\n`;
    msg += `Phone: ${phone}\n\n`;

    if (shippingMethod === 'pickup') {
      msg += `📦 *Delivery Method*\n`;
      msg += `Local Pickup — *${campusName}*\n`;
      msg += `Address: ${campusAddress}\n\n`;
    } else {
      msg += `📦 *Shipping Address*\n`;
      msg += `${addr1}${addr2 ? ', ' + addr2 : ''}\n`;
      msg += `${city}, ${state} ${zip}\n`;
      msg += `${country}\n\n`;
    }

    msg += `🛍️ *Order Items*\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;

    cart.forEach((item, i) => {
      const variant = [item.size, item.color].filter(Boolean).join(' / ') || 'Standard';
      msg += `${i + 1}. ${item.title}\n`;
      msg += `   Variant: ${variant}\n`;
      msg += `   Qty: ${item.quantity} × $${item.price.toFixed(2)} = $${(item.price * item.quantity).toFixed(2)}\n\n`;
    });

    msg += `━━━━━━━━━━━━━━━━━━\n`;
    msg += `💰 *Order Total*\n`;
    msg += `Subtotal: $${subtotal.toFixed(2)}\n`;
    if (shippingMethod === 'pickup') {
      msg += `Shipping: Local Pickup (Free)\n`;
    } else {
      msg += `Shipping: ${shipping === 0 ? 'Free' : '$' + shipping.toFixed(2)}\n`;
    }
    msg += `Tax: $${tax.toFixed(2)}\n`;
    msg += `*TOTAL: $${total.toFixed(2)}*\n\n`;

    msg += `📱 Sent from ${CHURCH_NAME} Online Store`;

    const encoded = encodeURIComponent(msg);
    const waUrl = `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}?text=${encoded}`;

    // Store order data for success page
    storeOrderData(orderId, cart, subtotal, shipping, tax, total, {
      fname, lname, email, phone, addr1, addr2, city, state, zip, country
    }, 'whatsapp', shippingMethod, campusName, campusAddress);

    // Show success alert then open WhatsApp
    showAlert('success', 'Opening WhatsApp to send your order...');

    setTimeout(() => {
      window.open(waUrl, '_blank');
      // Navigate to success page
      setTimeout(() => {
        clearCart();
        if (window.navigateToPage) {
          window.navigateToPage('checkout-success.html');
        } else {
          window.location.href = 'checkout-success.html';
        }
      }, 1500);
    }, 800);
  }

  function simulateOrder(outcome) {
    const cart = getCart();
    if (cart.length === 0) {
      showAlert('error', 'Your cart is empty. Add items before simulating.');
      return;
    }

    const orderId = generateOrderId();
    const subtotal = calcSubtotal(cart);
    const shipping = getShippingCost();
    const tax = calcTax(subtotal);
    const total = subtotal + shipping + tax;

    const fname = document.getElementById('co-fname')?.value || 'Test';
    const lname = document.getElementById('co-lname')?.value || 'Customer';
    const email = document.getElementById('co-email')?.value || 'test@example.com';

    const shippingMethod = document.querySelector('input[name="shipping"]:checked')?.value || 'standard';
    const campusSelect = document.getElementById('co-pickup-campus');
    const campusValue = campusSelect?.value;
    const campusName = (shippingMethod === 'pickup' && campusSelect) ? campusSelect.options[campusSelect.selectedIndex]?.text : '';
    const campusAddress = (shippingMethod === 'pickup' && campusValue) ? CAMPUS_ADDRESSES[campusValue] : '';

    storeOrderData(orderId, cart, subtotal, shipping, tax, total, {
      fname, lname, email,
      phone: document.getElementById('co-phone')?.value || '',
      addr1: document.getElementById('co-addr1')?.value || '123 Test Street',
      addr2: '', city: 'Test City', state: 'TS', zip: '00000',
      country: 'United States'
    }, 'simulated', shippingMethod, campusName, campusAddress);

    if (outcome === 'success') {
      showAlert('success', 'Payment processed successfully! Redirecting to confirmation...');
      setTimeout(() => {
        clearCart();
        if (window.navigateToPage) {
          window.navigateToPage('checkout-success.html');
        } else {
          window.location.href = 'checkout-success.html';
        }
      }, 1500);
    } else {
      showAlert('error', 'Payment declined! Redirecting to error page...');
      setTimeout(() => {
        if (window.navigateToPage) {
          window.navigateToPage('checkout-failed.html');
        } else {
          window.location.href = 'checkout-failed.html';
        }
      }, 1500);
    }
  }

  function storeOrderData(orderId, cart, subtotal, shipping, tax, total, customer, gateway, shippingMethod, pickupCampus, pickupCampusAddress) {
    const orderData = {
      orderId, cart, subtotal, shipping, tax, total, customer, gateway,
      shippingMethod: shippingMethod || 'standard',
      pickupCampus: pickupCampus || null,
      pickupCampusAddress: pickupCampusAddress || null,
      date: new Date().toISOString(),
      status: 'pending'
    };
    localStorage.setItem('church_store_last_order', JSON.stringify(orderData));
  }

  function getGatewayName(id) {
    const gw = PAYMENT_GATEWAYS.find(g => g.id === id);
    return gw ? gw.name : id;
  }

  // ── Success Page Logic ──────────────────────────────────
  function initSuccessPage() {
    const orderNumEl = document.getElementById('orderNumber');
    if (!orderNumEl) return;

    try {
      const order = JSON.parse(localStorage.getItem('church_store_last_order') || '{}');
      if (order.orderId) {
        // Populate order number
        orderNumEl.textContent = `#${order.orderId}`;

        // Populate email
        const emailEl = document.getElementById('confirmEmail');
        if (emailEl && order.customer?.email) {
          emailEl.textContent = order.customer.email;
        }

        // Populate items
        const itemsContainer = document.getElementById('successOrderItems');
        if (itemsContainer && order.cart) {
          itemsContainer.innerHTML = '';
          order.cart.forEach(item => {
            const variant = [item.size, item.color].filter(Boolean).join(' / ') || 'Standard';
            const div = document.createElement('div');
            div.className = 'line-item';
            div.innerHTML = `
              <img class="line-item-thumb" src="${item.img}" alt="${item.title}">
              <div>
                <div class="line-item-name">${item.title}</div>
                <div class="line-item-variant">${variant} · Qty: ${item.quantity}</div>
              </div>
              <div class="line-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
            `;
            itemsContainer.appendChild(div);
          });
        }

        // Populate totals
        const setEl = (id, text) => {
          const el = document.getElementById(id);
          if (el) el.textContent = text;
        };
        setEl('successSubtotal', `$${order.subtotal?.toFixed(2) || '0.00'}`);
        setEl('successShipping', order.shipping === 0 ? 'Free' : `$${order.shipping?.toFixed(2) || '0.00'}`);
        setEl('successTax', `$${order.tax?.toFixed(2) || '0.00'}`);
        setEl('successTotal', `$${order.total?.toFixed(2) || '0.00'}`);

        // Populate shipping address or pickup campus
        const addrEl = document.getElementById('successShipAddr');
        if (addrEl && order.customer) {
          const c = order.customer;
          if (order.shippingMethod === 'pickup' && order.pickupCampus) {
            addrEl.innerHTML = `
              <strong>Local Pickup Location:</strong><br>
              ${order.pickupCampus}<br>
              <span style="font-size: 13px; color: var(--text); display: inline-block; margin-top: 4px;">${order.pickupCampusAddress || ''}</span><br>
              <span style="font-weight: 500; color: var(--muted); font-size: 12px; display: inline-block; margin-top: 6px;">Bring your order confirmation when collecting.</span>
            `;
            // Change card title to Pickup Location
            const cardHeader = addrEl.closest('.order-card')?.querySelector('.order-card-header');
            if (cardHeader) {
              cardHeader.innerHTML = `<i data-lucide="map-pin"></i> Pickup Location`;
            }
            const labelEl = addrEl.previousElementSibling;
            if (labelEl && labelEl.tagName === 'LABEL') {
              labelEl.textContent = 'Pickup Venue';
            }
          } else {
            addrEl.innerHTML = `
              <strong>${c.fname} ${c.lname}</strong><br>
              ${c.addr1}${c.addr2 ? ', ' + c.addr2 : ''}<br>
              ${c.city}, ${c.state} ${c.zip}<br>
              ${c.country}
            `;
          }
        }

        // Populate shipping method name dynamically
        const methodEl = document.getElementById('successShipMethod');
        if (methodEl) {
          if (order.shippingMethod === 'pickup') {
            methodEl.innerHTML = `<strong>Local Pickup</strong><br>Collect at selected venue`;
          } else if (order.shippingMethod === 'express') {
            methodEl.innerHTML = `<strong>Express Shipping</strong><br>2–3 business days`;
          } else {
            methodEl.innerHTML = `<strong>Standard Shipping</strong><br>5–7 business days`;
          }
        }

        // Update tracking block if it is local pickup
        const trackingBlock = document.getElementById('successTrackingBlock');
        if (trackingBlock && order.shippingMethod === 'pickup') {
          trackingBlock.innerHTML = `
            <label>Pickup Status</label>
            <span class="tracking-code" style="background: color-mix(in srgb, var(--accent) 8%, transparent); color: var(--accent);">
              <i data-lucide="check-circle" style="width:14px;height:14px;"></i>
              Ready in 1-2 business days
            </span>
          `;
        }

        // Re-initialize dynamic Lucide icons for success details
        if (window.lucide) {
          window.lucide.createIcons();
        }

        // Populate payment method
        const payEl = document.getElementById('successPayMethod');
        if (payEl) {
          payEl.textContent = order.gateway === 'whatsapp' ? 'WhatsApp Order' : getGatewayName(order.gateway);
        }
      }
    } catch (e) {
      console.warn('Could not load order data:', e);
    }
  }

  // ── Alert Helper ────────────────────────────────────────
  function showAlert(type, message) {
    // Hide all
    document.querySelectorAll('.co-alert').forEach(a => a.classList.remove('visible'));

    const map = {
      success: 'alertSuccess',
      error: 'alertError',
      warning: 'alertWarning',
      info: 'alertInfo'
    };

    const el = document.getElementById(map[type]);
    if (el) {
      const span = el.querySelector('span');
      if (span) span.textContent = message;
      el.classList.add('visible');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // ── Initialize ─────────────────────────────────────────
  function init() {
    // Cart page
    if (document.getElementById('cartTableBody') || document.getElementById('cartMobileItems')) {
      initCartPage();
    }

    // Checkout page
    if (document.getElementById('paymentMethodContainer')) {
      initCheckoutPage();
    }

    // Success page
    if (document.getElementById('orderNumber')) {
      initSuccessPage();
    }

    // Global cart badge update
    updateCartBadge();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('pjax:complete', init);
})();
