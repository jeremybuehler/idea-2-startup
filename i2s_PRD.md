Product Requirements Document (PRD)

Product: Launchloom

Version: 0.1 (Preview Build)
Date: 2025-09-03
Author: Product Team

⸻

1. Purpose & Vision

The Launchloom platform is an interactive system that allows a user to quickly transform raw ideas into structured startup scaffolds. By typing or speaking an idea, users receive immediate outputs: PRDs, wireframes, code scaffolds, and an agent runbook. The vision is to compress the idea-to-prototype cycle into minutes, empowering entrepreneurs, product managers, and innovators to validate and launch faster.

2. Goals & Objectives
	•	Primary Goal: Reduce friction from concept to working prototype.
	•	Objective 1: Provide automated generation of structured deliverables (PRD, repo, runbook).
	•	Objective 2: Support both a Simulated mode (offline, demo, educational) and a Live API mode (real backend integration).
	•	Objective 3: Allow users to export repos locally and push directly to GitHub (prefilled as private).
	•	Objective 4: Maintain clarity of state via badges, banners, coachmarks, and help guides.

3. Target Users
	•	Early-stage entrepreneurs validating startup ideas.
	•	Product managers needing quick spec drafts.
	•	Engineers who want rapid scaffolding for prototypes.
	•	Students/educators learning product development workflows.

4. Features & Requirements

Core Features
	1.	Idea Intake UI
	•	Title, one-liner, and freeform idea text.
	•	Idea scoring algorithm (desirability, feasibility, viability, defensibility, timing).
	2.	Dual Engine Modes
	•	Simulated Mode: Browser-only; mock outputs.
	•	Live API Mode: Calls backend (/ingest/idea → /dossier/{id}).
	•	Mode Badge + Banner clearly label which engine produced results.
	3.	Pipeline Visualization
	•	Stage cards: Normalize, Research, Feasibility, Market & Moat, Risk, UX, Scaffold, APIs, Export.
	•	Progress indicator with animations.
	4.	Generated Artifacts
	•	Draft PRD (markdown, auto-templated).
	•	Wireframes (low-fi placeholders).
	•	Code & Infra (repo scaffold, API sketch).
	•	Agent Runbook (YAML-like structure of agents, budgets, gates).
	5.	Export Options
	•	Download JSON dossier.
	•	Download complete repo ZIP (frontend + docs + backend stub).
	•	Add Repo to GitHub (prefills private repo).
	6.	Guidance & UX Helpers
	•	Coachmark on first run: explains Simulated vs Live.
	•	Help dialog: step-by-step guide.
	•	Deploy Guide dialog: GitHub → Vercel deployment steps.

Non-Functional Requirements
	•	Performance: Idea → outputs in < 10s (simulated), < 30s (live).
	•	Accessibility: ARIA labels on all interactive elements.
	•	Resilience: Fallback from Live to Simulated with clear alerts.
	•	Exportability: ZIPs must include docs, agents, repo tree, and backend stub.
	•	Security/Privacy: Default GitHub repos are private; no user data stored in demo mode.

5. Risks & Mitigations
	•	Risk: Users may misinterpret simulated outputs as production-ready.
	•	Mitigation: Clear labels, “Preview” badge, and disclaimers in Help.
	•	Risk: Backend downtime.
	•	Mitigation: Automatic fallback to Simulated mode.
	•	Risk: IP sensitivity.
	•	Mitigation: Provide clear disclaimers; allow local-only use.

6. Success Metrics
	•	≥80% of new users successfully generate a dossier in first session.
	•	≥70% correctly identify which mode produced their outputs (survey).
	•	Repo export tested by ≥10 teams with <15 minutes to deploy hello-world.

7. Roadmap
	•	Weeks 1–2: MVP (capture, score, PRD draft, repo export).
	•	Weeks 3–6: Research connectors, compliance agent, one-click deploy.
	•	Weeks 7–10: Experiment templates, multi-idea comparison, LearningLoop auto-tuning.

8. Appendices
	•	Generated Repo Structure: See scaffold in REPO_TREE.txt.
	•	Agent Roles: See ops/agents.yaml.
	•	API Contract: See server/main.py.

⸻

End of PRD
