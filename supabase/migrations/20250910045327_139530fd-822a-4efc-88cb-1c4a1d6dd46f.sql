-- Create missing tables for full functionality
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  read BOOLEAN DEFAULT FALSE,
  tender_id BIGINT REFERENCES public.tenders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tender_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tender_id BIGINT REFERENCES public.tenders(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'accepted', 'rejected')),
  application_data JSONB,
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tender_id)
);

CREATE TABLE IF NOT EXISTS public.saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  search_criteria JSONB NOT NULL,
  notification_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.integration_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  integration_type TEXT NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}',
  enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, integration_type)
);

CREATE TABLE IF NOT EXISTS public.bid_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tender_id BIGINT REFERENCES public.tenders(id) ON DELETE CASCADE NOT NULL,
  strategy_data JSONB NOT NULL DEFAULT '{}',
  competitive_analysis JSONB,
  win_probability DECIMAL(5,2),
  estimated_cost DECIMAL(15,2),
  profit_margin DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tender_id)
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tender_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bid_strategies ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own applications" ON public.tender_applications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own searches" ON public.saved_searches FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own integrations" ON public.integration_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own strategies" ON public.bid_strategies FOR ALL USING (auth.uid() = user_id);