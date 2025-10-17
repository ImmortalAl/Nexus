const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  // Navigate to the site
  await page.goto('https://immortalnexus.netlify.app/', { waitUntil: 'domcontentloaded' });

  // Wait for page to load
  await page.waitForTimeout(5000);

  // Debug: Check what sections exist
  const sections = await page.evaluate(() => {
    const allSections = Array.from(document.querySelectorAll('section'));
    return allSections.map(s => ({
      className: s.className,
      id: s.id,
      text: s.textContent.substring(0, 100)
    }));
  });

  console.log('Found sections:', JSON.stringify(sections, null, 2));

  // Check if mindmap section exists
  const mindmapExists = await page.evaluate(() => {
    return !!document.querySelector('.mindmap-section');
  });

  console.log('Mindmap section exists:', mindmapExists);

  // Take full page screenshot for debugging
  await page.screenshot({ path: 'full-page-mobile.png', fullPage: true });
  console.log('Full page screenshot saved to full-page-mobile.png');

  await browser.close();
})();
