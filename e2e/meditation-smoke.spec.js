// Meditation module — happy-path smoke test.
//
// Walks: unlock (dev fixture) → sub-task practice → tier Harvest → Reflection
// → Resonance entry, asserting each checkpoint renders without crashing.
//
// Runs against the dev server (`npm run dev`), so the dev-only fixture panel
// (wrench button) and the video fast-forward flag are active.
//
// Auth note: saveReflection writes to Supabase and needs a signed-in user, so
// this smoke test stops at "Reflection Closed" and only verifies the Resonance
// PAGE renders — asserting our own reflection appears there is a later step
// that requires seeded test credentials.

import { test, expect } from '@playwright/test';

const WRENCH = 'Dev test fixtures';
const FF_ON = /Fast-forward video: ON/;

async function openPanel(page) {
  await page.getByRole('button', { name: WRENCH }).click();
  await expect(page.getByText('Dev Test Fixtures')).toBeVisible();
}

async function closePanel(page) {
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByText('Dev Test Fixtures')).toBeHidden();
}

test('meditation happy path: unlock → practice → harvest → reflection → resonance', async ({
  page,
}) => {
  // ── 1. Entry ────────────────────────────────────────────────
  await test.step('boot the meditation home', async () => {
    await page.goto('/meditate');
    await expect(
      page.getByRole('heading', { name: 'Meditation', level: 1 })
    ).toBeVisible();
    await expect(
      page.getByText('Build your practice, one Taoist micro-practice at a time.')
    ).toBeVisible();
  });

  // ── 2. Unlock fixture (reset, then fast-forward video) ──────
  await test.step('use the dev fixture: reset + fast-forward', async () => {
    await openPanel(page);
    await page.getByRole('button', { name: 'Reset (re-lock all)' }).click();
    await expect(page.getByText(/Sub-tasks 0\/9/)).toBeVisible();
    await expect(page.getByText(/Combinations 0\/2/)).toBeVisible();

    await page.getByRole('button', { name: /Fast-forward video/ }).click();
    await expect(page.getByRole('button', { name: FF_ON })).toBeVisible();
    await closePanel(page);
  });

  // ── 3. Sub-task practice (real practice loop, 1 rep) ────────
  await test.step('practice one repetition of a sub-task', async () => {
    await page.getByRole('button', { name: /Breathing/ }).click();
    await expect(page.getByText('1. Observe Breath')).toBeVisible();
    await page.getByRole('button', { name: 'Start Practice' }).click();

    await expect(
      page.getByRole('heading', { name: 'Observe Breath', level: 1 })
    ).toBeVisible();
    await page.getByRole('button', { name: 'Start Practice' }).click();

    // Player opens in practice mode, then fast-forwards to the end.
    await expect(page.getByText(/Practicing · 1\/3/)).toBeVisible();
    await expect(page.getByText('1 / 3 repetitions')).toBeVisible({
      timeout: 8000,
    });
  });

  // ── 4. Tier Harvest (needs all sub-tasks complete) ──────────
  await test.step('unlock all, then reach the sub-task Harvest', async () => {
    await page.goto('/meditate');
    await openPanel(page);
    await page.getByRole('button', { name: 'Unlock all micro-tasks' }).click();
    await expect(page.getByText(/Sub-tasks 9\/9/)).toBeVisible();
    await expect(page.getByText(/Combinations 2\/2/)).toBeVisible();
    await closePanel(page);

    // The home screen reads progress at render time — reload to refresh it.
    await page.reload();
    await page.getByRole('button', { name: /Harvest/ }).click();

    await expect(
      page.getByRole('heading', { name: 'What actually changed?', level: 1 })
    ).toBeVisible();
    await expect(
      page.getByText('Harvest options for this practice are being curated.')
    ).toBeVisible();
  });

  // ── 5. Reflection (mirrors Learning) ────────────────────────
  await test.step('write and close the reflection', async () => {
    await page.getByRole('button', { name: 'Continue to Reflection' }).click();

    await expect(
      page.getByRole('heading', { name: 'Reflection Space', level: 1 })
    ).toBeVisible();
    await page
      .getByPlaceholder(
        'What has changed in your understanding? What did you discover? (optional)'
      )
      .fill('Smoke test reflection');
    await expect(
      page.getByRole('button', { name: 'Share to Resonance' })
    ).toBeVisible();

    await page.getByRole('button', { name: 'Close Reflection' }).click();
    await expect(page.getByText('Reflection Closed')).toBeVisible();
    await expect(page.getByText('Return to Meditation')).toBeVisible();
  });

  // ── 6. Resonance entry ──────────────────────────────────────
  await test.step('the Resonance page renders', async () => {
    await page.goto('/harmony-resonance');
    await expect(page.getByText('Harmony Resonance')).toBeVisible();
    await expect(page.getByText('Collective Wisdom')).toBeVisible();
  });
});
