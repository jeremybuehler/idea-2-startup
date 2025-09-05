# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Quick Reference Commands

```bash
# Quick setup (for WARP AI assistant)
./scripts/warp-setup.sh     # One-command setup script

# Setup and development
npm install              # Install dependencies
npm run dev             # Start development server (localhost:3000)
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
npm run type-check      # Run TypeScript type checking
npm run validate        # Run both type-check and lint
npm run warp-setup      # Complete WARP AI assistant setup

# Environment setup
cp .env.example .env.local    # Configure environment variables (optional)
git status                    # Check repository status
git log --oneline -5          # View recent commits
```

## Project Overview

**Idea-to-Startup Studio (I2S)** is a Next.js 14 application that transforms raw startup ideas into structured deliverables including PRDs, wireframes, code scaffolds, and agent runbooks. It operates in two modes: a simulated mode for demonstrations and a live API mode for production use.

## Architecture

### Application Structure
- **Next.js 14** with App Router architecture
- **Single-page application** with tabbed interface using shadcn/ui components
- **Client-side state management** using React hooks (no external state library)
- **Dual-mode operation**: simulated (browser-only) vs live API backend
- **TypeScript** throughout with strict type checking enabled

### Directory Structure
```
/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.tsx           # Main application component
│   └── globals.css        # Global styles and CSS variables
├── components/
│   └── ui/                # shadcn/ui components (Button, Card, Dialog, etc.)
├── lib/
│   └── utils.ts           # Utility functions (cn for className merging)
├── types/
│   └── index.ts           # TypeScript interfaces (IdeaScores, Dossier, etc.)
├── data/                  # (Empty - data is generated client-side)
└── public/                # Static assets
```

### Key Data Structures

The application revolves around these core types:

```typescript
// Core data structure for generated artifacts
interface Dossier {
  id: string;
  created_at: string;
  idea_text: string;
  title: string;
  one_liner: string;
  scores: IdeaScores;
  prd: string;           // Generated PRD markdown
  runbook: string;       // Agent runbook YAML
  repo: string;          // Repository structure
  api: string;           // API code sketch
  server?: any;          // Optional backend data
}

// Idea scoring system (client-side algorithm)
interface IdeaScores {
  total: number;         // Overall score (12-100)
  desirability: number;  // User need validation
  feasibility: number;   // Technical feasibility
  viability: number;     // Business viability
  defensibility: number; // Competitive advantage
  timing: number;        // Market timing
}
```

## Core Features Implementation

### Pipeline Processing
The application simulates a 9-stage pipeline:
1. **Normalize** - Clean and structure input
2. **Research** - Market and competitor analysis
3. **Feasibility** - Technical assessment
4. **Market & Moat** - Business analysis
5. **Risk** - Risk assessment
6. **UX** - User experience design
7. **Scaffold** - Code structure generation
8. **APIs** - API design
9. **Export** - Final deliverable preparation

### Artifact Generation
All artifacts are generated client-side using template functions:
- `makePRD()` - Creates structured PRD markdown
- `makeRunbook()` - Generates agent orchestration YAML
- `makeRepoTree()` - Defines repository structure
- `makeAPISketch()` - Creates FastAPI backend template

### Export System
The application provides three export options:
1. **JSON Download** - Complete dossier data structure
2. **Repository ZIP** - Full project scaffold including Next.js frontend, FastAPI backend stub, documentation
3. **GitHub Integration** - Opens pre-filled "new repository" page with suggested settings

### Mode Switching
- **Simulated Mode** (default): All processing happens in-browser with predetermined outputs
- **Live API Mode**: Configurable backend integration via `NEXT_PUBLIC_API_BASE` environment variable

## Development Patterns

### Component Architecture
- Main component: `I2SApp` in `app/page.tsx`
- Uses React hooks for state management (useState, useMemo)
- Leverages shadcn/ui for consistent component styling
- Custom CSS classes defined in `globals.css` for pipeline stages

### State Management Pattern
```typescript
// Primary application state
const [idea, setIdea] = useState('')
const [dossier, setDossier] = useState<Dossier | null>(null)
const [running, setRunning] = useState(false)
const [useLive, setUseLive] = useState(false)

// Derived state using useMemo
const scores = useMemo(() => scoreIdea(idea || oneLiner), [idea, oneLiner])
const slug = useMemo(() => toSlug(title), [title])
```

### Self-Testing System
The application includes built-in self-tests that run once per browser session:
- Tests utility functions (`toSlug`, `scoreIdea`)
- Validates artifact generation functions
- Verifies ZIP file structure
- Tests GitHub URL generation

