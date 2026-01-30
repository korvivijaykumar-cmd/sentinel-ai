import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-agent-key',
};

interface SystemMetrics {
  agent_id: string;
  hostname: string;
  cpu_usage: number;
  memory_usage: number;
  memory_total?: number;
  memory_used?: number;
  disk_usage?: number;
  network_in?: number;
  network_out?: number;
}

interface ProcessInfo {
  pid: number;
  name: string;
  cpu_percent: number;
  memory_percent: number;
  status: string;
  user_name?: string;
}

interface DetectedThreat {
  threat_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  process_name?: string;
  process_pid?: number;
  description: string;
  source_ip?: string;
  destination_ip?: string;
  port?: number;
  protocol?: string;
}

interface AgentPayload {
  agent_id: string;
  hostname: string;
  metrics: {
    cpu_usage: number;
    memory_usage: number;
    memory_total?: number;
    memory_used?: number;
    disk_usage?: number;
    network_in?: number;
    network_out?: number;
  };
  processes?: ProcessInfo[];
  threats?: DetectedThreat[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method === 'POST') {
      const payload: AgentPayload = await req.json();
      
      console.log('Received metrics from agent:', payload.agent_id);

      // Validate required fields
      if (!payload.agent_id || !payload.hostname || !payload.metrics) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: agent_id, hostname, metrics' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Insert system metrics
      const { error: metricsError } = await supabase
        .from('system_metrics')
        .insert({
          agent_id: payload.agent_id,
          hostname: payload.hostname,
          cpu_usage: payload.metrics.cpu_usage,
          memory_usage: payload.metrics.memory_usage,
          memory_total: payload.metrics.memory_total,
          memory_used: payload.metrics.memory_used,
          disk_usage: payload.metrics.disk_usage,
          network_in: payload.metrics.network_in,
          network_out: payload.metrics.network_out,
        });

      if (metricsError) {
        console.error('Error inserting metrics:', metricsError);
        throw metricsError;
      }

      // Delete old processes for this agent and insert new ones
      if (payload.processes && payload.processes.length > 0) {
        // First delete old process data for this agent
        await supabase
          .from('system_processes')
          .delete()
          .eq('agent_id', payload.agent_id);

        // Insert new process data
        const processRecords = payload.processes.map(p => ({
          agent_id: payload.agent_id,
          pid: p.pid,
          name: p.name,
          cpu_percent: p.cpu_percent,
          memory_percent: p.memory_percent,
          status: p.status,
          user_name: p.user_name,
        }));

        const { error: processError } = await supabase
          .from('system_processes')
          .insert(processRecords);

        if (processError) {
          console.error('Error inserting processes:', processError);
        }
      }

      // Insert detected threats
      if (payload.threats && payload.threats.length > 0) {
        const threatRecords = payload.threats.map(t => ({
          agent_id: payload.agent_id,
          threat_type: t.threat_type,
          severity: t.severity,
          process_name: t.process_name,
          process_pid: t.process_pid,
          description: t.description,
          source_ip: t.source_ip,
          destination_ip: t.destination_ip,
          port: t.port,
          protocol: t.protocol,
          status: 'active',
        }));

        const { error: threatError } = await supabase
          .from('detected_threats')
          .insert(threatRecords);

        if (threatError) {
          console.error('Error inserting threats:', threatError);
        } else {
          console.log(`Inserted ${threatRecords.length} new threats`);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Metrics received',
          processed: {
            metrics: true,
            processes: payload.processes?.length || 0,
            threats: payload.threats?.length || 0,
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
