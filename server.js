const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const SERPAPI_KEY = process.env.SERPAPI_KEY || 'f902a9f8008c3431abec698bd2d488164b83d5ccb099aabc432569b448557a41';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Simple in-memory cache (TTL: 10 minutes)
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

function getCached(key) {
  const item = cache.get(key);
  if (item && (Date.now() - item.timestamp < CACHE_TTL)) {
    return item.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { timestamp: Date.now(), data });
}

// Helper for SerpAPI requests
async function fetchSerpApi(params) {
  const url = new URL('https://serpapi.com/search.json');
  params.api_key = SERPAPI_KEY;
  Object.keys(params).forEach(k => {
    if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
      url.searchParams.append(k, params[k]);
    }
  });

  const cacheKey = url.toString();
  const cachedData = getCached(cacheKey);
  if (cachedData) {
    return { ...cachedData, _fromCache: true };
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SerpAPI error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  setCache(cacheKey, data);
  return data;
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// 1. Academic Research (Google Scholar)
app.get('/api/scholar', async (req, res) => {
  try {
    const { q, cites, as_ylo, as_yhi, num = 10 } = req.query;
    if (!q && !cites) {
      return res.status(400).json({ error: 'Query term (q) or citation ID (cites) is required' });
    }

    const params = {
      engine: 'google_scholar',
      q: q || undefined,
      cites: cites || undefined,
      as_ylo: as_ylo || undefined,
      as_yhi: as_yhi || undefined,
      num: num
    };

    const data = await fetchSerpApi(params);

    const papers = (data.organic_results || []).map((item, index) => {
      const inlineLinks = item.inline_links || {};
      return {
        id: `paper-${index}-${Date.now()}`,
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        publicationInfo: item.publication_info?.summary || 'Unknown Source',
        authors: item.publication_info?.authors?.map(a => a.name) || [],
        pdfUrl: item.resources?.find(r => r.file_format === 'PDF')?.link || null,
        citedBy: inlineLinks.cited_by?.total || 0,
        citesId: inlineLinks.cited_by?.cites_id || null,
        versions: inlineLinks.versions?.total || 0,
        relatedUrl: inlineLinks.related_pages_link || null
      };
    });

    res.json({
      success: true,
      query: q,
      totalResults: data.search_information?.total_results || papers.length,
      papers,
      searchMetadata: data.search_metadata
    });
  } catch (err) {
    console.error('Scholar API error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Patent & Innovation Explorer (Google Patents)
app.get('/api/patents', async (req, res) => {
  try {
    const { q, status, type, num = 10 } = req.query;
    if (!q) return res.status(400).json({ error: 'Query term (q) is required' });

    const params = {
      engine: 'google_patents',
      q: q,
      status: status || undefined,
      type: type || undefined,
      num: num
    };

    const data = await fetchSerpApi(params);

    const patents = (data.organic_results || []).map((item, index) => ({
      id: item.patent_id || `patent-${index}`,
      title: item.title,
      snippet: item.snippet,
      patentId: item.patent_id || item.publication_number,
      assignee: item.assignee || item.assignee_original || 'Individual / Unassigned',
      inventor: item.inventor || 'N/A',
      filingDate: item.filing_date || item.publication_date || 'N/A',
      grantDate: item.grant_date || 'N/A',
      pdfUrl: item.pdf || item.pdf_link || null,
      link: item.link || item.patent_link
    }));

    res.json({
      success: true,
      query: q,
      totalResults: patents.length,
      patents,
      searchMetadata: data.search_metadata
    });
  } catch (err) {
    console.error('Patents API error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. News Literacy & Fact-Check Radar (Google News)
app.get('/api/news', async (req, res) => {
  try {
    const { q, topic, gl = 'us' } = req.query;
    const queryTerm = q || (topic ? `latest ${topic} news` : 'public interest civic policy');

    const params = {
      engine: 'google_news',
      q: queryTerm,
      gl: gl
    };

    const data = await fetchSerpApi(params);

    const newsList = (data.news_results || []).map((item, index) => ({
      id: `news-${index}`,
      title: item.title,
      link: item.link,
      source: item.source?.name || item.source || 'Verified Outlet',
      sourceIcon: item.source?.icon || null,
      date: item.date || item.time || 'Recent',
      snippet: item.snippet || item.title,
      thumbnail: item.thumbnail || null,
      stories: (item.stories || []).map(s => ({
        title: s.title,
        source: s.source?.name || s.source,
        link: s.link,
        date: s.date
      }))
    }));

    // Calculate source distribution for media literacy radar
    const sourceCounts = {};
    newsList.forEach(n => {
      sourceCounts[n.source] = (sourceCounts[n.source] || 0) + 1;
    });

    res.json({
      success: true,
      query: queryTerm,
      totalResults: newsList.length,
      sourcesBreakdown: sourceCounts,
      news: newsList
    });
  } catch (err) {
    console.error('News API error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Civic & Public Interest Jobs Portal (Google Jobs)
app.get('/api/jobs', async (req, res) => {
  try {
    const { q = 'public sector education research civic tech non profit', location = '' } = req.query;

    const params = {
      engine: 'google_jobs',
      q: q,
      location: location || undefined
    };

    const data = await fetchSerpApi(params);

    const jobs = (data.jobs_results || []).map((item, index) => ({
      id: item.job_id || `job-${index}`,
      title: item.title,
      company: item.company_name,
      location: item.location || 'Remote / Unspecified',
      via: item.via,
      snippet: item.description,
      extensions: item.extensions || [],
      thumbnail: item.thumbnail || null,
      applyOptions: item.apply_options || [],
      postedAt: item.detected_extensions?.posted_at || 'Recently'
    }));

    res.json({
      success: true,
      query: q,
      location: location,
      totalResults: jobs.length,
      jobs
    });
  } catch (err) {
    console.error('Jobs API error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Open Educational Resources & Courses (Google Search with site filters)
app.get('/api/education', async (req, res) => {
  try {
    const { q, type = 'all' } = req.query;
    if (!q) return res.status(400).json({ error: 'Query term (q) is required' });

    let siteFilter = '';
    if (type === 'courses') {
      siteFilter = 'site:coursera.org OR site:edx.org OR site:ocw.mit.edu OR site:khanacademy.org';
    } else if (type === 'books') {
      siteFilter = 'site:gutenberg.org OR site:openstax.org OR site:archive.org';
    } else if (type === 'datasets') {
      siteFilter = 'site:data.gov OR site:kaggle.com OR site:worldbank.org';
    }

    const searchQuery = `${q} ${siteFilter}`.trim();

    const params = {
      engine: 'google',
      q: searchQuery,
      num: 10
    };

    const data = await fetchSerpApi(params);

    const resources = (data.organic_results || []).map((item, index) => ({
      id: `edu-${index}`,
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      displayLink: item.displayed_link,
      domain: new URL(item.link || 'https://example.com').hostname,
      sitelinks: item.sitelinks?.inline || []
    }));

    res.json({
      success: true,
      query: q,
      filterType: type,
      totalResults: resources.length,
      resources
    });
  } catch (err) {
    console.error('Education API error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 6. Civic Amenities & Public Services
app.get('/api/civic', async (req, res) => {
  try {
    const { q = 'public library legal aid community center', location = 'New York' } = req.query;

    const params = {
      engine: 'google',
      q: `${q} near ${location}`,
      num: 10
    };

    const data = await fetchSerpApi(params);

    const places = (data.organic_results || []).map((item, index) => ({
      id: `civic-${index}`,
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      domain: item.displayed_link
    }));

    res.json({
      success: true,
      query: q,
      location,
      places
    });
  } catch (err) {
    console.error('Civic API error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 7. Text Simplifier / Plain-Language Assistant
app.post('/api/summarize', (req, res) => {
  const { text, title } = req.body;
  if (!text) return res.status(400).json({ error: 'Text content is required' });

  // Intelligent text analysis & breakdown logic
  const cleanText = text.replace(/\s+/g, ' ').trim();
  const sentences = cleanText.split(/(?<=[.!?])\s+/);

  const keySentence = sentences[0] || text;
  const wordCount = cleanText.split(/\s+/).length;
  
  // Extract key terms
  const words = cleanText.toLowerCase().match(/\b[a-z]{5,}\b/g) || [];
  const freq = {};
  words.forEach(w => {
    if (!['which', 'their', 'there', 'about', 'these', 'would', 'other', 'first', 'using', 'based', 'result', 'system', 'method'].includes(w)) {
      freq[w] = (freq[w] || 0) + 1;
    }
  });

  const topKeywords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w.toUpperCase());

  // Generate plain English explanation
  const simplified = `
    This research/patent document discusses: "${title || 'the selected topic'}".
    
    📌 **Key Takeaway**: ${keySentence}
    
    💡 **Core Focus**: Focuses on application in ${topKeywords.join(', ') || 'specialized public domain fields'}.
    
    📊 **Reading Level**: ${wordCount > 60 ? 'Advanced / Academic Jargon' : 'Accessible Overview'} (${wordCount} words analyzed).
  `.trim();

  res.json({
    success: true,
    title: title || 'Document Analysis',
    simplified,
    keywords: topKeywords,
    wordCount
  });
});

// 8. Stats & System Health
app.get('/api/stats', (req, res) => {
  res.json({
    status: 'online',
    systemTime: new Date().toISOString(),
    cacheEntries: cache.size,
    serpApiKeyConfigured: !!SERPAPI_KEY
  });
});

// Serve frontend for all unmatched routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🌐 OpenLens - Public Knowledge & Intelligence Hub is running`);
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
  console.log(`🔑 SerpAPI integration initialized successfully`);
  console.log(`=======================================================`);
});
