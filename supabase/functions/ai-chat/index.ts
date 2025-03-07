
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.7";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { message, chatHistory = [] } = await req.json();
    
    // Log the request
    console.log("AI Chat request received:", { message, historyLength: chatHistory.length });

    // Build the context from chat history
    const context = chatHistory.map((msg: any) => 
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n');

    // For this implementation, we'll use a simple deterministic response approach
    // In a production environment, you would integrate with an open-source model API
    const prompt = `
      You are a helpful assistant for a tender finding platform called Tenders Ville. 
      You help users with questions about tenders, procurement processes, and using the platform.
      
      Previous conversation:
      ${context}
      
      User: ${message}
      
      Respond in a helpful, concise way. If you don't know the answer, say so.
      If answering in Swahili was requested, respond in Swahili.
    `;

    console.log("Processing AI response...");
    
    // For demonstration, generate a simple response
    // In production, replace this with an actual API call to an open-source model
    let aiResponse = "";
    
    // Check if message is in Swahili or asks for Swahili
    const isSwahiliRequested = message.toLowerCase().includes("swahili") || 
                              message.toLowerCase().includes("kiswahili") ||
                              /[^\x00-\x7F]/.test(message); // Non-ASCII characters
    
    if (isSwahiliRequested) {
      if (message.toLowerCase().includes("hello") || message.toLowerCase().includes("hi")) {
        aiResponse = "Jambo! Karibu kwenye Tenders Ville. Ninaweza kukusaidia vipi leo?";
      } else if (message.toLowerCase().includes("tender") || message.toLowerCase().includes("zabuni")) {
        aiResponse = "Tenders Ville inakusaidia kupata zabuni mbalimbali kutoka kwa serikali na mashirika binafsi. Unaweza kutumia kichujio kutafuta zabuni kwa kategoria tofauti.";
      } else {
        aiResponse = "Samahani, siwezi kuelewa swali lako vizuri. Unaweza kuuliza kwa njia nyingine tafadhali?";
      }
    } else {
      if (message.toLowerCase().includes("hello") || message.toLowerCase().includes("hi")) {
        aiResponse = "Hello! Welcome to Tenders Ville. How can I assist you today?";
      } else if (message.toLowerCase().includes("tender")) {
        aiResponse = "Tenders Ville helps you find tenders from government and private organizations. You can use the filter to search for tenders in different categories.";
      } else if (message.toLowerCase().includes("service provider")) {
        aiResponse = "Service providers are professionals who can help you with your tender applications. You can find them in the Services section and filter by expertise.";
      } else {
        aiResponse = "I'm sorry, I don't understand your question. Could you please rephrase it?";
      }
    }

    // In a real implementation, log the conversation to the database
    // await supabase.from('chat_logs').insert({
    //   user_message: message,
    //   ai_response: aiResponse,
    //   timestamp: new Date().toISOString()
    // });

    console.log("AI response generated:", aiResponse);
    
    return new Response(
      JSON.stringify({
        success: true,
        response: aiResponse,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in AI chat function:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
