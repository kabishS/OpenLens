# 🔬 OpenLens — Public Knowledge & Intelligence Hub

> A public-interest knowledge platform for discovering academic research, patents, news, jobs, education resources, and civic information — powered by SerpApi.

---

## 🌐 Live Demo

🚀 **OpenLens:** [https://openlens-jre0.onrender.com/](https://openlens-jre0.onrender.com/)

---

## 📖 About

**OpenLens** is a public-interest knowledge and research platform designed to make valuable information easier to discover, understand, and access.

It brings multiple information domains into one platform:

- 🎓 Academic Research
- 🔬 Patent Discovery
- 📰 News Literacy
- 💼 Civic & Public-Interest Jobs
- 📚 Open Education & Courses
- 🏛️ Civic Information
- ♿ Accessibility Tools

OpenLens combines **SerpApi-powered search** with an accessibility-first interface and plain-language explanations to help users explore complex information more easily.

---

## ✨ Key Features

### 🎓 Academic Research

Search academic literature and research information.

- Research paper discovery
- Authors
- Citations
- Publication details
- Research snippets
- Direct resource links
- Plain-language explanations
- Save research to workspace

### 🔬 Patent Explorer

Explore technology and innovation through patent information.

- Patent discovery
- Patent numbers
- Inventors
- Assignees
- Filing information
- Abstracts
- Patent resources

### 📰 News Literacy

Explore current news from multiple sources.

- News discovery
- Source information
- Publication dates
- Related articles
- Source comparison
- News research

### 💼 Civic & Public Jobs

Discover employment opportunities related to public-interest and technology fields.

- Job search
- Location-based search
- Job descriptions
- Company information
- Direct application links

### 📚 Open Education

Find educational resources and learning opportunities.

- Online courses
- University resources
- Open educational materials
- Learning resources
- Educational datasets

### 🏛️ Civic Information

Discover useful public-interest information and community resources.

- Public services
- Community resources
- Legal resources
- Libraries
- Health-related community resources
- Government information

---

## ♿ Accessibility First

OpenLens is designed with accessibility in mind.

### 🔠 Font Scaling

Users can adjust text size using:

- `A-`
- `A`
- `A+`

### 🌓 High Contrast

A high-contrast mode improves visual readability for users who need stronger color contrast.

### 🔊 Read Aloud

Uses the browser's **Web Speech API** to read selected content aloud.

### 💡 Plain English

Complex research information can be presented in simpler language to make technical content easier to understand.

### ⌨️ Keyboard Support

Important actions can be accessed using keyboard navigation and shortcuts.

---

## 🧠 Research Workspace

Users can save useful results from different OpenLens modules into a personal workspace.

Saved information can be exported as:

- 📥 JSON
- 📊 CSV
- 📑 BibTeX

This allows researchers and students to organize and reuse information.

---

## ⚙️ How OpenLens Works

```text
                    ┌──────────────────────┐
                    │       OpenLens       │
                    │      Frontend UI     │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Node.js / Express  │
                    │    Backend Engine    │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │       SerpApi        │
                    │   Search & Discovery │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
          Scholar           News              Jobs
              │                │                │
              └────────────────┼────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
           Patents         Education          Civic
                               │
                               ▼
                    ┌──────────────────────┐
                    │  OpenLens Interface  │
                    │ Search • Analyze     │
                    │ Explain • Save       │
                    └──────────────────────┘
