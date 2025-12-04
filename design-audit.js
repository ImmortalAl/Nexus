const { chromium } = require('playwright');
const fs = require('fs');

const SITE_URL = 'http://localhost:8080';

const PAGES = [
  { name: 'homepage', path: '/' },
  { name: 'lander', path: '/lander.html' },
  { name: 'messageboard', path: '/pages/messageboard.html' },
  { name: 'news', path: '/pages/news.html' },
  { name: 'soul-scrolls', path: '/pages/soul-scrolls.html' },
  { name: 'blog', path: '/pages/blog.html' },
  { name: 'manifesto', path: '/pages/manifesto.html' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1920, height: 1080, scale: 1 },
  { name: 'laptop', width: 1366, height: 768, scale: 1 },
  { name: 'tablet', width: 768, height: 1024, scale: 1 },
  { name: 'mobile', width: 375, height: 812, scale: 2 },
];

async function checkDesignIssues(page) {
  return await page.evaluate(() => {
    const issues = [];

    // Check for horizontal overflow (causes horizontal scroll)
    const bodyWidth = document.body.scrollWidth;
    const viewportWidth = window.innerWidth;
    if (bodyWidth > viewportWidth) {
      issues.push({
        type: 'overflow',
        severity: 'high',
        message: `Horizontal overflow detected: content is ${bodyWidth - viewportWidth}px wider than viewport`,
        element: 'body'
      });
    }

    // Find elements overflowing viewport
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.right > viewportWidth + 10) {
        const tag = el.tagName.toLowerCase();
        const cls = el.className ? `.${el.className.split(' ').join('.')}` : '';
        const id = el.id ? `#${el.id}` : '';
        issues.push({
          type: 'element-overflow',
          severity: 'medium',
          message: `Element overflows viewport by ${Math.round(rect.right - viewportWidth)}px`,
          element: `${tag}${id}${cls}`.slice(0, 100)
        });
      }
    });

    // Check for overlapping elements in critical areas
    const header = document.querySelector('header');
    const nav = document.querySelector('nav.main-nav, .main-nav');
    if (header && nav) {
      const headerRect = header.getBoundingClientRect();
      const navRect = nav.getBoundingClientRect();
      // Check if nav overlaps awkwardly with header content
      const headerTitle = header.querySelector('h1, .site-title');
      if (headerTitle) {
        const titleRect = headerTitle.getBoundingClientRect();
        if (navRect.top < titleRect.bottom && navRect.bottom > titleRect.top) {
          if (navRect.left < titleRect.right && navRect.right > titleRect.left) {
            issues.push({
              type: 'overlap',
              severity: 'high',
              message: 'Navigation overlaps with header title',
              element: 'header nav'
            });
          }
        }
      }
    }

    // Check for text truncation/overflow issues
    const textElements = document.querySelectorAll('h1, h2, h3, p, span, a, button');
    textElements.forEach(el => {
      if (el.scrollWidth > el.clientWidth + 5 && !el.style.overflow) {
        const styles = window.getComputedStyle(el);
        if (styles.overflow !== 'hidden' && styles.textOverflow !== 'ellipsis') {
          issues.push({
            type: 'text-overflow',
            severity: 'low',
            message: `Text may be truncated or overflowing`,
            element: `${el.tagName.toLowerCase()}: "${el.textContent.slice(0, 30)}..."`
          });
        }
      }
    });

    // Check for tiny or unreadable text
    textElements.forEach(el => {
      const styles = window.getComputedStyle(el);
      const fontSize = parseFloat(styles.fontSize);
      if (fontSize < 12 && el.textContent.trim().length > 0) {
        issues.push({
          type: 'small-text',
          severity: 'medium',
          message: `Text size ${fontSize}px may be too small for readability`,
          element: `${el.tagName.toLowerCase()}: "${el.textContent.slice(0, 30)}..."`
        });
      }
    });

    // Check for touch target sizes on mobile
    if (window.innerWidth < 768) {
      const clickables = document.querySelectorAll('a, button, input, select, [onclick]');
      clickables.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width < 44 || rect.height < 44) {
          if (rect.width > 0 && rect.height > 0) {
            issues.push({
              type: 'touch-target',
              severity: 'medium',
              message: `Touch target (${Math.round(rect.width)}x${Math.round(rect.height)}px) may be too small (min 44x44px)`,
              element: `${el.tagName.toLowerCase()}: "${(el.textContent || el.value || '').slice(0, 20)}"`
            });
          }
        }
      });
    }

    // Check for z-index conflicts in modals and overlays
    const modals = document.querySelectorAll('.modal, [class*="modal"], .overlay, [class*="overlay"]');
    const floatingElements = document.querySelectorAll('.floating, [style*="position: fixed"]');

    // Check for poor contrast (basic check)
    const checkContrast = (el) => {
      const styles = window.getComputedStyle(el);
      const bgColor = styles.backgroundColor;
      const color = styles.color;
      // Basic visibility check
      if (color === bgColor && el.textContent.trim()) {
        return true;
      }
      return false;
    };

    textElements.forEach(el => {
      if (checkContrast(el) && el.textContent.trim().length > 0) {
        issues.push({
          type: 'contrast',
          severity: 'high',
          message: 'Text may have poor contrast with background',
          element: `${el.tagName.toLowerCase()}: "${el.textContent.slice(0, 30)}..."`
        });
      }
    });

    // Check for missing alt text on images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.alt && !img.getAttribute('aria-label')) {
        issues.push({
          type: 'accessibility',
          severity: 'medium',
          message: 'Image missing alt text',
          element: `img[src="${img.src.slice(0, 50)}..."]`
        });
      }
    });

    // Check for broken flex layouts
    const flexContainers = document.querySelectorAll('[style*="flex"], .flex, [class*="flex"]');
    flexContainers.forEach(container => {
      const rect = container.getBoundingClientRect();
      if (rect.height === 0 && container.children.length > 0) {
        issues.push({
          type: 'layout',
          severity: 'high',
          message: 'Flex container has zero height despite having children',
          element: container.className || container.id || container.tagName
        });
      }
    });

    return issues;
  });
}

