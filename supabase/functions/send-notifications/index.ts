// supabase/functions/send-notifications/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get unread notifications requiring delivery
    const { data: notifications, error: notificationsError } = await supabaseClient
      .from('notifications')
      .select('*')
      .eq('notification_sent', false)
      .limit(100)

    if (notificationsError) {
      throw notificationsError
    }

    console.log(`Processing ${notifications.length} notifications for delivery`)

    // Group notifications by user
    const userNotifications = notifications.reduce((acc, notification) => {
      if (!acc[notification.user_id]) {
        acc[notification.user_id] = []
      }
      acc[notification.user_id].push(notification)
      return acc
    }, {})

    // Process each user's notifications
    for (const [userId, userNotifs] of Object.entries(userNotifications)) {
      // Get user email preferences
      const { data: user, error: userError } = await supabaseClient
        .from('users')
        .select('email, notification_preferences')
        .eq('id', userId)
        .single()

      if (userError) {
        console.error(`Error fetching user ${userId}:`, userError)
        continue
      }

      if (!user.email) {
        console.warn(`User ${userId} has no email, skipping notifications`)
        continue
      }

      // Prepare email content
      const emailSubject = `You have ${userNotifs.length} new tender notifications`
      
      let emailBody = `<h2>New Tender Notifications</h2>
        <p>We've found the following new tenders that match your interests:</p>
        <ul>`
      
      for (const notification of userNotifs) {
        // Extract tender information
        if (notification.metadata && notification.metadata.tender_id) {
          const { data: tender, error: tenderError } = await supabaseClient
            .from('tenders')
            .select('*')
            .eq('id', notification.metadata.tender_id)
            .single()

          if (!tenderError && tender) {
            emailBody += `<li>
              <strong>${tender.title}</strong><br/>
              ${tender.description ? `${tender.description.substring(0, 150)}...` : ''}
              ${tender.deadline ? `<br/>Deadline: ${tender.deadline}` : ''}
              ${tender.location ? `<br/>Location: ${tender.location}` : ''}
              ${tender.url ? `<br/><a href="${tender.url}">View Details</a>` : ''}
            </li>`
          } else {
            emailBody += `<li>${notification.content}</li>`
          }
        } else {
          emailBody += `<li>${notification.content}</li>`
        }
      }
      
      emailBody += `</ul>
        <p>To manage your notification preferences, log in to your account.</p>`

      // Send email via Supabase Edge Functions
      await supabaseClient.functions.invoke('send-email', {
        body: {
          to: user.email,
          subject: emailSubject,
          html: emailBody,
        },
      })

      // Mark notifications as sent
      for (const notification of userNotifs) {
        await supabaseClient
          .from('notifications')
          .update({ notification_sent: true })
          .eq('id', notification.id)
      }

      console.log(`Sent ${userNotifs.length} notifications to user ${userId}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${notifications.length} notifications`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error processing notifications:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
