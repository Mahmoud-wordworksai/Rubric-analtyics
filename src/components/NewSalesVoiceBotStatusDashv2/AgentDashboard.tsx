/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Tabs, 
  Button, 
  Modal, 
  Form, 
  Input, 
  InputNumber, 
  Select,
  message, 
  Spin, 
  Badge, 
  Statistic, 
  Progress, 
  Table, 
  Space,
  Tag,
  Tooltip,
  Row,
  Col,
  Switch,
  Dropdown,
  Checkbox
} from 'antd';
import { 
  HomeOutlined,
  TeamOutlined,
  PlusOutlined,
  SettingOutlined,
  PlayCircleOutlined,
  // PauseCircleOutlined,
  // EditOutlined,
  // DeleteOutlined,
  // EyeOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  MoreOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  SelectOutlined,
  SaveOutlined,
  CloseOutlined,
  EditOutlined,
  PhoneOutlined,
  NumberOutlined
} from '@ant-design/icons';
import { useSearchParams } from 'next/navigation';
import { useAppSelector } from '@/redux/store';
import { API_BASE_URL, API_KEY } from "@/constants";
import { appendRoomParam } from '@/hooks/useRoomAPI';
import axiosInstance from '@/lib/axios';

// TabPane is deprecated, using items prop instead
const { Option } = Select;
const { TextArea } = Input;

// Helper function to check if user is admin (any @wordworksai.com email)
const isAdminUser = (username: string | undefined): boolean => {
  return username ? username.includes('@wordworksai.com') : false;
};

// TypeScript interfaces
// Dynamic config - keys come from backend
type AgentConfig = Record<string, any>;

// Helper function to determine if a field should be a password input
const isSecretField = (fieldName: string): boolean => {
  const secretPatterns = ['KEY', 'TOKEN', 'SECRET', 'PASSWORD', 'AUTH', 'SID'];
  const upperFieldName = fieldName.toUpperCase();
  return secretPatterns.some(pattern => upperFieldName.includes(pattern));
};

