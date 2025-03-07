-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    message text NOT NULL,
    link text,
    read boolean DEFAULT false,
    notification_type text NOT NULL,
    created_at timestamptz DEFAULT now(),
    
    -- Add constraints
    CONSTRAINT valid_notification_type CHECK (
        notification_type IN ('tender_deadline', 'new_tender', 'system', 'reminder', 'agpo')
    )
);

-- Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view their own notifications"
    ON public.notifications
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update their own notifications"
    ON public.notifications
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_notifications boolean DEFAULT true,
    browser_notifications boolean DEFAULT true,
    sms_notifications boolean DEFAULT false,
    deadline_reminders boolean DEFAULT true,
    new_tender_notifications boolean DEFAULT true,
    new_agpo_notifications boolean DEFAULT true,
    phone_number text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS on notification preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own notification preferences
CREATE POLICY "Users can view their own notification preferences"
    ON public.notification_preferences
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Users can update their own notification preferences
CREATE POLICY "Users can update their own notification preferences"
    ON public.notification_preferences
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- Users can insert their own notification preferences
CREATE POLICY "Users can insert their own notification preferences"
    ON public.notification_preferences
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Add trigger to create default notification preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notification_preferences (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_created_add_notification_preferences ON auth.users;
CREATE TRIGGER on_user_created_add_notification_preferences
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_preferences();

-- Create function to send notifications
CREATE OR REPLACE FUNCTION notify_users_of_tender_deadline(days_before integer DEFAULT 3)
RETURNS void AS $$
DECLARE
    tender_record RECORD;
    user_record RECORD;
BEGIN
    -- Find tenders with deadlines approaching in 'days_before' days
    FOR tender_record IN 
        SELECT id, title, deadline, organization 
        FROM public.tenders 
        WHERE deadline::date = (CURRENT_DATE + days_before)
    LOOP
        -- For each user with deadline reminders enabled
        FOR user_record IN 
            SELECT np.user_id, np.email_notifications, np.sms_notifications, np.phone_number
            FROM public.notification_preferences np
            WHERE np.deadline_reminders = true
        LOOP
            -- Create notification
            INSERT INTO public.notifications (
                user_id, 
                title, 
                message, 
                link, 
                notification_type
            ) 
            VALUES (
                user_record.user_id,
                'Tender Deadline Approaching',
                'The tender "' || tender_record.title || '" from ' || tender_record.organization || ' is due in ' || days_before || ' days.',
                '/tenders/' || tender_record.id,
                'tender_deadline'
            );
            
            -- Here you would add logic to send SMS/email notifications
            -- For SMS, you would integrate with an SMS provider like Twilio or Africa's Talking
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
