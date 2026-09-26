import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '..', 'images', 'instagram');
const SCREENSHOT_DIR = path.join(__dirname, '..', 'scripts', 'screenshots');
const IG_USER = process.env.INSTAGRAM_USER;
const IG_PASS = process.env.INSTAGRAM_PASS;

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function screenshot(page, name) {
  const filepath = path.join(SCREENSHOT_DIR, `${name}-${Date.now()}.png`);
  try {
    await page.screenshot({ path: filepath, fullPage: true });
    console.log(`Screenshot saved: ${filepath}`);
  } catch (e) {
    console.error('Screenshot failed:', e.message);
  }
}

const POSTS = [
  {
    url: 'https://www.instagram.com/p/DdRgoE3kQoD/',
    propertyId: 'prop-naco-luxury-001',
    prefix: 'naco-luxury',
  },
  {
    url: 'https://www.instagram.com/p/DdWw9PgkbJ5/',
    propertyId: 'prop-ensanche-naco-001',
    prefix: 'ensanche-naco',
  },
  {
    url: 'https://www.instagram.com/p/DdUbOSeieA7/',
    propertyId: 'prop-anacaona-deluxe-001',
    prefix: 'anacaona-deluxe',
  },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadImage(requestContext, url, filepath) {
  const response = await requestContext.get(url);
  if (!response.ok()) {
    throw new Error(`HTTP ${response.status()} for ${url}`);
  }
  const buffer = await response.body();
  fs.writeFileSync(filepath, buffer);
}

async function acceptCookies(page) {
  try {
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await btn.textContent().catch(() => '');
      if (text && /(aceptar|allow|permitir|agree|ok)/i.test(text)) {
        await btn.click().catch(() => {});
        await sleep(500);
      }
    }
  } catch (e) {
    // ignore
  }
}

async function login(page) {
  console.log('Logging in to Instagram...');
  await page.goto('https://www.instagram.com/accounts/login/', {
    waitUntil: 'domcontentloaded',
  });
  await sleep(3000);
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

  await screenshot(page, 'login-page');

  await acceptCookies(page);

  // Try multiple username selectors
  const usernameSelectors = [
    'input[name="username"]',
    'input[aria-label="Phone number, username, or email"]',
    'input[autocapitalize="none"]',
    'input[type="text"]',
  ];

  let usernameInput = null;
  for (const selector of usernameSelectors) {
    usernameInput = await page.$(selector);
    if (usernameInput) {
      console.log(`Found username input with selector: ${selector}`);
      break;
    }
  }

  if (!usernameInput) {
    // Maybe we're on a "Log in / Sign up" landing page
    const loginLinks = await page.$$('a, button');
    for (const link of loginLinks) {
      const text = await link.textContent().catch(() => '');
      if (/log\s*in|iniciar\s*sesi[oó]n/i.test(text)) {
        console.log('Clicking login link:', text.trim());
        await link.click();
        await sleep(2000);
        break;
      }
    }

    // Try again
    for (const selector of usernameSelectors) {
      usernameInput = await page.$(selector);
      if (usernameInput) break;
    }
  }

  if (!usernameInput) {
    await screenshot(page, 'login-error');
    throw new Error('Could not find username input on login page.');
  }

  await usernameInput.fill(IG_USER);
  await sleep(300);

  const passwordSelectors = [
    'input[name="password"]',
    'input[type="password"]',
    'input[aria-label="Password"]',
  ];

  let passwordInput = null;
  for (const selector of passwordSelectors) {
    passwordInput = await page.$(selector);
    if (passwordInput) break;
  }

  if (!passwordInput) {
    throw new Error('Could not find password input.');
  }

  await passwordInput.fill(IG_PASS);
  await sleep(300);

  const submitSelectors = [
    'button[type="submit"]',
    'button:has-text("Log in")',
    'button:has-text("Iniciar sesión")',
  ];

  let submitButton = null;
  for (const selector of submitSelectors) {
    try {
      submitButton = await page.$(selector);
      if (submitButton) break;
    } catch (e) {
      // ignore invalid selector
    }
  }

  if (!submitButton) {
    submitButton = await page.$('form button');
  }

  if (submitButton) {
    await submitButton.click();
  } else {
    await page.press('input[type="password"]', 'Enter');
  }

  // Wait for navigation or 2FA prompt
  await page.waitForTimeout(5000);
  await screenshot(page, 'after-submit');

  const url = page.url();
  if (url.includes('/accounts/login/') || url.includes('/challenge/')) {
    console.log('');
    console.log('============================================================');
    console.log('Instagram is asking for verification (2FA / challenge).');
    console.log('A browser window is open. Please complete the login manually.');
    console.log('The script will wait up to 2 minutes.');
    console.log('============================================================');
    console.log('');
    await page.waitForNavigation({ timeout: 120000, waitUntil: 'networkidle' }).catch(() => {});
  }

  await screenshot(page, 'after-login');

  // Handle "Save your login info?" modal
  await handleSaveLoginModal(page);

  if (page.url().includes('/accounts/login/')) {
    throw new Error('Login failed. Still on login page after timeout.');
  }

  console.log('Login successful.');
}

