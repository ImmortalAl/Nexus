// Design Analysis Tests for Immortal Nexus
// Analyzes UI/UX issues across different pages and viewports

const { test, expect } = require('@playwright/test');

// Pages to analyze (local paths matching front/ directory structure)
const pagesToTest = [
  { name: 'Home', path: '/index.html' },
  { name: 'Lander', path: '/lander.html' },
  { name: 'Infinite Nexus (Mindmap)', path: '/pages/mindmap.html' },
  { name: 'Soul Scrolls', path: '/souls/index.html' },
  { name: 'Message Board', path: '/pages/messageboard.html' },
  { name: 'Blog', path: '/pages/blog.html' },
];

test.describe('Visual Consistency Analysis', () => {
  for (const page of pagesToTest) {
    test(`${page.name} - Screenshot capture`, async ({ page: browserPage }) => {
      await browserPage.goto(page.path);
      await browserPage.waitForLoadState('networkidle');

      // Take full page screenshot
      await browserPage.screenshot({
        path: `./test-results/screenshots/${page.name.replace(/\s+/g, '-').toLowerCase()}.png`,
        fullPage: true
      });
    });
  }
});

test.describe('Layout and Overflow Issues', () => {
  for (const page of pagesToTest) {
    test(`${page.name} - Check for horizontal overflow`, async ({ page: browserPage }) => {
      await browserPage.goto(page.path);
      await browserPage.waitForLoadState('networkidle');

      // Check if page has horizontal scrollbar (indicates overflow issue)
      const hasHorizontalScroll = await browserPage.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      if (hasHorizontalScroll) {
        console.log(`WARNING: ${page.name} has horizontal overflow`);
      }

      // Find elements causing overflow
      const overflowingElements = await browserPage.evaluate(() => {
        const docWidth = document.documentElement.clientWidth;
        const results = [];

        document.querySelectorAll('*').forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.right > docWidth + 5) { // 5px tolerance
            results.push({
              tag: el.tagName,
              id: el.id,
              class: el.className,
              overflow: Math.round(rect.right - docWidth)
            });
          }
        });

        return results.slice(0, 10); // Top 10 offenders
      });

      if (overflowingElements.length > 0) {
        console.log(`${page.name} - Overflowing elements:`, overflowingElements);
      }
    });
  }
});

test.describe('Typography and Readability', () => {
  for (const page of pagesToTest) {
    test(`${page.name} - Check text contrast and sizing`, async ({ page: browserPage }) => {
      await browserPage.goto(page.path);
      await browserPage.waitForLoadState('networkidle');

      // Check for very small text
      const smallTextElements = await browserPage.evaluate(() => {
        const results = [];
        document.querySelectorAll('*').forEach(el => {
          const style = window.getComputedStyle(el);
          const fontSize = parseFloat(style.fontSize);
          const text = el.innerText?.trim();

          if (text && text.length > 0 && fontSize < 12) {
            results.push({
              text: text.substring(0, 50),
              fontSize: fontSize,
              tag: el.tagName
            });
          }
        });
        return results.slice(0, 10);
      });

      if (smallTextElements.length > 0) {
        console.log(`${page.name} - Small text found:`, smallTextElements);
      }
    });
  }
});

test.describe('Interactive Element Issues', () => {
  for (const page of pagesToTest) {
    test(`${page.name} - Check button and link accessibility`, async ({ page: browserPage }) => {
      await browserPage.goto(page.path);
      await browserPage.waitForLoadState('networkidle');

      // Find buttons/links that might be too small for touch
      const smallTouchTargets = await browserPage.evaluate(() => {
        const results = [];
        const minTouchSize = 44; // Apple's recommended minimum

        document.querySelectorAll('button, a, [role="button"], input[type="submit"]').forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            if (rect.width < minTouchSize || rect.height < minTouchSize) {
              results.push({
                tag: el.tagName,
                text: el.innerText?.substring(0, 30) || el.getAttribute('aria-label'),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
              });
            }
          }
        });
        return results.slice(0, 15);
      });

      if (smallTouchTargets.length > 0) {
        console.log(`${page.name} - Small touch targets:`, smallTouchTargets);
      }

      // Check for missing aria-labels on icon-only buttons
      const missingAriaLabels = await browserPage.evaluate(() => {
        const results = [];
        document.querySelectorAll('button, a[role="button"]').forEach(el => {
          const hasText = el.innerText?.trim().length > 0;
          const hasAriaLabel = el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby');
          const hasTitle = el.hasAttribute('title');

          if (!hasText && !hasAriaLabel && !hasTitle) {
            results.push({
              tag: el.tagName,
              id: el.id,
              class: el.className?.substring(0, 50)
            });
          }
        });
        return results.slice(0, 10);
      });

      if (missingAriaLabels.length > 0) {
        console.log(`${page.name} - Buttons missing accessibility labels:`, missingAriaLabels);
      }
    });
  }
});

