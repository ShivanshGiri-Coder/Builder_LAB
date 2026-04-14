// Test script that works with Next.js environment loading
import { execSync } from 'child_process';

console.log('=== Testing Environment Variables via Next.js ===');

try {
  // Use Next.js to print environment variables
  const result = execSync('npm run dev -- & sleep 2 && curl -s http://localhost:3001/api/test-env || echo "Server not ready"', { 
    encoding: 'utf8',
    timeout: 5000 
  });
  console.log(result);
} catch (error) {
  console.log('Testing environment variables directly...');
  
  // Alternative: Check if .env.local file exists and show first lines
  const fs = require('fs');
  try {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    console.log('.env.local file exists');
    console.log('First 200 characters:');
    console.log(envContent.substring(0, 200));
  } catch (err) {
    console.log('.env.local file not found or cannot be read');
  }
}

console.log('=== Test Complete ===');
