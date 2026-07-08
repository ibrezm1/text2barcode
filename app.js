// State variables
let currentMode = 'qr'; // 'qr' or 'barcode'
let activeTemplate = 'text'; // 'text', 'url', 'wifi', 'email', 'sms'
let history = [];
let debounceTimer;

// DOM Elements
const contentInput = document.getElementById('content-input');
const inputLabel = document.getElementById('input-label');
const mainInputGroup = document.getElementById('main-input-group');
const templatesContainer = document.getElementById('templates-container');
const codeContainer = document.getElementById('code-container');
const previewPlaceholder = document.getElementById('preview-placeholder');
const qrcodeDiv = document.getElementById('qrcode');
const barcodeSvg = document.getElementById('barcode');
const codeInfoDiv = document.getElementById('code-info');

// Accordion & Styling Options
const accordionOptions = document.getElementById('accordion-options');
const colorFgInput = document.getElementById('color-fg');
const colorBgInput = document.getElementById('color-bg');
const colorFgHex = document.getElementById('color-fg-hex');
const colorBgHex = document.getElementById('color-bg-hex');
const optSize = document.getElementById('opt-size');
const optSizeGroup = document.getElementById('opt-size-group');
const optQrErrorGroup = document.getElementById('opt-qr-error-group');
const optQrError = document.getElementById('opt-qr-error');
const optBarcodeFormatGroup = document.getElementById('opt-barcode-format-group');
const optBarcodeFormat = document.getElementById('opt-barcode-format');
const optBarcodeTextGroup = document.getElementById('opt-barcode-text-group');
const optBarcodeText = document.getElementById('opt-barcode-text');

// Action Buttons
const btnCopy = document.getElementById('btn-copy');
const btnPrint = document.getElementById('btn-print');
const btnDownloadPng = document.getElementById('btn-download-png');
const historyList = document.getElementById('history-list');

// Template sub-forms
const subForms = {
  wifi: document.getElementById('form-wifi'),
  email: document.getElementById('form-email'),
  sms: document.getElementById('form-sms')
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  lucide.createIcons();
  
  // Set up Event Listeners
  setupEventListeners();
  
  // Load History from localStorage
  loadHistory();
  
  // Trigger initial empty layout check
  updateUIState();
});

// Event Listeners Configuration
function setupEventListeners() {
  // Live input listening with debounce
  contentInput.addEventListener('input', () => {
    debounceGenerate(300);
  });
  
  // Input fields for sub-forms
  const formInputs = [
    'wifi-ssid', 'wifi-password', 'wifi-encryption', 'wifi-hidden',
    'email-to', 'email-subject', 'email-body',
    'sms-phone', 'sms-message'
  ];
  
  formInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        formatTemplateContent();
        debounceGenerate(300);
      });
    }
  });

  // Color picker events
  colorFgInput.addEventListener('input', (e) => {
    colorFgHex.textContent = e.target.value.toUpperCase();
    debounceGenerate(100);
  });
  
  colorBgInput.addEventListener('input', (e) => {
    colorBgHex.textContent = e.target.value.toUpperCase();
    debounceGenerate(100);
  });

  // Config dropdown events
  optSize.addEventListener('change', () => generateCode());
  optQrError.addEventListener('change', () => generateCode());
  optBarcodeFormat.addEventListener('change', () => {
    validateBarcodeFormatPlaceholder();
    generateCode();
  });
  optBarcodeText.addEventListener('change', () => generateCode());

  // Set up template tab selectors
  templatesContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.template-btn');
    if (!btn) return;
    
    // Deactivate previous
    document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    activeTemplate = btn.dataset.type;
    switchTemplate(activeTemplate);
  });
}

// Debouncer helper
function debounceGenerate(ms) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    generateCode();
  }, ms);
}

