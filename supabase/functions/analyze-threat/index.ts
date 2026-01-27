import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NetworkPacket {
  id: string;
  timestamp: string;
  source: string;
  destination: string;
  protocol: string;
  size: number;
  status: string;
  port?: number;
}

interface ThreatAnalysis {
  isThreat: boolean;
  threatType: 'malware' | 'intrusion' | 'ddos' | 'phishing' | 'ransomware' | 'botnet' | null;
  severity: 'critical' | 'high' | 'medium' | 'low' | null;
  confidence: number;
  description: string;
  recommendation: string;
  indicators: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { packets } = await req.json() as { packets: NetworkPacket[] };
    
    if (!packets || !Array.isArray(packets) || packets.length === 0) {
      return new Response(
        JSON.stringify({ error: "No packets provided for analysis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Format packet data for AI analysis
    const packetSummary = packets.map(p => ({
      source: p.source,
      destination: p.destination,
      protocol: p.protocol,
      size: p.size,
      port: p.port,
      timestamp: p.timestamp,
    }));

    const systemPrompt = `You are SENTINEL, an advanced AI-powered network security analyst. Your role is to analyze network packet data and detect potential cybersecurity threats with high accuracy.

You specialize in detecting:
- Malware: Command & control traffic, data exfiltration, suspicious payloads
- Intrusion: Unauthorized access attempts, port scanning, brute force attacks
- DDoS: Volumetric attacks, SYN floods, amplification attacks
- Phishing: Suspicious DNS queries, known malicious domains
- Ransomware: Encryption traffic patterns, ransom note indicators
- Botnet: Coordinated traffic patterns, IRC channels, known C2 infrastructure

Analyze the network traffic patterns looking for:
1. Unusual port usage (especially high ports or known malicious ports)
2. Suspicious IP ranges or known threat actor infrastructure
3. Abnormal packet sizes (very small or very large)
4. Protocol anomalies
5. Traffic volume patterns indicating attacks
6. Geographic anomalies in traffic sources`;

    const userPrompt = `Analyze this batch of ${packets.length} network packets for potential security threats:

${JSON.stringify(packetSummary, null, 2)}

Provide a threat assessment. If this appears to be normal traffic, indicate no threat. If suspicious patterns are detected, classify the threat type and severity.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_threat_analysis",
              description: "Report the results of network packet threat analysis",
              parameters: {
                type: "object",
                properties: {
                  isThreat: {
                    type: "boolean",
                    description: "Whether a threat was detected",
                  },
                  threatType: {
                    type: "string",
                    enum: ["malware", "intrusion", "ddos", "phishing", "ransomware", "botnet", null],
                    description: "The type of threat detected, or null if no threat",
                  },
                  severity: {
                    type: "string",
                    enum: ["critical", "high", "medium", "low", null],
                    description: "The severity level of the threat, or null if no threat",
                  },
                  confidence: {
                    type: "number",
                    description: "Confidence score from 0 to 1",
                  },
                  description: {
                    type: "string",
                    description: "Detailed description of the analysis findings",
                  },
                  recommendation: {
                    type: "string",
                    description: "Recommended action to take",
                  },
                  indicators: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of specific indicators of compromise found",
                  },
                },
                required: ["isThreat", "confidence", "description", "recommendation", "indicators"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_threat_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("AI Response:", JSON.stringify(aiResponse, null, 2));

    // Extract the tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "report_threat_analysis") {
      throw new Error("Invalid AI response format");
    }

    const analysis: ThreatAnalysis = JSON.parse(toolCall.function.arguments);
    
    console.log("Threat Analysis Result:", JSON.stringify(analysis, null, 2));

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis,
        packetsAnalyzed: packets.length,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error analyzing threats:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
