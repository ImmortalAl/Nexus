const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 }, // iPhone X viewport
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  // Navigate to the site
  await page.goto('https://immortalnexus.netlify.app/', { waitUntil: 'domcontentloaded' });

  // Wait for page to load and scroll to Infinite Nexus section
  await page.waitForTimeout(3000);

  // Scroll to the mindmap section
  await page.evaluate(() => {
    const section = document.querySelector('.mindmap-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  // Wait a bit more for any dynamic content
  await page.waitForTimeout(2000);

  // Find the Infinite Nexus highlight section
  const infiniteNexusSection = await page.locator('.mindmap-section').first();

  // Take screenshot of just that section
  await infiniteNexusSection.screenshot({ path: 'infinite-nexus-mobile.png' });

  console.log('Screenshot saved to infinite-nexus-mobile.png');

  await browser.close();
})();
