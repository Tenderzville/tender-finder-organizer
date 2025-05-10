
import { supabase } from "@/lib/supabase-client";
import { Tender } from "@/types/tender";

// Function to find similar tenders based on description and category
export async function findSimilarTenders(tender: Tender, limit: number = 3): Promise<Tender[]> {
  try {
    // In a real implementation, we would use embeddings for semantic search
    // For now, we'll use simple text matching as a placeholder
    const { data, error } = await supabase
      .from('tenders')
      .select('*')
      .neq('id', tender.id)
      .eq('category', tender.category)
      .limit(limit);
      
    if (error) {
      console.error("Error finding similar tenders:", error);
      return [];
    }
    
    return data as Tender[];
  } catch (err) {
    console.error("Error in findSimilarTenders:", err);
    return [];
  }
}

// Function to extract key requirements from tender description
export function extractRequirements(description: string): string[] {
  // This is a simple implementation - in real use we'd use AI models
  const requirements: string[] = [];
  
  // Look for common requirement patterns in the description
  const lines = description.split(/\n|\.|;/);
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (
      trimmedLine.includes("require") || 
      trimmedLine.includes("must") || 
      trimmedLine.includes("should") ||
      trimmedLine.match(/^\d+\./) // Numbered points
    ) {
      if (trimmedLine.length > 10) {
        requirements.push(trimmedLine);
      }
    }
  }
  
  return requirements.slice(0, 5); // Return top 5 requirements
}

// Function to rate tender complexity based on description length and keyword analysis
export function analyzeComplexity(tender: Tender): 'Low' | 'Medium' | 'High' {
  let score = 0;
  
  // Check description length
  if (tender.description) {
    if (tender.description.length > 2000) score += 3;
    else if (tender.description.length > 1000) score += 2;
    else score += 1;
  }
  
  // Check for complexity keywords
  const complexityKeywords = [
    'complex', 'detailed', 'comprehensive', 'technical', 'specialized',
    'expertise', 'experience', 'certified', 'qualification', 'compliance'
  ];
  
  const descriptionText = (tender.description || '').toLowerCase();
  
  for (const keyword of complexityKeywords) {
    if (descriptionText.includes(keyword)) {
      score += 1;
    }
  }
  
  // Determine complexity level
  if (score >= 7) return 'High';
  if (score >= 4) return 'Medium';
  return 'Low';
}

// Function to check if a tender matches a supplier's profile
export function matchTenderToSupplier(
  tender: Tender, 
  supplierProfile: { areas_of_expertise: string[], industry: string, location: string }
): number {
  let score = 0;
  const maxScore = 10;
  
  // Check if tender category matches supplier's expertise
  if (supplierProfile.areas_of_expertise.some(area => 
    tender.category?.toLowerCase().includes(area.toLowerCase()) || 
    tender.description?.toLowerCase().includes(area.toLowerCase())
  )) {
    score += 5;
  }
  
  // Check location match
  if (tender.location?.toLowerCase().includes(supplierProfile.location.toLowerCase()) ||
      supplierProfile.location.toLowerCase().includes('all') ||
      supplierProfile.location.toLowerCase().includes('national')) {
    score += 3;
  }
  
  // Industry match
  if (tender.description?.toLowerCase().includes(supplierProfile.industry.toLowerCase())) {
    score += 2;
  }
  
  // Normalize to percentage
  return Math.min(100, Math.round((score / maxScore) * 100));
}

// Function to generate a social media post for a tender
export function generateSocialMediaPost(tender: Tender): string {
  let post = `📢 New Tender Alert: ${tender.title}\n\n`;
  
  // Add procuring entity if available
  if (tender.procuring_entity) {
    post += `From: ${tender.procuring_entity}\n`;
  }
  
  // Add deadline
  if (tender.deadline) {
    const deadlineDate = new Date(tender.deadline);
    post += `Deadline: ${deadlineDate.toDateString()}\n`;
  }
  
  // Add category and location
  post += `Category: ${tender.category || 'General'}\n`;
  post += `Location: ${tender.location || 'Kenya'}\n\n`;
  
  // Add special tags
  if (tender.affirmative_action && tender.affirmative_action.type !== 'none') {
    const type = tender.affirmative_action.type;
    post += `#${type.charAt(0).toUpperCase() + type.slice(1)}Opportunity `;
  }
  
  // Add general hashtags
  post += `#TenderAlert #BusinessOpportunity #Kenya #Procurement`;
  
  return post;
}
