// State
const state = {
  invoiceNo: 'HOA - 0080',
  seq: parseInt(localStorage.getItem('hoa_seq') || '80', 10),
  items: [],
  taxRate: 5,
  advance: 0,
  showTax: true,
  paymentStatus: 'Unpaid',
  paymentMethod: '',
  cacheInvoices: [],
  expenses: [], // Added for Expenses Module
};

// Elements
const itemsBody = document.getElementById('itemsBody');
const addItemBtn = document.getElementById('addItemBtn');
const subtotalEl = document.getElementById('subtotal');
const salesTaxEl = document.getElementById('salesTax');
const grandTotalEl = document.getElementById('grandTotal');
const taxRateEl = document.getElementById('taxRate');
const advanceEl = document.getElementById('advance');

// Preview elements
const pInvoiceNo = document.getElementById('pInvoiceNo');
const pInvoiceDate = document.getElementById('pInvoiceDate');
const pClientName = document.getElementById('pClientName');
const pClientAddress = document.getElementById('pClientAddress');
const pClientPhone = document.getElementById('pClientPhone');
const pItems = document.getElementById('pItems');
const pSubtotal = document.getElementById('pSubtotal');
const pTaxRate = document.getElementById('pTaxRate');
const pSalesTax = document.getElementById('pSalesTax');
const pAdvance = document.getElementById('pAdvance');
const pGrandTotal = document.getElementById('pGrandTotal');

// Form elements
const invoiceDateEl = document.getElementById('invoiceDate');
const dueDateEl = document.getElementById('dueDate');
const invoiceNoTextEl = document.getElementById('invoiceNoText');
const billToEl = document.getElementById('billTo');
const billAddressEl = document.getElementById('billAddress');
const billPhoneEl = document.getElementById('billPhone');
const billJobEl = document.getElementById('billJob');
const showStampEl = document.getElementById('showStamp');
const showTaxEl = document.getElementById('showTax');
const stampImageEl = document.getElementById('stampImage');
const paymentStatusRadios = document.getElementsByName('paymentStatus');
const paymentMethodBox = document.getElementById('paymentMethodBox');
const paymentMethodEl = document.getElementById('paymentMethod');
const taxRowEl = document.getElementById('taxRow');
const salesTaxRowEl = document.getElementById('salesTaxRow');

// Config elements
const seqStartEl = document.getElementById('seqStart');
const applySeqBtn = document.getElementById('applySeq');

// Init dates
const today = new Date();
invoiceDateEl.valueAsDate = today;
dueDateEl.valueAsDate = new Date(today.getTime() + 6 * 24 * 3600 * 1000);
// Initialize invoice number
updateInvoiceNumberText();
invoiceNoTextEl.textContent = state.invoiceNo;

// Item row helper
function addItemRow(item = { code: '', desc: '', qty: 1, price: 0, discount: '' }) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td data-label="Item No"><input placeholder="Item No" value="${item.code}"></td>
    <td data-label="Description"><input placeholder="Description" value="${item.desc}"></td>
    <td data-label="Qty"><input type="number" step="1" min="0" value="${item.qty}"></td>
    <td data-label="Unit Price"><input type="number" step="0.01" min="0" value="${item.price}"></td>
    <td data-label="Discount"><input placeholder="-" value="${item.discount}"></td>
    <td data-label="Amount" class="amount">0.00</td>
    <td><button class="link remove">Remove Item</button></td>
  `;
  itemsBody.appendChild(tr);
  recalc();
  tr.querySelectorAll('input').forEach(inp => inp.addEventListener('input', recalc));
  tr.querySelector('.remove').addEventListener('click', () => { tr.remove(); recalc(); });
}

function parseDiscount(discountStr) {
  if (!discountStr) return 0;
  const pct = discountStr.trim().endsWith('%');
  const num = parseFloat(discountStr);
  return isNaN(num) ? 0 : { pct, num };
}

function recalc() {
  const rows = Array.from(itemsBody.querySelectorAll('tr'));
  let subtotal = 0;
  rows.forEach(row => {
    const [codeEl, descEl, qtyEl, priceEl, discountEl] = row.querySelectorAll('input');
    const qty = parseFloat(qtyEl.value) || 0; const price = parseFloat(priceEl.value) || 0;
    const discountInfo = parseDiscount(discountEl.value);
    let line = qty * price;
    if (discountInfo && discountInfo.num) {
      line -= discountInfo.pct ? (line * discountInfo.num / 100) : discountInfo.num;
    }
    row.querySelector('.amount').textContent = line.toFixed(2);
    subtotal += line;
  });

  const showTax = showTaxEl.checked;
  const taxRate = showTax ? (parseFloat(taxRateEl.value) || 0) : 0;
  const salesTax = subtotal * taxRate / 100;

  // Toggle tax UI in form
  if (taxRowEl) taxRowEl.style.display = showTax ? 'flex' : 'none';
  if (salesTaxRowEl) salesTaxRowEl.style.display = showTax ? 'flex' : 'none';
  const advance = parseFloat(advanceEl.value) || 0;
  const grand = subtotal + salesTax - advance;

  subtotalEl.textContent = subtotal.toFixed(2);
  salesTaxEl.textContent = salesTax.toFixed(2);
  grandTotalEl.textContent = grand.toFixed(2);

  // Preview sync
  pInvoiceNo.textContent = state.invoiceNo;
  pInvoiceDate.textContent = invoiceDateEl.value || '';
  pClientName.textContent = billToEl.value || '';
  pClientAddress.textContent = billAddressEl.value || '';
  pClientPhone.textContent = billPhoneEl.value || '';
  document.getElementById('pJob').textContent = billJobEl.value || '—';
  stampImageEl.style.display = showStampEl.checked ? 'block' : 'none';

  pItems.innerHTML = '';
  pItems.innerHTML = '';
  rows.forEach((row, idx) => {
    const [codeEl, descEl, qtyEl, priceEl, discountEl] = row.querySelectorAll('input');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${codeEl.value || 'HD' + String(idx + 1).padStart(3, '0')}</td>
      <td>${descEl.value || '—'}</td>
      <td>${qtyEl.value || 0}</td>
      <td>${parseFloat(priceEl.value || 0).toFixed(2)}</td>
      <td>${discountEl.value || '-'}</td>
      <td>${row.querySelector('.amount').textContent}</td>
    `;
    pItems.appendChild(tr);
  });

  pSubtotal.textContent = subtotal.toFixed(2);

  // Tax in preview
  const pTaxRow = pTaxRate.closest('tr');
  const pSalesTaxRow = pSalesTax.closest('tr');
  if (pTaxRow) pTaxRow.style.display = showTax ? 'table-row' : 'none';
  if (pSalesTaxRow) pSalesTaxRow.style.display = showTax ? 'table-row' : 'none';

  pTaxRate.textContent = (parseFloat(taxRateEl.value) || 0).toFixed(2);
  pSalesTax.textContent = salesTax.toFixed(2);
  pAdvance.textContent = (parseFloat(advanceEl.value) || 0).toFixed(2);
  pGrandTotal.textContent = grand.toFixed(2);
}

// Setup listeners
addItemBtn.addEventListener('click', () => addItemRow());
taxRateEl.addEventListener('input', recalc);
advanceEl.addEventListener('input', recalc);
billToEl.addEventListener('input', recalc);
billAddressEl.addEventListener('input', recalc);
billPhoneEl.addEventListener('input', recalc);
billJobEl.addEventListener('input', recalc);
showStampEl.addEventListener('change', recalc);
showTaxEl.addEventListener('change', recalc);
invoiceDateEl.addEventListener('input', recalc);