// Switch Mode (QR Code vs 1D Barcode)
window.switchMode = function(mode) {
  if (currentMode === mode) return;
  currentMode = mode;
  
  // Toggle tab states
  document.getElementById('tab-qr').classList.toggle('active', mode === 'qr');
  document.getElementById('tab-barcode').classList.toggle('active', mode === 'barcode');
  
  // Toggle form options groups
  if (mode === 'qr') {
    optSizeGroup.style.display = 'block';
    optQrErrorGroup.style.display = 'block';
    optBarcodeFormatGroup.style.display = 'none';
    optBarcodeTextGroup.style.display = 'none';
    
    // Re-enable templates that are suited for QR
    document.getElementById('template-wifi').style.display = 'flex';
    document.getElementById('template-email').style.display = 'flex';
    document.getElementById('template-sms').style.display = 'flex';
    
    inputLabel.textContent = "Text or URL to Encode";
  } else {
    optSizeGroup.style.display = 'none';
    optQrErrorGroup.style.display = 'none';
    optBarcodeFormatGroup.style.display = 'block';
    optBarcodeTextGroup.style.display = 'flex';
    
    // Hide specialized templates for barcodes (barcodes cannot encode complex structured data easily)
    document.getElementById('template-wifi').style.display = 'none';
    document.getElementById('template-email').style.display = 'none';
    document.getElementById('template-sms').style.display = 'none';
    
    // If we were on a hidden template, fallback to plain text
    if (['wifi', 'email', 'sms'].includes(activeTemplate)) {
      document.querySelectorAll('.template-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.type === 'text');
      });
      activeTemplate = 'text';
      switchTemplate('text');
    }
    
    validateBarcodeFormatPlaceholder();
  }
  
  generateCode();
};

// Switch Template Layouts
function switchTemplate(template) {
  // Hide all sub-forms
  Object.values(subForms).forEach(form => form.classList.remove('active'));
  
  // Reset input label and input behavior
  mainInputGroup.style.display = 'block';
  contentInput.readOnly = false;
  
  if (template === 'text') {
    inputLabel.textContent = currentMode === 'qr' ? "Text or URL to Encode" : "Value to Encode";
    contentInput.placeholder = currentMode === 'qr' ? "Type or paste your text/URL here..." : "e.g. 1234567890";
    contentInput.value = "";
  } else if (template === 'url') {
    inputLabel.textContent = "URL Link";
    contentInput.placeholder = "e.g. https://github.com";
    contentInput.value = "https://";
  } else if (template === 'wifi') {
    mainInputGroup.style.display = 'none';
    subForms.wifi.classList.add('active');
    formatTemplateContent();
  } else if (template === 'email') {
    mainInputGroup.style.display = 'none';
    subForms.email.classList.add('active');
    formatTemplateContent();
  } else if (template === 'sms') {
    mainInputGroup.style.display = 'none';
    subForms.sms.classList.add('active');
    formatTemplateContent();
  }
  
  generateCode();
}

// Adjust Barcode placeholders/labels based on standard criteria
function validateBarcodeFormatPlaceholder() {
  const format = optBarcodeFormat.value;
  inputLabel.textContent = `Value to Encode (${format})`;
  
  if (format === 'EAN13') {
    contentInput.placeholder = "Exactly 12 numbers (e.g. 123456789012)";
  } else if (format === 'UPC') {
    contentInput.placeholder = "Exactly 11 or 12 numbers (e.g. 01234567890)";
  } else if (format === 'ITF14') {
    contentInput.placeholder = "Exactly 14 numbers (e.g. 12345678901234)";
  } else if (format === 'Codabar') {
    contentInput.placeholder = "Numbers and A, B, C, or D (e.g. A12345678B)";
  } else if (format === 'CODE39') {
    contentInput.placeholder = "Capital letters, numbers, and - . $ / + % * (e.g. CODE-39)";
  } else {
    contentInput.placeholder = "Any text or numbers (e.g. text-to-barcode-123)";
  }
}

// Formatter to translate template forms into QR raw text standard protocols
function formatTemplateContent() {
  if (activeTemplate === 'wifi') {
    const ssid = document.getElementById('wifi-ssid').value;
    const pass = document.getElementById('wifi-password').value;
    const enc = document.getElementById('wifi-encryption').value;
    const isHidden = document.getElementById('wifi-hidden').checked;
    
    // Protocol WIFI:S:SSID;T:WPA;P:PASSWORD;H:true;;
    if (ssid) {
      contentInput.value = `WIFI:S:${escapeQrWifi(ssid)};T:${enc};P:${escapeQrWifi(pass)};H:${isHidden ? 'true' : ''};;`;
    } else {
      contentInput.value = '';
    }
  } else if (activeTemplate === 'email') {
    const to = document.getElementById('email-to').value;
    const sub = document.getElementById('email-subject').value;
    const body = document.getElementById('email-body').value;
    
    if (to) {
      contentInput.value = `mailto:${to}?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(body)}`;
    } else {
      contentInput.value = '';
    }
  } else if (activeTemplate === 'sms') {
    const phone = document.getElementById('sms-phone').value;
    const msg = document.getElementById('sms-message').value;
    
    if (phone) {
      contentInput.value = `SMSTO:${phone}:${msg}`;
    } else {
      contentInput.value = '';
    }
  }
}

