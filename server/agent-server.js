
import express from 'express';
import cors from 'cors';
import { chromium } from 'playwright';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let browser = null;
let context = null;

// Initialize browser once
(async () => {
    try {
        console.log('[Agent] Launching browser instance...');
        browser = await chromium.launch({
            headless: false,
            slowMo: 100,
            args: ['--start-maximized']
        });
        context = await browser.newContext({
            viewport: { width: 1920, height: 1080 }
        });
        console.log('[Agent] Browser ready');
    } catch (e) {
        console.error('[Agent] Failed to launch browser:', e);
    }
})();

function cleanAddress(address) {
    if (!address) return '';

    // Normalize basic stuff
    let cleaned = address.trim();

    // Extract parts: "738 Broughton Street, Suite 2104, Vancouver"
    // Regex to capture: Street part, Unit part (optional), City (optional)

    // Common patterns:
    // 1. "Street, Suite Unit, City"
    // 2. "Street, Unit Unit, City"
    // 3. "Unit-Street, City"

    // Try to detect explicit "Suite/Unit/Apt" pattern at the end or middle
    const suiteRegex = /[, ]+(?:Suite|Apt|Unit|#)\s*([0-9]+[a-zA-Z]?)/i;
    const match = cleaned.match(suiteRegex);

    let unit = '';
    if (match) {
        unit = match[1];
        // Remove the suite part from the address string related to street
        cleaned = cleaned.replace(match[0], ''); // Remove ", Suite 2104"
    } else {
        // Check for "Unit-Street" format at start
        const prefixMatch = cleaned.match(/^([0-9]+)-([0-9]+)/);
        if (prefixMatch) {
            // It's already in Unit-Street format, keep as is or ensure it's clean
            return cleaned;
        }
    }

    // Remove City/Province if present (BC Assessment search is smarter with just street context sometimes, or needs specific format)
    // But usually "Street, City" works if simple.
    // Let's try to construct "Unit-StreetNumber StreetName"

    // Remove trailing city if it has a comma before it
    // cleaned = cleaned.replace(/,\s*[a-zA-Z\s]+$/, '');

    // If we found a unit, prepend it: "2104-738 Broughton Street"
    if (unit) {
        // Extract street number
        const streetNumMatch = cleaned.match(/^([0-9]+)\s+/);
        if (streetNumMatch) {
            const streetNum = streetNumMatch[1];
            const restOfStreet = cleaned.substring(streetNum.length).trim();
            // Remove any remaining commas
            const finalStreet = restOfStreet.replace(/,/g, '').trim();
            return `${unit}-${streetNum} ${finalStreet}`;
        }
    }

    // General cleanup of Suite/Apt if not caught above or at start
    cleaned = cleaned.replace(/^(?:#|Unit\s*|Apt\s*)\d+[a-zA-Z]?[\s-]?/i, '');

    return cleaned.trim();
}

app.post('/extract-riding', async (req, res) => {
    let { address } = req.body;
    if (!address) {
        return res.status(400).json({ error: 'Address is required' });
    }

    const cleanedAddress = cleanAddress(address);
    console.log(`[Agent] Original request: ${address} -> Cleaned: ${cleanedAddress}`);

    let page = null;

    try {
        // Ensure browser is running
        if (!browser || !browser.isConnected()) {
            console.log('[Agent] Browser disconnected, relaunching...');
            browser = await chromium.launch({ headless: false, slowMo: 100, args: ['--start-maximized'] });
            context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
        }

        page = await context.newPage();

        console.log('[Agent] Navigating to Elections BC...');
        // Use a shorter timeout or handle failures gracefully
        try {
            await page.goto('https://mydistrict.elections.bc.ca/', {
                waitUntil: 'networkidle',
                timeout: 15000
            });
        } catch (e) {
            console.log('[Agent] Navigation timeout/error, trying to proceed anyway if content loaded...');
        }

        // Wait for input
        const inputSelectors = [
            'input[placeholder*="address" i]',
            'input[aria-label*="address" i]',
            '#address-input',
            'input'
        ];

        let inputLocator = null;
        for (const selector of inputSelectors) {
            if (await page.locator(selector).count() > 0) {
                inputLocator = page.locator(selector).first();
                break;
            }
        }

        if (!inputLocator) throw new Error('Address input not found');

        await inputLocator.click();
        await inputLocator.fill('');
        await inputLocator.type(cleanedAddress, { delay: 50 });

        // Wait for suggestions
        await page.waitForTimeout(1500); // 1.5s wait for autocomplete

        // Select first suggestion or press enter
        const suggestions = page.locator('[role="option"], li[id*="option"], .pac-item');
        if (await suggestions.count() > 0) {
            console.log('[Agent] Clicking first suggestion...');
            await suggestions.first().click();
        } else {
            console.log('[Agent] No suggestions, pressing Enter...');
            await inputLocator.press('Enter');
        }

        // Wait for result
        // "Your electoral district" or similar text
        const resultSelector = 'text=electoral district';
        try {
            await page.waitForSelector(resultSelector, { timeout: 10000 });
        } catch (e) {
            console.log('[Agent] Result selector timed out, checking page text...');
        }

        // Extract all text from page to Regex match
        const pageText = await page.evaluate(() => document.body.innerText);

        let ridingName = '';
        // Look for pattern: "Your electoral district for the .* Provincial General Election will be:?\s*(.*)"
        // Or specific line extraction logic

        // Strategy 1: Look for "will be" followed by Riding Name (Often with (ABC) code)
        const match = pageText.match(/Your electoral district.*?will be:?\s*\n*\s*([A-Za-z\s-]+(?:\([A-Z]{3}\))?)/i);
        if (match && match[1]) {
            ridingName = match[1].trim();
        } else {
            // Strategy 2: Look for any line with (ABC) code which often denotes riding in BC context
            const ridingMatch = pageText.match(/([A-Za-z\s-]+)\s\([A-Z]{3}\)/);
            if (ridingMatch) {
                ridingName = ridingMatch[0].trim();
            }
        }

        console.log(`[Agent] Extracted: ${ridingName}`);

        if (ridingName) {
            res.json({ riding: ridingName, success: true });
        } else {
            throw new Error('Could not parse riding name from page content');
        }

    } catch (error) {
        console.error('[Agent] Error:', error.message);
        res.status(500).json({ error: error.message, success: false });
    } finally {
        if (page) await page.close();
    }
});

app.post('/extract-property', async (req, res) => {
    let { address } = req.body;
    if (!address) {
        return res.status(400).json({ error: 'Address is required' });
    }

    const cleanedAddress = cleanAddress(address);
    console.log(`[Agent-Prop] Starting property extraction for: ${cleanedAddress}`);

    let page = null;

    try {
        if (!browser || !browser.isConnected()) {
            console.log('[Agent-Prop] Relaunching browser...');
            browser = await chromium.launch({ headless: false, slowMo: 100, args: ['--start-maximized'] });
            context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
        }
        page = await context.newPage();

        console.log('[Agent-Prop] Navigating to BC Assessment...');
        await page.goto('https://www.bcassessment.ca/', { waitUntil: 'domcontentloaded' });

        // Handle Disclaimer
        try {
            const agree = page.locator('#btnAgree');
            if (await agree.isVisible({ timeout: 3000 })) {
                await agree.click();
            }
        } catch (e) { }

        const searchInput = page.locator('#rsbSearch');
        await searchInput.waitFor({ state: 'visible', timeout: 10000 });

        await searchInput.click();
        await searchInput.fill(cleanedAddress);

        // Wait for suggestions
        await page.waitForTimeout(1500);
        const suggestion = page.locator('.ui-menu-item').first();

        if (await suggestion.count() > 0 && await suggestion.isVisible()) {
            console.log('[Agent-Prop] Clicking suggestion...');
            await suggestion.click();
        } else {
            console.log('[Agent-Prop] No suggestion, pressing Enter...');
            await searchInput.press('Enter');
        }

        // Wait for navigation or content update.
        // We know from testing that waitForUrl might timeout but content appears.
        // We also know regex on body works.

        let value = null;
        // Try regex polling for 10 seconds
        console.log('[Agent-Prop] Polling for value...');
        for (let i = 0; i < 10; i++) {
            await page.waitForTimeout(1000);
            const text = await page.innerText('body');
            // Look for "Total value" followed by price, OR just large price format if we are on detail page
            // The test script found "$953,000" via regex.
            // We should look for specific context if possible to avoid random numbers.
            // "Total value $953,000" or similar.
            // Let's use the ID #lblTotalAssessedValue if available, else regex.

            if (await page.locator('#lblTotalAssessedValue').isVisible()) {
                value = await page.innerText('#lblTotalAssessedValue');
                break;
            }

            // Fallback regex
            const match = text.match(/\$[\d,]{3,}/);
            if (match) {
                // Check if it looks like a property value (usually > $10,000)
                // This is a loose heuristic but better than nothing.
                value = match[0];
                break;
            }
        }

        if (value) {
            console.log(`[Agent-Prop] Extracted Value: ${value}`);
            res.json({ value: value, success: true });
        } else {
            throw new Error('Property value not found on page');
        }

    } catch (error) {
        console.error('[Agent-Prop] Error:', error.message);
        if (error.message.includes('Property value not found') || error.message.includes('not found')) {
            return res.status(404).json({ error: error.message, success: false });
        }
        res.status(500).json({ error: error.message, success: false });
    } finally {
        if (page) await page.close();
    }
});


app.listen(PORT, () => {
    console.log(`Agent Server running on http://localhost:${PORT}`);
    console.log('Ensure you have installed browsers: npx playwright install chromium');
});