// Helper function to format field label from key name
const formatFieldLabel = (fieldName: string): string => {
  return fieldName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

interface Agent {
  _id: { $oid: string };
  name: string;
  config: AgentConfig;
  execution_id: string | null;
  updated_at: { $date: string };
  room_id?: string;
  session: string[];
  check: string | null;
  limit: number;
  from_number?: string;
  active: boolean;
}

interface Room {
  _id: { $oid: string };
  room_name: string;
  created_at: { $date: string };
  agent_count: number;
  max_capacity: number;
  description?: string;
  limit?: number;
  time_limit?: number;
  last_enhance_time?: string;
  from_number?: string;
  telephony?: string;
}

interface RoomSettings {
  limit: number;
  time_limit: number;
  last_enhance_time?: string;
  from_number?: string;
  telephony?: string;
}

// Extended Room interface with config for Advanced Settings
interface FullRoomData {
  _id?: { $oid: string };
  room_name?: string;
  created_at?: { $date: string };
  agent_count?: number;
  max_capacity?: number;
  description?: string;
  limit?: number;
  time_limit?: number;
  last_enhance_time?: string;
  from_number?: string;
  phone_number?: string;
  telephony?: string;
  config?: Record<string, unknown>;
  [key: string]: unknown;
}

// Extended Agent interface with config for Advanced Settings
interface FullAgentData {
  _id?: { $oid: string };
  name?: string;
  config?: Record<string, unknown>;
  config_agent?: boolean;
  execution_id?: string | null;
  updated_at?: { $date: string };
  room_id?: string;
  session?: string[];
  check?: string | null;
  limit?: number;
  from_number?: string;
  active?: boolean;
  [key: string]: unknown;
}

const RoomsAgentsDashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const searchParams = useSearchParams();
  const selectedRoomFromRedux = searchParams.get('room') || 'main';
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [allAgents, setAllAgents] = useState<Agent[]>([]); // Store all agents across all rooms
  const [loading, setLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  
  // Modal states
  const [isCreateRoomModalVisible, setIsCreateRoomModalVisible] = useState(false);
  const [showRequestSuccess, setShowRequestSuccess] = useState(false);
  const [isManageAgentsModalVisible, setIsManageAgentsModalVisible] = useState(false);
  const [isAgentConfigModalVisible, setIsAgentConfigModalVisible] = useState(false);
  const [isBulkConfigModalVisible, setIsBulkConfigModalVisible] = useState(false);
  const [isBulkSelectModalVisible, setIsBulkSelectModalVisible] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentToToggle, setAgentToToggle] = useState<Agent | null>(null);
  const [showToggleConfirm, setShowToggleConfirm] = useState(false);

  // Room Settings states
  const [roomSettings, setRoomSettings] = useState<RoomSettings>({ limit: 90, time_limit: 300, from_number: '', telephony: 'india' });
  const [isRoomSettingsModalVisible, setIsRoomSettingsModalVisible] = useState(false);
  const [roomEnhanceLoading, setRoomEnhanceLoading] = useState(false);
  const [enhanceCooldown, setEnhanceCooldown] = useState<number>(0); // Cooldown in seconds

  // Reload Config states
  const [isReloadConfigModalVisible, setIsReloadConfigModalVisible] = useState(false);
  const [reloadConfigResponse, setReloadConfigResponse] = useState<any>(null);
  const [reloadConfigLoading, setReloadConfigLoading] = useState(false);

  // Advanced Settings states
  const [isAdvancedSettingsModalVisible, setIsAdvancedSettingsModalVisible] = useState(false);
  const [advancedSettingsLoading, setAdvancedSettingsLoading] = useState(false);
  const [fullRoomData, setFullRoomData] = useState<FullRoomData | null>(null);
  const [originalConfigValues, setOriginalConfigValues] = useState<Record<string, unknown>>({});

  // New Config Key states
  const [newConfigKeys, setNewConfigKeys] = useState<Array<{
    id: string;
    keyName: string;
    isNested: boolean;
    nestedKeys: Array<{ id: string; keyName: string; value: string }>;
    value: string;
  }>>([]);

  // Agent Advanced Settings states
  const [isAgentAdvancedSettingsModalVisible, setIsAgentAdvancedSettingsModalVisible] = useState(false);
  const [agentAdvancedSettingsLoading, setAgentAdvancedSettingsLoading] = useState(false);
  const [fullAgentData, setFullAgentData] = useState<FullAgentData | null>(null);
  const [originalAgentConfigValues, setOriginalAgentConfigValues] = useState<Record<string, unknown>>({});
  const [selectedAgentForAdvanced, setSelectedAgentForAdvanced] = useState<Agent | null>(null);
  const [newAgentConfigKeys, setNewAgentConfigKeys] = useState<Array<{
    id: string;
    keyName: string;
    isNested: boolean;
    nestedKeys: Array<{ id: string; keyName: string; value: string }>;
    value: string;
  }>>([]);
  const [agentConfigEnabled, setAgentConfigEnabled] = useState<boolean>(false);

  // Forms
  const [createRoomForm] = Form.useForm();
  const [manageAgentsForm] = Form.useForm();
  const [agentConfigForm] = Form.useForm();
  const [bulkConfigForm] = Form.useForm();
  const [bulkSelectForm] = Form.useForm();
  const [roomSettingsForm] = Form.useForm();
  const [advancedSettingsForm] = Form.useForm();
  const [agentAdvancedSettingsForm] = Form.useForm();

  // Filter rooms based on selected room from Redux
  const filteredRooms = React.useMemo(() => {
    if (selectedRoomFromRedux === 'main') {
      return rooms; // Show all rooms when in main
    }
    // Show only the selected room
    return rooms.filter(room => room.room_name === selectedRoomFromRedux);
  }, [rooms, selectedRoomFromRedux]);

  // Fetch all rooms from API
  const fetchRooms = async () => {
    try {
      const response = await axiosInstance.get(appendRoomParam(`${API_BASE_URL}/list-agent-rooms?api_key=${API_KEY}`, selectedRoomFromRedux));
      const data = response.data;
      if (data.status === 'success') {
        // Sort rooms in ascending order (natural sort for numbers)
        const sortedRooms = (data.data || []).slice().sort((a: Room, b: Room) => {
          return a.room_name.localeCompare(b.room_name, undefined, { numeric: true, sensitivity: 'base' });
        });
        setRooms(sortedRooms);
        // Fetch all agents from all rooms for accurate stats
        await fetchAllAgents(sortedRooms);
      } else {
        message.error(data.message || 'Failed to fetch rooms');
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      message.error('Failed to fetch rooms');
    }
  };

  // Fetch all agents from all rooms for stats calculation
  const fetchAllAgents = async (roomsList: Room[]) => {
    try {
      const allAgentsData: Agent[] = [];
      
      for (const room of roomsList) {
        try {
          const response = await axiosInstance.get(appendRoomParam(`${API_BASE_URL}/agent-rooms/${room._id.$oid}/agents?api_key=${API_KEY}`, selectedRoomFromRedux));
          const data = response.data;
          if (data.status === 'success' && data.data) {
            // Add room info to each agent
            const roomAgents = data.data.map((agent: Agent) => ({
              ...agent,
              room_id: room._id.$oid,
              room_name: room.room_name
            }));
            allAgentsData.push(...roomAgents);
          }
        } catch (error) {
          console.error(`Error fetching agents for room ${room.room_name}:`, error);
        }
      }
      
      setAllAgents(allAgentsData);
    } catch (error) {
      console.error('Error fetching all agents:', error);
    }
  };

  // Fetch agents in a specific room
  const fetchRoomAgents = async (roomId: string) => {
    try {
      const response = await axiosInstance.get(appendRoomParam(`${API_BASE_URL}/agent-rooms/${roomId}/agents?api_key=${API_KEY}`, selectedRoomFromRedux));
      const data = response.data;
      if (data.status === 'success') {
        // Sort agents by extracted agent number (e.g., agent-1, agent-2, ...)
        const sortedAgents = (data.data || []).slice().sort((a: Agent, b: Agent) => {
          const extractNum = (name: string) => {
            const match = name.match(/agent-(\d+)/i);
            return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
          };
          return extractNum(a.name) - extractNum(b.name);
        });
        setAgents(sortedAgents);
      } else {
        message.error(data.message || 'Failed to fetch agents');
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      message.error('Failed to fetch agents');
    }
  };

  // Create new room
  const createRoom = async (roomData: any) => {
    setLoading(true);
    try {
      const response = await axiosInstance.post(appendRoomParam(`${API_BASE_URL}/agent-rooms?api_key=${API_KEY}`, selectedRoomFromRedux), roomData);
      const data = response.data;
      if (data.status === 'success') {
        message.success('Room created successfully');
        await refreshData();
      } else {
        message.error(data.message || 'Failed to create room');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      message.error('Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  // Update agent instances
  const updateAgentInstances = async (numAgents: number, roomId: string) => {
    setLoading(true);
    try {
      const response = await axiosInstance.post(appendRoomParam(`${API_BASE_URL}/update-instances/${numAgents}?api_key=${API_KEY}&room_id=${roomId}`, selectedRoomFromRedux));
      const data = response.data;
      if (data.status === 'success' || data.status === 'Success') {
        // message.success(`Successfully updated to ${numAgents} agents`);
        // await refreshData();
      } else {
        message.error(data.message || 'Failed to update agents');
      }
    } catch (error: any) {
      console.error('Error updating agents:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to update agents';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Update agent configuration
  const updateAgentConfig = async (agentId: string, config: AgentConfig) => {
    setLoading(true);
    try {
      const response = await axiosInstance.put(appendRoomParam(`${API_BASE_URL}/agents/${agentId}/in-room?api_key=${API_KEY}`, selectedRoomFromRedux), { update_data: { config } });
      const data = response.data;
      
      if (data.status === 'success') {
        message.success('Agent configuration updated successfully');
        if (selectedRoom) {
          await fetchRoomAgents(selectedRoom._id.$oid);
        }
      } else {
        message.error(data.message || 'Failed to update agent');
      }
    } catch (error: any) {
      console.error('Error updating agent:', error);
      message.error('Failed to update agent');
    } finally {
      setLoading(false);
    }
  };

  // Bulk update agent configurations
  const bulkUpdateAgentConfigs = async (agentIds: string[], config: AgentConfig) => {
    setLoading(true);
    try {
      const response = await axiosInstance.put(appendRoomParam(`${API_BASE_URL}/agents/bulk-update?api_key=${API_KEY}`, selectedRoomFromRedux), {
        agent_ids: agentIds,
        config: config
      });
      const data = response.data;
      
      if (data.status === 'success') {
        message.success(`Successfully updated ${data.updated_count} agents`);
        if (selectedRoom) {
          await fetchRoomAgents(selectedRoom._id.$oid);
        }
        setSelectedAgentIds([]);
      } else {
        message.error(data.message || 'Failed to bulk update agents');
      }
    } catch (error: any) {
      console.error('Error bulk updating agents:', error);
      message.error('Failed to bulk update agents');
    } finally {
      setLoading(false);
    }
  };

  // Remove agent from room
  const removeAgentFromRoom = async (agentId: string) => {
    setLoading(true);
    try {
      const response = await axiosInstance.delete(appendRoomParam(`${API_BASE_URL}/agents/${agentId}/from-room?api_key=${API_KEY}`, selectedRoomFromRedux));
      const data = response.data;
      
      if (data.status === 'success') {
        message.success('Agent removed from room successfully');
        await refreshData();
      } else {
        message.error(data.message || 'Failed to remove agent');
      }
    } catch (error: any) {
      console.error('Error removing agent:', error);
      message.error('Failed to remove agent');
    } finally {
      setLoading(false);
    }
  };

  // Delete agent completely
  const deleteAgent = async (agentId: string) => {
    setLoading(true);
    try {
      const response = await axiosInstance.delete(appendRoomParam(`${API_BASE_URL}/agents/${agentId}?api_key=${API_KEY}`, selectedRoomFromRedux));
      const data = response.data;
      
      if (data.status === 'success') {
        message.success('Agent deleted successfully');
        await refreshData();
      } else {
        message.error(data.message || 'Failed to delete agent');
      }
    } catch (error: any) {
      console.error('Error deleting agent:', error);
      message.error('Failed to delete agent');
    } finally {
      setLoading(false);
    }
  };

  // Refresh all data
  const refreshData = async () => {
    setLoading(true);
    try {
      // Fetch rooms and get the updated data
      const response = await axiosInstance.get(appendRoomParam(`${API_BASE_URL}/list-agent-rooms?api_key=${API_KEY}`, selectedRoomFromRedux));
      const data = response.data;
      if (data.status === 'success') {
        const sortedRooms = (data.data || []).slice().sort((a: Room, b: Room) => {
          return a.room_name.localeCompare(b.room_name, undefined, { numeric: true, sensitivity: 'base' });
        });
        setRooms(sortedRooms);
        await fetchAllAgents(sortedRooms);

        // Update room settings if a room is selected
        if (selectedRoom) {
          const updatedRoom = sortedRooms.find((r: Room) => r._id.$oid === selectedRoom._id.$oid);
          if (updatedRoom) {
            updateRoomSettingsFromRoom(updatedRoom);
          }
          await fetchRoomAgents(selectedRoom._id.$oid);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Update room settings from room data (from agent-rooms API)
  const updateRoomSettingsFromRoom = (room: Room) => {
    setRoomSettings({
      limit: room.limit ?? 90,
      time_limit: room.time_limit ?? 300,
      last_enhance_time: room.last_enhance_time,
      from_number: room.from_number ?? '',
      telephony: room.telephony ?? 'india'
    });

    // Calculate remaining cooldown if last_enhance_time exists
    if (room.last_enhance_time) {
      const lastEnhance = new Date(room.last_enhance_time).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - lastEnhance) / 1000);
      const remaining = Math.max(0, 60 - elapsed);
      setEnhanceCooldown(remaining);
    } else {
      setEnhanceCooldown(0);
    }
  };

  // Update room settings (limit, time_limit) using /rooms/{room_id} API
  const updateRoomSettings = async (roomId: string, settings: Partial<RoomSettings>) => {
    setLoading(true);
    try {
      const response = await axiosInstance.put(appendRoomParam(`${API_BASE_URL}/rooms/${roomId}?api_key=${API_KEY}`, selectedRoomFromRedux), settings);
      const data = response.data;

      if (data.status === 'success') {
        message.success('Room settings updated successfully');
        setRoomSettings(prev => ({ ...prev, ...settings }));
        setIsRoomSettingsModalVisible(false);
        // Refresh rooms to get updated data
        await fetchRooms();
      } else {
        message.error(data.message || 'Failed to update room settings');
      }
    } catch (error) {
      console.error('Error updating room settings:', error);
      message.error('Failed to update room settings');
    } finally {
      setLoading(false);
    }
  };

  // Room Enhance - Update agents session
  const handleRoomEnhance = async () => {
    if (!selectedRoom) return;

    // Check cooldown before proceeding
    if (enhanceCooldown > 0) {
      message.warning(`Please wait ${enhanceCooldown} seconds before enhancing again`);
      return;
    }

    setRoomEnhanceLoading(true);
    try {
      const response = await axiosInstance.put(appendRoomParam(`${API_BASE_URL}/agents/update-session?api_key=${API_KEY}&room=${selectedRoom.room_name}`, selectedRoomFromRedux));
      const data = response.data;

      if (data.status === 'success') {
        // Update last_enhance_time in room document using /rooms/{room_id} API
        const newEnhanceTime = new Date().toISOString();
        await axiosInstance.put(appendRoomParam(`${API_BASE_URL}/rooms/${selectedRoom.room_name}?api_key=${API_KEY}`, selectedRoomFromRedux), { last_enhance_time: newEnhanceTime });

        // Set cooldown to 60 seconds
        setEnhanceCooldown(60);
        setRoomSettings(prev => ({ ...prev, last_enhance_time: newEnhanceTime }));

        message.success('Room enhanced successfully - Agent sessions updated');
        await fetchRooms(); // Refresh rooms to get updated data
        if (selectedRoom) {
          await fetchRoomAgents(selectedRoom._id.$oid);
        }
      } else {
        message.error(data.message || 'Failed to enhance room');
      }
    } catch (error) {
      console.error('Error enhancing room:', error);
      message.error('Failed to enhance room');
    } finally {
      setRoomEnhanceLoading(false);
    }
  };

  // Reload Agents Config
  const handleReloadConfig = async () => {
    if (!selectedRoom) return;

    setReloadConfigLoading(true);
    try {
      const response = await axiosInstance.post(
        appendRoomParam(`${API_BASE_URL}/agents/reload-config?call_room=${selectedRoom.room_name}&api_key=${API_KEY}`, selectedRoomFromRedux)
      );
      const data = response.data;
      setReloadConfigResponse(data);
      setIsReloadConfigModalVisible(true);
    } catch (error: any) {
      console.error('Error reloading config:', error);
      setReloadConfigResponse({ error: error.message || 'Failed to reload config' });
      setIsReloadConfigModalVisible(true);
    } finally {
      setReloadConfigLoading(false);
    }
  };

  // Fetch full room data for Advanced Settings from /agent-rooms endpoint
  const fetchFullRoomData = async (roomId: string) => {
    setAdvancedSettingsLoading(true);
    try {
      const response = await axiosInstance.get('/list-agent-rooms');
      const data = response.data;
      if (data.status === 'success' && data.data) {
        // Find the specific room by ID
        const roomData = data.data.find((room: FullRoomData) => room._id?.$oid === roomId);
        if (roomData) {
          setFullRoomData(roomData);
          // Pre-fill the form with config values only
          const formValues: Record<string, unknown> = {};
          // Add config fields if they exist - flatten nested objects
          if (roomData.config) {
            const flattenConfig = (obj: Record<string, unknown>, prefix = 'config') => {
              Object.entries(obj).forEach(([key, value]) => {
                const fieldName = `${prefix}_${key}`;
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                  // Recursively flatten nested objects
                  flattenConfig(value as Record<string, unknown>, fieldName);
                } else {
                  // Convert arrays and other values to string
                  formValues[fieldName] = typeof value === 'boolean' ? String(value) : value;
                }
              });
            };
            flattenConfig(roomData.config);
          }
          // Store original values for comparison during update
          setOriginalConfigValues({ ...formValues });
          advancedSettingsForm.setFieldsValue(formValues);
          setIsAdvancedSettingsModalVisible(true);
        } else {
          message.error('Room not found');
        }
      } else {
        message.error(data.message || 'Failed to fetch room data');
      }
    } catch (error: any) {
      console.error('Error fetching room data:', error);
      message.error('Failed to fetch room data');
    } finally {
      setAdvancedSettingsLoading(false);
    }
  };

  // Update room with Advanced Settings
  const handleAdvancedSettingsSubmit = async (values: Record<string, unknown>) => {
    if (!selectedRoom) return;

    setAdvancedSettingsLoading(true);
    try {
      // Only send changed/modified values and new keys (API will merge)
      const config: Record<string, unknown> = {};

      // Process form values - only include changed ones
      Object.entries(values).forEach(([key, value]) => {
        if (key.startsWith('config_') && value !== undefined && value !== '') {
          // Skip if value contains *** (masked/hidden values)
          if (typeof value === 'string' && value.includes('***')) {
            return;
          }

          // Skip if value hasn't changed from original
          const originalValue = originalConfigValues[key];
          if (originalValue === value) {
            return;
          }

          // Remove 'config_' prefix to get path
          const pathStr = key.replace('config_', '');

          // Parse value - try to convert to number or boolean if applicable
          let parsedValue: unknown = value;
          if (typeof value === 'string') {
            if (value === 'true') parsedValue = true;
            else if (value === 'false') parsedValue = false;
            else if (!isNaN(Number(value)) && value.trim() !== '') {
              parsedValue = Number(value);
            }
          }

          // Check if this is part of a nested object by checking fullRoomData.config
          if (fullRoomData?.config) {
            // Find if any top-level key is a prefix of our path
            const topLevelKeys = Object.keys(fullRoomData.config);
            for (const topKey of topLevelKeys) {
              if (pathStr.startsWith(topKey + '_')) {
                // This is a nested key
                const nestedKey = pathStr.substring(topKey.length + 1);
                if (!config[topKey]) {
                  config[topKey] = {};
                }
                (config[topKey] as Record<string, unknown>)[nestedKey] = parsedValue;
                return;
              }
            }
          }

          // Not a nested key, add directly
          config[pathStr] = parsedValue;
        }
      });

      // Add new config keys
      newConfigKeys.forEach((newKey) => {
        if (newKey.keyName.trim()) {
          if (newKey.isNested) {
            // Create nested object
            const nestedObj: Record<string, unknown> = {};
            newKey.nestedKeys.forEach((nk) => {
              if (nk.keyName.trim()) {
                // Parse value
                let parsedValue: unknown = nk.value;
                if (nk.value === 'true') parsedValue = true;
                else if (nk.value === 'false') parsedValue = false;
                else if (!isNaN(Number(nk.value)) && nk.value.trim() !== '') {
                  parsedValue = Number(nk.value);
                }
                nestedObj[nk.keyName] = parsedValue;
              }
            });
            if (Object.keys(nestedObj).length > 0) {
              config[newKey.keyName] = nestedObj;
            }
          } else {
            // Simple key-value
            let parsedValue: unknown = newKey.value;
            if (newKey.value === 'true') parsedValue = true;
            else if (newKey.value === 'false') parsedValue = false;
            else if (!isNaN(Number(newKey.value)) && newKey.value.trim() !== '') {
              parsedValue = Number(newKey.value);
            }
            config[newKey.keyName] = parsedValue;
          }
        }
      });

      // Check if there are any changes to update
      if (Object.keys(config).length === 0) {
        message.info('No changes detected');
        setAdvancedSettingsLoading(false);
        return;
      }

      const updatePayload: Record<string, unknown> = { config };

      const response = await axiosInstance.put(`/rooms/${selectedRoom.room_name}`, updatePayload);
      const data = response.data;

      if (data.status === 'success') {
        message.success('Room config updated successfully');
        setIsAdvancedSettingsModalVisible(false);
        advancedSettingsForm.resetFields();
        setFullRoomData(null);
        setOriginalConfigValues({});
        setNewConfigKeys([]);
        // Refresh rooms to get updated data
        await fetchRooms();
      } else {
        message.error(data.message || 'Failed to update room config');
      }
    } catch (error: any) {
      console.error('Error updating advanced settings:', error);
      message.error('Failed to update room config');
    } finally {
      setAdvancedSettingsLoading(false);
    }
  };

  // Fetch full agent data for Agent Advanced Settings from /list-agents endpoint
  const fetchFullAgentData = async (agent: Agent) => {
    if (!selectedRoom) return;

    setAgentAdvancedSettingsLoading(true);
    setSelectedAgentForAdvanced(agent);
    try {
      const response = await axiosInstance.get('/list-agents');
      const data = response.data;
      if (data.status === 'success' && data.data) {
        // Find the specific agent by name
        const agentData = data.data.find((a: FullAgentData) => a.name === agent.name);
        if (agentData) {
          setFullAgentData(agentData);
          // Pre-fill the form with config values only
          const formValues: Record<string, unknown> = {};
          // Add config fields if they exist - flatten nested objects
          if (agentData.config) {
            const flattenConfig = (obj: Record<string, unknown>, prefix = 'config') => {
              Object.entries(obj).forEach(([key, value]) => {
                const fieldName = `${prefix}_${key}`;
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                  // Recursively flatten nested objects
                  flattenConfig(value as Record<string, unknown>, fieldName);
                } else {
                  // Convert arrays and other values to string
                  formValues[fieldName] = typeof value === 'boolean' ? String(value) : value;
                }
              });
            };
            flattenConfig(agentData.config);
          }
          // Store original values for comparison during update
          setOriginalAgentConfigValues({ ...formValues });
          agentAdvancedSettingsForm.setFieldsValue(formValues);
          // Set config_agent toggle state (default to false if not present)
          setAgentConfigEnabled(agentData.config_agent !== undefined ? agentData.config_agent : false);
          setIsAgentAdvancedSettingsModalVisible(true);
        } else {
          message.error('Agent not found');
        }
      } else {
        message.error(data.message || 'Failed to fetch agent data');
      }
    } catch (error: any) {
      console.error('Error fetching agent data:', error);
      message.error('Failed to fetch agent data');
    } finally {
      setAgentAdvancedSettingsLoading(false);
    }
  };

  // Update agent with Advanced Settings
  const handleAgentAdvancedSettingsSubmit = async (values: Record<string, unknown>) => {
    if (!selectedRoom || !selectedAgentForAdvanced) return;

    setAgentAdvancedSettingsLoading(true);
    try {
      // Only send changed/modified values and new keys (API will merge)
      const config: Record<string, unknown> = {};

      // Process form values - only include changed ones
      Object.entries(values).forEach(([key, value]) => {
        if (key.startsWith('config_') && value !== undefined && value !== '') {
          // Skip if value contains *** (masked/hidden values)
          if (typeof value === 'string' && value.includes('***')) {
            return;
          }

          // Skip if value hasn't changed from original
          const originalValue = originalAgentConfigValues[key];
          if (originalValue === value) {
            return;
          }

          // Remove 'config_' prefix to get path
          const pathStr = key.replace('config_', '');

          // Parse value - try to convert to number or boolean if applicable
          let parsedValue: unknown = value;
          if (typeof value === 'string') {
            if (value === 'true') parsedValue = true;
            else if (value === 'false') parsedValue = false;
            else if (!isNaN(Number(value)) && value.trim() !== '') {
              parsedValue = Number(value);
            }
          }

          // Check if this is part of a nested object by checking fullAgentData.config
          if (fullAgentData?.config) {
            // Find if any top-level key is a prefix of our path
            const topLevelKeys = Object.keys(fullAgentData.config);
            for (const topKey of topLevelKeys) {
              if (pathStr.startsWith(topKey + '_')) {
                // This is a nested key
                const nestedKey = pathStr.substring(topKey.length + 1);
                if (!config[topKey]) {
                  config[topKey] = {};
                }
                (config[topKey] as Record<string, unknown>)[nestedKey] = parsedValue;
                return;
              }
            }
          }

          // Not a nested key, add directly
          config[pathStr] = parsedValue;
        }
      });

      // Add new config keys
      newAgentConfigKeys.forEach((newKey) => {
        if (newKey.keyName.trim()) {
          if (newKey.isNested) {
            // Create nested object
            const nestedObj: Record<string, unknown> = {};
            newKey.nestedKeys.forEach((nk) => {
              if (nk.keyName.trim()) {
                // Parse value
                let parsedValue: unknown = nk.value;
                if (nk.value === 'true') parsedValue = true;
                else if (nk.value === 'false') parsedValue = false;
                else if (!isNaN(Number(nk.value)) && nk.value.trim() !== '') {
                  parsedValue = Number(nk.value);
                }
                nestedObj[nk.keyName] = parsedValue;
              }
            });
            if (Object.keys(nestedObj).length > 0) {
              config[newKey.keyName] = nestedObj;
            }
          } else {
            // Simple key-value
            let parsedValue: unknown = newKey.value;
            if (newKey.value === 'true') parsedValue = true;
            else if (newKey.value === 'false') parsedValue = false;
            else if (!isNaN(Number(newKey.value)) && newKey.value.trim() !== '') {
              parsedValue = Number(newKey.value);
            }
            config[newKey.keyName] = parsedValue;
          }
        }
      });

      // Check if there are any changes to update (config changes or config_agent toggle)
      const originalConfigAgent = fullAgentData?.config_agent !== undefined ? fullAgentData.config_agent : false;
      const configAgentChanged = agentConfigEnabled !== originalConfigAgent;

      if (Object.keys(config).length === 0 && !configAgentChanged) {
        message.info('No changes detected');
        setAgentAdvancedSettingsLoading(false);
        return;
      }

      const updatePayload: Record<string, unknown> = {
        config,
        config_agent: agentConfigEnabled
      };

      const response = await axiosInstance.put(
        `/agents-doc/${selectedRoom.room_name}?agent_id=${selectedAgentForAdvanced.name}`,
        updatePayload
      );
      const data = response.data;

      if (data.status === 'success') {
        message.success('Agent config updated successfully');
        setIsAgentAdvancedSettingsModalVisible(false);
        agentAdvancedSettingsForm.resetFields();
        setFullAgentData(null);
        setOriginalAgentConfigValues({});
        setNewAgentConfigKeys([]);
        setSelectedAgentForAdvanced(null);
        setAgentConfigEnabled(false);
        // Refresh agents to get updated data
        if (selectedRoom) {
          await fetchRoomAgents(selectedRoom._id.$oid);
        }
      } else {
        message.error(data.message || 'Failed to update agent config');
      }
    } catch (error: any) {
      console.error('Error updating agent advanced settings:', error);
      message.error('Failed to update agent config');
    } finally {
      setAgentAdvancedSettingsLoading(false);
    }
  };

  // Calculate comprehensive statistics from all agents across all rooms
  const calculateStats = () => {
    const totalRooms = rooms.length;
    const totalAgents = allAgents.length; // Use actual agent count, not room.agent_count
    const totalCapacity = rooms.reduce((sum, room) => sum + (room.max_capacity || 0), 0);

    // Calculate agent states
    const workingAgents = allAgents.filter(agent => agent.execution_id !== null).length;
    const activeAgents = allAgents.filter(agent => agent.active).length;
    const inactiveAgents = totalAgents - activeAgents;
    const idleAgents = totalAgents - workingAgents; // Agents that are not currently working

    return {
      totalRooms,
      totalAgents,
      totalCapacity,
      workingAgents,
      activeAgents,
      inactiveAgents,
      idleAgents,
      capacityPercentage: totalCapacity > 0 ? (totalAgents / totalCapacity) * 100 : 0
    };
  };

  // Calculate statistics for a specific room
  const calculateRoomStats = (roomName: string) => {
    const room = rooms.find(r => r.room_name === roomName);
    if (!room) {
      return {
        totalRooms: 0,
        totalAgents: 0,
        totalCapacity: 0,
        workingAgents: 0,
        activeAgents: 0,
        inactiveAgents: 0,
        idleAgents: 0,
        capacityPercentage: 0
      };
    }

    const roomAgents = allAgents.filter(agent => agent.room_id === room._id.$oid);
    const totalAgents = roomAgents.length;
    const totalCapacity = room.max_capacity;

    // Calculate agent states for this room only
    const workingAgents = roomAgents.filter(agent => agent.execution_id !== null).length;
    const activeAgents = roomAgents.filter(agent => agent.active).length;
    const inactiveAgents = totalAgents - activeAgents;
    const idleAgents = totalAgents - workingAgents;

    return {
      totalRooms: 1,
      totalAgents,
      totalCapacity,
      workingAgents,
      activeAgents,
      inactiveAgents,
      idleAgents,
      capacityPercentage: totalCapacity > 0 ? (totalAgents / totalCapacity) * 100 : 0
    };
  };

  // Get agent count for a specific room
  const getRoomAgentCount = (roomId: string): number => {
    return allAgents.filter(agent => agent.room_id === roomId).length;
  };

  // Check if agent config is complete
  const isConfigComplete = (config: AgentConfig) => {
    if (!config) return false;
    return Object.values(config).every(value => 
      typeof value === 'string' && value.trim() !== ''
    );
  };

  // Format date for display
  const formatDate = (dateObj: { $date: string } | string) => {
    const dateStr = typeof dateObj === 'string' ? dateObj : dateObj.$date;
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Format relative time
  const formatRelativeTime = (dateObj: { $date: string } | string | undefined) => {
    if (!dateObj) return 'Unknown';
    let dateStr: string | undefined;
    if (typeof dateObj === 'string') {
      dateStr = dateObj;
    } else if (typeof dateObj === 'object' && dateObj.$date) {
      dateStr = dateObj.$date;
    } else {
      return 'Unknown';
    }
    const time = new Date(dateStr).getTime();
    if (isNaN(time)) return 'Unknown';
    const now = new Date().getTime();
    const diff = now - time;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  // Handle agent selection
  const handleAgentSelection = (agentId: string, checked: boolean) => {
    if (checked) {
      setSelectedAgentIds([...selectedAgentIds, agentId]);
    } else {
      setSelectedAgentIds(selectedAgentIds.filter(id => id !== agentId));
    }
  };

  // Handle select all agents
  const handleSelectAllAgents = (checked: boolean) => {
    if (checked) {
      setSelectedAgentIds(agents.map(agent => agent._id.$oid));
    } else {
      setSelectedAgentIds([]);
    }
  };

  // Parse agent name to extract number
  const extractAgentNumber = (agentName: string): number | null => {
    const match = agentName.match(/agent-(\d+)/i);
    return match ? parseInt(match[1], 10) : null;
  };

  // Handle bulk select by ranges
  const handleBulkSelectByRanges = (ranges: string) => {
    const selectedIds: string[] = [];
    const rangePatterns = ranges.split(',').map(r => r.trim());
    
    rangePatterns.forEach(pattern => {
      if (pattern.includes(' to ')) {
        // Handle range: "agent-1 to agent-10"
        const [start, end] = pattern.split(' to ').map(s => s.trim());
        const startNum = extractAgentNumber(start);
        const endNum = extractAgentNumber(end);
        
        if (startNum !== null && endNum !== null) {
          agents.forEach(agent => {
            const agentNum = extractAgentNumber(agent.name);
            if (agentNum !== null && agentNum >= startNum && agentNum <= endNum) {
              selectedIds.push(agent._id.$oid);
            }
          });
        }
      } else {
        // Handle single agent: "agent-5"
        const agentNum = extractAgentNumber(pattern);
        if (agentNum !== null) {
          const matchingAgent = agents.find(agent => {
            const num = extractAgentNumber(agent.name);
            return num === agentNum;
          });
          if (matchingAgent) {
            selectedIds.push(matchingAgent._id.$oid);
          }
        }
      }
    });
    
    setSelectedAgentIds([...new Set(selectedIds)]); // Remove duplicates
  };

  // Handle bulk select form submission
  const handleBulkSelectSubmit = (values: any) => {
    handleBulkSelectByRanges(values.ranges);
    setIsBulkSelectModalVisible(false);
    bulkSelectForm.resetFields();
  };

  // Get suggested ranges based on current agents
  const getSuggestedRanges = (): string[] => {
    const agentNumbers = agents
      .map(agent => extractAgentNumber(agent.name))
      .filter(num => num !== null)
      .sort((a, b) => a! - b!) as number[];
    
    if (agentNumbers.length === 0) return [];
    
    const suggestions: string[] = [];
    
    // Group consecutive numbers
    let start = agentNumbers[0];
    let end = agentNumbers[0];
    
    for (let i = 1; i < agentNumbers.length; i++) {
      if (agentNumbers[i] === end + 1) {
        end = agentNumbers[i];
      } else {
        if (start === end) {
          suggestions.push(`agent-${start}`);
        } else {
          suggestions.push(`agent-${start} to agent-${end}`);
        }
        start = agentNumbers[i];
        end = agentNumbers[i];
      }
    }
    
    // Add the last group
    if (start === end) {
      suggestions.push(`agent-${start}`);
    } else {
      suggestions.push(`agent-${start} to agent-${end}`);
    }
    
    return suggestions;
  };

  // Load data when component mounts
  useEffect(() => {
    fetchRooms();
  }, [selectedRoomFromRedux]);

  // Refresh all agents when rooms change
  useEffect(() => {
    if (rooms.length > 0) {
      fetchAllAgents(rooms);
    }
  }, [rooms.length]);

  // Clear selections when switching rooms
  useEffect(() => {
    setSelectedAgentIds([]);
  }, [selectedRoom]);

  // Cooldown timer for Room Enhance button
  useEffect(() => {
    if (enhanceCooldown <= 0) return;

    const timer = setInterval(() => {
      setEnhanceCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [enhanceCooldown]);

  // Auto-select room tab when in specific room
  useEffect(() => {
    if (selectedRoomFromRedux !== 'main' && filteredRooms.length > 0) {
      const room = filteredRooms[0]; // Get the first (and only) filtered room
      if (room) {
        const roomTabKey = `room-${room._id.$oid}`;
        const roomId = room._id.$oid;

        // Only update if the tab or room has changed
        if (activeTab !== roomTabKey || selectedRoom?._id.$oid !== roomId) {
          setActiveTab(roomTabKey);
          setSelectedRoom(room);
          fetchRoomAgents(roomId);
          updateRoomSettingsFromRoom(room);
        }
      }
    }
    // Note: Don't auto-reset to overview when in main mode to allow manual tab navigation
  }, [selectedRoomFromRedux, filteredRooms]);

  // Handle tab change
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key.startsWith('room-')) {
      const roomId = key.replace('room-', '');
      const room = rooms.find(r => r._id.$oid === roomId);
      if (room) {
        setSelectedRoom(room);
        fetchRoomAgents(roomId);
        updateRoomSettingsFromRoom(room);
      }
    } else {
      setSelectedRoom(null);
      setAgents([]);
    }
  };

  // Handle create room submission
  const handleCreateRoom = async (values: any) => {
    // Don't call API, just show success message
    setShowRequestSuccess(true);
  };

  // Handle manage agents submission
  const handleManageAgents = async (values: any) => {
    if (!selectedRoom) return;
    
    const targetCount = values.target_agent_count;
    if (targetCount > 20) {
      // Split into two batches
      const firstBatch = Math.floor(targetCount / 2);
      const secondBatch = targetCount - firstBatch;
      await updateAgentInstances(firstBatch, selectedRoom._id.$oid);
      await updateAgentInstances(targetCount, selectedRoom._id.$oid);
      await refreshData();
    } else {
      await updateAgentInstances(targetCount, selectedRoom._id.$oid);
      await refreshData();
    }
    setIsManageAgentsModalVisible(false);
    manageAgentsForm.resetFields();
  };

  // Handle agent config save
  const handleSaveAgentConfig = async (values: AgentConfig) => {
    if (!selectedAgent) return;
    
    await updateAgentConfig(selectedAgent._id.$oid, values);
    setIsAgentConfigModalVisible(false);
    setSelectedAgent(null);
    agentConfigForm.resetFields();
  };

  // Handle bulk config save
  const handleSaveBulkConfig = async (values: AgentConfig) => {
    if (selectedAgentIds.length === 0) return;
    
    await bulkUpdateAgentConfigs(selectedAgentIds, values);
    setIsBulkConfigModalVisible(false);
    bulkConfigForm.resetFields();
  };

  // Handle toggle agent active status - show confirmation
  const handleToggleAgentActive = (agent: Agent) => {
    setAgentToToggle(agent);
    setShowToggleConfirm(true);
  };

  // Confirm toggle agent active status
  const confirmToggleAgent = async () => {
    if (!agentToToggle) return;

    const newStatus = !agentToToggle.active;
    setLoading(true);
    try {
      const response = await axiosInstance.put(appendRoomParam(`${API_BASE_URL}/agents/${agentToToggle._id.$oid}/in-room?api_key=${API_KEY}`, selectedRoomFromRedux), {
        update_data: { active: newStatus }
      });
      const data = response.data;

      if (data.status === 'success') {
        message.success(`Agent ${newStatus ? 'activated' : 'deactivated'} successfully`);
        if (selectedRoom) {
          await fetchRoomAgents(selectedRoom._id.$oid);
        }
      } else {
        message.error(data.message || 'Failed to update agent');
      }
    } catch (error) {
      console.error('Error updating agent:', error);
      message.error('Failed to update agent');
    } finally {
      setLoading(false);
      setShowToggleConfirm(false);
      setAgentToToggle(null);
    }
  };

  // Agent action menu
  const getAgentActionMenu = (agent: Agent) => ({
    items: [
      // Removed configuration option
    ]
  });

  // Calculate stats based on selected room
  const stats = selectedRoomFromRedux === 'main'
    ? calculateStats()
    : calculateRoomStats(selectedRoomFromRedux);

  // Render room overview card
  const renderRoomOverviewCard = (room: Room) => {
    const roomAgentCount = getRoomAgentCount(room._id.$oid);
    const capacityPercentage = (roomAgentCount / room.max_capacity) * 100;

    return (
      <Card
        key={room._id.$oid}
        className="shadow-md hover:shadow-lg transition-shadow cursor-pointer"
        title={
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <HomeOutlined className="text-blue-500" />
              <span className="font-medium">{room.room_name}</span>
            </div>
          </div>
        }
        extra={
          <Badge
            status={roomAgentCount > 0 ? "success" : "default"}
            text={roomAgentCount > 0 ? "Active" : "Empty"}
          />
        }
        onClick={() => handleTabChange(`room-${room._id.$oid}`)}
      >
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Capacity</span>
              <span>{roomAgentCount}/{room.max_capacity}</span>
            </div>
            <Progress 
              percent={capacityPercentage} 
              status={capacityPercentage > 90 ? "exception" : "active"}
              strokeColor={capacityPercentage > 90 ? "#ff4d4f" : "#1890ff"}
            />
          </div>

          <div className="text-xs text-gray-500">
            Created: {formatRelativeTime(room.created_at)}
          </div>

          {room.description && (
            <div className="text-sm text-gray-600 italic">
              {room.description}
            </div>
          )}
        </div>
      </Card>
    );
  };

  const [editingAgent, setEditingAgent] = useState<string | null>(null);
const [editForm] = Form.useForm();

// Add this function to update agent's from_number and limit
const updateAgentFields = async (agentId: string, updateData: { from_number?: string; limit?: number }) => {
  setLoading(true);
  try {
    const response = await axiosInstance.put(appendRoomParam(`${API_BASE_URL}/agents/${agentId}/in-room?api_key=${API_KEY}`, selectedRoomFromRedux), {
      update_data: updateData
    });
    const data = response.data;
    
    if (data.status === 'success') {
      message.success('Agent updated successfully');
      if (selectedRoom) {
        await fetchRoomAgents(selectedRoom._id.$oid);
      }
      setEditingAgent(null);
      editForm.resetFields();
    } else {
      message.error(data.message || 'Failed to update agent');
    }
  } catch (error: any) {
    console.error('Error updating agent:', error);
    message.error('Failed to update agent');
  } finally {
    setLoading(false);
  }
};

  const handleEditSubmit = async (values: { from_number?: string; limit?: number }) => {
  if (!editingAgent) return;
  
  const updateData: { from_number?: string; limit?: number } = {};
  
  if (values.from_number !== undefined && values.from_number !== '') {
    updateData.from_number = values.from_number;
  }
  
  if (values.limit !== undefined) {
    updateData.limit = values.limit;
  }
  
  await updateAgentFields(editingAgent, updateData);
};


  // Updated renderAgentCard function - REPLACE your existing renderAgentCard function with this
const renderAgentCard = (agent: Agent) => {
  const isActive = agent.active;
  const isSelected = selectedAgentIds.includes(agent._id.$oid);
  const workingCount = agent.session.length;
  const isChecking = agent.check;
  const limit = agent.limit;
  const isWorking = agent.execution_id !== null || workingCount > 0;
  const isEditing = editingAgent === agent._id.$oid;
  
  // Get from_number from agent data
  const fromNumber = agent.from_number || 'Not set';

  return (
    <Card
      key={agent._id.$oid}
      className={`shadow-sm hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      size="small"
      title={
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <RobotOutlined className={isActive ? "text-green-500" : "text-gray-400"} />
            <span className="font-medium">{agent.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {isAdminUser(user?.username) && (
              <Tooltip title="Agent Advanced Settings">
                <Button
                  type="text"
                  size="small"
                  icon={<SettingOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchFullAgentData(agent);
                  }}
                  loading={agentAdvancedSettingsLoading && selectedAgentForAdvanced?.name === agent.name}
                />
              </Tooltip>
            )}
            {isAdminUser(user?.username) && (
              <Switch
                checked={isActive}
                onChange={() => handleToggleAgentActive(agent)}
                checkedChildren="Active"
                unCheckedChildren="Inactive"
                size="small"
              />
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Status:</span>
          <Tag color={isActive ? 'green' : 'red'}>
            {isActive ? 'Active' : 'Inactive'}
          </Tag>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Working:</span>
          <Tag color={isWorking ? 'blue' : 'default'}>
            {isWorking ? 'Yes' : 'No'}
          </Tag>
        </div>

        {/* From Number Field */}
        {/* <div className="flex justify-between text-sm items-center">
          <span className="text-gray-500 flex items-center gap-1">
            <PhoneOutlined />
            From Number:
          </span>
          {isEditing ? (
            <div className="flex-1 ml-2">
              <Form.Item
                name="from_number"
                className="mb-0"
                style={{ marginBottom: 0 }}
              >
                <Input
                  size="small"
                  placeholder="Enter phone number"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </div>
          ) : (
            <Tooltip title={fromNumber}>
              <span className="text-xs text-gray-600 max-w-[100px] truncate">
                {fromNumber}
              </span>
            </Tooltip>
          )}
        </div> */}

        {/* Limit Field */}
        <div className="flex justify-between text-sm items-center">
          <span className="text-gray-500 flex items-center gap-1">
            <NumberOutlined />
            Max Calls:
          </span>
          {isEditing ? (
            <div className="flex-1 ml-2">
              <Form.Item
                name="limit"
                className="mb-0"
                style={{ marginBottom: 0 }}
              >
                <InputNumber
                  size="small"
                  min={1}
                  max={100}
                  placeholder="Max calls"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </div>
          ) : (
            <span className="text-xs text-gray-600">
              {limit || 'Not set'}
            </span>
          )}
        </div>

        {/* <div className="text-xs text-gray-500">
          Updated: {formatRelativeTime(agent.updated_at)}
        </div> */}

        <div className="text-sm text-gray-500">
          Working Count: {workingCount}
        </div>

        {/* <div className="text-xs text-gray-500">
          Check: {isChecking}
        </div> */}

        {/* Edit Form - Only show when editing */}
        {isEditing && (
          <Form
            form={editForm}
            onFinish={handleEditSubmit}
            className="pt-2 border-t"
          >
            <div className="flex gap-2">
              <Button
                size="small"
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading}
              >
                Save
              </Button>
              <Button
                size="small"
                icon={<CloseOutlined />}
                onClick={() => {
                  setEditingAgent(null);
                  editForm.resetFields();
                }}
              >
                Cancel
              </Button>
            </div>
          </Form>
        )}

      </div>
    </Card>
  );
};

  // Agent table columns
  const agentColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, agent: Agent) => (
        <div className="flex items-center gap-2">
          <RobotOutlined className={agent.active ? "text-green-500" : "text-gray-400"} />
          <span className="font-medium">{name}</span>
        </div>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (agent: Agent) => (
        <Tag color={agent.active ? 'green' : 'red'}>
          {agent.active ? 'Active' : 'Inactive'}
        </Tag>
      )
    },
    {
      title: 'Working',
      key: 'working',
      render: (agent: Agent) => (
        <Tag color={agent.execution_id ? 'blue' : 'default'}>
          {agent.execution_id ? 'Yes' : 'No'}
        </Tag>
      )
    },
    {
      title: 'Updated',
      key: 'updated',
      render: (agent: Agent) => formatRelativeTime(agent.updated_at)
    },
    ...(isAdminUser(user?.username)
      ? [
          {
            title: 'Actions',
            key: 'actions',
            render: (agent: Agent) => (
              <Switch
                checked={agent.active}
                onChange={() => handleToggleAgentActive(agent)}
                checkedChildren="Active"
                unCheckedChildren="Inactive"
                size="small"
              />
            )
          }
        ]
      : [])
  ];

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {selectedRoomFromRedux === 'main'
              ? 'Room & Agent Management'
              : `${selectedRoomFromRedux} - Room Management`}
          </h1>
          <p className="text-gray-600">
            {selectedRoomFromRedux === 'main'
              ? `${stats.totalRooms} rooms • ${stats.totalCapacity} total capacity • ${stats.totalAgents} agents (${stats.workingAgents} working)`
              : `${stats.totalCapacity} capacity • ${stats.totalAgents} agents (${stats.workingAgents} working)`}
          </p>
        </div>
        {isAdminUser(user?.username) && (
          <div className="flex gap-2">
            {selectedRoomFromRedux === 'main' && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsCreateRoomModalVisible(true)}
              >
                Request Room
              </Button>
            )}
            <Button
              icon={<ReloadOutlined />}
              onClick={refreshData}
              loading={loading}
            >
              Refresh
            </Button>
        </div>
        )}
      </div>

      {/* Stats Cards */}
      <Row gutter={16} className="mb-6">
        {selectedRoomFromRedux === 'main' && (
          <Col xs={24} sm={12} md={6} lg={4}>
            <Card className="text-center">
              <Statistic
                title="Total Rooms"
                value={stats.totalRooms}
                valueStyle={{ color: '#1890ff' }}
                prefix={<HomeOutlined />}
              />
            </Card>
          </Col>
        )}
        <Col xs={24} sm={12} md={6} lg={4}>
          <Card className="text-center">
            <Statistic 
              title="Total Agents" 
              value={stats.totalAgents} 
              valueStyle={{ color: '#722ed1' }}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={4}>
          <Card className="text-center">
            <Statistic 
              title="Working Agents" 
              value={stats.workingAgents} 
              valueStyle={{ color: '#52c41a' }}
              prefix={<PlayCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={4}>
          <Card className="text-center">
            <Statistic 
              title="Active Agents" 
              value={stats.activeAgents} 
              valueStyle={{ color: '#13c2c2' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={4}>
          <Card className="text-center">
            <Statistic 
              title="Inactive Agents" 
              value={stats.inactiveAgents} 
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={4}>
          <Card className="text-center">
            <Statistic 
              title="Capacity Used" 
              value={stats.capacityPercentage} 
              precision={1}
              suffix="%" 
              valueStyle={{ color: stats.capacityPercentage > 80 ? '#ff4d4f' : '#52c41a' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

     {/* Main Content Tabs */}
      <Card className="shadow-sm">
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          tabBarExtraContent={
            selectedRoom && (
              <div className="flex items-center gap-2">
                {/* Room Settings Display */}
                <div className="flex items-center gap-2 mr-2 px-3 py-1 bg-gray-100 rounded-lg">
                  <Tooltip title="Call Limit per Agent">
                    <span className="text-xs text-gray-600">Limit: <strong>{roomSettings.limit}</strong></span>
                  </Tooltip>
                  <span className="text-gray-300">|</span>
                  <Tooltip title="Time Limit per Call (seconds)">
                    <span className="text-xs text-gray-600">Time: <strong>{roomSettings.time_limit}s</strong></span>
                  </Tooltip>
                  <span className="text-gray-300">|</span>
                  <Tooltip title="From Number">
                    <span className="text-xs text-gray-600">From: <strong>{roomSettings.from_number || 'N/A'}</strong></span>
                  </Tooltip>
                  <span className="text-gray-300">|</span>
                  <Tooltip title="Telephony Region">
                    <span className="text-xs text-gray-600 capitalize">Telephony: <strong>{roomSettings.telephony || 'india'}</strong></span>
                  </Tooltip>
                  {isAdminUser(user?.username) && (
                    <Button
                      size="small"
                      type="link"
                      icon={<EditOutlined />}
                      onClick={() => {
                        roomSettingsForm.setFieldsValue({
                          limit: roomSettings.limit,
                          time_limit: roomSettings.time_limit,
                          from_number: roomSettings.from_number,
                          telephony: roomSettings.telephony
                        });
                        setIsRoomSettingsModalVisible(true);
                      }}
                    />
                  )}
                </div>
                {/* Room Enhance Button */}
                {isAdminUser(user?.username) && (
                  <Tooltip title={enhanceCooldown > 0 ? `Available in ${enhanceCooldown}s` : 'Refresh agent sessions'}>
                    <Button
                      size="small"
                      type="primary"
                      icon={<ThunderboltOutlined />}
                      onClick={handleRoomEnhance}
                      loading={roomEnhanceLoading}
                      disabled={enhanceCooldown > 0}
                    >
                      {enhanceCooldown > 0 ? `Enhance (${enhanceCooldown}s)` : 'Room Enhance'}
                    </Button>
                  </Tooltip>
                )}
                {/* Reload Configs Button */}
                {isAdminUser(user?.username) && (
                  <Tooltip title="Reload agent configurations">
                    <Button
                      size="small"
                      icon={<ReloadOutlined />}
                      onClick={handleReloadConfig}
                      loading={reloadConfigLoading}
                    >
                      Reload Configs
                    </Button>
                  </Tooltip>
                )}
                {/* Advanced Settings Button */}
                {isAdminUser(user?.username) && (
                  <Tooltip title="Configure advanced room settings and API keys">
                    <Button
                      size="small"
                      icon={<SettingOutlined />}
                      onClick={() => fetchFullRoomData(selectedRoom._id.$oid)}
                      loading={advancedSettingsLoading}
                    >
                      Advanced Settings
                    </Button>
                  </Tooltip>
                )}
                {selectedAgentIds.length > 0 && (
                  <Button
                    type="primary"
                    icon={<ThunderboltOutlined />}
                    onClick={() => {
                      // Pre-fill with config from first selected agent if available
                      const firstSelectedAgent = agents.find(agent =>
                        selectedAgentIds.includes(agent._id.$oid)
                      );
                      if (firstSelectedAgent) {
                        bulkConfigForm.setFieldsValue(firstSelectedAgent.config);
                      }
                      setIsBulkConfigModalVisible(true);
                    }}
                  >
                    Bulk Config ({selectedAgentIds.length})
                  </Button>
                )}
                {isAdminUser(user?.username) && selectedRoomFromRedux === 'main' && (
                  <>
                    <Button
                      size="small"
                      icon={<TeamOutlined />}
                      onClick={() => {
                        manageAgentsForm.setFieldsValue({ target_agent_count: selectedRoom.agent_count });
                        setIsManageAgentsModalVisible(true);
                      }}
                    >
                      Manage Agents
                    </Button>
                  </>
                )}
                <Switch
                  checkedChildren={<UnorderedListOutlined />}
                  unCheckedChildren={<AppstoreOutlined />}
                  checked={viewMode === 'list'}
                  onChange={(checked) => setViewMode(checked ? 'list' : 'grid')}
                />
              </div>
            )
          }
          items={[
            // Overview tab (only shown when in main)
            ...(selectedRoomFromRedux === 'main' ? [{
              key: 'overview',
              label: (
                <span>
                  <HomeOutlined />
                  Rooms Overview
                  {loading && activeTab === 'overview' && <Spin size="small" className="ml-2" />}
                </span>
              ),
              children: loading && activeTab === 'overview' ? (
                <div className="flex justify-center items-center h-64">
                  <Spin size="large" tip="Loading rooms..." />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredRooms.map(renderRoomOverviewCard)}
                </div>
              )
            }] : []),
            // Room tabs
            ...filteredRooms.map(room => {
              const roomAgentCount = getRoomAgentCount(room._id.$oid);
              const isCurrentRoomLoading = loading && selectedRoom?._id.$oid === room._id.$oid;
              const isCurrentTab = activeTab === `room-${room._id.$oid}`;

              return {
                key: `room-${room._id.$oid}`,
                label: (
                  <span>
                    <TeamOutlined />
                    {room.room_name}
                    <Badge
                      count={roomAgentCount}
                      style={{ marginLeft: 8 }}
                      showZero
                    />
                    {isCurrentRoomLoading && isCurrentTab && <Spin size="small" className="ml-2" />}
                  </span>
                ),
                children: (
                  <>
                    {/* Selection Summary */}
                    {selectedAgentIds.length > 0 && !isCurrentRoomLoading && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex justify-between items-center">
                          <span className="text-blue-800 font-medium">
                            <SelectOutlined className="mr-2" />
                            {selectedAgentIds.length} agent{selectedAgentIds.length !== 1 ? 's' : ''} selected
                          </span>
                          <div className="flex gap-2">
                            <Button
                              size="small"
                              onClick={() => setSelectedAgentIds([])}
                            >
                              Clear Selection
                            </Button>
                            <Button
                              size="small"
                              type="primary"
                              icon={<ThunderboltOutlined />}
                              onClick={() => {
                                const firstSelectedAgent = agents.find(agent =>
                                  selectedAgentIds.includes(agent._id.$oid)
                                );
                                if (firstSelectedAgent) {
                                  bulkConfigForm.setFieldsValue(firstSelectedAgent.config);
                                }
                                setIsBulkConfigModalVisible(true);
                              }}
                            >
                              Bulk Configure
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {isCurrentRoomLoading ? (
                      <div className="flex justify-center items-center h-64">
                        <Spin size="large" tip="Loading agents..." />
                      </div>
                    ) : viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {agents.map(renderAgentCard)}
                      </div>
                    ) : (
                      <Table
                        dataSource={agents}
                        columns={agentColumns}
                        rowKey={(agent) => agent._id.$oid}
                        pagination={{ pageSize: 10 }}
                        loading={false}
                      />
                    )}
                  </>
                )
              };
            })
          ]}
        />
      </Card>

      {/* Create Room Modal */}
      <Modal
        title="Request for New Room"
        open={isCreateRoomModalVisible}
        onCancel={() => {
          setIsCreateRoomModalVisible(false);
          setShowRequestSuccess(false);
          createRoomForm.resetFields();
        }}
        onOk={() => !showRequestSuccess && createRoomForm.submit()}
        okText={showRequestSuccess ? "Close" : "Create Request"}
        cancelText={showRequestSuccess ? null : "Cancel"}
        footer={showRequestSuccess ? [
          <Button
            key="close"
            type="primary"
            onClick={() => {
              setIsCreateRoomModalVisible(false);
              setShowRequestSuccess(false);
              createRoomForm.resetFields();
            }}
          >
            Close
          </Button>
        ] : undefined}
      >
        {showRequestSuccess ? (
          <div className="p-6 text-center">
            <div className="mb-4">
              <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a' }} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Request Submitted Successfully!</h3>
            <p className="text-gray-600">Your request has been created successfully. We will review it and get back to you soon.</p>
          </div>
        ) : (
          <Form
            form={createRoomForm}
            layout="vertical"
            onFinish={handleCreateRoom}
          >
              <Form.Item
              name="room_name"
              style={{ display: 'none' }}
              initialValue={`room-${rooms.length + 1}`}
              >
              <Input />
              </Form.Item>

              <Form.Item
                name="max_capacity"
                label="Maximum Capacity"
                initialValue={40}
                rules={[
                  { required: true, message: 'Please enter maximum capacity' },
                  { type: 'number', min: 1, max: 40, message: 'Must be between 1 and 40' }
                ]}
              >
                <InputNumber
                  min={1}
                  max={40}
                  placeholder="40"
                  style={{ width: '100%' }}
                  disabled
                />
              </Form.Item>

            <Form.Item
              name="description"
              label="Description (Optional)"
            >
              <TextArea
                rows={3}
                placeholder="Enter room description"
              />
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Manage Agents Modal */}
      <Modal
        title={`Manage Agents in ${selectedRoom?.room_name || 'Room'}`}
        open={isManageAgentsModalVisible}
        onCancel={() => {
          setIsManageAgentsModalVisible(false);
          manageAgentsForm.resetFields();
        }}
        onOk={() => manageAgentsForm.submit()}
        confirmLoading={loading}
      >
        <Form
          form={manageAgentsForm}
          layout="vertical"
          onFinish={handleManageAgents}
        >
          {selectedRoom && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Current Room Status</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Room:</span>
                  <span className="ml-2 font-medium">{selectedRoom.room_name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Current Agents:</span>
                  <span className="ml-2 font-medium">{getRoomAgentCount(selectedRoom._id.$oid)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Max Capacity:</span>
                  <span className="ml-2 font-medium">{selectedRoom.max_capacity}</span>
                </div>
                <div>
                  <span className="text-gray-600">Available Slots:</span>
                  <span className="ml-2 font-medium">{selectedRoom.max_capacity - getRoomAgentCount(selectedRoom._id.$oid)}</span>
                </div>
              </div>
            </div>
          )}
          
          <Form.Item
            name="target_agent_count"
            label="Target Number of Agents"
            rules={[
              { required: true, message: 'Please enter target number of agents' },
              { type: 'number', min: 1, message: 'Must be 1 or greater' },
              selectedRoom ? { 
                type: 'number', 
                max: selectedRoom.max_capacity, 
                message: `Cannot exceed room capacity of ${selectedRoom.max_capacity}` 
              } : {}
            ]}
          >
            <InputNumber 
              min={1} 
              max={selectedRoom?.max_capacity || 100}
              placeholder="Enter target number of agents"
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item dependencies={['target_agent_count']}>
            {({ getFieldValue }) => {
              const targetCount = getFieldValue('target_agent_count') || 0;
              const currentCount = getRoomAgentCount(selectedRoom ? selectedRoom._id.$oid : '');
              const difference = targetCount - currentCount;
              
              if (difference === 0) {
                return (
                  <div className="text-gray-500 text-sm">
                    No change to agent count
                  </div>
                );
              }
              
              const action = difference > 0 ? 'add' : 'remove';
              const absChange = Math.abs(difference);
              const color = difference > 0 ? 'text-green-600' : 'text-red-600';
              
              return (
                <div className={`text-sm ${color} font-medium`}>
                  This will {action} {absChange} agent{absChange !== 1 ? 's' : ''}
                  {selectedRoom && difference > 0 && targetCount > selectedRoom.max_capacity && (
                    <div className="text-red-500 mt-1">
                      ⚠️ Exceeds room capacity of {selectedRoom.max_capacity}
                    </div>
                  )}
                </div>
              );
            }}
          </Form.Item>
          
          {selectedRoom && (
            <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
              <p className="text-yellow-800 text-sm">
                <strong>Note:</strong> This operation will update the total number of agents in &quot;{selectedRoom.room_name}&quot; 
                to the specified target count. Agents may be added or removed as needed.
              </p>
            </div>
          )}
        </Form>
      </Modal>

      {/* Agent Configuration Modal - Dynamic fields from backend */}
      <Modal
        title={`Configure ${selectedAgent?.name || 'Agent'}`}
        open={isAgentConfigModalVisible}
        onCancel={() => {
          setIsAgentConfigModalVisible(false);
          setSelectedAgent(null);
          agentConfigForm.resetFields();
        }}
        onOk={() => agentConfigForm.submit()}
        confirmLoading={loading}
        width={800}
      >
        <Form
          form={agentConfigForm}
          layout="vertical"
          onFinish={handleSaveAgentConfig}
        >
          <Row gutter={16}>
            {selectedAgent?.config && Object.keys(selectedAgent.config).map((fieldKey) => (
              <Col span={12} key={fieldKey}>
                <Form.Item
                  name={fieldKey}
                  label={formatFieldLabel(fieldKey)}
                  rules={[{ required: true, message: 'Required' }]}
                >
                  {isSecretField(fieldKey) ? (
                    <Input.Password placeholder={`Enter ${formatFieldLabel(fieldKey)}`} />
                  ) : (
                    <Input placeholder={`Enter ${formatFieldLabel(fieldKey)}`} />
                  )}
                </Form.Item>
              </Col>
            ))}
          </Row>
          {(!selectedAgent?.config || Object.keys(selectedAgent.config).length === 0) && (
            <div className="text-center text-gray-500 py-8">
              No configuration fields available for this agent.
            </div>
          )}
        </Form>
      </Modal>

      {/* Bulk Agent Configuration Modal - Dynamic fields from backend */}
      <Modal
        title={`Bulk Configure ${selectedAgentIds.length} Agents`}
        open={isBulkConfigModalVisible}
        onCancel={() => {
          setIsBulkConfigModalVisible(false);
          bulkConfigForm.resetFields();
        }}
        onOk={() => bulkConfigForm.submit()}
        confirmLoading={loading}
        width={800}
      >
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Bulk Configuration</h4>
          <p className="text-sm text-blue-800">
            This will update the configuration for <strong>{selectedAgentIds.length}</strong> selected agents.
            All agents will receive the same configuration values.
          </p>
          <div className="mt-2 text-xs text-blue-600">
            Selected agents: {agents
              .filter(agent => selectedAgentIds.includes(agent._id.$oid))
              .map(agent => agent.name)
              .join(', ')}
          </div>
        </div>

        <Form
          form={bulkConfigForm}
          layout="vertical"
          onFinish={handleSaveBulkConfig}
        >
          <Row gutter={16}>
            {(() => {
              // Get config keys from first selected agent
              const firstSelectedAgent = agents.find(agent =>
                selectedAgentIds.includes(agent._id.$oid)
              );
              const configKeys = firstSelectedAgent?.config ? Object.keys(firstSelectedAgent.config) : [];

              return configKeys.map((fieldKey) => (
                <Col span={12} key={fieldKey}>
                  <Form.Item
                    name={fieldKey}
                    label={formatFieldLabel(fieldKey)}
                    rules={[{ required: true, message: 'Required' }]}
                  >
                    {isSecretField(fieldKey) ? (
                      <Input.Password placeholder={`Enter ${formatFieldLabel(fieldKey)}`} />
                    ) : (
                      <Input placeholder={`Enter ${formatFieldLabel(fieldKey)}`} />
                    )}
                  </Form.Item>
                </Col>
              ));
            })()}
          </Row>

          {(() => {
            const firstSelectedAgent = agents.find(agent =>
              selectedAgentIds.includes(agent._id.$oid)
            );
            if (!firstSelectedAgent?.config || Object.keys(firstSelectedAgent.config).length === 0) {
              return (
                <div className="text-center text-gray-500 py-8">
                  No configuration fields available for selected agents.
                </div>
              );
            }
            return null;
          })()}

          <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
            <p className="text-yellow-800 text-sm">
              <strong>Warning:</strong> This will overwrite the existing configuration for all selected agents.
              Make sure all fields are filled correctly before proceeding.
            </p>
          </div>
        </Form>
      </Modal>

      {/* Bulk Select Modal */}
      <Modal
        title="Bulk Select Agents"
        open={isBulkSelectModalVisible}
        onCancel={() => {
          setIsBulkSelectModalVisible(false);
          bulkSelectForm.resetFields();
        }}
        onOk={() => bulkSelectForm.submit()}
        width={600}
      >
        <Form
          form={bulkSelectForm}
          layout="vertical"
          onFinish={handleBulkSelectSubmit}
        >
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Quick Select Options</h4>
            <div className="flex flex-wrap gap-2">
              <Button 
                size="small" 
                onClick={() => handleSelectAllAgents(true)}
                type="dashed"
              >
                Select All
              </Button>
              <Button 
                size="small" 
                onClick={() => setSelectedAgentIds([])}
                type="dashed"
              >
                Clear All
              </Button>
              {getSuggestedRanges().slice(0, 6).map((range, index) => (
                <Button
                  key={index}
                  size="small"
                  type="dashed"
                  onClick={() => {
                    handleBulkSelectByRanges(range);
                    setIsBulkSelectModalVisible(false);
                  }}
                >
                  {range.length > 20 ? `${range.substring(0, 17)}...` : range}
                </Button>
              ))}
            </div>
          </div>

          <Form.Item
            name="ranges"
            label="Agent Ranges"
            help="Enter agent names or ranges separated by commas. Examples: 'agent-1 to agent-10', 'agent-5, agent-15 to agent-20', 'agent-1, agent-3, agent-7 to agent-12'"
            rules={[
              { required: true, message: 'Please enter agent ranges' }
            ]}
          >
            <TextArea
              rows={4}
              placeholder="agent-1 to agent-10, agent-21 to agent-30"
            />
          </Form.Item>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Available Agents</h4>
            <div className="max-h-40 overflow-y-auto">
              <div className="grid grid-cols-4 gap-2 text-sm">
                {agents
                  .sort((a, b) => {
                    const numA = extractAgentNumber(a.name);
                    const numB = extractAgentNumber(b.name);
                    if (numA === null && numB === null) return a.name.localeCompare(b.name);
                    if (numA === null) return 1;
                    if (numB === null) return -1;
                    return numA - numB;
                  })
                  .map(agent => (
                    <div
                      key={agent._id.$oid}
                      className={`p-1 rounded text-xs ${
                        selectedAgentIds.includes(agent._id.$oid)
                          ? 'bg-blue-200 text-blue-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {agent.name}
                    </div>
                  ))}
              </div>
            </div>
            <div className="mt-2 text-xs text-blue-600">
              Total agents: {agents.length} | Selected: {selectedAgentIds.length}
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
            <h4 className="font-medium text-yellow-800 mb-1">Syntax Guide:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Single agent: <code>agent-5</code></li>
              <li>• Range: <code>agent-1 to agent-10</code></li>
              <li>• Multiple: <code>agent-1, agent-5, agent-10 to agent-15</code></li>
              <li>• Case insensitive: <code>Agent-1</code> or <code>AGENT-1</code> works</li>
            </ul>
          </div>
        </Form>
      </Modal>

      {/* Custom Toggle Confirmation Modal */}
      <Modal
        title="Confirm Action"
        open={showToggleConfirm}
        onCancel={() => {
          setShowToggleConfirm(false);
          setAgentToToggle(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setShowToggleConfirm(false);
              setAgentToToggle(null);
            }}
          >
            No
          </Button>,
          <Button
            key="confirm"
            type="primary"
            loading={loading}
            onClick={confirmToggleAgent}
          >
            Yes
          </Button>
        ]}
      >
        {agentToToggle && (
          <div className="py-4">
            <p className="text-base text-gray-800">
              Are you sure you want to <strong>{agentToToggle.active ? 'deactivate' : 'activate'}</strong> <strong>{agentToToggle.name}</strong>?
            </p>
          </div>
        )}
      </Modal>

      {/* Room Settings Modal */}
      <Modal
        title={`Room Settings - ${selectedRoom?.room_name || 'Room'}`}
        open={isRoomSettingsModalVisible}
        onCancel={() => {
          setIsRoomSettingsModalVisible(false);
          roomSettingsForm.resetFields();
        }}
        onOk={() => roomSettingsForm.submit()}
        confirmLoading={loading}
      >
        <Form
          form={roomSettingsForm}
          layout="vertical"
          onFinish={(values) => {
            if (selectedRoom) {
              updateRoomSettings(selectedRoom.room_name, values);
            }
          }}
        >
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Current Settings</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Room:</span>
                <span className="ml-2 font-medium">{selectedRoom?.room_name}</span>
              </div>
              <div>
                <span className="text-gray-600">Limit:</span>
                <span className="ml-2 font-medium">{roomSettings.limit}</span>
              </div>
              <div>
                <span className="text-gray-600">Time:</span>
                <span className="ml-2 font-medium">{roomSettings.time_limit}s</span>
              </div>
              <div>
                <span className="text-gray-600">From Number:</span>
                <span className="ml-2 font-medium">{roomSettings.from_number || 'Not set'}</span>
              </div>
              <div>
                <span className="text-gray-600">Telephony:</span>
                <span className="ml-2 font-medium capitalize">{roomSettings.telephony || 'india'}</span>
              </div>
            </div>
          </div>

          <Form.Item
            name="limit"
            label="Call Limit (per agent)"
            rules={[
              { required: true, message: 'Please enter call limit' },
              { type: 'number', min: 1, max: 500, message: 'Must be between 1 and 500' }
            ]}
            tooltip="Maximum number of calls each agent can handle"
          >
            <InputNumber
              min={1}
              max={500}
              placeholder="90"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="time_limit"
            label="Time Limit (seconds)"
            rules={[
              { required: true, message: 'Please enter time limit' },
              { type: 'number', min: 30, max: 3600, message: 'Must be between 30 and 3600 seconds' }
            ]}
            tooltip="Maximum duration for each call in seconds"
          >
            <InputNumber
              min={30}
              max={3600}
              placeholder="300"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="from_number"
            label="From Number"
            tooltip="Phone number to use for outgoing calls"
          >
            <Input
              placeholder="Enter phone number"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="telephony"
            label="Telephony"
            tooltip="Select telephony region"
          >
            <Select
              placeholder="Select telephony"
              style={{ width: '100%' }}
            >
              <Option value="india">India</Option>
              <Option value="international">International</Option>
            </Select>
          </Form.Item>

          <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
            <p className="text-yellow-800 text-sm">
              <strong>Note:</strong> These settings will apply to all agents in &quot;{selectedRoom?.room_name}&quot;.
              Changes take effect immediately.
            </p>
          </div>
        </Form>
      </Modal>

      {/* Reload Config Response Modal */}
      <Modal
        title="Reload Config Response"
        open={isReloadConfigModalVisible}
        onCancel={() => {
          setIsReloadConfigModalVisible(false);
          setReloadConfigResponse(null);
        }}
        destroyOnClose
        footer={
          <Button
            type="primary"
            onClick={() => {
              setIsReloadConfigModalVisible(false);
              setReloadConfigResponse(null);
            }}
          >
            Close
          </Button>
        }
        width={700}
      >
        {reloadConfigResponse && (
          <div className="p-4">
            {reloadConfigResponse.error && !reloadConfigResponse.agent_responses ? (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <ExclamationCircleOutlined className="text-red-500 text-lg" />
                  <span className="font-medium text-red-800">Error</span>
                </div>
                <p className="text-red-700">{reloadConfigResponse.error}</p>
              </div>
            ) : (
              <div>
                {/* Summary Section */}
                <div className={`p-4 rounded-lg border mb-4 ${
                  reloadConfigResponse.status === 'success'
                    ? 'bg-green-50 border-green-200'
                    : reloadConfigResponse.status === 'partial_success'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    {reloadConfigResponse.status === 'success' ? (
                      <CheckCircleOutlined className="text-green-500 text-lg" />
                    ) : reloadConfigResponse.status === 'partial_success' ? (
                      <ExclamationCircleOutlined className="text-yellow-500 text-lg" />
                    ) : (
                      <ExclamationCircleOutlined className="text-red-500 text-lg" />
                    )}
                    <span className={`font-medium ${
                      reloadConfigResponse.status === 'success'
                        ? 'text-green-800'
                        : reloadConfigResponse.status === 'partial_success'
                        ? 'text-yellow-800'
                        : 'text-red-800'
                    }`}>
                      {reloadConfigResponse.message}
                    </span>
                  </div>
                  {reloadConfigResponse.summary && (
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-gray-500">Total</div>
                        <div className="font-semibold text-lg">{reloadConfigResponse.summary.total_agents}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-500">Success</div>
                        <div className="font-semibold text-lg text-green-600">{reloadConfigResponse.summary.successful}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-500">Failed</div>
                        <div className="font-semibold text-lg text-red-600">{reloadConfigResponse.summary.failed}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-500">Success Rate</div>
                        <div className="font-semibold text-lg">{reloadConfigResponse.summary.success_rate}%</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Agent Responses Table */}
                {reloadConfigResponse.agent_responses && (
                  <Table
                    dataSource={reloadConfigResponse.agent_responses}
                    rowKey={(record: any) => record.agent_id || record.agent_name}
                    pagination={false}
                    size="small"
                    scroll={{ y: 250 }}
                    columns={[
                      {
                        title: 'Agent',
                        dataIndex: 'agent_name',
                        key: 'agent_name',
                        width: 100,
                        sorter: (a: any, b: any) => {
                          const numA = parseInt(a.agent_name?.replace('agent-', '') || '0');
                          const numB = parseInt(b.agent_name?.replace('agent-', '') || '0');
                          return numA - numB;
                        },
                        defaultSortOrder: 'ascend' as const,
                      },
                      {
                        title: 'Status',
                        dataIndex: 'status',
                        key: 'status',
                        width: 90,
                        render: (status: string) => (
                          <Tag color={status === 'success' ? 'green' : 'red'}>{status}</Tag>
                        ),
                      },
                      {
                        title: 'Code',
                        dataIndex: 'status_code',
                        key: 'status_code',
                        width: 70,
                        render: (code: number) => (
                          <Tag color={code === 200 ? 'blue' : 'orange'}>{code}</Tag>
                        ),
                      },
                      {
                        title: 'Message',
                        key: 'message',
                        render: (record: any) => (
                          <span className={record.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                            {record.status === 'success'
                              ? record.response?.message
                              : record.error || 'Failed'}
                          </span>
                        ),
                      },
                    ]}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Advanced Settings Modal */}
      <Modal
        title={`Advanced Settings - ${selectedRoom?.room_name || 'Room'}`}
        open={isAdvancedSettingsModalVisible}
        onCancel={() => {
          setIsAdvancedSettingsModalVisible(false);
          advancedSettingsForm.resetFields();
          setFullRoomData(null);
          setOriginalConfigValues({});
          setNewConfigKeys([]);
        }}
        onOk={() => advancedSettingsForm.submit()}
        confirmLoading={advancedSettingsLoading}
        width={900}
        destroyOnClose
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        <Form
          form={advancedSettingsForm}
          layout="vertical"
          onFinish={handleAdvancedSettingsSubmit}
        >
          {/* Dynamic Config Section */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-4 pb-2 border-b flex items-center gap-2">
              <SettingOutlined />
              Room Configuration
            </h4>
            {fullRoomData?.config && Object.keys(fullRoomData.config).length > 0 ? (
              <>
                {/* Regular (non-nested) config fields */}
                <Row gutter={[16, 0]}>
                  {Object.entries(fullRoomData.config)
                    .filter(([, value]) => typeof value !== 'object' || value === null)
                    .map(([key]) => {
                      const isSecret = key.toLowerCase().includes('key') ||
                                       key.toLowerCase().includes('token') ||
                                       key.toLowerCase().includes('secret') ||
                                       key.toLowerCase().includes('password');

                      return (
                        <Col span={12} key={key}>
                          <Form.Item
                            name={`config_${key}`}
                            label={
                              <span className="flex items-center gap-2">
                                {formatFieldLabel(key)}
                                {isSecret && (
                                  <Tag color="orange" className="text-xs">Secret</Tag>
                                )}
                              </span>
                            }
                          >
                            {isSecret ? (
                              <Input.Password placeholder={`Enter ${formatFieldLabel(key)}`} />
                            ) : (
                              <Input placeholder={`Enter ${formatFieldLabel(key)}`} />
                            )}
                          </Form.Item>
                        </Col>
                      );
                    })}
                </Row>

                {/* Nested config objects */}
                {Object.entries(fullRoomData.config)
                  .filter(([, value]) => typeof value === 'object' && value !== null)
                  .map(([parentKey, nestedValue]) => {
                    return (
                      <div key={parentKey} className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h5 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                          {formatFieldLabel(parentKey)}
                          <Tag color="blue" className="text-xs">Nested Config</Tag>
                        </h5>
                        <Row gutter={[16, 0]}>
                          {Object.entries(nestedValue as Record<string, unknown>).map(([childKey]) => {
                            const isSecret = childKey.toLowerCase().includes('key') ||
                                             childKey.toLowerCase().includes('token') ||
                                             childKey.toLowerCase().includes('secret') ||
                                             childKey.toLowerCase().includes('password');

                            return (
                              <Col span={12} key={`${parentKey}_${childKey}`}>
                                <Form.Item
                                  name={`config_${parentKey}_${childKey}`}
                                  label={
                                    <span className="flex items-center gap-2 text-sm">
                                      {formatFieldLabel(childKey)}
                                      {isSecret && (
                                        <Tag color="orange" className="text-xs">Secret</Tag>
                                      )}
                                    </span>
                                  }
                                >
                                  {isSecret ? (
                                    <Input.Password placeholder={`Enter ${formatFieldLabel(childKey)}`} size="small" />
                                  ) : (
                                    <Input placeholder={`Enter ${formatFieldLabel(childKey)}`} size="small" />
                                  )}
                                </Form.Item>
                              </Col>
                            );
                          })}
                        </Row>
                      </div>
                    );
                  })}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <SettingOutlined className="text-4xl mb-2" />
                <p>No configuration found for this room</p>
              </div>
            )}
          </div>

          {/* Add New Config Keys Section */}
          <div className="mb-4 mt-4">
            <div className="flex items-center justify-between mb-4 pb-2 border-b">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <PlusOutlined />
                Add New Config Keys
              </h4>
              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => {
                  setNewConfigKeys([
                    ...newConfigKeys,
                    {
                      id: Date.now().toString(),
                      keyName: '',
                      isNested: false,
                      nestedKeys: [],
                      value: ''
                    }
                  ]);
                }}
              >
                Add Key
              </Button>
            </div>

            {newConfigKeys.map((configKey, index) => (
              <div key={configKey.id} className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-4 mb-3">
                  <Input
                    placeholder="Key Name (e.g., API_KEY or FIREWORKS_CONFIG)"
                    value={configKey.keyName}
                    onChange={(e) => {
                      const updated = [...newConfigKeys];
                      updated[index].keyName = e.target.value;
                      setNewConfigKeys(updated);
                    }}
                    style={{ flex: 1 }}
                  />
                  <Checkbox
                    checked={configKey.isNested}
                    onChange={(e) => {
                      const updated = [...newConfigKeys];
                      updated[index].isNested = e.target.checked;
                      if (e.target.checked && updated[index].nestedKeys.length === 0) {
                        updated[index].nestedKeys = [{ id: Date.now().toString(), keyName: '', value: '' }];
                      }
                      setNewConfigKeys(updated);
                    }}
                  >
                    Nested Object
                  </Checkbox>
                  <Button
                    type="text"
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => {
                      setNewConfigKeys(newConfigKeys.filter((_, i) => i !== index));
                    }}
                  />
                </div>

                {configKey.isNested ? (
                  <div className="ml-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-green-700 font-medium">Nested Keys:</span>
                      <Button
                        type="link"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          const updated = [...newConfigKeys];
                          updated[index].nestedKeys.push({
                            id: Date.now().toString(),
                            keyName: '',
                            value: ''
                          });
                          setNewConfigKeys(updated);
                        }}
                      >
                        Add Nested Key
                      </Button>
                    </div>
                    {configKey.nestedKeys.map((nestedKey, nIndex) => (
                      <div key={nestedKey.id} className="flex items-center gap-2 mb-2">
                        <Input
                          placeholder="Nested Key Name"
                          value={nestedKey.keyName}
                          onChange={(e) => {
                            const updated = [...newConfigKeys];
                            updated[index].nestedKeys[nIndex].keyName = e.target.value;
                            setNewConfigKeys(updated);
                          }}
                          style={{ flex: 1 }}
                          size="small"
                        />
                        <Input
                          placeholder="Value"
                          value={nestedKey.value}
                          onChange={(e) => {
                            const updated = [...newConfigKeys];
                            updated[index].nestedKeys[nIndex].value = e.target.value;
                            setNewConfigKeys(updated);
                          }}
                          style={{ flex: 1 }}
                          size="small"
                        />
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<CloseOutlined />}
                          onClick={() => {
                            const updated = [...newConfigKeys];
                            updated[index].nestedKeys = updated[index].nestedKeys.filter((_, ni) => ni !== nIndex);
                            setNewConfigKeys(updated);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Input
                    placeholder="Value"
                    value={configKey.value}
                    onChange={(e) => {
                      const updated = [...newConfigKeys];
                      updated[index].value = e.target.value;
                      setNewConfigKeys(updated);
                    }}
                  />
                )}
              </div>
            ))}

            {newConfigKeys.length === 0 && (
              <div className="text-center py-4 text-gray-400 text-sm">
                Click &quot;Add Key&quot; to add new configuration keys
              </div>
            )}
          </div>

          {/* Read-only Info Section */}
          {fullRoomData && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-3">Room Information (Read-only)</h4>
              <Row gutter={[16, 8]} className="text-sm">
                <Col span={8}>
                  <span className="text-gray-500">Room Name:</span>
                  <span className="ml-2 font-medium">{fullRoomData.room_name}</span>
                </Col>
                <Col span={8}>
                  <span className="text-gray-500">Agent Count:</span>
                  <span className="ml-2 font-medium">{fullRoomData.agent_count}</span>
                </Col>
                <Col span={8}>
                  <span className="text-gray-500">Max Capacity:</span>
                  <span className="ml-2 font-medium">{fullRoomData.max_capacity}</span>
                </Col>
                {fullRoomData.created_at && (
                  <Col span={8}>
                    <span className="text-gray-500">Created:</span>
                    <span className="ml-2 font-medium">{formatRelativeTime(fullRoomData.created_at)}</span>
                  </Col>
                )}
              </Row>
            </div>
          )}
        </Form>
      </Modal>

      {/* Agent Advanced Settings Modal */}
      <Modal
        title={`Agent Advanced Settings - ${selectedAgentForAdvanced?.name || 'Agent'}`}
        open={isAgentAdvancedSettingsModalVisible}
        onCancel={() => {
          setIsAgentAdvancedSettingsModalVisible(false);
          agentAdvancedSettingsForm.resetFields();
          setFullAgentData(null);
          setOriginalAgentConfigValues({});
          setNewAgentConfigKeys([]);
          setSelectedAgentForAdvanced(null);
          setAgentConfigEnabled(false);
        }}
        onOk={() => agentAdvancedSettingsForm.submit()}
        confirmLoading={agentAdvancedSettingsLoading}
        width={900}
        destroyOnClose
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        <Form
          form={agentAdvancedSettingsForm}
          layout="vertical"
          onFinish={handleAgentAdvancedSettingsSubmit}
        >
          {/* Config Agent Toggle */}
          <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SettingOutlined className="text-purple-600" />
                <span className="font-medium text-purple-900">Enable Agent Config</span>
                <Tooltip title="When enabled, this agent will use its own configuration. When disabled, agent config will not be applied.">
                  <ExclamationCircleOutlined className="text-purple-400 cursor-help" />
                </Tooltip>
              </div>
              <Switch
                checked={agentConfigEnabled}
                onChange={(checked) => setAgentConfigEnabled(checked)}
                checkedChildren="Enabled"
                unCheckedChildren="Disabled"
              />
            </div>
            <p className="text-xs text-purple-600 mt-2">
              {agentConfigEnabled
                ? "Agent configuration is active and will be applied."
                : "Agent configuration is disabled and will not be applied."}
            </p>
          </div>

          {/* Dynamic Config Section */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-4 pb-2 border-b flex items-center gap-2">
              <SettingOutlined />
              Agent Configuration
            </h4>
            {fullAgentData?.config && Object.keys(fullAgentData.config).length > 0 ? (
              <>
                {/* Regular (non-nested) config fields */}
                <Row gutter={[16, 0]}>
                  {Object.entries(fullAgentData.config)
                    .filter(([, value]) => typeof value !== 'object' || value === null)
                    .map(([key]) => {
                      const isSecret = key.toLowerCase().includes('key') ||
                                       key.toLowerCase().includes('token') ||
                                       key.toLowerCase().includes('secret') ||
                                       key.toLowerCase().includes('password');

                      return (
                        <Col span={12} key={key}>
                          <Form.Item
                            name={`config_${key}`}
                            label={
                              <span className="flex items-center gap-2">
                                {formatFieldLabel(key)}
                                {isSecret && (
                                  <Tag color="orange" className="text-xs">Secret</Tag>
                                )}
                              </span>
                            }
                          >
                            {isSecret ? (
                              <Input.Password placeholder={`Enter ${formatFieldLabel(key)}`} />
                            ) : (
                              <Input placeholder={`Enter ${formatFieldLabel(key)}`} />
                            )}
                          </Form.Item>
                        </Col>
                      );
                    })}
                </Row>

                {/* Nested config objects */}
                {Object.entries(fullAgentData.config)
                  .filter(([, value]) => typeof value === 'object' && value !== null)
                  .map(([parentKey, nestedValue]) => {
                    return (
                      <div key={parentKey} className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h5 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                          {formatFieldLabel(parentKey)}
                          <Tag color="blue" className="text-xs">Nested Config</Tag>
                        </h5>
                        <Row gutter={[16, 0]}>
                          {Object.entries(nestedValue as Record<string, unknown>).map(([childKey]) => {
                            const isSecret = childKey.toLowerCase().includes('key') ||
                                             childKey.toLowerCase().includes('token') ||
                                             childKey.toLowerCase().includes('secret') ||
                                             childKey.toLowerCase().includes('password');

                            return (
                              <Col span={12} key={`${parentKey}_${childKey}`}>
                                <Form.Item
                                  name={`config_${parentKey}_${childKey}`}
                                  label={
                                    <span className="flex items-center gap-2 text-sm">
                                      {formatFieldLabel(childKey)}
                                      {isSecret && (
                                        <Tag color="orange" className="text-xs">Secret</Tag>
                                      )}
                                    </span>
                                  }
                                >
                                  {isSecret ? (
                                    <Input.Password placeholder={`Enter ${formatFieldLabel(childKey)}`} size="small" />
                                  ) : (
                                    <Input placeholder={`Enter ${formatFieldLabel(childKey)}`} size="small" />
                                  )}
                                </Form.Item>
                              </Col>
                            );
                          })}
                        </Row>
                      </div>
                    );
                  })}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <SettingOutlined className="text-4xl mb-2" />
                <p>No configuration found for this agent</p>
              </div>
            )}
          </div>

          {/* Add New Config Keys Section */}
          <div className="mb-4 mt-4">
            <div className="flex items-center justify-between mb-4 pb-2 border-b">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <PlusOutlined />
                Add New Config Keys
              </h4>
              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => {
                  setNewAgentConfigKeys([
                    ...newAgentConfigKeys,
                    {
                      id: Date.now().toString(),
                      keyName: '',
                      isNested: false,
                      nestedKeys: [],
                      value: ''
                    }
                  ]);
                }}
              >
                Add Key
              </Button>
            </div>

            {newAgentConfigKeys.map((configKey, index) => (
              <div key={configKey.id} className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-4 mb-3">
                  <Input
                    placeholder="Key Name (e.g., API_KEY or FIREWORKS_CONFIG)"
                    value={configKey.keyName}
                    onChange={(e) => {
                      const updated = [...newAgentConfigKeys];
                      updated[index].keyName = e.target.value;
                      setNewAgentConfigKeys(updated);
                    }}
                    style={{ flex: 1 }}
                  />
                  <Checkbox
                    checked={configKey.isNested}
                    onChange={(e) => {
                      const updated = [...newAgentConfigKeys];
                      updated[index].isNested = e.target.checked;
                      if (e.target.checked && updated[index].nestedKeys.length === 0) {
                        updated[index].nestedKeys = [{ id: Date.now().toString(), keyName: '', value: '' }];
                      }
                      setNewAgentConfigKeys(updated);
                    }}
                  >
                    Nested Object
                  </Checkbox>
                  <Button
                    type="text"
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => {
                      setNewAgentConfigKeys(newAgentConfigKeys.filter((_, i) => i !== index));
                    }}
                  />
                </div>

                {configKey.isNested ? (
                  <div className="ml-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-green-700 font-medium">Nested Keys:</span>
                      <Button
                        type="link"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          const updated = [...newAgentConfigKeys];
                          updated[index].nestedKeys.push({
                            id: Date.now().toString(),
                            keyName: '',
                            value: ''
                          });
                          setNewAgentConfigKeys(updated);
                        }}
                      >
                        Add Nested Key
                      </Button>
                    </div>
                    {configKey.nestedKeys.map((nestedKey, nIndex) => (
                      <div key={nestedKey.id} className="flex items-center gap-2 mb-2">
                        <Input
                          placeholder="Nested Key Name"
                          value={nestedKey.keyName}
                          onChange={(e) => {
                            const updated = [...newAgentConfigKeys];
                            updated[index].nestedKeys[nIndex].keyName = e.target.value;
                            setNewAgentConfigKeys(updated);
                          }}
                          style={{ flex: 1 }}
                          size="small"
                        />
                        <Input
                          placeholder="Value"
                          value={nestedKey.value}
                          onChange={(e) => {
                            const updated = [...newAgentConfigKeys];
                            updated[index].nestedKeys[nIndex].value = e.target.value;
                            setNewAgentConfigKeys(updated);
                          }}
                          style={{ flex: 1 }}
                          size="small"
                        />
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<CloseOutlined />}
                          onClick={() => {
                            const updated = [...newAgentConfigKeys];
                            updated[index].nestedKeys = updated[index].nestedKeys.filter((_, ni) => ni !== nIndex);
                            setNewAgentConfigKeys(updated);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Input
                    placeholder="Value"
                    value={configKey.value}
                    onChange={(e) => {
                      const updated = [...newAgentConfigKeys];
                      updated[index].value = e.target.value;
                      setNewAgentConfigKeys(updated);
                    }}
                  />
                )}
              </div>
            ))}

            {newAgentConfigKeys.length === 0 && (
              <div className="text-center py-4 text-gray-400 text-sm">
                Click &quot;Add Key&quot; to add new configuration keys
              </div>
            )}
          </div>

          {/* Read-only Info Section */}
          {fullAgentData && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-3">Agent Information (Read-only)</h4>
              <Row gutter={[16, 8]} className="text-sm">
                <Col span={8}>
                  <span className="text-gray-500">Agent Name:</span>
                  <span className="ml-2 font-medium">{fullAgentData.name}</span>
                </Col>
                <Col span={8}>
                  <span className="text-gray-500">Active:</span>
                  <span className="ml-2 font-medium">{fullAgentData.active ? 'Yes' : 'No'}</span>
                </Col>
                <Col span={8}>
                  <span className="text-gray-500">Limit:</span>
                  <span className="ml-2 font-medium">{fullAgentData.limit || 'Not set'}</span>
                </Col>
                {fullAgentData.updated_at && (
                  <Col span={8}>
                    <span className="text-gray-500">Updated:</span>
                    <span className="ml-2 font-medium">{formatRelativeTime(fullAgentData.updated_at)}</span>
                  </Col>
                )}
                {fullAgentData.from_number && (
                  <Col span={8}>
                    <span className="text-gray-500">From Number:</span>
                    <span className="ml-2 font-medium">{fullAgentData.from_number}</span>
                  </Col>
                )}
              </Row>
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default RoomsAgentsDashboard;