async function runAudit() {
  console.log('Starting Design Audit...\n');

  const browser = await chromium.launch();
  const allIssues = [];

  // Create output directory
  const outputDir = 'design-audit-results';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  for (const pageConfig of PAGES) {
    console.log(`\n=== Auditing: ${pageConfig.name} ===`);

    for (const viewport of VIEWPORTS) {
      console.log(`  Viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);

      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: viewport.scale,
      });

      const page = await context.newPage();

      try {
        await page.goto(`${SITE_URL}${pageConfig.path}`, {
          waitUntil: 'networkidle',
          timeout: 30000
        });

        // Wait for any animations/transitions
        await page.waitForTimeout(1500);

        // Take full page screenshot
        const screenshotPath = `${outputDir}/${pageConfig.name}-${viewport.name}.png`;
        await page.screenshot({
          path: screenshotPath,
          fullPage: true
        });
        console.log(`    Screenshot: ${screenshotPath}`);

        // Run design checks
        const issues = await checkDesignIssues(page);

        if (issues.length > 0) {
          console.log(`    Found ${issues.length} issues:`);
          issues.forEach(issue => {
            allIssues.push({
              page: pageConfig.name,
              viewport: viewport.name,
              ...issue
            });
            console.log(`      [${issue.severity}] ${issue.type}: ${issue.message}`);
          });
        } else {
          console.log(`    No issues found`);
        }

      } catch (error) {
        console.log(`    Error: ${error.message}`);
        allIssues.push({
          page: pageConfig.name,
          viewport: viewport.name,
          type: 'error',
          severity: 'high',
          message: error.message,
          element: 'page'
        });
      }

      await context.close();
    }
  }

  await browser.close();

  // Generate report
  console.log('\n\n========================================');
  console.log('DESIGN AUDIT SUMMARY');
  console.log('========================================\n');

  // Group by severity
  const highIssues = allIssues.filter(i => i.severity === 'high');
  const mediumIssues = allIssues.filter(i => i.severity === 'medium');
  const lowIssues = allIssues.filter(i => i.severity === 'low');

  console.log(`HIGH severity issues: ${highIssues.length}`);
  console.log(`MEDIUM severity issues: ${mediumIssues.length}`);
  console.log(`LOW severity issues: ${lowIssues.length}`);
  console.log(`TOTAL: ${allIssues.length}\n`);

  // Group by type
  const issuesByType = {};
  allIssues.forEach(issue => {
    if (!issuesByType[issue.type]) {
      issuesByType[issue.type] = [];
    }
    issuesByType[issue.type].push(issue);
  });

  console.log('Issues by type:');
  Object.entries(issuesByType).forEach(([type, issues]) => {
    console.log(`  ${type}: ${issues.length}`);
  });

  // Save detailed report
  const reportPath = `${outputDir}/audit-report.json`;
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      high: highIssues.length,
      medium: mediumIssues.length,
      low: lowIssues.length,
      total: allIssues.length
    },
    issuesByType: Object.entries(issuesByType).map(([type, issues]) => ({
      type,
      count: issues.length
    })),
    issues: allIssues
  }, null, 2));

  console.log(`\nDetailed report saved to: ${reportPath}`);
  console.log(`Screenshots saved in: ${outputDir}/`);

  // Return high priority issues for immediate fix
  if (highIssues.length > 0) {
    console.log('\n\n========================================');
    console.log('HIGH PRIORITY ISSUES TO FIX:');
    console.log('========================================\n');

    // Dedupe similar issues
    const uniqueHighIssues = [];
    const seen = new Set();
    highIssues.forEach(issue => {
      const key = `${issue.type}-${issue.message}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueHighIssues.push(issue);
      }
    });

    uniqueHighIssues.forEach((issue, i) => {
      console.log(`${i + 1}. [${issue.page}/${issue.viewport}] ${issue.type}`);
      console.log(`   ${issue.message}`);
      console.log(`   Element: ${issue.element}\n`);
    });
  }

  return { allIssues, highIssues, mediumIssues, lowIssues };
}

runAudit().catch(console.error);