// Helper to escape special characters in Wi-Fi details
function escapeQrWifi(str) {
  if (!str) return '';
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/:/g, '\\:').replace(/,/g, '\\,');
}

// Toggle Style Accordion Panel
window.toggleAccordion = function() {
  const isExpanded = accordionOptions.classList.contains('expanded');
  const toggleBtn = document.querySelector('.customization-section');
  
  if (isExpanded) {
    accordionOptions.classList.remove('expanded');
    toggleBtn.classList.remove('expanded');
  } else {
    accordionOptions.classList.add('expanded');
    toggleBtn.classList.add('expanded');
  }
};

// Generate Code Core Function
function generateCode() {
  const value = contentInput.value.trim();
  
  if (!value) {
    updateUIState(false);
    return;
  }
  
  // Visual indicators
  codeContainer.classList.add('generating');
  
  const fgColor = colorFgInput.value;
  const bgColor = colorBgInput.value;
  
  if (currentMode === 'qr') {
    // Show QR and Hide Barcode
    qrcodeDiv.style.display = 'block';
    barcodeSvg.style.display = 'none';
    
    // Clear previous QR Code
    qrcodeDiv.innerHTML = '';
    
    const size = parseInt(optSize.value, 10);
    const correctLevelMap = {
      'L': QRCode.CorrectLevel.L,
      'M': QRCode.CorrectLevel.M,
      'Q': QRCode.CorrectLevel.Q,
      'H': QRCode.CorrectLevel.H
    };
    const errorLevel = correctLevelMap[optQrError.value];
    
    try {
      // Create new QRCode
      new QRCode(qrcodeDiv, {
        text: value,
        width: size,
        height: size,
        colorDark: fgColor,
        colorLight: bgColor,
        correctLevel: errorLevel
      });
      
      codeInfoDiv.textContent = `QR Code | Size: ${size}px | Correction: ${optQrError.value} | Length: ${value.length} chars`;
      codeInfoDiv.style.color = 'var(--text-secondary)';
      updateUIState(true);
      
      // Auto-save to history (debounced check so we don't save intermediate keystrokes too fast)
      addToHistory(value, 'qr');
      
    } catch (err) {
      console.error(err);
      codeInfoDiv.textContent = 'Error generating QR Code.';
      codeInfoDiv.style.color = 'var(--danger)';
      updateUIState(false);
    }
    
  } else {
    // Show Barcode and Hide QR
    qrcodeDiv.style.display = 'none';
    barcodeSvg.style.display = 'block';
    
    const format = optBarcodeFormat.value;
    const showText = optBarcodeText.checked;
    
    // Validate barcode rules before passing to JsBarcode to prevent library crashes
    const isValid = validateBarcodeContent(value, format);
    if (!isValid.ok) {
      codeInfoDiv.textContent = isValid.reason;
      codeInfoDiv.style.color = 'var(--danger)';
      updateUIState(false);
      codeContainer.classList.remove('generating');
      return;
    }
    
    try {
      JsBarcode("#barcode", value, {
        format: format,
        lineColor: fgColor,
        background: bgColor,
        displayValue: showText,
        fontSize: 16,
        fontOptions: "bold",
        font: "Plus Jakarta Sans",
        textMargin: 6,
        margin: 15,
        width: 2.2,
        height: 100,
        valid: function(valid) {
          if (!valid) {
            throw new Error("Invalid characters for the selected format.");
          }
        }
      });
      
      codeInfoDiv.textContent = `Barcode | Format: ${format} | Length: ${value.length} chars`;
      codeInfoDiv.style.color = 'var(--text-secondary)';
      updateUIState(true);
      addToHistory(value, 'barcode', format);
      
    } catch (err) {
      console.error(err);
      codeInfoDiv.textContent = 'Error rendering barcode.';
      codeInfoDiv.style.color = 'var(--danger)';
      updateUIState(false);
    }
  }
  
  setTimeout(() => {
    codeContainer.classList.remove('generating');
  }, 300);
}

