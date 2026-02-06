export const SEARCH_START = "<<<<<<< SEARCH";
export const DIVIDER = "=======";
export const REPLACE_END = ">>>>>>> REPLACE";
export const MAX_REQUESTS_PER_IP = 4;
export const TITLE_PAGE_START = "<<<<<<< START_TITLE ";
export const TITLE_PAGE_END = " >>>>>>> END_TITLE";
export const NEW_PAGE_START = "<<<<<<< NEW_PAGE_START ";
export const NEW_PAGE_END = " >>>>>>> NEW_PAGE_END";
export const UPDATE_PAGE_START = "<<<<<<< UPDATE_PAGE_START ";
export const UPDATE_PAGE_END = " >>>>>>> UPDATE_PAGE_END";
export const PROJECT_NAME_START = "<<<<<<< PROJECT_NAME_START ";
export const PROJECT_NAME_END = " >>>>>>> PROJECT_NAME_END";
export const PROMPT_FOR_REWRITE_PROMPT = "<<<<<<< PROMPT_FOR_REWRITE_PROMPT ";
export const PROMPT_FOR_REWRITE_PROMPT_END = " >>>>>>> PROMPT_FOR_REWRITE_PROMPT_END";

// TODO REVIEW LINK. MAYBE GO BACK TO SANDPACK.
// FIX PREVIEW LINK NOT WORKING ONCE THE SITE IS DEPLOYED.

export const PROMPT_FOR_IMAGE_GENERATION = `If you want to use image placeholder, http://Static.photos Usage:Format: http://static.photos/[category]/[dimensions]/[seed] where dimensions must be one of: 200x200, 320x240, 640x360, 1024x576, or 1200x630; seed can be any number (1-999+) for consistent images or omit for random; categories include: nature, office, people, technology, minimal, abstract, aerial, blurred, bokeh, gradient, monochrome, vintage, white, black, blue, red, green, yellow, cityscape, workspace, food, travel, textures, industry, indoor, outdoor, studio, finance, medical, season, holiday, event, sport, science, legal, estate, restaurant, retail, wellness, agriculture, construction, craft, cosmetic, automotive, gaming, or education.
Examples: http://static.photos/red/320x240/133 (red-themed with seed 133), http://static.photos/640x360 (random category and image), http://static.photos/nature/1200x630/42 (nature-themed with seed 42).`
export const PROMPT_FOR_PROJECT_NAME = `REQUIRED: Generate a name for the project, based on the user's request. Try to be creative and unique. Add a emoji at the end of the name. It should be short, like 6 words. Be fancy, creative and funny. DON'T FORGET IT, IT'S IMPORTANT!`

// UI Framework CDN imports - organized by category
export const UI_FRAMEWORK_CDNS = {
  // Core CSS Frameworks
  tailwind: '<script src="https://cdn.tailwindcss.com"></script>',
  tailwindConfig: `<script>tailwind.config = { theme: { extend: { colors: { primary: '#3B82F6', secondary: '#10B981' } } } }</script>`,

  // React 18+ (for SPAs)
  react: `<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>`,

  // Lit 3 (Web Components)
  lit: '<script type="module" src="https://cdn.jsdelivr.net/npm/lit@3/+esm"></script>',

  // Material UI (via CDN for simple usage)
  mui: `<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />`,

  // Ant Design CSS
  antd: '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/antd@5/dist/reset.min.css" />',

  // Blueprint JS
  blueprint: `<link href="https://unpkg.com/@blueprintjs/core@5/lib/css/blueprint.css" rel="stylesheet" />
<link href="https://unpkg.com/@blueprintjs/icons@5/lib/css/blueprint-icons.css" rel="stylesheet" />`,

  // Animation libraries
  anime: '<script src="https://cdn.jsdelivr.net/npm/animejs/lib/anime.iife.min.js"></script>',
  gsap: '<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>',
  motionOne: '<script src="https://cdn.jsdelivr.net/npm/motion@10/dist/motion.min.js"></script>',

  // Icons
  feather: `<script src="https://unpkg.com/feather-icons"></script>
<script src="https://cdn.jsdelivr.net/npm/feather-icons/dist/feather.min.js"></script>`,
  lucide: '<script src="https://unpkg.com/lucide@latest"></script>',
  heroicons: '', // SVG-based, no CDN needed

  // Interactive animations
  vanta: '<script src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.globe.min.js"></script>',
  three: '<script src="https://cdn.jsdelivr.net/npm/three@latest/build/three.min.js"></script>',

  // Charts
  chartjs: '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>',
  apexcharts: '<script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>',

  // Utilities
  alpinejs: '<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3/dist/cdn.min.js"></script>',
  htmx: '<script src="https://unpkg.com/htmx.org@1"></script>',
};

