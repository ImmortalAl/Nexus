const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 12 Pro size
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  });

  const page = await context.newPage();

  // Navigate to the site
  await page.goto('https://immortalnexus.netlify.app', { waitUntil: 'networkidle' });

  // Wait for the Eternal Souls section to load
  await page.waitForSelector('.soul-highlight-card', { timeout: 10000 });

  // Scroll to the Eternal Souls section
  await page.evaluate(() => {
    const element = document.querySelector('.souls-highlight');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  // Wait a bit for smooth scroll
  await page.waitForTimeout(1000);

  // Take screenshot of the Eternal Souls section
  const element = await page.$('.souls-highlight');
  if (element) {
    await element.screenshot({
      path: 'screenshots/eternal-souls-current.png',
      type: 'png'
    });
    console.log('Screenshot saved to screenshots/eternal-souls-current.png');
  }

  await browser.close();
})();