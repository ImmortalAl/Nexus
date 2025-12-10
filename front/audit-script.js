const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://immortal.nexus';
const SCREENSHOT_DIR = './audit-screenshots';

// Pages to audit
const PAGES = [
    { name: 'home', path: '/' },
    { name: 'lander', path: '/lander.html' },
    { name: 'messageboard', path: '/pages/messageboard.html' },
    { name: 'news', path: '/pages/news.html' },
    { name: 'blog', path: '/pages/blog.html' },
    { name: 'souls', path: '/souls/' },
    { name: 'links', path: '/pages/links.html' },
    { name: 'manifesto', path: '/pages/manifesto.html' },
    { name: 'celestial-commons', path: '/pages/celestial-commons.html' },
    { name: 'mindmap', path: '/pages/mindmap.html' },
    { name: 'scrolls-archive', path: '/pages/scrolls-archive.html' },
];

async function runAudit() {
    // Ensure screenshot directory exists
    if (!fs.existsSync(SCREENSHOT_DIR)) {
        fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }

    const browser = await chromium.launch({ headless: true });
    const results = {
        timestamp: new Date().toISOString(),
        pages: [],
        issues: [],
        summary: {}
    };

    console.log('Starting Immortal Nexus Site Audit...\n');

    for (const pageInfo of PAGES) {
        console.log(`\n=== Auditing: ${pageInfo.name} ===`);
        const context = await browser.newContext({
            viewport: { width: 1920, height: 1080 }
        });
        const page = await context.newPage();

        const pageResult = {
            name: pageInfo.name,
            url: BASE_URL + pageInfo.path,
            status: null,
            loadTime: null,
            errors: [],
            warnings: [],
            consoleMessages: [],
            networkErrors: [],
            missingImages: [],
            brokenLinks: [],
            accessibility: []
        };

        // Collect console messages
        page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            if (type === 'error') {
                pageResult.errors.push(text);
            } else if (type === 'warning') {
                pageResult.warnings.push(text);
            }
            pageResult.consoleMessages.push({ type, text });
        });

        // Collect network errors
        page.on('requestfailed', request => {
            pageResult.networkErrors.push({
                url: request.url(),
                failure: request.failure()?.errorText
            });
        });

        try {
            const startTime = Date.now();
            const response = await page.goto(BASE_URL + pageInfo.path, {
                waitUntil: 'networkidle',
                timeout: 30000
            });
            pageResult.loadTime = Date.now() - startTime;
            pageResult.status = response?.status() || 'unknown';

            console.log(`  Status: ${pageResult.status}`);
            console.log(`  Load time: ${pageResult.loadTime}ms`);

            // Wait for any animations to settle
            await page.waitForTimeout(1000);

            // Take desktop screenshot
            await page.screenshot({
                path: path.join(SCREENSHOT_DIR, `${pageInfo.name}-desktop.png`),
                fullPage: true
            });
            console.log(`  Screenshot saved: ${pageInfo.name}-desktop.png`);

            // Check for broken images
            const images = await page.$$eval('img', imgs =>
                imgs.map(img => ({
                    src: img.src,
                    alt: img.alt,
                    naturalWidth: img.naturalWidth,
                    complete: img.complete
                }))
            );
            pageResult.missingImages = images.filter(img => img.complete && img.naturalWidth === 0);

            // Check for empty elements that might indicate missing content
            const emptyElements = await page.$$eval('[data-content], .content-placeholder', els =>
                els.filter(el => !el.textContent.trim()).map(el => el.className)
            );

            // Check interactive elements
            const buttons = await page.$$('button, .btn, [role="button"]');
            console.log(`  Found ${buttons.length} buttons/interactive elements`);

            // Check for visible error messages on page
            const errorMessages = await page.$$eval('.error, .error-message, .alert-danger, [class*="error"]', els =>
                els.filter(el => el.offsetParent !== null).map(el => el.textContent.trim())
            );
            if (errorMessages.length > 0) {
                pageResult.warnings.push(...errorMessages);
            }

            // Check forms
            const forms = await page.$$('form');
            console.log(`  Found ${forms.length} forms`);

            // Mobile viewport screenshot
            await page.setViewportSize({ width: 375, height: 812 });
            await page.waitForTimeout(500);
            await page.screenshot({
                path: path.join(SCREENSHOT_DIR, `${pageInfo.name}-mobile.png`),
                fullPage: true
            });
            console.log(`  Screenshot saved: ${pageInfo.name}-mobile.png`);

            // Check for horizontal scroll (layout issue)
            const hasHorizontalScroll = await page.evaluate(() => {
                return document.documentElement.scrollWidth > document.documentElement.clientWidth;
            });
            if (hasHorizontalScroll) {
                pageResult.warnings.push('Page has horizontal scroll on mobile - possible layout issue');
            }

        } catch (error) {
            pageResult.errors.push(`Failed to load page: ${error.message}`);
            console.log(`  ERROR: ${error.message}`);
        }

        // Log issues found
        if (pageResult.errors.length > 0) {
            console.log(`  Console Errors: ${pageResult.errors.length}`);
        }
        if (pageResult.networkErrors.length > 0) {
            console.log(`  Network Errors: ${pageResult.networkErrors.length}`);
        }
        if (pageResult.missingImages.length > 0) {
            console.log(`  Missing Images: ${pageResult.missingImages.length}`);
        }

        results.pages.push(pageResult);
        await context.close();
    }

    // Generate summary
    results.summary = {
        totalPages: results.pages.length,
        pagesWithErrors: results.pages.filter(p => p.errors.length > 0).length,
        pagesWithNetworkErrors: results.pages.filter(p => p.networkErrors.length > 0).length,
        averageLoadTime: Math.round(
            results.pages.reduce((sum, p) => sum + (p.loadTime || 0), 0) / results.pages.length
        )
    };

    await browser.close();

    // Save results
    fs.writeFileSync(
        path.join(SCREENSHOT_DIR, 'audit-results.json'),
        JSON.stringify(results, null, 2)
    );

    console.log('\n\n=== AUDIT SUMMARY ===');
    console.log(`Total Pages: ${results.summary.totalPages}`);
    console.log(`Pages with Errors: ${results.summary.pagesWithErrors}`);
    console.log(`Pages with Network Errors: ${results.summary.pagesWithNetworkErrors}`);
    console.log(`Average Load Time: ${results.summary.averageLoadTime}ms`);
    console.log(`\nResults saved to: ${SCREENSHOT_DIR}/audit-results.json`);

    return results;
}

runAudit().catch(console.error);