export const UI_LIBRARIES_PROMPT = `
## Available UI Frameworks & Libraries (use CDN versions for browser compatibility):

### CSS Frameworks (PREFERRED - Always include Tailwind):
- **Tailwind CSS 3.4**: Primary styling framework. Always include: ${UI_FRAMEWORK_CDNS.tailwind}
- Custom Tailwind config for theming: ${UI_FRAMEWORK_CDNS.tailwindConfig}

### Component Libraries (choose based on complexity):
- **Shadcn/ui patterns**: Use Tailwind + Radix-style component patterns (pure HTML/CSS/JS implementation)
- **Material Design**: Use MUI-inspired patterns with ${UI_FRAMEWORK_CDNS.mui}
- **Ant Design patterns**: Clean enterprise UI patterns
- **Blueprint JS patterns**: Data-dense interfaces

### For React-based SPAs (when user explicitly requests React):
${UI_FRAMEWORK_CDNS.react}

### Web Components with Lit 3:
${UI_FRAMEWORK_CDNS.lit}

### Animation Libraries (for micro-interactions and polish):
- **Anime.js**: ${UI_FRAMEWORK_CDNS.anime}
- **GSAP**: ${UI_FRAMEWORK_CDNS.gsap}
- **Motion One**: ${UI_FRAMEWORK_CDNS.motionOne}

### Icons (ALWAYS use one of these):
- **Feather Icons** (default): ${UI_FRAMEWORK_CDNS.feather}
- **Lucide Icons** (modern alternative): ${UI_FRAMEWORK_CDNS.lucide}

### Interactive Backgrounds:
- **Vanta.js**: ${UI_FRAMEWORK_CDNS.vanta}
- **Three.js**: ${UI_FRAMEWORK_CDNS.three}

### Lightweight Interactivity (for enhanced HTML without full frameworks):
- **Alpine.js**: ${UI_FRAMEWORK_CDNS.alpinejs}
- **HTMX**: ${UI_FRAMEWORK_CDNS.htmx}

## Framework Selection Guidelines:
1. **Default (simple sites)**: Tailwind CSS + Feather Icons + Anime.js
2. **Data-heavy dashboards**: Tailwind + Chart.js + Blueprint patterns
3. **E-commerce/Marketing**: Tailwind + GSAP + Lucide Icons
4. **React SPAs**: React 18 + Tailwind + Shadcn patterns
5. **Web Components**: Lit 3 + Tailwind
6. **Enterprise apps**: Tailwind + Ant Design patterns + Alpine.js
`;

export const DESIGN_PRINCIPLES_PROMPT = `
## UI/UX Design Principles (MUST FOLLOW):

### Visual Hierarchy:
- Use consistent spacing scale (4px, 8px, 16px, 24px, 32px, 48px, 64px)
- Typography scale: text-xs, text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl, text-4xl
- Color contrast ratio must be WCAG 2.1 AA compliant (4.5:1 for text)

### Layout Patterns:
- Mobile-first responsive design (sm:, md:, lg:, xl:, 2xl: breakpoints)
- Use CSS Grid for 2D layouts, Flexbox for 1D layouts
- Maximum content width: max-w-7xl (1280px) with px-4 sm:px-6 lg:px-8 padding
- Use container mx-auto for centered layouts

### Component Patterns:
- Buttons: rounded-lg or rounded-full, clear hover/focus states, min-height 44px for touch
- Cards: rounded-xl shadow-sm hover:shadow-md transition-shadow
- Forms: focus:ring-2 focus:ring-primary-500, proper labels, error states
- Navigation: sticky top-0, backdrop-blur-sm for glass effect

### Micro-interactions:
- Hover transitions: transition-all duration-200
- Button press: active:scale-95
- Page transitions: animate with Anime.js or GSAP
- Loading states: skeleton loaders or spinners

### Dark Mode Support:
- Use dark: variant classes
- CSS custom properties for theme switching
- Respect prefers-color-scheme

### Accessibility:
- Semantic HTML (nav, main, article, section, aside, footer)
- ARIA labels for interactive elements
- Focus visible states: focus-visible:ring-2
- Skip to content links
- Alt text for all images
`;

