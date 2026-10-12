# Automated Playtests for ChatGPT Beast Mode

## Setup

```bash
cd tests
npm install
npx playwright install chromium
```

## Configuration

Set your extension ID before running:

```bash
# Windows PowerShell
$env:EXTENSION_ID = "your-extension-id-here"
npx playwright test

# Or add to playwright.config.ts
```

## Running Tests

```bash
# All tests
npm test

# Headed mode (see browser)
npm run test:headed

# Interactive UI
npm run test:ui

# Specific test groups
npm run test:ask-question
npm run test:batch
npm run test:providers
```

## Test Coverage

| Test Suite | Coverage |
|------------|----------|
| **Ask Question Tab** | Opens, streams answer, handles errors, keyboard shortcuts |
| **Batch Summarization** | Context menu, results table, progress bars, sorting, CSV export |
| **Provider Compatibility** | ChatGPT Web, OpenAI API, DeepSeek Chat, DeepSeek API |

## Key Test Scenarios

### Ask Question Tab
- Opens and streams answer via ChatGPT web interface
- Works without OpenAI API key (uses ChatGPT web)
- Handles network errors gracefully
- Ctrl+B keyboard shortcut toggles tab
- No "OpenAI provider only" error

### Batch Summarization
- Context menu shows 5 batch options
- Results tab shows glassmorphic table with thumbnails
- Animated progress bars with shimmer effect
- Sortable by Chronological / A-Z / Usage
- Export to CSV works
- Retry failed items

### Provider Compatibility
- ChatGPT Web (default, no API key)
- OpenAI API (with key)
- DeepSeek Chat (web)
- DeepSeek API (with key)

## Running in CI

```yaml
# .github/workflows/test.yml
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
  with: { node-version: '20' }
- run: cd tests && npm ci
- run: npx playwright install --with-deps chromium
- run: npx playwright test
  env:
    EXTENSION_ID: ${{ secrets.EXTENSION_ID }}
```

## Debugging

```bash
# Run single test with debug
npx playwright test tests/playtest-ask-question.spec.ts -g "Ask Question tab opens" --debug

# Generate trace
npx playwright test --trace on
```

## Extension ID

Get your extension ID from `chrome://extensions` (Developer mode → Details → Extension ID).

Set as environment variable or update `playwright.config.ts`:
```typescript
export default defineConfig({
  use: { 
    baseURL: `chrome-extension://${process.env.EXTENSION_ID}/popup/index.html`
  }
});
```