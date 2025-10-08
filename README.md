# 🚀 Idea-to-Startup Studio (I2S)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2+-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Tests](https://img.shields.io/badge/Tests-42_passing-00D100?style=flat&logo=jest&logoColor=white)](https://jestjs.io/)
[![Security](https://img.shields.io/badge/Security-Hardened-red?style=flat&logo=security&logoColor=white)](#-security)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Transform raw startup ideas into structured deliverables including PRDs, wireframes, code scaffolds, and agent runbooks.**

Transform your startup concepts from napkin sketches to production-ready platforms with AI-powered validation, comprehensive documentation, and automated scaffolding.

## ✨ **Used by Entrepreneurs Who Value**

**Speed** • **Structure** • **Security** • **Scalability** • **Professional Documentation**

---

## 🎯 **What is I2S Studio?**

Idea-to-Startup Studio is a **Next.js 14 application** that bridges the gap between raw startup ideas and structured, actionable deliverables. It operates in dual modes—simulated for demos and live API for production—transforming abstract concepts into concrete business assets.

### **Core Value Proposition**

- 📝 **Idea Validation**: Multi-dimensional scoring (desirability, feasibility, viability, defensibility, timing)
- 📊 **Structured Output**: Auto-generated PRDs, wireframes, and technical specifications  
- 🏗️ **Code Scaffolding**: Complete Next.js + FastAPI project templates
- 🤖 **Agent Orchestration**: YAML runbooks for AI agent workflows
- 🔄 **Export Ready**: JSON downloads, ZIP repositories, GitHub integration

---

## 🚀 **Quick Start**

### **Prerequisites**

- **Node.js** >= 18.0.0
- **npm**, **yarn**, or **pnpm**
- **Git** for version control

### **Installation**

```bash
# Clone the repository
git clone https://github.com/jeremybuehler/idea-2-startup.git
cd idea-2-startup

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

### **One-Command Setup**

For WARP AI assistant users:

```bash
npm run warp-setup
```

This runs a complete validation pipeline including type-checking, linting, and testing.

---

## 🏗️ **Architecture**

### **Application Structure**

```
idea-2-startup/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.tsx           # Main I2S application
│   └── globals.css        # Global styles & CSS variables
├── lib/                   # Core utilities & business logic
│   ├── security.ts        # Input sanitization & validation
│   ├── business-logic.ts  # Scoring algorithms & templates
│   └── performance.ts     # Async operations & optimization
├── components/
│   └── ui/               # shadcn/ui components
├── __tests__/            # Comprehensive test suite
├── types/
│   └── index.ts          # TypeScript interfaces
└── public/               # Static assets
```

### **Key Data Structures**

```typescript
interface Dossier {
  id: string;
  created_at: string;
  idea_text: string;
  title: string;
  one_liner: string;
  scores: IdeaScores;      // Multi-dimensional validation
  prd: string;             // Generated PRD markdown
  runbook: string;         // Agent runbook YAML
  repo: string;            // Repository structure
  api: string;             // API code sketch
}

interface IdeaScores {
  total: number;           // Overall score (12-100)
  desirability: number;    // User need validation  
  feasibility: number;     // Technical feasibility
  viability: number;       // Business viability
  defensibility: number;   // Competitive advantage
  timing: number;          // Market timing
}
```

---

## ⚡ **Features**

### **🎯 Core Pipeline (9 Stages)**

1. **Normalize** - Clean and structure input
2. **Research** - Market and competitor analysis  
3. **Feasibility** - Technical assessment
4. **Market & Moat** - Business analysis
5. **Risk** - Risk assessment
6. **UX** - User experience design
7. **Scaffold** - Code structure generation
8. **APIs** - API design
9. **Export** - Final deliverable preparation

### **📊 Intelligent Scoring System**

Advanced algorithms analyze startup ideas across five critical dimensions:

- **Desirability** (0-20): User need validation
- **Feasibility** (0-20): Technical implementation complexity
- **Viability** (0-20): Business model strength
- **Defensibility** (0-20): Competitive moat potential  
- **Timing** (0-20): Market readiness assessment

### **🔄 Export Options**

- **JSON Download**: Complete dossier data structure
- **Repository ZIP**: Full project scaffold (Next.js + FastAPI)
- **GitHub Integration**: Pre-filled repository creation

### **🎛️ Dual Operation Modes**

- **Simulated Mode** (default): Client-side processing for demos
- **Live API Mode**: Backend integration via environment configuration

---

## 🛡️ **Security**

**Enterprise-grade security** implemented through comprehensive multi-agent system:

### **Input Sanitization**
- **XSS Protection**: HTML entity encoding for all user inputs
- **Injection Prevention**: Template injection vulnerability patching
- **Prompt Safety**: Malicious prompt pattern detection
- **Filesystem Safety**: Secure project slug generation

### **Security Functions**
```typescript
sanitizeUserInput()     // HTML/XSS protection
sanitizeForJSON()       // JSON injection prevention  
sanitizeForMarkdown()   // Markdown injection protection
sanitizeProjectSlug()   // Filesystem safety
validateIdeaInput()     // Comprehensive input validation
```

### **Security Headers**
- Content Security Policy (CSP)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block

---

## 🧪 **Testing**

**Comprehensive test suite** with 100% pass rate:

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode for development  
npm run test:watch
```

### **Test Coverage**

- ✅ **42 comprehensive tests** covering all critical functions
- ✅ **Security validation** for all sanitization functions
- ✅ **Business logic verification** including scoring algorithms
- ✅ **Edge case handling** for error conditions
- ✅ **Integration testing** for export functionality

```
Test Suites: 2 passed
Tests:       42 passed
Coverage:    100% on critical modules
```

---

## ⚙️ **Configuration**

### **Environment Variables**

```bash
# Frontend Configuration
NEXT_PUBLIC_API_BASE=          # Backend API URL for live mode
NEXT_PUBLIC_USE_LIVE=false     # Default to simulated mode

# Build-time Variables  
APP_NAME="I2S Studio"          # Application name
APP_VERSION=                   # Auto-set from package.json
```

### **Package Scripts**

```json
{
  "dev": "next dev",              // Development server
  "build": "next build",          // Production build
  "start": "next start",          // Production server
  "test": "jest",                 // Run tests
  "lint": "next lint",            // Code linting
  "type-check": "tsc --noEmit",   // TypeScript validation
  "validate": "npm run type-check && npm run lint && npm test"
}
```

---

## 🚀 **Deployment**

### **Vercel Deployment** (Recommended)

1. **Push to GitHub**:
   ```bash
   git add -A
   git commit -m "Deploy I2S Studio"
   git push origin main
   ```

2. **Import in Vercel**:
   - Visit [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Deploy with default Next.js settings

### **Environment Setup**

```bash
# Production build
npm run build
npm run start

# Validate before deployment
npm run validate
```

### **Backend Integration**

For live API mode, implement endpoints matching:

```python
# FastAPI backend example
@app.post("/ingest/idea")
async def ingest(brief: Brief):
    return {"id": "idea_123", "created_at": "2024-01-01T00:00:00Z"}

@app.get("/dossier/{id}")
async def dossier(id: str):
    return {"status": "ready", "score": 82, "id": id}
```

---

## 💡 **Usage Examples**

### **Basic Idea Processing**

```typescript
import { scoreIdea, TemplateGenerator } from '@/lib/business-logic';

// Score a startup idea
const scores = scoreIdea("AI-powered customer service automation platform");
console.log(scores); // { total: 82, desirability: 18, feasibility: 17, ... }

// Generate PRD
const prd = TemplateGenerator.makePRD(
  "CustomerAI",
  "AI-powered customer service automation", 
  "Detailed idea description...",
  scores
);
```

### **Secure Template Generation**

```typescript
import { sanitizeUserInput, sanitizeProjectSlug } from '@/lib/security';

// Safely process user input
const safeTitle = sanitizeUserInput(userProvidedTitle);
const safeSlug = sanitizeProjectSlug(projectName);

// Generate secure templates
const template = generateTemplate(safeTitle, safeSlug);
```

### **Performance-Optimized Operations**

```typescript  
import { AsyncZipGenerator, MemoizationHelper } from '@/lib/performance';

// Generate repository ZIP asynchronously
const blob = await AsyncZipGenerator.generateRepoZip(
  slug, 
  dossier,
  (progress) => console.log(`Progress: ${progress}%`)
);

// Memoize expensive operations
const memoizedScoring = MemoizationHelper.memoize(
  scoreIdea,
  ([idea]) => `score_${idea}`,
  300000 // 5 minute TTL
);
```

---

## 📚 **Documentation**

### **🤖 Agent System Documentation**
- **[Agent Overview](./docs/AGENTS.md)** - Complete multi-agent system documentation
- **[System Architecture](./docs/ARCHITECTURE.md)** - High-level system design and infrastructure
- **[Inter-Agent Communication](./docs/communication/MESSAGE_PASSING.md)** - Message formats and coordination patterns

#### **Pipeline Agents (9 Sequential Stages)**
- **[Normalize Agent](./docs/agents/pipeline/normalize.md)** - Input sanitization and validation
- **[Research Agent](./docs/agents/pipeline/research.md)** - Market and competitor analysis *(documentation pending)*
- **[Feasibility Agent](./docs/agents/pipeline/feasibility.md)** - Technical assessment *(documentation pending)*
- **[Risk Agent](./docs/agents/pipeline/risk.md)** - Risk assessment and mitigation *(documentation pending)*
- **[Export Agent](./docs/agents/pipeline/export.md)** - Final deliverable packaging *(documentation pending)*
- *[Additional Pipeline Agents documentation in progress]*

#### **Core System Agents (7 Orchestration)**
- **[Conductor Agent](./docs/agents/core/conductor.md)** - Master orchestration and workflow management
- **[Librarian Agent](./docs/agents/core/librarian.md)** - Knowledge management *(documentation pending)*
- **[Market Analyst Agent](./docs/agents/core/market-analyst.md)** - Business intelligence *(documentation pending)*
- **[Tech Architect Agent](./docs/agents/core/tech-architect.md)** - Technical design decisions *(documentation pending)*
- **[LearningLoop Agent](./docs/agents/core/learningloop.md)** - Continuous improvement *(documentation pending)*
- *[Additional Core Agents documentation in progress]*

#### **Deployment Agents (5 Quality Gates)**
- **[Security Agent](./docs/agents/deployment/security.md)** - Vulnerability scanning and compliance
- **[Architecture Agent](./docs/agents/deployment/architecture.md)** - System design validation *(documentation pending)*
- **[Testing Agent](./docs/agents/deployment/testing.md)** - Quality assurance and coverage *(documentation pending)*
- **[Performance Agent](./docs/agents/deployment/performance.md)** - Runtime optimization *(documentation pending)*
- **[Quality Agent](./docs/agents/deployment/quality.md)** - Code standards enforcement *(documentation pending)*

### **📖 Development Guides**
- **[WARP.md](./WARP.md)** - Complete development guide for WARP AI assistant
- **[AGENT_DEPLOYMENT_SUMMARY.md](./AGENT_DEPLOYMENT_SUMMARY.md)** - Multi-agent system deployment overview
- **[ENHANCEMENT-SUMMARY.md](./ENHANCEMENT-SUMMARY.md)** - Feature enhancement details

### **🔧 API Reference**
- **Business Logic**: Scoring algorithms and template generation
- **Security Functions**: Input sanitization and validation  
- **Performance Utils**: Async operations and optimization
- **Export Utilities**: Download and GitHub integration

---

## 🛠️ **Development**

### **Local Development Setup**

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests in watch mode
npm run test:watch

# Type checking
npm run type-check
```

### **Code Quality**

- **TypeScript**: Strict mode enabled with comprehensive typing
- **ESLint**: Next.js standard configuration with custom rules  
- **Testing**: Jest + React Testing Library
- **Security**: Input sanitization and validation throughout

### **Contributing**

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Review the project-specific expectations in [Repository Guidelines](AGENTS.md)
5. Push to branch: `git push origin feature/amazing-feature`  
6. Open a Pull Request

---

## 🎯 **Use Cases**

### **For Entrepreneurs**
- **Validate ideas** before significant investment
- **Generate professional documentation** for investors
- **Create technical specifications** for development teams
- **Export ready-to-build** project structures

### **For Developers** 
- **Rapid prototyping** with pre-configured stacks
- **Architecture templates** following best practices
- **Security-hardened** code generation
- **Production-ready** deployment configurations

### **For Investors**
- **Structured idea evaluation** with quantified metrics
- **Technical feasibility** assessment  
- **Market analysis** documentation
- **Risk evaluation** frameworks

---

## 📊 **Performance**

### **Bundle Optimization**
- **Lazy loading** for heavy components
- **Code splitting** at route level
- **Optimized imports** for external libraries
- **Tree shaking** for minimal bundle size

### **Runtime Performance** 
- **Async ZIP generation** prevents UI blocking
- **Intelligent caching** with TTL for expensive operations  
- **Memoization** for repeated calculations
- **Performance monitoring** with measurement utilities

---

## 🔧 **Troubleshooting**

### **Common Issues**

**Build Failures**:
```bash
npm run type-check  # Check TypeScript errors
npm run lint       # Verify code standards
```

**Test Failures**:
```bash
npm test           # Run test suite
npm run test:watch # Debug specific tests
```

**Performance Issues**:
- Enable caching for expensive operations
- Use async ZIP generation for large exports
- Monitor performance with built-in utilities

### **Development Tips**

- Use `npm run validate` before commits
- Enable TypeScript strict mode for better reliability
- Leverage the comprehensive test suite for confidence
- Follow the modular architecture patterns

---

## 📈 **Roadmap**

### **Phase 1: MVP** ✅ *Complete*
- Core idea processing pipeline
- Multi-dimensional scoring system
- Template generation with security
- Export functionality (JSON, ZIP, GitHub)

### **Phase 2: Enhanced Intelligence** 🚧 *In Progress*  
- Advanced market research integration
- Competitor analysis automation
- Enhanced AI agent orchestration
- Real-time collaboration features

### **Phase 3: Platform Scale** 📋 *Planned*
- Multi-user workspace support
- Advanced analytics dashboard
- Integration marketplace
- Enterprise security features

---

## 🤝 **Community**

### **Getting Help**
- 📖 Check the [comprehensive documentation](./WARP.md)
- 🐛 Report issues on [GitHub Issues](https://github.com/jeremybuehler/idea-2-startup/issues)
- 💬 Join discussions in [GitHub Discussions](https://github.com/jeremybuehler/idea-2-startup/discussions)

### **Contributing**
We welcome contributions! Please see our contributing guidelines and code of conduct.

---

## 📄 **License**

**MIT License** - see the [LICENSE](LICENSE) file for details.

Made with 💖 by [Jeremy Buehler](https://github.com/jeremybuehler) and the open-source community.

---

## 🏆 **Acknowledgments**

- **Multi-Agent System**: Powered by advanced AI agent orchestration
- **Security Hardening**: Enterprise-grade vulnerability protection  
- **Performance Optimization**: Async operations and intelligent caching
- **Comprehensive Testing**: 42 tests ensuring reliability
- **Production Ready**: Deployment-optimized architecture

---

<div align="center">

**Transform Ideas → Build Startups → Change the World** 🚀

[Get Started](https://github.com/jeremybuehler/idea-2-startup) • [Documentation](./WARP.md) • [Live Demo](https://your-deployment-url.vercel.app)

</div>
