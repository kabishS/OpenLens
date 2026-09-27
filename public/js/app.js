/**
 * CIVIC PULSE & PUBLIC KNOWLEDGE HUB - FRONTEND LOGIC
 */

document.addEventListener('DOMContentLoaded', () => {
  // State Management
  const state = {
    currentTab: 'scholar',
    currentQuery: '',
    results: [],
    savedBookmarks: JSON.parse(localStorage.getItem('openlens_bookmarks') || '[]'),
    fontScale: parseFloat(localStorage.getItem('openlens_font_scale') || '1'),
    highContrast: localStorage.getItem('openlens_contrast') === 'true',
    activeSpeech: null,
    chartInstance: null
  };

  // DOM Elements
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const filterSelect = document.getElementById('filterSelect');
  const resultsContainer = document.getElementById('resultsContainer');
  const resultsTitle = document.getElementById('resultsTitle');
  const resultsCount = document.getElementById('resultsCount');
  const quickChipsContainer = document.getElementById('quickChipsContainer');
  const workspaceList = document.getElementById('workspaceList');
  const bookmarkCountBadge = document.getElementById('bookmarkCountBadge');
  const modalOverlay = document.getElementById('modalOverlay');
  const modalBody = document.getElementById('modalBody');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const ttsBar = document.getElementById('ttsBar');
  const ttsText = document.getElementById('ttsText');
  const stopTtsBtn = document.getElementById('stopTtsBtn');

  // Accessibility Controls
  const fontIncreaseBtn = document.getElementById('fontIncrease');
  const fontDecreaseBtn = document.getElementById('fontDecrease');
  const fontResetBtn = document.getElementById('fontReset');
  const contrastToggleBtn = document.getElementById('contrastToggle');
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const exportBibtexBtn = document.getElementById('exportBibtexBtn');
  const clearWorkspaceBtn = document.getElementById('clearWorkspaceBtn');

  // Preset Searches per Tool Tab
  const PRESETS = {
    scholar: ['Renewable Energy Storage', 'AI Ethics in Public Policy', 'Vaccine Efficacy Meta-Analysis', 'Clean Water Filtration Tech'],
    patents: ['Solar Cell Efficiency', 'Biodegradable Polymers', 'Quantum Computing Devices', 'Carbon Capture Systems'],
    news: ['Climate Legislation 2026', 'Public Health Initiative', 'Civic Tech Open Source', 'Education Reform'],
    jobs: ['Public Policy Fellow', 'Renewable Energy Engineer', 'Civic Data Analyst', 'Open Education Coordinator'],
    education: ['OpenStax Physics', 'MIT Machine Learning', 'Khan Academy Math', 'Data Science Datasets'],
    civic: ['Public Legal Aid', 'Community Health Clinic', 'Public Library Digital Hub', 'Veteran Services']
  };

  // Initialize UI Settings
  applyFontScale(state.fontScale);
  applyHighContrast(state.highContrast);
  renderWorkspace();

  // Tab Switch Handler
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentTab = btn.dataset.tab;
      
      // Update Filter Options & Quick Chips
      updateFilterOptions();
      renderQuickChips();

      // Trigger initial search for the selected tab if empty
      const defaultQuery = PRESETS[state.currentTab][0];
      searchInput.value = defaultQuery;
      performSearch();
    });
  });

  // Search Button & Keyboard Enter
  searchBtn.addEventListener('click', performSearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
  });

  // Filter Selection Change
  filterSelect.addEventListener('change', performSearch);

  // Quick Chips
  function renderQuickChips() {
    quickChipsContainer.innerHTML = '';
    const chips = PRESETS[state.currentTab] || [];
    chips.forEach(term => {
      const btn = document.createElement('button');
      btn.className = 'chip-btn';
      btn.textContent = term;
      btn.addEventListener('click', () => {
        searchInput.value = term;
        performSearch();
      });
      quickChipsContainer.appendChild(btn);
    });
  }

  // Update Filters based on active tool
  function updateFilterOptions() {
    filterSelect.innerHTML = '';
    if (state.currentTab === 'scholar') {
      filterSelect.innerHTML = `
        <option value="">All Years</option>
        <option value="2024">Since 2024</option>
        <option value="2022">Since 2022</option>
        <option value="2020">Since 2020</option>
      `;
    } else if (state.currentTab === 'patents') {
      filterSelect.innerHTML = `
        <option value="">All Statuses</option>
        <option value="GRANT">Granted Patents</option>
        <option value="APPLICATION">Patent Applications</option>
      `;
    } else if (state.currentTab === 'news') {
      filterSelect.innerHTML = `
        <option value="">All News</option>
        <option value="environment">Environment & Climate</option>
        <option value="policy">Civic Policy</option>
        <option value="tech">Technology Ethics</option>
      `;
    } else if (state.currentTab === 'jobs') {
      filterSelect.innerHTML = `
        <option value="">All Locations</option>
        <option value="Remote">Remote Only</option>
        <option value="Washington, DC">Washington, DC</option>
        <option value="New York, NY">New York, NY</option>
      `;
    } else if (state.currentTab === 'education') {
      filterSelect.innerHTML = `
        <option value="all">All OER Resources</option>
        <option value="courses">University Courses (MIT/Coursera)</option>
        <option value="books">Open Textbooks & Archive</option>
        <option value="datasets">Public Open Datasets</option>
      `;
    } else {
      filterSelect.innerHTML = `<option value="">General Search</option>`;
    }
  }

  // -------------------------------------------------------------
  // API Fetch & Render Pipeline
  // -------------------------------------------------------------
  async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    state.currentQuery = query;
    showLoading();

    let endpoint = '';
    let params = new URLSearchParams({ q: query });

    if (state.currentTab === 'scholar') {
      endpoint = '/api/scholar';
      if (filterSelect.value) params.append('as_ylo', filterSelect.value);
    } else if (state.currentTab === 'patents') {
      endpoint = '/api/patents';
      if (filterSelect.value) params.append('status', filterSelect.value);
    } else if (state.currentTab === 'news') {
      endpoint = '/api/news';
      if (filterSelect.value) params.append('topic', filterSelect.value);
    } else if (state.currentTab === 'jobs') {
      endpoint = '/api/jobs';
      if (filterSelect.value) params.append('location', filterSelect.value);
    } else if (state.currentTab === 'education') {
      endpoint = '/api/education';
      if (filterSelect.value) params.append('type', filterSelect.value);
    } else if (state.currentTab === 'civic') {
      endpoint = '/api/civic';
      params.append('location', 'New York');
    }

    try {
      const response = await fetch(`${endpoint}?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}: Search Request Failed`);
      const data = await response.json();

      state.results = extractResultsList(data);
      renderResults(state.results);
      renderSidebarAnalytics(data);
    } catch (err) {
      console.error('Search failed:', err);
      resultsContainer.innerHTML = `
        <div class="empty-state">
          <h3>⚠️ Unable to Fetch Data</h3>
          <p>${err.message}</p>
          <button class="action-btn primary" onclick="location.reload()" style="margin-top:1rem;">Retry Connection</button>
        </div>
      `;
    }
  }

  function extractResultsList(data) {
    if (data.papers) return data.papers;
    if (data.patents) return data.patents;
    if (data.news) return data.news;
    if (data.jobs) return data.jobs;
    if (data.resources) return data.resources;
    if (data.places) return data.places;
    return [];
  }

  function showLoading() {
    resultsContainer.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Querying verified public knowledge engine via SerpAPI...</p>
      </div>
    `;
    resultsCount.textContent = 'Searching...';
  }

  function renderResults(items) {
    resultsCount.textContent = `${items.length} records found`;
    resultsTitle.innerHTML = `
      <span>${getToolIcon(state.currentTab)} ${getToolTitle(state.currentTab)}</span>
    `;

    if (!items.length) {
      resultsContainer.innerHTML = `
        <div class="empty-state">
          <h3>No Public Records Found</h3>
          <p>Try refining your search terms or choosing a different filter.</p>
        </div>
      `;
      return;
    }

    resultsContainer.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'cards-grid';

    items.forEach((item, idx) => {
      const card = createResultCard(item, idx);
      grid.appendChild(card);
    });

    resultsContainer.appendChild(grid);
  }

  function getToolIcon(tab) {
    const icons = {
      scholar: '🎓',
      patents: '🔬',
      news: '📰',
      jobs: '💼',
      education: '📚',
      civic: '🏛️'
    };
    return icons[tab] || '🔍';
  }

  function getToolTitle(tab) {
    const titles = {
      scholar: 'Academic Research & Literature',
      patents: 'Patents & Global Innovation',
      news: 'News Literacy & Media Radar',
      jobs: 'Civic & Public Sector Jobs',
      education: 'Open Educational Resources',
      civic: 'Civic Amenities & Public Services'
    };
    return titles[tab] || 'Knowledge Engine';
  }

  // -------------------------------------------------------------
  // Card Creation by Type
  // -------------------------------------------------------------
  function createResultCard(item, idx) {
    const card = document.createElement('article');
    card.className = 'card';

    const isBookmarked = state.savedBookmarks.some(b => b.title === item.title);

    let metaHtml = '';
    let badgeHtml = '';

    if (state.currentTab === 'scholar') {
      badgeHtml = `<span class="badge badge-cite">Citations: ${item.citedBy || 0}</span>`;
      if (item.pdfUrl) badgeHtml += ` <span class="badge badge-pdf">PDF Available</span>`;
      metaHtml = `
        <div class="card-meta-item">✍️ <strong>Authors:</strong> ${item.authors?.slice(0, 3).join(', ') || 'Various Researchers'}</div>
        <div class="card-meta-item">📖 <strong>Source:</strong> ${item.publicationInfo}</div>
      `;
    } else if (state.currentTab === 'patents') {
      badgeHtml = `<span class="badge badge-patent">Patent ID: ${item.patentId || 'N/A'}</span>`;
      metaHtml = `
        <div class="card-meta-item">🏢 <strong>Assignee:</strong> ${item.assignee}</div>
        <div class="card-meta-item">👤 <strong>Inventor:</strong> ${item.inventor}</div>
        <div class="card-meta-item">📅 <strong>Filed:</strong> ${item.filingDate}</div>
      `;
    } else if (state.currentTab === 'news') {
      badgeHtml = `<span class="badge badge-news">${item.source}</span>`;
      metaHtml = `
        <div class="card-meta-item">🕒 <strong>Published:</strong> ${item.date}</div>
        ${item.stories?.length ? `<div class="card-meta-item">📰 <strong>Related Outlets:</strong> ${item.stories.length} multi-source stories</div>` : ''}
      `;
    } else if (state.currentTab === 'jobs') {
      badgeHtml = `<span class="badge badge-job">${item.location}</span>`;
      metaHtml = `
        <div class="card-meta-item">🏢 <strong>Organization:</strong> ${item.company}</div>
        <div class="card-meta-item">🕒 <strong>Posted:</strong> ${item.postedAt}</div>
      `;
    } else {
      badgeHtml = `<span class="badge badge-cite">${item.domain || 'Resource'}</span>`;
      metaHtml = `<div class="card-meta-item">🔗 ${item.displayLink || item.link}</div>`;
    }

    card.innerHTML = `
      <div class="card-header">
        <a href="${item.link || item.pdfUrl || '#'}" target="_blank" rel="noopener noreferrer" class="card-title">
          ${item.title}
        </a>
        <div>${badgeHtml}</div>
      </div>
      <div class="card-meta">${metaHtml}</div>
      <p class="card-snippet">${item.snippet || 'No summary available.'}</p>
      <div class="card-actions">
        ${item.link ? `<a href="${item.link}" target="_blank" rel="noopener" class="action-btn primary">🔗 Open Resource</a>` : ''}
        ${item.pdfUrl ? `<a href="${item.pdfUrl}" target="_blank" rel="noopener" class="action-btn">📄 Download PDF</a>` : ''}
        <button class="action-btn summarize-btn">💡 Explain Plain English</button>
        <button class="action-btn speak-btn">🔊 Read Aloud</button>
        <button class="action-btn bookmark-btn">${isBookmarked ? '⭐ Saved' : '🔖 Save to Workspace'}</button>
      </div>
    `;

    // Event Handlers for Actions
    card.querySelector('.summarize-btn').addEventListener('click', () => {
      openSummarizeModal(item.title, item.snippet);
    });

    card.querySelector('.speak-btn').addEventListener('click', () => {
      speakText(`${item.title}. ${item.snippet}`);
    });

    card.querySelector('.bookmark-btn').addEventListener('click', (e) => {
      toggleBookmark(item, e.target);
    });

    return card;
  }

  // -------------------------------------------------------------
  // AI / Plain-Language Assistant Modal
  // -------------------------------------------------------------
  async function openSummarizeModal(title, text) {
    modalBody.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Analyzing document syntax and generating plain-language translation...</p>
      </div>
    `;
    modalOverlay.classList.add('active');

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, text })
      });
      const data = await response.json();

      modalBody.innerHTML = `
        <h3 class="modal-title">💡 Plain-Language Summary</h3>
        <p><strong>Document:</strong> ${title}</p>
        <div class="simplified-box">
          ${data.simplified.replace(/\n/g, '<br/>')}
        </div>
        <div style="margin-top:1.25rem; display:flex; gap:0.5rem;">
          <button class="action-btn primary" id="speakModalBtn">🔊 Read Summary Aloud</button>
        </div>
      `;

      document.getElementById('speakModalBtn').addEventListener('click', () => {
        speakText(data.simplified.replace(/<[^>]*>?/gm, ''));
      });
    } catch (err) {
      modalBody.innerHTML = `<p style="color:red;">Failed to summarize text: ${err.message}</p>`;
    }
  }

  closeModalBtn.addEventListener('click', () => modalOverlay.classList.remove('active'));
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.remove('active');
  });

  // -------------------------------------------------------------
  // Text-To-Speech (TTS) Engine
  // -------------------------------------------------------------
  function speakText(text) {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in your browser.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    ttsText.textContent = text.slice(0, 70) + (text.length > 70 ? '...' : '');
    ttsBar.style.display = 'flex';

    utterance.onend = () => {
      ttsBar.style.display = 'none';
    };

    window.speechSynthesis.speak(utterance);
  }

  stopTtsBtn.addEventListener('click', () => {
    window.speechSynthesis.cancel();
    ttsBar.style.display = 'none';
  });

  // -------------------------------------------------------------
  // Workspace & Bookmarks Manager
  // -------------------------------------------------------------
  function toggleBookmark(item, buttonEl) {
    const existsIdx = state.savedBookmarks.findIndex(b => b.title === item.title);
    if (existsIdx > -1) {
      state.savedBookmarks.splice(existsIdx, 1);
      buttonEl.textContent = '🔖 Save to Workspace';
    } else {
      state.savedBookmarks.push({
        title: item.title,
        link: item.link || item.pdfUrl,
        type: state.currentTab,
        authors: item.authors || [item.assignee || item.company || 'Public Source'],
        dateSaved: new Date().toLocaleDateString()
      });
      buttonEl.textContent = '⭐ Saved';
    }
    localStorage.setItem('openlens_bookmarks', JSON.stringify(state.savedBookmarks));
    renderWorkspace();
  }

  function renderWorkspace() {
    bookmarkCountBadge.textContent = state.savedBookmarks.length;
    workspaceList.innerHTML = '';

    if (!state.savedBookmarks.length) {
      workspaceList.innerHTML = `<li class="workspace-item" style="justify-content:center; color:var(--text-muted);">Workspace is empty. Click 'Save' on items.</li>`;
      return;
    }

    state.savedBookmarks.forEach((b, idx) => {
      const li = document.createElement('li');
      li.className = 'workspace-item';
      li.innerHTML = `
        <div class="workspace-item-title" title="${b.title}">
          <a href="${b.link || '#'}" target="_blank">${b.title}</a>
        </div>
        <button class="btn-icon remove-bookmark" data-index="${idx}" title="Remove">✕</button>
      `;
      li.querySelector('.remove-bookmark').addEventListener('click', (e) => {
        state.savedBookmarks.splice(idx, 1);
        localStorage.setItem('openlens_bookmarks', JSON.stringify(state.savedBookmarks));
        renderWorkspace();
        renderResults(state.results);
      });
      workspaceList.appendChild(li);
    });
  }

  // Exports
  exportJsonBtn.addEventListener('click', () => {
    downloadFile('openlens_workspace.json', JSON.stringify(state.savedBookmarks, null, 2), 'application/json');
  });

  exportCsvBtn.addEventListener('click', () => {
    if (!state.savedBookmarks.length) return alert('No bookmarks to export');
    const headers = ['Title', 'Type', 'Link', 'Authors/Source', 'DateSaved'];
    const rows = state.savedBookmarks.map(b => [
      `"${b.title.replace(/"/g, '""')}"`,
      `"${b.type}"`,
      `"${b.link || ''}"`,
      `"${(b.authors || []).join('; ')}"`,
      `"${b.dateSaved}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadFile('openlens_workspace.csv', csvContent, 'text/csv');
  });

  exportBibtexBtn.addEventListener('click', () => {
    if (!state.savedBookmarks.length) return alert('No bookmarks to export');
    const bibtexStr = state.savedBookmarks.map((b, i) => `
@article{public_item_${i + 1},
  title = {${b.title}},
  author = {${(b.authors || ['Public Domain']).join(' and ')}},
  year = {${new Date().getFullYear()}},
  url = {${b.link || ''}}
}`).join('\n');
    downloadFile('citations.bib', bibtexStr, 'text/plain');
  });

  clearWorkspaceBtn.addEventListener('click', () => {
    if (confirm('Clear all saved items in your workspace?')) {
      state.savedBookmarks = [];
      localStorage.removeItem('civic_bookmarks');
      renderWorkspace();
      renderResults(state.results);
    }
  });

  function downloadFile(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // -------------------------------------------------------------
  // Analytics & Visual Chart Renderer
  // -------------------------------------------------------------
  function renderSidebarAnalytics(data) {
    const ctx = document.getElementById('analyticsChart')?.getContext('2d');
    if (!ctx) return;

    if (state.chartInstance) {
      state.chartInstance.destroy();
    }

    let labels = [];
    let chartData = [];
    let labelTitle = 'Results Overview';

    if (state.currentTab === 'news' && data.sourcesBreakdown) {
      labelTitle = 'News Source Breakdown';
      labels = Object.keys(data.sourcesBreakdown).slice(0, 5);
      chartData = Object.values(data.sourcesBreakdown).slice(0, 5);
    } else if (state.currentTab === 'scholar' && data.papers) {
      labelTitle = 'Citation Counts';
      labels = data.papers.slice(0, 5).map(p => p.authors[0] || 'Paper');
      chartData = data.papers.slice(0, 5).map(p => p.citedBy || 1);
    } else {
      labelTitle = 'Category Distribution';
      labels = ['Top Tier', 'Verified', 'Open Access', 'Public Domain'];
      chartData = [12, 19, 7, 15];
    }

    state.chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          label: labelTitle,
          data: chartData,
          backgroundColor: ['#2872d1', '#10ac84', '#f39c12', '#8e44ad', '#00d2d3']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
        }
      }
    });
  }

  // -------------------------------------------------------------
  // Accessibility Font & Contrast Handlers
  // -------------------------------------------------------------
  fontIncreaseBtn.addEventListener('click', () => {
    if (state.fontScale < 1.4) {
      state.fontScale += 0.1;
      applyFontScale(state.fontScale);
    }
  });

  fontDecreaseBtn.addEventListener('click', () => {
    if (state.fontScale > 0.8) {
      state.fontScale -= 0.1;
      applyFontScale(state.fontScale);
    }
  });

  fontResetBtn.addEventListener('click', () => {
    state.fontScale = 1.0;
    applyFontScale(1.0);
  });

  contrastToggleBtn.addEventListener('click', () => {
    state.highContrast = !state.highContrast;
    applyHighContrast(state.highContrast);
  });

  function applyFontScale(scale) {
    document.documentElement.style.setProperty('--font-scale', scale);
    localStorage.setItem('openlens_font_scale', scale);
  }

  function applyHighContrast(enable) {
    if (enable) {
      document.body.classList.add('high-contrast');
      contrastToggleBtn.innerHTML = '☀️ Standard Mode';
    } else {
      document.body.classList.remove('high-contrast');
      contrastToggleBtn.innerHTML = '👁️ High Contrast';
    }
    localStorage.setItem('openlens_contrast', enable);
  }

  // Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      searchInput.focus();
    } else if (e.altKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      contrastToggleBtn.click();
    }
  });

  // Initial Search Execution
  renderQuickChips();
  updateFilterOptions();
  searchInput.value = PRESETS.scholar[0];
  performSearch();
});
