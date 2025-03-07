
import { useState, useEffect } from 'react';

// Define levels for device performance
export type PerformanceLevel = 'high' | 'medium' | 'low';

interface PerformanceOptions {
  // Default values for different components based on performance
  animations: boolean;
  lazyLoading: boolean;
  imageQuality: 'high' | 'medium' | 'low';
  renderDistance: number;
  useSimplifiedUI: boolean;
}

// Performance settings based on detected level
const performancePresets: Record<PerformanceLevel, PerformanceOptions> = {
  high: {
    animations: true,
    lazyLoading: false,
    imageQuality: 'high',
    renderDistance: 50,
    useSimplifiedUI: false
  },
  medium: {
    animations: true,
    lazyLoading: true,
    imageQuality: 'medium',
    renderDistance: 20,
    useSimplifiedUI: false
  },
  low: {
    animations: false,
    lazyLoading: true,
    imageQuality: 'low',
    renderDistance: 10,
    useSimplifiedUI: true
  }
};

export const usePerformance = () => {
  const [performanceLevel, setPerformanceLevel] = useState<PerformanceLevel>('medium');
  const [options, setOptions] = useState<PerformanceOptions>(performancePresets.medium);
  const [isDetecting, setIsDetecting] = useState(true);

  // Detect device performance on mount
  useEffect(() => {
    const detectPerformance = () => {
      setIsDetecting(true);
      
      // Check for stored preference
      const storedLevel = localStorage.getItem('performanceLevel') as PerformanceLevel | null;
      if (storedLevel && performancePresets[storedLevel]) {
        setPerformanceLevel(storedLevel);
        setOptions(performancePresets[storedLevel]);
        setIsDetecting(false);
        return;
      }
      
      // Simple performance detection based on device memory and processors
      if ('deviceMemory' in navigator || 'hardwareConcurrency' in navigator) {
        const memory = (navigator as any).deviceMemory || 4; // Default to 4GB if not available
        const processors = navigator.hardwareConcurrency || 4; // Default to 4 cores
        
        if (memory <= 2 || processors <= 2) {
          setPerformanceLevel('low');
          setOptions(performancePresets.low);
        } else if (memory <= 4 || processors <= 4) {
          setPerformanceLevel('medium');
          setOptions(performancePresets.medium);
        } else {
          setPerformanceLevel('high');
          setOptions(performancePresets.high);
        }
      } else {
        // Default to medium if detection not available
        setPerformanceLevel('medium');
        setOptions(performancePresets.medium);
      }
      
      setIsDetecting(false);
    };
    
    detectPerformance();
  }, []);
  
  // Change performance level manually
  const setPerformance = (level: PerformanceLevel) => {
    setPerformanceLevel(level);
    setOptions(performancePresets[level]);
    localStorage.setItem('performanceLevel', level);
  };
  
  // Customize specific options
  const updateOptions = (newOptions: Partial<PerformanceOptions>) => {
    setOptions(prev => ({
      ...prev,
      ...newOptions
    }));
  };
  
  return {
    performanceLevel,
    options,
    isDetecting,
    setPerformance,
    updateOptions
  };
};
