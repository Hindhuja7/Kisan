export type Language = "en" | "te" | "hi";

export type AgentResult = AgentStep;

export interface AgentStep {
  agent: string;
  status: string;
  summary: string;
  advisory: string;
  data: Record<string, unknown>;
  reasoning?: string[];
  confidence?: number;
  completed_at?: string;
}

export interface WorkflowResult {
  workflow_id: string;
  farmer_id: string;
  crop: string;
  status: string;
  steps: AgentStep[];
  deal_value_inr?: number;
  net_income_inr?: number;
  income_uplift_pct?: number;
  ai_confidence_avg?: number;
  completed_at: string;
}

export interface DashboardStats {
  workflows_run: number;
  deals_closed: number;
  whatsapp_messages: number;
  mandis_monitored: number;
  avg_income_uplift_pct: number;
  crop_loss_prevented_pct: number;
  ai_confidence_score: number;
  deal_success_rate: number;
  logistics_efficiency_pct: number;
  farmers_assisted: number;
  openai_enabled: boolean;
  supabase_enabled: boolean;
  agents_active: number;
}

export interface FarmerOverview {
  farmer: FarmerProfile;
  crop: string;
  health_score: number;
  ndvi: number;
  ndvi_grid: number[][];
  harvest_window: { start: string; end: string };
  days_to_harvest: number;
  best_mandi: MandiPrice;
  expected_uplift_pct: number;
  weather: { condition: string; alert: string; risk_level: string; temp_c: number };
  iot: Record<string, unknown>;
  satellite: Record<string, unknown>;
  storage_status: string;
  logistics_status: string;
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
