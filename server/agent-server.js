
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

    try {
        // Launch browser if not running. 
        // Note: User wants to SEE it. So headless: false.
        if (!browser || !browser.isConnected()) {
            browser = await chromium.launch({
                headless: false,
                slowMo: 50, // Slow down so user can see what's happening
                args: ['--start-maximized'] // Optional
            });
        }

        context = await browser.newContext();
        const page = await context.newPage();

        console.log('[Agent] Navigating to Elections BC...');
        await page.goto('https://mydistrict.elections.bc.ca/');

        // Defensive Waiting
        await page.waitForLoadState('networkidle');

        // Strategy 1: Look for common search inputs
        // The site likely has an input for address.
        // I'll look for input[placeholder*="address"] or input[type="text"]
        // Since I can't inspect, I'll try a generic reliable selector or assume it's the main input.

        // Attempting to identify input
        const inputSelectors = [
            'input[placeholder*="address" i]',
            'input[placeholder*="Address" i]',
            'input[aria-label*="address" i]',
            'input[type="search"]',
            '#address-input', // Common ID guess
            'input.search-input'
        ];

        let inputLocator = null;
        for (const selector of inputSelectors) {
            if (await page.locator(selector).count() > 0) {
                inputLocator = page.locator(selector).first();
                break;
            }
        }

        // Fallback: Just get the first text input if it seems like a search page
        if (!inputLocator) {
            inputLocator = page.locator('input[type="text"]').first();
        }

        if (!inputLocator) throw new Error('Could not find address search input');

        console.log('[Agent] Typing address...');
        await inputLocator.fill(address);
        // Wait for autocomplete? Usually 500ms
        await page.waitForTimeout(1000); // Wait for suggestions

        // Press Enter to search
        await inputLocator.press('Enter');

        // Wait for result
        // Text to look for: "Your electoral district for the 2024 Provincial Election will be:"
        console.log('[Agent] Waiting for results...');

        // We wait for the specific text header that indicates a result
        await page.waitForSelector('text=Your electoral district', { timeout: 10000 });

        // Now extract the riding name. It's usually near this text.
        // I'll grab the text content of the page or specific container and parse it.
        // Or finds the element with that text, and get the next sibling or look inside the container.

        // Let's get the text of the container that has this text
        // "Your electoral district for the 2024 Provincial Election will be:\n\nVancouver-Point Grey (VNP)"
        const resultLocator = page.locator('text=Your electoral district').first();

        // Ideally, the parent container has the full text.
        // Let's get the parent's text.
        // Or execute JS to find the district name which typically follows the label.

        const textContext = await resultLocator.evaluate(el => {
            // Traverse up to a container that holds both the label and the value
            const container = el.closest('div') || el.parentElement;
            return container ? container.innerText : el.innerText;
        });

        console.log(`[Agent] Raw Result Text: ${textContext}`);

        // Parsing logic
        // Expected: "Your electoral district ... will be:\n\n<Riding Name>"
        // We can assume the riding name is the line after the label, or just extract based on known riding names?
        // Let's split by newline and find the meaningful line.

        const lines = textContext.split('\n').map(l => l.trim()).filter(l => l);
        // Find the line index with "Your electoral district"
        const labelIndex = lines.findIndex(l => l.includes('Your electoral district'));

        let ridingName = '';
        if (labelIndex !== -1 && lines[labelIndex + 1]) {
            ridingName = lines[labelIndex + 1];
        } else {
            // Fallback: look for generic riding name pattern?
            // Or maybe it's in the same line?
            ridingName = textContext.replace(/Your electoral district.*will be:/is, '').trim();
        }

        // Clean up riding name (remove abbreviations like (VNP) if user wants pure name? USER said: "Your electoral district... Vancouver-Point Grey (VNP) and paste it into...")
        // So we keep the full string "Vancouver-Point Grey (VNP)"

        console.log(`[Agent] Extracted Riding: ${ridingName}`);

        await page.close(); // Close the page/tab
        // Context close?
        // Using reusing browser so we don't close browser.

        res.json({ riding: ridingName, success: true });

    } catch (error) {
        console.error('[Agent] Error:', error);
        if (context) await context.close();
        res.status(500).json({ error: error.message, success: false });
    }
});

app.listen(PORT, () => {
    console.log(`Agent Server running on http://localhost:${PORT}`);
    console.log('Ensure you have installed browsers: npx playwright install chromium');
});
