// Script to check the current structure of tenders.go.ke

async function checkTendersGoKeSite() {
  console.log("Checking tenders.go.ke website structure...");
  
  try {
    // Headers that more closely mimic a real browser
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Cache-Control': 'max-age=0',
      'sec-ch-ua': '"Chromium";v="120", "Google Chrome";v="120", "Not-A.Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1'
    };
    
    // Try the main URL and check for any script tags that might load tender data
    const response = await fetch('https://tenders.go.ke/website/tenders/index', { headers });
    const html = await response.text();
    
    console.log(`\nFetched HTML content (${html.length} characters)`);
    
    // Look for script tags that might contain data or API endpoints
    const scriptMatches = html.match(/<script[^>]*src="([^"]*)"/g);
    if (scriptMatches) {
      console.log("\nFound script tags that might load data:");
      for (const script of scriptMatches) {
        console.log(script);
        
        // Try to fetch the script content to look for API endpoints
        try {
          const srcMatch = script.match(/src="([^"]*)"/); 
          if (srcMatch && srcMatch[1]) {
            const scriptUrl = srcMatch[1].startsWith('http') 
              ? srcMatch[1] 
              : `https://tenders.go.ke${srcMatch[1].startsWith('/') ? '' : '/'}${srcMatch[1]}`;
            
            // Skip if it's an external script (like Google Analytics)
            if (!scriptUrl.includes('tenders.go.ke')) {
              continue;
            }
            
            console.log(`\nFetching script: ${scriptUrl}`);
            const scriptResponse = await fetch(scriptUrl, { headers });
            const scriptContent = await scriptResponse.text();
            
            // Look for API endpoints in the script
            const apiEndpointMatches = scriptContent.match(/(\/api\/[^\s'"`]+)/g);
            if (apiEndpointMatches && apiEndpointMatches.length > 0) {
              console.log(`\nFound ${apiEndpointMatches.length} potential API endpoints in script:`);
              const uniqueEndpoints = [...new Set(apiEndpointMatches)]; // Remove duplicates
              uniqueEndpoints.forEach(endpoint => {
                console.log(`- ${endpoint}`);
              });
              
              // Try to request some of the API endpoints that look promising
              const tendersEndpoints = uniqueEndpoints.filter(ep => 
                ep.includes('tender') || 
                ep.includes('procurement') || 
                ep.includes('auction')
              );
              
              if (tendersEndpoints.length > 0) {
                console.log("\nTrying to request tender-related API endpoints:");
                for (const endpoint of tendersEndpoints.slice(0, 3)) { // Try first 3 only
                  const fullUrl = `https://tenders.go.ke${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
                  try {
                    console.log(`Requesting: ${fullUrl}`);
                    const apiResponse = await fetch(fullUrl, {
                      headers: {
                        ...headers,
                        'Accept': 'application/json, text/plain, */*',
                        'Content-Type': 'application/json'
                      }
                    });
                    
                    if (apiResponse.ok) {
                      const contentType = apiResponse.headers.get('content-type');
                      if (contentType && contentType.includes('application/json')) {
                        const jsonData = await apiResponse.json();
                        console.log(`API Response (JSON): ${JSON.stringify(jsonData).substring(0, 150)}...`);
                        
                        // Check if it contains tender data
                        if (jsonData && 
                            (Array.isArray(jsonData) || 
                             jsonData.tenders || 
                             jsonData.data || 
                             jsonData.results)) {
                          console.log("SUCCESS! Found tender data in API response");
                        }
                      } else {
                        const textData = await apiResponse.text();
                        console.log(`API Response (text): ${textData.substring(0, 100)}...`);
                      }
                    } else {
                      console.log(`API request failed: ${apiResponse.status} ${apiResponse.statusText}`);
                    }
                  } catch (error) {
                    console.log(`Error requesting API endpoint: ${error.message}`);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error(`Error processing script: ${error.message}`);
        }
      }
    }
    
    // Try to find meta tags that might give clues about the app structure
    const metaTags = html.match(/<meta[^>]*>/g);
    if (metaTags) {
      const appMetaTags = metaTags.filter(tag => 
        tag.includes('app-name') || 
        tag.includes('generator') || 
        tag.includes('framework')
      );
      
      if (appMetaTags.length > 0) {
        console.log("\nFound meta tags that might indicate framework:");
        appMetaTags.forEach(tag => {
          console.log(tag);
        });
      }
    }
    
    // Look for SPA router patterns which might indicate React, Vue, etc.
    const routerPatterns = [
      /react-router/,
      /vue-router/,
      /angular.router/,
      /\brouter\b/i,
      /\broutes\b/i,
      /history.pushState/
    ];
    
    for (const pattern of routerPatterns) {
      if (pattern.test(html)) {
        console.log(`\nDetected possible SPA router pattern: ${pattern}`);
      }
    }
    
    // Try common API endpoints that many apps use
    const commonEndpoints = [
      '/api/tenders',
      '/api/v1/tenders',
      '/api/public/tenders',
      '/api/tenders/list',
      '/api/tenders/active',
      '/website/api/tenders',
      '/public/tenders'
    ];
    
    console.log("\nTrying common tender API endpoints:");
    for (const endpoint of commonEndpoints) {
      try {
        const apiUrl = `https://tenders.go.ke${endpoint}`;
        console.log(`Checking: ${apiUrl}`);
        const apiResponse = await fetch(apiUrl, {
          headers: {
            ...headers,
            'Accept': 'application/json, text/plain, */*'
          }
        });
        
        if (apiResponse.ok) {
          const contentType = apiResponse.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            console.log(`Success - endpoint returns JSON: ${apiUrl}`);
            const data = await apiResponse.json();
            console.log(`Data sample: ${JSON.stringify(data).substring(0, 150)}...`);
          } else {
            console.log(`Endpoint returns non-JSON: ${apiUrl}`);
          }
        } else {
          console.log(`Endpoint failed with status ${apiResponse.status}: ${apiUrl}`);
        }
      } catch (error) {
        console.log(`Error checking endpoint: ${error.message}`);
      }
    }
    
    console.log("\nDone checking website structure.");
  } catch (error) {
    console.error("Error checking website:", error);
  }
}

// Run the function
checkTendersGoKeSite();
