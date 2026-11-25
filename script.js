// ==========================================
// SOVEREIGN ENTERPRISE LEDGER ENGINE
// ==========================================

const STORAGE_KEY = 'partner_ledger_transactions';
const GH_CONFIG_KEY = 'sovereign_ledger_github_config';

const DEFAULT_TRANSACTIONS = [
  {
    id: 'TXN_1793260800001',
    partner: 'Minister hi tech park (DEAL002905)',
    type: 'Bill',
    amount: 500000.00,
    description: 'Initial Invoice / Bill',
    date: '2026-11-01'
  },
  {
    id: 'TXN_1793260800002',
    partner: 'Minister hi tech park (DEAL002905)',
    type: 'Credit',
    amount: 200000.00,
    description: 'Payment Received',
    date: '2026-11-05'
  },
  {
    id: 'TXN_1793260800003',
    partner: 'BUTTERFLY MARKETING LIMITED (3000002272)',
    type: 'Bill',
    amount: 1200000.00,
    description: 'Batch Purchase Order',
    date: '2026-11-10'
  },
  {
    id: 'TXN_1793260800004',
    partner: 'BUTTERFLY MARKETING LIMITED (3000002272)',
    type: 'Credit',
    amount: 1000000.00,
    description: 'Cheque Payment',
    date: '2026-11-20'
  }
];

let transactions = loadTransactions();
let pendingDeleteId = null;

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_TRANSACTIONS];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...DEFAULT_TRANSACTIONS];
  } catch (err) {
    console.error('Failed to read transactions from localStorage:', err);
    return [...DEFAULT_TRANSACTIONS];
  }
}

function saveToLocalStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function loadGithubConfig() {
  try {
    const raw = localStorage.getItem(GH_CONFIG_KEY);
    return raw ? JSON.parse(raw) : {
      owner: '',
      repo: '',
      branch: 'main',
      path: 'data/ledger-data.json',
      token: ''
    };
  } catch (err) {
    return {
      owner: '',
      repo: '',
      branch: 'main',
      path: 'data/ledger-data.json',
      token: ''
    };
  }
}

function saveGithubConfig(cfg) {
  localStorage.setItem(GH_CONFIG_KEY, JSON.stringify(cfg));
}

function showBanner(message, type = 'info') {
  const banner = document.getElementById('status-banner');
  if (!banner) return;

  const styles = {
    info: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    error: 'bg-rose-500/10 border-rose-500/30 text-rose-300'
  };

  banner.className = `mb-6 px-4 py-3 rounded-xl text-sm font-medium border flex items-center justify-between gap-4 ${styles[type] || styles.info}`;
  banner.innerHTML = `
    <span>${escapeHtml(message)}</span>
    <button type="button" onclick="hideBanner()" class="text-xs opacity-75 hover:opacity-100 font-semibold">Dismiss</button>
  `;
  banner.classList.remove('hidden');
}

