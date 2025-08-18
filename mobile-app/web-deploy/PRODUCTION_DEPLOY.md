# Production Deployment Guide

## Quick Deploy Options

### Option 1: Static File Hosting (Recommended)
The `static-deploy.html` file is a complete, self-contained mobile app download page that can be hosted anywhere:

1. **Upload to any web hosting service:**
   - Rename `static-deploy.html` to `index.html`
   - Upload to your web hosting provider
   - Access via your domain

2. **GitHub Pages:**
   ```bash
   # Create a new repository
   git init
   git add static-deploy.html
   git commit -m "Add mobile app download page"
   git branch -M main
   git remote add origin https://github.com/yourusername/siya-mobile-download.git
   git push -u origin main
   # Enable GitHub Pages in repository settings
   ```

3. **Netlify Drop:**
   - Go to https://app.netlify.com/drop
   - Drag and drop the `static-deploy.html` file
   - Get instant live URL

### Option 2: Node.js Server Deployment

#### Heroku
```bash
# Install Heroku CLI
npm install -g heroku
heroku login
heroku create siya-mobile-app
git init
git add .
git commit -m "Initial commit"
heroku git:remote -a siya-mobile-app
git push heroku main
```

#### Railway
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

#### Render
1. Connect your GitHub repository to Render
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Deploy automatically

### Option 3: Vercel (After Authentication)
```bash
# Login to Vercel first (requires browser)
vercel login
# Then deploy
vercel --prod
```

### Option 4: Firebase Hosting (Alternative)
```bash
# Copy static file to Firebase public directory
cp static-deploy.html ../../../web-frontend/portal-ui/dist/mobile-download.html
cd ../../../
firebase deploy --only hosting
```

## File Structure
```
web-deploy/
├── static-deploy.html     # Self-contained download page
├── server.js             # Node.js server
├── package.json          # Dependencies
├── vercel.json          # Vercel configuration
└── public/              # Static assets
    ├── index.html
    └── styles.css
```

## Environment Variables (for Node.js deployment)
```
PORT=3000
NODE_ENV=production
```

## Custom Domain Setup
1. Deploy using any method above
2. Get the deployment URL
3. Configure your domain's DNS:
   - Add CNAME record pointing to deployment URL
   - Or add A record with deployment IP

## Monitoring and Analytics
Add to `static-deploy.html` before `</head>`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## Security Headers (for Node.js deployment)
Add to `server.js`:
```javascript
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});
```

## SSL/HTTPS
Most hosting providers (Netlify, Vercel, Heroku) provide free SSL certificates automatically.

## Performance Optimization
- The static file is already optimized with embedded CSS and minimal JavaScript
- Gzip compression is handled by most hosting providers
- CDN distribution is automatic on platforms like Netlify and Vercel

## Updating the Download Links
When APK files are ready:
1. Upload APK files to your hosting service
2. Update the href attributes in `static-deploy.html`:
   ```html
   <a href="/downloads/siya-portal.apk" class="download-btn">📱 Download Android APK</a>
   ```
3. Remove the `disabled` class and `onclick="return false;"`

## Backup and Versioning
- Keep multiple versions of the download page
- Use git for version control
- Backup APK files to cloud storage

## Support and Maintenance
- Monitor download statistics
- Update app versions regularly
- Test download links periodically
- Keep deployment documentation updated