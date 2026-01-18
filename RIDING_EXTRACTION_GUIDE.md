# Electoral Riding Extraction Guide

## Overview
This system uses browser automation (Playwright) to automatically extract electoral district information from the BC Elections website for volunteers in your database.

## How It Works

1. **Upload CSV**: Import your volunteer data via the "Import CSV" button in the Volunteers section
2. **Extract Riding**: Click the "Extract Riding" button to automatically fetch electoral district information
3. **Automated Process**: The agent will:
   - Open a browser window (visible to you)
   - Navigate to https://mydistrict.elections.bc.ca/
   - Enter each volunteer's address
   - Extract the electoral district name (e.g., "Vancouver-Point Grey (VNP)")
   - Update the database with the riding information

## Setup Instructions

### 1. Install Playwright Browsers (One-time setup)
```bash
npx playwright install chromium
```

### 2. Start the Application

**Option A: Start Everything Together (Recommended)**
```bash
npm run dev
```
This starts both the frontend (Vite) and the agent server simultaneously.

**Option B: Start Separately**
```bash
# Terminal 1: Start the frontend
npm run dev:frontend

# Terminal 2: Start the agent server
npm run start:agent
```

### 3. Verify Agent is Running
The agent server should be running on `http://localhost:3001`. You should see:
```
Agent Server running on http://localhost:3001
Ensure you have installed browsers: npx playwright install chromium
```

## Using the Feature

### Extracting Ridings for Selected Volunteers
1. Go to the Volunteers section
2. Select volunteers by checking the checkboxes next to their names
3. Click the "Extract Riding" button
4. Watch as the browser automatically processes each address
5. The riding information will be updated in the table

### Extracting Ridings for All Unconfirmed Volunteers
1. Don't select any volunteers
2. Click the "Extract Riding" button
3. The system will automatically process all volunteers who:
   - Don't have a riding assigned, OR
   - Have `riding_confirmed` set to false

## What to Expect

### During Extraction
- A browser window will open (you can see what's happening)
- The agent will navigate to the BC Elections website
- It will type each address and submit the search
- The process is slowed down (100ms delay) so you can see each step
- Each volunteer takes approximately 10-15 seconds to process

### After Extraction
- The `riding` field will be populated with the electoral district name
- The `riding_confirmed` field will be set to `true`
- The `updated_at` timestamp will be updated
- You'll see a toast notification with the results

## Troubleshooting

### Error: "Make sure the agent server is running"
**Solution**: 
```bash
# Check if port 3001 is in use
lsof -i :3001

# If nothing is running, start the agent
npm run start:agent
```

### Error: "Could not find address search input"
**Cause**: The BC Elections website structure may have changed
**Solution**: Check the screenshot saved at `/tmp/bc-elections-debug.png` to see what the page looks like

### Browser doesn't open
**Solution**: 
```bash
# Reinstall Playwright browsers
npx playwright install chromium
```

### Extraction times out
**Possible causes**:
- Slow internet connection
- BC Elections website is down
- Address format is not recognized by the website

**Solution**: 
- Ensure addresses are in the format: "Street Address, City"
- Example: "1234 Main St, Vancouver"

## CSV Import Format

Your CSV should include these columns:
- `street_address`: Full street address
- `city`: City name
- `first_name`: Volunteer's first name
- `last_name`: Volunteer's last name
- `email`: Email address
- `phone`: Phone number
- Other optional fields as defined in your schema

## Technical Details

### Agent Server
- **Location**: `/server/agent-server.js`
- **Port**: 3001
- **Technology**: Express.js + Playwright
- **Browser**: Chromium (headless: false for visibility)

### API Endpoint
```
POST http://localhost:3001/extract-riding
Content-Type: application/json

{
  "address": "1234 Main St, Vancouver"
}

Response:
{
  "riding": "Vancouver-Point Grey (VNP)",
  "success": true
}
```

### Frontend Integration
- **Component**: `/src/components/volunteers/VolunteerTable.tsx`
- **Function**: `handleExtractRidings()`
- **Line**: 62-136

## Performance

- **Single volunteer**: ~10-15 seconds
- **10 volunteers**: ~2-3 minutes
- **100 volunteers**: ~15-25 minutes

The process is sequential (one at a time) to avoid overwhelming the BC Elections website and to ensure accuracy.

## Future Improvements

Potential enhancements:
1. Add batch processing with configurable delays
2. Implement retry logic for failed extractions
3. Add progress bar showing current volunteer being processed
4. Cache results to avoid re-processing same addresses
5. Add manual override option for incorrect extractions
6. Support for other provinces/electoral systems

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check the agent server logs in the terminal
3. Look for debug screenshots in `/tmp/bc-elections-debug.png`
4. Verify your internet connection
5. Ensure the BC Elections website is accessible

## Notes

- The agent keeps the browser instance open between requests for performance
- Each extraction creates a new browser context (tab) that is closed after completion
- The browser window is visible so you can monitor the process
- All extractions are logged to the console for debugging
