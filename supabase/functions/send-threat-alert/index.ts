import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ThreatAlertRequest {
  threatType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  source: string;
  target: string;
  timestamp: string;
  channels: {
    email?: {
      to: string;
    };
    sms?: {
      to: string;
    };
  };
}

const getSeverityEmoji = (severity: string) => {
  switch (severity) {
    case 'critical': return '🚨';
    case 'high': return '⚠️';
    case 'medium': return '🔶';
    default: return 'ℹ️';
  }
};

const formatAlertMessage = (threat: ThreatAlertRequest) => {
  return `${getSeverityEmoji(threat.severity)} ${threat.severity.toUpperCase()} THREAT DETECTED

Type: ${threat.threatType}
Source: ${threat.source}
Target: ${threat.target}
Time: ${new Date(threat.timestamp).toLocaleString()}

${threat.description}`;
};

const sendEmailAlert = async (threat: ThreatAlertRequest, email: string) => {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  const severityColor = threat.severity === 'critical' ? '#dc2626' : 
                        threat.severity === 'high' ? '#ea580c' : '#eab308';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #111; }
        .container { max-width: 600px; margin: 0 auto; background: #1a1a2e; border-radius: 12px; overflow: hidden; border: 1px solid #333; }
        .header { background: ${severityColor}; padding: 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { padding: 24px; color: #e5e5e5; }
        .threat-info { background: #252540; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #333; }
        .info-row:last-child { border-bottom: none; }
        .label { color: #888; }
        .value { color: #fff; font-weight: 500; }
        .description { background: #1e1e30; padding: 16px; border-radius: 8px; border-left: 4px solid ${severityColor}; margin-top: 16px; }
        .footer { text-align: center; padding: 16px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${getSeverityEmoji(threat.severity)} ${threat.severity.toUpperCase()} THREAT DETECTED</h1>
        </div>
        <div class="content">
          <div class="threat-info">
            <div class="info-row">
              <span class="label">Threat Type</span>
              <span class="value">${threat.threatType}</span>
            </div>
            <div class="info-row">
              <span class="label">Source</span>
              <span class="value">${threat.source}</span>
            </div>
            <div class="info-row">
              <span class="label">Target</span>
              <span class="value">${threat.target}</span>
            </div>
            <div class="info-row">
              <span class="label">Detected At</span>
              <span class="value">${new Date(threat.timestamp).toLocaleString()}</span>
            </div>
          </div>
          <div class="description">
            <strong>Description:</strong><br/>
            ${threat.description}
          </div>
        </div>
        <div class="footer">
          Sentinel Security Dashboard - Automated Alert
        </div>
      </div>
    </body>
    </html>
  `;

  // Use Resend API directly via fetch
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Sentinel Alerts <onboarding@resend.dev>',
      to: [email],
      subject: `${getSeverityEmoji(threat.severity)} [${threat.severity.toUpperCase()}] ${threat.threatType} Detected`,
      html,
    }),
  });

  const result = await response.json();
  
  if (!response.ok) {
    console.error('[SendThreatAlert] Email failed:', result);
    throw new Error(result.message || 'Failed to send email');
  }

  console.log('[SendThreatAlert] Email sent:', result);
  return result;
};

const sendSmsAlert = async (threat: ThreatAlertRequest, phone: string) => {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

  if (!accountSid || !authToken || !fromPhone) {
    throw new Error('Twilio credentials are not fully configured');
  }

  const message = formatAlertMessage(threat);
  
  // Truncate message if too long for SMS (160 chars standard, but Twilio handles longer)
  const smsMessage = message.length > 1600 ? message.substring(0, 1597) + '...' : message;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: phone,
      From: fromPhone,
      Body: smsMessage,
    }),
  });

  const result = await response.json();
  
  if (!response.ok) {
    console.error('[SendThreatAlert] SMS failed:', result);
    throw new Error(result.message || 'Failed to send SMS');
  }

  console.log('[SendThreatAlert] SMS sent:', result.sid);
  return result;
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: ThreatAlertRequest = await req.json();
    console.log('[SendThreatAlert] Received request:', JSON.stringify(payload, null, 2));

    const results: { email?: unknown; sms?: unknown; errors: string[] } = { errors: [] };

    // Send email if configured
    if (payload.channels.email?.to) {
      try {
        results.email = await sendEmailAlert(payload, payload.channels.email.to);
      } catch (error: unknown) {
        console.error('[SendThreatAlert] Email error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Email: ${message}`);
      }
    }

    // Send SMS if configured
    if (payload.channels.sms?.to) {
      try {
        results.sms = await sendSmsAlert(payload, payload.channels.sms.to);
      } catch (error: unknown) {
        console.error('[SendThreatAlert] SMS error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`SMS: ${message}`);
      }
    }

    const success = results.errors.length === 0;
    
    return new Response(
      JSON.stringify({
        success,
        results,
        message: success ? 'Alerts sent successfully' : 'Some alerts failed',
      }),
      {
        status: success ? 200 : 207, // 207 Multi-Status for partial success
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('[SendThreatAlert] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
