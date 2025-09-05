/**
 * Test suite for business logic utilities
 */

import { scoreIdea, toSlug, nowISO, TemplateGenerator, ExportUtils } from '../lib/business-logic';

describe('Business Logic', () => {
  describe('scoreIdea', () => {
    it('should score AI-related ideas higher', () => {
      const aiIdea = 'An AI agent platform for automating customer service with machine learning';
      const regularIdea = 'A simple todo list app for personal productivity';
      
      const aiScore = scoreIdea(aiIdea);
      const regularScore = scoreIdea(regularIdea);
      
      expect(aiScore.total).toBeGreaterThan(regularScore.total);
      expect(aiScore.feasibility).toBeGreaterThan(regularScore.feasibility);
    });

    it('should score business model mentions higher', () => {
      const businessIdea = 'SaaS platform with subscription pricing and revenue sharing model';
      const nonBusinessIdea = 'Free app for sharing photos with friends';
      
      const businessScore = scoreIdea(businessIdea);
      const nonBusinessScore = scoreIdea(nonBusinessIdea);
      
      expect(businessScore.viability).toBeGreaterThan(nonBusinessScore.viability);
    });

    it('should score user-focused ideas higher', () => {
      const userIdea = 'Platform helping teachers and students manage classroom activities';
      const techIdea = 'Database optimization algorithm for faster queries';
      
      const userScore = scoreIdea(userIdea);
      const techScore = scoreIdea(techIdea);
      
      expect(userScore.desirability).toBeGreaterThan(techScore.desirability);
    });

    it('should return valid scores within bounds', () => {
      const testIdeas = [
        'AI platform',
        'Super long detailed idea description with lots of unique words and comprehensive business model explanation including revenue streams and user personas',
        'a',
        'Simple idea',
        ''
      ];

      testIdeas.forEach(idea => {
        const scores = scoreIdea(idea);
        expect(scores.total).toBeGreaterThanOrEqual(12);
        expect(scores.total).toBeLessThanOrEqual(100);
        expect(scores.desirability).toBeGreaterThanOrEqual(0);
        expect(scores.desirability).toBeLessThanOrEqual(20);
        expect(scores.feasibility).toBeLessThanOrEqual(20);
        expect(scores.viability).toBeLessThanOrEqual(20);
        expect(scores.defensibility).toBeLessThanOrEqual(20);
        expect(scores.timing).toBeLessThanOrEqual(20);
        
        // Total should be clamped but individual scores preserved
        const sum = scores.desirability + scores.feasibility + scores.viability + scores.defensibility + scores.timing;
        expect(scores.total).toBeGreaterThanOrEqual(12);
        expect(scores.total).toBeLessThanOrEqual(100);
        // Total is clamped version of sum
        expect(scores.total).toBe(Math.max(12, Math.min(100, sum)));
      });
    });

    it('should handle edge cases', () => {
      expect(() => scoreIdea('')).not.toThrow();
      expect(() => scoreIdea(null as any)).not.toThrow();
      expect(() => scoreIdea(undefined as any)).not.toThrow();
      
      const emptyScore = scoreIdea('');
      expect(emptyScore.total).toBe(12); // minimum score
    });
  });

  describe('toSlug', () => {
    it('should convert to lowercase kebab-case', () => {
      expect(toSlug('My Amazing Project')).toBe('my-amazing-project');
      expect(toSlug('CamelCase Title')).toBe('camelcase-title');
    });

    it('should handle special characters', () => {
      expect(toSlug('Project with @#$% symbols!')).toBe('project-with-symbols');
      expect(toSlug('Multiple   spaces')).toBe('multiple-spaces');
      expect(toSlug('  Leading and trailing  ')).toBe('leading-and-trailing');
    });

    it('should handle underscores and hyphens', () => {
      expect(toSlug('under_score_test')).toBe('under-score-test');
      expect(toSlug('already-hyphenated')).toBe('already-hyphenated');
      expect(toSlug('mixed_and-combined')).toBe('mixed-and-combined');
    });

    it('should provide fallback for empty input', () => {
      expect(toSlug('')).toBe('unnamed-project');
      expect(toSlug('   ')).toBe('unnamed-project');
      expect(toSlug('!@#$%^&*()')).toBe('unnamed-project');
      expect(toSlug(null as any)).toBe('unnamed-project');
    });
  });

  describe('nowISO', () => {
    it('should return valid ISO string', () => {
      const iso = nowISO();
      expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(iso).toISOString()).toBe(iso);
    });
  });

  describe('TemplateGenerator', () => {
    describe('makePRD', () => {
      it('should generate valid PRD with sanitized inputs', () => {
        const prd = TemplateGenerator.makePRD(
          'Test <script>alert(1)</script> Project',
          'A safe & secure platform',
          'Detailed "idea" description with <tags>',
          { total: 75, desirability: 15, feasibility: 16, viability: 14, defensibility: 15, timing: 15 }
        );

        expect(prd).toContain('Test'); // Title contains the word Test
        expect(prd).toContain('A safe & secure platform');
        expect(prd).not.toContain('<script>');
        expect(prd).toContain('Detailed'); // Contains idea text
        expect(prd).toContain('0.1'); // Contains version number
      });

      it('should include all PRD sections', () => {
        const prd = TemplateGenerator.makePRD('Test', 'Description', 'Idea', {
          total: 50, desirability: 10, feasibility: 10, viability: 10, defensibility: 10, timing: 10
        });

        const requiredSections = [
          '# Test',
          '## Problem',
          '## Target Users',
          '## Jobs-to-be-Done',
          '## Solution Overview',
          '## Functional Scope (MVP)',
          '## Non-Functional Requirements',
          '## Success Metrics'
        ];

        requiredSections.forEach(section => {
          expect(prd).toContain(section);
        });
      });
    });

    describe('makeRunbook', () => {
      it('should generate valid runbook with sanitized title', () => {
        const runbook = TemplateGenerator.makeRunbook('Test <script> Project');
        
        expect(runbook).toContain('# Test'); // Title contains the word Test
        expect(runbook).toContain('conductor:');
        expect(runbook).toContain('librarian:');
        expect(runbook).toContain('market_analyst:');
        expect(runbook).toContain('tech_architect:');
        expect(runbook).toContain('ux_synthesizer:');
        expect(runbook).toContain('scaffolder:');
      });
    });

    describe('makeRepoTree', () => {
      it('should generate repo structure with sanitized slug', () => {
        const tree = TemplateGenerator.makeRepoTree('My Project!@#');
        
        expect(tree).toContain('/my-project');
        expect(tree).toContain('/app');
        expect(tree).toContain('/web  (Next.js 14/15)');
        expect(tree).toContain('/api  (FastAPI)');
        expect(tree).toContain('/docs');
      });
    });

    describe('makeAPISketch', () => {
      it('should generate valid FastAPI code', () => {
        const api = TemplateGenerator.makeAPISketch();
        
        expect(api).toContain('from fastapi import FastAPI');
        expect(api).toContain('class Brief(BaseModel)');
        expect(api).toContain('@app.post("/ingest/idea")');
        expect(api).toContain('@app.get("/dossier/{id}")');
      });
    });
  });

  describe('ExportUtils', () => {
    describe('downloadBlob', () => {
      beforeEach(() => {
        // Mock DOM methods
        document.body.appendChild = jest.fn();
        document.body.removeChild = jest.fn();
        document.createElement = jest.fn(() => ({
          click: jest.fn(),
          href: '',
          download: ''
        } as any));
      });

      it('should create download link', () => {
        const blob = new Blob(['test content'], { type: 'text/plain' });
        ExportUtils.downloadBlob(blob, 'test.txt');
        
        expect(document.createElement).toHaveBeenCalledWith('a');
        expect(document.body.appendChild).toHaveBeenCalled();
        expect(document.body.removeChild).toHaveBeenCalled();
      });
    });

    describe('buildGitHubNewRepoUrl', () => {
      it('should build valid GitHub URL with sanitized inputs', () => {
        const url = ExportUtils.buildGitHubNewRepoUrl(
          'My Awesome Project!',
          'A great <script> project',
          'public'
        );
        
        expect(url).toContain('https://github.com/new?');
        expect(url).toContain('name=my-awesome-project');
        expect(url).toContain('visibility=public');
        expect(url).not.toContain('<script>');
      });

      it('should default to public visibility', () => {
        const url = ExportUtils.buildGitHubNewRepoUrl('test', 'description');
        expect(url).toContain('visibility=public');
      });

      it('should handle private visibility', () => {
        const url = ExportUtils.buildGitHubNewRepoUrl('test', 'description', 'private');
        expect(url).toContain('visibility=private');
      });
    });
  });
});
