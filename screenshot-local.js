const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 }, // iPhone X viewport
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  // Load the local HTML file
  const filePath = 'file://' + path.join(__dirname, 'front', 'index.html');
  console.log('Loading:', filePath);

  await page.goto(filePath, { waitUntil: 'networkidle' });

  // Wait for page to load
  await page.waitForTimeout(5000);

  // Scroll to the mindmap section
  await page.evaluate(() => {
    const section = document.querySelector('.mindmap-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  await page.waitForTimeout(2000);

  // Take full page screenshot first to see what we have
  await page.screenshot({ path: 'full-page-local.png', fullPage: true });
  console.log('Full page screenshot saved');

  // Try to capture the mindmap section specifically
  const mindmapSection = page.locator('.mindmap-section');
  const count = await mindmapSection.count();

  if (count > 0) {
    await mindmapSection.first().screenshot({ path: 'infinite-nexus-mobile.png' });
    console.log('Infinite Nexus section screenshot saved to infinite-nexus-mobile.png');
  } else {
    console.log('Mindmap section not found, check full-page-local.png');
  }

  await browser.close();
})();
