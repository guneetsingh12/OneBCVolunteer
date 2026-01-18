
import express from 'express';
import cors from 'cors';
import { chromium } from 'playwright';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let browser = null;

// Keep browser open? Or open new one each time?
// User said "opens a new browser search". Could mean per request.
// But for performance, maybe keep one instance?
// "browser based agent which opens up... and paste it"
// Let's open a context per request to be safe and separate, but keep the browser instance if possible for speed, or launch new if simpler.
// User said "opens a new browser", implying visibility.
// If I use a single browser instance and new pages, it's cleaner.
// But hitting "Extract" on multiple people might mean multiple tabs.
// Let's implement sequential processing in the UI, so we handle one at a time.

app.post('/extract-riding', async (req, res) => {
    const { address } = req.body;
    if (!address) {
        return res.status(400).json({ error: 'Address is required' });
    }

    console.log(`[Agent] Starting extraction for: ${address}`);
    let context = null;
    let page = null;

    try {
        // Launch browser if not running
        if (!browser || !browser.isConnected()) {
            console.log('[Agent] Launching browser...');
            browser = await chromium.launch({
                headless: false,
                slowMo: 100, // Slow down for visibility
                args: ['--start-maximized']
            });
        }

        context = await browser.newContext({
            viewport: { width: 1920, height: 1080 }
        });
        page = await context.newPage();

        console.log('[Agent] Navigating to Elections BC...');
        await page.goto('https://mydistrict.elections.bc.ca/', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        // Wait for the page to fully load (it's a React app)
        await page.waitForTimeout(2000);

        console.log('[Agent] Looking for address input...');

        // Try multiple strategies to find the input
        const inputSelectors = [
            'input[type="text"]',
            'input[type="search"]',
            'input[placeholder*="address" i]',
            'input[aria-label*="address" i]',
            '#address-input',
            'input.search-input',
            'input'
        ];

        let inputLocator = null;
        for (const selector of inputSelectors) {
            const count = await page.locator(selector).count();
            if (count > 0) {
                inputLocator = page.locator(selector).first();
                console.log(`[Agent] Found input using selector: ${selector}`);
                break;
            }
        }

        if (!inputLocator) {
            throw new Error('Could not find address search input on the page');
        }

        // Wait for input to be visible and enabled
        await inputLocator.waitFor({ state: 'visible', timeout: 10000 });

        console.log('[Agent] Typing address...');
        await inputLocator.click();
        await inputLocator.fill('');
        await inputLocator.type(address, { delay: 50 });

        // Wait for autocomplete suggestions to appear
        console.log('[Agent] Waiting for autocomplete suggestions...');
        await page.waitForTimeout(2000);

        console.log('[Agent] Looking for autocomplete suggestions...');

        // Try to find and click the first autocomplete suggestion
        const suggestionSelectors = [
            '[role="option"]',
            '[class*="suggestion"]',
            '[class*="autocomplete"] li',
            '[class*="dropdown"] li',
            'li[tabindex]',
            'div[role="option"]'
        ];

        let suggestionClicked = false;
        for (const selector of suggestionSelectors) {
            const count = await page.locator(selector).count();
            if (count > 0) {
                console.log(`[Agent] Found ${count} suggestions using selector: ${selector}`);
                // Click the first suggestion
                await page.locator(selector).first().click();
                suggestionClicked = true;
                console.log('[Agent] Clicked first suggestion');
                break;
            }
        }

        if (!suggestionClicked) {
            console.log('[Agent] No suggestions found, trying Enter key...');
            await inputLocator.press('Enter');
        }

        // Wait for navigation or results
        await page.waitForTimeout(3000);

        console.log('[Agent] Waiting for results...');

        // Try multiple selectors for the result
        const resultSelectors = [
            'text=Your electoral district',
            'text=electoral district',
            'text=Provincial Election',
            '[class*="result"]',
            '[class*="district"]'
        ];

        let resultFound = false;
        let resultLocator = null;

        for (const selector of resultSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 5000 });
                resultLocator = page.locator(selector).first();
                console.log(`[Agent] Found result using selector: ${selector}`);
                resultFound = true;
                break;
            } catch (e) {
                console.log(`[Agent] Selector ${selector} not found, trying next...`);
            }
        }

        if (!resultFound) {
            // Take a screenshot for debugging
            await page.screenshot({ path: '/tmp/bc-elections-debug.png' });
            throw new Error('Could not find results on the page. Screenshot saved to /tmp/bc-elections-debug.png');
        }

        // Extract the riding name
        console.log('[Agent] Extracting riding name...');

        const textContext = await resultLocator.evaluate(el => {
            // Get the parent container
            let container = el;
            for (let i = 0; i < 5; i++) {
                if (container.parentElement) {
                    container = container.parentElement;
                }
            }
            return container.innerText;
        });

        console.log(`[Agent] Raw Result Text: ${textContext}`);

        // Parse the riding name
        const lines = textContext.split('\n').map(l => l.trim()).filter(l => l);

        let ridingName = '';

        // Look for the line after "Your electoral district"
        const labelIndex = lines.findIndex(l => l.includes('Your electoral district') || l.includes('electoral district'));

        if (labelIndex !== -1 && lines[labelIndex + 1]) {
            ridingName = lines[labelIndex + 1];
        } else {
            // Fallback: Look for a line that looks like a riding name (contains parentheses with abbreviation)
            const ridingLine = lines.find(l => /\([A-Z]{3}\)/.test(l));
            if (ridingLine) {
                ridingName = ridingLine;
            } else {
                // Last resort: just get all text after the label
                ridingName = textContext.replace(/.*Your electoral district.*will be:?\s*/is, '').trim();
            }
        }

        console.log(`[Agent] Extracted Riding: ${ridingName}`);

        if (!ridingName) {
            throw new Error('Could not extract riding name from results');
        }

        await page.close();
        await context.close();

        res.json({ riding: ridingName, success: true });

    } catch (error) {
        console.error('[Agent] Error:', error.message);

        // Clean up
        if (page) {
            try {
                await page.close();
            } catch (e) {
                console.error('[Agent] Error closing page:', e.message);
            }
        }
        if (context) {
            try {
                await context.close();
            } catch (e) {
                console.error('[Agent] Error closing context:', e.message);
            }
        }

        res.status(500).json({ error: error.message, success: false });
    }
});

app.listen(PORT, () => {
    console.log(`Agent Server running on http://localhost:${PORT}`);
    console.log('Ensure you have installed browsers: npx playwright install chromium');
});