// Manual force trigger
window.generateCodeManual = function() {
  generateCode();
  showToast("Code regenerated successfully!");
};

// Custom validation checks for barcodes to avoid runtime library breaks
function validateBarcodeContent(value, format) {
  if (format === 'EAN13') {
    if (!/^\d{12,13}$/.test(value)) {
      return { ok: false, reason: "EAN-13 requires exactly 12 or 13 numerical digits." };
    }
  } else if (format === 'UPC') {
    if (!/^\d{11,12}$/.test(value)) {
      return { ok: false, reason: "UPC requires exactly 11 or 12 numerical digits." };
    }
  } else if (format === 'ITF14') {
    if (!/^\d{13,14}$/.test(value)) {
      return { ok: false, reason: "ITF-14 requires exactly 13 or 14 numerical digits." };
    }
  } else if (format === 'Codabar') {
    if (!/^[A-Da-d][0-9\-\$\/\+\.\:]*[A-Da-d]$/.test(value) && !/^[0-9\-\$\/\+\.\:]*$/.test(value)) {
      return { ok: false, reason: "Codabar requires numbers/symbols and optional starting A-D characters." };
    }
  } else if (format === 'CODE39') {
    // Only Alphanumeric and specific symbols
    if (!/^[0-9A-Z\-\.\ \$\/\+\%]*$/.test(value.toUpperCase())) {
      return { ok: false, reason: "Code 39 only accepts capital letters, digits, and specific symbols." };
    }
  }
  return { ok: true };
}

// Update UI view states based on whether code is generated or not
function updateUIState(hasCode = false) {
  if (hasCode) {
    previewPlaceholder.style.display = 'none';
    btnCopy.removeAttribute('disabled');
    btnPrint.removeAttribute('disabled');
    btnDownloadPng.removeAttribute('disabled');
  } else {
    previewPlaceholder.style.display = 'flex';
    qrcodeDiv.style.display = 'none';
    barcodeSvg.style.display = 'none';
    codeInfoDiv.textContent = '';
    btnCopy.setAttribute('disabled', 'true');
    btnPrint.setAttribute('disabled', 'true');
    btnDownloadPng.setAttribute('disabled', 'true');
  }
}

// Copy source code contents to Clipboard
window.copyContent = function() {
  const value = contentInput.value.trim();
  if (!value) return;
  
  navigator.clipboard.writeText(value).then(() => {
    showToast("Content copied to clipboard!");
  }).catch(err => {
    console.error("Could not copy: ", err);
    showToast("Failed to copy content.", true);
  });
};

// Print Code Layout
window.printCode = function() {
  window.print();
};

// Download PNG representation
window.downloadPNG = function() {
  const value = contentInput.value.trim();
  if (!value) return;
  
  if (currentMode === 'qr') {
    // Fetch generated image or canvas from QRCode Div
    const canvas = qrcodeDiv.querySelector('canvas');
    const img = qrcodeDiv.querySelector('img');
    
    if (canvas) {
      triggerDownload(canvas.toDataURL("image/png"), `qr-code-${Date.now()}.png`);
    } else if (img && img.src) {
      triggerDownload(img.src, `qr-code-${Date.now()}.png`);
    } else {
      showToast("Download failed. Canvas not ready.", true);
    }
  } else {
    // Convert SVG barcode to PNG
    const svgStr = new XMLSerializer().serializeToString(barcodeSvg);
    const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const DOMURL = window.URL || window.webkitURL || window;
    const url = DOMURL.createObjectURL(svgBlob);
    
    const img = new Image();
    // Get dimensions of barcode
    const svgBounds = barcodeSvg.getBoundingClientRect();
    const width = svgBounds.width || 380;
    const height = svgBounds.height || 150;
    
    img.onload = function() {
      const canvas = document.createElement("canvas");
      // Use higher scale factor for premium high-resolution downloads
      const scale = 2; 
      canvas.width = width * scale;
      canvas.height = height * scale;
      
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = colorBgInput.value;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, width, height);
      
      const pngUrl = canvas.toDataURL("image/png");
      triggerDownload(pngUrl, `barcode-${Date.now()}.png`);
      DOMURL.revokeObjectURL(url);
    };
    
    img.src = url;
  }
};