async function handleSaveLoginModal(page) {
  try {
    const notNowButton = await page.$('button:has-text("Not now"), button:has-text("Ahora no")');
    if (notNowButton) {
      console.log('Clicking "Not now" on save login info modal');
      await notNowButton.click();
      await sleep(1000);
    }
  } catch (e) {
    // ignore
  }
}

async function scrapePost(page, requestContext, post) {
  console.log(`\nProcessing post: ${post.propertyId}`);
  console.log(`URL: ${post.url}`);

  await page.goto(post.url, { waitUntil: 'domcontentloaded' });
  await sleep(3000);
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

  // Accept any remaining dialogs/cookies
  await acceptCookies(page);
  await handleSaveLoginModal(page);

  await screenshot(page, `post-${post.propertyId}-loaded`);

  const collectedUrls = [];
  const seenUrls = new Set();
  let attempts = 0;
  const maxAttempts = 30;

  while (attempts < maxAttempts) {
    attempts++;

    // Extract current visible image URLs
    const imageUrls = await page.evaluate(() => {
      const urls = [];
      const images = document.querySelectorAll('img');
      images.forEach((img) => {
        const src = img.getAttribute('src') || img.getAttribute('srcset')?.split(',')[0]?.split(' ')[0];
        if (src) urls.push(src);
      });
      return urls;
    });

    let newFound = false;
    for (const url of imageUrls) {
      const normalized = url.split('?')[0];
      if (!seenUrls.has(normalized) && url.includes('instagram')) {
        seenUrls.add(normalized);
        collectedUrls.push(url);
        newFound = true;
        console.log(`  Found image: ${url.substring(0, 80)}...`);
      }
    }

    // Try to click the "Next" button using multiple strategies
    const nextClicked = await page.evaluate(() => {
      // Strategy 1: button with aria-label containing Next/Siguiente
      const buttons = Array.from(document.querySelectorAll('button'));
      for (const btn of buttons) {
        const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
        const title = (btn.getAttribute('title') || '').toLowerCase();
        if (ariaLabel.includes('next') || ariaLabel.includes('siguiente') || title.includes('next')) {
          if (btn.offsetParent !== null && !btn.disabled) {
            btn.click();
            return true;
          }
        }
      }

      // Strategy 2: SVG with aria-label="Siguiente" / "Next" inside a button
      const svgs = Array.from(document.querySelectorAll('svg'));
      for (const svg of svgs) {
        const label = (svg.getAttribute('aria-label') || '').toLowerCase();
        if (label.includes('siguiente') || label.includes('next')) {
          const btn = svg.closest('button');
          if (btn && btn.offsetParent !== null && !btn.disabled) {
            btn.click();
            return true;
          }
        }
      }

      // Strategy 3: Right-pointing chevron / arrow in carousel
      const allButtons = Array.from(document.querySelectorAll('button, [role="button"]'));
      for (const btn of allButtons) {
        const html = btn.innerHTML.toLowerCase();
        if (html.includes('chevron') || html.includes('m504.5 75') || html.includes('right')) {
          if (btn.offsetParent !== null && !btn.disabled) {
            btn.click();
            return true;
          }
        }
      }

      return false;
    });

    if (!nextClicked) {
      console.log('No more carousel slides found.');
      break;
    }

    await sleep(1500);
  }

  console.log(`Found ${collectedUrls.length} unique image(s) total`);

  // Download images
  const downloadedPaths = [];
  for (let i = 0; i < collectedUrls.length; i++) {
    const filename = `${post.prefix}-${i + 1}.jpg`;
    const filepath = path.join(OUTPUT_DIR, filename);
    try {
      await downloadImage(requestContext, collectedUrls[i], filepath);
      downloadedPaths.push(`/images/instagram/${filename}`);
      console.log(`  ✓ ${filename}`);
    } catch (err) {
      console.error(`  ✗ Failed to download image ${i + 1}:`, err.message);
    }
  }

  await screenshot(page, `post-${post.propertyId}-done`);
  return downloadedPaths;
}

async function main() {
  if (!IG_USER || !IG_PASS) {
    console.error('Error: INSTAGRAM_USER and INSTAGRAM_PASS must be set in .env');
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();
  const requestContext = context.request;

  try {
    await login(page);

    const results = {};
    for (const post of POSTS) {
      results[post.propertyId] = await scrapePost(page, requestContext, post);
    }

    console.log('\n============================================================');
    console.log('Download summary:');
    console.log(JSON.stringify(results, null, 2));
    console.log('============================================================');

    // Write a summary JSON for easy integration
    const summaryPath = path.join(__dirname, '..', 'images', 'instagram', 'download-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));
    console.log(`Summary saved to ${summaryPath}`);
  } catch (error) {
    console.error('\nError:', error.message);
    console.log('Browser will stay open for 10 seconds so you can inspect the issue.');
    await sleep(10000);
  } finally {
    await browser.close();
  }
}

main();
