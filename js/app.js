(() => {
  'use strict';

  const STORAGE = {
    settings: 'pkw_settings_v1',
    quotes: 'pkw_quotes_v1',
    draft: 'pkw_draft_v1',
  };

  const GLUE_PRICE_PER_ML = 0.0251; // $93 / 3700mL, rounded to 4dp

  const DEFAULT_SETTINGS = {
    labourRate: 40,
    overheadPercent: 10,
    markupPercent: 30,
    validDays: 30,
    quotePrefix: 'PKW-Q-',
    quoteCounter: 1,
    materials: [
      { id: 'paling', name: 'Palings', unit: 'each', unitPrice: 3.50 },
      { id: 'castor', name: 'Castors', unit: 'each', unitPrice: 4.00 },
      { id: 'screws', name: 'Screws', unit: 'each', unitPrice: 0.08 },
      { id: 'brads', name: 'Brads', unit: 'each', unitPrice: 0.05 },
      { id: 'glue', name: 'Glue', unit: 'mL', unitPrice: GLUE_PRICE_PER_ML },
    ],
  };

  // One-time upgrade for devices that already saved the old "application"-based
  // glue default before the mL pricing switch — leaves any custom price alone.
  function migrateGlueDefault(settings) {
    const glue = settings.materials.find(m => m.id === 'glue');
    if (glue && glue.unit === 'application' && glue.unitPrice === 1.5) {
      glue.unit = 'mL';
      glue.unitPrice = GLUE_PRICE_PER_ML;
    }
    return settings;
  }

  const CUT_STOCK_LENGTH = 1800; // mm, standard paling length
  const CUT_KERF = 3;            // mm, saw-cut allowance between pieces on the same paling

  const PKP001_ROWS = [
    { name: 'A1', length: 500, qty: 8 },
    { name: 'A2', length: 500, qty: 2 },
    { name: 'B1 (long side)', length: 1000, qty: 8 },
    { name: 'B2 (short side)', length: 465, qty: 8 },
    { name: 'C1 (base rail, rip 50mm)', length: 1000, qty: 2 },
    { name: 'C3 (base slat, measure-to-fit)', length: 435, qty: 9 },
    { name: 'D1 (castor block)', length: 100, qty: 4 },
    { name: 'D2 (castor support, measure-to-fit)', length: 435, qty: 2 },
    { name: 'E1 (long top cap)', length: 1000, qty: 2 },
    { name: 'E2 (side top cap)', length: 645, qty: 2 },
  ];

  const CUT_LIST_TEMPLATES = [
    {
      id: 'PKP-001',
      name: 'Standard Raised Planter',
      category: 'Planters',
      rows: [...PKP001_ROWS],
    },
    {
      id: 'PKP-002',
      name: 'Trellis Raised Planter',
      category: 'Planters',
      rows: [
        ...PKP001_ROWS,
        { name: 'A3 (rear upright, laminated)', length: 1785, qty: 6 },
        { name: 'F1 (horizontal rail)', length: 1000, qty: 5 },
        { name: 'F2 (vertical slat, rip narrow)', length: 1100, qty: 8 },
      ],
    },
    {
      id: 'PKP-003',
      name: 'Planter Bench',
      category: 'Planters',
      warning: 'Prototype only — confirm against physical prototype before use. Uses mixed 100mm paling + 70×35mm framing stock.',
      rows: [
        { name: 'A1-style leg', length: 650, qty: 16 },
        { name: 'Wall panel', length: 420, qty: 24 },
        { name: 'Wall panel', length: 470, qty: 24 },
        { name: 'Seat slat', length: 500, qty: 8 },
        { name: 'Top cap', length: 550, qty: 4 },
      ],
    },
    {
      id: 'PKP-004',
      name: 'Offcut Mini Planter',
      category: 'Planters',
      warning: 'Rev B dimensions shown — confirm against your locked Rev C spec.',
      rows: [
        { name: 'A1', length: 500, qty: 8 },
        { name: 'B1 (long side)', length: 360, qty: 8 },
        { name: 'B2 (short side)', length: 350, qty: 8 },
        { name: 'C1 (base rail, rip 50mm)', length: 300, qty: 2 },
        { name: 'C3 (base slat, measure-to-fit)', length: 150, qty: 5 },
        { name: 'E1 (long top cap)', length: 560, qty: 2 },
        { name: 'E2 (short top cap)', length: 550, qty: 2 },
      ],
    },
    {
      id: 'PKP-005',
      name: 'Corner Nursery Shelf Planter',
      category: 'Planters',
      rows: [
        { name: 'A1 (front leg)', length: 500, qty: 4 },
        { name: 'A3 (rear upright)', length: 1785, qty: 4 },
        { name: 'B1 (front wall)', length: 615, qty: 2 },
        { name: 'B2 (side wall)', length: 465, qty: 4 },
        { name: 'C1 (base rail, rip 50mm)', length: 615, qty: 2 },
        { name: 'C3 (base slat, measure-to-fit)', length: 465, qty: 5 },
        { name: 'D1 (castor block)', length: 100, qty: 4 },
        { name: 'D2 (castor support, measure-to-fit)', length: 465, qty: 2 },
        { name: 'G1 (shelf board)', length: 615, qty: 5 },
        { name: 'G2 (centre notched support, 120mm stock)', length: 1785, qty: 1 },
        { name: 'E1 (box top cap front)', length: 700, qty: 1 },
        { name: 'E2 (box top cap side)', length: 550, qty: 2 },
        { name: 'G3 (tower top cap)', length: 700, qty: 1 },
      ],
    },
    {
      id: 'PKA-001',
      name: 'Universal Pot Trough',
      category: 'Accessories',
      note: 'Accessory — quantities are per 2-box batch.',
      rows: [
        { name: 'B1 (front wall)', length: 400, qty: 2 },
        { name: 'B2 (end wall)', length: 150, qty: 4 },
        { name: 'B3 (back panel)', length: 400, qty: 2 },
        { name: 'C3 (base slat, measure-to-fit)', length: 368, qty: 4 },
        { name: 'J1/J2 (cleat, 45° rip)', length: 368, qty: 2 },
      ],
    },
  ];

  function findCutListTemplate(id) {
    return CUT_LIST_TEMPLATES.find(t => t.id === id) || null;
  }

  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2);
  }

  function money(n) {
    const v = Number.isFinite(n) ? n : 0;
    return '$' + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function addDays(isoDate, days) {
    const d = new Date(isoDate + 'T00:00:00');
    d.setDate(d.getDate() + (Number(days) || 0));
    return d;
  }

  function formatDateLong(dateObjOrISO) {
    const d = typeof dateObjOrISO === 'string' ? new Date(dateObjOrISO + 'T00:00:00') : dateObjOrISO;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // ---------------------------------------------------------------------
  // Persistence
  // ---------------------------------------------------------------------

  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE.settings);
      if (!raw) return structuredClone(DEFAULT_SETTINGS);
      const parsed = JSON.parse(raw);
      return migrateGlueDefault(Object.assign(structuredClone(DEFAULT_SETTINGS), parsed));
    } catch (e) {
      console.error('Failed to load settings', e);
      return structuredClone(DEFAULT_SETTINGS);
    }
  }

  function saveSettings(settings) {
    localStorage.setItem(STORAGE.settings, JSON.stringify(settings));
  }

  function loadQuotes() {
    try {
      const raw = localStorage.getItem(STORAGE.quotes);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to load quotes', e);
      return [];
    }
  }

  function saveQuotes(quotes) {
    localStorage.setItem(STORAGE.quotes, JSON.stringify(quotes));
  }

  function saveDraft() {
    try {
      localStorage.setItem(STORAGE.draft, JSON.stringify(state.current));
    } catch (e) { /* non-fatal */ }
  }

  function loadDraft() {
    try {
      const raw = localStorage.getItem(STORAGE.draft);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  // ---------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------

  const state = {
    settings: loadSettings(),
    quotes: loadQuotes(),
    current: null,       // quote currently being edited
    priceOverridden: false, // has user manually edited selling price for this quote?
  };

  let lastCutListResult = { palingsRequired: 0, offcuts: [], totalOffcut: 0, warnings: [] };

  function blankQuote() {
    const s = state.settings;
    return {
      id: uid(),
      quoteNumber: '',       // assigned on first save
      date: todayISO(),
      status: 'Draft',
      validDays: s.validDays,
      client: { name: '', contact: '', notes: '' },
      cutList: [],
      cutListTemplateId: null,
      bom: s.materials.map(m => ({
        materialId: m.id, name: m.name, unit: m.unit, unitPrice: m.unitPrice, qty: 0,
      })),
      labourHours: 0,
      labourRate: s.labourRate,
      overheadPercent: s.overheadPercent,
      markupPercent: s.markupPercent,
      sellingPriceOverride: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  function previewQuoteNumber() {
    return state.settings.quotePrefix + String(state.settings.quoteCounter).padStart(4, '0');
  }

  function assignQuoteNumberIfNeeded(quote) {
    if (quote.quoteNumber) return;
    quote.quoteNumber = previewQuoteNumber();
    state.settings.quoteCounter += 1;
    saveSettings(state.settings);
  }

  // ---------------------------------------------------------------------
  // Computation
  // ---------------------------------------------------------------------

  function computeTotals(quote) {
    const materialsCost = quote.bom.reduce((sum, line) => sum + (Number(line.qty) || 0) * (Number(line.unitPrice) || 0), 0);
    const labourCost = (Number(quote.labourHours) || 0) * (Number(quote.labourRate) || 0);
    const directCost = materialsCost + labourCost;
    const overheadCost = directCost * ((Number(quote.overheadPercent) || 0) / 100);
    const totalCost = directCost + overheadCost;
    const suggestedPrice = totalCost * (1 + (Number(quote.markupPercent) || 0) / 100);
    const sellingPrice = quote.sellingPriceOverride !== null && quote.sellingPriceOverride !== undefined
      ? Number(quote.sellingPriceOverride)
      : suggestedPrice;
    const profit = sellingPrice - totalCost;
    const profitMargin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
    return { materialsCost, labourCost, directCost, overheadCost, totalCost, suggestedPrice, sellingPrice, profit, profitMargin };
  }

  // First-fit-decreasing bin packing: sorts pieces largest-first and drops each
  // into the first paling with room, opening a new paling when none fits.
  function packCutList(cutList) {
    const pieces = [];
    const warnings = [];

    (cutList || []).forEach(row => {
      const length = Number(row.length) || 0;
      const qty = Math.max(0, Math.floor(Number(row.qty) || 0));
      if (length <= 0 || qty <= 0) return;
      if (length > CUT_STOCK_LENGTH) {
        warnings.push(`"${row.name || 'Unnamed part'}" at ${length}mm is longer than a ${CUT_STOCK_LENGTH}mm paling and can't be cut from one.`);
        return;
      }
      for (let i = 0; i < qty; i++) pieces.push({ length, name: row.name || 'Unnamed part' });
    });

    pieces.sort((a, b) => b.length - a.length);

    const bins = [];
    pieces.forEach(piece => {
      let target = bins.find(bin => {
        const cost = bin.items.length === 0 ? piece.length : piece.length + CUT_KERF;
        return bin.used + cost <= CUT_STOCK_LENGTH;
      });
      if (!target) {
        target = { used: 0, items: [] };
        bins.push(target);
      }
      const cost = target.items.length === 0 ? piece.length : piece.length + CUT_KERF;
      target.used += cost;
      target.items.push(piece);
    });

    const offcuts = bins.map(bin => CUT_STOCK_LENGTH - bin.used);
    const totalOffcut = offcuts.reduce((a, b) => a + b, 0);

    return { palingsRequired: bins.length, offcuts, totalOffcut, warnings };
  }

  // ---------------------------------------------------------------------
  // Rendering: Quote tab
  // ---------------------------------------------------------------------

  const el = (id) => document.getElementById(id);

  function renderQuoteMeta() {
    el('quoteNumber').value = state.current.quoteNumber || previewQuoteNumber() + ' (on save)';
    el('quoteDate').value = state.current.date;
    el('quoteStatus').value = state.current.status;
    el('validDays').value = state.current.validDays;
  }

  function renderClient() {
    el('clientName').value = state.current.client.name;
    el('clientContact').value = state.current.client.contact;
    el('clientNotes').value = state.current.client.notes;
  }

  function renderBom() {
    const tbody = el('bomBody');
    tbody.innerHTML = '';
    state.current.bom.forEach((line, idx) => {
      const tr = document.createElement('tr');
      const lineTotal = (Number(line.qty) || 0) * (Number(line.unitPrice) || 0);
      const isCustom = !state.settings.materials.some(m => m.id === line.materialId);
      const isPalingLocked = line.materialId === 'paling' && lastCutListResult.palingsRequired > 0;
      tr.innerHTML = `
        <td>${isCustom
          ? `<input class="name-input" type="text" data-idx="${idx}" data-field="name" value="${escapeAttr(line.name)}" />`
          : escapeHtml(line.name)}</td>
        <td>${isCustom
          ? `<input type="text" data-idx="${idx}" data-field="unit" value="${escapeAttr(line.unit)}" style="min-width:60px" />`
          : escapeHtml(line.unit)}</td>
        <td><input type="number" min="0" step="0.0001" data-idx="${idx}" data-field="unitPrice" value="${line.unitPrice}" /></td>
        <td>${isPalingLocked
          ? `<div class="qty-locked"><input type="number" value="${line.qty}" disabled /><span class="qty-locked-note">from cut list</span></div>`
          : `<input type="number" min="0" step="1" data-idx="${idx}" data-field="qty" value="${line.qty}" />`}</td>
        <td class="line-total" data-total-for="${idx}">${money(lineTotal)}</td>
        <td>${isCustom ? `<button type="button" class="icon-btn" data-remove="${idx}" title="Remove item">✕</button>` : ''}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderTemplateOptions() {
    const select = el('cutListTemplate');
    const categories = [];
    CUT_LIST_TEMPLATES.forEach(t => {
      if (!categories.includes(t.category)) categories.push(t.category);
    });
    let html = '<option value="">-- Select a product --</option>';
    categories.forEach(category => {
      html += `<optgroup label="${escapeAttr(category)}">`;
      CUT_LIST_TEMPLATES.filter(t => t.category === category).forEach(t => {
        const flag = t.warning ? ' ⚠️' : '';
        html += `<option value="${escapeAttr(t.id)}">${escapeHtml(t.id)} — ${escapeHtml(t.name)}${flag}</option>`;
      });
      html += '</optgroup>';
    });
    select.innerHTML = html;
  }

  function renderTemplateNotice() {
    const container = el('cutListTemplateNotice');
    el('cutListTemplate').value = state.current.cutListTemplateId || '';
    const template = state.current.cutListTemplateId ? findCutListTemplate(state.current.cutListTemplateId) : null;
    if (template && template.warning) {
      container.innerHTML = `<div class="template-notice warning">⚠ ${escapeHtml(template.warning)}</div>`;
    } else if (template && template.note) {
      container.innerHTML = `<div class="template-notice info">${escapeHtml(template.note)}</div>`;
    } else {
      container.innerHTML = '';
    }
  }

  function loadCutListTemplate(templateId) {
    const template = findCutListTemplate(templateId);
    if (!template) return;

    if (state.current.cutList.length > 0) {
      const ok = confirm(`Replace the current cut list with ${template.id} — ${template.name}? This can't be undone.`);
      if (!ok) {
        renderTemplateNotice();
        return;
      }
    }

    state.current.cutList = template.rows.map(r => ({ id: uid(), name: r.name, length: r.length, qty: r.qty }));
    state.current.cutListTemplateId = template.id;
    renderCutListRows();
    refreshCutList();
    if (!state.priceOverridden) state.current.sellingPriceOverride = null;
    renderBom();
    renderSummary();
    renderTemplateNotice();
    saveDraft();
  }

  function renderCutListRows() {
    const tbody = el('cutListBody');
    tbody.innerHTML = '';
    (state.current.cutList || []).forEach((row, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input class="name-input" type="text" data-idx="${idx}" data-field="name" value="${escapeAttr(row.name)}" placeholder="e.g. Side panel" /></td>
        <td><input type="number" min="0" step="1" data-idx="${idx}" data-field="length" value="${row.length}" /></td>
        <td><input type="number" min="0" step="1" data-idx="${idx}" data-field="qty" value="${row.qty}" /></td>
        <td><button type="button" class="icon-btn" data-remove-cut="${idx}" title="Remove item">✕</button></td>
      `;
      tbody.appendChild(tr);
    });
  }

  function refreshCutList() {
    lastCutListResult = packCutList(state.current.cutList);

    const container = el('cutListResult');
    if (lastCutListResult.palingsRequired === 0 && lastCutListResult.warnings.length === 0) {
      container.innerHTML = '<p class="hint">Add cut list items to calculate palings required.</p>';
    } else {
      let html = '';
      if (lastCutListResult.palingsRequired > 0) {
        const label = lastCutListResult.palingsRequired === 1 ? 'paling' : 'palings';
        html += `<div class="cutlist-summary"><strong>${lastCutListResult.palingsRequired}</strong> ${label} required <span class="hint">(1800mm stock, 3mm kerf)</span></div>`;
        if (lastCutListResult.offcuts.length) {
          const offcutList = lastCutListResult.offcuts.map(o => o + 'mm').join(', ');
          html += `<div class="cutlist-offcuts">Offcuts: ${offcutList} <span class="hint">(${lastCutListResult.totalOffcut}mm total reusable)</span></div>`;
        }
      }
      lastCutListResult.warnings.forEach(w => {
        html += `<div class="cutlist-warning">${escapeHtml(w)}</div>`;
      });
      container.innerHTML = html;
    }

    const palingLine = state.current.bom.find(l => l.materialId === 'paling');
    if (palingLine && lastCutListResult.palingsRequired > 0) {
      palingLine.qty = lastCutListResult.palingsRequired;
    }
  }

  function renderLabourOverhead() {
    el('labourHours').value = state.current.labourHours;
    el('labourRate').value = state.current.labourRate;
    el('overheadPercent').value = state.current.overheadPercent;
    el('markupPercent').value = state.current.markupPercent;
  }

  function renderSummary() {
    const t = computeTotals(state.current);
    el('sumMaterials').textContent = money(t.materialsCost);
    el('sumLabour').textContent = money(t.labourCost);
    el('sumOverhead').textContent = money(t.overheadCost);
    el('sumTotalCost').textContent = money(t.totalCost);
    el('sellingPrice').value = t.sellingPrice.toFixed(2);
    el('sumProfit').textContent = money(t.profit);
    el('sumMargin').textContent = t.profitMargin.toFixed(1) + '%';
  }

  function renderQuoteForm() {
    renderQuoteMeta();
    renderClient();
    renderCutListRows();
    renderTemplateNotice();
    refreshCutList();
    renderBom();
    renderLabourOverhead();
    renderSummary();
  }

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function escapeAttr(s) { return escapeHtml(s); }

  // ---------------------------------------------------------------------
  // Quote tab: event wiring
  // ---------------------------------------------------------------------

  function newQuote() {
    state.current = blankQuote();
    state.priceOverridden = false;
    renderQuoteForm();
    saveDraft();
    el('saveStatus').textContent = '';
  }

  function bindQuoteEvents() {
    el('btnNewQuote').addEventListener('click', () => {
      if (confirm('Start a new blank quote? Unsaved changes to the current quote will be lost.')) {
        newQuote();
      }
    });

    el('quoteDate').addEventListener('change', e => { state.current.date = e.target.value; saveDraft(); });
    el('quoteStatus').addEventListener('change', e => { state.current.status = e.target.value; saveDraft(); });
    el('validDays').addEventListener('input', e => { state.current.validDays = Number(e.target.value) || 0; saveDraft(); });

    el('clientName').addEventListener('input', e => { state.current.client.name = e.target.value; saveDraft(); });
    el('clientContact').addEventListener('input', e => { state.current.client.contact = e.target.value; saveDraft(); });
    el('clientNotes').addEventListener('input', e => { state.current.client.notes = e.target.value; saveDraft(); });

    el('bomBody').addEventListener('input', e => {
      const t = e.target;
      const idx = t.dataset.idx;
      const field = t.dataset.field;
      if (idx === undefined || !field) return;
      const line = state.current.bom[idx];
      if (field === 'qty' || field === 'unitPrice') {
        line[field] = Number(t.value) || 0;
        const lineTotal = (Number(line.qty) || 0) * (Number(line.unitPrice) || 0);
        const totalCell = document.querySelector(`[data-total-for="${idx}"]`);
        if (totalCell) totalCell.textContent = money(lineTotal);
      } else {
        line[field] = t.value;
      }
      if (!state.priceOverridden) state.current.sellingPriceOverride = null;
      renderSummary();
      saveDraft();
    });

    el('bomBody').addEventListener('click', e => {
      const idx = e.target.dataset.remove;
      if (idx === undefined) return;
      state.current.bom.splice(Number(idx), 1);
      renderBom();
      renderSummary();
      saveDraft();
    });

    el('btnAddLine').addEventListener('click', () => {
      state.current.bom.push({ materialId: uid(), name: 'New item', unit: 'each', unitPrice: 0, qty: 1 });
      renderBom();
      renderSummary();
      saveDraft();
    });

    el('cutListBody').addEventListener('input', e => {
      const t = e.target;
      const idx = t.dataset.idx;
      const field = t.dataset.field;
      if (idx === undefined || !field) return;
      const row = state.current.cutList[idx];
      row[field] = (field === 'length' || field === 'qty') ? (Number(t.value) || 0) : t.value;
      refreshCutList();
      if (!state.priceOverridden) state.current.sellingPriceOverride = null;
      renderBom();
      renderSummary();
      saveDraft();
    });

    el('cutListBody').addEventListener('click', e => {
      const idx = e.target.dataset.removeCut;
      if (idx === undefined) return;
      state.current.cutList.splice(Number(idx), 1);
      renderCutListRows();
      refreshCutList();
      if (!state.priceOverridden) state.current.sellingPriceOverride = null;
      renderBom();
      renderSummary();
      saveDraft();
    });

    el('cutListTemplate').addEventListener('change', e => {
      const value = e.target.value;
      if (!value) { renderTemplateNotice(); return; }
      loadCutListTemplate(value);
    });

    el('btnAddCutItem').addEventListener('click', () => {
      state.current.cutList.push({ id: uid(), name: '', length: 0, qty: 1 });
      renderCutListRows();
      refreshCutList();
      renderBom();
      renderSummary();
      saveDraft();
    });

    ['labourHours', 'labourRate', 'overheadPercent', 'markupPercent'].forEach(id => {
      el(id).addEventListener('input', e => {
        state.current[id] = Number(e.target.value) || 0;
        if (id === 'markupPercent' || id === 'overheadPercent' || id === 'labourHours' || id === 'labourRate') {
          if (!state.priceOverridden) state.current.sellingPriceOverride = null;
        }
        renderSummary();
        saveDraft();
      });
    });

    el('sellingPrice').addEventListener('input', e => {
      state.priceOverridden = true;
      state.current.sellingPriceOverride = Number(e.target.value) || 0;
      const t = computeTotals(state.current);
      el('sumProfit').textContent = money(t.profit);
      el('sumMargin').textContent = t.profitMargin.toFixed(1) + '%';
      saveDraft();
    });

    el('btnResetPrice').addEventListener('click', () => {
      state.priceOverridden = false;
      state.current.sellingPriceOverride = null;
      renderSummary();
      saveDraft();
    });

    el('btnSaveQuote').addEventListener('click', saveCurrentQuote);
    el('btnPrintQuote').addEventListener('click', printCurrentQuote);
    el('btnCopySummary').addEventListener('click', copyCostingSummary);
  }

  function buildCostingSummaryText(quote) {
    const t = computeTotals(quote);
    const cutResult = packCutList(quote.cutList);

    const quoteNo = quote.quoteNumber || previewQuoteNumber() + ' (draft)';
    const headerLines = [
      `Quote: ${quoteNo}`,
      `Client: ${quote.client.name || '(no client name)'}`,
      `Date: ${formatDateLong(quote.date)}`,
    ];
    if (quote.client.notes) headerLines.push(`Notes: ${quote.client.notes}`);

    const cutListLines = (quote.cutList || []).map(row =>
      `${row.name || 'Unnamed part'}: ${Number(row.length) || 0}mm x ${Number(row.qty) || 0}`
    );
    const cutListText = cutListLines.length ? cutListLines.join('\n') : '(no items)';

    const palingsLines = [`Palings required: ${cutResult.palingsRequired} (1800mm stock, 3mm kerf)`];
    if (cutResult.offcuts.length) {
      const offcutList = cutResult.offcuts.map(o => o + 'mm').join(', ');
      palingsLines.push(`Offcuts: ${offcutList} (${cutResult.totalOffcut}mm total reusable)`);
    }

    const bomLines = quote.bom.filter(line => Number(line.qty) > 0);
    const bomText = bomLines
      .map(line => {
        const subtotal = (Number(line.qty) || 0) * (Number(line.unitPrice) || 0);
        return `${line.name}: ${Number(line.qty)} ${line.unit} @ ${money(line.unitPrice)} = ${money(subtotal)}`;
      })
      .join('\n');

    return [
      ...headerLines,
      '',
      'CUT LIST',
      cutListText,
      '',
      ...palingsLines,
      '',
      'BILL OF MATERIALS',
      bomText || '(no items)',
      '',
      'COSTING',
      `Direct materials: ${money(t.materialsCost)}`,
      `Labour: ${Number(quote.labourHours)}hr @ ${money(quote.labourRate)}/hr = ${money(t.labourCost)}`,
      `Workshop overhead: ${money(t.overheadCost)}`,
      `Total true cost: ${money(t.totalCost)}`,
      `Selling price: ${money(t.sellingPrice)}`,
      `Profit: ${money(t.profit)} (${t.profitMargin.toFixed(1)}%)`,
    ].join('\n');
  }

  function copyCostingSummary() {
    const text = buildCostingSummaryText(state.current);
    navigator.clipboard.writeText(text).then(() => {
      showCopyStatus('Copied!', '#2f6f4e');
    }).catch(() => {
      showCopyStatus('Could not copy — try again.', '#a4372a');
    });
  }

  function showCopyStatus(message, color) {
    const status = el('copyStatus');
    status.style.color = color;
    status.textContent = message;
    clearTimeout(showCopyStatus._timer);
    showCopyStatus._timer = setTimeout(() => { status.textContent = ''; }, 2000);
  }

  function saveCurrentQuote() {
    if (!state.current.client.name.trim()) {
      el('saveStatus').style.color = '#a4372a';
      el('saveStatus').textContent = 'Please enter a client name before saving.';
      el('clientName').focus();
      return;
    }
    assignQuoteNumberIfNeeded(state.current);
    state.current.updatedAt = new Date().toISOString();

    const idx = state.quotes.findIndex(q => q.id === state.current.id);
    if (idx >= 0) state.quotes[idx] = structuredClone(state.current);
    else state.quotes.unshift(structuredClone(state.current));

    saveQuotes(state.quotes);
    renderQuoteMeta();
    renderSavedList();

    el('saveStatus').style.color = '#2f6f4e';
    el('saveStatus').textContent = `Saved as ${state.current.quoteNumber}.`;
    setTimeout(() => { el('saveStatus').textContent = ''; }, 4000);
  }

  function printCurrentQuote() {
    const q = state.current;
    if (!q.quoteNumber) {
      // Give the customer doc a real number without permanently consuming one if not saved yet.
    }
    const t = computeTotals(q);
    const quoteNo = q.quoteNumber || previewQuoteNumber() + ' (draft)';
    const validUntil = formatDateLong(addDays(q.date, q.validDays));
    const itemsHtml = q.bom
      .filter(line => Number(line.qty) > 0)
      .map(line => `<tr><td>${escapeHtml(line.name)}</td><td>${Number(line.qty)} ${escapeHtml(line.unit)}</td></tr>`)
      .join('');
    const labourRow = Number(q.labourHours) > 0 ? `<tr><td>Labour &amp; workmanship</td><td>${Number(q.labourHours)} hr</td></tr>` : '';

    el('print-quote').innerHTML = `
      <div class="pq-header">
        <div>
          <h1>PK Woodworking</h1>
          <div>Custom timber &amp; joinery</div>
        </div>
        <div class="pq-meta">
          <div><strong>Quote:</strong> ${escapeHtml(quoteNo)}</div>
          <div><strong>Date:</strong> ${formatDateLong(q.date)}</div>
          <div><strong>Valid until:</strong> ${validUntil}</div>
        </div>
      </div>

      <div class="pq-section">
        <h3>Prepared for</h3>
        <div>${escapeHtml(q.client.name)}</div>
        <div>${escapeHtml(q.client.contact)}</div>
      </div>

      ${q.client.notes ? `<div class="pq-section"><h3>Order notes</h3><div>${escapeHtml(q.client.notes)}</div></div>` : ''}

      <div class="pq-section">
        <h3>Items</h3>
        <table class="pq-table">
          <thead><tr><th>Description</th><th>Qty</th></tr></thead>
          <tbody>${itemsHtml}${labourRow}</tbody>
        </table>
      </div>

      <div class="pq-total-row">
        <span>Total</span>
        <span>${money(t.sellingPrice)}</span>
      </div>

      <div class="pq-footer">
        <p>Thank you for choosing PK Woodworking. This quote is valid until ${validUntil}.</p>
      </div>
    `;

    window.print();
  }

  // ---------------------------------------------------------------------
  // Saved quotes tab
  // ---------------------------------------------------------------------

  function renderSavedList() {
    const term = (el('searchQuotes').value || '').trim().toLowerCase();
    const list = state.quotes.filter(q => {
      if (!term) return true;
      return (q.quoteNumber || '').toLowerCase().includes(term)
        || (q.client.name || '').toLowerCase().includes(term)
        || (q.status || '').toLowerCase().includes(term);
    });

    const container = el('savedList');
    container.innerHTML = '';

    if (list.length === 0) {
      container.innerHTML = '<p class="empty-state">No quotes found.</p>';
      return;
    }

    list.forEach(q => {
      const t = computeTotals(q);
      const div = document.createElement('div');
      div.className = 'saved-item';
      div.innerHTML = `
        <div class="saved-item-top">
          <strong>${escapeHtml(q.quoteNumber)}</strong>
          <span class="status-pill ${escapeAttr(q.status)}">${escapeHtml(q.status)}</span>
        </div>
        <div class="saved-item-meta">${escapeHtml(q.client.name || '(no client name)')} · ${formatDateLong(q.date)} · ${money(t.sellingPrice)}</div>
        <div class="saved-item-actions">
          <button type="button" class="btn btn-ghost" data-action="load" data-id="${q.id}">Open</button>
          <button type="button" class="btn btn-ghost" data-action="duplicate" data-id="${q.id}">Duplicate</button>
          <button type="button" class="btn btn-danger" data-action="delete" data-id="${q.id}">Delete</button>
        </div>
      `;
      container.appendChild(div);
    });
  }

  function bindSavedEvents() {
    el('searchQuotes').addEventListener('input', renderSavedList);

    el('savedList').addEventListener('click', e => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const id = btn.dataset.id;
      const q = state.quotes.find(q => q.id === id);
      if (!q) return;

      if (btn.dataset.action === 'load') {
        state.current = structuredClone(q);
        state.current.cutList = state.current.cutList || [];
        state.priceOverridden = q.sellingPriceOverride !== null && q.sellingPriceOverride !== undefined;
        renderQuoteForm();
        saveDraft();
        switchTab('quote');
      } else if (btn.dataset.action === 'duplicate') {
        const copy = structuredClone(q);
        copy.id = uid();
        copy.quoteNumber = '';
        copy.date = todayISO();
        copy.status = 'Draft';
        copy.createdAt = new Date().toISOString();
        copy.updatedAt = copy.createdAt;
        copy.cutList = copy.cutList || [];
        state.current = copy;
        state.priceOverridden = q.sellingPriceOverride !== null && q.sellingPriceOverride !== undefined;
        renderQuoteForm();
        saveDraft();
        switchTab('quote');
      } else if (btn.dataset.action === 'delete') {
        if (confirm(`Delete quote ${q.quoteNumber}? This cannot be undone.`)) {
          state.quotes = state.quotes.filter(x => x.id !== id);
          saveQuotes(state.quotes);
          renderSavedList();
        }
      }
    });
  }

  // ---------------------------------------------------------------------
  // Settings tab
  // ---------------------------------------------------------------------

  function renderSettingsForm() {
    el('defLabourRate').value = state.settings.labourRate;
    el('defOverheadPercent').value = state.settings.overheadPercent;
    el('defMarkupPercent').value = state.settings.markupPercent;
    el('defValidDays').value = state.settings.validDays;
    el('quotePrefix').value = state.settings.quotePrefix;
    el('quoteCounter').value = state.settings.quoteCounter;
    renderMaterialsTable();
  }

  function renderMaterialsTable() {
    const tbody = el('materialsBody');
    tbody.innerHTML = '';
    state.settings.materials.forEach((m, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="text" data-idx="${idx}" data-field="name" value="${escapeAttr(m.name)}" /></td>
        <td><input type="text" data-idx="${idx}" data-field="unit" value="${escapeAttr(m.unit)}" style="min-width:60px" /></td>
        <td><input type="number" min="0" step="0.01" data-idx="${idx}" data-field="unitPrice" value="${m.unitPrice}" /></td>
        <td><button type="button" class="icon-btn" data-remove-material="${idx}" title="Remove material">✕</button></td>
      `;
      tbody.appendChild(tr);
    });
  }

  function bindSettingsEvents() {
    const applyDefault = (field, id, parseNum = true) => {
      el(id).addEventListener('input', e => {
        state.settings[field] = parseNum ? (Number(e.target.value) || 0) : e.target.value;
        saveSettings(state.settings);
      });
    };
    applyDefault('labourRate', 'defLabourRate');
    applyDefault('overheadPercent', 'defOverheadPercent');
    applyDefault('markupPercent', 'defMarkupPercent');
    applyDefault('validDays', 'defValidDays');
    applyDefault('quotePrefix', 'quotePrefix', false);
    applyDefault('quoteCounter', 'quoteCounter');

    el('materialsBody').addEventListener('input', e => {
      const t = e.target;
      const idx = t.dataset.idx;
      const field = t.dataset.field;
      if (idx === undefined || !field) return;
      const m = state.settings.materials[idx];
      m[field] = field === 'unitPrice' ? (Number(t.value) || 0) : t.value;
      saveSettings(state.settings);
    });

    el('materialsBody').addEventListener('click', e => {
      const idx = e.target.dataset.removeMaterial;
      if (idx === undefined) return;
      state.settings.materials.splice(Number(idx), 1);
      saveSettings(state.settings);
      renderMaterialsTable();
    });

    el('btnAddMaterial').addEventListener('click', () => {
      state.settings.materials.push({ id: uid(), name: 'New material', unit: 'each', unitPrice: 0 });
      saveSettings(state.settings);
      renderMaterialsTable();
    });

    el('btnExport').addEventListener('click', exportBackup);
    el('btnImport').addEventListener('click', () => el('importFile').click());
    el('importFile').addEventListener('change', importBackup);
  }

  function exportBackup() {
    const payload = { settings: state.settings, quotes: state.quotes, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pk-woodworking-backup-${todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importBackup(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data.quotes || !data.settings) throw new Error('Invalid backup file');
        if (!confirm('This will replace all current quotes and settings on this device. Continue?')) return;
        state.settings = Object.assign(structuredClone(DEFAULT_SETTINGS), data.settings);
        state.quotes = data.quotes;
        saveSettings(state.settings);
        saveQuotes(state.quotes);
        renderSettingsForm();
        renderSavedList();
        alert('Backup imported successfully.');
      } catch (err) {
        alert('Could not import file: ' + err.message);
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  }

  // ---------------------------------------------------------------------
  // Tabs
  // ---------------------------------------------------------------------

  function switchTab(name) {
    document.querySelectorAll('.tab-btn').forEach(b => {
      const active = b.dataset.tab === name;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('.tab-panel').forEach(p => {
      p.classList.toggle('active', p.id === 'tab-' + name);
    });
  }

  function bindTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
  }

  // ---------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------

  function init() {
    const draft = loadDraft();
    state.current = draft || blankQuote();
    state.current.cutList = state.current.cutList || [];
    state.priceOverridden = state.current.sellingPriceOverride !== null && state.current.sellingPriceOverride !== undefined;

    bindTabs();
    bindQuoteEvents();
    bindSavedEvents();
    bindSettingsEvents();

    renderTemplateOptions();
    renderQuoteForm();
    renderSavedList();
    renderSettingsForm();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
