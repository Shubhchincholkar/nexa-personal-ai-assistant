export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolUsed?: string;
  toolData?: any;
  pendingAction?: {
    type: string;
    prompt?: string;
    options?: Array<{ label: string; number?: string; index?: number }>;
  };
  timestamp: string;
}

export interface SystemStatus {
  platform: string;
  isAndroidTermux: boolean;
  hasTermuxApi: boolean;
  geminiConfigured: boolean;
  model: string;
  toolsCount: number;
  dataDirectory: string;
}

export interface ToolInfo {
  name: string;
  description: string;
  riskLevel: 'SAFE' | 'SENSITIVE' | 'DANGEROUS';
  parameters?: any;
}
