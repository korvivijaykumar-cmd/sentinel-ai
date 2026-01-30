-- Create table to store system metrics from agents
CREATE TABLE public.system_metrics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id TEXT NOT NULL,
    hostname TEXT NOT NULL,
    cpu_usage DECIMAL(5,2) NOT NULL,
    memory_usage DECIMAL(5,2) NOT NULL,
    memory_total BIGINT,
    memory_used BIGINT,
    disk_usage DECIMAL(5,2),
    network_in BIGINT DEFAULT 0,
    network_out BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for running processes
CREATE TABLE public.system_processes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id TEXT NOT NULL,
    pid INTEGER NOT NULL,
    name TEXT NOT NULL,
    cpu_percent DECIMAL(5,2) DEFAULT 0,
    memory_percent DECIMAL(5,2) DEFAULT 0,
    status TEXT DEFAULT 'running',
    user_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for detected threats
CREATE TABLE public.detected_threats (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id TEXT NOT NULL,
    threat_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    process_name TEXT,
    process_pid INTEGER,
    description TEXT NOT NULL,
    source_ip TEXT,
    destination_ip TEXT,
    port INTEGER,
    protocol TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'investigating', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_system_metrics_agent_id ON public.system_metrics(agent_id);
CREATE INDEX idx_system_metrics_created_at ON public.system_metrics(created_at DESC);
CREATE INDEX idx_system_processes_agent_id ON public.system_processes(agent_id);
CREATE INDEX idx_detected_threats_agent_id ON public.detected_threats(agent_id);
CREATE INDEX idx_detected_threats_status ON public.detected_threats(status);

-- Enable RLS
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detected_threats ENABLE ROW LEVEL SECURITY;

-- Public INSERT policies (for agent without auth)
CREATE POLICY "Allow agent to insert metrics" ON public.system_metrics
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow agent to insert processes" ON public.system_processes
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow agent to insert threats" ON public.detected_threats
FOR INSERT WITH CHECK (true);

-- Authenticated users can read all data
CREATE POLICY "Authenticated users can view metrics" ON public.system_metrics
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view processes" ON public.system_processes
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view threats" ON public.detected_threats
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Authenticated users can update threat status
CREATE POLICY "Authenticated users can update threats" ON public.detected_threats
FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_processes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.detected_threats;