// Payment status listeners
Array.from(paymentStatusRadios).forEach(r => {
  r.addEventListener('change', () => {
    if (r.value === 'Paid') {
      paymentMethodBox.classList.remove('hidden');
    } else {
      paymentMethodBox.classList.add('hidden');
      paymentMethodEl.value = '';
    }
  });
});

// Add initial row
addItemRow({ code: 'HD011', desc: '30 day Tourist VISA', qty: 1, price: 315, discount: '' });

// Preview and download
document.getElementById('previewBtn').addEventListener('click', async () => {
  // Create a screen preview via html2canvas
  const node = document.getElementById('invoicePreview');
  const canvas = await html2canvas(node, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  const w = window.open('', '_blank');
  w.document.write(`<img src="${imgData}" style="width:100%" />`);
});

document.getElementById('downloadBtn').addEventListener('click', async () => {
  const { jsPDF } = window.jspdf;
  const node = document.getElementById('invoicePreview');
  const canvas = await html2canvas(node, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210; // mm
  const pageHeight = 297; // mm
  const imgProps = pdf.getImageProperties(imgData);
  const imgWidth = pageWidth - 20; // 10mm margins each side
  const imgHeight = imgProps.height * imgWidth / imgProps.width;
  pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
  pdf.save(`${state.invoiceNo.replace(' ', '_')}.pdf`);
});

// Send invoice placeholder
document.getElementById('sendInvoice').addEventListener('click', () => {
  alert('Invoice generated.');
  // Increment sequence on send
  state.seq += 1; localStorage.setItem('hoa_seq', String(state.seq)); updateInvoiceNumberText(); recalc();
  // Track metrics
  const invoices = JSON.parse(localStorage.getItem('hoa_invoices') || '[]');
  const record = getCurrentInvoiceData();
  invoices.push(record);
  localStorage.setItem('hoa_invoices', JSON.stringify(invoices));
  // Save to Supabase if configured
  saveInvoiceToSupabase(record);
  // Update cache and views
  state.cacheInvoices = invoices;
  refreshAnalytics();
  renderTrackList();
  renderDashboardChart();
});

// Help modal
const helpLink = document.getElementById('helpLink');
const helpModal = document.getElementById('helpModal');
const closeHelp = document.getElementById('closeHelp');
helpLink.addEventListener('click', () => { helpModal.classList.remove('hidden'); });
closeHelp.addEventListener('click', () => { helpModal.classList.add('hidden'); });
applySeqBtn.addEventListener('click', () => {
  const start = parseInt(seqStartEl.value || '80', 10);
  if (!isNaN(start)) {
    state.seq = start;
    localStorage.setItem('hoa_seq', String(start));
    updateInvoiceNumberText();
    recalc();
  }
});

function updateInvoiceNumberText() {
  const padded = String(state.seq).padStart(4, '0');
  state.invoiceNo = `HOA - ${padded}`;
  // Sync current sequence and displayed invoice number
  if (typeof invoiceNoTextEl !== 'undefined' && invoiceNoTextEl) {
    invoiceNoTextEl.textContent = state.invoiceNo;
  }
  if (typeof seqStartEl !== 'undefined' && seqStartEl) {
    seqStartEl.value = state.seq;
  }
}



// Mobile Menu Logic
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.querySelector('.sidebar');
// Use existing overlay from HTML
const overlay = document.getElementById('sidebarOverlay') || document.querySelector('.sidebar-overlay');

if (menuBtn) {
  menuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
  });
}
if (overlay) {
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  });
}
// Close sidebar on link click
document.querySelectorAll('.menu a').forEach(a => {
  a.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    }
  });
});

// Mobile Preview Toggle
const mobileViewBtn = document.getElementById('mobileViewBtn');
const mobileBackBtn = document.getElementById('mobileBackBtn');
const formPanel = document.querySelector('.form-panel');
const previewPanel = document.querySelector('.preview-panel');

if (mobileViewBtn) mobileViewBtn.addEventListener('click', () => {
  // Ensure calculations are up to date
  recalc();
  if (formPanel) formPanel.classList.add('mobile-hidden');
  if (previewPanel) previewPanel.classList.add('mobile-active');
  window.scrollTo(0, 0);
});

if (mobileBackBtn) mobileBackBtn.addEventListener('click', () => {
  if (formPanel) formPanel.classList.remove('mobile-hidden');
  if (previewPanel) previewPanel.classList.remove('mobile-active');
});

// Navigation between pages
const pages = {
  generation: document.getElementById('page-generation'),
  dashboard: document.getElementById('page-dashboard'),
  track: document.getElementById('page-track')
};
const sidebarEl = document.querySelector('.sidebar');
const topbarEl = document.querySelector('.topbar');

// Expenses initialized in loadExpenses


// --- Navigation ---
function showPage(pageId) {
  // Hide all
  ['page-login', 'page-dashboard', 'page-generation', 'page-track', 'page-expenses'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  // Show target
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.remove('hidden');

  // Update Header Title
  const titleEl = document.querySelector('.topbar h1');
  if (titleEl) {
    const titles = {
      'dashboard': 'Dashboard',
      'generation': 'New Invoice',
      'track': 'Track Invoices',
      'expenses': 'Expenses & Payments'
    };
    if (titles[pageId]) titleEl.textContent = titles[pageId];
  }

  // Menu active state
  document.querySelectorAll('.menu a').forEach(a => {
    a.classList.remove('active');
    if (pageId === 'dashboard' && a.textContent.includes('Dashboard')) a.classList.add('active');
    if (pageId === 'generation' && a.textContent.includes('Generation')) a.classList.add('active');
    if (pageId === 'track' && a.textContent.includes('Track')) a.classList.add('active');
    if (pageId === 'expenses' && a.textContent.includes('Expenses')) a.classList.add('active');
  });

  // Page Specific Init
  if (pageId === 'dashboard') {
    refreshAnalytics();
    setTimeout(renderDashboardChart, 100);
  }
  if (pageId === 'track') {
    renderTrackList();
  }
  if (pageId === 'expenses') {
    refreshExpenseAnalytics();
    renderExpenseList();
  }
}
// Navigation listeners removed - using inline onclick in HTML


function refreshAnalytics() {
  const invoices = state.cacheInvoices.length ? state.cacheInvoices : JSON.parse(localStorage.getItem('hoa_invoices') || '[]');

  // Basic Counts
  const count = invoices.length;
  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

  // Status Metrics
  const paidInvoices = invoices.filter(i => i.paymentStatus === 'Paid');
  const paidAmount = paidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueInvoices = invoices.filter(i => i.paymentStatus !== 'Paid' && i.dueDate && i.dueDate < todayStr);
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

  // Update DOM
  const dashTotal = document.getElementById('dashTotal');
  const dashRevenue = document.getElementById('dashRevenue');
  const dashPaid = document.getElementById('dashPaid');
  const dashOverdue = document.getElementById('dashOverdue');
  const trackCount = document.getElementById('trackCount');

  if (dashTotal) dashTotal.textContent = count;
  if (dashRevenue) dashRevenue.textContent = totalRevenue.toFixed(2);
  if (dashPaid) dashPaid.textContent = paidAmount.toFixed(2);
  if (dashOverdue) dashOverdue.textContent = overdueAmount.toFixed(2);
  if (trackCount) trackCount.textContent = count;

  // Populate Lists
  renderOverdueList(overdueInvoices);
  renderRecentList(invoices);
}

function renderOverdueList(list) {
  const ul = document.getElementById('overdueList');
  if (!ul) return;
  if (list.length === 0) {
    ul.innerHTML = '<li class="empty-state">No overdue invoices</li>';
    return;
  }
  ul.innerHTML = list.slice(0, 5).map(inv => `
    <li>
      <div>
        <strong>${inv.no}</strong> <span style="color:#f87171">(Due: ${inv.dueDate})</span><br>
        <span class="date">${inv.billTo}</span>
      </div>
      <div class="amount">${(inv.total || 0).toFixed(2)}</div>
    </li>
  `).join('');
}

function renderRecentList(allInvoices) {
  const ul = document.getElementById('recentList');
  if (!ul) return;
  // Sort by date desc
  const recent = [...allInvoices].sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 5);
  if (recent.length === 0) {
    ul.innerHTML = '<li class="empty-state">No recent activity</li>';
    return;
  }
  ul.innerHTML = recent.map(inv => `
    <li>
      <div>
        <strong>${inv.no}</strong><br>
        <span class="date">${inv.date} • ${inv.billTo}</span>
      </div>
      <div class="amount">${(inv.total || 0).toFixed(2)}</div>
    </li>
  `).join('');
}

