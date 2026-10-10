// Batch Summarization Module
// Handles context menus, batch processing via ChatGPT web interface, and results tab

const BM_BATCH = {
  // Context menu IDs
  MENU_IDS: {
    PRESERVE_WINDOW: "bm-batch-preserve-window",
    CLOSE_WINDOW: "bm-batch-close-window",
    PRESERVE_ALL: "bm-batch-preserve-all",
    CLOSE_ALL: "bm-batch-close-all",
    EXCEPT_THIS: "bm-batch-except-this"
  },

  // Initialize context menus
  initContextMenus() {
    const menus = [
      {
        id: this.MENU_IDS.PRESERVE_WINDOW,
        title: "📋 Batch Summarize All Tabs in This Window (Preserve)",
        contexts: ["action"]
      },
      {
        id: this.MENU_IDS.CLOSE_WINDOW,
        title: "📋 Batch Summarize All Tabs in This Window (Close After)",
        contexts: ["action"]
      },
      {
        id: this.MENU_IDS.PRESERVE_ALL,
        title: "📋 Batch Summarize All Tabs in All Windows (Preserve)",
        contexts: ["action"]
      },
      {
        id: this.MENU_IDS.CLOSE_ALL,
        title: "📋 Batch Summarize All Tabs in All Windows (Close After)",
        contexts: ["action"]
      },
      {
        id: this.MENU_IDS.EXCEPT_THIS,
        title: "📋 Batch Summarize All Tabs Except This One",
        contexts: ["action"]
      }
    ];

    menus.forEach(menu => {
      try {
        chrome.contextMenus.create(menu);
      } catch (e) {
        console.log("Context menu already exists:", menu.id);
      }
    });
  },

  // Get tabs based on menu action
  async getTabsForAction(actionId) {
    const windows = await chrome.windows.getAll({ populate: true });
    let tabs = [];

    switch (actionId) {
      case this.MENU_IDS.PRESERVE_WINDOW:
      case this.MENU_IDS.CLOSE_WINDOW: {
        const currentWindow = await chrome.windows.getCurrent();
        const windowTabs = windows.find(w => w.id === currentWindow.id)?.tabs || [];
        tabs = windowTabs.filter(t => !t.discarded && t.url && !t.url.startsWith("chrome://"));
        break;
      }
      case this.MENU_IDS.PRESERVE_ALL:
      case this.MENU_IDS.CLOSE_ALL: {
        tabs = windows.flatMap(w => (w.tabs || []).filter(t => !t.discarded && t.url && !t.url.startsWith("chrome://")));
        break;
      }
      case this.MENU_IDS.EXCEPT_THIS: {
        const currentTab = (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
        tabs = windows.flatMap(w => (w.tabs || []).filter(t => 
          !t.discarded && t.url && !t.url.startsWith("chrome://") && t.id !== currentTab.id
        ));
        break;
      }
    }

    return { tabs, shouldClose: [this.MENU_IDS.CLOSE_WINDOW, this.MENU_IDS.CLOSE_ALL].includes(actionId) };
  },

  // Get sorting preference
  async getSortPreference() {
    return new Promise(resolve => {
      chrome.storage.local.get("batchSortMode", ({ batchSortMode }) => {
        resolve(batchSortMode || "chrono"); // "az", "usage", "chrono"
      });
    });
  },

  // Sort tabs based on preference
  sortTabs(tabs, mode) {
    const sorted = [...tabs];
    switch (mode) {
      case "az":
        return sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      case "usage":
        // Sort by last accessed (would need storage tracking)
        return sorted.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
      case "chrono":
      default:
        return sorted; // Already in window/tab order
    }
  },

  // Extract content from a tab using content script
  async extractTabContent(tabId) {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, { type: "GET_PAGE_INFO", to: "content-script" }, response => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else if (response) {
          resolve({
            tabId,
            title: response.title,
            url: response.url,
            textContent: response.textContent,
            subtitles: response.subtitles
          });
        } else {
          resolve({ tabId, title: "", url: "", textContent: "", subtitles: null });
        }
      });
      
      // Timeout fallback
      setTimeout(() => reject(new Error("Timeout extracting content")), 10000);
    });
  },

  // Send to ChatGPT web interface for summarization
  async summarizeWithChatGPT(content, title, url) {
    const prompt = this.buildSummaryPrompt(content, title);
    
    // Check if user is logged into chatgpt.com
    const isLoggedIn = await this.checkChatGPTLogin();
    if (!isLoggedIn) {
      throw new Error("Please log in to chatgpt.com first");
    }

    // Use the existing ChatGPT web interface handler in background
    return new Promise((resolve, reject) => {
      // Use the existing provider handler (ChatGPT web interface)
      chrome.runtime.sendMessage({
        type: "SUMMARIZE_BATCH_ITEM",
        data: { prompt, title, url }
      }, response => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.summary);
        }
      });
    });
  },

  buildSummaryPrompt(content, title) {
    return `You are an expert summarizer. Summarize the following content from "${title}" in a clear, concise manner. Focus on key points, actionable insights, and main arguments. Use bullet points for readability.`;
  },

  async checkChatGPTLogin() {
    // Check if chatgpt.com has valid session
    try {
      const tabs = await chrome.tabs.query({ url: "*://chatgpt.com/*" });
      if (tabs.length === 0) return false;
      
      // Could inject a check script, but for now assume logged in if tab exists
      return true;
    } catch {
      return false;
    }
  },

  // Open results tab with glassmorphic UI
  async openResultsTab(results, sortMode) {
    const url = chrome.runtime.getURL("batch-results.html") + 
      "?data=" + encodeURIComponent(JSON.stringify({ results, sortMode }));
    await chrome.tabs.create({ url, active: true });
  },

  // Close tabs if requested
  async closeTabs(tabIds) {
    await chrome.tabs.remove(tabIds);
  },

  // Main handler for context menu clicks
  async handleContextMenu(actionId) {
    try {
      // Show loading notification
      this.showNotification("🔄 Starting batch summarization...");

      const { tabs, shouldClose } = await this.getTabsForAction(actionId);
      if (tabs.length === 0) {
        this.showNotification("❌ No valid tabs to summarize");
        return;
      }

      const sortMode = await this.getSortPreference();
      const sortedTabs = this.sortTabs(tabs, sortMode);

      const results = [];
      let processed = 0;

      for (const tab of sortedTabs) {
        try {
          this.showNotification(`🔄 Processing ${processed + 1}/${sortedTabs.length}: ${tab.title?.slice(0, 40)}...`);
          
          const content = await this.extractTabContent(tab.id);
          const summary = await this.summarizeWithChatGPT(content.textContent, content.title, content.url);
          
          results.push({
            tabId: tab.id,
            title: content.title,
            url: content.url,
            summary,
            windowId: tab.windowId
          });
        } catch (error) {
          console.error("Failed to summarize tab:", tab.id, error);
          results.push({
            tabId: tab.id,
            title: tab.title,
            url: tab.url,
            summary: "❌ Failed to summarize: " + error.message,
            windowId: tab.windowId,
            error: true
          });
        }
        processed++;
      }

      // Open results tab
      await this.openResultsTab(results, sortMode);

      // Close tabs if requested
      if (shouldClose) {
        const tabIds = results.map(r => r.tabId).filter(id => !isNaN(id));
        await this.closeTabs(tabIds);
      }

      this.showNotification(`✅ Batch summarization complete! ${results.length} tabs processed.`);
    } catch (error) {
      console.error("Batch summarization failed:", error);
      this.showNotification("❌ Batch summarization failed: " + error.message);
    }
  },

  showNotification(message) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "logo-48.png",
      title: "Beast Mode Batch",
      message
    });
  }
};

