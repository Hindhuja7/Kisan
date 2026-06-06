export type Language = "en" | "te" | "hi";

export interface AgentResult {
  agent: string;
  status: string;
  summary: string;
  advisory: string;
  data: Record<string, unknown>;
}

export interface WorkflowResult {
  workflow_id: string;
  farmer_id: string;
  crop: string;
  status: string;
  steps: AgentResult[];
  deal_value_inr?: number;
  income_uplift_pct?: number;
  completed_at: string;
}

export interface DashboardStats {
  workflows_run: number;
  deals_closed: number;
  whatsapp_messages: number;
  mandis_monitored: number;
  avg_income_uplift_pct: number;
  openai_enabled: boolean;
  supabase_enabled: boolean;
}

export interface MandiPrice {
  mandi_id: string;
  mandi_name: string;
  district: string;
  crop: string;
  price_per_quintal_inr: number;
  trend: string;
}

export interface FarmerProfile {
  id: string;
  name: string;
  phone: string;
  village: string;
  district: string;
  state: string;
  crops: string[];
  land_acres: number;
}

export interface WhatsAppMessage {
  id?: string;
  phone: string;
  direction: "inbound" | "outbound";
  message: string;
  intent?: string;
  created_at?: string;
}

export interface WhatsAppChatResponse {
  phone: string;
  intent: string;
  reply: string;
  channel: string;
}
