export const en = {
  meta: {
    localeName: "English",
    htmlLang: "en",
  },
  brand: {
    name: "ResolveGraph AI",
    subtitle: "Grievance Resolution Intelligence Platform",
    prototypeBadge: "Prototype — synthetic demo data",
  },
  nav: {
    home: "Home",
    report: "Report Complaint",
    track: "Track Complaint",
    howItWorks: "How It Works",
    help: "Help",
    login: "Login",
    openMenu: "Open navigation menu",
    closeMenu: "Close navigation menu",
    mainNavigation: "Main navigation",
  },
  a11y: {
    skipToMain: "Skip to main content",
    controlsLabel: "Accessibility controls",
    increaseText: "Increase text size",
    decreaseText: "Decrease text size",
    resetText: "Reset text size",
    highContrast: "High contrast",
    highContrastOn: "High contrast mode is on",
    highContrastOff: "High contrast mode is off",
    keyboardHelp: "Keyboard navigation",
    keyboardHelpText:
      "Use Tab to move forward, Shift and Tab to move back, Enter or Space to activate, and Escape to close dialogs. A focus outline always shows your current position.",
    languageLabel: "Select language",
  },
  home: {
    hero: {
      title: "Report problems. Track action. Verify resolution.",
      text: "ResolveGraph AI connects related complaints, coordinates responsible departments and helps ensure that reported problems receive verified resolution.",
      report: "Report a Complaint",
      track: "Track Existing Complaint",
    },
    emergency: {
      title: "This is not an emergency service",
      text: "For emergencies or immediate threats to life, contact the appropriate emergency service. This portal handles non-emergency grievances.",
    },
    process: {
      title: "How the complaint process works",
      steps: [
        {
          title: "Submit your complaint",
          text: "Describe the problem in your own language, add the location and any photographs you have.",
        },
        {
          title: "We check for related reports",
          text: "If other people reported the same problem, an officer links the reports into one incident so the work is not repeated.",
        },
        {
          title: "Departments receive tasks",
          text: "The responsible departments receive their part of the work, along with a deadline set by the organisation.",
        },
        {
          title: "Closure is verified",
          text: "Officers must upload proof of completed work. A supervisor checks the proof before the complaint is marked resolved.",
        },
        {
          title: "The area stays monitored",
          text: "If a similar complaint arrives from the same place soon after closure, the system raises a recurrence alert.",
        },
      ],
    },
    categories: {
      title: "Complaint categories we accept",
      items: [
        { title: "Water supply", text: "Pipeline leaks, no supply, contaminated water." },
        { title: "Roads and footpaths", text: "Potholes, damaged surfaces, unsafe excavation." },
        { title: "Electricity and street lighting", text: "Exposed wires, poles, unlit streets." },
        { title: "Sanitation and waste", text: "Uncollected waste, blocked drains, standing water." },
        { title: "Drainage and flooding", text: "Overflowing drains, waterlogging after rain." },
        { title: "Public safety hazards", text: "Unsafe structures, open pits, hazards near schools." },
        { title: "Public health", text: "Mosquito breeding, unsanitary public facilities." },
        { title: "Not sure", text: "Describe the problem and we will route it correctly." },
      ],
    },
    methods: {
      title: "Ways to submit a complaint",
      items: [
        { title: "Written description", text: "Type the details in English, Hindi or Marathi." },
        { title: "Voice input", text: "Speak your complaint if typing is difficult." },
        { title: "Photographs", text: "Attach photographs of the problem as evidence." },
        { title: "Map location", text: "Drop a pin, use your current location or name a landmark." },
      ],
    },
    tracking: {
      title: "Tracking your complaint",
      text: "Every submission receives a tracking code. Use it to see the current status, the responsible department, the deadline the department is working towards, the work completed so far, and the proof submitted at closure.",
      cta: "Track a complaint",
    },
    languages: {
      title: "Available in your language",
      text: "The full portal is available in English, Hindi and Marathi. Your complaint is always kept in the language you wrote it in. If a translation is shown to an officer, it is clearly labelled as a translated version and the original text is never replaced.",
    },
    faq: {
      title: "Frequently asked questions",
      items: [
        {
          q: "Do I need an account to report a problem?",
          a: "No. You can submit a complaint and track it with the tracking code you receive. An account only helps you see all of your past complaints in one place.",
        },
        {
          q: "Why was my complaint linked to an incident?",
          a: "When several people report the same real problem, an officer links the reports into a single incident. Your complaint keeps its own tracking code and its original text.",
        },
        {
          q: "Who decides the deadline?",
          a: "Deadlines come from the rules set by the organisation for each category and priority level. They are not generated automatically by the system.",
        },
        {
          q: "What happens if the problem returns?",
          a: "The location stays under monitoring after closure. A similar complaint nearby raises a recurrence alert for a supervisor to reopen or relink the case.",
        },
        {
          q: "Who can see my personal details?",
          a: "Your contact details are never shown on public pages. Officers handling your complaint see only what they need to resolve it.",
        },
      ],
    },
    trust: {
      title: "Accessibility and privacy",
      accessibility: {
        title: "Accessibility",
        text: "The portal supports keyboard navigation, screen readers, larger text, a high contrast mode and browser zoom. Status is always shown with text, never with colour alone.",
      },
      privacy: {
        title: "Privacy",
        text: "Location is used only to place the complaint. Photographs are stored as evidence for the handling departments. Personal contact details are never published.",
      },
    },
  },
  pages: {
    howItWorks: {
      title: "How It Works",
      intro:
        "This page explains what happens to a complaint after you submit it, from intake to verified closure.",
    },
    help: {
      title: "Help",
      intro: "Guidance on submitting, tracking and following up on a complaint.",
      contactTitle: "Need more help?",
      contactText:
        "This prototype does not yet have a staffed help desk. Support contact details will be published by the operating organisation before public use.",
    },
    report: {
      title: "Report a Complaint",
      intro:
        "The four-step complaint form — description, location, evidence and review — is being built in the next stage of this prototype.",
    },
    track: {
      title: "Track Complaint",
      intro:
        "Complaint tracking by code, with the status timeline and verified closure evidence, is being built in the next stage of this prototype.",
    },
    login: {
      title: "Officer Login",
      intro:
        "Sign in for officers, supervisors, administrators and auditors is being built in a later stage of this prototype.",
    },
    stageNotice: "Coming in a later stage",
  },
  footer: {
    aboutTitle: "About this portal",
    aboutText:
      "ResolveGraph AI is an independent prototype. It is not affiliated with, endorsed by, or operated by any government body, and it contains synthetic demonstration data only.",
    servicesTitle: "Citizen services",
    infoTitle: "Information",
    accessibility: "Accessibility",
    privacy: "Privacy",
    rights: "ResolveGraph AI — prototype build.",
  },
} as const;

export type Dictionary = typeof en;
