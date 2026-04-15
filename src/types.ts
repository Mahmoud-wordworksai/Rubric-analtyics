type Pagination = {
    page: number;
    limit: number;
    totalPages: number;
    totalResults: number;
  };

  type SalesBotCallData = {
    country: string;
    created_at: string; // ISO string
    dynamic_fields: {
      outcome: {
        default: string; // e.g., "incomplete"
        description: string; // e.g., "Sales bot outcome"
        type: string; // e.g., "string"
      };
    };
    format_values: {
      agent_name: string; // e.g., "Lisa"
      company_name: string; // e.g., "WordWorks AI"
    };
    from_number: string;
    no_of_answered_calls: string; // assuming it's a string, can be number if parsed
    provider: string; // e.g., "plivo"
    tag: string; // e.g., "test"
    status: string; // e.g., "completed"
    stt_service: string; // e.g., "Deepgram"
    system_prompt: string;
    tts_service: string; // e.g., "cartesia"
    project_name: string;
    attempt?: number | string; // Optional, if not always present
    day?: number | string; // Optional, if not always present
    source: string;
    _id: string;
    datasheet_info: {
      [key: string]: unknown;
    };
    executions: ExecutionData[];
  };

  type ExecutionData = {
    execution_id: string;
    execution_status: string;
    max_leads: string;
    no_of_answered_calls: string;
    country: string;
    status: string;
  }

  type FileInfo = {
    // Customize this based on actual file info structure
    [key: string]: unknown;
  };
  
  type Data = {
    project: string;
    flow_sid: string;
    files_info: FileInfo[];
    totalCount: number;
  };
  
  type RealEstateOrder = {
    id: string;
    status: 'COMPLETED' | 'RUNNNING' | string;
    user: unknown[];
    team: unknown[];
    organization: unknown[];
    data: Data;
  };

  type realEstateFileInfor = {
    id: string;
    name: string;
    size: number;
    file: string; // Assuming `response.data.file` is a string (e.g., a URL or base64). Adjust if needed.
    count: number;
  };

  type FormDataFileInfo = {
    id: string;
    name: string;
    size: number;
    file: Blob;
    count: number;
  }

  type Param  = {
    id: number;
    key: string;
    value: string;
  }

  interface DynamicField {
    id : number;
    key: string;  // The key, which can be a string
    value: string | number | boolean; // The value, which can be a string, number, or boolean (you can extend this as needed)
  }

  type ObjectValue = {
      [key: string]:string | number | boolean;
  }

  type VirtualAgentProviderData = {
    ConversationId: string;
    EndUserId: string;
    ReplyText: string;
    LanguageCode: string;
    Parameters: string;
    [key: string]: string; // In case there are additional dynamic properties
  };
  
  type CallbackItem = {
    AccountSid: string;
    CallSid: string;
    StatusCallbackEvent: string;
    Timestamp: string;
    VirtualAgentProvider: string;
    VirtualAgentProviderData: VirtualAgentProviderData;
    event: string;
  };
  
  type CallbackData = {
    callSid: string;
    items: CallbackItem[];
    name: string;
    number: string;
    outCome: string;
    futureDate: string;
    event: string;
  };

  interface Item {
    id: string;
    name?: string;
    html?: string;
    js?: string;
    style?: string;
    slug?: string;
    theme?: string;
    categoryId?: string;
    flow?: string;
    reports?: string;
    icon?: string;
  }
  
  type BotType = {
    flow: string;
    html: string; 
    id: string;
    js: string;
    style: string;
    name: string;
    reports: string;
    slug: string;
    theme: string;
    categoryId: string;
    icon: string;
  }


export type { Pagination };
export type { SalesBotCallData };
export type { ExecutionData };
export type { RealEstateOrder };
export type { realEstateFileInfor };
export type { FormDataFileInfo };
export type { Param };
export type { DynamicField };
export type { ObjectValue };
export type { CallbackData };
export type { Item };
export type { BotType };