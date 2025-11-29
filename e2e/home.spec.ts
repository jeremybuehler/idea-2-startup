import { test, expect } from '@playwright/test'

test.describe('Launchloom Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display the main heading', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Weave launch-ready agents from any idea')
  })

  test('should have the Launchloom branding', async ({ page }) => {
    await expect(page.getByText('Launchloom')).toBeVisible()
    await expect(page.getByText('Preview')).toBeVisible()
  })

  test('should show idea intake form', async ({ page }) => {
    await expect(page.getByLabel('Project title')).toBeVisible()
    await expect(page.getByLabel('One-liner')).toBeVisible()
    await expect(page.getByLabel('Idea details')).toBeVisible()
  })

  test('should show deliverables section', async ({ page }) => {
    await expect(page.getByText('Executive PRD')).toBeVisible()
    await expect(page.getByText('Agent Runbook')).toBeVisible()
    await expect(page.getByText('Launch-ready Repo')).toBeVisible()
  })

  test('should have navigation elements', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Deploy Guide/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Roadmap/i })).toBeVisible()
  })

  test('should display pipeline tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'Pipeline' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'PRD' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Wireframes' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Code & Infra' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Agent Runbook' })).toBeVisible()
  })

  test('should show pricing section', async ({ page }) => {
    await expect(page.getByText('Concierge run pricing')).toBeVisible()
    await expect(page.getByText('$3,000')).toBeVisible()
  })

  test('should show roadmap section', async ({ page }) => {
    await expect(page.getByText('Now — Concierge Run')).toBeVisible()
    await expect(page.getByText('Next — Modular Agent Kits')).toBeVisible()
    await expect(page.getByText('Later — Launchloom Studio')).toBeVisible()
  })

  test('should have lead capture form', async ({ page }) => {
    await expect(page.getByText('Tell us about your idea')).toBeVisible()
  })
})

test.describe('Idea Generation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should update idea score when typing', async ({ page }) => {
    const ideaInput = page.getByLabel('Idea details')
    await ideaInput.fill('An AI-powered platform for helping startups with customer research and user interviews')

    // Score should update
    const scoreText = page.locator('text=/\\d+\\/100/')
    await expect(scoreText).toBeVisible()
  })

  test('should enable generate button with valid input', async ({ page }) => {
    const generateButton = page.getByRole('button', { name: /Generate Dossier/i })

    // Initially disabled without idea
    await expect(generateButton).toBeDisabled()

    // Fill in idea
    await page.getByLabel('Idea details').fill('A platform for automated code reviews using AI')

    // Button should be enabled
    await expect(generateButton).toBeEnabled()
  })

  test('should show progress when generating', async ({ page }) => {
    // Fill in the form
    await page.getByLabel('Project title').fill('CodeReview AI')
    await page.getByLabel('One-liner').fill('Automated code reviews powered by AI')
    await page.getByLabel('Idea details').fill('A platform that uses AI to automatically review code, suggest improvements, and catch bugs before they reach production.')

    // Click generate
    await page.getByRole('button', { name: /Generate Dossier/i }).click()

    // Should show loading state
    await expect(page.getByText(/Generating|Simulating/i)).toBeVisible()
  })

  test('should generate and display dossier', async ({ page }) => {
    // Fill in the form
    await page.getByLabel('Project title').fill('CodeReview AI')
    await page.getByLabel('One-liner').fill('Automated code reviews powered by AI')
    await page.getByLabel('Idea details').fill('A platform that uses AI to automatically review code, suggest improvements, and catch bugs before they reach production.')

    // Click generate
    await page.getByRole('button', { name: /Generate Dossier/i }).click()

    // Wait for generation to complete (simulated mode is ~4 seconds)
    await page.waitForSelector('button:has-text("Download JSON")', { timeout: 10000 })

    // Should show download buttons
    await expect(page.getByRole('button', { name: /Download JSON/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Download Repo/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Add Repo to GitHub/i })).toBeVisible()

    // PRD tab should have content
    await page.getByRole('tab', { name: 'PRD' }).click()
    await expect(page.getByText('CodeReview AI')).toBeVisible()
  })
})

test.describe('Deploy Guide Modal', () => {
  test('should open deploy guide modal', async ({ page }) => {
    await page.goto('/')

    // Click deploy guide button
    await page.getByRole('button', { name: /Deploy Guide/i }).click()

    // Modal should be visible
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('Deploy to Vercel')).toBeVisible()

    // Should show deployment steps
    await expect(page.getByText('git init')).toBeVisible()
    await expect(page.getByText('vercel.com/new')).toBeVisible()
  })

  test('should close deploy guide modal', async ({ page }) => {
    await page.goto('/')

    // Open modal
    await page.getByRole('button', { name: /Deploy Guide/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Close modal
    await page.getByRole('button', { name: /Close/i }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })
})

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/')

    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBe(1)
  })

  test('should have accessible form labels', async ({ page }) => {
    await page.goto('/')

    // All form inputs should have associated labels
    const titleInput = page.getByLabel('Project title')
    await expect(titleInput).toBeVisible()

    const oneLinerInput = page.getByLabel('One-liner')
    await expect(oneLinerInput).toBeVisible()

    const ideaInput = page.getByLabel('Idea details')
    await expect(ideaInput).toBeVisible()
  })

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/')

    // Tab to first focusable element and verify focus moves
    await page.keyboard.press('Tab')

    // Should be able to tab through interactive elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
    }

    // Some element should be focused
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })
})

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Main content should be visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByLabel('Idea details')).toBeVisible()
  })

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByLabel('Idea details')).toBeVisible()
  })
})
