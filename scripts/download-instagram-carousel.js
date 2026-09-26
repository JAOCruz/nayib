import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

const posts = [
  {
    id: 'DdWw9PgkbJ5',
    name: 'naco-corazon',
    url: 'https://www.instagram.com/p/DdWw9PgkbJ5/'
  },
  {
    id: 'DdUbOSeieA7',
    name: 'anacaona-deluxe',
    url: 'https://www.instagram.com/p/DdUbOSeieA7/'
  },
  {
    id: 'DdRgoE3kQoD',
    name: 'naco-luxury',
    url: 'https://www.instagram.com/p/DdRgoE3kQoD/'
  }
];

const outputDir = path.join(process.cwd(), 'images', 'instagram');

async function downloadImage(page, url, filePath) {
  const base64 = await page.evaluate(async (imageUrl) => {
    const response = await fetch(imageUrl, {
      credentials: 'include',
      headers: {
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': 'https://www.instagram.com/'
      }
    });
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(blob);
    });
  }, url);

  if (!base64) {
    throw new Error('Failed to download image in browser context');
  }

  const buffer = Buffer.from(base64, 'base64');
  await fs.writeFile(filePath, buffer);
  return buffer.length;
}

async function extractCarouselImages(page, postUrl) {
  console.log(`Opening ${postUrl}...`);
  await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle');

  // Check if login is required
  const pageContent = await page.content();
  if (pageContent.includes('Log in') || pageContent.includes('Iniciar sesión') || pageContent.includes('login')) {
    const loginPrompt = await page.$('text=/Log in|Iniciar sesión/i');
    if (loginPrompt) {
      throw new Error('Instagram requires login. Please provide cookies or log in manually.');
    }
  }

  // Wait for the main post media container
  await page.waitForSelector('article, [role="dialog"] article, main article', { timeout: 15000 });

  const images = [];
  const seenUrls = new Set();
  const maxSlides = 20;

  for (let i = 0; i < maxSlides; i++) {
    // Extract the main visible image from the post container
    const result = await page.evaluate(() => {
      // Find the main post article
      const article = document.querySelector('article') ||
                     document.querySelector('[role="dialog"] article') ||
                     document.querySelector('main article');

      if (!article) return null;

      // Find the currently visible image in the carousel
      // Instagram uses a transform/translate-based carousel. The active image is usually the one
      // most centered in the viewport within the media container.
      const mediaContainer = article.querySelector('div[style*="transform"]') || article;
      const allImages = Array.from(mediaContainer.querySelectorAll('img'));

      // Filter out small icons/avatars and profile pictures
      const candidates = allImages.filter(img => {
        const rect = img.getBoundingClientRect();
        return rect.width > 300 && rect.height > 300 && img.src && img.src.includes('instagram');
      });

      // Pick the image that is most visible/centered
      let bestImage = null;
      let bestScore = -1;
      for (const img of candidates) {
        const rect = img.getBoundingClientRect();
        const visibleWidth = Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0);
        const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
        const score = visibleWidth * visibleHeight;
        if (score > bestScore) {
          bestScore = score;
          bestImage = img;
        }
      }

      if (!bestImage) return null;

      return {
        url: bestImage.src,
        width: bestImage.naturalWidth,
        height: bestImage.naturalHeight
      };
    });

    if (!result || !result.url) {
      console.log('No main image found on this slide.');
      break;
    }

    // Convert thumbnail URL to high-res
    let highResUrl = result.url
      .replace(/stp=dst-jpg_e35_s\d+x\d+_tt6/, 'stp=dst-jpg_e35_tt6')
      .replace(/stp=dst-jpg_e35_[^&]*/, 'stp=dst-jpg_e35_tt6');

    if (!seenUrls.has(highResUrl)) {
      seenUrls.add(highResUrl);
      images.push(highResUrl);
      console.log(`  Slide ${i + 1}: ${highResUrl.substring(0, 80)}...`);
    }

    // Try to click next button
    const nextClicked = await page.evaluate(() => {
      const article = document.querySelector('article') ||
                     document.querySelector('[role="dialog"] article') ||
                     document.querySelector('main article');
      if (!article) return false;

      // Find next button within or near the article
      const buttons = Array.from(document.querySelectorAll('button'));

      // Try aria-label first
      for (const btn of buttons) {
        const aria = btn.getAttribute('aria-label') || '';
        if (/next|siguiente|próximo/i.test(aria)) {
          btn.click();
          return true;
        }
      }

      // Fallback: find right-positioned chevron button
      for (const btn of buttons) {
        const rect = btn.getBoundingClientRect();
        const svg = btn.querySelector('svg');
        if (svg && rect.width > 20 && rect.height > 20 && rect.left > window.innerWidth / 2) {
          btn.click();
          return true;
        }
      }

      return false;
    });

    if (!nextClicked) {
      console.log('No more carousel slides.');
      break;
    }

    // Wait for slide transition
    await page.waitForTimeout(1500);
  }

  return images;
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 900 }
    });

    const page = await context.newPage();

    for (const post of posts) {
      console.log(`\n=== Processing ${post.name} ===`);
      try {
        const images = await extractCarouselImages(page, post.url);
        console.log(`Found ${images.length} unique images.`);

        for (let i = 0; i < images.length; i++) {
          const fileName = `${post.name}-${String(i + 1).padStart(2, '0')}.jpg`;
          const filePath = path.join(outputDir, fileName);
          try {
            const size = await downloadImage(page, images[i], filePath);
            console.log(`  ✅ ${fileName} (${(size / 1024).toFixed(1)} KB)`);
          } catch (err) {
            console.log(`  ❌ Failed ${fileName}: ${err.message}`);
          }
        }
      } catch (err) {
        console.error(`Error processing ${post.name}:`, err.message);
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
