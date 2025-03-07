
import React, { useEffect } from 'react';

/**
 * AdManager component for handling AdMob advertisements
 * This component initializes AdMob and provides points for watched ads
 */
export const AdManager: React.FC = () => {
  useEffect(() => {
    // Initialize AdMob when component mounts
    const initializeAdMob = () => {
      // Check if we're in a mobile environment
      if (window.AdMob) {
        document.addEventListener('deviceready', onDeviceReady, false);
      }
    };

    const onDeviceReady = () => {
      // AdMob initialization code
      if (window.AdMob) {
        window.AdMob.setOptions({
          publisherId: "ca-app-pub-XXXXXXXXXXXXXXXX", // Replace with your AdMob ID
          interstitialAdId: "ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX",
          rewardVideoId: "ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX",
          bannerAtTop: false,
          overlap: false,
          offsetTopBar: false,
          isTesting: true, // Set to false in production
        });
      }
    };

    initializeAdMob();
    
    return () => {
      // Clean up event listeners
      document.removeEventListener('deviceready', onDeviceReady);
    };
  }, []);

  return null; // This component doesn't render anything
};

/**
 * Function to show a rewarded video ad and award points on completion
 * @param onRewardEarned Callback function with number of points earned
 */
export const showRewardedAd = (onRewardEarned: (points: number) => void) => {
  if (window.AdMob) {
    // Prepare the rewarded video
    window.AdMob.prepareRewardVideoAd({
      adId: window.AdMob.rewardVideoId,
      autoShow: false
    });
    
    // Set up event listeners
    document.addEventListener('onAdLoaded', () => {
      window.AdMob.showRewardVideoAd();
    });
    
    document.addEventListener('onRewardedVideo', (info: any) => {
      // Award points based on video completion
      const pointsEarned = 10; // Default points per ad view
      onRewardEarned(pointsEarned);
    });
  } else {
    console.log('AdMob not available');
  }
};

// Add this to the global Window interface
declare global {
  interface Window {
    AdMob?: any;
  }
}
