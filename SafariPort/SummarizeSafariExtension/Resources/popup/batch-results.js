// Batch Summaries Tab — Glassmorphic Bento Box Results Dashboard
// Handles: tab switching, results rendering, sorting, thumbnails, progress animation, export

(function() {
  'use strict';

  const STORAGE_KEY = 'bm_batch_results';
  const MAX_THUMBNAIL_SIZE = 80;

  // State
  let results = [];
  let currentSort = 'chrono';
  let sortDirection = 'asc';
  let activeTab = 'summarize'; // 'summarize' | 'batch'

  // DOM Elements
  let batchTabBtn, batchPanel, batchTable, batchTbody, batchEmpty, batchStats;
  let batchSortSelect, batchExportBtn, batchCloseBtn;

  // Initialize
  function init() {
    cacheElements();
    bindEvents();
    loadResults();
    restoreSortPreference();
  }

  function cacheElements() {
    batchTabBtn = document.getElementById('batch-tab-btn');
    batchPanel = document.getElementById('batch-panel');
    batchTable = document.getElementById('batch-table');
    batchTbody = document.getElementById('batch-tbody');
    batchEmpty = document.getElementById('batch-empty');
    batchStats = document.getElementById('batch-stats');
    batchSortSelect = document.getElementById('batch-sort-select');
    batchExportBtn = document.getElementById('batch-export-btn');
    batchCloseBtn = document.getElementById('batch-close-btn');
  }

  function bindEvents() {
    // Tab switching
    if (batchTabBtn) {
      batchTabBtn.addEventListener('click', () => switchTab('batch'));
    }
    if (batchCloseBtn) {
      batchCloseBtn.addEventListener('click', () => switchTab('summarize'));
    }

    // Sorting
    if (batchSortSelect) {
      batchSortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        saveSortPreference();
        renderTable();
      });
    }

    // Table header sorting
    if (batchTable) {
      batchTable.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', (e) => {
          if (e.target.closest('.sort-btn')) return; // handled by select
          const sortKey = th.dataset.sort;
          if (currentSort === sortKey) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
          } else {
            currentSort = sortKey;
            sortDirection = 'asc';
          }
          renderTable();
        });
      });
    }

    // Export
    if (batchExportBtn) {
      batchExportBtn.addEventListener('click', exportCSV);
    }

    // Retry buttons (delegated)
    if (batchTbody) {
      batchTbody.addEventListener('click', (e) => {
        const retryBtn = e.target.closest('.btn-retry');
        if (retryBtn) {
          const row = retryBtn.closest('tr');
          const index = parseInt(row.dataset.index, 10);
          retryItem(index);
        }
      });
    }

    // Keyboard navigation for tab switching
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        switchTab(activeTab === 'batch' ? 'summarize' : 'batch');
      }
    });
  }

  // Tab Switching
  function switchTab(tab) {
    const isBatch = tab === 'batch';
    activeTab = tab;

    // Update tab buttons
    document.querySelectorAll('[role="tab"]').forEach(btn => {
      const isBatchBtn = btn.id === 'batch-tab-btn';
      btn.setAttribute('aria-selected', isBatch && isBatchBtn || !isBatch && !isBatchBtn);
    });

    // Show/hide panels
    const mainPanel = document.querySelector('.bm-app, main[role="main"], #app');
    if (batchPanel) {
      batchPanel.hidden = !isBatch;
      batchPanel.setAttribute('aria-hidden', !isBatch);
    }

    if (isBatch) {
      renderTable();
      updateStats();
    }

    // Notify background for analytics
    chrome.runtime.sendMessage({ type: 'BM_TAB_SWITCH', tab });
  }

  // Load results from storage
  function loadResults() {
    return new Promise(resolve => {
      chrome.storage.local.get(STORAGE_KEY, data => {
        results = data[STORAGE_KEY] || [];
        resolve();
      });
    });
  }

  // Save results to storage
  function saveResults() {
    chrome.storage.local.set({ [STORAGE_KEY]: results });
  }

  // Save sort preference
  function saveSortPreference() {
    chrome.storage.local.set({ batchSortMode: currentSort, batchSortDirection: sortDirection });
  }

  function restoreSortPreference() {
    chrome.storage.local.get(['batchSortMode', 'batchSortDirection'], data => {
      if (data.batchSortMode) {
        currentSort = data.batchSortMode;
        if (batchSortSelect) batchSortSelect.value = currentSort;
      }
      if (data.batchSortDirection) {
        sortDirection = data.batchSortDirection;
      }
    });
  }

  // Add new result (called from background)
  window.bmBatchAddResult = function(result) {
    // Check for duplicate
    const existingIndex = results.findIndex(r => r.tabId === result.tabId && r.url === result.url);
    if (existingIndex >= 0) {
      results[existingIndex] = { ...results[existingIndex], ...result };
    } else {
      results.unshift(result); // Newest first
    }
    saveResults();
    if (activeTab === 'batch') {
      renderTable();
      updateStats();
    }
    showToast(`${result.title?.slice(0, 40)}... summarized`, 'success');
  };

  // Update result (progress, completion, error)
  window.bmBatchUpdateResult = function(tabId, update) {
    const index = results.findIndex(r => r.tabId === tabId);
    if (index >= 0) {
      results[index] = { ...results[index], ...update, updatedAt: Date.now() };
      saveResults();
      if (activeTab === 'batch') {
        renderRow(index);
        updateStats();
      }
    }
  };

  // Generate thumbnail from URL
  async function generateThumbnail(url) {
    try {
      // Use a screenshot service or capture from tab
      // For now, use a favicon-based placeholder with domain colors
      const domain = new URL(url).hostname.replace('www.', '');
      return generateFaviconThumbnail(domain);
    } catch {
      return generateFaviconThumbnail('default');
    }
  }

  function generateFaviconThumbnail(domain) {
    // Create a canvas with domain-based color and favicon
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');

    // Generate deterministic color from domain
    let hash = 0;
    for (let i = 0; i < domain.length; i++) {
      hash = ((hash << 5) - hash) + domain.charCodeAt(i);
      hash |= 0;
    }
    const hue = Math.abs(hash) % 360;
    const bgColor = `hsl(${hue}, 55%, 18%)`;
    const accentColor = `hsl(${hue}, 65%, 45%)`;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 160, 100);
    gradient.addColorStop(0, bgColor);
    gradient.addColorStop(1, accentColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 160, 100);

    // Subtle pattern
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (let x = 0; x < 160; x += 20) {
      for (let y = 0; y < 100; y += 20) {
        ctx.fillRect(x, y, 2, 2);
      }
    }

    // Favicon area
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.roundRect(10, 10, 32, 32, 6);
    ctx.fill();

    // Try to load actual favicon
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 14, 14, 24, 24);
    };
    img.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

    // Domain text
    ctx.font = '500 11px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.textAlign = 'right';
    ctx.fillText(domain.slice(0, 25), 150, 85);

    return canvas.toDataURL('image/png');
  }

  // Sort results
  function sortResults(arr) {
    const sorted = [...arr];
    const dir = sortDirection === 'asc' ? 1 : -1;

    sorted.sort((a, b) => {
      let comparison = 0;
      switch (currentSort) {
        case 'chrono':
          comparison = (a.startedAt || 0) - (b.startedAt || 0);
          break;
        case 'az':
          comparison = (a.title || '').localeCompare(b.title || '');
          break;
        case 'usage':
          comparison = (b.accessCount || 0) - (a.accessCount || 0);
          break;
      }
      return comparison * dir;
    });

    return sorted;
  }

  // Format timestamp
  function formatTimestamp(ts) {
    if (!ts) return '—';
    const date = new Date(ts);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  // Format duration
  function formatDuration(ms) {
    if (!ms) return '—';
    const sec = Math.round(ms / 1000);
    if (sec < 60) return `${sec}s`;
    const min = Math.floor(sec / 60);
    const rem = sec % 60;
    return rem > 0 ? `${min}m ${rem}s` : `${min}m`;
  }

  // Render table
  function renderTable() {
    if (!batchTbody) return;

    const sorted = sortResults(results);
    
    if (sorted.length === 0) {
      batchTable.hidden = true;
      batchEmpty.hidden = false;
      return;
    }

    batchTable.hidden = false;
    batchEmpty.hidden = true;

    batchTbody.innerHTML = sorted.map((item, index) => renderRowHtml(item, index)).join('');
    
    // Animate progress bars
    requestAnimationFrame(() => {
      batchTbody.querySelectorAll('.progress-fill').forEach((fill, i) => {
        const item = sorted[i];
        const progress = item.progress || 0;
        setTimeout(() => {
          fill.style.width = `${progress}%`;
          if (progress >= 100) {
            fill.classList.add('complete');
          } else if (item.error) {
            fill.classList.add('error');
          }
        }, i * 50);
      });
    });
  }

  // Render single row
  function renderRowHtml(item, index) {
    const isLoading = item.status === 'loading' || (!item.error && !item.summary && !item.error);
    const isComplete = item.summary && !item.error;
    const isError = !!item.error;
    const progress = item.progress || 0;
    const startedAt = item.startedAt || Date.now();
    const duration = item.completedAt ? item.completedAt - startedAt : Date.now() - startedAt;
    const thumbnail = item.thumbnail || generateFaviconThumbnail(new URL(item.url).hostname);

    return `
      <tr class="batch-row ${isLoading ? 'loading' : ''} ${isComplete ? 'complete' : ''} ${isError ? 'error' : ''}" 
          data-index="${index}" data-url="${escapeHtml(item.url)}">
        <td class="col-time">
          <span title="${new Date(startedAt).toISOString()}">${formatTimestamp(startedAt)}</span>
          <span class="duration" title="Duration">${formatDuration(duration)}</span>
        </td>
        <td class="col-preview">
          <div class="thumb-wrapper" title="${escapeHtml(item.title)}">
            ${item.thumbnailData ? 
              `<img class="thumb-img" src="${item.thumbnailData}" alt="" loading="lazy">` :
              `<div class="thumb-loading">📸</div>`
            }
            <div class="status-badge ${isLoading ? 'loading' : isComplete ? 'complete' : isError ? 'error' : ''}">
              ${isLoading ? '⏳' : isComplete ? '✓' : isError ? '✗' : '⏳'}
            </div>
          </div>
        </td>
        <td class="col-url">
          <div class="url-cell">
            <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="url-link">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              <span class="url-text">${escapeHtml(new URL(item.url).hostname)}</span>
            </a>
            <span class="url-domain">${escapeHtml(item.title?.slice(0, 50) || '')}</span>
          </div>
        </td>
        <td class="col-summary">
          <div class="summary-cell">
            <div class="summary-title">${escapeHtml(item.title || 'Untitled')}</div>
            ${isLoading ? 
              `<div class="summary-text loading">Summarizing… ${item.progress || 0}%</div>` :
              isError ?
              `<div class="summary-text error">❌ ${escapeHtml(item.error || 'Failed to summarize')}</div>` :
              `<div class="summary-text">${escapeHtml(item.summary?.slice(0, 300) || 'No summary')}</div>`
            }
          </div>
        </td>
        <td class="col-progress">
          <div class="progress-bar-cell">
            <div class="progress-track" role="progressbar" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100" aria-label="Summarization progress">
              <div class="progress-fill ${isComplete ? 'complete' : ''} ${isError ? 'error' : ''}" style="width: ${progress}%"></div>
            </div>
            <span class="progress-label">${progress}% · ${formatDuration(duration)}</span>
          </div>
        </td>
        <td class="col-actions">
          <div class="action-btn-cell">
            ${isError ? 
              `<button class="btn-icon btn-retry" title="Retry" aria-label="Retry summarization">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/></svg>
              </button>` :
              isComplete ?
              `<button class="btn-icon" title="Open original" aria-label="Open original page">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </button>` :
              ''
            }
            <button class="btn-icon" title="Copy summary" aria-label="Copy summary to clipboard">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  // Render single row (for updates)
  function renderRow(index) {
    if (!batchTbody) return;
    const row = batchTbody.querySelector(`tr[data-index="${index}"]`);
    if (!row) return;
    const item = sortResults(results)[index];
    if (!item) return;

    const progress = item.progress || 0;
    const duration = item.completedAt ? item.completedAt - (item.startedAt || Date.now()) : Date.now() - (item.startedAt || Date.now());
    const isComplete = item.summary && !item.error;
    const isError = !!item.error;

    row.className = `batch-row ${item.status === 'loading' ? 'loading' : ''} ${isComplete ? 'complete' : ''} ${isError ? 'error' : ''}`;

    // Update progress
    const fill = row.querySelector('.progress-fill');
    if (fill) {
      fill.style.width = `${progress}%`;
      fill.classList.toggle('complete', isComplete);
      fill.classList.toggle('error', isError);
    }

    // Update summary text
    const summaryEl = row.querySelector('.summary-text');
    if (summaryEl) {
      if (item.status === 'loading') {
        summaryEl.textContent = `Summarizing… ${progress}%`;
        summaryEl.className = 'summary-text loading';
      } else if (isError) {
        summaryEl.textContent = `❌ ${item.error || 'Failed to summarize'}`;
        summaryEl.className = 'summary-text error';
      } else {
        summaryEl.textContent = item.summary?.slice(0, 300) || 'No summary';
        summaryEl.className = 'summary-text';
      }
    }

    // Update status badge
    const badge = row.querySelector('.status-badge');
    if (badge) {
      badge.className = `status-badge ${isLoading ? 'loading' : isComplete ? 'complete' : isError ? 'error' : 'loading'}`;
      badge.innerHTML = isLoading ? '⏳' : isComplete ? '✓' : isError ? '✗' : '⏳';
    }

    // Update progress label
    const label = row.querySelector('.progress-label');
    if (label) {
      label.textContent = `${progress}% · ${formatDuration(duration)}`;
    }

    // Update actions
    const actionsCell = row.querySelector('.action-btn-cell');
    if (actionsCell) {
      if (isError) {
        actionsCell.innerHTML = `
          <button class="btn-icon btn-retry" title="Retry" aria-label="Retry summarization">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/></svg>
          </button>
          <button class="btn-icon" title="Copy summary" aria-label="Copy summary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
        `;
      } else if (isComplete) {
        actionsCell.innerHTML = `
          <button class="btn-icon" title="Open original" aria-label="Open original">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </button>
          <button class="btn-icon" title="Copy summary" aria-label="Copy summary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
        `;
      }
    }
  }

  // Update stats bar
  function updateStats() {
    const total = results.length;
    const success = results.filter(r => r.summary && !r.error).length;
    const errors = results.filter(r => r.error).length;
    const windows = new Set(results.map(r => r.windowId).filter(Boolean)).size;

    const els = {
      total: document.getElementById('batch-total'),
      success: document.getElementById('batch-success'),
      errors: document.getElementById('batch-errors'),
      windows: document.getElementById('batch-windows')
    };

    if (els.total) els.total.textContent = total;
    if (els.success) els.success.textContent = success;
    if (els.errors) els.errors.textContent = errors;
    if (els.windows) els.windows.textContent = windows;
  }

  // Retry failed item
  async function retryItem(index) {
    const sorted = sortResults(results);
    const item = sorted[index];
    if (!item || !item.error) return;

    // Reset item for retry
    item.error = null;
    item.summary = null;
    item.progress = 0;
    item.status = 'loading';
    item.startedAt = Date.now();
    saveResults();

    renderRow(index);
    updateStats();

    // Request background to re-process
    chrome.runtime.sendMessage({
      type: 'BM_BATCH_RETRY',
      tabId: item.tabId,
      url: item.url,
      title: item.title
    });
  }

  // Export to CSV
  function exportCSV() {
    if (results.length === 0) {
      showToast('No results to export', 'info');
      return;
    }

    const sorted = sortResults(results);
    const headers = ['Timestamp', 'Title', 'URL', 'Duration', 'Status', 'Summary'];
    const rows = sorted.map(r => [
      formatTimestamp(r.startedAt),
      `"${(r.title || '').replace(/"/g, '""')}"`,
      r.url,
      formatDuration(r.completedAt ? r.completedAt - (r.startedAt || 0) : Date.now() - (r.startedAt || 0)),
      r.error ? 'Failed' : r.summary ? 'Success' : 'In Progress',
      `"${(r.summary || r.error || '').replace(/"/g, '""').slice(0, 500)}"`
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    chrome.downloads.download({
      url,
      filename: `batch-summaries-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`,
      saveAs: true
    });

    URL.revokeObjectURL(url);
    showToast('Export started', 'success');
  }

  // Toast notifications
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 200);
    }, 4000);
  }

  function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
  }

  // Utility
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Listen for messages from background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'BM_BATCH_RESULT') {
      window.bmBatchAddResult(message.result);
      sendResponse({ success: true });
    } else if (message.type === 'BM_BATCH_UPDATE') {
      window.bmBatchUpdateResult(message.tabId, message.update);
      sendResponse({ success: true });
    } else if (message.type === 'BM_BATCH_CLEAR') {
      results = [];
      saveResults();
      renderTable();
      updateStats();
      sendResponse({ success: true });
    }
    return true;
  });

  // Initialize when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();