# Deployment Guide

## Quick Deploy Options

### 1. GitHub Pages (Simple Static Hosting)
Since this is a client-side application, you can easily deploy to GitHub Pages:

1. Push to GitHub repository
2. Go to Settings > Pages
3. Select source: Deploy from a branch
4. Choose `main` branch and `/` (root) folder
5. Your app will be available at `https://username.github.io/repository-name`

### 2. Netlify (Recommended)
1. Connect your GitHub repository to Netlify
2. Build settings: Leave empty (no build step needed)
3. Publish directory: `/` (root)
4. Deploy!

### 3. Vercel
1. Connect your GitHub repository to Vercel
2. Framework preset: Other
3. Build command: Leave empty
4. Output directory: `/`
5. Deploy!

### 4. Local Development
```bash
# Option 1: Simple HTTP server
npx serve .

# Option 2: Python server
python -m http.server 8000

# Option 3: Node.js development server (with backend)
npm install
npm run dev
```

## Environment Variables

### Required for Full Functionality
- `OPENAI_API_KEY`: Your OpenAI API key (entered via UI)

### Optional (Has Fallbacks)
- `AIPIPE_TOKEN`: AI Pipe authentication token (entered via UI)
- Google Search API is embedded for evaluation

## Browser Compatibility
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Performance Notes
- Total bundle size: ~50KB (HTML + JS)
- No build step required
- Works offline (except for API calls)
- Bootstrap CSS/JS loaded from CDN

## Security Considerations
- API keys are stored in browser localStorage
- Google Search credentials are embedded (for evaluation only)
- JavaScript execution is sandboxed with security restrictions
- All external API calls are made directly from browser