/**
 * UX Design Agent - Stage 6 of the Launchloom Pipeline
 *
 * Responsible for:
 * - User journey mapping
 * - Key user flow design
 * - Wireframe descriptions
 * - UX/UI principles definition
 * - Accessibility considerations
 */

import { LaunchloomAgentsService, AgentMessage } from '../services/LaunchloomAgentsService'
import { Logger } from '../utils/Logger'
import { UXDesignResult, IdeaContext, NormalizeResult, ResearchResult } from '../types/Pipeline'

const SYSTEM_PROMPT = `You are the UX Design Agent in the Launchloom pipeline. Your job is to design user experiences and interfaces.

Your output must be valid JSON with these fields:
- userJourney: Array of {stage, actions, painPoints, opportunities}
- keyFlows: Array of {name, steps, wireframes}
- wireframes: Array of {name, description, components}
- principles: Array of UX/UI principles to follow
- accessibility: Object with guidelines, compliance, and testing arrays

Focus on usability, accessibility (WCAG 2.1 AA), and conversion optimization.`

export class UXDesignAgent {
  private agentService: LaunchloomAgentsService
  private logger: Logger

  constructor(agentService: LaunchloomAgentsService) {
    this.agentService = agentService
    this.logger = new Logger('UXDesignAgent')
  }

  async execute(
    context: IdeaContext,
    normalizeResult: NormalizeResult,
    researchResult: ResearchResult
  ): Promise<UXDesignResult> {
    this.logger.info('Starting UX design', { title: normalizeResult.title })

    const messages: AgentMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Design user experience for:

Title: ${normalizeResult.title}
One-liner: ${normalizeResult.oneLiner}
Problem: ${normalizeResult.problem}
Target Audience: ${normalizeResult.audience}
Value Proposition: ${normalizeResult.valueProposition}

Market Context:
${researchResult.opportunities.slice(0, 3).join('\n')}

Requirements:
- Include wireframes: ${context.requirements?.includeWireframes ?? true}
- Analysis depth: ${context.requirements?.analysisDepth || 'standard'}

Respond with valid JSON only.`
      }
    ]

    try {
      const response = await this.agentService.sendMessage(messages, {
        model: 'gpt-4.1-mini',
        maxTokens: 2500,
        temperature: 0.7
      })

      const result = this.parseResult(response.content)

      this.logger.info('UX design complete', {
        flows: result.keyFlows.length,
        wireframes: result.wireframes.length,
        cost: response.usage.cost
      })

      return result
    } catch (error) {
      this.logger.error('UX design failed', error)
      return this.getFallbackResult(normalizeResult)
    }
  }

  private parseResult(content: string): UXDesignResult {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          userJourney: (parsed.userJourney || []).map((j: { stage?: string; actions?: string[]; painPoints?: string[]; opportunities?: string[] }) => ({
            stage: j.stage || 'Unknown stage',
            actions: j.actions || [],
            painPoints: j.painPoints || [],
            opportunities: j.opportunities || []
          })),
          keyFlows: (parsed.keyFlows || []).map((f: { name?: string; steps?: string[]; wireframes?: string[] }) => ({
            name: f.name || 'Unnamed flow',
            steps: f.steps || [],
            wireframes: f.wireframes || []
          })),
          wireframes: (parsed.wireframes || []).map((w: { name?: string; description?: string; components?: string[] }) => ({
            name: w.name || 'Unnamed wireframe',
            description: w.description || '',
            components: w.components || []
          })),
          principles: parsed.principles || [],
          accessibility: {
            guidelines: parsed.accessibility?.guidelines || [],
            compliance: parsed.accessibility?.compliance || ['WCAG 2.1 AA'],
            testing: parsed.accessibility?.testing || []
          }
        }
      }
    } catch (e) {
      this.logger.warn('Failed to parse UX design JSON', e)
    }

    return this.getFallbackResult()
  }

  private getFallbackResult(normalizeResult?: NormalizeResult): UXDesignResult {
    return {
      userJourney: [
        {
          stage: 'Discovery',
          actions: ['Find product', 'Understand value proposition'],
          painPoints: ['Information overload', 'Unclear benefits'],
          opportunities: ['Clear messaging', 'Social proof']
        },
        {
          stage: 'Onboarding',
          actions: ['Sign up', 'Complete profile', 'First action'],
          painPoints: ['Friction in signup', 'Unclear next steps'],
          opportunities: ['Streamlined flow', 'Progressive disclosure']
        },
        {
          stage: 'Engagement',
          actions: ['Use core feature', 'Achieve goal'],
          painPoints: ['Learning curve', 'Feature complexity'],
          opportunities: ['Guided experience', 'Quick wins']
        }
      ],
      keyFlows: [
        {
          name: 'Signup Flow',
          steps: ['Landing page', 'Email entry', 'Verification', 'Profile setup', 'Dashboard'],
          wireframes: ['signup-landing', 'signup-form', 'signup-success']
        },
        {
          name: 'Core Action Flow',
          steps: ['Dashboard', 'Create new', 'Configure', 'Execute', 'Results'],
          wireframes: ['dashboard', 'create-modal', 'results-view']
        }
      ],
      wireframes: [
        {
          name: 'Dashboard',
          description: 'Main user interface showing key metrics and actions',
          components: ['Header', 'Navigation', 'Stats cards', 'Action buttons', 'Recent activity']
        },
        {
          name: 'Create Modal',
          description: 'Modal for creating new items',
          components: ['Title input', 'Description field', 'Options', 'Submit button']
        }
      ],
      principles: [
        'Mobile-first responsive design',
        'Progressive disclosure of complexity',
        'Clear visual hierarchy',
        'Consistent interaction patterns',
        'Immediate feedback on actions'
      ],
      accessibility: {
        guidelines: [
          'Keyboard navigation support',
          'Screen reader compatibility',
          'Sufficient color contrast',
          'Focus indicators',
          'Alt text for images'
        ],
        compliance: ['WCAG 2.1 AA', 'Section 508'],
        testing: [
          'Automated accessibility testing',
          'Manual screen reader testing',
          'Keyboard-only navigation testing'
        ]
      }
    }
  }
}
