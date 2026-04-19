// e2e/journeys.e2e.ts
// Run: npx detox test --configuration android.emu.debug

import { device, element, by, expect as detoxExpect, waitFor } from 'detox';

const TEST_EMAIL = `e2e_${Date.now()}@test.communityconnect.nz`;
const TEST_PASSWORD = 'TestPass123!';
const TEST_NAME = 'E2E Tester';

// Helper: wait for element and tap
async function tapById(testId: string, timeout = 8000) {
  await waitFor(element(by.id(testId))).toBeVisible().withTimeout(timeout);
  await element(by.id(testId)).tap();
}

async function typeById(testId: string, text: string) {
  await waitFor(element(by.id(testId))).toBeVisible().withTimeout(6000);
  await element(by.id(testId)).clearText();
  await element(by.id(testId)).typeText(text);
}

// ══════════════════════════════════════════════════════════
// JOURNEY 1: Registration & Onboarding
// ══════════════════════════════════════════════════════════
describe('Journey 1: Registration', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('shows the welcome screen', async () => {
    await detoxExpect(element(by.text('CommunityConnect'))).toBeVisible();
    await detoxExpect(element(by.text('Create Account'))).toBeVisible();
    await detoxExpect(element(by.text('Sign In'))).toBeVisible();
  });

  it('navigates to the register screen', async () => {
    await element(by.text('Create Account')).tap();
    await detoxExpect(element(by.text('Who are you?'))).toBeVisible();
  });

  it('selects the Senior role', async () => {
    await element(by.text('Senior')).tap();
    await element(by.text('Continue')).tap();
    await detoxExpect(element(by.text('Create Account'))).toBeVisible();
  });

  it('fills in registration details and creates account', async () => {
    await element(by.label('Full name')).typeText(TEST_NAME);
    await element(by.label('Email address')).typeText(TEST_EMAIL);
    await element(by.label('Password')).typeText(TEST_PASSWORD);
    await element(by.label('Confirm password')).typeText(TEST_PASSWORD);
    await element(by.label('Create account')).tap();

    // Should land on community tab
    await waitFor(element(by.text('Community'))).toBeVisible().withTimeout(15000);
  });
});

// ══════════════════════════════════════════════════════════
// JOURNEY 2: Community Discussion
// ══════════════════════════════════════════════════════════
describe('Journey 2: Community Post', () => {
  it('opens the community feed', async () => {
    await detoxExpect(element(by.label('Community discussion'))).toBeVisible();
  });

  it('creates a new post', async () => {
    await element(by.label('Create new post')).tap();
    await waitFor(element(by.text('New Post'))).toBeVisible().withTimeout(5000);

    await element(by.label('Post body')).typeText('Hello from E2E tests! This is a test post.');
    await element(by.label('Publish post')).tap();

    // Should return to feed and show post
    await waitFor(element(by.text('Hello from E2E tests!'))).toBeVisible().withTimeout(10000);
  });

  it('can like a post', async () => {
    const likeBtn = element(by.label(/Like post/)).atIndex(0);
    await waitFor(likeBtn).toBeVisible().withTimeout(5000);
    await likeBtn.tap();
  });
});

// ══════════════════════════════════════════════════════════
// JOURNEY 3: Wellbeing Check-in
// ══════════════════════════════════════════════════════════
describe('Journey 3: Wellbeing Check-in', () => {
  beforeAll(async () => {
    await element(by.label('Wellbeing check-ins')).tap();
    await waitFor(element(by.text('Wellbeing'))).toBeVisible().withTimeout(5000);
  });

  it('shows the daily check-in form', async () => {
    await detoxExpect(element(by.text('Daily Check-in'))).toBeVisible();
    await detoxExpect(element(by.text('How are you feeling?'))).toBeVisible();
  });

  it('completes a check-in', async () => {
    // Select mood 4 (Good)
    await element(by.label('Mood: Good')).tap();
    // Mark safe
    await element(by.label('Yes, I am safe')).tap();
    // Submit
    await element(by.label('Submit check-in')).tap();
    // Should show completion state
    await waitFor(element(by.text('Check-in complete!'))).toBeVisible().withTimeout(8000);
  });
});

// ══════════════════════════════════════════════════════════
// JOURNEY 4: Event Discovery & RSVP
// ══════════════════════════════════════════════════════════
describe('Journey 4: Events', () => {
  beforeAll(async () => {
    await element(by.label('Events')).tap();
    await waitFor(element(by.text('Events'))).toBeVisible().withTimeout(5000);
  });

  it('shows the events screen', async () => {
    await detoxExpect(element(by.label('Create event'))).toBeVisible();
  });

  it('creates a new event', async () => {
    await element(by.label('Create event')).tap();
    await waitFor(element(by.text('Create Event'))).toBeVisible().withTimeout(5000);

    await element(by.label('Event title')).typeText('E2E Test Morning Walk');
    await element(by.label('Event description')).typeText('A gentle stroll for testing purposes');
    await element(by.label('Event location')).typeText('Auckland Domain');
    await element(by.label('Create event')).tap();

    // Should navigate to event detail
    await waitFor(element(by.text('E2E Test Morning Walk'))).toBeVisible().withTimeout(10000);
  });

  it('RSVPs to the event', async () => {
    await element(by.label("RSVP to this event")).tap();
    await waitFor(element(by.text("I'm Going!"))).toBeVisible().withTimeout(5000);
  });
});

// ══════════════════════════════════════════════════════════
// JOURNEY 5: Profile & Sign Out
// ══════════════════════════════════════════════════════════
describe('Journey 5: Profile', () => {
  beforeAll(async () => {
    await element(by.label('Your profile')).tap();
    await waitFor(element(by.text(TEST_NAME))).toBeVisible().withTimeout(5000);
  });

  it('shows user profile with correct name and role', async () => {
    await detoxExpect(element(by.text(TEST_NAME))).toBeVisible();
    await detoxExpect(element(by.text('Senior'))).toBeVisible();
  });

  it('signs out successfully', async () => {
    await element(by.label('Sign out')).tap();
    // Confirm dialog
    await waitFor(element(by.text('Sign Out'))).toBeVisible().withTimeout(3000);
    await element(by.text('Sign Out')).atIndex(1).tap();
    // Should return to welcome
    await waitFor(element(by.text('CommunityConnect'))).toBeVisible().withTimeout(10000);
  });
});
