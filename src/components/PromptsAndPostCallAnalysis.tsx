"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from "@/constants";
import { useRoomAPI } from "@/hooks/useRoomAPI";
import axiosInstance from '@/lib/axios';
import {
  Card,
  Button,
  Input,
  InputNumber,
  Space,
  Typography,
  message,
  Spin,
  Alert,
  Row,
  Col,
  Tabs,
  Select,
  Modal,
  Form,
  Divider,
  Tag,
  Switch,
  Table
} from 'antd';
import {
  SaveOutlined,
  ReloadOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SettingOutlined,
  DatabaseOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// ===== INTERFACES =====

interface DynamicConfig {
  active: boolean;
  column: string;
  mapping: Record<string, string>;
}

interface ProcessingMethod {
  method: string;
  param: string;
}

interface FormatValuesMapping {
  [formatValue: string]: ProcessingMethod;
}

interface RubricParameterConfig {
  name: string;
  weight: number;
  enabled?: boolean;
  description?: string;
}

interface PromptTemplate {
  _id?: { $oid: string };
  name: string;
  from_number?: string;
  format_values?: string[];
  prompts?: Record<string, string>;
  analysis_prompts?: Record<string, string>;
  greetings?: Record<string, string>;
  dynamic_fields?: any;
  conversation_examples?: any;
  response_adaptation_matrix?: any;
  forbidden_patterns?: any[];
  success_patterns?: any[];
  provider?: string;
  stt_service?: string;
  tts_service?: string;
  llm_service?: string;
  api_llm_payload?: any;
  stt_lan_codes?: Record<string, string>;
  tts_lan_codes?: Record<string, string>;
  tts_model_ids?: Record<string, string>;
  tts_voice_ids?: Record<string, string>;
  greeting?: string;
  sms?: boolean;
  inbound_execution_ids?: any[];
  format_values_mapping_methods?: FormatValuesMapping;
  dynamic?: DynamicConfig;
  // New fields
  stt_services?: Record<string, string>;
  tts_services?: Record<string, string>;
  llm_services?: Record<string, string>;
  analysis_llm_services?: Record<string, string>;
  call_timeouts?: Record<string, number | string>;
  first_silence_msgs?: Record<string, string | null>;
  first_silence_times?: Record<string, number>;
  second_silence_times?: Record<string, number>;
  call_end_delays?: Record<string, number>;
  format_values_lan?: Record<string, string>;
  rubric_analytics_enabled?: boolean;
  rubric_file?: string;
  rubric_sheet?: string;
  grader?: string;
  model?: string;
  rubric_parameters?: RubricParameterConfig[];
  [key: string]: any;
}

interface TemplateListItem {
  _id: { $oid: string };
  name: string;
}

// ===== MAIN COMPONENT =====

const PromptsAndPostCallAnalysis: React.FC = () => {

  // State management
  const [templateList, setTemplateList] = useState<TemplateListItem[]>([]);
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('app-template');
  const [currentTemplate, setCurrentTemplate] = useState<PromptTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [requiredColumns, setRequiredColumns] = useState<string[]>([]);

  // Modal states
  const [isAddFormatValueModalVisible, setIsAddFormatValueModalVisible] = useState(false);
  const [newFormatValue, setNewFormatValue] = useState<string>('');

  const [isProcessingMethodModalVisible, setIsProcessingMethodModalVisible] = useState(false);
  const [selectedFormatValue, setSelectedFormatValue] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [selectedMethodParam, setSelectedMethodParam] = useState<string>('');

  const [isAddPromptKeyModalVisible, setIsAddPromptKeyModalVisible] = useState(false);
  const [newPromptKey, setNewPromptKey] = useState<string>('');
  const [newPromptValue, setNewPromptValue] = useState<string>('');

  const [isAddGreetingKeyModalVisible, setIsAddGreetingKeyModalVisible] = useState(false);
  const [newGreetingKey, setNewGreetingKey] = useState<string>('');
  const [newGreetingValue, setNewGreetingValue] = useState<string>('');

  const [isAddAnalysisKeyModalVisible, setIsAddAnalysisKeyModalVisible] = useState(false);
  const [newAnalysisKey, setNewAnalysisKey] = useState<string>('');
  const [newAnalysisValue, setNewAnalysisValue] = useState<string>('');

  const [isAddSTTLanCodeModalVisible, setIsAddSTTLanCodeModalVisible] = useState(false);
  const [newSTTLanCodeKey, setNewSTTLanCodeKey] = useState<string>('');
  const [newSTTLanCodeValue, setNewSTTLanCodeValue] = useState<string>('');

  const [isAddTTSLanCodeModalVisible, setIsAddTTSLanCodeModalVisible] = useState(false);
  const [newTTSLanCodeKey, setNewTTSLanCodeKey] = useState<string>('');
  const [newTTSLanCodeValue, setNewTTSLanCodeValue] = useState<string>('');

  const [isAddTTSModelIdModalVisible, setIsAddTTSModelIdModalVisible] = useState(false);
  const [newTTSModelIdKey, setNewTTSModelIdKey] = useState<string>('');
  const [newTTSModelIdValue, setNewTTSModelIdValue] = useState<string>('');

  const [isAddTTSVoiceIdModalVisible, setIsAddTTSVoiceIdModalVisible] = useState(false);
  const [newTTSVoiceIdKey, setNewTTSVoiceIdKey] = useState<string>('');
  const [newTTSVoiceIdValue, setNewTTSVoiceIdValue] = useState<string>('');

  const [isDynamicMappingModalVisible, setIsDynamicMappingModalVisible] = useState(false);
  const [newDynamicMappingKey, setNewDynamicMappingKey] = useState<string>('');
  const [newDynamicMappingValue, setNewDynamicMappingValue] = useState<string>('');

  // New modal states for additional sections
  const [isAddSTTServiceModalVisible, setIsAddSTTServiceModalVisible] = useState(false);
  const [newSTTServiceKey, setNewSTTServiceKey] = useState<string>('');
  const [newSTTServiceValue, setNewSTTServiceValue] = useState<string>('');

  const [isAddTTSServiceModalVisible, setIsAddTTSServiceModalVisible] = useState(false);
  const [newTTSServiceKey, setNewTTSServiceKey] = useState<string>('');
  const [newTTSServiceValue, setNewTTSServiceValue] = useState<string>('');

  const [isAddLLMServiceModalVisible, setIsAddLLMServiceModalVisible] = useState(false);
  const [newLLMServiceKey, setNewLLMServiceKey] = useState<string>('');
  const [newLLMServiceValue, setNewLLMServiceValue] = useState<string>('');

  const [isAddAnalysisLLMServiceModalVisible, setIsAddAnalysisLLMServiceModalVisible] = useState(false);
  const [newAnalysisLLMServiceKey, setNewAnalysisLLMServiceKey] = useState<string>('');
  const [newAnalysisLLMServiceValue, setNewAnalysisLLMServiceValue] = useState<string>('');

  const [isAddCallTimeoutModalVisible, setIsAddCallTimeoutModalVisible] = useState(false);
  const [newCallTimeoutKey, setNewCallTimeoutKey] = useState<string>('');
  const [newCallTimeoutValue, setNewCallTimeoutValue] = useState<string>('');

  const [isAddFirstSilenceMsgModalVisible, setIsAddFirstSilenceMsgModalVisible] = useState(false);
  const [newFirstSilenceMsgKey, setNewFirstSilenceMsgKey] = useState<string>('');
  const [newFirstSilenceMsgValue, setNewFirstSilenceMsgValue] = useState<string>('');

  const [isAddFirstSilenceTimeModalVisible, setIsAddFirstSilenceTimeModalVisible] = useState(false);
  const [newFirstSilenceTimeKey, setNewFirstSilenceTimeKey] = useState<string>('');
  const [newFirstSilenceTimeValue, setNewFirstSilenceTimeValue] = useState<string>('');

  const [isAddSecondSilenceTimeModalVisible, setIsAddSecondSilenceTimeModalVisible] = useState(false);
  const [newSecondSilenceTimeKey, setNewSecondSilenceTimeKey] = useState<string>('');
  const [newSecondSilenceTimeValue, setNewSecondSilenceTimeValue] = useState<string>('');

  const [isAddCallEndDelayModalVisible, setIsAddCallEndDelayModalVisible] = useState(false);
  const [newCallEndDelayKey, setNewCallEndDelayKey] = useState<string>('');
  const [newCallEndDelayValue, setNewCallEndDelayValue] = useState<string>('');

  const [isAddFormatValuesLanModalVisible, setIsAddFormatValuesLanModalVisible] = useState(false);
  const [newFormatValuesLanKey, setNewFormatValuesLanKey] = useState<string>('');
  const [newFormatValuesLanValue, setNewFormatValuesLanValue] = useState<string>('');

  const baseUrl = API_BASE_URL;
  const { appendRoomParam, selectedRoom } = useRoomAPI();

  // Available processing methods
  const PROCESSING_METHODS: Record<string, string[]> = {
    'expand_product_abbreviation': [''],
    'format_amount_to_english_words': ['english', 'hindi', 'kannada', 'telugu', 'tamil', 'marathi', 'odia', 'malayalam', 'gujarati'],
    'format_date_to_words': ['english', 'hindi', 'kannada', 'telugu', 'tamil', 'marathi', 'odia', 'malayalam', 'gujarati'],
    'get_last_four_digits_as_words': ['english', 'hindi', 'kannada', 'telugu', 'tamil', 'marathi', 'odia', 'malayalam', 'gujarati'],
    'convert_digits_to_words': ['english', 'hindi', 'kannada', 'telugu', 'tamil', 'marathi', 'odia', 'malayalam', 'gujarati'],
    'to_lowercase': ['']
  };

  // ===== API FUNCTIONS =====

  // Load template list
  const loadTemplateList = async () => {
    try {
      const url = appendRoomParam(`${baseUrl}/templates?basic=true`);
      console.log('Fetching template list from:', url);
      const response = await axiosInstance.get(url);
      console.log('Response status:', response.status, response.statusText);

      const data = response.data;
      console.log('Received data:', data);

      if (data.status === 'success' && data.templates) {
        setTemplateList(data.templates);
        // Keep 'app-template' as default unless it doesn't exist
        const hasAppTemplate = data.templates.some((t: TemplateListItem) => t.name === 'app-template');
        if (!hasAppTemplate && data.templates.length > 0) {
          console.warn('app-template not found, using first available template');
          setSelectedTemplateName(data.templates[0].name);
        }
      } else if (Array.isArray(data)) {
        setTemplateList(data);
        // Keep 'app-template' as default unless it doesn't exist
        const hasAppTemplate = data.some((t: TemplateListItem) => t.name === 'app-template');
        if (!hasAppTemplate && data.length > 0) {
          console.warn('app-template not found, using first available template');
          setSelectedTemplateName(data[0].name);
        }
      } else {
        console.warn('Unexpected data format:', data);
        message.warning('Unexpected response format from server');
      }
    } catch (error) {
      console.error('Failed to load template list:', error);
      if (error instanceof Error) {
        message.error(`Could not load template list: ${error.message}`);
      } else {
        message.error('Could not load template list');
      }
    }
  };

  // Load a specific template
  const loadPromptTemplate = async (name: string) => {
    setLoading(true);
    try {
      const url = appendRoomParam(`${baseUrl}/templates/${name}`);
      console.log('Fetching template:', url);
      const response = await axiosInstance.get(url);
      console.log('Template response status:', response.status, response.statusText);

      const data = response.data;
      console.log('Template data received:', data);

      let template: PromptTemplate | null = null;
      if (data.status === 'success' && data.template) {
        template = data.template;
      } else if (data.template) {
        template = data.template;
      } else {
        template = data;
      }

      // Initialize default values if they don't exist
      if (template) {
        if (!template.format_values) template.format_values = [];
        if (!template.format_values_mapping_methods) template.format_values_mapping_methods = {};
        if (!template.prompts) template.prompts = { default: '' };
        if (!template.analysis_prompts) template.analysis_prompts = { default: '' };
        if (!template.greetings) template.greetings = { default: '' };
        if (!template.stt_lan_codes) template.stt_lan_codes = { default: '' };
        if (!template.tts_lan_codes) template.tts_lan_codes = { default: '' };
        if (!template.tts_model_ids) template.tts_model_ids = { default: '' };
        if (!template.tts_voice_ids) template.tts_voice_ids = { default: '' };
        if (!template.dynamic) {
          template.dynamic = {
            active: false,
            column: '',
            mapping: {}
          };
        }
        console.log('Template loaded successfully:', template.name);
        setCurrentTemplate(template);
      } else {
        console.error('No template found in response');
        message.error('No template data found in response');
      }
    } catch (error) {
      console.error('Failed to load template:', error);
      if (error instanceof Error) {
        message.error(`Could not load template: ${error.message}`);
      } else {
        message.error('Could not load template');
      }
    } finally {
      setLoading(false);
    }
  };

  // Update template using PATCH - only updates changed values without full page refresh
  const patchTemplate = async (name: string, updateData: Partial<PromptTemplate>): Promise<boolean> => {
    setSaving(true);
    try {
      const url = appendRoomParam(`${baseUrl}/templates/${name}`);
      console.log('Patching template:', name, 'with data:', updateData);
      const response = await axiosInstance.patch(url, { update_data: updateData });

      const data = response.data;

      if (data.status === 'success') {
        message.success('Template updated successfully');
        // Update local state instead of reloading entire template
        if (currentTemplate) {
          setCurrentTemplate({
            ...currentTemplate,
            ...updateData
          });
        }
        return true;
      } else {
        throw new Error(data.message || 'Failed to update template');
      }
    } catch (error) {
      if (error instanceof Error) {
        message.error(`Failed to update template: ${error.message}`);
      } else {
        message.error('Failed to update template');
      }
      console.error(error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Fetch required columns from datasheets template
  const fetchRequiredColumns = async () => {
    try {
      const url = appendRoomParam(`${baseUrl}/datasheets-template`);
      const response = await axiosInstance.get(url);
      const data = response.data;

      if (data.status === 'success' && data.template?.required_columns) {
        setRequiredColumns(data.template.required_columns);
      }
    } catch (error) {
      console.error('Failed to load required columns:', error);
      message.warning('Could not load datasheet columns');
    }
  };

  // ===== LIFECYCLE =====

  useEffect(() => {
    loadTemplateList();
    fetchRequiredColumns();
  }, [selectedRoom]);

  useEffect(() => {
    if (selectedTemplateName) {
      loadPromptTemplate(selectedTemplateName);
    }
  }, [selectedTemplateName]);

  // ===== FORMAT VALUES FUNCTIONS =====

  const handleAddFormatValue = async () => {
    if (!newFormatValue.trim()) {
      message.error('Please select a format value');
      return;
    }

    if (!currentTemplate) return;

    // Check if already exists
    if ((currentTemplate.format_values || []).includes(newFormatValue.trim())) {
      message.error('This format value is already added');
      return;
    }

    const updatedFormatValues = [...(currentTemplate.format_values || []), newFormatValue.trim()];

    await patchTemplate(selectedTemplateName, {
      format_values: updatedFormatValues
    });

    setNewFormatValue('');
    setIsAddFormatValueModalVisible(false);
  };

  const handleRemoveFormatValue = async (value: string) => {
    if (!currentTemplate) return;

    const updatedFormatValues = (currentTemplate.format_values || []).filter(v => v !== value);
    const updatedMappingMethods = { ...currentTemplate.format_values_mapping_methods };
    delete updatedMappingMethods[value];

    await patchTemplate(selectedTemplateName, {
      format_values: updatedFormatValues,
      format_values_mapping_methods: updatedMappingMethods
    });
  };

  // ===== PROCESSING METHODS FUNCTIONS =====

  const openProcessingMethodModal = (formatValue: string) => {
    setSelectedFormatValue(formatValue);

    const existingMethod = currentTemplate?.format_values_mapping_methods?.[formatValue];
    if (existingMethod) {
      setSelectedMethod(existingMethod.method);
      setSelectedMethodParam(existingMethod.param || '');
    } else {
      setSelectedMethod('');
      setSelectedMethodParam('');
    }

    setIsProcessingMethodModalVisible(true);
  };

  const handleSaveProcessingMethod = async () => {
    if (!selectedMethod) {
      message.error('Please select a method');
      return;
    }

    if (!currentTemplate) return;

    const updatedMappingMethods = {
      ...currentTemplate.format_values_mapping_methods,
      [selectedFormatValue]: {
        method: selectedMethod,
        param: selectedMethodParam
      }
    };

    await patchTemplate(selectedTemplateName, {
      format_values_mapping_methods: updatedMappingMethods
    });

    setIsProcessingMethodModalVisible(false);
    setSelectedFormatValue('');
    setSelectedMethod('');
    setSelectedMethodParam('');
  };

  const handleRemoveProcessingMethod = async (formatValue: string) => {
    if (!currentTemplate) return;

    const updatedMappingMethods = { ...currentTemplate.format_values_mapping_methods };
    delete updatedMappingMethods[formatValue];

    await patchTemplate(selectedTemplateName, {
      format_values_mapping_methods: updatedMappingMethods
    });
  };

  // ===== PROMPTS FUNCTIONS =====

  const handleAddPromptKey = async () => {
    if (!newPromptKey.trim()) {
      message.error('Prompt key cannot be empty');
      return;
    }

    if (!currentTemplate) return;

    const updatedPrompts = {
      ...currentTemplate.prompts,
      [newPromptKey.trim()]: newPromptValue
    };

    await patchTemplate(selectedTemplateName, {
      prompts: updatedPrompts
    });

    setNewPromptKey('');
    setNewPromptValue('');
    setIsAddPromptKeyModalVisible(false);
  };

  const handleUpdatePrompt = async (key: string, value: string) => {
    if (!currentTemplate) return;

    const updatedPrompts = {
      ...currentTemplate.prompts,
      [key]: value
    };

    await patchTemplate(selectedTemplateName, {
      prompts: updatedPrompts
    });
  };

  const handleRemovePromptKey = async (key: string) => {
    if (!currentTemplate) return;

    const updatedPrompts = { ...currentTemplate.prompts };
    delete updatedPrompts[key];

    await patchTemplate(selectedTemplateName, {
      prompts: updatedPrompts
    });
  };

  // ===== GREETINGS FUNCTIONS =====

  const handleAddGreetingKey = async () => {
    if (!newGreetingKey.trim()) {
      message.error('Greeting key cannot be empty');
      return;
    }

    if (!currentTemplate) return;

    const updatedGreetings = {
      ...currentTemplate.greetings,
      [newGreetingKey.trim()]: newGreetingValue
    };

    await patchTemplate(selectedTemplateName, {
      greetings: updatedGreetings
    });

    setNewGreetingKey('');
    setNewGreetingValue('');
    setIsAddGreetingKeyModalVisible(false);
  };

  const handleUpdateGreeting = async (key: string, value: string) => {
    if (!currentTemplate) return;

    const updatedGreetings = {
      ...currentTemplate.greetings,
      [key]: value
    };

    await patchTemplate(selectedTemplateName, {
      greetings: updatedGreetings
    });
  };

  const handleRemoveGreetingKey = async (key: string) => {
    if (!currentTemplate) return;

    const updatedGreetings = { ...currentTemplate.greetings };
    delete updatedGreetings[key];

    await patchTemplate(selectedTemplateName, {
      greetings: updatedGreetings
    });
  };

  // ===== ANALYSIS PROMPTS FUNCTIONS =====

  const handleAddAnalysisKey = async () => {
    if (!newAnalysisKey.trim()) {
      message.error('Analysis key cannot be empty');
      return;
    }

    if (!currentTemplate) return;

    const updatedAnalysis = {
      ...currentTemplate.analysis_prompts,
      [newAnalysisKey.trim()]: newAnalysisValue
    };

    await patchTemplate(selectedTemplateName, {
      analysis_prompts: updatedAnalysis
    });

    setNewAnalysisKey('');
    setNewAnalysisValue('');
    setIsAddAnalysisKeyModalVisible(false);
  };

  const handleUpdateAnalysis = async (key: string, value: string) => {
    if (!currentTemplate) return;

    const updatedAnalysis = {
      ...currentTemplate.analysis_prompts,
      [key]: value
    };

    await patchTemplate(selectedTemplateName, {
      analysis_prompts: updatedAnalysis
    });
  };

  const handleRemoveAnalysisKey = async (key: string) => {
    if (!currentTemplate) return;

    const updatedAnalysis = { ...currentTemplate.analysis_prompts };
    delete updatedAnalysis[key];

    await patchTemplate(selectedTemplateName, {
      analysis_prompts: updatedAnalysis
    });
  };

  // ===== STT LAN CODES FUNCTIONS =====

  const handleAddSTTLanCode = async () => {
    if (!newSTTLanCodeKey.trim()) {
      message.error('STT Language Code key cannot be empty');
      return;
    }

    if (!currentTemplate) return;

    const updatedSTTLanCodes = {
      ...currentTemplate.stt_lan_codes,
      [newSTTLanCodeKey.trim()]: newSTTLanCodeValue
    };

    await patchTemplate(selectedTemplateName, {
      stt_lan_codes: updatedSTTLanCodes
    });

    setNewSTTLanCodeKey('');
    setNewSTTLanCodeValue('');
    setIsAddSTTLanCodeModalVisible(false);
  };

  const handleUpdateSTTLanCode = async (key: string, value: string) => {
    if (!currentTemplate) return;

    const updatedSTTLanCodes = {
      ...currentTemplate.stt_lan_codes,
      [key]: value
    };

    await patchTemplate(selectedTemplateName, {
      stt_lan_codes: updatedSTTLanCodes
    });
  };

  const handleRemoveSTTLanCodeKey = async (key: string) => {
    if (!currentTemplate) return;

    const updatedSTTLanCodes = { ...currentTemplate.stt_lan_codes };
    delete updatedSTTLanCodes[key];

    await patchTemplate(selectedTemplateName, {
      stt_lan_codes: updatedSTTLanCodes
    });
  };

  // ===== TTS LAN CODES FUNCTIONS =====

  const handleAddTTSLanCode = async () => {
    if (!newTTSLanCodeKey.trim()) {
      message.error('TTS Language Code key cannot be empty');
      return;
    }

    if (!currentTemplate) return;

    const updatedTTSLanCodes = {
      ...currentTemplate.tts_lan_codes,
      [newTTSLanCodeKey.trim()]: newTTSLanCodeValue
    };

    await patchTemplate(selectedTemplateName, {
      tts_lan_codes: updatedTTSLanCodes
    });

    setNewTTSLanCodeKey('');
    setNewTTSLanCodeValue('');
    setIsAddTTSLanCodeModalVisible(false);
  };

  const handleUpdateTTSLanCode = async (key: string, value: string) => {
    if (!currentTemplate) return;

    const updatedTTSLanCodes = {
      ...currentTemplate.tts_lan_codes,
      [key]: value
    };

    await patchTemplate(selectedTemplateName, {
      tts_lan_codes: updatedTTSLanCodes
    });
  };

  const handleRemoveTTSLanCodeKey = async (key: string) => {
    if (!currentTemplate) return;

    const updatedTTSLanCodes = { ...currentTemplate.tts_lan_codes };
    delete updatedTTSLanCodes[key];

    await patchTemplate(selectedTemplateName, {
      tts_lan_codes: updatedTTSLanCodes
    });
  };

  // ===== TTS MODEL IDS FUNCTIONS =====

  const handleAddTTSModelId = async () => {
    if (!newTTSModelIdKey.trim()) {
      message.error('TTS Model ID key cannot be empty');
      return;
    }

    if (!currentTemplate) return;

    const updatedTTSModelIds = {
      ...currentTemplate.tts_model_ids,
      [newTTSModelIdKey.trim()]: newTTSModelIdValue
    };

    await patchTemplate(selectedTemplateName, {
      tts_model_ids: updatedTTSModelIds
    });

    setNewTTSModelIdKey('');
    setNewTTSModelIdValue('');
    setIsAddTTSModelIdModalVisible(false);
  };

  const handleUpdateTTSModelId = async (key: string, value: string) => {
    if (!currentTemplate) return;

    const updatedTTSModelIds = {
      ...currentTemplate.tts_model_ids,
      [key]: value
    };

    await patchTemplate(selectedTemplateName, {
      tts_model_ids: updatedTTSModelIds
    });
  };

  const handleRemoveTTSModelIdKey = async (key: string) => {
    if (!currentTemplate) return;

    const updatedTTSModelIds = { ...currentTemplate.tts_model_ids };
    delete updatedTTSModelIds[key];

    await patchTemplate(selectedTemplateName, {
      tts_model_ids: updatedTTSModelIds
    });
  };

  // ===== TTS VOICE IDS FUNCTIONS =====

  const handleAddTTSVoiceId = async () => {
    if (!newTTSVoiceIdKey.trim()) {
      message.error('TTS Voice ID key cannot be empty');
      return;
    }

    if (!currentTemplate) return;

    const updatedTTSVoiceIds = {
      ...currentTemplate.tts_voice_ids,
      [newTTSVoiceIdKey.trim()]: newTTSVoiceIdValue
    };

    await patchTemplate(selectedTemplateName, {
      tts_voice_ids: updatedTTSVoiceIds
    });

    setNewTTSVoiceIdKey('');
    setNewTTSVoiceIdValue('');
    setIsAddTTSVoiceIdModalVisible(false);
  };

  const handleUpdateTTSVoiceId = async (key: string, value: string) => {
    if (!currentTemplate) return;

    const updatedTTSVoiceIds = {
      ...currentTemplate.tts_voice_ids,
      [key]: value
    };

    await patchTemplate(selectedTemplateName, {
      tts_voice_ids: updatedTTSVoiceIds
    });
  };

  const handleRemoveTTSVoiceIdKey = async (key: string) => {
    if (!currentTemplate) return;

    const updatedTTSVoiceIds = { ...currentTemplate.tts_voice_ids };
    delete updatedTTSVoiceIds[key];

    await patchTemplate(selectedTemplateName, {
      tts_voice_ids: updatedTTSVoiceIds
    });
  };

  // ===== DYNAMIC CONFIGURATION FUNCTIONS =====

  const handleToggleDynamic = async (checked: boolean) => {
    if (!currentTemplate) return;

    await patchTemplate(selectedTemplateName, {
      dynamic: {
        active: checked,
        column: currentTemplate.dynamic?.column || '',
        mapping: currentTemplate.dynamic?.mapping || {}
      }
    });
  };

  const handleUpdateDynamicColumn = async (column: string) => {
    if (!currentTemplate) return;

    await patchTemplate(selectedTemplateName, {
      dynamic: {
        active: currentTemplate.dynamic?.active || false,
        column: column,
        mapping: currentTemplate.dynamic?.mapping || {}
      }
    });
  };

  const handleAddDynamicMapping = async () => {
    if (!newDynamicMappingKey.trim() || !newDynamicMappingValue.trim()) {
      message.error('Both key and value are required');
      return;
    }

    if (!currentTemplate) return;

    const updatedMapping = {
      ...currentTemplate.dynamic?.mapping,
      [newDynamicMappingKey.trim()]: newDynamicMappingValue.trim()
    };

    await patchTemplate(selectedTemplateName, {
      dynamic: {
        active: currentTemplate.dynamic?.active || false,
        column: currentTemplate.dynamic?.column || '',
        mapping: updatedMapping
      }
    });

    setNewDynamicMappingKey('');
    setNewDynamicMappingValue('');
    setIsDynamicMappingModalVisible(false);
  };

  const handleRemoveDynamicMapping = async (key: string) => {
    if (!currentTemplate) return;

    const updatedMapping = { ...currentTemplate.dynamic?.mapping };
    delete updatedMapping[key];

    await patchTemplate(selectedTemplateName, {
      dynamic: {
        active: currentTemplate.dynamic?.active || false,
        column: currentTemplate.dynamic?.column || '',
        mapping: updatedMapping
      }
    });
  };

  // ===== STT SERVICES FUNCTIONS =====

  const handleAddSTTService = async () => {
    if (!newSTTServiceKey.trim()) {
      message.error('STT Service key cannot be empty');
      return;
    }
    if (!currentTemplate) return;

    const updatedSTTServices = {
      ...currentTemplate.stt_services,
      [newSTTServiceKey.trim()]: newSTTServiceValue
    };

    await patchTemplate(selectedTemplateName, { stt_services: updatedSTTServices });
    setNewSTTServiceKey('');
    setNewSTTServiceValue('');
    setIsAddSTTServiceModalVisible(false);
  };

  const handleUpdateSTTService = async (key: string, value: string) => {
    if (!currentTemplate) return;
    const updatedSTTServices = { ...currentTemplate.stt_services, [key]: value };
    await patchTemplate(selectedTemplateName, { stt_services: updatedSTTServices });
  };

  const handleRemoveSTTService = async (key: string) => {
    if (!currentTemplate) return;
    const updatedSTTServices = { ...currentTemplate.stt_services };
    delete updatedSTTServices[key];
    await patchTemplate(selectedTemplateName, { stt_services: updatedSTTServices });
  };

  // ===== TTS SERVICES FUNCTIONS =====

  const handleAddTTSService = async () => {
    if (!newTTSServiceKey.trim()) {
      message.error('TTS Service key cannot be empty');
      return;
    }
    if (!currentTemplate) return;

    const updatedTTSServices = {
      ...currentTemplate.tts_services,
      [newTTSServiceKey.trim()]: newTTSServiceValue
    };

    await patchTemplate(selectedTemplateName, { tts_services: updatedTTSServices });
    setNewTTSServiceKey('');
    setNewTTSServiceValue('');
    setIsAddTTSServiceModalVisible(false);
  };

  const handleUpdateTTSService = async (key: string, value: string) => {
    if (!currentTemplate) return;
    const updatedTTSServices = { ...currentTemplate.tts_services, [key]: value };
    await patchTemplate(selectedTemplateName, { tts_services: updatedTTSServices });
  };

  const handleRemoveTTSService = async (key: string) => {
    if (!currentTemplate) return;
    const updatedTTSServices = { ...currentTemplate.tts_services };
    delete updatedTTSServices[key];
    await patchTemplate(selectedTemplateName, { tts_services: updatedTTSServices });
  };

  // ===== LLM SERVICES FUNCTIONS =====

  const handleAddLLMService = async () => {
    if (!newLLMServiceKey.trim()) {
      message.error('LLM Service key cannot be empty');
      return;
    }
    if (!currentTemplate) return;

    const updatedLLMServices = {
      ...currentTemplate.llm_services,
      [newLLMServiceKey.trim()]: newLLMServiceValue
    };

    await patchTemplate(selectedTemplateName, { llm_services: updatedLLMServices });
    setNewLLMServiceKey('');
    setNewLLMServiceValue('');
    setIsAddLLMServiceModalVisible(false);
  };

  const handleUpdateLLMService = async (key: string, value: string) => {
    if (!currentTemplate) return;
    const updatedLLMServices = { ...currentTemplate.llm_services, [key]: value };
    await patchTemplate(selectedTemplateName, { llm_services: updatedLLMServices });
  };

  const handleRemoveLLMService = async (key: string) => {
    if (!currentTemplate) return;
    const updatedLLMServices = { ...currentTemplate.llm_services };
    delete updatedLLMServices[key];
    await patchTemplate(selectedTemplateName, { llm_services: updatedLLMServices });
  };

  // ===== ANALYSIS LLM SERVICES FUNCTIONS =====

  const handleAddAnalysisLLMService = async () => {
    if (!newAnalysisLLMServiceKey.trim()) {
      message.error('Analysis LLM Service key cannot be empty');
      return;
    }
    if (!currentTemplate) return;

    const updatedAnalysisLLMServices = {
      ...currentTemplate.analysis_llm_services,
      [newAnalysisLLMServiceKey.trim()]: newAnalysisLLMServiceValue
    };

    await patchTemplate(selectedTemplateName, { analysis_llm_services: updatedAnalysisLLMServices });
    setNewAnalysisLLMServiceKey('');
    setNewAnalysisLLMServiceValue('');
    setIsAddAnalysisLLMServiceModalVisible(false);
  };

  const handleUpdateAnalysisLLMService = async (key: string, value: string) => {
    if (!currentTemplate) return;
    const updatedAnalysisLLMServices = { ...currentTemplate.analysis_llm_services, [key]: value };
    await patchTemplate(selectedTemplateName, { analysis_llm_services: updatedAnalysisLLMServices });
  };

  const handleRemoveAnalysisLLMService = async (key: string) => {
    if (!currentTemplate) return;
    const updatedAnalysisLLMServices = { ...currentTemplate.analysis_llm_services };
    delete updatedAnalysisLLMServices[key];
    await patchTemplate(selectedTemplateName, { analysis_llm_services: updatedAnalysisLLMServices });
  };

  // ===== CALL TIMEOUTS FUNCTIONS =====

  const handleAddCallTimeout = async () => {
    if (!newCallTimeoutKey.trim()) {
      message.error('Call Timeout key cannot be empty');
      return;
    }
    if (!currentTemplate) return;

    const updatedCallTimeouts = {
      ...currentTemplate.call_timeouts,
      [newCallTimeoutKey.trim()]: newCallTimeoutValue === '' ? '' : Number(newCallTimeoutValue)
    };

    await patchTemplate(selectedTemplateName, { call_timeouts: updatedCallTimeouts });
    setNewCallTimeoutKey('');
    setNewCallTimeoutValue('');
    setIsAddCallTimeoutModalVisible(false);
  };

  const handleUpdateCallTimeout = async (key: string, value: string) => {
    if (!currentTemplate) return;
    const updatedCallTimeouts = {
      ...currentTemplate.call_timeouts,
      [key]: value === '' ? '' : Number(value)
    };
    await patchTemplate(selectedTemplateName, { call_timeouts: updatedCallTimeouts });
  };

  const handleRemoveCallTimeout = async (key: string) => {
    if (!currentTemplate) return;
    const updatedCallTimeouts = { ...currentTemplate.call_timeouts };
    delete updatedCallTimeouts[key];
    await patchTemplate(selectedTemplateName, { call_timeouts: updatedCallTimeouts });
  };

  // ===== FIRST SILENCE MSGS FUNCTIONS =====

  const handleAddFirstSilenceMsg = async () => {
    if (!newFirstSilenceMsgKey.trim()) {
      message.error('First Silence Msg key cannot be empty');
      return;
    }
    if (!currentTemplate) return;

    const updatedFirstSilenceMsgs = {
      ...currentTemplate.first_silence_msgs,
      [newFirstSilenceMsgKey.trim()]: newFirstSilenceMsgValue || null
    };

    await patchTemplate(selectedTemplateName, { first_silence_msgs: updatedFirstSilenceMsgs });
    setNewFirstSilenceMsgKey('');
    setNewFirstSilenceMsgValue('');
    setIsAddFirstSilenceMsgModalVisible(false);
  };

  const handleUpdateFirstSilenceMsg = async (key: string, value: string) => {
    if (!currentTemplate) return;
    const updatedFirstSilenceMsgs = {
      ...currentTemplate.first_silence_msgs,
      [key]: value || null
    };
    await patchTemplate(selectedTemplateName, { first_silence_msgs: updatedFirstSilenceMsgs });
  };

  const handleRemoveFirstSilenceMsg = async (key: string) => {
    if (!currentTemplate) return;
    const updatedFirstSilenceMsgs = { ...currentTemplate.first_silence_msgs };
    delete updatedFirstSilenceMsgs[key];
    await patchTemplate(selectedTemplateName, { first_silence_msgs: updatedFirstSilenceMsgs });
  };

  // ===== FIRST SILENCE TIMES FUNCTIONS =====

  const handleAddFirstSilenceTime = async () => {
    if (!newFirstSilenceTimeKey.trim()) {
      message.error('First Silence Time key cannot be empty');
      return;
    }
    if (!currentTemplate) return;

    const updatedFirstSilenceTimes = {
      ...currentTemplate.first_silence_times,
      [newFirstSilenceTimeKey.trim()]: Number(newFirstSilenceTimeValue) || 0
    };

    await patchTemplate(selectedTemplateName, { first_silence_times: updatedFirstSilenceTimes });
    setNewFirstSilenceTimeKey('');
    setNewFirstSilenceTimeValue('');
    setIsAddFirstSilenceTimeModalVisible(false);
  };

  const handleUpdateFirstSilenceTime = async (key: string, value: string) => {
    if (!currentTemplate) return;
    const updatedFirstSilenceTimes = {
      ...currentTemplate.first_silence_times,
      [key]: Number(value) || 0
    };
    await patchTemplate(selectedTemplateName, { first_silence_times: updatedFirstSilenceTimes });
  };

  const handleRemoveFirstSilenceTime = async (key: string) => {
    if (!currentTemplate) return;
    const updatedFirstSilenceTimes = { ...currentTemplate.first_silence_times };
    delete updatedFirstSilenceTimes[key];
    await patchTemplate(selectedTemplateName, { first_silence_times: updatedFirstSilenceTimes });
  };

  // ===== SECOND SILENCE TIMES FUNCTIONS =====

  const handleAddSecondSilenceTime = async () => {
    if (!newSecondSilenceTimeKey.trim()) {
      message.error('Second Silence Time key cannot be empty');
      return;
    }
    if (!currentTemplate) return;

    const updatedSecondSilenceTimes = {
      ...currentTemplate.second_silence_times,
      [newSecondSilenceTimeKey.trim()]: Number(newSecondSilenceTimeValue) || 0
    };

    await patchTemplate(selectedTemplateName, { second_silence_times: updatedSecondSilenceTimes });
    setNewSecondSilenceTimeKey('');
    setNewSecondSilenceTimeValue('');
    setIsAddSecondSilenceTimeModalVisible(false);
  };

  const handleUpdateSecondSilenceTime = async (key: string, value: string) => {
    if (!currentTemplate) return;
    const updatedSecondSilenceTimes = {
      ...currentTemplate.second_silence_times,
      [key]: Number(value) || 0
    };
    await patchTemplate(selectedTemplateName, { second_silence_times: updatedSecondSilenceTimes });
  };

  const handleRemoveSecondSilenceTime = async (key: string) => {
    if (!currentTemplate) return;
    const updatedSecondSilenceTimes = { ...currentTemplate.second_silence_times };
    delete updatedSecondSilenceTimes[key];
    await patchTemplate(selectedTemplateName, { second_silence_times: updatedSecondSilenceTimes });
  };

  // ===== CALL END DELAYS FUNCTIONS =====

  const handleAddCallEndDelay = async () => {
    if (!newCallEndDelayKey.trim()) {
      message.error('Call End Delay key cannot be empty');
      return;
    }
    if (!currentTemplate) return;

    const updatedCallEndDelays = {
      ...currentTemplate.call_end_delays,
      [newCallEndDelayKey.trim()]: Number(newCallEndDelayValue) || 0
    };

    await patchTemplate(selectedTemplateName, { call_end_delays: updatedCallEndDelays });
    setNewCallEndDelayKey('');
    setNewCallEndDelayValue('');
    setIsAddCallEndDelayModalVisible(false);
  };

  const handleUpdateCallEndDelay = async (key: string, value: string) => {
    if (!currentTemplate) return;
    const updatedCallEndDelays = {
      ...currentTemplate.call_end_delays,
      [key]: Number(value) || 0
    };
    await patchTemplate(selectedTemplateName, { call_end_delays: updatedCallEndDelays });
  };

  const handleRemoveCallEndDelay = async (key: string) => {
    if (!currentTemplate) return;
    const updatedCallEndDelays = { ...currentTemplate.call_end_delays };
    delete updatedCallEndDelays[key];
    await patchTemplate(selectedTemplateName, { call_end_delays: updatedCallEndDelays });
  };

  // ===== FORMAT VALUES LAN FUNCTIONS =====

  const handleAddFormatValuesLan = async () => {
    if (!newFormatValuesLanKey.trim()) {
      message.error('Format Values Lan key cannot be empty');
      return;
    }
    if (!currentTemplate) return;

    const updatedFormatValuesLan = {
      ...currentTemplate.format_values_lan,
      [newFormatValuesLanKey.trim()]: newFormatValuesLanValue
    };

    await patchTemplate(selectedTemplateName, { format_values_lan: updatedFormatValuesLan });
    setNewFormatValuesLanKey('');
    setNewFormatValuesLanValue('');
    setIsAddFormatValuesLanModalVisible(false);
  };

  const handleUpdateFormatValuesLan = async (key: string, value: string) => {
    if (!currentTemplate) return;
    const updatedFormatValuesLan = { ...currentTemplate.format_values_lan, [key]: value };
    await patchTemplate(selectedTemplateName, { format_values_lan: updatedFormatValuesLan });
  };

  const handleRemoveFormatValuesLan = async (key: string) => {
    if (!currentTemplate) return;
    const updatedFormatValuesLan = { ...currentTemplate.format_values_lan };
    delete updatedFormatValuesLan[key];
    await patchTemplate(selectedTemplateName, { format_values_lan: updatedFormatValuesLan });
  };

  // ===== SMS TOGGLE FUNCTION =====

  const handleToggleSMS = async (checked: boolean) => {
    if (!currentTemplate) return;
    await patchTemplate(selectedTemplateName, { sms: checked });
  };

  const handleUpdateGeneralSetting = async (field: string, value: string) => {
    if (!currentTemplate) return;
    await patchTemplate(selectedTemplateName, { [field]: value });
  };

  const handleToggleRubricAnalytics = async (checked: boolean) => {
    if (!currentTemplate) return;
    await patchTemplate(selectedTemplateName, { rubric_analytics_enabled: checked });
  };

  const handleUpdateRubricAnalyticsSetting = async (field: string, value: string) => {
    if (!currentTemplate) return;
    await patchTemplate(selectedTemplateName, { [field]: value });
  };

  const handleRubricParameterChange = (
    index: number,
    field: keyof RubricParameterConfig,
    value: string | number | boolean
  ) => {
    if (!currentTemplate) return;

    const nextParameters = [...(currentTemplate.rubric_parameters || [])];
    nextParameters[index] = {
      ...nextParameters[index],
      [field]: value,
    };

    setCurrentTemplate({
      ...currentTemplate,
      rubric_parameters: nextParameters,
    });
  };

  const handleAddRubricParameter = () => {
    if (!currentTemplate) return;

    setCurrentTemplate({
      ...currentTemplate,
      rubric_parameters: [
        ...(currentTemplate.rubric_parameters || []),
        {
          name: '',
          weight: 0,
          enabled: true,
          description: '',
        },
      ],
    });
  };

  const handleRemoveRubricParameter = (index: number) => {
    if (!currentTemplate) return;

    setCurrentTemplate({
      ...currentTemplate,
      rubric_parameters: (currentTemplate.rubric_parameters || []).filter((_, itemIndex) => itemIndex !== index),
    });
  };

  const handleSaveRubricParameters = async () => {
    if (!currentTemplate) return;
    await patchTemplate(selectedTemplateName, {
      rubric_parameters: currentTemplate.rubric_parameters || [],
    });
  };

  // ===== RENDER FUNCTIONS =====

  const renderFormatValuesSection = () => {
    if (!currentTemplate) return null;

    const formatValues = currentTemplate.format_values || [];
    const mappingMethods = currentTemplate.format_values_mapping_methods || {};

    const columns = [
      {
        title: 'Format Value',
        dataIndex: 'value',
        key: 'value',
        width: '30%',
        render: (text: string) => <Tag color="blue">{text}</Tag>
      },
      {
        title: 'Processing Method',
        key: 'method',
        width: '40%',
        render: (_: any, record: any) => {
          const method = mappingMethods[record.value];
          return method ? (
            <Space>
              <Tag color="green">{method.method}</Tag>
              {method.param && <Tag color="orange">{method.param}</Tag>}
            </Space>
          ) : (
            <Text type="secondary">No method configured</Text>
          );
        }
      },
      {
        title: 'Actions',
        key: 'actions',
        width: '30%',
        render: (_: any, record: any) => (
          <Space>
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openProcessingMethodModal(record.value)}
            >
              {mappingMethods[record.value] ? 'Edit Method' : 'Add Method'}
            </Button>
            {mappingMethods[record.value] && (
              <Button
                size="small"
                danger
                onClick={() => handleRemoveProcessingMethod(record.value)}
              >
                Remove Method
              </Button>
            )}
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleRemoveFormatValue(record.value)}
            >
              Delete
            </Button>
          </Space>
        )
      }
    ];

    const dataSource = formatValues.map(value => ({ key: value, value }));

    return (
      <div>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={5} style={{ margin: 0 }}>Format Values Configuration</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsAddFormatValueModalVisible(true)}
          >
            Add Format Value
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          size="small"
          bordered
        />
      </div>
    );
  };

  const renderRubricAnalyticsSection = () => {
    if (!currentTemplate) return null;
    const rubricParameters = currentTemplate.rubric_parameters || [];

    const rubricParameterColumns = [
      {
        title: 'Parameter',
        key: 'name',
        render: (_: unknown, record: RubricParameterConfig & { key: number }) => (
          <Input
            value={record.name}
            onChange={(e) => handleRubricParameterChange(record.key, 'name', e.target.value)}
            placeholder="Enter parameter name"
          />
        ),
      },
      {
        title: 'Weight',
        key: 'weight',
        width: 140,
        render: (_: unknown, record: RubricParameterConfig & { key: number }) => (
          <InputNumber
            min={0}
            max={100}
            value={record.weight}
            onChange={(value) => handleRubricParameterChange(record.key, 'weight', Number(value ?? 0))}
            style={{ width: '100%' }}
          />
        ),
      },
      {
        title: 'Enabled',
        key: 'enabled',
        width: 140,
        render: (_: unknown, record: RubricParameterConfig & { key: number }) => (
          <Switch
            checked={record.enabled ?? true}
            onChange={(checked) => handleRubricParameterChange(record.key, 'enabled', checked)}
          />
        ),
      },
      {
        title: 'Description',
        key: 'description',
        render: (_: unknown, record: RubricParameterConfig & { key: number }) => (
          <Input
            value={record.description || ''}
            onChange={(e) => handleRubricParameterChange(record.key, 'description', e.target.value)}
            placeholder="Optional explanation"
          />
        ),
      },
      {
        title: 'Action',
        key: 'action',
        width: 120,
        render: (_: unknown, record: RubricParameterConfig & { key: number }) => (
          <Button danger icon={<DeleteOutlined />} onClick={() => handleRemoveRubricParameter(record.key)}>
            Delete
          </Button>
        ),
      },
    ];

    return (
      <div>
        <Title level={5} style={{ marginBottom: 16 }}>Rubric Analytics Settings</Title>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Row gutter={[16, 16]} align="middle">
            <Col span={6}>
              <Text strong>Rubric Analytics:</Text>
            </Col>
            <Col span={18}>
              <Switch
                checked={currentTemplate.rubric_analytics_enabled ?? true}
                onChange={handleToggleRubricAnalytics}
                checkedChildren="Enabled"
                unCheckedChildren="Disabled"
              />
              <Text type="secondary" style={{ marginLeft: 16 }}>
                Enable rubric evaluation and analytics settings for this template
              </Text>
            </Col>
          </Row>

          <Row gutter={[16, 16]} align="middle">
            <Col span={6}>
              <Text strong>Rubric File:</Text>
            </Col>
            <Col span={12}>
              <Input
                value={currentTemplate.rubric_file || ''}
                onChange={(e) => setCurrentTemplate({ ...currentTemplate, rubric_file: e.target.value })}
                placeholder="Enter rubric file name"
              />
            </Col>
            <Col span={6}>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={() => handleUpdateRubricAnalyticsSetting('rubric_file', currentTemplate.rubric_file || '')}
                loading={saving}
              >
                Save
              </Button>
            </Col>
          </Row>

          <Row gutter={[16, 16]} align="middle">
            <Col span={6}>
              <Text strong>Rubric Sheet:</Text>
            </Col>
            <Col span={12}>
              <Input
                value={currentTemplate.rubric_sheet || ''}
                onChange={(e) => setCurrentTemplate({ ...currentTemplate, rubric_sheet: e.target.value })}
                placeholder="Enter rubric sheet name"
              />
            </Col>
            <Col span={6}>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={() => handleUpdateRubricAnalyticsSetting('rubric_sheet', currentTemplate.rubric_sheet || '')}
                loading={saving}
              >
                Save
              </Button>
            </Col>
          </Row>

          <Row gutter={[16, 16]} align="middle">
            <Col span={6}>
              <Text strong>Grader:</Text>
            </Col>
            <Col span={12}>
              <Input
                value={currentTemplate.grader || ''}
                onChange={(e) => setCurrentTemplate({ ...currentTemplate, grader: e.target.value })}
                placeholder="Enter grader type"
              />
            </Col>
            <Col span={6}>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={() => handleUpdateRubricAnalyticsSetting('grader', currentTemplate.grader || '')}
                loading={saving}
              >
                Save
              </Button>
            </Col>
          </Row>

          <Row gutter={[16, 16]} align="middle">
            <Col span={6}>
              <Text strong>Model:</Text>
            </Col>
            <Col span={12}>
              <Input
                value={currentTemplate.model || ''}
                onChange={(e) => setCurrentTemplate({ ...currentTemplate, model: e.target.value })}
                placeholder="Enter model name"
              />
            </Col>
            <Col span={6}>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={() => handleUpdateRubricAnalyticsSetting('model', currentTemplate.model || '')}
                loading={saving}
              >
                Save
              </Button>
            </Col>
          </Row>

          <Alert
            message="Rubric Analytics Configuration"
            description="These settings are stored on the selected template and can be used by rubric evaluation flows to control which rubric file, sheet, grader, and model should be used."
            type="info"
            showIcon
          />

          <Divider style={{ margin: '8px 0' }} />

          <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={5} style={{ margin: 0 }}>Rubric Parameters and Weights</Title>
              <Space>
                <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddRubricParameter}>
                  Add Parameter
                </Button>
                <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveRubricParameters} loading={saving}>
                  Save Parameters
                </Button>
              </Space>
            </div>

            <Table
              columns={rubricParameterColumns}
              dataSource={rubricParameters.map((item, index) => ({ ...item, key: index }))}
              pagination={false}
              size="small"
              bordered
              locale={{ emptyText: 'No rubric parameters configured yet' }}
            />
            <Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
              Use this list to define which rubric parameters are scored and what weight each one contributes.
            </Text>
          </div>
        </Space>
      </div>
    );
  };

  const renderPromptsSection = () => {
    if (!currentTemplate) return null;

    const prompts = currentTemplate.prompts || {};

    return (
      <div>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={5} style={{ margin: 0 }}>Prompts Configuration</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsAddPromptKeyModalVisible(true)}
          >
            Add Prompt Key
          </Button>
        </div>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {Object.entries(prompts).map(([key, value]) => (
            <Card key={key} size="small" type="inner">
              <Row gutter={[16, 16]} align="middle">
                <Col span={4}>
                  <Tag color="purple">{key}</Tag>
                </Col>
                <Col span={16}>
                  <TextArea
                    value={value}
                    onChange={(e) => {
                      setCurrentTemplate({
                        ...currentTemplate,
                        prompts: {
                          ...currentTemplate.prompts,
                          [key]: e.target.value
                        }
                      });
                    }}
                    rows={3}
                    placeholder={`Enter prompt for ${key}`}
                  />
                </Col>
                <Col span={4}>
                  <Space>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      onClick={() => handleUpdatePrompt(key, prompts[key])}
                      loading={saving}
                    >
                      Save
                    </Button>
                    {key !== 'default' && (
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemovePromptKey(key)}
                      >
                        Delete
                      </Button>
                    )}
                  </Space>
                </Col>
              </Row>
            </Card>
          ))}
        </Space>
      </div>
    );
  };

  const renderGreetingsSection = () => {
    if (!currentTemplate) return null;

    const greetings = currentTemplate.greetings || {};

    return (
      <div>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={5} style={{ margin: 0 }}>Greetings Configuration</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsAddGreetingKeyModalVisible(true)}
          >
            Add Greeting Key
          </Button>
        </div>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {Object.entries(greetings).map(([key, value]) => (
            <Card key={key} size="small" type="inner">
              <Row gutter={[16, 16]} align="middle">
                <Col span={4}>
                  <Tag color="cyan">{key}</Tag>
                </Col>
                <Col span={16}>
                  <TextArea
                    value={value}
                    onChange={(e) => {
                      setCurrentTemplate({
                        ...currentTemplate,
                        greetings: {
                          ...currentTemplate.greetings,
                          [key]: e.target.value
                        }
                      });
                    }}
                    rows={3}
                    placeholder={`Enter greeting for ${key}`}
                  />
                </Col>
                <Col span={4}>
                  <Space>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      onClick={() => handleUpdateGreeting(key, greetings[key])}
                      loading={saving}
                    >
                      Save
                    </Button>
                    {key !== 'default' && (
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveGreetingKey(key)}
                      >
                        Delete
                      </Button>
                    )}
                  </Space>
                </Col>
              </Row>
            </Card>
          ))}
        </Space>
      </div>
    );
  };

  const renderAnalysisPromptsSection = () => {
    if (!currentTemplate) return null;

    const analysisPrompts = currentTemplate.analysis_prompts || {};

    return (
      <div>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={5} style={{ margin: 0 }}>Analysis Prompts Configuration</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsAddAnalysisKeyModalVisible(true)}
          >
            Add Analysis Key
          </Button>
        </div>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {Object.entries(analysisPrompts).map(([key, value]) => (
            <Card key={key} size="small" type="inner">
              <Row gutter={[16, 16]} align="middle">
                <Col span={4}>
                  <Tag color="magenta">{key}</Tag>
                </Col>
                <Col span={16}>
                  <TextArea
                    value={value}
                    onChange={(e) => {
                      setCurrentTemplate({
                        ...currentTemplate,
                        analysis_prompts: {
                          ...currentTemplate.analysis_prompts,
                          [key]: e.target.value
                        }
                      });
                    }}
                    rows={3}
                    placeholder={`Enter analysis prompt for ${key}`}
                  />
                </Col>
                <Col span={4}>
                  <Space>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      onClick={() => handleUpdateAnalysis(key, analysisPrompts[key])}
                      loading={saving}
                    >
                      Save
                    </Button>
                    {key !== 'default' && (
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveAnalysisKey(key)}
                      >
                        Delete
                      </Button>
                    )}
                  </Space>
                </Col>
              </Row>
            </Card>
          ))}
        </Space>
      </div>
    );
  };

  const renderSTTLanCodesSection = () => {
    if (!currentTemplate) return null;

    const sttLanCodes = currentTemplate.stt_lan_codes || {};

    return (
      <div>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={5} style={{ margin: 0 }}>STT Language Codes Configuration</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsAddSTTLanCodeModalVisible(true)}
          >
            Add STT Language Code
          </Button>
        </div>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {Object.entries(sttLanCodes).map(([key, value]) => (
            <Card key={key} size="small" type="inner">
              <Row gutter={[16, 16]} align="middle">
                <Col span={4}>
                  <Tag color="geekblue">{key}</Tag>
                </Col>
                <Col span={16}>
                  <Input
                    value={value}
                    onChange={(e) => {
                      setCurrentTemplate({
                        ...currentTemplate,
                        stt_lan_codes: {
                          ...currentTemplate.stt_lan_codes,
                          [key]: e.target.value
                        }
                      });
                    }}
                    placeholder={`Enter STT language code for ${key}`}
                  />
                </Col>
                <Col span={4}>
                  <Space>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      onClick={() => handleUpdateSTTLanCode(key, sttLanCodes[key])}
                      loading={saving}
                    >
                      Save
                    </Button>
                    {key !== 'default' && (
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveSTTLanCodeKey(key)}
                      >
                        Delete
                      </Button>
                    )}
                  </Space>
                </Col>
              </Row>
            </Card>
          ))}
        </Space>
      </div>
    );
  };

  const renderTTSLanCodesSection = () => {
    if (!currentTemplate) return null;

    const ttsLanCodes = currentTemplate.tts_lan_codes || {};

    return (
      <div>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={5} style={{ margin: 0 }}>TTS Language Codes Configuration</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsAddTTSLanCodeModalVisible(true)}
          >
            Add TTS Language Code
          </Button>
        </div>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {Object.entries(ttsLanCodes).map(([key, value]) => (
            <Card key={key} size="small" type="inner">
              <Row gutter={[16, 16]} align="middle">
                <Col span={4}>
                  <Tag color="blue">{key}</Tag>
                </Col>
                <Col span={16}>
                  <Input
                    value={value}
                    onChange={(e) => {
                      setCurrentTemplate({
                        ...currentTemplate,
                        tts_lan_codes: {
                          ...currentTemplate.tts_lan_codes,
                          [key]: e.target.value
                        }
                      });
                    }}
                    placeholder={`Enter TTS language code for ${key}`}
                  />
                </Col>
                <Col span={4}>
                  <Space>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      onClick={() => handleUpdateTTSLanCode(key, ttsLanCodes[key])}
                      loading={saving}
                    >
                      Save
                    </Button>
                    {key !== 'default' && (
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveTTSLanCodeKey(key)}
                      >
                        Delete
                      </Button>
                    )}
                  </Space>
                </Col>
              </Row>
            </Card>
          ))}
        </Space>
      </div>
    );
  };

  const renderTTSModelIdsSection = () => {
    if (!currentTemplate) return null;

    const ttsModelIds = currentTemplate.tts_model_ids || {};

    return (
      <div>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={5} style={{ margin: 0 }}>TTS Model IDs Configuration</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsAddTTSModelIdModalVisible(true)}
          >
            Add TTS Model ID
          </Button>
        </div>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {Object.entries(ttsModelIds).map(([key, value]) => (
            <Card key={key} size="small" type="inner">
              <Row gutter={[16, 16]} align="middle">
                <Col span={4}>
                  <Tag color="orange">{key}</Tag>
                </Col>
                <Col span={16}>
                  <Input
                    value={value}
                    onChange={(e) => {
                      setCurrentTemplate({
                        ...currentTemplate,
                        tts_model_ids: {
                          ...currentTemplate.tts_model_ids,
                          [key]: e.target.value
                        }
                      });
                    }}
                    placeholder={`Enter TTS model ID for ${key}`}
                  />
                </Col>
                <Col span={4}>
                  <Space>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      onClick={() => handleUpdateTTSModelId(key, ttsModelIds[key])}
                      loading={saving}
                    >
                      Save
                    </Button>
                    {key !== 'default' && (
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveTTSModelIdKey(key)}
                      >
                        Delete
                      </Button>
                    )}
                  </Space>
                </Col>
              </Row>
            </Card>
          ))}
        </Space>
      </div>
    );
  };

  const renderTTSVoiceIdsSection = () => {
    if (!currentTemplate) return null;

    const ttsVoiceIds = currentTemplate.tts_voice_ids || {};

    return (
      <div>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={5} style={{ margin: 0 }}>TTS Voice IDs Configuration</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsAddTTSVoiceIdModalVisible(true)}
          >
            Add TTS Voice ID
          </Button>
        </div>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {Object.entries(ttsVoiceIds).map(([key, value]) => (
            <Card key={key} size="small" type="inner">
              <Row gutter={[16, 16]} align="middle">
                <Col span={4}>
                  <Tag color="volcano">{key}</Tag>
                </Col>
                <Col span={16}>
                  <Input
                    value={value}
                    onChange={(e) => {
                      setCurrentTemplate({
                        ...currentTemplate,
                        tts_voice_ids: {
                          ...currentTemplate.tts_voice_ids,
                          [key]: e.target.value
                        }
                      });
                    }}
                    placeholder={`Enter TTS voice ID for ${key}`}
                  />
                </Col>
                <Col span={4}>
                  <Space>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      onClick={() => handleUpdateTTSVoiceId(key, ttsVoiceIds[key])}
                      loading={saving}
                    >
                      Save
                    </Button>
                    {key !== 'default' && (
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveTTSVoiceIdKey(key)}
                      >
                        Delete
                      </Button>
                    )}
                  </Space>
                </Col>
              </Row>
            </Card>
          ))}
        </Space>
      </div>
    );
  };

  const renderDynamicConfigSection = () => {
    if (!currentTemplate) return null;

    const dynamic = currentTemplate.dynamic || { active: false, column: '', mapping: {} };

    return (
      <div>
        <Title level={5} style={{ marginBottom: 16 }}>Dynamic Configuration</Title>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Active Toggle */}
          <Row gutter={[16, 16]} align="middle">
            <Col span={6}>
              <Text strong>Active:</Text>
            </Col>
            <Col span={18}>
              <Switch
                checked={dynamic.active}
                onChange={handleToggleDynamic}
                checkedChildren="Enabled"
                unCheckedChildren="Disabled"
              />
              <Text type="secondary" style={{ marginLeft: 16 }}>
                Enable dynamic prompt/greeting selection based on datasheet column
              </Text>
            </Col>
          </Row>

          <Divider />

          {/* Column Selection */}
          <Row gutter={[16, 16]} align="middle">
            <Col span={6}>
              <Text strong>Column:</Text>
            </Col>
            <Col span={18}>
              <Select
                showSearch
                style={{ width: '100%' }}
                value={dynamic.column}
                onChange={handleUpdateDynamicColumn}
                placeholder="Select column from datasheet template for dynamic mapping"
                disabled={!dynamic.active}
                filterOption={(input, option) =>
                  (option?.children?.toString() || '').toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {requiredColumns.map(column => (
                  <Option key={column} value={column}>
                    {column}
                  </Option>
                ))}
              </Select>
              <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                {requiredColumns.length === 0
                  ? 'Loading available columns...'
                  : `Select a datasheet column to determine which prompt/greeting variant to use (${requiredColumns.length} columns available)`}
              </Text>
            </Col>
          </Row>

          <Divider />

          {/* Mapping Configuration */}
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Text strong>Mapping:</Text>
            </Col>
            <Col span={18}>
              <Card
                size="small"
                extra={
                  <Button
                    size="small"
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsDynamicMappingModalVisible(true)}
                    disabled={!dynamic.active}
                  >
                    Add Mapping
                  </Button>
                }
              >
                {Object.keys(dynamic.mapping || {}).length === 0 ? (
                  <Text type="secondary">No mappings configured</Text>
                ) : (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {Object.entries(dynamic.mapping).map(([key, value]) => (
                      <Row key={key} gutter={[8, 8]} align="middle">
                        <Col span={10}>
                          <Tag color="blue">{key}</Tag>
                        </Col>
                        <Col span={2} style={{ textAlign: 'center' }}>
                          <Text type="secondary">→</Text>
                        </Col>
                        <Col span={8}>
                          <Tag color="green">{value}</Tag>
                        </Col>
                        <Col span={4}>
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemoveDynamicMapping(key)}
                          >
                            Delete
                          </Button>
                        </Col>
                      </Row>
                    ))}
                  </Space>
                )}
                <Alert
                  style={{ marginTop: 16 }}
                  message="Mapping explains how format value maps to prompt/greeting keys"
                  description={`Example: If column is "STATE" and mapping is {"NORTH": "hindi"}, then when STATE value is "NORTH", the system will use prompts.hindi and greetings.hindi`}
                  type="info"
                  showIcon
                />
              </Card>
            </Col>
          </Row>
        </Space>
      </div>
    );
  };

  // ===== NEW RENDER FUNCTIONS =====

  const renderSTTServicesSection = () => {
    if (!currentTemplate) return null;
    const sttServices = currentTemplate.stt_services || {};

    return (
      <div>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={5} style={{ margin: 0 }}>STT Services Configuration</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddSTTServiceModalVisible(true)}>
            Add STT Service
          </Button>
        </div>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {Object.entries(sttServices).map(([key, value]) => (
            <Card key={key} size="small" type="inner">
              <Row gutter={[16, 16]} align="middle">
                <Col span={4}><Tag color="geekblue">{key}</Tag></Col>
                <Col span={16}>
                  <Input
                    value={value}
                    onChange={(e) => setCurrentTemplate({ ...currentTemplate, stt_services: { ...currentTemplate.stt_services, [key]: e.target.value } })}
                    placeholder={`Enter STT service for ${key}`}
                  />
                </Col>
                <Col span={4}>
                  <Space>
                    <Button type="primary" icon={<SaveOutlined />} onClick={() => handleUpdateSTTService(key, sttServices[key])} loading={saving}>Save</Button>
                    {key !== 'default' && <Button danger icon={<DeleteOutlined />} onClick={() => handleRemoveSTTService(key)}>Delete</Button>}
                  </Space>
                </Col>
              </Row>
            </Card>
          ))}
        </Space>
      </div>
    );
  };

  const renderTTSServicesSection = () => {
    if (!currentTemplate) return null;
    const ttsServices = currentTemplate.tts_services || {};

    return (
      <div>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={5} style={{ margin: 0 }}>TTS Services Configuration</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddTTSServiceModalVisible(true)}>
            Add TTS Service
          </Button>
        </div>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {Object.entries(ttsServices).map(([key, value]) => (
            <Card key={key} size="small" type="inner">
              <Row gutter={[16, 16]} align="middle">
                <Col span={4}><Tag color="purple">{key}</Tag></Col>
                <Col span={16}>
                  <Input
                    value={value}
                    onChange={(e) => setCurrentTemplate({ ...currentTemplate, tts_services: { ...currentTemplate.tts_services, [key]: e.target.value } })}
                    placeholder={`Enter TTS service for ${key}`}
                  />
                </Col>
                <Col span={4}>
                  <Space>
                    <Button type="primary" icon={<SaveOutlined />} onClick={() => handleUpdateTTSService(key, ttsServices[key])} loading={saving}>Save</Button>
                    {key !== 'default' && <Button danger icon={<DeleteOutlined />} onClick={() => handleRemoveTTSService(key)}>Delete</Button>}
                  </Space>
                </Col>
              </Row>
            </Card>
          ))}
        </Space>
      </div>
    );
  };

  const renderLLMServicesSection = () => {
    if (!currentTemplate) return null;
    const llmServices = currentTemplate.llm_services || {};

    return (
      <div>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={5} style={{ margin: 0 }}>LLM Services Configuration</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddLLMServiceModalVisible(true)}>
            Add LLM Service
          </Button>
        </div>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {Object.entries(llmServices).map(([key, value]) => (
            <Card key={key} size="small" type="inner">
              <Row gutter={[16, 16]} align="middle">
                <Col span={4}><Tag color="cyan">{key}</Tag></Col>
                <Col span={16}>
                  <Input
                    value={value}
                    onChange={(e) => setCurrentTemplate({ ...currentTemplate, llm_services: { ...currentTemplate.llm_services, [key]: e.target.value } })}
                    placeholder={`Enter LLM service for ${key}`}
                  />
                </Col>
                <Col span={4}>
                  <Space>
                    <Button type="primary" icon={<SaveOutlined />} onClick={() => handleUpdateLLMService(key, llmServices[key])} loading={saving}>Save</Button>
                    {key !== 'default' && <Button danger icon={<DeleteOutlined />} onClick={() => handleRemoveLLMService(key)}>Delete</Button>}
                  </Space>
                </Col>
              </Row>
            </Card>
          ))}
        </Space>
      </div>
    );
  };

  const renderAnalysisLLMServicesSection = () => {
    if (!currentTemplate) return null;
    const analysisLLMServices = currentTemplate.analysis_llm_services || {};

    return (
      <div>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={5} style={{ margin: 0 }}>Analysis LLM Services Configuration</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddAnalysisLLMServiceModalVisible(true)}>
            Add Analysis LLM Service
          </Button>
        </div>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {Object.entries(analysisLLMServices).map(([key, value]) => (
            <Card key={key} size="small" type="inner">
              <Row gutter={[16, 16]} align="middle">
                <Col span={4}><Tag color="magenta">{key}</Tag></Col>
                <Col span={16}>
                  <Input
                    value={value}
                    onChange={(e) => setCurrentTemplate({ ...currentTemplate, analysis_llm_services: { ...currentTemplate.analysis_llm_services, [key]: e.target.value } })}
                    placeholder={`Enter Analysis LLM service for ${key}`}
                  />
                </Col>
                <Col span={4}>
                  <Space>
                    <Button type="primary" icon={<SaveOutlined />} onClick={() => handleUpdateAnalysisLLMService(key, analysisLLMServices[key])} loading={saving}>Save</Button>
                    {key !== 'default' && <Button danger icon={<DeleteOutlined />} onClick={() => handleRemoveAnalysisLLMService(key)}>Delete</Button>}
                  </Space>
                </Col>
              </Row>
            </Card>
          ))}
        </Space>
      </div>
    );
  };

  const renderCallTimeoutsSection = () => {
    if (!currentTemplate) return null;
    const callTimeouts = currentTemplate.call_timeouts || {};

    return (
      <div>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={5} style={{ margin: 0 }}>Call Timeouts Configuration (seconds)</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddCallTimeoutModalVisible(true)}>
            Add Call Timeout
          </Button>
        </div>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {Object.entries(callTimeouts).map(([key, value]) => (
            <Card key={key} size="small" type="inner">
              <Row gutter={[16, 16]} align="middle">
                <Col span={4}><Tag color="gold">{key}</Tag></Col>
                <Col span={16}>
                  <Input
                    value={value === '' ? '' : String(value)}
                    onChange={(e) => setCurrentTemplate({ ...currentTemplate, call_timeouts: { ...currentTemplate.call_timeouts, [key]: e.target.value === '' ? '' : Number(e.target.value) } })}
                    placeholder={`Enter call timeout for ${key} (seconds)`}
                    type="number"
                  />
                </Col>
                <Col span={4}>
                  <Space>
                    <Button type="primary" icon={<SaveOutlined />} onClick={() => handleUpdateCallTimeout(key, String(callTimeouts[key]))} loading={saving}>Save</Button>
                    {key !== 'default' && <Button danger icon={<DeleteOutlined />} onClick={() => handleRemoveCallTimeout(key)}>Delete</Button>}
                  </Space>
                </Col>
              </Row>
            </Card>
          ))}
        </Space>
      </div>
    );
  };

  const renderFirstSilenceMsgsSection = () => {
    if (!currentTemplate) return null;
    const firstSilenceMsgs = currentTemplate.first_silence_msgs || {};

    return (
      <div>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={5} style={{ margin: 0 }}>First Silence Messages</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddFirstSilenceMsgModalVisible(true)}>
            Add First Silence Message
          </Button>
        </div>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {Object.entries(firstSilenceMsgs).map(([key, value]) => (
            <Card key={key} size="small" type="inner">
              <Row gutter={[16, 16]} align="middle">
                <Col span={4}><Tag color="lime">{key}</Tag></Col>
                <Col span={16}>
                  <Input
                    value={value || ''}
                    onChange={(e) => setCurrentTemplate({ ...currentTemplate, first_silence_msgs: { ...currentTemplate.first_silence_msgs, [key]: e.target.value || null } })}
                    placeholder={`Enter first silence message for ${key} (or leave empty for null)`}
                  />
                </Col>
                <Col span={4}>
                  <Space>
                    <Button type="primary" icon={<SaveOutlined />} onClick={() => handleUpdateFirstSilenceMsg(key, firstSilenceMsgs[key] || '')} loading={saving}>Save</Button>
                    <Button danger icon={<DeleteOutlined />} onClick={() => handleRemoveFirstSilenceMsg(key)}>Delete</Button>
                  </Space>
                </Col>
              </Row>
            </Card>
          ))}
        </Space>
      </div>
    );
  };

  const renderFirstSilenceTimesSection = () => {
    if (!currentTemplate) return null;
    const firstSilenceTimes = currentTemplate.first_silence_times || {};

    return (
      <div>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={5} style={{ margin: 0 }}>First Silence Times (ms)</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddFirstSilenceTimeModalVisible(true)}>
            Add First Silence Time
          </Button>
        </div>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {Object.entries(firstSilenceTimes).map(([key, value]) => (
            <Card key={key} size="small" type="inner">
              <Row gutter={[16, 16]} align="middle">
                <Col span={4}><Tag color="green">{key}</Tag></Col>
                <Col span={16}>
                  <Input
                    value={String(value)}
                    onChange={(e) => setCurrentTemplate({ ...currentTemplate, first_silence_times: { ...currentTemplate.first_silence_times, [key]: Number(e.target.value) || 0 } })}
                    placeholder={`Enter first silence time for ${key} (ms)`}
                    type="number"
                  />
                </Col>
                <Col span={4}>
                  <Space>
                    <Button type="primary" icon={<SaveOutlined />} onClick={() => handleUpdateFirstSilenceTime(key, String(firstSilenceTimes[key]))} loading={saving}>Save</Button>
                    <Button danger icon={<DeleteOutlined />} onClick={() => handleRemoveFirstSilenceTime(key)}>Delete</Button>
                  </Space>
                </Col>
              </Row>
            </Card>
          ))}
        </Space>
      </div>
    );
  };

  const renderSecondSilenceTimesSection = () => {
    if (!currentTemplate) return null;
    const secondSilenceTimes = currentTemplate.second_silence_times || {};

    return (
      <div>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={5} style={{ margin: 0 }}>Second Silence Times (ms)</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddSecondSilenceTimeModalVisible(true)}>
            Add Second Silence Time
          </Button>
        </div>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {Object.entries(secondSilenceTimes).map(([key, value]) => (
            <Card key={key} size="small" type="inner">
              <Row gutter={[16, 16]} align="middle">
                <Col span={4}><Tag color="red">{key}</Tag></Col>
                <Col span={16}>
                  <Input
                    value={String(value)}
                    onChange={(e) => setCurrentTemplate({ ...currentTemplate, second_silence_times: { ...currentTemplate.second_silence_times, [key]: Number(e.target.value) || 0 } })}
                    placeholder={`Enter second silence time for ${key} (ms)`}
                    type="number"
                  />
                </Col>
                <Col span={4}>
                  <Space>
                    <Button type="primary" icon={<SaveOutlined />} onClick={() => handleUpdateSecondSilenceTime(key, String(secondSilenceTimes[key]))} loading={saving}>Save</Button>
                    <Button danger icon={<DeleteOutlined />} onClick={() => handleRemoveSecondSilenceTime(key)}>Delete</Button>
                  </Space>
                </Col>
              </Row>
            </Card>
          ))}
        </Space>
      </div>
    );
  };

  const renderCallEndDelaysSection = () => {
    if (!currentTemplate) return null;
    const callEndDelays = currentTemplate.call_end_delays || {};

    return (
      <div>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={5} style={{ margin: 0 }}>Call End Delays (seconds)</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddCallEndDelayModalVisible(true)}>
            Add Call End Delay
          </Button>
        </div>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {Object.entries(callEndDelays).map(([key, value]) => (
            <Card key={key} size="small" type="inner">
              <Row gutter={[16, 16]} align="middle">
                <Col span={4}><Tag color="orange">{key}</Tag></Col>
                <Col span={16}>
                  <Input
                    value={String(value)}
                    onChange={(e) => setCurrentTemplate({ ...currentTemplate, call_end_delays: { ...currentTemplate.call_end_delays, [key]: Number(e.target.value) || 0 } })}
                    placeholder={`Enter call end delay for ${key} (seconds)`}
                    type="number"
                  />
                </Col>
                <Col span={4}>
                  <Space>
                    <Button type="primary" icon={<SaveOutlined />} onClick={() => handleUpdateCallEndDelay(key, String(callEndDelays[key]))} loading={saving}>Save</Button>
                    <Button danger icon={<DeleteOutlined />} onClick={() => handleRemoveCallEndDelay(key)}>Delete</Button>
                  </Space>
                </Col>
              </Row>
            </Card>
          ))}
        </Space>
      </div>
    );
  };

  const renderGeneralSettingsSection = () => {
    if (!currentTemplate) return null;

    return (
      <div>
        <Title level={5} style={{ marginBottom: 16 }}>General Settings</Title>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Row gutter={[16, 16]} align="middle">
            <Col span={6}>
              <Text strong>SMS Enabled:</Text>
            </Col>
            <Col span={18}>
              <Switch
                checked={currentTemplate.sms || false}
                onChange={handleToggleSMS}
                checkedChildren="Enabled"
                unCheckedChildren="Disabled"
              />
              <Text type="secondary" style={{ marginLeft: 16 }}>
                Enable SMS notifications for this template
              </Text>
            </Col>
          </Row>
          <Row gutter={[16, 16]} align="middle">
            <Col span={6}>
              <Text strong>Amount Column:</Text>
            </Col>
            <Col span={12}>
              <Input
                value={currentTemplate.amount_column || ''}
                onChange={(e) => setCurrentTemplate({ ...currentTemplate, amount_column: e.target.value })}
                placeholder="Enter amount column name"
              />
            </Col>
            <Col span={6}>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={() => handleUpdateGeneralSetting('amount_column', currentTemplate.amount_column || '')}
                loading={saving}
              >
                Save
              </Button>
            </Col>
          </Row>
          <Row gutter={[16, 16]} align="middle">
            <Col span={6}>
              <Text strong>Default Phone Column:</Text>
            </Col>
            <Col span={12}>
              <Input
                value={currentTemplate.default_phone_column || ''}
                onChange={(e) => setCurrentTemplate({ ...currentTemplate, default_phone_column: e.target.value })}
                placeholder="Enter default phone column name"
              />
            </Col>
            <Col span={6}>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={() => handleUpdateGeneralSetting('default_phone_column', currentTemplate.default_phone_column || '')}
                loading={saving}
              >
                Save
              </Button>
            </Col>
          </Row>
        </Space>
      </div>
    );
  };

  const renderFormatValuesLanSection = () => {
    if (!currentTemplate) return null;
    const formatValuesLan = currentTemplate.format_values_lan || {};

    return (
      <div>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={5} style={{ margin: 0 }}>Format Values Language Mapping</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddFormatValuesLanModalVisible(true)}>
            Add Format Value Language
          </Button>
        </div>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {Object.entries(formatValuesLan).map(([key, value]) => (
            <Card key={key} size="small" type="inner">
              <Row gutter={[16, 16]} align="middle">
                <Col span={4}><Tag color="purple">{key}</Tag></Col>
                <Col span={16}>
                  <Input
                    value={value}
                    onChange={(e) => setCurrentTemplate({ ...currentTemplate, format_values_lan: { ...currentTemplate.format_values_lan, [key]: e.target.value } })}
                    placeholder={`Enter language for ${key}`}
                  />
                </Col>
                <Col span={4}>
                  <Space>
                    <Button type="primary" icon={<SaveOutlined />} onClick={() => handleUpdateFormatValuesLan(key, formatValuesLan[key])} loading={saving}>Save</Button>
                    <Button danger icon={<DeleteOutlined />} onClick={() => handleRemoveFormatValuesLan(key)}>Delete</Button>
                  </Space>
                </Col>
              </Row>
            </Card>
          ))}
        </Space>
        <Alert
          style={{ marginTop: 16 }}
          message="Format Values Language Mapping"
          description="Maps format value keys to their corresponding language identifiers. Used to determine which language-specific settings to use."
          type="info"
          showIcon
        />
      </div>
    );
  };

  // ===== MAIN RENDER =====

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Header */}
        <Card>
          <Row gutter={[16, 16]} align="middle">
            <Col span={12}>
              <Title level={3} style={{ margin: 0 }}>
                Template Configuration
              </Title>
            </Col>
            <Col span={12} style={{ textAlign: 'right' }}>
              <Space>
                <Select
                  style={{ width: 300 }}
                  value={selectedTemplateName}
                  onChange={setSelectedTemplateName}
                  placeholder="Select a template"
                  loading={loading}
                >
                  {templateList.map(template => (
                    <Option key={template._id.$oid} value={template.name}>
                      {template.name}
                    </Option>
                  ))}
                </Select>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => loadPromptTemplate(selectedTemplateName)}
                  loading={loading}
                >
                  Reload
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {loading ? (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>
                <Text>Loading template...</Text>
              </div>
            </div>
          </Card>
        ) : currentTemplate ? (
          <Card>
            <Tabs
              defaultActiveKey="general_settings"
              type="card"
              size="large"
              items={[
                {
                  key: 'general_settings',
                  label: (
                    <span>
                      <SettingOutlined />
                      <span style={{ marginLeft: 8 }}>General Settings</span>
                    </span>
                  ),
                  children: renderGeneralSettingsSection()
                },
                {
                  key: 'format_values',
                  label: (
                    <span>
                      <DatabaseOutlined />
                      <span style={{ marginLeft: 8 }}>Format Values</span>
                    </span>
                  ),
                  children: renderFormatValuesSection()
                },
                {
                  key: 'format_values_lan',
                  label: 'Format Values Lan',
                  children: renderFormatValuesLanSection()
                },
                {
                  key: 'dynamic_config',
                  label: 'Dynamic Config',
                  children: renderDynamicConfigSection()
                },
                {
                  key: 'prompts',
                  label: 'Prompts',
                  children: renderPromptsSection()
                },
                {
                  key: 'greetings',
                  label: 'Greetings',
                  children: renderGreetingsSection()
                },
                {
                  key: 'analysis',
                  label: 'Analysis Prompts',
                  children: renderAnalysisPromptsSection()
                },
                {
                  key: 'rubric_analytics',
                  label: 'Rubric Analytics',
                  children: renderRubricAnalyticsSection()
                },
                {
                  key: 'stt_services',
                  label: 'STT Services',
                  children: renderSTTServicesSection()
                },
                {
                  key: 'tts_services',
                  label: 'TTS Services',
                  children: renderTTSServicesSection()
                },
                {
                  key: 'llm_services',
                  label: 'LLM Services',
                  children: renderLLMServicesSection()
                },
                {
                  key: 'analysis_llm_services',
                  label: 'Analysis LLM Services',
                  children: renderAnalysisLLMServicesSection()
                },
                {
                  key: 'stt_lan_codes',
                  label: 'STT Language Codes',
                  children: renderSTTLanCodesSection()
                },
                {
                  key: 'tts_lan_codes',
                  label: 'TTS Language Codes',
                  children: renderTTSLanCodesSection()
                },
                {
                  key: 'tts_model_ids',
                  label: 'TTS Model IDs',
                  children: renderTTSModelIdsSection()
                },
                {
                  key: 'tts_voice_ids',
                  label: 'TTS Voice IDs',
                  children: renderTTSVoiceIdsSection()
                },
                {
                  key: 'call_timeouts',
                  label: 'Call Timeouts',
                  children: renderCallTimeoutsSection()
                },
                {
                  key: 'first_silence_msgs',
                  label: 'First Silence Msgs',
                  children: renderFirstSilenceMsgsSection()
                },
                {
                  key: 'first_silence_times',
                  label: 'First Silence Times',
                  children: renderFirstSilenceTimesSection()
                },
                {
                  key: 'second_silence_times',
                  label: 'Second Silence Times',
                  children: renderSecondSilenceTimesSection()
                },
                {
                  key: 'call_end_delays',
                  label: 'Call End Delays',
                  children: renderCallEndDelaysSection()
                }
              ]}
            />
          </Card>
        ) : (
          <Card>
            <Alert
              message="No Template Selected"
              description="Please select a template from the dropdown above"
              type="info"
              showIcon
            />
          </Card>
        )}
      </Space>

      {/* ===== MODALS ===== */}

      {/* Add Format Value Modal */}
      <Modal
        title="Add Format Value"
        open={isAddFormatValueModalVisible}
        onOk={handleAddFormatValue}
        onCancel={() => {
          setIsAddFormatValueModalVisible(false);
          setNewFormatValue('');
        }}
        confirmLoading={saving}
      >
        <Form layout="vertical">
          <Form.Item label="Select Format Value from Available Columns" required>
            <Select
              showSearch
              value={newFormatValue}
              onChange={(value) => setNewFormatValue(value)}
              placeholder="Select a column from datasheet template"
              filterOption={(input, option) =>
                (option?.children?.toString() || '').toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {requiredColumns
                .filter(col => !(currentTemplate?.format_values || []).includes(col))
                .map(col => (
                  <Option key={col} value={col}>
                    {col}
                  </Option>
                ))}
            </Select>
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              {requiredColumns.length === 0
                ? 'Loading available columns...'
                : `${requiredColumns.filter(col => !(currentTemplate?.format_values || []).includes(col)).length} columns available`}
            </Text>
          </Form.Item>
        </Form>
      </Modal>

      {/* Processing Method Modal */}
      <Modal
        title={`Configure Processing Method for ${selectedFormatValue}`}
        open={isProcessingMethodModalVisible}
        onOk={handleSaveProcessingMethod}
        onCancel={() => {
          setIsProcessingMethodModalVisible(false);
          setSelectedFormatValue('');
          setSelectedMethod('');
          setSelectedMethodParam('');
        }}
        confirmLoading={saving}
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label="Method" required>
            <Select
              value={selectedMethod}
              onChange={(value) => {
                setSelectedMethod(value);
                setSelectedMethodParam('');
              }}
              placeholder="Select processing method"
            >
              {Object.keys(PROCESSING_METHODS).map(method => (
                <Option key={method} value={method}>
                  {method}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {selectedMethod && PROCESSING_METHODS[selectedMethod]?.length > 0 && PROCESSING_METHODS[selectedMethod][0] !== '' && (
            <Form.Item label="Parameter">
              <Select
                value={selectedMethodParam}
                onChange={setSelectedMethodParam}
                placeholder="Select parameter"
              >
                {PROCESSING_METHODS[selectedMethod].map(param => (
                  <Option key={param} value={param}>
                    {param}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Alert
            message="Processing Method Info"
            description={`This method will be applied to the ${selectedFormatValue} value before using it in prompts and greetings.`}
            type="info"
            showIcon
          />
        </Form>
      </Modal>

      {/* Add Prompt Key Modal */}
      <Modal
        title="Add Prompt Key"
        open={isAddPromptKeyModalVisible}
        onOk={handleAddPromptKey}
        onCancel={() => {
          setIsAddPromptKeyModalVisible(false);
          setNewPromptKey('');
          setNewPromptValue('');
        }}
        confirmLoading={saving}
        width={700}
      >
        <Form layout="vertical">
          <Form.Item label="Key Name" required>
            <Input
              value={newPromptKey}
              onChange={(e) => setNewPromptKey(e.target.value)}
              placeholder="e.g., day1, day2, hindi, tamil"
            />
          </Form.Item>
          <Form.Item label="Prompt Value" required>
            <TextArea
              value={newPromptValue}
              onChange={(e) => setNewPromptValue(e.target.value)}
              rows={4}
              placeholder="Enter the prompt text"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Greeting Key Modal */}
      <Modal
        title="Add Greeting Key"
        open={isAddGreetingKeyModalVisible}
        onOk={handleAddGreetingKey}
        onCancel={() => {
          setIsAddGreetingKeyModalVisible(false);
          setNewGreetingKey('');
          setNewGreetingValue('');
        }}
        confirmLoading={saving}
        width={700}
      >
        <Form layout="vertical">
          <Form.Item label="Key Name" required>
            <Input
              value={newGreetingKey}
              onChange={(e) => setNewGreetingKey(e.target.value)}
              placeholder="e.g., default, hindi, tamil"
            />
          </Form.Item>
          <Form.Item label="Greeting Value" required>
            <TextArea
              value={newGreetingValue}
              onChange={(e) => setNewGreetingValue(e.target.value)}
              rows={4}
              placeholder="Enter the greeting text"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Analysis Key Modal */}
      <Modal
        title="Add Analysis Prompt Key"
        open={isAddAnalysisKeyModalVisible}
        onOk={handleAddAnalysisKey}
        onCancel={() => {
          setIsAddAnalysisKeyModalVisible(false);
          setNewAnalysisKey('');
          setNewAnalysisValue('');
        }}
        confirmLoading={saving}
        width={700}
      >
        <Form layout="vertical">
          <Form.Item label="Key Name" required>
            <Input
              value={newAnalysisKey}
              onChange={(e) => setNewAnalysisKey(e.target.value)}
              placeholder="e.g., default, hindi"
            />
          </Form.Item>
          <Form.Item label="Analysis Prompt Value" required>
            <TextArea
              value={newAnalysisValue}
              onChange={(e) => setNewAnalysisValue(e.target.value)}
              rows={4}
              placeholder="Enter the analysis prompt text"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add STT Language Code Modal */}
      <Modal
        title="Add STT Language Code"
        open={isAddSTTLanCodeModalVisible}
        onOk={handleAddSTTLanCode}
        onCancel={() => {
          setIsAddSTTLanCodeModalVisible(false);
          setNewSTTLanCodeKey('');
          setNewSTTLanCodeValue('');
        }}
        confirmLoading={saving}
      >
        <Form layout="vertical">
          <Form.Item label="Key Name" required>
            <Input
              value={newSTTLanCodeKey}
              onChange={(e) => setNewSTTLanCodeKey(e.target.value)}
              placeholder="e.g., default, hindi"
            />
          </Form.Item>
          <Form.Item label="STT Language Code" required>
            <Input
              value={newSTTLanCodeValue}
              onChange={(e) => setNewSTTLanCodeValue(e.target.value)}
              placeholder="e.g., en-US, hi-IN"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add TTS Language Code Modal */}
      <Modal
        title="Add TTS Language Code"
        open={isAddTTSLanCodeModalVisible}
        onOk={handleAddTTSLanCode}
        onCancel={() => {
          setIsAddTTSLanCodeModalVisible(false);
          setNewTTSLanCodeKey('');
          setNewTTSLanCodeValue('');
        }}
        confirmLoading={saving}
      >
        <Form layout="vertical">
          <Form.Item label="Key Name" required>
            <Input
              value={newTTSLanCodeKey}
              onChange={(e) => setNewTTSLanCodeKey(e.target.value)}
              placeholder="e.g., default, hindi"
            />
          </Form.Item>
          <Form.Item label="TTS Language Code" required>
            <Input
              value={newTTSLanCodeValue}
              onChange={(e) => setNewTTSLanCodeValue(e.target.value)}
              placeholder="e.g., en-US, hi-IN"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add TTS Model ID Modal */}
      <Modal
        title="Add TTS Model ID"
        open={isAddTTSModelIdModalVisible}
        onOk={handleAddTTSModelId}
        onCancel={() => {
          setIsAddTTSModelIdModalVisible(false);
          setNewTTSModelIdKey('');
          setNewTTSModelIdValue('');
        }}
        confirmLoading={saving}
      >
        <Form layout="vertical">
          <Form.Item label="Key Name" required>
            <Input
              value={newTTSModelIdKey}
              onChange={(e) => setNewTTSModelIdKey(e.target.value)}
              placeholder="e.g., default, hindi"
            />
          </Form.Item>
          <Form.Item label="TTS Model ID" required>
            <Input
              value={newTTSModelIdValue}
              onChange={(e) => setNewTTSModelIdValue(e.target.value)}
              placeholder="e.g., tts-1, tts-1-hd"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add TTS Voice ID Modal */}
      <Modal
        title="Add TTS Voice ID"
        open={isAddTTSVoiceIdModalVisible}
        onOk={handleAddTTSVoiceId}
        onCancel={() => {
          setIsAddTTSVoiceIdModalVisible(false);
          setNewTTSVoiceIdKey('');
          setNewTTSVoiceIdValue('');
        }}
        confirmLoading={saving}
      >
        <Form layout="vertical">
          <Form.Item label="Key Name" required>
            <Input
              value={newTTSVoiceIdKey}
              onChange={(e) => setNewTTSVoiceIdKey(e.target.value)}
              placeholder="e.g., default, hindi"
            />
          </Form.Item>
          <Form.Item label="TTS Voice ID" required>
            <Input
              value={newTTSVoiceIdValue}
              onChange={(e) => setNewTTSVoiceIdValue(e.target.value)}
              placeholder="e.g., alloy, echo, fable"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Dynamic Mapping Modal */}
      <Modal
        title="Add Dynamic Mapping"
        open={isDynamicMappingModalVisible}
        onOk={handleAddDynamicMapping}
        onCancel={() => {
          setIsDynamicMappingModalVisible(false);
          setNewDynamicMappingKey('');
          setNewDynamicMappingValue('');
        }}
        confirmLoading={saving}
      >
        <Form layout="vertical">
          <Form.Item label="Format Value" required>
            <Input
              value={newDynamicMappingKey}
              onChange={(e) => setNewDynamicMappingKey(e.target.value)}
              placeholder="e.g., NORTH, SOUTH"
            />
          </Form.Item>
          <Form.Item label="Maps To Key" required>
            <Input
              value={newDynamicMappingValue}
              onChange={(e) => setNewDynamicMappingValue(e.target.value)}
              placeholder="e.g., hindi, tamil"
            />
          </Form.Item>
          <Alert
            message="Example"
            description={`If column is "STATE" and you add mapping "NORTH" → "hindi", then when STATE=NORTH, the system will use prompts.hindi and greetings.hindi`}
            type="info"
            showIcon
          />
        </Form>
      </Modal>

      {/* Add STT Service Modal */}
      <Modal
        title="Add STT Service"
        open={isAddSTTServiceModalVisible}
        onOk={handleAddSTTService}
        onCancel={() => { setIsAddSTTServiceModalVisible(false); setNewSTTServiceKey(''); setNewSTTServiceValue(''); }}
        confirmLoading={saving}
      >
        <Form layout="vertical">
          <Form.Item label="Key Name" required>
            <Input value={newSTTServiceKey} onChange={(e) => setNewSTTServiceKey(e.target.value)} placeholder="e.g., default, hindi" />
          </Form.Item>
          <Form.Item label="STT Service" required>
            <Input value={newSTTServiceValue} onChange={(e) => setNewSTTServiceValue(e.target.value)} placeholder="e.g., azure, google, deepgram" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add TTS Service Modal */}
      <Modal
        title="Add TTS Service"
        open={isAddTTSServiceModalVisible}
        onOk={handleAddTTSService}
        onCancel={() => { setIsAddTTSServiceModalVisible(false); setNewTTSServiceKey(''); setNewTTSServiceValue(''); }}
        confirmLoading={saving}
      >
        <Form layout="vertical">
          <Form.Item label="Key Name" required>
            <Input value={newTTSServiceKey} onChange={(e) => setNewTTSServiceKey(e.target.value)} placeholder="e.g., default, hindi" />
          </Form.Item>
          <Form.Item label="TTS Service" required>
            <Input value={newTTSServiceValue} onChange={(e) => setNewTTSServiceValue(e.target.value)} placeholder="e.g., cartesia, elevenlabs, azure" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add LLM Service Modal */}
      <Modal
        title="Add LLM Service"
        open={isAddLLMServiceModalVisible}
        onOk={handleAddLLMService}
        onCancel={() => { setIsAddLLMServiceModalVisible(false); setNewLLMServiceKey(''); setNewLLMServiceValue(''); }}
        confirmLoading={saving}
      >
        <Form layout="vertical">
          <Form.Item label="Key Name" required>
            <Input value={newLLMServiceKey} onChange={(e) => setNewLLMServiceKey(e.target.value)} placeholder="e.g., default, hindi" />
          </Form.Item>
          <Form.Item label="LLM Service" required>
            <Input value={newLLMServiceValue} onChange={(e) => setNewLLMServiceValue(e.target.value)} placeholder="e.g., groq, openai, anthropic" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Analysis LLM Service Modal */}
      <Modal
        title="Add Analysis LLM Service"
        open={isAddAnalysisLLMServiceModalVisible}
        onOk={handleAddAnalysisLLMService}
        onCancel={() => { setIsAddAnalysisLLMServiceModalVisible(false); setNewAnalysisLLMServiceKey(''); setNewAnalysisLLMServiceValue(''); }}
        confirmLoading={saving}
      >
        <Form layout="vertical">
          <Form.Item label="Key Name" required>
            <Input value={newAnalysisLLMServiceKey} onChange={(e) => setNewAnalysisLLMServiceKey(e.target.value)} placeholder="e.g., default, hindi" />
          </Form.Item>
          <Form.Item label="Analysis LLM Service" required>
            <Input value={newAnalysisLLMServiceValue} onChange={(e) => setNewAnalysisLLMServiceValue(e.target.value)} placeholder="e.g., groq, openai, anthropic" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Call Timeout Modal */}
      <Modal
        title="Add Call Timeout"
        open={isAddCallTimeoutModalVisible}
        onOk={handleAddCallTimeout}
        onCancel={() => { setIsAddCallTimeoutModalVisible(false); setNewCallTimeoutKey(''); setNewCallTimeoutValue(''); }}
        confirmLoading={saving}
      >
        <Form layout="vertical">
          <Form.Item label="Key Name" required>
            <Input value={newCallTimeoutKey} onChange={(e) => setNewCallTimeoutKey(e.target.value)} placeholder="e.g., default, hindi" />
          </Form.Item>
          <Form.Item label="Call Timeout (seconds)">
            <Input value={newCallTimeoutValue} onChange={(e) => setNewCallTimeoutValue(e.target.value)} placeholder="e.g., 300 (leave empty for no timeout)" type="number" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add First Silence Message Modal */}
      <Modal
        title="Add First Silence Message"
        open={isAddFirstSilenceMsgModalVisible}
        onOk={handleAddFirstSilenceMsg}
        onCancel={() => { setIsAddFirstSilenceMsgModalVisible(false); setNewFirstSilenceMsgKey(''); setNewFirstSilenceMsgValue(''); }}
        confirmLoading={saving}
      >
        <Form layout="vertical">
          <Form.Item label="Key Name" required>
            <Input value={newFirstSilenceMsgKey} onChange={(e) => setNewFirstSilenceMsgKey(e.target.value)} placeholder="e.g., hdfc, opus, hindi" />
          </Form.Item>
          <Form.Item label="First Silence Message">
            <Input value={newFirstSilenceMsgValue} onChange={(e) => setNewFirstSilenceMsgValue(e.target.value)} placeholder="Message to play (leave empty for null)" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add First Silence Time Modal */}
      <Modal
        title="Add First Silence Time"
        open={isAddFirstSilenceTimeModalVisible}
        onOk={handleAddFirstSilenceTime}
        onCancel={() => { setIsAddFirstSilenceTimeModalVisible(false); setNewFirstSilenceTimeKey(''); setNewFirstSilenceTimeValue(''); }}
        confirmLoading={saving}
      >
        <Form layout="vertical">
          <Form.Item label="Key Name" required>
            <Input value={newFirstSilenceTimeKey} onChange={(e) => setNewFirstSilenceTimeKey(e.target.value)} placeholder="e.g., hdfc, opus, hindi" />
          </Form.Item>
          <Form.Item label="First Silence Time (ms)" required>
            <Input value={newFirstSilenceTimeValue} onChange={(e) => setNewFirstSilenceTimeValue(e.target.value)} placeholder="e.g., 300" type="number" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Second Silence Time Modal */}
      <Modal
        title="Add Second Silence Time"
        open={isAddSecondSilenceTimeModalVisible}
        onOk={handleAddSecondSilenceTime}
        onCancel={() => { setIsAddSecondSilenceTimeModalVisible(false); setNewSecondSilenceTimeKey(''); setNewSecondSilenceTimeValue(''); }}
        confirmLoading={saving}
      >
        <Form layout="vertical">
          <Form.Item label="Key Name" required>
            <Input value={newSecondSilenceTimeKey} onChange={(e) => setNewSecondSilenceTimeKey(e.target.value)} placeholder="e.g., hdfc, opus, hindi" />
          </Form.Item>
          <Form.Item label="Second Silence Time (ms)" required>
            <Input value={newSecondSilenceTimeValue} onChange={(e) => setNewSecondSilenceTimeValue(e.target.value)} placeholder="e.g., 300" type="number" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Call End Delay Modal */}
      <Modal
        title="Add Call End Delay"
        open={isAddCallEndDelayModalVisible}
        onOk={handleAddCallEndDelay}
        onCancel={() => { setIsAddCallEndDelayModalVisible(false); setNewCallEndDelayKey(''); setNewCallEndDelayValue(''); }}
        confirmLoading={saving}
      >
        <Form layout="vertical">
          <Form.Item label="Key Name" required>
            <Input value={newCallEndDelayKey} onChange={(e) => setNewCallEndDelayKey(e.target.value)} placeholder="e.g., hdfc, opus, hindi" />
          </Form.Item>
          <Form.Item label="Call End Delay (seconds)" required>
            <Input value={newCallEndDelayValue} onChange={(e) => setNewCallEndDelayValue(e.target.value)} placeholder="e.g., 12" type="number" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Format Values Lan Modal */}
      <Modal
        title="Add Format Values Language"
        open={isAddFormatValuesLanModalVisible}
        onOk={handleAddFormatValuesLan}
        onCancel={() => { setIsAddFormatValuesLanModalVisible(false); setNewFormatValuesLanKey(''); setNewFormatValuesLanValue(''); }}
        confirmLoading={saving}
      >
        <Form layout="vertical">
          <Form.Item label="Key Name" required>
            <Input value={newFormatValuesLanKey} onChange={(e) => setNewFormatValuesLanKey(e.target.value)} placeholder="e.g., hindi, tamil, english" />
          </Form.Item>
          <Form.Item label="Language Value" required>
            <Input value={newFormatValuesLanValue} onChange={(e) => setNewFormatValuesLanValue(e.target.value)} placeholder="e.g., hindi, tamil, english" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PromptsAndPostCallAnalysis;
