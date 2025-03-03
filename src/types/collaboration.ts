
export type ConsortiumStatus = 'forming' | 'active' | 'completed' | 'disbanded';

export type SubcontractStatus = 'open' | 'in_progress' | 'awarded' | 'completed';

export type CollaborationRole = 'lead' | 'member' | 'specialist';

export type Consortium = {
  id: number;
  name: string;
  description: string;
  tender_id: number;
  status: ConsortiumStatus;
  lead_company_id: string;
  max_members: number;
  created_at: string;
  deadline: string;
  requirements?: string;
  category: string;
};

export type ConsortiumMember = {
  id: number;
  consortium_id: number;
  user_id: string;
  role: CollaborationRole;
  joined_at: string;
  contribution_percentage: number;
  approved: boolean;
};

export type Subcontract = {
  id: number;
  title: string;
  description: string;
  main_contractor_id: string;
  tender_id?: number;
  value_range: string;
  deadline: string;
  location: string;
  category: string;
  status: SubcontractStatus;
  created_at: string;
  requirements?: string;
};

export type PartnerProfile = {
  id: string;
  company_name: string;
  description: string;
  category: string;
  location: string;
  rating: number;
  verified: boolean;
  years_in_business: number;
  specialties: string[];
  contact_email: string;
  website?: string;
  collaboration_history?: number;
};

export type CollaborationProposal = {
  id: number;
  sender_id: string;
  recipient_id: string;
  consortium_id?: number;
  subcontract_id?: number;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
};