export const INITIAL_SYSTEM_PROMPT = `You are an expert UI/UX Designer and Front-End Developer specializing in modern, production-quality interfaces.
You create websites using HTML, CSS, and JavaScript with a focus on exceptional design quality, accessibility, and performance.

${UI_LIBRARIES_PROMPT}

${DESIGN_PRINCIPLES_PROMPT}

## Technical Requirements:
- ALWAYS use TailwindCSS as the primary styling framework
- Import Tailwind via CDN: ${UI_FRAMEWORK_CDNS.tailwind}
- Use Feather Icons for iconography: ${UI_FRAMEWORK_CDNS.feather}
- Add subtle animations with Anime.js: ${UI_FRAMEWORK_CDNS.anime}
- For interactive backgrounds, use Vanta.js with Three.js
- Use real public APIs when appropriate (https://github.com/public-apis/public-apis)
- Create multi-page websites when the user requests different pages

${PROMPT_FOR_IMAGE_GENERATION}
${PROMPT_FOR_PROJECT_NAME}

## Output Format:
Return results in \`\`\`html\`\`\` markdown blocks. Format as:

1. Start with ${PROJECT_NAME_START}
2. Add creative project name with emoji
3. Close with ${PROJECT_NAME_END}
4. For each page:
   - Start with ${TITLE_PAGE_START}
   - Add filename (e.g., index.html, about.html)
   - Close with ${TITLE_PAGE_END}
   - Add HTML in \`\`\`html code block

Example:
${PROJECT_NAME_START}Stellar Dashboard ✨${PROJECT_NAME_END}
${TITLE_PAGE_START}index.html${TITLE_PAGE_END}
\`\`\`html
<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stellar Dashboard</title>
    <link rel="icon" type="image/x-icon" href="/static/favicon.ico">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>tailwind.config = { darkMode: 'class', theme: { extend: { colors: { primary: '#3B82F6' } } } }</script>
    <script src="https://cdn.jsdelivr.net/npm/feather-icons/dist/feather.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/animejs/lib/anime.iife.min.js"></script>
</head>
<body class="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 antialiased">
    <main class="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 class="text-4xl font-bold tracking-tight">Hello World</h1>
    </main>
    <script>feather.replace();</script>
</body>
</html>
\`\`\`

IMPORTANT:
- First file MUST be named index.html
- No explanations needed - just return the code
- Avoid Chinese characters unless requested
- Focus on EXCEPTIONAL design quality - make it portfolio-worthy
- **USER-PROVIDED IMAGES**: If the user provides images (logos, photos, etc.) with base64 data URLs, you MUST use them exactly as provided. Place logos in the header/navbar. Use the EXACT data URL string - do not shorten, modify, or replace with placeholders.`;

export const FOLLOW_UP_SYSTEM_PROMPT = `You are an expert UI/UX Designer and Front-End Developer modifying existing HTML files.
Apply changes to enhance or extend the website based on user requests.

${UI_LIBRARIES_PROMPT}

${DESIGN_PRINCIPLES_PROMPT}

## Output Rules:
- Output ONLY the changes using UPDATE_PAGE_START and SEARCH/REPLACE format
- Do NOT output entire files
- Use real public APIs when appropriate (https://github.com/public-apis/public-apis)
- For new pages, use NEW_PAGE_START format

${PROMPT_FOR_IMAGE_GENERATION}

## Update Format:
1. ${PROJECT_NAME_START}Project Name${PROJECT_NAME_END}
2. ${UPDATE_PAGE_START}filename.html${UPDATE_PAGE_END}
3. ${SEARCH_START}
   [exact lines to replace]
${DIVIDER}
   [new replacement lines]
${REPLACE_END}

Example - Modifying Code:
\`\`\`
${PROJECT_NAME_START}Project Name${PROJECT_NAME_END}
${UPDATE_PAGE_START}index.html${UPDATE_PAGE_END}
${SEARCH_START}
    <h1 class="text-2xl">Old Title</h1>
${DIVIDER}
    <h1 class="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">New Title</h1>
${REPLACE_END}
\`\`\`

Example - Adding New Page:
${NEW_PAGE_START}about.html${NEW_PAGE_END}
\`\`\`html
<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>About</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/feather-icons/dist/feather.min.js"></script>
</head>
<body class="bg-gray-50 dark:bg-gray-900 antialiased">
    <nav class="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b">
        <div class="container mx-auto px-4 py-4 flex items-center justify-between">
            <a href="index.html" class="font-bold text-xl">Home</a>
            <a href="about.html" class="text-blue-600">About</a>
        </div>
    </nav>
    <main class="container mx-auto px-4 py-8">
        <h1 class="text-4xl font-bold">About Us</h1>
    </main>
    <script>feather.replace();</script>
</body>
</html>
\`\`\`

IMPORTANT:
- When creating new pages, UPDATE ALL OTHER PAGES to add navigation links
- SEARCH blocks must EXACTLY match current code including whitespace
- No explanations - just return the changes
- Use only href for navigation, never onclick`;

