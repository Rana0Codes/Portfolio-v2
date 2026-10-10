/**
 * Juyel OS — Canonical Owner Profile Data Contract
 * Personal data, projects, metrics, and configurations for Juyel Rana.
 */

export const ownerProfile = {
  identity: {
    fullName: 'Juyel Rana',
    shortName: 'Juyel',
    osName: 'Portfolio v2 (Juyel.OS)',
    domain: 'https://rana0codes.github.io/Portfolio-v2/',
    location: 'Kolkata, WB, India',
    timezone: 'Asia/Kolkata (IST / UTC+5:30)',
    roles: [
      'Software Developer',
      'Mobile & Web Builder',
      'Problem Solver',
      'AI-Assisted Engineer',
      'Tech Specialist'
    ],
    headline: "Hello I'm Juyel Rana",
    intro: 'Developer with experience in building web and mobile applications, focusing on creating real-life utility tools such as expense trackers, video downloaders, and document converters. Actively integrates AI tools and large language models into development workflows to accelerate delivery and code quality.',
    portrait: 'assets/profile-photo.jpg',
    sprite: 'assets/profile-photo.jpg',
    availability: 'Available for Work & Projects'
  },

  imageGeneration: {
    mode: 'native-svg-canvas',
    provider: 'in-browser-engine',
    model: 'vector-bot-v1',
    apiKeyEnvironmentVariable: 'NONE_NEEDED',
    approvedSourceImages: ['assets/profile-photo.jpg'],
    likenessNotes: 'Professional, sharp, modern developer workstation aesthetic with brand neon cyan and violet.',
    requiredOutputs: ['avatar', 'j-bot-companion', 'case-visuals'],
    finalApprovalBy: 'Juyel Rana'
  },

  conversion: {
    primaryLabel: 'Hire Me / Project Brief',
    primaryUrl: '#contact',
    secondaryLabel: 'Download CV',
    secondaryUrl: 'assets/cv/CV.pdf',
    bookingUrl: 'https://wa.me/917679862322?text=Hi%20Juyel,%20I%20would%20like%20to%20discuss%20a%20project',
    whatsappUrl: 'https://wa.me/917679862322',
    email: 'ranajuyel460@gmail.com',
    phone: '+91 7679862322',
    emergencyLabel: 'Urgent Tech Support / WhatsApp'
  },

  metrics: [
    {
      value: '50+',
      label: 'Accounts Recovered & Secured',
      status: 'verified',
      source: 'Client records for Facebook and Google account recovery',
      public: true,
      lastVerified: '2026-03-01'
    },
    {
      value: '100+',
      label: 'Devices Diagnosed & Serviced',
      status: 'verified',
      source: 'Hands-on technical diagnostics and software resolution',
      public: true,
      lastVerified: '2026-03-01'
    },
    {
      value: '10+',
      label: 'Shipped Applications & Tools',
      status: 'verified',
      source: 'Production mobile, desktop, and web applications',
      public: true,
      lastVerified: '2026-03-01'
    },
    {
      value: '200+',
      label: 'GitHub Commits',
      status: 'verified',
      source: 'github.com/Rana0Codes',
      public: true,
      lastVerified: '2026-03-01'
    }
  ],

  projects: [
    {
      id: 'smart-image-document-detector',
      name: 'Smart Image & Document Detector',
      client: 'Computer Vision / Edge AI',
      category: 'Machine Learning',
      dates: '2024 - 2025',
      role: 'ML & Frontend Engineer',
      problem: 'Cloud-dependent document inspection creates data privacy risks, network latency, and continuous server hosting costs.',
      intervention: 'Architected an in-browser neural classification pipeline using TensorFlow.js and MobileNetV2 UINT8 quantization with WebGL acceleration.',
      outcome: '16.2–18.4ms client-side WebGL inference, 0 bytes external telemetry, verified 100% private processing.',
      outcomeStatus: 'verified',
      url: 'https://github.com/Rana0Codes/smart-image-document-detector',
      repository: 'https://github.com/Rana0Codes/smart-image-document-detector',
      image: 'assets/concepts/concept_a_3d_studio_hero.jpg',
      stack: ['TensorFlow.js', 'MobileNetV2', 'Python', 'WebGL', 'Edge AI'],
      services: ['Computer Vision', 'Edge Machine Learning'],
      featured: true
    },
    {
      id: 'cv-template',
      name: 'CV Template & Indian Biodata Builder',
      client: 'Client-Side Productivity Tool',
      category: 'Web Application',
      dates: '2024 - 2025',
      role: 'Lead Frontend Engineer',
      problem: 'Online resume tools impose aggressive paywalls, require account lock-in, and compromise print layout fidelity across desktop browsers.',
      intervention: 'Built an open-source, client-side PWA resume and marriage biodata builder with 5 modular templates, live editing, and pixel-perfect A4 vector print CSS engine.',
      outcome: '100% client-side zero-server execution, sub-second print rendering, and full offline PWA support.',
      outcomeStatus: 'verified',
      url: 'https://rana0codes.github.io/cv-template/',
      repository: 'https://github.com/Rana0Codes/cv-template',
      image: 'assets/projects/cv_template_preview.png',
      stack: ['Vanilla JavaScript', 'CSS3 Print Engine', 'PWA', 'Vite', 'LocalStorage'],
      services: ['Frontend Architecture', 'PWA Development'],
      featured: true
    },
    {
      id: 'anime-recommendation-generator',
      name: 'Anime Recommendation & Poster Studio',
      client: 'Creative Web Application',
      category: 'Web Application',
      dates: '2024 - 2025',
      role: 'Full-Stack Developer',
      problem: 'Media discovery apps lack cohesive aesthetics, have sluggish API search times, and provide poor export options for sharing on social platforms.',
      intervention: 'Developed an interactive recommendation and poster generation suite querying the AniList GraphQL API with customized theme engines and html2canvas 1080p export.',
      outcome: 'Sub-300ms GraphQL query times, high-fidelity 1080p poster card generation, and fluid Material-UI responsive interactions.',
      outcomeStatus: 'verified',
      url: 'https://github.com/Rana0Codes/Anime-Recommendation-Generator',
      repository: 'https://github.com/Rana0Codes/Anime-Recommendation-Generator',
      image: 'assets/projects/anime_studio_preview.png',
      stack: ['React 18', 'Material-UI v5', 'GraphQL', 'AniList API', 'html2canvas'],
      services: ['React UI Engineering', 'API Integration'],
      featured: true
    },
    {
      id: 'portfolio-v2',
      name: 'Portfolio v2 (Juyel.OS) & 3D Universe',
      client: 'Interactive Experience',
      category: 'Web Application',
      dates: '2025 - 2026',
      role: 'Creative Technologist & Systems Architect',
      problem: 'Developer portfolios are static, repetitive, and fail to showcase real frontend mastery, interactive graphics, or systems thinking.',
      intervention: 'Engineered a VisionOS-inspired interactive web desktop featuring a multi-window manager, Web Audio API synthesis, and a genuine Three.js 3D Project Universe.',
      outcome: '60 FPS WebGL rendering, complete multi-window task management, 0 build dependencies for maximum longevity.',
      outcomeStatus: 'verified',
      url: 'https://rana0codes.github.io/Portfolio-v2/',
      repository: 'https://github.com/Rana0Codes/Portfolio-v2',
      image: 'assets/screenshots/desktop-hero.png',
      stack: ['Three.js', 'Vanilla JS ES6+', 'Glassmorphic CSS', 'Web Audio API', 'Canvas'],
      services: ['Creative Coding', 'Interactive WebGL', 'UI/UX Design'],
      featured: true
    },
    {
      id: 'portfolio-system',
      name: 'Dynamic Web Engine & Admin Dashboard',
      client: 'Content Management Platform',
      category: 'Web Application',
      dates: '2024 - 2025',
      role: 'Full-Stack Architect',
      problem: 'Static portfolios require developer code commits and deployments for minor content or credential adjustments.',
      intervention: 'Constructed an authenticated portfolio platform backed by Firebase Firestore real-time listeners, a secure admin CRUD console, and Web3Forms integration.',
      outcome: 'Zero-downtime instant updates, sub-second Firestore sync, and automated spam filtering.',
      outcomeStatus: 'verified',
      url: 'https://rana0codes.github.io/Portfolio/',
      repository: 'https://github.com/Rana0Codes/Portfolio',
      image: 'assets/projects/project3.jpg',
      stack: ['JavaScript ES6+', 'Firebase Auth', 'Cloud Firestore', 'GSAP', 'HTML5/CSS3'],
      services: ['Full-Stack Engineering', 'CMS Architecture'],
      featured: true
    },
    {
      id: 'bachat-guru',
      name: 'BachatGuru',
      client: 'Mobile Utility Platform',
      category: 'Mobile App',
      dates: '2024 - 2025',
      role: 'Lead Mobile Developer',
      problem: 'Personal finance apps suffer from data bloat, aggressive monetization, and poor offline synchronization in spotty network zones.',
      intervention: 'Engineered a clean mobile expense tracking application using Flutter with offline-first caching, Firestore cloud synchronization, and sub-second summary charts.',
      outcome: 'Real-time multi-device synchronization with sub-second latency and zero data loss offline.',
      outcomeStatus: 'verified',
      url: 'https://github.com/Rana0Codes',
      repository: 'https://github.com/Rana0Codes',
      image: 'assets/projects/project1.jpg',
      stack: ['Flutter', 'Dart', 'Firebase', 'Firestore', 'State Management'],
      services: ['Mobile App Development', 'Database Architecture'],
      featured: true
    }
  ],

  clientCases: [
    {
      title: 'Social Identity & Account Restoration',
      client: '50+ Individual & Business Clients',
      metric: '50+ Accounts Successfully Restored',
      disclosure: 'Client-reported and verified recovery records',
      description: 'Systematic recovery of hacked and locked Facebook, Gmail, and Instagram accounts via security verification pipelines, identity proofing, and credential hardening.',
      stack: ['Security Verification', 'Credential Hardening', '2FA Setup']
    },
    {
      title: 'Hardware & OS Troubleshooting',
      client: '100+ Local Users & Devices',
      metric: '100+ Devices Restored to Peak Health',
      disclosure: 'Hands-on local service diagnostics',
      description: 'In-depth diagnostics for Android and iOS systems, resolving boot loops, storage bloat, firmware crashes, and performance degradation.',
      stack: ['System Diagnostics', 'OS Flashing', 'Performance Tuning']
    },
    {
      title: 'BachatGuru Expense Tracking',
      client: 'Mobile End Users',
      metric: '<1s Cloud Data Sync Latency',
      disclosure: 'Measured on Firestore real-time listeners',
      description: 'Real-time multi-device budgeting system built with Flutter and Firebase, enabling frictionless offline tracking with automatic conflict resolution.',
      stack: ['Flutter', 'Firestore Offline Cache', 'Cloud Sync']
    }
  ],

  testimonials: [
    {
      author: 'Ravi M.',
      role: 'Business Owner',
      text: 'My business Facebook account was compromised and locked for over a week. Juyel systematically restored access within hours and secured all linked assets with two-factor protocols.',
      service: 'Account Security'
    },
    {
      author: 'Subrata D.',
      role: 'Creative Professional',
      text: 'Juyel built a modern, blazing-fast web solution for our brand. Clean code, prompt communication, and great eye for responsiveness across mobile screens.',
      service: 'Website Development'
    },
    {
      author: 'Amitabh S.',
      role: 'Local Client',
      text: 'Fast and reliable software fixes for multiple devices. Juyel diagnoses the exact root cause rather than guessing.',
      service: 'Technical Troubleshooting'
    }
  ],

  journey: [
    {
      year: '2021 - 2022',
      title: 'Hardware & Software Diagnostics',
      company: 'Local Community Services',
      description: 'Provided phone software repairs, resolved app crashes, and solved firmware issues for 100+ devices, building a reputation for meticulous technical troubleshooting.'
    },
    {
      year: '2022 - 2023',
      title: 'Account Recovery & Security Specialist',
      company: 'Independent Service',
      description: 'Developed systematic verification protocols to help community members and businesses recover compromised social media and cloud accounts, protecting digital identities.'
    },
    {
      year: '2023 - 2024',
      title: 'Self-Taught Engineering & AI Adoption',
      company: 'Continuous Exploration',
      description: 'Mastered modern web development (HTML, CSS, modern JavaScript) and mobile development with Flutter. Integrated LLMs and AI coding tools into daily workflows to accelerate engineering cycles.'
    },
    {
      year: '2024 - 2025',
      title: 'Shipped Utility Software & Web Applications',
      company: 'Production Projects',
      description: 'Built and deployed BachatGuru, media downloaders, and file management tools. Delivered responsive client websites with modern animations and serverless form gateways.'
    },
    {
      year: '2025 - Present',
      title: 'AI Systems Builder & Full-Stack Developer',
      company: 'Freelance & Open Source',
      description: 'Engineering intelligent web applications, modern personal operating systems, and automated workflows. Ready for high-impact software engineering roles and team collaborations.'
    }
  ],

  achievements: [
    {
      badge: 'B.A. Graduate',
      year: '2024',
      desc: 'Completed Bachelor of Arts degree with focus on critical thinking and communication.'
    },
    {
      badge: 'Self-Taught Engineer',
      year: '2023-Present',
      desc: 'Mastered web and mobile frameworks through hands-on project building and documentation.'
    },
    {
      badge: '50+ Account Rescues',
      year: '2022-2025',
      desc: '100% success rate in resolving complex social and cloud account security locks.'
    },
    {
      badge: 'Multi-Lingual Communicator',
      year: 'Fluent',
      desc: 'Proficient in Bengali (Native), Hindi (Fluent), and English (Technical & Professional).'
    }
  ],

  services: [
    {
      id: 'web-dev',
      num: '01',
      title: 'Website Creation',
      desc: 'Bespoke, high-performance responsive websites engineered with clean semantics, micro-animations, and mobile-first layouts.',
      tags: ['HTML5', 'CSS3', 'JavaScript', 'Responsive Design', 'Vite/Vercel']
    },
    {
      id: 'mobile-dev',
      num: '02',
      title: 'Mobile App Development',
      desc: 'Cross-platform native applications built with Flutter and Dart, backed by real-time cloud synchronizations in Firebase.',
      tags: ['Flutter', 'Dart', 'Firebase', 'State Management', 'Android/iOS']
    },
    {
      id: 'ai-assisted',
      num: '03',
      title: 'AI Tools & Automation',
      desc: 'Supercharging software workflows with prompt engineering, LLM-assisted code generation, and intelligent automation pipelines.',
      tags: ['LLMs', 'Prompt Engineering', 'Workflow Automation', 'Python']
    },
    {
      id: 'security-recovery',
      num: '04',
      title: 'Account Recovery & Hardening',
      desc: 'Authorized recovery of locked or compromised Facebook, Google, and business accounts with end-to-end security audits.',
      tags: ['Identity Verification', '2FA Setup', 'Account Hardening', 'Security Audits']
    },
    {
      id: 'software-repair',
      num: '05',
      title: 'Device & Software Diagnostics',
      desc: 'Root-cause troubleshooting for phone software, memory leaks, OS glitches, and app installation errors.',
      tags: ['Diagnostics', 'Android', 'iOS', 'Performance Optimization']
    },
    {
      id: 'seo-optimization',
      num: '06',
      title: 'SEO & Web Performance',
      desc: 'Technical SEO, structured data schemas, Core Web Vitals optimization, and high-contrast accessibility compliance.',
      tags: ['Core Web Vitals', 'Structured Data', 'Accessibility (WCAG AA)', 'Lighthouse 95+']
    }
  ],

  socials: [
    {
      name: 'GitHub',
      handle: '@Rana0Codes',
      url: 'https://github.com/Rana0Codes',
      icon: 'fab fa-github',
      role: 'Code Repositories & Open Source'
    },
    {
      name: 'LinkedIn',
      handle: 'juyel-rana',
      url: 'https://www.linkedin.com/in/juyel-rana/',
      icon: 'fab fa-linkedin-in',
      role: 'Professional Network & Experience'
    },
    {
      name: 'YouTube',
      handle: '@Rana0Codes',
      url: 'https://www.youtube.com/@Rana0Codes',
      icon: 'fab fa-youtube',
      role: 'Tech Tutorials & Demonstrations'
    },
    {
      name: 'X (Twitter)',
      handle: '@Rana0Codes',
      url: 'https://x.com/Rana0Codes',
      icon: 'fab fa-x-twitter',
      role: 'Developer Updates & Insights'
    },
    {
      name: 'Instagram',
      handle: '@rana0codes',
      url: 'https://www.instagram.com/rana0codes/',
      icon: 'fab fa-instagram',
      role: 'Personal Journey & Behind The Scenes'
    }
  ],

  videos: [
    {
      title: 'Building Modern Web & Mobile Systems',
      category: 'Engineering Walkthrough',
      duration: '05:30',
      description: 'Demonstrating architecture, state handling, and clean code principles in real applications.',
      url: 'https://www.youtube.com/@Rana0Codes'
    }
  ],

  music: [
    {
      title: 'Midnight Lo-Fi',
      artist: 'Vision Chill & Beats',
      genre: 'Lofi Chillhop',
      file: 'assets/audio/midnight-lofi.mp3'
    },
    {
      title: 'Deep Focus Flow',
      artist: 'Lofi Dreamscape',
      genre: 'Focus & Study Beats',
      file: 'assets/audio/deep-focus.mp3'
    },
    {
      title: 'Chasing That Feeling',
      artist: 'Quincy Larson & Synth Crew',
      genre: 'Synthwave & Coding Beats',
      file: 'assets/audio/chasing-feeling.mp3'
    },
    {
      title: 'Cyber Neon Groove',
      artist: 'Mixkit Electronic Labs',
      genre: 'Futuristic Electronic',
      file: 'assets/audio/cyber-groove.mp3'
    }
  ],

  articles: [
    {
      slug: 'how-ai-accelerates-self-taught-developers',
      title: 'How AI Assisted Workflows Turbocharge Self-Taught Developers',
      date: '2025-02-15',
      summary: 'Moving beyond passive tutorials: how using LLMs for instant code reviews and edge-case diagnostics builds true engineering mastery.',
      readTime: '4 min read'
    },
    {
      slug: 'flutter-firebase-offline-first-budgeting',
      title: 'Engineering an Offline-First Expense Tracker with Flutter and Firebase',
      date: '2025-01-20',
      summary: 'Architecting local caching and conflict resolution in BachatGuru for seamless real-time mobile synchronization.',
      readTime: '6 min read'
    }
  ],

  themes: {
    dark: {
      name: 'Titanium VisionOS (Dark)',
      bg: '#070a13',
      surface: 'rgba(14, 19, 34, 0.85)',
      primary: '#3b82f6',
      accent: '#8b5cf6',
      cyan: '#38bdf8',
      text: '#f8fafc',
      textMuted: '#94a3b8'
    },
    night: {
      name: 'Cosmic Indigo (Night)',
      bg: '#080b1e',
      surface: 'rgba(18, 22, 48, 0.88)',
      primary: '#a855f7',
      accent: '#6366f1',
      cyan: '#38bdf8',
      text: '#f8fafc',
      textMuted: '#cbd5e1'
    },
    day: {
      name: 'Frosted Pearl (Day)',
      bg: '#f0f4f9',
      surface: 'rgba(255, 255, 255, 0.9)',
      primary: '#2563eb',
      accent: '#7c3aed',
      cyan: '#0284c7',
      text: '#0f172a',
      textMuted: '#334155'
    }
  },

  legal: {
    copyrightOwner: 'Juyel Rana',
    assetLicenses: 'All rights reserved. Profile media and project screenshots owned by Juyel Rana.',
    metricDisclaimer: 'All client recovery metrics and project deliverables are documented and verified from real-world operations.'
  }
};
