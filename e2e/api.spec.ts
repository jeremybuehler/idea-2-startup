import { test, expect } from '@playwright/test'

test.describe('API Endpoints', () => {
  test.describe('Health Check', () => {
    test('GET /api/health should return healthy status', async ({ request }) => {
      const response = await request.get('/api/health')

      expect(response.ok()).toBeTruthy()

      const body = await response.json()
      expect(body.status).toBe('healthy')
      expect(body.service).toBe('launchloom-api')
      expect(body.timestamp).toBeDefined()
    })
  })

  test.describe('Pipeline API', () => {
    test('POST /api/pipeline should process an idea', async ({ request }) => {
      const response = await request.post('/api/pipeline', {
        data: {
          title: 'Test Startup',
          one_liner: 'A test startup for automated testing',
          idea_text: 'This is a test idea with sufficient content to pass validation. It describes a platform for helping developers write better tests.'
        }
      })

      expect(response.ok()).toBeTruthy()

      const body = await response.json()
      expect(body.execution_id).toBeDefined()
      expect(body.status).toBe('completed')
      expect(body.dossier).toBeDefined()
      expect(body.dossier.title).toBe('Test Startup')
      expect(body.dossier.scores).toBeDefined()
      expect(body.metadata.stages_completed).toBe(9)
    })

    test('POST /api/pipeline should reject invalid input', async ({ request }) => {
      const response = await request.post('/api/pipeline', {
        data: {
          title: 'Test',
          one_liner: 'Short',
          idea_text: 'Too short'
        }
      })

      expect(response.status()).toBe(400)

      const body = await response.json()
      expect(body.error).toBe('Invalid input')
      expect(body.details).toContain('Input too short (min 10 characters)')
    })

    test('GET /api/pipeline should require execution_id', async ({ request }) => {
      const response = await request.get('/api/pipeline')

      expect(response.status()).toBe(400)

      const body = await response.json()
      expect(body.error).toBe('execution_id is required')
    })
  })

  test.describe('Ideas API', () => {
    test('POST /api/ideas should create an idea', async ({ request }) => {
      const response = await request.post('/api/ideas', {
        data: {
          title: 'My Test Idea',
          one_liner: 'A great test idea',
          idea_text: 'This is a comprehensive test idea that describes a platform for helping startups validate their business models.'
        }
      })

      expect(response.status()).toBe(201)

      const body = await response.json()
      expect(body.id).toMatch(/^idea_/)
      expect(body.title).toBe('My Test Idea')
      expect(body.scores).toBeDefined()
      expect(body.status).toBe('processed')
    })

    test('GET /api/ideas should return paginated list', async ({ request }) => {
      const response = await request.get('/api/ideas?limit=10&offset=0')

      expect(response.ok()).toBeTruthy()

      const body = await response.json()
      expect(body.items).toBeInstanceOf(Array)
      expect(body.total).toBeDefined()
      expect(body.limit).toBe(10)
      expect(body.offset).toBe(0)
    })

    test('GET /api/ideas/[id] should return idea details', async ({ request }) => {
      const response = await request.get('/api/ideas/idea_test123')

      expect(response.ok()).toBeTruthy()

      const body = await response.json()
      expect(body.id).toBe('idea_test123')
      expect(body.prd).toBeDefined()
      expect(body.runbook).toBeDefined()
    })
  })

  test.describe('Workspaces API', () => {
    test('POST /api/workspaces should create workspace', async ({ request }) => {
      const response = await request.post('/api/workspaces', {
        data: {
          name: 'Test Workspace',
          description: 'A workspace for testing'
        }
      })

      expect(response.status()).toBe(201)

      const body = await response.json()
      expect(body.name).toBe('Test Workspace')
      expect(body.slug).toBeDefined()
      expect(body.public_id).toMatch(/^ws_/)
    })

    test('POST /api/workspaces should reject empty name', async ({ request }) => {
      const response = await request.post('/api/workspaces', {
        data: {
          name: '',
          description: 'A workspace'
        }
      })

      expect(response.status()).toBe(400)

      const body = await response.json()
      expect(body.error).toContain('name is required')
    })

    test('GET /api/workspaces should return list', async ({ request }) => {
      const response = await request.get('/api/workspaces')

      expect(response.ok()).toBeTruthy()

      const body = await response.json()
      expect(body.items).toBeInstanceOf(Array)
      expect(body.total).toBeDefined()
    })

    test('GET /api/workspaces/[id] should return workspace', async ({ request }) => {
      const response = await request.get('/api/workspaces/test-workspace')

      expect(response.ok()).toBeTruthy()

      const body = await response.json()
      expect(body.slug).toBe('test-workspace')
      expect(body.members).toBeInstanceOf(Array)
    })

    test('POST /api/workspaces/[id]/runs should record a run', async ({ request }) => {
      const response = await request.post('/api/workspaces/test-workspace/runs', {
        data: {
          run_id: 'test_run_123',
          idea_title: 'Test Idea',
          idea_slug: 'test-idea',
          idea_text: 'A test idea with sufficient content for validation purposes.',
          compliance_status: 'passed',
          evaluation_score: 85,
          total_cost: 0.05
        }
      })

      expect(response.status()).toBe(201)

      const body = await response.json()
      expect(body.run_id).toBe('test_run_123')
      expect(body.workspace_id).toBe('test-workspace')
    })
  })

  test.describe('Security Headers', () => {
    test('API responses should include security headers', async ({ request }) => {
      const response = await request.get('/api/health')

      expect(response.headers()['x-content-type-options']).toBe('nosniff')
      expect(response.headers()['x-frame-options']).toBe('DENY')
      expect(response.headers()['x-xss-protection']).toBe('1; mode=block')
    })
  })
})