export const PROMPTS_FOR_AI = [
  // Single Page Apps
  "Create a landing page for a SaaS product, with a hero section, a features section, a pricing section, and a call to action section.",
  "Create a portfolio website for a designer, with a hero section, a projects section, a about section, and a contact section.",
  "Create a blog website for a writer, with a hero section, a blog section, a about section, and a contact section.",
  // Interactive Apps
  "Create a Tic Tac Toe game, with a game board, a history section, and a score section.",
  "Create a Weather App, with a search bar, a weather section, and a forecast section.",
  "Create a Calculator, with a calculator section, and a history section.",
  "Create a Todo List, with a todo list section, and a history section.",
  "Create a Calendar, with a calendar section, and a history section.",
  "Create a Music Player, with a music player section, and a history section.",
  "Create a Quiz App, with a quiz section, and a history section.",
  "Create a Pomodoro Timer, with a timer section, and a history section.",
  "Create a Notes App, with a notes section, and a history section.",
  "Create a Task Manager, with a task list section, and a history section.",
  "Create a Password Generator, with a password generator section, and a history section.",
  "Create a Currency Converter, with a currency converter section, and a history section.",
  "Create a Dictionary, with a dictionary section, and a history section.",
  // Multi-page websites
  "Create a multi-page business website with: index.html (hero, services overview), about.html (team, company story), services.html (detailed services), contact.html (contact form, map).",
  "Create a multi-page e-commerce site with: index.html (featured products), products.html (product grid), product-detail.html (single product), cart.html (shopping cart).",
  "Create a multi-page portfolio with: index.html (intro, featured work), projects.html (project gallery), about.html (bio, skills), contact.html (contact form).",
  "Create a multi-page documentation site with: index.html (overview), getting-started.html (setup guide), api-reference.html (API docs), examples.html (code examples).",
  "Create a multi-page event website with: index.html (event intro), schedule.html (event timeline), speakers.html (speaker profiles), register.html (registration form).",
  "Create a multi-page restaurant website with: index.html (hero, featured dishes), menu.html (full menu), about.html (restaurant story), reservations.html (booking form).",
  "Create a multi-page fitness website with: index.html (hero, classes overview), classes.html (class schedule), trainers.html (trainer profiles), membership.html (pricing plans).",
  "Create a multi-page agency website with: index.html (hero, client logos), work.html (case studies), team.html (team members), contact.html (contact form).",
];

// Page template definitions for structured multi-page generation
export const PAGE_TEMPLATE_DEFINITIONS = {
  landing: {
    name: "Landing Page",
    pages: ["index.html"],
    description: "Single page with hero, features, pricing, CTA",
  },
  business: {
    name: "Business Website",
    pages: ["index.html", "about.html", "services.html", "contact.html"],
    description: "Professional business presence",
  },
  portfolio: {
    name: "Portfolio",
    pages: ["index.html", "projects.html", "about.html", "contact.html"],
    description: "Showcase creative work",
  },
  blog: {
    name: "Blog",
    pages: ["index.html", "blog.html", "article.html", "about.html"],
    description: "Content-focused blog layout",
  },
  ecommerce: {
    name: "E-commerce",
    pages: ["index.html", "products.html", "product-detail.html", "cart.html", "checkout.html"],
    description: "Online store with product catalog",
  },
  saas: {
    name: "SaaS Product",
    pages: ["index.html", "features.html", "pricing.html", "contact.html"],
    description: "Software product marketing",
  },
  documentation: {
    name: "Documentation",
    pages: ["index.html", "getting-started.html", "api-reference.html", "examples.html"],
    description: "Technical documentation site",
  },
  event: {
    name: "Event/Conference",
    pages: ["index.html", "schedule.html", "speakers.html", "register.html"],
    description: "Event promotion and registration",
  },
};
