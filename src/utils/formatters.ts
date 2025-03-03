
/**
 * Formats a string value as currency based on the provided location
 */
export const formatCurrency = (value: string, location?: string): string => {
  if (!value || value === "Contact for pricing") return value;
  
  const numericValue = value.replace(/[^0-9.]/g, '');
  if (!numericValue) return value;
  
  const currencyFormats: { [key: string]: { symbol: string, position: 'before' | 'after' } } = {
    'Kenya': { symbol: 'KSh', position: 'before' },
    'USA': { symbol: '$', position: 'before' },
    'UK': { symbol: '£', position: 'before' },
    'EU': { symbol: '€', position: 'before' },
  };

  const format = location && currencyFormats[location] 
    ? currencyFormats[location] 
    : { symbol: '$', position: 'before' };

  return format.position === 'before' 
    ? `${format.symbol}${numericValue}`
    : `${numericValue}${format.symbol}`;
};