Access via browser console - tests run automatically on page load.

## Environment Configuration

### Environment Variables
```bash
# Frontend configuration
NEXT_PUBLIC_API_BASE=          # Backend API URL for live mode
NEXT_PUBLIC_USE_LIVE=false     # Default to simulated mode

# Build-time variables
APP_NAME="I2S Studio"          # Application name
APP_VERSION=                   # Automatically set from package.json
```

### Node.js Requirements
- **Node.js**: >=18.0.0 (specified in package.json engines)
- **Package Manager**: npm, yarn, or pnpm supported
- **TypeScript**: 5.4+ for proper type checking

## Deployment

### Vercel Deployment (Recommended)
1. Push repository to GitHub
2. Import project in Vercel dashboard
3. Set environment variables if using live mode
4. Deploy with default Next.js settings

### Production Build
```bash
npm run build        # Creates optimized .next directory
npm run start        # Serves production build locally
```

### Backend Integration
For live API mode, implement endpoints matching this contract:
```python
# FastAPI backend example
@app.post("/ingest/idea")
async def ingest(brief: Brief):
    return {"id": "idea_123", "created_at": "2024-01-01T00:00:00Z"}

@app.get("/dossier/{id}")
async def dossier(id: str):
    return {"status": "ready", "score": 82, "id": id}
```

## Development Guidelines

### Code Style
- **ESLint**: Configured with Next.js and TypeScript rules
- **Prettier**: Not configured - relies on ESLint formatting
- **TypeScript**: Strict mode enabled, explicit return types optional
- **CSS**: Tailwind CSS with custom component classes in globals.css

### Testing Approach
- Self-tests run in browser console for core utilities
- No formal test framework configured (Jest, Vitest, etc.)
- Manual testing through simulated and live mode switching

### Common Development Tasks

**Adding New Pipeline Stages:**
1. Update the pipeline array in `app/page.tsx`
2. Add corresponding icon from Lucide React
3. Update progress calculation logic
4. Test with both modes

**Modifying Artifact Templates:**
1. Edit template functions (`makePRD`, `makeRunbook`, etc.)
2. Test export functionality in both JSON and ZIP formats
3. Verify GitHub integration still works

**Extending Export Formats:**
1. Modify `composeRepoZip()` function for ZIP contents
2. Update download helpers if needed
3. Test with various project names and slugs

**Working with Git:**
```bash
git status                    # Check current state
git add -A                    # Stage all changes  
git commit -m "message"       # Commit with message
git push                      # Push to remote
git branch -v                 # List branches with info
```

## Troubleshooting

### Common Issues

**Build Failures:**
- Check TypeScript errors: `npm run type-check`
- Verify all imports are resolved correctly
- Ensure all required dependencies are installed

**Mode Switching Problems:**
- Verify `NEXT_PUBLIC_API_BASE` is set correctly
- Check browser console for network errors
- Confirm backend endpoints match expected contract

**Export Issues:**
- Test with different project names (special characters, spaces)
- Verify browser download permissions
- Check ZIP file contents match expected structure

**Development Server Issues:**
- Clear .next directory: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check port 3000 availability

### Debugging Tips
- Use browser developer tools to inspect state changes
- Monitor network tab for API calls in live mode
- Check console for self-test results and errors
- Use React Developer Tools browser extension for component inspection

### WARP AI Assistant Optimization
This project is fully optimized for WARP AI assistant:
- **Context-aware**: Comprehensive technical documentation in this file
- **Command-ready**: All common operations documented with exact commands
- **Self-testing**: Built-in validation ensures reliability
- **Standards-compliant**: Following Next.js and React best practices
- **Development-friendly**: Clear patterns for extending and modifying

## Integration Notes

### API Backend Development
If building a live backend:
- Match the `/ingest/idea` and `/dossier/{id}` endpoint structure
- Handle CORS appropriately for development
- Return data matching the expected `Dossier` interface
- Consider rate limiting and authentication

### GitHub Integration
The GitHub integration opens a pre-filled new repository page. To enhance:
- Consider GitHub API integration for automatic repository creation
- Add repository template selection
- Include issue templates and GitHub Actions workflows

## Version Compatibility

- **Next.js**: 14.2+
- **React**: 18.3+
- **Node.js**: 18+
- **TypeScript**: 5.4+
- **Tailwind CSS**: 3.4+

---
*Last updated: September 2024*
*Generated for WARP AI assistant usage*