function hideBanner() {
  const banner = document.getElementById('status-banner');
  if (banner) banner.classList.add('hidden');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

window.addEventListener('DOMContentLoaded', () => {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  const dateInput = document.getElementById('form-date');
  if (dateInput && !dateInput.value) {
    dateInput.value = getTodayDate();
  }

  renderDashboard();

  const partnerFilter = document.getElementById('partner-filter');
  const searchQuery = document.getElementById('search-query');
  const transactionForm = document.getElementById('transaction-form');
  const openConfigBtn = document.getElementById('open-config-btn');
  const closeConfigBtn = document.getElementById('close-config-btn');
  const clearConfigBtn = document.getElementById('clear-config-btn');
  const githubConfigForm = document.getElementById('github-config-form');
  const syncGithubBtn = document.getElementById('sync-github-btn');

  if (partnerFilter) partnerFilter.addEventListener('change', renderDashboard);
  if (searchQuery) searchQuery.addEventListener('input', renderDashboard);
  if (transactionForm) transactionForm.addEventListener('submit', addTransaction);
  if (openConfigBtn) openConfigBtn.addEventListener('click', openGithubModal);
  if (closeConfigBtn) closeConfigBtn.addEventListener('click', closeGithubModal);
  if (clearConfigBtn) clearConfigBtn.addEventListener('click', clearGithubConfig);
  if (githubConfigForm) githubConfigForm.addEventListener('submit', handleGithubConfigSubmit);
  if (syncGithubBtn) syncGithubBtn.addEventListener('click', syncWithGithub);
});

function renderDashboard() {
  const partnerFilterEl = document.getElementById('partner-filter');
  const searchQueryEl = document.getElementById('search-query');
  const tbody = document.getElementById('transaction-table-body');

  if (!tbody) return;

  const selectedPartner = partnerFilterEl ? partnerFilterEl.value : 'All';
  const searchQuery = searchQueryEl ? searchQueryEl.value.trim().toLowerCase() : '';

  const filtered = transactions.filter(t => {
    const matchesPartner = selectedPartner === 'All' || t.partner === selectedPartner;
    const matchesSearch =
      !searchQuery ||
      String(t.description || '').toLowerCase().includes(searchQuery) ||
      String(t.id || '').toLowerCase().includes(searchQuery) ||
      String(t.partner || '').toLowerCase().includes(searchQuery) ||
      String(t.type || '').toLowerCase().includes(searchQuery);
    return matchesPartner && matchesSearch;
  });

  let totalSales = 0;
  let totalCredit = 0;
  let totalDebit = 0;

  filtered.forEach(t => {
    const amt = Number(t.amount) || 0;
    if (t.type === 'Bill') totalSales += amt;
    else if (t.type === 'Credit') totalCredit += amt;
    else if (t.type === 'Debit') totalDebit += amt;
  });

  const totalDue = totalSales - totalCredit + totalDebit;

  updateElementText('total-sales', `৳${totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  updateElementText('total-credit', `৳${totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  updateElementText('total-debit', `৳${totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  updateElementText('total-due', `৳${totalDue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-slate-500 font-sans">No ledger entries found.</td></tr>`;
    return;
  }

  const sortedChronological = [...filtered].sort((a, b) => {
    const dateDiff = new Date(a.date) - new Date(b.date);
    if (dateDiff !== 0) return dateDiff;
    return String(a.id).localeCompare(String(b.id));
  });

  let runningDue = 0;
  const balanceMap = {};

  sortedChronological.forEach(t => {
    const amt = Number(t.amount) || 0;
    if (t.type === 'Bill') runningDue += amt;
    else if (t.type === 'Credit') runningDue -= amt;
    else if (t.type === 'Debit') runningDue += amt;
    balanceMap[t.id] = runningDue;
  });

  const displayList = [...filtered].sort((a, b) => {
    const dateDiff = new Date(b.date) - new Date(a.date);
    if (dateDiff !== 0) return dateDiff;
    return String(b.id).localeCompare(String(a.id));
  });

  tbody.innerHTML = displayList.map((t) => {
    const currentRunningDue = balanceMap[t.id] ?? 0;
    const badgeClass =
      t.type === 'Bill' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
      t.type === 'Credit' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
      'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';

    const safeId = escapeHtml(t.id);
    const isConfirming = pendingDeleteId === t.id;

    const actionHtml = isConfirming
      ? `<div class="inline-flex items-center gap-1.5">
           <button type="button" onclick="confirmDelete('${safeId}')" class="text-white bg-rose-600 hover:bg-rose-500 px-2 py-1 rounded text-xs font-semibold">Confirm</button>
           <button type="button" onclick="cancelDelete()" class="text-slate-300 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-xs font-semibold">Cancel</button>
         </div>`
      : `<button type="button" onclick="requestDelete('${safeId}')" class="text-rose-400 hover:text-rose-300 px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 font-sans text-xs transition-all">Delete</button>`;

    return `
      <tr class="hover:bg-slate-800/30 transition-colors border-b border-slate-800/50">
        <td class="py-3 px-4 font-bold text-indigo-400">${safeId}</td>
        <td class="py-3 px-4 font-sans text-xs font-semibold text-slate-300">${escapeHtml(t.partner)}</td>
        <td class="py-3 px-4">
          <span class="px-2 py-0.5 rounded-full font-semibold text-xs ${badgeClass}">${escapeHtml(t.type)}</span>
        </td>
        <td class="py-3 px-4 font-bold text-slate-200">৳${(Number(t.amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td class="py-3 px-4 font-bold text-rose-400">৳${currentRunningDue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td class="py-3 px-4 font-sans text-slate-400">${escapeHtml(t.description || '')}</td>
        <td class="py-3 px-4 text-slate-500 text-xs">${escapeHtml(t.date || '')}</td>
        <td class="py-3 px-4 text-right">${actionHtml}</td>
      </tr>
    `;
  }).join('');

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function updateElementText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}

function addTransaction(e) {
  e.preventDefault();
  const partner = document.getElementById('form-partner').value;
  const type = document.getElementById('form-type').value;
  const amount = parseFloat(document.getElementById('form-amount').value);
  const date = document.getElementById('form-date').value || getTodayDate();
  const description = document.getElementById('form-desc').value.trim();

  if (!partner || !type || isNaN(amount) || amount <= 0) {
    showBanner('Please select a partner/type and enter a valid positive amount.', 'error');
    return;
  }

  const uniqueSuffix = Math.floor(Math.random() * 1000);
  const newTxn = {
    id: `TXN_${Date.now()}_${uniqueSuffix}`,
    partner,
    type,
    amount,
    description: description || 'General Transaction',
    date
  };

  transactions.unshift(newTxn);
  saveToLocalStorage();
  document.getElementById('transaction-form').reset();
  document.getElementById('form-date').value = getTodayDate();
  renderDashboard();
  showBanner(`Added transaction ${newTxn.id} (${newTxn.type} - ৳${amount.toFixed(2)}).`, 'success');
}

function requestDelete(id) {
  pendingDeleteId = id;
  renderDashboard();
}

function cancelDelete() {
  pendingDeleteId = null;
  renderDashboard();
}

function confirmDelete(id) {
  transactions = transactions.filter(t => t.id !== id);
  pendingDeleteId = null;
  saveToLocalStorage();
  renderDashboard();
  showBanner(`Deleted transaction ${id}.`, 'info');
}

// ==========================================
// GITHUB API SYNCHRONIZATION ENGINE
// ==========================================

function openGithubModal() {
  const cfg = loadGithubConfig();
  document.getElementById('gh-owner').value = cfg.owner || '';
  document.getElementById('gh-repo').value = cfg.repo || '';
  document.getElementById('gh-branch').value = cfg.branch || 'main';
  document.getElementById('gh-path').value = cfg.path || 'data/ledger-data.json';
  document.getElementById('gh-token').value = cfg.token || '';

  const modal = document.getElementById('github-modal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeGithubModal() {
  const modal = document.getElementById('github-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function handleGithubConfigSubmit(e) {
  e.preventDefault();
  const cfg = {
    owner: document.getElementById('gh-owner').value.trim(),
    repo: document.getElementById('gh-repo').value.trim(),
    branch: document.getElementById('gh-branch').value.trim() || 'main',
    path: document.getElementById('gh-path').value.trim() || 'data/ledger-data.json',
    token: document.getElementById('gh-token').value.trim()
  };
  saveGithubConfig(cfg);
  closeGithubModal();
  showBanner('GitHub API configuration saved locally.', 'success');
}

function clearGithubConfig() {
  localStorage.removeItem(GH_CONFIG_KEY);
  document.getElementById('gh-owner').value = '';
  document.getElementById('gh-repo').value = '';
  document.getElementById('gh-branch').value = 'main';
  document.getElementById('gh-path').value = 'data/ledger-data.json';
  document.getElementById('gh-token').value = '';
  showBanner('Saved GitHub API credentials cleared.', 'info');
}

function encodeBase64Utf8(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function syncWithGithub() {
  const cfg = loadGithubConfig();
  if (!cfg.owner || !cfg.repo || !cfg.token) {
    showBanner('Please configure GitHub Owner, Repository, and Personal Access Token first.', 'error');
    openGithubModal();
    return;
  }

  const branch = cfg.branch || 'main';
  const filePath = (cfg.path || 'data/ledger-data.json').replace(/^\/+/, '');
  const apiUrl = `https://api.github.com/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/${filePath}`;

  showBanner('Syncing ledger data with GitHub API...', 'info');

  try {
    let sha = null;
    const getRes = await fetch(`${apiUrl}?ref=${encodeURIComponent(branch)}`, {
      headers: {
        'Authorization': `Bearer ${cfg.token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    if (getRes.ok) {
      const existingFile = await getRes.json();
      sha = existingFile.sha;
    } else if (getRes.status !== 404) {
      const errData = await getRes.json().catch(() => ({}));
      throw new Error(errData.message || `GitHub GET failed (${getRes.status})`);
    }

    const payloadObj = {
      updatedAt: new Date().toISOString(),
      currency: 'BDT',
      transactions
    };
    const contentBase64 = encodeBase64Utf8(JSON.stringify(payloadObj, null, 2));

    const putBody = {
      message: `Sync Sovereign Enterprise Ledger (${new Date().toISOString()})`,
      content: contentBase64,
      branch
    };
    if (sha) {
      putBody.sha = sha;
    }

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${cfg.token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(putBody)
    });

    if (!putRes.ok) {
      const errData = await putRes.json().catch(() => ({}));
      throw new Error(errData.message || `GitHub PUT failed (${putRes.status})`);
    }

    showBanner(`Synced ${transactions.length} transactions to ${cfg.owner}/${cfg.repo} (${filePath}).`, 'success');
  } catch (err) {
    showBanner(`GitHub sync failed: ${err.message}`, 'error');
  }
}