test.describe('Modal and Overlay Issues', () => {
  test('Mindmap - Test edit relationship modal', async ({ page }) => {
    await page.goto('/pages/mindmap.html');
    await page.waitForLoadState('networkidle');

    // Wait for mindmap to load
    await page.waitForSelector('#cy', { timeout: 10000 });

    // Check if modal HTML exists
    const modalExists = await page.locator('#editRelationshipModal').count() > 0;
    console.log('Edit Relationship Modal exists:', modalExists);

    // Check modal initial state
    if (modalExists) {
      const modalVisible = await page.locator('#editRelationshipModal').isVisible();
      console.log('Modal initially visible:', modalVisible);
    }
  });

  test('Mindmap - Test citation modal', async ({ page }) => {
    await page.goto('/pages/mindmap.html');
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('#cy', { timeout: 10000 });

    const citationModalExists = await page.locator('#citationModal').count() > 0;
    console.log('Citation Modal exists:', citationModalExists);
  });
});

test.describe('Z-Index and Layering Issues', () => {
  for (const page of pagesToTest) {
    test(`${page.name} - Check for z-index conflicts`, async ({ page: browserPage }) => {
      await browserPage.goto(page.path);
      await browserPage.waitForLoadState('networkidle');

      // Find elements with high z-index
      const highZIndexElements = await browserPage.evaluate(() => {
        const results = [];
        document.querySelectorAll('*').forEach(el => {
          const style = window.getComputedStyle(el);
          const zIndex = parseInt(style.zIndex);

          if (!isNaN(zIndex) && zIndex > 100) {
            results.push({
              tag: el.tagName,
              id: el.id,
              class: el.className?.substring(0, 30),
              zIndex: zIndex
            });
          }
        });
        return results.sort((a, b) => b.zIndex - a.zIndex).slice(0, 15);
      });

      console.log(`${page.name} - High z-index elements:`, highZIndexElements);
    });
  }
});

test.describe('Notification System', () => {
  test('Check notification icon presence', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for notification container
    const notificationContainer = await page.locator('#notificationIconContainer').count();
    console.log('Notification container exists:', notificationContainer > 0);

    // Take screenshot of header area
    await page.screenshot({
      path: './test-results/screenshots/notification-header.png',
      clip: { x: 0, y: 0, width: 1920, height: 100 }
    });
  });

  test('Mindmap - Check notification icon', async ({ page }) => {
    await page.goto('/pages/mindmap.html');
    await page.waitForLoadState('networkidle');

    const notificationContainer = await page.locator('#notificationIconContainer').count();
    console.log('Mindmap - Notification container exists:', notificationContainer > 0);
  });
});

test.describe('Console Errors', () => {
  for (const page of pagesToTest) {
    test(`${page.name} - Check for JavaScript errors`, async ({ page: browserPage }) => {
      const errors = [];
      const warnings = [];

      browserPage.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        } else if (msg.type() === 'warning') {
          warnings.push(msg.text());
        }
      });

      browserPage.on('pageerror', err => {
        errors.push(err.message);
      });

      await browserPage.goto(page.path);
      await browserPage.waitForLoadState('networkidle');

      // Wait a bit for any async errors
      await browserPage.waitForTimeout(2000);

      if (errors.length > 0) {
        console.log(`${page.name} - JavaScript errors:`, errors);
      }

      if (warnings.length > 0) {
        console.log(`${page.name} - Warnings:`, warnings.slice(0, 5));
      }
    });
  }
});

test.describe('Performance Metrics', () => {
  for (const page of pagesToTest) {
    test(`${page.name} - Measure load performance`, async ({ page: browserPage }) => {
      await browserPage.goto(page.path);

      const metrics = await browserPage.evaluate(() => {
        const timing = performance.timing;
        return {
          domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
          loadComplete: timing.loadEventEnd - timing.navigationStart,
          firstPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-paint')?.startTime,
          firstContentfulPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint')?.startTime
        };
      });

      console.log(`${page.name} - Performance:`, metrics);
    });
  }
});
