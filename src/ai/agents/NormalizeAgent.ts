/**
 * Normalize Agent - Stage 1 of the Launchloom Pipeline
 *
 * Responsible for:
 * - Cleaning and structuring raw idea input
 * - Extracting title, one-liner, and key components
 * - Identifying industry and target market
 * - Producing normalized context for downstream stages
 */

import { LaunchloomAgentsService, AgentMessage } from '../services/LaunchloomAgentsService'
import { Logger } from '../utils/Logger'
import { NormalizeResult, IdeaContext } from '../types/Pipeline'

const SYSTEM_PROMPT = `You are the Normalize Agent in the Launchloom pipeline. Your job is to take raw, unstructured startup ideas and transform them into clean, structured components.

Your output must be valid JSON with exactly these fields:
- title: A clear, compelling project title (max 60 characters)
- oneLiner: A concise pitch that captures the essence (max 150 characters)
- problem: A structured problem statement (2-3 sentences)
- audience: Target audience definition with primary and secondary personas
- valueProposition: The core value proposition (what makes this unique)

Be specific and actionable. Avoid generic language. Focus on clarity and market positioning.`

export class NormalizeAgent {
  private agentService: LaunchloomAgentsService
  private logger: Logger

  constructor(agentService: LaunchloomAgentsService) {
    this.agentService = agentService
    this.logger = new Logger('NormalizeAgent')
  }

  async execute(context: IdeaContext): Promise<NormalizeResult> {
    this.logger.info('Starting normalization', { ideaLength: context.ideaText.length })

    const messages: AgentMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Normalize this startup idea into structured components:

Raw Idea:
"${context.ideaText}"

${context.industry ? `Industry hint: ${context.industry}` : ''}
${context.targetMarket ? `Target market hint: ${context.targetMarket}` : ''}

Respond with valid JSON only.`
      }
    ]

    try {
      const response = await this.agentService.sendMessage(messages, {
        model: 'gpt-4.1-mini',
        maxTokens: 1000,
        temperature: 0.7
      })

      const result = this.parseResult(response.content)

      this.logger.info('Normalization complete', {
        title: result.title,
        cost: response.usage.cost
      })

      return result
    } catch (error) {
      this.logger.error('Normalization failed', error)

      // Return fallback result
      return {
        title: context.ideaText.slice(0, 60),
        oneLiner: context.ideaText.slice(0, 150),
        problem: 'Problem statement pending detailed analysis.',
        audience: 'Target audience pending market research.',
        valueProposition: 'Value proposition pending competitive analysis.'
      }
    }
  }

  private parseResult(content: string): NormalizeResult {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          title: parsed.title || 'Untitled Startup',
          oneLiner: parsed.oneLiner || parsed.one_liner || '',
          problem: parsed.problem || '',
          audience: parsed.audience || '',
          valueProposition: parsed.valueProposition || parsed.value_proposition || ''
        }
      }
    } catch (e) {
      this.logger.warn('Failed to parse JSON response', e)
    }

    // Return content as-is if parsing fails
    return {
      title: 'Untitled Startup',
      oneLiner: content.slice(0, 150),
      problem: content,
      audience: '',
      valueProposition: ''
    }
  }
}