// Standard anchor file download triggers
function triggerDownload(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast("Image downloaded successfully!");
}

// Show Toast popup alerts
function showToast(message, isError = false) {
  const toast = document.getElementById('toast-message');
  const toastText = document.getElementById('toast-text');
  
  toastText.textContent = message;
  toast.classList.toggle('error', isError);
  toast.classList.add('show');
  
  // Clean classes based on error status
  const iconHtml = isError 
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-circle"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
  
  toast.innerHTML = `${iconHtml} <span>${message}</span>`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// --- History Storage Management ---
function loadHistory() {
  const storedHistory = localStorage.getItem('barcode_history');
  if (storedHistory) {
    try {
      history = JSON.parse(storedHistory);
      renderHistory();
    } catch (e) {
      console.error("Failed to parse history data", e);
      history = [];
    }
  } else {
    history = [];
    renderHistory();
  }
}

function saveHistory() {
  localStorage.setItem('barcode_history', JSON.stringify(history));
  renderHistory();
}

function addToHistory(value, mode, format = '') {
  // Avoid saving intermediate types by comparing with last stored element
  if (history.length > 0 && history[0].value === value && history[0].mode === mode) {
    return; // Already matches latest
  }
  
  const newItem = {
    id: Date.now(),
    value: value,
    mode: mode,
    format: format,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
  
  // Insert at front
  history.unshift(newItem);
  
  // Limit history items to 8
  if (history.length > 8) {
    history.pop();
  }
  
  saveHistory();
}

window.deleteHistoryItem = function(id, event) {
  event.stopPropagation(); // Avoid triggering restoration of content
  history = history.filter(item => item.id !== id);
  saveHistory();
  showToast("History item removed.");
};

window.clearHistory = function() {
  if (history.length === 0) return;
  history = [];
  saveHistory();
  showToast("History cleared.");
};

window.restoreHistoryItem = function(id) {
  const item = history.find(item => item.id === id);
  if (!item) return;
  
  // Switch Mode first
  if (item.mode !== currentMode) {
    switchMode(item.mode);
  }
  
  // Restore value
  contentInput.value = item.value;
  
  // Set generic text template active
  document.querySelectorAll('.template-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.type === 'text');
  });
  activeTemplate = 'text';
  switchTemplate('text');
  
  // Restore formats if needed
  if (item.mode === 'barcode' && item.format) {
    optBarcodeFormat.value = item.format;
    validateBarcodeFormatPlaceholder();
  }
  
  // Re-generate
  generateCode();
  showToast("Restored from history!");
};

function renderHistory() {
  if (history.length === 0) {
    historyList.innerHTML = `
      <div class="empty-history">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-history"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
        <span>No items generated yet</span>
      </div>
    `;
    return;
  }
  
  historyList.innerHTML = history.map(item => {
    const isQr = item.mode === 'qr';
    const badgeText = isQr ? 'QR Code' : `Barcode (${item.format})`;
    
    // Display preview of value
    let displayVal = item.value;
    if (item.value.startsWith('WIFI:')) {
      displayVal = "Wi-Fi Config Details";
    } else if (item.value.startsWith('mailto:')) {
      displayVal = "Email Message Config";
    } else if (item.value.startsWith('SMSTO:')) {
      displayVal = "SMS Dispatch Target";
    }
    
    return `
      <div class="history-item" onclick="restoreHistoryItem(${item.id})">
        <div class="history-details">
          <span class="history-text">${escapeHTML(displayVal)}</span>
          <div class="history-meta">
            <span style="color: ${isQr ? 'var(--accent-cyan)' : 'var(--accent-purple)'}">${badgeText}</span>
            <span>&bull;</span>
            <span>${item.timestamp}</span>
          </div>
        </div>
        <div class="history-actions">
          <button class="history-action-btn delete" onclick="deleteHistoryItem(${item.id}, event)" title="Remove from list">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
