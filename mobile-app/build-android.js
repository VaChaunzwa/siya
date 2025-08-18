const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Android APK build process...');

try {
    // Step 1: Prebuild the project
    console.log('📦 Prebuilding Expo project...');
    execSync('npx expo prebuild --platform android', { stdio: 'inherit' });
    
    // Step 2: Check if android directory exists
    const androidDir = path.join(__dirname, 'android');
    if (!fs.existsSync(androidDir)) {
        throw new Error('Android directory not found after prebuild');
    }
    
    console.log('✅ Prebuild completed successfully');
    
    // Step 3: Build the APK
    console.log('🔨 Building APK...');
    process.chdir(androidDir);
    
    // Build release APK
    execSync('./gradlew assembleRelease', { stdio: 'inherit' });
    
    // Step 4: Find the generated APK
    const apkPath = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
    
    if (fs.existsSync(apkPath)) {
        console.log('🎉 APK built successfully!');
        console.log(`📱 APK location: ${apkPath}`);
        
        // Copy APK to a more accessible location
        const outputPath = path.join(__dirname, 'siya-portal-mobile.apk');
        fs.copyFileSync(apkPath, outputPath);
        console.log(`📋 APK copied to: ${outputPath}`);
        
        // Update the download page
        updateDownloadPage(outputPath);
        
    } else {
        console.log('❌ APK not found at expected location');
    }
    
} catch (error) {
    console.error('❌ Build failed:', error.message);
    console.log('\n📋 Manual build instructions:');
    console.log('1. Run: npx expo prebuild --platform android --clear');
    console.log('2. Open Android Studio and import the android folder');
    console.log('3. Build > Generate Signed Bundle/APK');
    console.log('4. Choose APK and follow the wizard');
}

function updateDownloadPage(apkPath) {
    try {
        const downloadPagePath = path.join(__dirname, 'app-download.html');
        let content = fs.readFileSync(downloadPagePath, 'utf8');
        
        // Update the status and enable download button
        content = content.replace(
            '<div class="status">\n            <strong>Status:</strong> App build in progress. Please check back later for download links.\n        </div>',
            '<div class="status" style="background: #d4edda; border-color: #c3e6cb; color: #155724;">\n            <strong>Status:</strong> ✅ App build completed! Ready for download.\n        </div>'
        );
        
        content = content.replace(
            '<button class="download-btn" disabled>Download for Android (APK)</button>',
            '<a href="./siya-portal-mobile.apk" class="download-btn" download>Download for Android (APK)</a>'
        );
        
        fs.writeFileSync(downloadPagePath, content);
        console.log('📄 Download page updated');
    } catch (error) {
        console.error('Failed to update download page:', error.message);
    }
}