# Siya Portal Mobile App Download Deployment

## Quick Deploy

### Option 1: Local Server
```bash
cd web-deploy
npm install
npm start
```

### Option 2: Vercel Deployment
```bash
npm install -g vercel
cd web-deploy
vercel
```

### Option 3: Netlify Deployment
1. Drag and drop the web-deploy folder to Netlify
2. Or use Netlify CLI:
```bash
npm install -g netlify-cli
cd web-deploy
netlify deploy
```

### Option 4: Firebase Hosting
```bash
firebase init hosting
firebase deploy
```

## Adding APK Files

1. Place your APK files in the web-deploy directory
2. Update the download links in index.html
3. Redeploy

## Custom Domain

Update the server configuration or hosting settings to use your custom domain.
