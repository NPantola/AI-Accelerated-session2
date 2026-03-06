async function globalTeardown(config) {
  console.log('🧹 Starting global E2E test teardown...');
  
  // Clean up any test data that might have been created
  try {
    const { chromium } = require('@playwright/test');
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Try to clean up test database
    try {
      console.log('🗑️  Cleaning up test data...');
      const response = await page.request.post('http://localhost:3030/api/test/cleanup', {
        data: { 
          confirm: true,
          testSession: 'e2e-tests'
        }
      });
      
      if (response.status() === 200) {
        console.log('✅ Test data cleanup completed');
      } else {
        console.log('⚠️  Test cleanup endpoint not available');
      }
    } catch (error) {
      console.log('⚠️  Could not clean up test data (this is normal if endpoint doesn\'t exist)');
    }
    
    await browser.close();
    
  } catch (error) {
    console.log('⚠️  Error during cleanup:', error.message);
  }
  
  // Log test completion summary
  console.log('📊 E2E test session completed');
  console.log('📁 Test artifacts saved to: test-results/');
  console.log('🎭 Playwright HTML report available at: playwright-report/index.html');
  
  console.log('✅ Global teardown completed');
}

module.exports = globalTeardown;