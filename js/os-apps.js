/**
 * Juyel OS — Application Suite Renderers & Event Handlers
 * Renders rich content from ownerProfile for Projects, Results, Systems, Terminal, Browser, Contact, etc.
 */

import { ownerProfile } from './owner-profile.js';
import { windowManager } from './os-window-manager.js';
import { desktopController } from './os-desktop.js';

export class AppManager {
  constructor() {
    this.init();
  }

  init() {
    this.renderProjectsApp();
    this.renderResultsApp();
    this.renderSystemsApp();
    this.renderFounderMemo();
    this.renderTerminalApp();
    this.renderBrowserApp();
    this.renderContactApp();
    this.renderResumeApp();
    this.renderServicesApp();
  }

  /* --------------------------------------------------------------------------
     1. Projects App (Main Drive) with Detail Inspector
     -------------------------------------------------------------------------- */
  renderProjectsApp() {
    const container = document.getElementById('projects-app-mount');
    if (!container) return;

    const projects = ownerProfile.projects;

    container.innerHTML = `
      <div class="projects-app-header">
        <div class="projects-filter-bar">
          <button class="filter-pill active" data-cat="all">All Projects (${projects.length})</button>
          <button class="filter-pill" data-cat="Machine Learning">AI & Vision</button>
          <button class="filter-pill" data-cat="Web Application">Web Apps</button>
          <button class="filter-pill" data-cat="Mobile App">Mobile (Flutter)</button>
        </div>
      </div>
      <div class="projects-grid-layout" id="projects-card-grid"></div>

      <!-- In-App Project Detail Modal -->
      <div id="project-detail-modal" class="cmd-palette-backdrop" style="display: none; padding-top: 8vh;">
        <div class="cmd-palette-box" style="max-width: 680px; max-height: 84vh; overflow-y: auto;">
          <div class="cmd-input-wrap" style="justify-content: space-between;">
            <span style="font-weight: 700; color: var(--color-cyan); font-family: var(--font-display); font-size: 15px;" id="modal-project-title">Project Details</span>
            <button id="close-project-modal" class="nav-pill-btn" style="padding: 4px 10px;">Close &times;</button>
          </div>
          <div id="modal-project-body" style="padding: 20px;"></div>
        </div>
      </div>
    `;

    const grid = container.querySelector('#projects-card-grid');
    const filterButtons = container.querySelectorAll('.filter-pill');
    const modal = container.querySelector('#project-detail-modal');
    const modalTitle = container.querySelector('#modal-project-title');
    const modalBody = container.querySelector('#modal-project-body');
    const closeBtn = container.querySelector('#close-project-modal');

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
      });
    }

    const openProjectDetails = (p) => {
      if (!modal || !modalTitle || !modalBody) return;
      modalTitle.textContent = `${p.name} — Technical Overview`;
      modalBody.innerHTML = `
        <div style="width: 100%; height: 220px; border-radius: var(--radius-md); overflow: hidden; margin-bottom: 18px; border: 1px solid var(--border-subtle);">
          <img src="${p.image}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='assets/profile-photo.jpg'">
        </div>
        <div style="display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap;">
          <span class="project-category-tag" style="position: static;">${p.category}</span>
          <span style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); background: rgba(255,255,255,0.06); padding: 3px 8px; border-radius: 4px;">Role: ${p.role}</span>
          <span style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); background: rgba(255,255,255,0.06); padding: 3px 8px; border-radius: 4px;">Timeline: ${p.dates}</span>
        </div>
        <h4 style="font-size: 15px; margin-bottom: 6px; color: var(--text-main);">The Challenge</h4>
        <p style="font-size: 13px; color: var(--text-muted); line-height: 1.6; margin-bottom: 14px;">${p.problem}</p>
        <h4 style="font-size: 15px; margin-bottom: 6px; color: var(--text-main);">Engineering Intervention</h4>
        <p style="font-size: 13px; color: var(--text-muted); line-height: 1.6; margin-bottom: 14px;">${p.intervention}</p>
        <div class="project-outcome-box" style="margin-bottom: 18px;">
          <strong>Verified Outcome:</strong> ${p.outcome}
        </div>
        <h4 style="font-size: 15px; margin-bottom: 8px; color: var(--text-main);">Technology Architecture</h4>
        <div class="project-tech-chips" style="margin-bottom: 20px;">
          ${p.stack.map(tech => `<span class="tech-chip" style="font-size: 11px; padding: 4px 10px;">${tech}</span>`).join('')}
        </div>
        <div style="display: flex; gap: 12px; border-top: 1px solid var(--border-subtle); padding-top: 16px;">
          ${p.url ? `<a href="${p.url}" target="_blank" rel="noopener noreferrer" class="btn-primary" style="font-size: 12px;"><i class="fas fa-external-link-alt"></i> Open Live Project</a>` : ''}
          ${p.repository ? `<a href="${p.repository}" target="_blank" rel="noopener noreferrer" class="btn-secondary" style="font-size: 12px;"><i class="fab fa-github"></i> View GitHub Repo</a>` : ''}
        </div>
      `;
      modal.style.display = 'flex';
    };

    const renderCards = (filter) => {
      grid.innerHTML = '';
      const filtered = filter === 'all' 
        ? projects 
        : projects.filter(p => p.category === filter);

      filtered.forEach((p) => {
        const card = document.createElement('div');
        card.className = 'project-os-card';
        card.innerHTML = `
          <div class="project-card-thumb">
            <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='assets/profile-photo.jpg'">
            <span class="project-category-tag">${p.category}</span>
          </div>
          <div class="project-card-content">
            <h3 class="project-title">${p.name}</h3>
            <p class="project-problem-text"><strong>Challenge:</strong> ${p.problem}</p>
            <div class="project-outcome-box">
              <strong>Outcome:</strong> ${p.outcome}
            </div>
            <div class="project-tech-chips">
              ${p.stack.map(tech => `<span class="tech-chip">${tech}</span>`).join('')}
            </div>
            <div class="project-actions-row">
              <span class="project-action-link" style="cursor: pointer;"><i class="fas fa-info-circle"></i> Deep Dive</span>
              ${p.repository ? `<a href="${p.repository}" target="_blank" rel="noopener noreferrer" class="project-action-link" onclick="event.stopPropagation()"><i class="fab fa-github"></i> Code</a>` : ''}
            </div>
          </div>
        `;

        // Click card to open deep dive
        card.addEventListener('click', () => openProjectDetails(p));
        grid.appendChild(card);
      });
    };

    renderCards('all');

    filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderCards(btn.getAttribute('data-cat'));
      });
    });
  }

  /* --------------------------------------------------------------------------
     2. Results & Proof Vault App
     -------------------------------------------------------------------------- */
  renderResultsApp() {
    const container = document.getElementById('results-app-mount');
    if (!container) return;

    const metrics = ownerProfile.metrics;
    const cases = ownerProfile.clientCases;
    const testimonials = ownerProfile.testimonials;

    container.innerHTML = `
      <div class="proof-metrics-grid">
        ${metrics.map(m => `
          <div class="proof-metric-card">
            <div class="proof-metric-value">${m.value}</div>
            <div class="proof-metric-title">${m.label}</div>
            <span class="proof-metric-status">${m.status}</span>
          </div>
        `).join('')}
      </div>

      <div class="section-subhead"><i class="fas fa-shield-alt"></i> Verified Case Studies</div>
      <div class="case-study-list">
        ${cases.map(c => `
          <div class="case-card-item">
            <div class="case-card-top">
              <span class="case-card-title">${c.title} (${c.client})</span>
              <span class="case-card-metric">${c.metric}</span>
            </div>
            <p class="case-card-desc">${c.description}</p>
            <div class="case-card-disclosure">Source: ${c.disclosure}</div>
          </div>
        `).join('')}
      </div>

      <div class="section-subhead"><i class="fas fa-comments"></i> Client Testimonials</div>
      <div class="testimonials-deck">
        ${testimonials.map(t => `
          <div class="testimonial-quote-box">
            <p class="quote-text">“${t.text}”</p>
            <div class="quote-author-info">
              <span class="author-name">${t.author}</span>
              <span class="author-role">${t.role} • ${t.service}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /* --------------------------------------------------------------------------
     3. Systems / How I Work App
     -------------------------------------------------------------------------- */
  renderSystemsApp() {
    const container = document.getElementById('systems-app-mount');
    if (!container) return;

    const steps = [
      {
        num: '01',
        title: 'Discovery & System Diagnosis',
        desc: 'Deep dive into requirements, edge-case limitations, target user personas, and technical architecture.',
        artifact: 'System Architecture Blueprint'
      },
      {
        num: '02',
        title: 'Precision Planning & Strategy',
        desc: 'Formulate an actionable sprint roadmap, component tree, API contracts, and database schema.',
        artifact: 'Sprint Roadmap & Component Hierarchy'
      },
      {
        num: '03',
        title: 'AI-Assisted Build & Quality Gates',
        desc: 'Writing clean, typed, modular code accelerated by modern AI workflows with strict automated linting and unit checks.',
        artifact: 'Validated Production Build'
      },
      {
        num: '04',
        title: 'Launch, SEO & Long-Term Reliability',
        desc: 'End-to-end performance audits, accessibility checks, SSL deployment, and ongoing client handover documentation.',
        artifact: 'Production Deployment & Support Guide'
      }
    ];

    container.innerHTML = `
      <div class="systems-loop-container">
        <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 8px;">
          An engineered 4-step operating loop designed to deliver high-quality web and mobile software with maximum reliability.
        </p>
        ${steps.map(s => `
          <div class="system-step-row">
            <div class="step-number-badge">${s.num}</div>
            <div class="step-details">
              <h4 class="step-headline">${s.title}</h4>
              <p class="step-desc">${s.desc}</p>
              <span class="step-artifact-tag"><i class="fas fa-cube"></i> Deliverable: ${s.artifact}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /* --------------------------------------------------------------------------
     4. Interactive CLI Terminal App
     -------------------------------------------------------------------------- */
  renderTerminalApp() {
    const container = document.getElementById('terminal-app-mount');
    if (!container) return;

    container.innerHTML = `
      <div class="terminal-app-surface">
        <div class="terminal-history" id="terminal-output-stream">
          <div class="terminal-line output-info">Juyel.OS Terminal Shell v1.3 [Architecture: x86_64 Web]</div>
          <div class="terminal-line output-dim">Type 'help' to view available commands.</div>
          <div class="terminal-line">&nbsp;</div>
        </div>
        <div class="terminal-prompt-row">
          <span class="terminal-prompt-label">juyel@os:~$</span>
          <input type="text" id="terminal-cli-input" class="terminal-input" autocomplete="off" spellcheck="false" placeholder="Type a command...">
        </div>
      </div>
    `;

    const input = container.querySelector('#terminal-cli-input');
    const history = container.querySelector('#terminal-output-stream');

    if (input && history) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const cmd = input.value.trim().toLowerCase();
          input.value = '';
          this.executeTerminalCommand(cmd, history);
        }
      });
    }
  }

  executeTerminalCommand(cmd, history) {
    const addLine = (text, className = '') => {
      const line = document.createElement('div');
      line.className = `terminal-line ${className}`;
      line.textContent = text;
      history.appendChild(line);
      history.scrollTop = history.scrollHeight;
    };

    addLine(`juyel@os:~$ ${cmd}`);

    switch (cmd) {
      case 'help':
        addLine('Available commands:', 'output-info');
        addLine('  help       - Display this command list');
        addLine('  projects   - Open Projects explorer & list key builds');
        addLine('  skills     - Display technical stack proficiency');
        addLine('  bio        - View summary biography and credentials');
        addLine('  contact    - Open project brief & reach out directly');
        addLine('  theme dark - Switch to Dark Obsidian theme');
        addLine('  theme night- Switch to Cosmic Indigo theme');
        addLine('  theme day  - Switch to Frosted Pearl Day theme');
        addLine('  clear      - Clear terminal history');
        break;

      case 'projects':
        addLine('Key Projects:', 'output-success');
        ownerProfile.projects.forEach(p => {
          addLine(`  • ${p.name} (${p.category}) - ${p.outcome}`);
        });
        windowManager.openWindow('projects');
        break;

      case 'skills':
        addLine('Technical Stack:', 'output-info');
        addLine('  • Languages: JavaScript (ES6+), Dart, Python, Java, HTML5, CSS3');
        addLine('  • Frameworks: Flutter, Node.js basics, GSAP, Modern CSS');
        addLine('  • Databases: Firebase Firestore, Local-First Storage');
        addLine('  • Specializations: AI-Assisted Workflows, Account Recovery, Device Diagnostics');
        break;

      case 'bio':
        addLine(ownerProfile.identity.intro);
        break;

      case 'contact':
        addLine(`Email: ${ownerProfile.conversion.email}`, 'output-info');
        addLine(`WhatsApp / Phone: ${ownerProfile.conversion.phone}`);
        windowManager.openWindow('contact');
        break;

      case 'theme dark':
        desktopController.applyTheme('dark');
        addLine('Switched to Dark Obsidian theme.', 'output-success');
        break;

      case 'theme night':
        desktopController.applyTheme('night');
        addLine('Switched to Cosmic Indigo theme.', 'output-success');
        break;

      case 'theme day':
        desktopController.applyTheme('day');
        addLine('Switched to Frosted Pearl Day theme.', 'output-success');
        break;

      case 'clear':
        history.innerHTML = '';
        break;

      case '':
        break;

      default:
        addLine(`Command not recognized: '${cmd}'. Type 'help' for available commands.`, 'output-dim');
    }
  }

  /* --------------------------------------------------------------------------
     5. Founder.txt Memo Notepad App
     -------------------------------------------------------------------------- */
  renderFounderMemo() {
    const container = document.getElementById('founder-app-mount');
    if (!container) return;

    container.innerHTML = `
      <div class="notepad-editor-surface">
# FOUNDER_MEMO.txt
# Author: Juyel Rana
# Role: Software Developer & AI Systems Builder
# Updated: March 2026

## WHO I AM
I am a self-taught developer and problem solver based in West Bengal, India.
My journey began not in an elite computer science laboratory, but on the ground:
helping real people solve acute technical crises.

## WHAT I STAND FOR
1. Practicality Over Vanity: 
   Code is only as valuable as the real-world friction it eliminates.
2. Radical Accountability:
   Whether recovering 50+ locked business accounts or building offline-first mobile apps, 
   I take full ownership from root-cause diagnosis to final delivery.
3. AI as a Force Multiplier:
   I actively harness modern LLMs and AI workflows to accelerate development, 
   uncover subtle edge cases, and maintain high standards of code craftsmanship.

## NON-NEGOTIABLES
- Zero deceptive claims or dark UX patterns.
- Fast, accessible, high-contrast user interfaces that respect the visitor's time.
- Direct, transparent, and empathetic communication.

## CURRENT FOCUS
- Engineering responsive, high-performance web applications.
- Building resilient Flutter mobile applications with Firebase backends.
- Seeking an impactful engineering role or high-velocity team collaboration.

---
// Direct inquiries via Portfolio Contact form or LinkedIn
      </div>
    `;
  }

  /* --------------------------------------------------------------------------
     6. RanaNet Internal Browser App
     -------------------------------------------------------------------------- */
  renderBrowserApp() {
    const container = document.getElementById('browser-app-mount');
    if (!container) return;

    const bookmarks = [
      { title: 'Portfolio v2', url: 'https://rana0codes.github.io/Portfolio-v2/', icon: 'fas fa-laptop-code' },
      { title: 'Portfolio v1', url: 'https://rana0codes.github.io/Portfolio/', icon: 'fas fa-globe' },
      { title: 'GitHub (@Rana0Codes)', url: 'https://github.com/Rana0Codes', icon: 'fab fa-github' },
      { title: 'LinkedIn', url: 'https://www.linkedin.com/in/juyel-rana/', icon: 'fab fa-linkedin' },
      { title: 'YouTube Channel', url: 'https://www.youtube.com/@Rana0Codes', icon: 'fab fa-youtube' }
    ];

    container.innerHTML = `
      <div class="browser-chrome-bar">
        <button class="browser-nav-btn" id="browser-back"><i class="fas fa-arrow-left"></i></button>
        <button class="browser-nav-btn" id="browser-forward"><i class="fas fa-arrow-right"></i></button>
        <button class="browser-nav-btn" id="browser-refresh"><i class="fas fa-redo"></i></button>
        <input type="text" class="browser-url-input" id="browser-url" value="https://github.com/Rana0Codes" readonly>
        <a href="https://github.com/Rana0Codes" target="_blank" rel="noopener noreferrer" class="btn-primary" style="padding: 5px 14px; font-size: 11px;">Open in Tab <i class="fas fa-external-link-alt"></i></a>
      </div>
      <div class="browser-bookmarks-strip">
        ${bookmarks.map(b => `
          <div class="bookmark-chip" data-url="${b.url}">
            <i class="${b.icon}"></i> ${b.title}
          </div>
        `).join('')}
      </div>
      <div class="browser-viewport-frame" id="browser-frame-box">
        <div style="padding: 28px; text-align: center; color: var(--text-muted); margin: auto;">
          <i class="fab fa-github" style="font-size: 52px; color: var(--color-cyan); margin-bottom: 14px; display: block;"></i>
          <h3 style="color: var(--text-main); margin-bottom: 8px;">RanaNet Developer Gateway</h3>
          <p style="font-size: 13px; max-width: 460px; margin: 0 auto 18px; line-height: 1.6;">
            Cross-Origin browser security restricts raw iframing of external domains. Explore Juyel's code repositories directly below.
          </p>
          <a href="https://github.com/Rana0Codes" target="_blank" rel="noopener noreferrer" class="btn-primary">
            Visit github.com/Rana0Codes <i class="fas fa-external-link-alt"></i>
          </a>
        </div>
      </div>
    `;

    const chips = container.querySelectorAll('.bookmark-chip');
    const urlInput = container.querySelector('#browser-url');

    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const url = chip.getAttribute('data-url');
        if (url) {
          urlInput.value = url;
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      });
    });
  }

  /* --------------------------------------------------------------------------
     7. Contact & Commercial Brief App
     -------------------------------------------------------------------------- */
  renderContactApp() {
    const container = document.getElementById('contact-app-mount');
    if (!container) return;

    container.innerHTML = `
      <div class="contact-form-layout">
        <!-- Direct Reachout Info -->
        <div class="contact-direct-card">
          <h3 style="font-size: 17px; margin-bottom: 12px; color: var(--color-cyan);">Direct Channels</h3>
          <p style="font-size: 13px; color: var(--text-muted); line-height: 1.6; margin-bottom: 20px;">
            Ready to build a web or mobile application, or need urgent technical troubleshooting? Reach out directly for rapid turnaround.
          </p>

          <div class="contact-route-item">
            <div class="route-icon-box"><i class="fas fa-envelope"></i></div>
            <div class="route-info-meta">
              <div class="route-label">Email</div>
              <div class="route-val">${ownerProfile.conversion.email}</div>
            </div>
            <button class="nav-pill-btn" id="copy-email-btn" style="font-size: 11px;">Copy</button>
          </div>

          <div class="contact-route-item">
            <div class="route-icon-box"><i class="fab fa-whatsapp"></i></div>
            <div class="route-info-meta">
              <div class="route-label">WhatsApp Direct</div>
              <div class="route-val">${ownerProfile.conversion.phone}</div>
            </div>
            <a href="${ownerProfile.conversion.whatsappUrl}" target="_blank" rel="noopener noreferrer" class="btn-primary" style="padding: 5px 12px; font-size: 11px;">Chat</a>
          </div>

          <div class="contact-route-item">
            <div class="route-icon-box"><i class="fas fa-map-marker-alt"></i></div>
            <div class="route-info-meta">
              <div class="route-label">Location</div>
              <div class="route-val">${ownerProfile.identity.location}</div>
            </div>
          </div>
        </div>

        <!-- Form Submission via Web3Forms (or direct mailto fallback) -->
        <form class="contact-form-fields" id="os-contact-form" action="https://api.web3forms.com/submit" method="POST">
          <input type="hidden" name="access_key" id="web3forms-access-key" value="YOUR_ACCESS_KEY_HERE">
          <input type="hidden" name="subject" value="New Project Inquiry from Juyel.OS">
          <input type="checkbox" name="botcheck" style="display: none;">

          <div class="form-field-group">
            <label for="contact-name">Your Name</label>
            <input type="text" id="contact-name" name="name" class="form-input-text" placeholder="e.g. Alex Vance" required>
          </div>

          <div class="form-field-group">
            <label for="contact-email">Email Address</label>
            <input type="email" id="contact-email" name="email" class="form-input-text" placeholder="name@company.com" required>
          </div>

          <div class="form-field-group">
            <label for="contact-service">Service Interested In</label>
            <select id="contact-service" name="service" class="form-select" required>
              <option value="Website Creation">Website Creation</option>
              <option value="Mobile App Development">Mobile App Development (Flutter)</option>
              <option value="AI Tools & Automation">AI Tools & Automation</option>
              <option value="Account Recovery & Security">Account Recovery & Security</option>
              <option value="Technical Diagnostics">Phone & Software Diagnostics</option>
              <option value="Other Project Inquiry">Other Project Inquiry</option>
            </select>
          </div>

          <div class="form-field-group">
            <label for="contact-message">Project Brief / Message</label>
            <textarea id="contact-message" name="message" class="form-textarea" placeholder="Describe your project, goals, or timeline..." required></textarea>
          </div>

          <button type="submit" class="form-submit-btn" id="contact-submit-btn">
            <span>Transmit Project Brief</span>
            <i class="fas fa-paper-plane"></i>
          </button>
          <div id="contact-status-feedback" style="font-size: 12px; margin-top: 6px; text-align: center;"></div>
        </form>
      </div>
    `;

    // Copy email handler
    const copyBtn = container.querySelector('#copy-email-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(ownerProfile.conversion.email).then(() => {
          copyBtn.textContent = 'Copied!';
          setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
        }).catch(() => {
          copyBtn.textContent = 'Failed';
        });
      });
    }

    // Ajax Form Submission with Safe Fallback
    const form = container.querySelector('#os-contact-form');
    const statusBox = container.querySelector('#contact-status-feedback');
    const submitBtn = container.querySelector('#contact-submit-btn');

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Transmitting...</span> <i class="fas fa-spinner fa-spin"></i>';
        statusBox.textContent = '';

        const name = form.querySelector('#contact-name')?.value || '';
        const email = form.querySelector('#contact-email')?.value || '';
        const service = form.querySelector('#contact-service')?.value || '';
        const message = form.querySelector('#contact-message')?.value || '';
        const keyInput = form.querySelector('#web3forms-access-key');
        const accessKey = (window.WEB3FORMS_ACCESS_KEY || keyInput?.value || '').trim();

        // If no access key is configured, safely open user's email client directly
        if (!accessKey || accessKey === 'YOUR_ACCESS_KEY_HERE') {
          const subject = encodeURIComponent(`[Juyel.OS Inquiry] ${service} - from ${name}`);
          const body = encodeURIComponent(`Hi Juyel,\n\nName: ${name}\nEmail: ${email}\nService: ${service}\n\nProject Brief:\n${message}\n\nSent via Juyel.OS`);
          window.open(`mailto:${ownerProfile.conversion.email}?subject=${subject}&body=${body}`, '_blank');
          statusBox.style.color = '#34d399';
          statusBox.textContent = '✓ Opened email client with your project brief ready to send to Juyel!';
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Transmit Project Brief</span> <i class="fas fa-paper-plane"></i>';
          form.reset();
          return;
        }

        try {
          const formData = new FormData(form);
          formData.set('access_key', accessKey);
          const response = await fetch(form.action, {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
          });

          if (response.ok) {
            statusBox.style.color = '#34d399';
            statusBox.textContent = '✓ Transmission confirmed! Juyel will respond within 24 hours.';
            form.reset();
          } else {
            throw new Error('Form submission failed.');
          }
        } catch (err) {
          statusBox.style.color = 'var(--color-danger)';
          statusBox.textContent = 'Transmission error. Opening direct email client instead...';
          const subject = encodeURIComponent(`[Juyel.OS Inquiry] ${service} - from ${name}`);
          const body = encodeURIComponent(`Hi Juyel,\n\nName: ${name}\nEmail: ${email}\nService: ${service}\n\nProject Brief:\n${message}`);
          window.open(`mailto:${ownerProfile.conversion.email}?subject=${subject}&body=${body}`, '_blank');
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Transmit Project Brief</span> <i class="fas fa-paper-plane"></i>';
        }
      });
    }
  }

  /* --------------------------------------------------------------------------
     8. Resume & Journey App
     -------------------------------------------------------------------------- */
  renderResumeApp() {
    const container = document.getElementById('resume-app-mount');
    if (!container) return;

    const journey = ownerProfile.journey;

    container.innerHTML = `
      <div class="resume-download-strip">
        <div>
          <h3 style="font-size: 16px; color: var(--text-main); font-weight: 700;">Juyel Rana — Official Curriculum Vitae</h3>
          <p style="font-size: 13px; color: var(--text-muted);">Aspiring Developer • Web & Mobile Focus</p>
        </div>
        <a href="${ownerProfile.conversion.secondaryUrl}" download="Juyel_Rana_CV.pdf" class="btn-primary">
          <i class="fas fa-download"></i> Download CV (PDF)
        </a>
      </div>

      <div class="section-subhead"><i class="fas fa-history"></i> Career & Engineering Journey</div>
      <div class="journey-timeline-stack">
        ${journey.map(j => `
          <div class="journey-item-node">
            <div class="journey-dot"></div>
            <div class="journey-year-tag">${j.year}</div>
            <div class="journey-title">${j.title}</div>
            <div class="journey-company">${j.company}</div>
            <div class="journey-desc">${j.description}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /* --------------------------------------------------------------------------
     9. Services App
     -------------------------------------------------------------------------- */
  renderServicesApp() {
    const container = document.getElementById('services-app-mount');
    if (!container) return;

    const services = ownerProfile.services;

    container.innerHTML = `
      <div class="projects-grid-layout">
        ${services.map(s => `
          <div class="project-os-card" style="padding: 18px;">
            <div style="font-family: var(--font-display); font-size: 20px; font-weight: 800; color: var(--color-cyan); margin-bottom: 6px;">${s.num}</div>
            <h3 class="project-title">${s.title}</h3>
            <p class="project-problem-text">${s.desc}</p>
            <div class="project-tech-chips">
              ${s.tags.map(t => `<span class="tech-chip">${t}</span>`).join('')}
            </div>
            <button class="btn-primary service-inquire-btn" data-service="${s.title}" style="margin-top: auto; padding: 8px 14px; font-size: 12px;">
              Inquire About ${s.title} &rarr;
            </button>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelectorAll('.service-inquire-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const serviceName = btn.getAttribute('data-service');
        windowManager.openWindow('contact');
        const select = document.getElementById('contact-service');
        if (select && serviceName) {
          select.value = serviceName;
        }
      });
    });
  }
}

export const appManager = new AppManager();