// Build full invoice snapshot from current form
function getCurrentInvoiceData() {
  const rows = Array.from(itemsBody.querySelectorAll('tr'));
  const items = rows.map(row => {
    const [codeEl, descEl, qtyEl, priceEl, discountEl] = row.querySelectorAll('input');
    const qty = parseFloat(qtyEl.value) || 0; const price = parseFloat(priceEl.value) || 0;
    const amount = parseFloat(row.querySelector('.amount').textContent || '0');
    return { code: codeEl.value, desc: descEl.value, qty, price, discount: discountEl.value, amount };
  });
  const subtotal = parseFloat(pSubtotal.textContent || '0');
  const taxRate = parseFloat(taxRateEl.value || '0');
  const tax = parseFloat(pSalesTax.textContent || '0');
  const advance = parseFloat(advanceEl.value || '0');
  const total = parseFloat(pGrandTotal.textContent || '0');

  const pStatus = Array.from(paymentStatusRadios).find(r => r.checked)?.value || 'Unpaid';
  const pMethod = paymentMethodEl.value;

  return {
    id: Date.now(),
    no: state.invoiceNo,
    date: invoiceDateEl.value,
    dueDate: dueDateEl.value,
    billTo: billToEl.value,
    address: billAddressEl.value,
    phone: billPhoneEl.value,
    job: billJobEl.value,
    showStamp: !!showStampEl.checked,
    showTax: !!showTaxEl.checked,
    paymentStatus: pStatus,
    paymentMethod: pMethod,
    items,
    subtotal, taxRate, tax, advance, total
  };
}

// Helpers for filtering
// Sorting State
let currentSort = { col: 'date', asc: false }; // Default: Newest first

function getFilteredInvoices() {
  const invoices = state.cacheInvoices.length ? state.cacheInvoices : JSON.parse(localStorage.getItem('hoa_invoices') || '[]');
  const q = (document.getElementById('trackSearch')?.value || '').trim().toLowerCase();
  const start = document.getElementById('trackStart')?.value || '';
  const end = document.getElementById('trackEnd')?.value || '';
  const statusFilter = document.getElementById('trackStatusFilter')?.value || 'All';

  const todayStr = new Date().toISOString().split('T')[0];

  return invoices.filter(inv => {
    // Text Search
    const searchMatch = !q ||
      (inv.billTo || '').toLowerCase().includes(q) ||
      (inv.job || '').toLowerCase().includes(q) ||
      (inv.no || '').toLowerCase().includes(q);

    // Date Range
    const dateVal = inv.date || '';
    const afterStart = !start || (dateVal >= start);
    const beforeEnd = !end || (dateVal <= end);

    // Status Filter
    let statusMatch = true;
    if (statusFilter === 'Paid') statusMatch = (inv.paymentStatus === 'Paid');
    else if (statusFilter === 'Unpaid') statusMatch = (inv.paymentStatus !== 'Paid');
    else if (statusFilter === 'Overdue') {
      statusMatch = (inv.paymentStatus !== 'Paid' && inv.dueDate && inv.dueDate < todayStr);
    }

    return searchMatch && afterStart && beforeEnd && statusMatch;
  });
}

function sortInvoices(invoices) {
  const { col, asc } = currentSort;
  return [...invoices].sort((a, b) => {
    let valA = a[col];
    let valB = b[col];

    // Handle specific types
    if (col === 'total') { valA = a.total || 0; valB = b.total || 0; }
    else if (col === 'date') { valA = a.date || ''; valB = b.date || ''; }

    if (valA < valB) return asc ? -1 : 1;
    if (valA > valB) return asc ? 1 : -1;
    return 0;
  });
}