// Initialize context menus on startup
chrome.runtime.onStartup.addListener(() => BM_BATCH.initContextMenus());
chrome.runtime.onInstalled.addListener(() => BM_BATCH.initContextMenus());

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuId && info.menuId.startsWith("bm-batch-")) {
    BM_BATCH.handleContextMenu(info.menuId);
  }
});

// Handle messages from batch results tab
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "BATCH_SORT_CHANGED") {
    chrome.storage.local.set({ batchSortMode: message.mode });
    sendResponse({ success: true });
    return true;
  }
  
  if (message.type === "BATCH_RETRY_FAILED") {
    BM_BATCH.handleRetry(message.tabId, message.url, message.title)
      .then(result => sendResponse({ success: true, result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === "BATCH_EXPORT") {
    BM_BATCH.exportResults(message.results)
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

async function handleRetry(tabId, url, title) {
  // Re-extract and summarize a failed tab
  const content = await BM_BATCH.extractTabContent(tabId);
  return BM_BATCH.summarizeWithChatGPT(content.textContent, title, url);
}

async function exportResults(results) {
  const csv = [
    ["Title", "URL", "Summary", "Status"],
    ...results.map(r => [r.title, r.url, r.summary, r.error ? "Failed" : "Success"])
  ].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  
  await chrome.downloads.download({
    url,
    filename: `batch-summaries-${Date.now()}.csv`,
    saveAs: true
  });
  
  URL.revokeObjectURL(url);
}