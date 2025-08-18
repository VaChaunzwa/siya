#!/usr/bin/env node

/**
 * App Center Setup Helper Script
 * This script helps you configure App Center for your React Native app
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupAppCenter() {
  console.log('🚀 App Center Setup Helper');
  console.log('==========================\n');
  
  console.log('Please provide your App Center app secrets:');
  console.log('(You can find these in App Center > Settings > App secrets)\n');
  
  const androidSecret = await question('Android App Secret: ');
  const iosSecret = await question('iOS App Secret: ');
  
  if (!androidSecret || !iosSecret) {
    console.log('\n❌ Both Android and iOS app secrets are required.');
    process.exit(1);
  }
  
  // Update appcenter-config.json
  const configPath = path.join(__dirname, 'appcenter-config.json');
  const config = {
    android: {
      app_secret: androidSecret
    },
    ios: {
      app_secret: iosSecret
    }
  };
  
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('\n✅ Updated appcenter-config.json');
  } catch (error) {
    console.log('\n❌ Failed to update appcenter-config.json:', error.message);
  }
  
  // Update App.tsx
  const appTsxPath = path.join(__dirname, 'App.tsx');
  try {
    let appTsxContent = fs.readFileSync(appTsxPath, 'utf8');
    
    // Replace placeholders
    appTsxContent = appTsxContent.replace(
      'YOUR_ANDROID_APP_SECRET_HERE',
      androidSecret
    );
    appTsxContent = appTsxContent.replace(
      'YOUR_IOS_APP_SECRET_HERE',
      iosSecret
    );
    
    fs.writeFileSync(appTsxPath, appTsxContent);
    console.log('✅ Updated App.tsx with app secrets');
  } catch (error) {
    console.log('❌ Failed to update App.tsx:', error.message);
  }
  
  console.log('\n🎉 App Center setup completed!');
  console.log('\nNext steps:');
  console.log('1. Push your code to your repository');
  console.log('2. Connect your repository to App Center');
  console.log('3. Configure build settings in App Center');
  console.log('4. Set up distribution groups');
  console.log('\nFor detailed instructions, see APPCENTER_SETUP.md');
  
  rl.close();
}

setupAppCenter().catch(error => {
  console.error('\n❌ Setup failed:', error.message);
  process.exit(1);
});