function renderTrackList() {
  const tbody = document.getElementById('trackList');
  if (!tbody) return;

  let invoices = getFilteredInvoices();

  // Update Summary Strip
  const sumCount = document.getElementById('trackSumCount');
  const sumTotal = document.getElementById('trackSumTotal');
  const sumUnpaid = document.getElementById('trackSumUnpaid');

  if (sumCount) sumCount.textContent = invoices.length;
  if (sumTotal) sumTotal.textContent = invoices.reduce((s, i) => s + (i.total || 0), 0).toFixed(2);

  const todayStr = new Date().toISOString().split('T')[0];
  const unpaidTotal = invoices.reduce((s, i) => {
    if (i.paymentStatus !== 'Paid') return s + (i.total || 0);
    return s;
  }, 0);
  if (sumUnpaid) sumUnpaid.textContent = unpaidTotal.toFixed(2);

  // Sorting
  invoices = sortInvoices(invoices);

  // Render Table
  tbody.innerHTML = '';
  const emptyState = document.getElementById('trackEmptyState');

  if (invoices.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    document.getElementById('trackTable').classList.add('hidden');
  } else {
    if (emptyState) emptyState.classList.add('hidden');
    document.getElementById('trackTable').classList.remove('hidden');

    invoices.forEach((inv, idx) => {
      // Find original index for actions
      const originalIdx = state.cacheInvoices.findIndex(i => i.id === inv.id || i.no === inv.no);

      const tr = document.createElement('tr');
      // Status Badge Logic
      let badgeClass = 'warning';
      let statusText = inv.paymentStatus || 'Unpaid';
      if (statusText === 'Paid') badgeClass = 'success';
      else if (inv.dueDate && inv.dueDate < todayStr) {
        statusText = 'Overdue';
        badgeClass = 'danger'; // CSS needs this class or use inline style
      }

      tr.innerHTML = `
        <td data-label="Invoice No.">${inv.no}</td>
        <td data-label="Date">${inv.date || ''}</td>
        <td data-label="Bill To">${inv.billTo || ''}</td>
        <td data-label="Job">${inv.job || ''}</td>
        <td data-label="Total">${(inv.total || 0).toFixed(2)}</td>
        <td data-label="Status"><span class="badge ${badgeClass}" style="${badgeClass === 'danger' ? 'background:#fed7d7;color:#c53030' : ''}">${statusText}</span></td>
        <td data-label="Actions">
          <button class="btn-icon-action action-view" title="View" data-idx="${originalIdx}">👁️</button>
          <button class="btn-icon-action action-download" title="Download PDF" data-idx="${originalIdx}">⬇️</button>
          <button class="btn-icon-action action-mail" title="Email" data-idx="${originalIdx}">✉️</button>
          <button class="btn-icon-action action-edit" title="Edit" data-idx="${originalIdx}">✏️</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  updateSortIcons();

  // Re-bind actions (using delegation on tbody is cleaner but implemented previously)
  // Ensure we don't double bind if listener was on tbody. 
  // actually the previous implementation had a listener on tbody with _bound check. 
  // We need to keep that logic valid or re-implement it.
  if (!tbody._bound) {
    tbody.addEventListener('click', async (e) => {
      const btn = (e.target && e.target.closest) ? e.target.closest('button') : null;
      if (!btn) return;
      const idxAttr = btn.getAttribute('data-idx');
      const idx = idxAttr ? parseInt(idxAttr, 10) : -1;
      if (idx < 0) return;

      // Use original index to fetch from CACHE, not filtered list
      const inv = state.cacheInvoices[idx];

      if (!inv) return;
      try {
        if (btn.classList.contains('action-view')) {
          await openViewModal(inv);
        } else if (btn.classList.contains('action-download')) {
          await openViewModal(inv, true);
        } else if (btn.classList.contains('action-mail')) {
          openMailModal(inv);
        } else if (btn.classList.contains('action-edit')) {
          loadInvoiceIntoForm(inv);
          document.querySelectorAll('.menu a').forEach(el => el.classList.remove('active'));
          const genLink = Array.from(document.querySelectorAll('.menu a')).find(a => a.textContent.trim() === 'Invoice Generation');
          if (genLink) genLink.classList.add('active');
          showPage('generation');
        }
      } catch (err) {
        console.error('Action handler error:', err);
        alert('Something went wrong when handling that action. Please try again.');
      }
    });
    tbody._bound = true;
  }
}

function updateSortIcons() {
  document.querySelectorAll('th[data-sort]').forEach(th => {
    th.classList.remove('asc', 'desc');
    if (th.dataset.sort === currentSort.col) {
      th.classList.add(currentSort.asc ? 'asc' : 'desc');
    }
  });
}

// Handle Sorting Clicks
document.querySelectorAll('#trackTable th[data-sort]').forEach(th => {
  th.addEventListener('click', () => {
    const col = th.dataset.sort;
    if (currentSort.col === col) {
      currentSort.asc = !currentSort.asc;
    } else {
      currentSort.col = col;
      currentSort.asc = true;
    }
    renderTrackList();
  });
});

// Clear Filters
const clearBtn = document.getElementById('trackClearFilters');
if (clearBtn) clearBtn.addEventListener('click', () => {
  document.getElementById('trackSearch').value = '';
  document.getElementById('trackStart').value = '';
  document.getElementById('trackEnd').value = '';
  document.getElementById('trackStatusFilter').value = 'All';
  renderTrackList();
});

refreshAnalytics();
renderTrackList();

// Search and filter listeners
const trackSearchEl = document.getElementById('trackSearch');
const trackStartEl = document.getElementById('trackStart');
const trackEndEl = document.getElementById('trackEnd');
const trackStatusEl = document.getElementById('trackStatusFilter');
if (trackSearchEl) trackSearchEl.addEventListener('input', renderTrackList);
if (trackStartEl) trackStartEl.addEventListener('change', renderTrackList);
if (trackEndEl) trackEndEl.addEventListener('change', renderTrackList);
if (trackStatusEl) trackStatusEl.addEventListener('change', renderTrackList);

// View modal logic
const viewModal = document.getElementById('viewModal');
const viewInvoiceNode = document.getElementById('viewInvoice');
const viewCloseBtn = document.getElementById('viewClose');
const viewDownloadBtn = document.getElementById('viewDownload');
let currentViewInvoice = null;

function renderInvoiceInNode(inv, node) {
  const itemsRows = inv.items.map((it, i) => `
    <tr>
      <td>${it.code || 'HD' + String(i + 1).padStart(3, '0')}</td>
      <td>${it.desc || '—'}</td>
      <td>${it.qty || 0}</td>
      <td>${(it.price || 0).toFixed(2)}</td>
      <td>${it.discount || '-'}</td>
      <td>${(it.amount || 0).toFixed(2)}</td>
    </tr>
  `).join('');

  const showTax = (inv.showTax !== false); // default true for old records
  const statusLine = (inv.paymentStatus === 'Paid')
    ? `<div><strong>Status:</strong> Paid via ${inv.paymentMethod || '—'}</div>`
    : `<div><strong>Status:</strong> Unpaid (Due: ${inv.dueDate || '—'})</div>`;

  node.innerHTML = `
    <div class="invoice-header redesigned">
      <div class="header-left">
  <img src="https://hoa-invoice-bice.vercel.app/assets/HOA%20NEW%20Logo.png" alt="HOA Mark" class="hoa-logo" />
      </div>
      <div class="header-right">
        <div class="title">INVOICE</div>
        <div class="meta">
          <div>Invoice No.: <span>${inv.no}</span></div>
          <div>Invoice Date: <span>${inv.date || ''}</span></div>
          <div>Job: <span>${inv.job || '—'}</span></div>
          ${statusLine}
        </div>
      </div>
    </div>
    <div class="party-columns">
      <div>
        <strong>HOA Destinations LLC</strong><br />
        6th Floor, Business Center,<br />
        The Meydan Hotel Grandstand,<br />
        Meydan Road, Nad Al Sheba, Dubai, UAE<br />
        Ph.: +971 526652744 | Mob.: +91 8584849870<br />
        info@hoaventures.com
      </div>
      <div>
        <strong>Bill to:</strong> <span>${inv.billTo || '—'}</span><br />
        <strong>Address:</strong> <span>${inv.address || '—'}</span><br />
        <strong>Phone:</strong> <span>${inv.phone || '—'}</span>
      </div>
    </div>
    <table class="invoice-table">
      <thead>
        <tr>
          <th>Item #</th>
          <th>Description</th>
          <th>Qty</th>
          <th>Unit price (AED)</th>
          <th>Discount</th>
          <th>Price (AED)</th>
        </tr>
      </thead>
      <tbody>${itemsRows}</tbody>
    </table>
    <table class="summary">
      <tbody>
        <tr><td>Invoice Subtotal</td><td>${(inv.subtotal || 0).toFixed(2)}</td></tr>
        ${showTax ? `<tr><td>Tax Rate</td><td>${(inv.taxRate || 0).toFixed(2)}%</td></tr>` : ''}
        ${showTax ? `<tr><td>Sales Tax</td><td>${(inv.tax || 0).toFixed(2)}</td></tr>` : ''}
        <tr><td>Adv. (if any)</td><td>${(inv.advance || 0).toFixed(2)}</td></tr>
        <tr class="grand"><td>TOTAL</td><td>${(inv.total || 0).toFixed(2)}</td></tr>
      </tbody>
    </table>
    <div class="footer-flex">
      <div class="footer-note">
        This is a computer generated invoice
        <br />Bank remittance charges are applicable separately by merchant. Credit card payments carry an additional surcharge of 2.5%.
        <br />For queries or feedback, mail us on info@hoaventures.com.
        <br /><a href="https://www.hoaventures.com" target="_blank">www.hoaventures.com</a>
      </div>
  ${inv.showStamp ? '<img src="https://hoa-invoice-bice.vercel.app/assets/HOA%20STAMP.png" alt="Stamp" class="stamp" />' : ''}
    </div>
  `;
}

async function openViewModal(inv, autoDownload = false) {
  currentViewInvoice = inv;
  renderInvoiceInNode(inv, viewInvoiceNode);
  viewModal.classList.remove('hidden');
  if (autoDownload) {
    await downloadNodeAsPDF(viewInvoiceNode, `${inv.no.replace(' ', '_')}.pdf`);
  }
}

async function downloadNodeAsPDF(node, filename) {
  const { jsPDF } = window.jspdf;
  const canvas = await html2canvas(node, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const imgProps = pdf.getImageProperties(imgData);
  const imgWidth = pageWidth - 20;
  const imgHeight = imgProps.height * imgWidth / imgProps.width;
  pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
  pdf.save(filename);
}
// Generate a PDF Data URL from an invoice for emailing
async function generateInvoicePdfDataUrl(inv) {
  const { jsPDF } = window.jspdf;
  const temp = document.createElement('div');
  temp.style.position = 'fixed'; temp.style.left = '-9999px'; temp.style.top = '0'; temp.style.width = '800px';
  temp.className = 'invoice';
  document.body.appendChild(temp);
  renderInvoiceInNode(inv, temp);
  const canvas = await html2canvas(temp, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210; const imgProps = pdf.getImageProperties(imgData);
  const imgWidth = pageWidth - 20; const imgHeight = imgProps.height * imgWidth / imgProps.width;
  pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
  const dataUrl = pdf.output('datauristring');
  document.body.removeChild(temp);
  return dataUrl;
}

if (viewCloseBtn) viewCloseBtn.addEventListener('click', () => { viewModal.classList.add('hidden'); });
if (viewDownloadBtn) viewDownloadBtn.addEventListener('click', async () => {
  if (currentViewInvoice) {
    await downloadNodeAsPDF(viewInvoiceNode, `${currentViewInvoice.no.replace(' ', '_')}.pdf`);
  }
});

// Mail modal logic
const mailModal = document.getElementById('mailModal');
const mailRecipientEl = document.getElementById('mailRecipient');
const mailCancelBtn = document.getElementById('mailCancel');
const mailSendBtn = document.getElementById('mailSend');
let currentMailInvoice = null;
const mailStatusEl = document.getElementById('mailStatus');

function openMailModal(inv) {
  currentMailInvoice = inv;
  mailRecipientEl.value = '';
  if (mailStatusEl) { mailStatusEl.style.display = 'none'; mailStatusEl.textContent = ''; }
  mailModal.classList.remove('hidden');
}
if (mailCancelBtn) mailCancelBtn.addEventListener('click', () => { mailModal.classList.add('hidden'); });
if (mailSendBtn) mailSendBtn.addEventListener('click', async () => {
  const to = (mailRecipientEl.value || '').trim();
  if (!to) { alert('Please enter recipient email'); return; }
  if (!currentMailInvoice) { alert('No invoice selected'); return; }
  try {
    if (mailStatusEl) { mailStatusEl.style.display = 'block'; mailStatusEl.style.color = '#2b6cb0'; mailStatusEl.textContent = 'Composing and sending email…'; }
    const pdfDataUrl = await generateInvoicePdfDataUrl(currentMailInvoice);
    const payload = {
      to,
      subject: `Invoice ${currentMailInvoice.no}`,
      body: `Dear Client,\n\nPlease find attached the invoice ${currentMailInvoice.no}.\n\nTotal: AED ${(currentMailInvoice.total || 0).toFixed(2)}\nDate: ${currentMailInvoice.date || ''}\n\nRegards,\nHOA Ventures`,
      filename: `${currentMailInvoice.no.replace(' ', '_')}.pdf`,
      pdfDataUrl
    };
    const res = await fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) { const txt = await res.text(); throw new Error(txt || 'Email send failed'); }
    if (mailStatusEl) { mailStatusEl.style.display = 'block'; mailStatusEl.style.color = '#2f855a'; mailStatusEl.textContent = 'Email sent successfully.'; }
    setTimeout(() => { mailModal.classList.add('hidden'); }, 800);
  } catch (err) {
    console.error(err);
    if (mailStatusEl) { mailStatusEl.style.display = 'block'; mailStatusEl.style.color = '#c53030'; mailStatusEl.textContent = 'Failed to send email: ' + (err.message || String(err)); }
  }
});

// Export Excel (XLSX if available, else CSV)
const exportXlsxBtn = document.getElementById('exportXlsx');
if (exportXlsxBtn) exportXlsxBtn.addEventListener('click', () => {
  const invoices = getFilteredInvoices();
  if (window.XLSX) {
    const rows = invoices.map(i => ({
      InvoiceNo: i.no,
      Date: i.date,
      BillTo: i.billTo,
      Job: i.job,
      TotalAED: i.total,
      TaxAED: i.tax
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
    XLSX.writeFile(wb, 'hoa_invoices.xlsx');
  } else {
    // Fallback CSV
    const header = ['Invoice No', 'Date', 'Bill To', 'Job', 'Total (AED)', 'Tax (AED)'];
    const csv = [header.join(',')].concat(
      invoices.map(i => [i.no, i.date, i.billTo, i.job, (i.total || 0).toFixed(2), (i.tax || 0).toFixed(2)].join(','))
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'hoa_invoices.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }
});

// Load invoice into Generation form for editing
function loadInvoiceIntoForm(inv) {
  billToEl.value = inv.billTo || '';
  billAddressEl.value = inv.address || '';
  billPhoneEl.value = inv.phone || '';
  billJobEl.value = inv.job || '';
  invoiceDateEl.value = inv.date || '';
  dueDateEl.value = inv.dueDate || '';
  showStampEl.checked = !!inv.showStamp;
  showTaxEl.checked = (inv.showTax !== false);

  // Payment status
  const pStatus = inv.paymentStatus || 'Unpaid';
  Array.from(paymentStatusRadios).forEach(r => {
    r.checked = (r.value === pStatus);
  });
  if (pStatus === 'Paid') {
    paymentMethodBox.classList.remove('hidden');
    paymentMethodEl.value = inv.paymentMethod || '';
  } else {
    paymentMethodBox.classList.add('hidden');
    paymentMethodEl.value = '';
  }

  taxRateEl.value = (inv.taxRate || 0);
  advanceEl.value = (inv.advance || 0);
  // Recompute invoice number to match existing
  state.invoiceNo = inv.no; invoiceNoTextEl.textContent = inv.no;
  // Load items
  itemsBody.innerHTML = '';
  (inv.items || []).forEach(it => addItemRow({ code: it.code, desc: it.desc, qty: it.qty, price: it.price, discount: it.discount }));
  recalc();
}

// Supabase data sync
async function loadInvoicesFromSupabase() {
  if (!supabaseClient) return;
  const { data, error } = await supabaseClient.from('invoices').select('*').order('date', { ascending: true });
  if (error) { console.warn('Load invoices error', error); return; }
  state.cacheInvoices = Array.isArray(data) ? data : [];
  refreshAnalytics();
  renderTrackList();
  renderDashboardChart();
}

async function saveInvoiceToSupabase(record) {
  if (!supabaseClient) return;
  const { error } = await supabaseClient.from('invoices').insert(record);
  if (error) { console.warn('Save invoice error', error); }
}

// Dev helper to test Supabase insert/select from the current form
async function testInvoice() {
  if (!supabaseClient) { console.warn('Supabase not configured'); return; }
  try {
    const { data: userData } = await supabaseClient.auth.getUser();
    const userId = userData?.user?.id || null;
    const invoice = getCurrentInvoiceData();
    if (userId) invoice.user_id = userId; // optional, if your table has user_id

    const { data: insertData, error: insertError } = await supabaseClient
      .from('invoices')
      .insert([invoice])
      .select('*');
    if (insertError) { console.error('Insert error:', insertError); return; }
    console.log('Inserted invoice:', insertData);

    const { data: rows, error: selectError } = await supabaseClient
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });
    if (selectError) { console.error('Select error:', selectError); return; }
    console.log('Fetched invoices:', rows);
    state.cacheInvoices = Array.isArray(rows) ? rows : [];
    refreshAnalytics();
    renderTrackList();
    renderDashboardChart();
  } catch (err) { console.error('testInvoice failed:', err); }
}

// Expose helper on window for console usage
window.testInvoice = testInvoice;

// Dashboard chart instances
let chartRevenueInstance = null;
let chartInvoicesInstance = null;
let chartOverdueInstance = null;

function renderDashboardChart() {
  const invoices = state.cacheInvoices.length ? state.cacheInvoices : JSON.parse(localStorage.getItem('hoa_invoices') || '[]');

  // Prepare Data
  const byDate = {};
  invoices.forEach(inv => {
    const d = inv.date || '';
    if (!d) return;
    byDate[d] = (byDate[d] || 0) + (inv.total || 0);
  });
  const labels = Object.keys(byDate).sort();
  const values = labels.map(l => byDate[l]);

  // 1. Revenue Chart (Red Line)
  const ctxRev = document.getElementById('chartRevenue');
  if (ctxRev && window.Chart) {
    if (chartRevenueInstance) chartRevenueInstance.destroy();
    chartRevenueInstance = new Chart(ctxRev, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: values,
          borderColor: '#8B2626',
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#8B2626',
          tension: 0.4,
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: true } },
        scales: { x: { display: false }, y: { display: false } },
        layout: { padding: 5 }
      }
    });
  }

  // 2. Invoices Chart (Red Area)
  const ctxInv = document.getElementById('chartInvoices');
  if (ctxInv && window.Chart) {
    // Just using revenue data shape for demo, or could use count per day
    if (chartInvoicesInstance) chartInvoicesInstance.destroy();
    chartInvoicesInstance = new Chart(ctxInv, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: values,
          borderColor: '#8B2626',
          backgroundColor: 'rgba(139, 38, 38, 0.1)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false } },
        layout: { padding: 0 }
      }
    });
  }

  // 3. Overdue Chart (Bar Chart for Move Goal style)
  const ctxOver = document.getElementById('chartOverdue');
  if (ctxOver && window.Chart) {
    // Mock data for bars
    const barData = [50, 80, 40, 90, 30, 60, 80, 50, 70, 90, 60, 40];
    if (chartOverdueInstance) chartOverdueInstance.destroy();
    chartOverdueInstance = new Chart(ctxOver, {
      type: 'bar',
      data: {
        labels: barData.map((_, i) => i),
        datasets: [{
          data: barData,
          backgroundColor: '#8B2626',
          borderRadius: 4,
          barThickness: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false } }
      }
    });
  }

  // Render Calendar Widget
  renderCalendarWidget('dashCalendar');
  renderCalendarWidget('trackCalendar');
}

function renderCalendarWidget(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Invoices for this month
  const invoices = state.cacheInvoices || [];
  const invoiceDates = invoices.map(i => i.date).filter(d => d);

  let html = `
    <div class="cal-header">
      <div class="cal-nav">&lt;</div>
      <div class="cal-title">${monthNames[month]} ${year}</div>
      <div class="cal-nav">&gt;</div>
    </div>
    <div class="cal-grid">
      <div class="cal-day-name">Su</div>
      <div class="cal-day-name">Mo</div>
      <div class="cal-day-name">Tu</div>
      <div class="cal-day-name">We</div>
      <div class="cal-day-name">Th</div>
      <div class="cal-day-name">Fr</div>
      <div class="cal-day-name">Sa</div>
  `;

  // Empty slots
  for (let i = 0; i < firstDay; i++) {
    html += `<div></div>`;
  }

  // Days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = (d === today.getDate());
    const hasInvoice = invoiceDates.includes(dateStr);

    let classes = 'cal-day';
    if (isToday) classes += ' active';
    if (hasInvoice) classes += ' has-event';

    html += `<div class="${classes}">${d}</div>`;
  }

  html += `</div>`;
  container.innerHTML = html;
}

// Track Calendar Toggle
const toggleTrackViewBtn = document.getElementById('toggleTrackView');
const trackCalendarContainer = document.getElementById('trackCalendarContainer');
const trackTable = document.getElementById('trackTable');

if (toggleTrackViewBtn) {
  toggleTrackViewBtn.addEventListener('click', () => {
    const isHidden = trackCalendarContainer.classList.contains('hidden');
    if (isHidden) {
      trackCalendarContainer.classList.remove('hidden');
      trackTable.classList.add('hidden');
      toggleTrackViewBtn.textContent = 'Show List View';
      renderCalendarWidget('trackCalendar');
    } else {
      trackCalendarContainer.classList.add('hidden');
      trackTable.classList.remove('hidden');
      toggleTrackViewBtn.textContent = 'Show Calendar View';
    }
  });
}

// --- Expense Management Logic ---

// Load Expenses
function loadExpenses() {
  const saved = localStorage.getItem('hoa_expenses');
  if (saved) state.expenses = JSON.parse(saved);
}

// Save Expenses
function saveExpenses() {
  localStorage.setItem('hoa_expenses', JSON.stringify(state.expenses));
}

// Render Expense List
function renderExpenseList() {
  const tbody = document.getElementById('expList');
  if (!tbody) return;

  const q = document.getElementById('expSearch').value.toLowerCase();
  const cat = document.getElementById('expCatFilter').value;
  const status = document.getElementById('expStatusFilter').value;

  const filtered = state.expenses.filter(e => {
    const matchSearch = e.payee.toLowerCase().includes(q) || e.id.toLowerCase().includes(q);
    const matchCat = cat === 'All' || e.category === cat;
    const matchStatus = status === 'All' || e.status === status;
    return matchSearch && matchCat && matchStatus;
  });

  tbody.innerHTML = '';
  filtered.sort((a, b) => b.date.localeCompare(a.date)); // Newest first

  filtered.forEach(e => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${e.id}</td>
      <td>${e.date}</td>
      <td>${e.payee}</td>
      <td><span class="badge" style="background:#edf2f7;color:#2d3748">${e.category}</span></td>
      <td>${parseFloat(e.amount).toFixed(2)}</td>
      <td><span class="badge ${e.status === 'Paid' ? 'success' : 'warning'}">${e.status}</span></td>
      <td>
        <button class="btn-icon-action" onclick="editExpense('${e.id}')">✏️</button>
        <button class="btn-icon-action" onclick="deleteExpense('${e.id}')">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Analytics & Charts
let flowChartInstance = null;
let catChartInstance = null;

function refreshExpenseAnalytics() {
  const expenses = state.expenses;
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Stats
  const thisMonthExp = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const monthTotal = thisMonthExp.reduce((s, e) => s + parseFloat(e.amount), 0);

  const yearTotal = expenses.filter(e => new Date(e.date).getFullYear() === currentYear)
    .reduce((s, e) => s + parseFloat(e.amount), 0);

  const pending = expenses.filter(e => e.status === 'Pending');
  const pendingTotal = pending.reduce((s, e) => s + parseFloat(e.amount), 0);

  // Top Category
  const catTotals = {};
  expenses.forEach(e => {
    catTotals[e.category] = (catTotals[e.category] || 0) + parseFloat(e.amount);
  });
  let topCat = '--';
  let topCatVal = 0;
  Object.keys(catTotals).forEach(c => {
    if (catTotals[c] > topCatVal) {
      topCat = c;
      topCatVal = catTotals[c];
    }
  });

  // Update DOM
  document.getElementById('expMonth').textContent = monthTotal.toFixed(2);
  document.getElementById('expYear').textContent = yearTotal.toFixed(2);
  document.getElementById('expPending').textContent = pendingTotal.toFixed(2);
  document.getElementById('expPendingCount').textContent = `${pending.length} transactions`;
  document.getElementById('expTopCat').textContent = topCat;
  document.getElementById('expTopCatVal').textContent = topCatVal.toFixed(2);

  // Charts
  renderExpenseCharts(expenses, catTotals);
}

function renderExpenseCharts(expenses, catTotals) {
  // 1. Cash Flow (Rev vs Exp) - Last 6 months
  const ctxFlow = document.getElementById('chartCashFlow');
  if (ctxFlow && window.Chart) {
    // Generate last 6 months labels
    const labels = [];
    const expData = [];
    const revData = []; // Mock revenue data or fetch from invoices?

    // For demo, just grouping expenses by month
    const byMonth = {};
    expenses.forEach(e => {
      const month = e.date.substring(0, 7); // YYYY-MM
      byMonth[month] = (byMonth[month] || 0) + parseFloat(e.amount);
    });

    Object.keys(byMonth).sort().slice(-6).forEach(m => {
      labels.push(m);
      expData.push(byMonth[m]);
      revData.push(byMonth[m] * 1.5); // Mock revenue
    });

    if (flowChartInstance) flowChartInstance.destroy();
    flowChartInstance = new Chart(ctxFlow, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Revenue', data: revData, backgroundColor: '#d4af37' },
          { label: 'Expenses', data: expData, backgroundColor: '#8B2626' }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  // 2. Breakdown
  const ctxCat = document.getElementById('chartExpCat');
  if (ctxCat && window.Chart) {
    if (catChartInstance) catChartInstance.destroy();
    catChartInstance = new Chart(ctxCat, {
      type: 'doughnut',
      data: {
        labels: Object.keys(catTotals),
        datasets: [{
          data: Object.values(catTotals),
          backgroundColor: ['#e53e3e', '#dd6b20', '#d69e2e', '#38a169', '#3182ce', '#805ad5', '#718096']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });
  }
}

// Add/Edit Modal
const expenseModal = document.getElementById('expenseModal');
const addExpenseBtn = document.getElementById('addExpenseBtn');
const closeExpModal = document.getElementById('closeExpenseModal');
const expenseForm = document.getElementById('expenseForm');

if (addExpenseBtn) addExpenseBtn.addEventListener('click', () => {
  openExpenseModal();
});
if (closeExpModal) closeExpModal.addEventListener('click', () => {
  expenseModal.classList.add('hidden');
});

function openExpenseModal(expense = null) {
  expenseModal.classList.remove('hidden');
  if (expense) {
    document.getElementById('expModalTitle').textContent = 'Edit Expense';
    document.getElementById('expId').value = expense.id;
    document.getElementById('expDate').value = expense.date;
    document.getElementById('expCategory').value = expense.category;
    document.getElementById('expPayee').value = expense.payee;
    document.getElementById('expAmount').value = expense.amount;
    document.getElementById('expDesc').value = expense.description || '';
    document.getElementById('expMode').value = expense.mode;
    document.getElementById('expStatus').value = expense.status;
  } else {
    document.getElementById('expModalTitle').textContent = 'Add Expense';
    expenseForm.reset();
    document.getElementById('expId').value = '';
    document.getElementById('expDate').value = new Date().toISOString().split('T')[0];
  }
}

expenseForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('expId').value;
  const newExp = {
    id: id || 'EXP-' + Date.now().toString().slice(-6),
    date: document.getElementById('expDate').value,
    category: document.getElementById('expCategory').value,
    payee: document.getElementById('expPayee').value,
    amount: document.getElementById('expAmount').value,
    description: document.getElementById('expDesc').value,
    mode: document.getElementById('expMode').value,
    status: document.getElementById('expStatus').value
  };

  if (id) {
    const idx = state.expenses.findIndex(x => x.id === id);
    if (idx !== -1) state.expenses[idx] = newExp;
  } else {
    state.expenses.push(newExp);
  }

  saveExpenses();
  expenseModal.classList.add('hidden');
  refreshExpenseAnalytics();
  renderExpenseList();
});

window.editExpense = function (id) {
  const exp = state.expenses.find(x => x.id === id);
  if (exp) openExpenseModal(exp);
};

window.deleteExpense = function (id) {
  if (confirm('Delete this expense?')) {
    state.expenses = state.expenses.filter(x => x.id !== id);
    saveExpenses();
    refreshExpenseAnalytics();
    renderExpenseList();
  }
};

// Filter Listeners
['expSearch', 'expCatFilter', 'expStatusFilter'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', renderExpenseList);
});

// Init load
loadExpenses();

// Supabase init
let supabaseClient = null;
if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY && window.supabase) {
  try {
    const url = String(window.SUPABASE_URL).trim();
    const key = String(window.SUPABASE_ANON_KEY).trim();
    supabaseClient = window.supabase.createClient(url, key);
  } catch (err) { console.warn('Supabase init failed', err); }
}
// Initial load
if (supabaseClient) { loadInvoicesFromSupabase(); }

// Auth gating
const logoutLink = document.getElementById('logoutLink');
const pageLogin = document.getElementById('page-login');
const loginBtn = document.getElementById('loginBtn');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginError = document.getElementById('loginError');
const loginInfo = document.getElementById('loginInfo');
const resetPasswordBtn = document.getElementById('resetPasswordBtn');
// Profile UI elements
const profileBtn = document.getElementById('profileBtn');
const profileModal = document.getElementById('profileModal');
const profileNameEl = document.getElementById('profileName');
const avatarFileEl = document.getElementById('avatarFile');
const profileStatusEl = document.getElementById('profileStatus');
const profileCloseBtn = document.getElementById('profileClose');
const profileSaveBtn = document.getElementById('profileSave');
const profileAvatarImg = document.getElementById('profileAvatarImg');

function setLoginError(msg) {
  if (!loginError) return;
  if (!msg) { loginError.style.display = 'none'; loginError.textContent = ''; return; }
  loginError.textContent = msg;
  loginError.style.display = 'block';
}

function setLoginInfo(msg) {
  if (!loginInfo) return;
  if (!msg) { loginInfo.style.display = 'none'; loginInfo.textContent = ''; return; }
  loginInfo.textContent = msg;
  loginInfo.style.display = 'block';
}
// Auth check after DOM elements exist
// Run a quick Supabase health check to catch invalid key/URL early
verifySupabaseConfig();
checkAuth();

async function verifySupabaseConfig() {
  try {
    if (!(window.SUPABASE_URL && window.SUPABASE_ANON_KEY)) return;
    const url = String(window.SUPABASE_URL).trim();
    const key = String(window.SUPABASE_ANON_KEY).trim();
    const payload = (() => { try { return JSON.parse(atob(String(key).split('.')[1] || '')); } catch (_) { return null; } })();
    const refFromKey = payload?.ref;
    const roleFromKey = payload?.role;
    const urlRef = (url.match(/https?:\/\/([a-z0-9-]+)\.supabase\.co/i)?.[1]) || null;
    console.info('Supabase config check:', { url, refFromKey, urlRef, role: roleFromKey });
    if (roleFromKey && roleFromKey !== 'anon') {
      setLoginError('Browser must use anon key, not service role key.');
      return;
    }
    if (refFromKey && urlRef && refFromKey !== urlRef) {
      setLoginError(`Supabase keys mismatch: anon key (${refFromKey}) does not match URL (${urlRef}).`);
      return;
    }
    const res = await fetch(`${url}/auth/v1/health`, { headers: { apikey: key } });
    if (res.status !== 200) {
      setLoginError(`Supabase health check failed (status ${res.status}). Verify project URL and anon key.`);
      console.warn('Auth health check failed with status', res.status);
    }
  } catch (err) { console.warn('Supabase verification failed', err); }
}

async function checkAuth() {
  let loggedIn = !!localStorage.getItem('hoa_logged_in');
  if (supabaseClient) {
    const { data } = await supabaseClient.auth.getSession();
    loggedIn = !!data?.session;
  }
  if (!loggedIn) {
    showOnlyLogin();
  } else {
    showPage('generation');
  }
}

function showOnlyLogin() {
  pages.dashboard.classList.add('hidden');
  pages.track.classList.add('hidden');
  pages.generation.classList.add('hidden');
  pageLogin?.classList.remove('hidden');
  if (sidebarEl) sidebarEl.classList.add('hidden');
  if (topbarEl) topbarEl.classList.add('hidden');
  document.body.classList.add('auth-screen');
}

if (loginBtn) loginBtn.addEventListener('click', async () => {
  const email = (loginEmail?.value || '').trim();
  const password = (loginPassword?.value || '').trim();
  if (!email || !password) { alert('Enter email and password'); return; }
  if (supabaseClient) {
    setLoginError('');
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) { setLoginError(error.message || 'Login failed'); return; }
    pageLogin?.classList.add('hidden');
    showPage('generation');
  } else {
    setLoginError('Supabase not configured. Please check URL and anon key.');
    return;
  }
});

if (resetPasswordBtn) resetPasswordBtn.addEventListener('click', async () => {
  const email = (loginEmail?.value || '').trim();
  if (!email) { setLoginError('Enter your email to reset password'); return; }
  if (!supabaseClient) { setLoginError('Supabase not configured.'); return; }
  setLoginError(''); setLoginInfo('');
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
  if (error) { setLoginError(error.message || 'Failed to send reset email'); return; }
  setLoginInfo('Password reset email sent. Check your inbox.');
});

if (logoutLink) logoutLink.addEventListener('click', async () => {
  localStorage.removeItem('hoa_logged_in');
  if (supabaseClient) { await supabaseClient.auth.signOut(); }
  showOnlyLogin();
});

// Profile modal logic
function initialsFrom(str) {
  const s = (str || '').trim();
  if (!s) return '—';
  const parts = s.split(/[\s@._-]+/).filter(Boolean);
  const a = parts[0]?.[0] || '';
  const b = parts[1]?.[0] || '';
  return (a + b || a).toUpperCase();
}

async function updateTopbarAvatar() {
  if (!(supabaseClient && profileBtn)) return;
  const { data: userData } = await supabaseClient.auth.getUser();
  const user = userData?.user || null;
  if (!user) { profileBtn.textContent = '—'; return; }
  // Try load profile
  let avatarUrl = '';
  let displayName = '';
  try {
    const { data: rows } = await supabaseClient.from('profiles').select('*').eq('id', user.id).limit(1);
    const row = Array.isArray(rows) && rows[0] ? rows[0] : null;
    avatarUrl = row?.avatar_url || '';
    displayName = row?.name || '';
  } catch (e) { /* ignore */ }
  if (avatarUrl) {
    profileBtn.innerHTML = `<img src="${avatarUrl}" alt="avatar">`;
  } else {
    profileBtn.textContent = initialsFrom(displayName || user.email || user.id);
  }
}

async function openProfile() {
  if (!(profileModal && supabaseClient)) return;
  const { data: userData, error } = await supabaseClient.auth.getUser();
  if (error || !userData?.user) {
    if (profileStatusEl) { profileStatusEl.style.display = 'block'; profileStatusEl.style.color = '#c53030'; profileStatusEl.textContent = 'Please log in to edit your profile.'; }
    return;
  }
  const user = userData.user;
  // Load existing profile
  try {
    const { data: rows } = await supabaseClient.from('profiles').select('*').eq('id', user.id).limit(1);
    const row = Array.isArray(rows) && rows[0] ? rows[0] : null;
    profileNameEl.value = row?.name || '';
    const avatarUrl = row?.avatar_url || '';
    if (avatarUrl) { profileAvatarImg.src = avatarUrl; profileAvatarImg.style.display = 'block'; } else { profileAvatarImg.style.display = 'none'; }
  } catch (e) { /* ignore */ }
  if (profileStatusEl) { profileStatusEl.style.display = 'none'; profileStatusEl.textContent = ''; }
  profileModal.classList.remove('hidden');
}

async function saveProfile() {
  if (!(supabaseClient && profileSaveBtn)) return;
  const { data: userData } = await supabaseClient.auth.getUser();
  const user = userData?.user || null;
  if (!user) { if (profileStatusEl) { profileStatusEl.style.display = 'block'; profileStatusEl.style.color = '#c53030'; profileStatusEl.textContent = 'Not logged in.'; } return; }
  const name = (profileNameEl.value || '').trim();
  let avatarUrl = '';
  try {
    const file = avatarFileEl?.files?.[0] || null;
    if (file) {
      const ext = (file.name.split('.').pop() || 'png').toLowerCase();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabaseClient.storage.from('avatars').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = await supabaseClient.storage.from('avatars').getPublicUrl(path);
      avatarUrl = pub?.publicUrl || '';
    }
    const payload = { id: user.id };
    if (name) payload.name = name;
    if (avatarUrl) payload.avatar_url = avatarUrl;
    const { error: upsertErr } = await supabaseClient.from('profiles').upsert(payload);
    if (upsertErr) throw upsertErr;
    if (profileStatusEl) { profileStatusEl.style.display = 'block'; profileStatusEl.style.color = '#2f855a'; profileStatusEl.textContent = 'Profile updated.'; }
    await updateTopbarAvatar();
  } catch (err) {
    if (profileStatusEl) { profileStatusEl.style.display = 'block'; profileStatusEl.style.color = '#c53030'; profileStatusEl.textContent = 'Failed to update: ' + (err.message || String(err)); }
  }
}

if (profileBtn) profileBtn.addEventListener('click', openProfile);
if (profileCloseBtn) profileCloseBtn.addEventListener('click', () => { profileModal.classList.add('hidden'); });
if (profileSaveBtn) profileSaveBtn.addEventListener('click', saveProfile);

// Update avatar when app loads (if already logged in)
updateTopbarAvatar();
