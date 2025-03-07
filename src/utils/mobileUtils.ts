
// Detect if device is mobile
export const isMobileDevice = (): boolean => {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth < 768
  );
};

// Add viewport meta tag for proper scaling
export const setupMobileViewport = (): void => {
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  if (!viewportMeta) {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
    document.getElementsByTagName('head')[0].appendChild(meta);
  }
};

// Detect slow connections
export const isSlowConnection = (): boolean => {
  const connection = (navigator as any).connection || 
                    (navigator as any).mozConnection || 
                    (navigator as any).webkitConnection;
  
  if (connection) {
    return connection.downlink < 1.5 || 
           connection.effectiveType === 'slow-2g' ||
           connection.effectiveType === '2g' ||
           connection.effectiveType === '3g';
  }
  
  return false;
};

// Handle touch events for mobile
export const enableTouchInteractions = (element: HTMLElement): () => void => {
  let touchStartX = 0;
  let touchStartY = 0;
  
  const handleTouchStart = (e: TouchEvent) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  };
  
  const handleTouchMove = (e: TouchEvent) => {
    if (!touchStartX || !touchStartY) return;
    
    const touchEndX = e.touches[0].clientX;
    const touchEndY = e.touches[0].clientY;
    
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;
    
    // Detect swipe
    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal swipe
      if (diffX > 50) {
        element.dispatchEvent(new CustomEvent('swipeleft'));
      } else if (diffX < -50) {
        element.dispatchEvent(new CustomEvent('swiperight'));
      }
    } else {
      // Vertical swipe
      if (diffY > 50) {
        element.dispatchEvent(new CustomEvent('swipeup'));
      } else if (diffY < -50) {
        element.dispatchEvent(new CustomEvent('swipedown'));
      }
    }
    
    touchStartX = 0;
    touchStartY = 0;
  };
  
  element.addEventListener('touchstart', handleTouchStart, { passive: true });
  element.addEventListener('touchmove', handleTouchMove, { passive: true });
  
  // Return cleanup function
  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchmove', handleTouchMove);
  };
};

// Optimize images for mobile
export const getMobileOptimizedImageUrl = (
  originalUrl: string,
  width = 640
): string => {
  if (!originalUrl) return originalUrl;
  
  if (originalUrl.includes('supabase.co/storage/v1/object/public')) {
    // Append width transformation parameter for Supabase Storage
    return `${originalUrl}?width=${width}`;
  }
  
  // For other image sources, we'd need to implement specific transformations
  return originalUrl;
};

// Enable offline capabilities
export const setupOfflineSupport = (): void => {
  // Check if service worker is supported
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        // Register a simple service worker
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      } catch (error) {
        console.log('ServiceWorker registration failed: ', error);
      }
    });
  }
  
  // Listen for online/offline events
  window.addEventListener('online', () => {
    document.body.classList.remove('offline-mode');
    // Could trigger a toast notification here
  });
  
  window.addEventListener('offline', () => {
    document.body.classList.add('offline-mode');
    // Could trigger a toast notification here
  });
};

// Apply mobile-specific styles
export const applyMobileStyles = (): void => {
  if (isMobileDevice()) {
    document.body.classList.add('mobile-device');
    
    // Add larger touch targets for mobile
    const style = document.createElement('style');
    style.textContent = `
      .mobile-device button, 
      .mobile-device a, 
      .mobile-device input[type="checkbox"],
      .mobile-device input[type="radio"] {
        min-height: 44px;
        min-width: 44px;
      }
      
      .mobile-device input[type="text"],
      .mobile-device input[type="email"],
      .mobile-device input[type="password"],
      .mobile-device select {
        font-size: 16px; /* Prevents iOS zoom on focus */
      }
    `;
    document.head.appendChild(style);
  }
};
