const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 }, // iPhone X viewport
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  });

  const page = await context.newPage();

  // Navigate to the page - use the correct Netlify URL
  await page.goto('file:///home/immortalal/sites/Nexus/front/index.html', { waitUntil: 'load' });

  // Wait for content to load
  await page.waitForTimeout(5000);

  // Scroll to the Infinite Nexus section
  await page.evaluate(() => {
    const section = document.getElementById('mindmap');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  // Wait for scroll animation
  await page.waitForTimeout(1000);

  // Take a full page screenshot
  await page.screenshot({ path: 'infinite-nexus-mobile.png', fullPage: false });

  console.log('Screenshot saved as infinite-nexus-mobile.png');

  await browser.close();
})();
