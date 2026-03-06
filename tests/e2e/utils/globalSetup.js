const { chromium } = require('@playwright/test');

async function globalSetup(config) {
  console.log('🚀 Starting global E2E test setup...');
  
  // Launch browser to verify servers are ready
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('⏳ Waiting for backend server (http://localhost:3030)...');
    // Wait for backend to be ready
    let backendReady = false;
    let attempts = 0;
    while (!backendReady && attempts < 30) {
      try {
        const response = await page.goto('http://localhost:3030/api/health', { 
          waitUntil: 'networkidle',
          timeout: 5000 
        });
        if (response && response.status() === 200) {
          backendReady = true;
          console.log('✅ Backend server is ready');
        }
      } catch (error) {
        attempts++;
        console.log(`⏳ Backend not ready yet (attempt ${attempts}/30), retrying...`);
        await page.waitForTimeout(2000);
      }
    }

    if (!backendReady) {
      throw new Error('Backend server failed to start after 60 seconds');
    }

    console.log('⏳ Waiting for frontend server (http://localhost:3000)...');
    // Wait for frontend to be ready
    let frontendReady = false;
    attempts = 0;
    while (!frontendReady && attempts < 30) {
      try {
        const response = await page.goto('http://localhost:3000', { 
          waitUntil: 'networkidle',
          timeout: 5000 
        });
        if (response && response.status() === 200) {
          // Check if React app has loaded by looking for specific elements
          const reactRoot = await page.locator('#root').count();
          if (reactRoot > 0) {
            frontendReady = true;
            console.log('✅ Frontend server is ready');
          }
        }
      } catch (error) {
        attempts++;
        console.log(`⏳ Frontend not ready yet (attempt ${attempts}/30), retrying...`);
        await page.waitForTimeout(2000);
      }
    }

    if (!frontendReady) {
      throw new Error('Frontend server failed to start after 60 seconds');
    }

    // Clean up test database if needed
    console.log('🧹 Setting up clean test environment...');
    try {
      const response = await page.request.post('http://localhost:3030/api/test/reset', {
        data: { confirm: true }
      });
      
      if (response.status() === 200) {
        console.log('✅ Test database reset successfully');
      } else {
        console.log('⚠️  Test database reset endpoint not available (this is normal)');
      }
    } catch (error) {
      console.log('⚠️  Could not reset test database (this is normal if endpoint doesn\'t exist)');
    }

    console.log('✅ Global setup completed successfully');
    
  } finally {
    await browser.close();
  }
}

module.exports = globalSetup;