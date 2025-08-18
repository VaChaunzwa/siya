const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🌐 Creating web deployment package for mobile app...');

try {
    // Create deployment directory
    const deployDir = path.join(__dirname, 'web-deploy');
    if (!fs.existsSync(deployDir)) {
        fs.mkdirSync(deployDir);
    }

    // Copy download page
    const downloadPageSrc = path.join(__dirname, 'app-download.html');
    const downloadPageDest = path.join(deployDir, 'index.html');
    fs.copyFileSync(downloadPageSrc, downloadPageDest);
    console.log('✅ Download page copied');

    // Create a simple server file
    const serverContent = `const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(__dirname));

// Route for download page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'Siya Portal Mobile Download' });
});

app.listen(PORT, () => {
    console.log(\`🚀 Mobile app download server running on port \${PORT}\`);
    console.log(\`📱 Access download page at: http://localhost:\${PORT}\`);
});
`;

    fs.writeFileSync(path.join(deployDir, 'server.js'), serverContent);
    console.log('✅ Server file created');

    // Create package.json for deployment
    const packageJson = {
        "name": "siya-portal-mobile-download",
        "version": "1.0.0",
        "description": "Download page for Siya Portal Mobile App",
        "main": "server.js",
        "scripts": {
            "start": "node server.js",
            "dev": "node server.js"
        },
        "dependencies": {
            "express": "^4.18.2"
        },
        "engines": {
            "node": ">=16.0.0"
        }
    };

    fs.writeFileSync(path.join(deployDir, 'package.json'), JSON.stringify(packageJson, null, 2));
    console.log('✅ Package.json created');

    // Create deployment instructions
    const deployInstructions = `# Siya Portal Mobile App Download Deployment

## Quick Deploy

### Option 1: Local Server
\`\`\`bash
cd web-deploy
npm install
npm start
\`\`\`

### Option 2: Vercel Deployment
\`\`\`bash
npm install -g vercel
cd web-deploy
vercel
\`\`\`

### Option 3: Netlify Deployment
1. Drag and drop the web-deploy folder to Netlify
2. Or use Netlify CLI:
\`\`\`bash
npm install -g netlify-cli
cd web-deploy
netlify deploy
\`\`\`

### Option 4: Firebase Hosting
\`\`\`bash
firebase init hosting
firebase deploy
\`\`\`

## Adding APK Files

1. Place your APK files in the web-deploy directory
2. Update the download links in index.html
3. Redeploy

## Custom Domain

Update the server configuration or hosting settings to use your custom domain.
`;

    fs.writeFileSync(path.join(deployDir, 'DEPLOY.md'), deployInstructions);
    console.log('✅ Deployment instructions created');

    // Create a simple CSS file for better styling
    const cssContent = `/* Additional styles for mobile download page */
.download-section {
    margin: 20px 0;
}

.build-status {
    padding: 15px;
    border-radius: 8px;
    margin: 15px 0;
    text-align: center;
}

.status-pending {
    background-color: #fff3cd;
    border: 1px solid #ffeaa7;
    color: #856404;
}

.status-ready {
    background-color: #d4edda;
    border: 1px solid #c3e6cb;
    color: #155724;
}

.download-link {
    display: inline-block;
    margin: 10px;
    padding: 12px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    text-decoration: none;
    border-radius: 25px;
    font-weight: bold;
    transition: transform 0.2s;
}

.download-link:hover {
    transform: translateY(-2px);
    color: white;
}

.download-link:disabled,
.download-link.disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
}

@media (max-width: 768px) {
    .container {
        width: 95%;
        padding: 20px;
    }
    
    .download-link {
        display: block;
        margin: 10px 0;
        text-align: center;
    }
}
`;

    fs.writeFileSync(path.join(deployDir, 'styles.css'), cssContent);
    console.log('✅ Additional styles created');

    console.log('\n🎉 Web deployment package created successfully!');
    console.log(`📁 Location: ${deployDir}`);
    console.log('\n📋 Next steps:');
    console.log('1. cd web-deploy');
    console.log('2. npm install');
    console.log('3. npm start');
    console.log('4. Visit http://localhost:3000');
    console.log('\n🚀 For production deployment, see DEPLOY.md');

} catch (error) {
    console.error('❌ Deployment package creation failed:', error.message);
}