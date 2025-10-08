export interface IntegrationDescriptor {
  id: string
  name: string
  category: 'data' | 'messaging' | 'devops'
  provider: string
  description: string
  docsUrl?: string
}

const DEFAULT_INTEGRATIONS: IntegrationDescriptor[] = [
  {
    id: 'slack-alerts',
    name: 'Slack Alerts',
    category: 'messaging',
    provider: 'Slack',
    description: 'Send Launchloom run summaries and guardrail alerts directly to a Slack channel.',
    docsUrl: 'https://api.slack.com/messaging/webhooks'
  },
  {
    id: 'github-ops',
    name: 'GitHub Ops',
    category: 'devops',
    provider: 'GitHub',
    description: 'Push generated repos or runbooks to a GitHub organisation with automations.',
    docsUrl: 'https://docs.github.com/en/actions'
  },
  {
    id: 'airtable-insights',
    name: 'Airtable Insights',
    category: 'data',
    provider: 'Airtable',
    description: 'Sync pipeline telemetry and evaluation metrics into Airtable bases.',
    docsUrl: 'https://airtable.com/developers/web/api/introduction'
  }
]

export class IntegrationRegistry {
  private readonly integrations: IntegrationDescriptor[]

  constructor(custom: IntegrationDescriptor[] = []) {
    const merged = [...DEFAULT_INTEGRATIONS]
    custom.forEach(integration => {
      const exists = merged.find(item => item.id === integration.id)
      if (exists) {
        Object.assign(exists, integration)
      } else {
        merged.push(integration)
      }
    })
    this.integrations = merged
  }

  list(): IntegrationDescriptor[] {
    return this.integrations
  }

  find(id: string): IntegrationDescriptor | undefined {
    return this.integrations.find(integration => integration.id === id)
  }
}
