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
  // Select, 
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
  SelectOutlined
} from '@ant-design/icons';
import { useAppSelector } from '@/redux/store';
import { API_BASE_URL, API_KEY } from "@/constants";
import axiosInstance from '@/lib/axios';

const { TabPane } = Tabs;
// const { Option } = Select;
const { TextArea } = Input;

const adminUsers: string[] = ["chetan@wordworksai.com", "ganesh@wordworksai.com"];

// TypeScript interfaces
interface AgentConfig {
  DEEPGRAM_API_KEY: string;
  CARTESIA_API_KEY: string;
  GROQ_API_KEY: string;
  PLIVO_AUTH_ID: string;
  PLIVO_AUTH_TOKEN: string;
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  AZURE_SPEECH_KEY: string;
  AZURE_SPEECH_REGION: string;
  AZURE_VOICE_NAME: string;
}

interface Agent {
  _id: { $oid: string };
  name: string;
  config: AgentConfig;
  execution_id: string | null;
  updated_at: { $date: string };
  room_id?: string;
}

interface Room {
  _id: { $oid: string };
  room_name: string;
  created_at: { $date: string };
  agent_count: number;
  max_capacity: number;
  description?: string;
}

const RoomsAgentsDashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
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
  const [isManageAgentsModalVisible, setIsManageAgentsModalVisible] = useState(false);
  const [isAgentConfigModalVisible, setIsAgentConfigModalVisible] = useState(false);
  const [isBulkConfigModalVisible, setIsBulkConfigModalVisible] = useState(false);
  const [isBulkSelectModalVisible, setIsBulkSelectModalVisible] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  
  // Forms
  const [createRoomForm] = Form.useForm();
  const [manageAgentsForm] = Form.useForm();
  const [agentConfigForm] = Form.useForm();
  const [bulkConfigForm] = Form.useForm();
  const [bulkSelectForm] = Form.useForm();

  // Fetch all rooms from API
  const fetchRooms = async () => {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/list-agent-rooms?api_key=${API_KEY}`);
      const data = response.data;
      if (data.status === 'success') {
        setRooms(data.data || []);
        // Fetch all agents from all rooms for accurate stats
        await fetchAllAgents(data.data || []);
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
          const response = await axiosInstance.get(`${API_BASE_URL}/agent-rooms/${room._id.$oid}/agents?api_key=${API_KEY}`);
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
      const response = await axiosInstance.get(`${API_BASE_URL}/agent-rooms/${roomId}/agents?api_key=${API_KEY}`);
      const data = response.data;
      if (data.status === 'success') {
        setAgents(data.data || []);
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
      const response = await axiosInstance.post(`${API_BASE_URL}/agent-rooms?api_key=${API_KEY}`, roomData);
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
      const response = await axiosInstance.post(`${API_BASE_URL}/update-instances/${numAgents}?api_key=${API_KEY}&room_id=${roomId}`);
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
      const response = await axiosInstance.put(`${API_BASE_URL}/agents/${agentId}/in-room?api_key=${API_KEY}`, { update_data: { config } });
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
      const response = await axiosInstance.put(`${API_BASE_URL}/agents/bulk-update?api_key=${API_KEY}`, {
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
      const response = await axiosInstance.delete(`${API_BASE_URL}/agents/${agentId}/from-room?api_key=${API_KEY}`);
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
      const response = await axiosInstance.delete(`${API_BASE_URL}/agents/${agentId}?api_key=${API_KEY}`);
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
      await fetchRooms(); // This will also fetch all agents
      if (selectedRoom) {
        await fetchRoomAgents(selectedRoom._id.$oid);
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate comprehensive statistics from all agents across all rooms
  const calculateStats = () => {
    const totalRooms = rooms.length;
    const totalAgents = allAgents.length; // Use actual agent count, not room.agent_count
    const totalCapacity = rooms.reduce((sum, room) => sum + (room.max_capacity || 0), 0);
    
    // Calculate agent states
    const workingAgents = allAgents.filter(agent => agent.execution_id !== null).length;
    const activeAgents = allAgents.filter(agent => isConfigComplete(agent.config)).length;
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
  }, []);

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

  // Handle tab change
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key.startsWith('room-')) {
      const roomId = key.replace('room-', '');
      const room = rooms.find(r => r._id.$oid === roomId);
      if (room) {
        setSelectedRoom(room);
        fetchRoomAgents(roomId);
      }
    } else {
      setSelectedRoom(null);
      setAgents([]);
    }
  };

  // Handle create room submission
  const handleCreateRoom = async (values: any) => {
    await createRoom(values);
    setIsCreateRoomModalVisible(false);
    createRoomForm.resetFields();
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

  // Agent action menu
  const getAgentActionMenu = (agent: Agent) => ({
    items: [
      {
        key: 'configure',
        label: 'Configure',
        icon: <SettingOutlined />,
        onClick: () => {
          setSelectedAgent(agent);
          agentConfigForm.setFieldsValue(agent.config);
          setIsAgentConfigModalVisible(true);
        }
      },
      // {
      //   key: 'remove',
      //   label: 'Remove from Room',
      //   icon: <DeleteOutlined />,
      //   onClick: () => {
      //     Modal.confirm({
      //       title: 'Remove Agent from Room',
      //       content: `Are you sure you want to remove ${agent.name} from its room?`,
      //       onOk: () => removeAgentFromRoom(agent._id.$oid)
      //     });
      //   }
      // },
      // {
      //   key: 'delete',
      //   label: 'Delete Agent',
      //   icon: <DeleteOutlined />,
      //   danger: true,
      //   onClick: () => {
      //     Modal.confirm({
      //       title: 'Delete Agent',
      //       content: `Are you sure you want to permanently delete ${agent.name}? This action cannot be undone.`,
      //       onOk: () => deleteAgent(agent._id.$oid)
      //     });
      //   }
      // }
    ]
  });

  const stats = calculateStats();

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
        onClick={() => setActiveTab(`room-${room._id.$oid}`)}
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

  // Render agent card
  const renderAgentCard = (agent: Agent) => {
    const isActive = isConfigComplete(agent.config);
    const isWorking = agent.execution_id !== null;
    const isSelected = selectedAgentIds.includes(agent._id.$oid);

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
            {user?.username && adminUsers.includes(user.username) && (
              <Dropdown menu={getAgentActionMenu(agent)} trigger={['click']}>
                <Button type="text" size="small" icon={<MoreOutlined />} />
              </Dropdown>
            )}
          </div>
        }
        extra={
          <div className="flex gap-1">
            <Badge status={isActive ? "success" : "error"} />
            <Badge status={isWorking ? "processing" : "default"} />
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

          <div className="text-xs text-gray-500">
            Updated: {formatRelativeTime(agent.updated_at)}
          </div>

          {/* <div className="flex gap-1 pt-2">
            <Button 
              size="small" 
              type="primary" 
              icon={<SettingOutlined />}
              onClick={() => {
                setSelectedAgent(agent);
                agentConfigForm.setFieldsValue(agent.config);
                setIsAgentConfigModalVisible(true);
              }}
            >
              Config
            </Button>
          </div> */}
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
          <RobotOutlined className={isConfigComplete(agent.config) ? "text-green-500" : "text-gray-400"} />
          <span className="font-medium">{name}</span>
        </div>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (agent: Agent) => (
        <Tag color={isConfigComplete(agent.config) ? 'green' : 'red'}>
          {isConfigComplete(agent.config) ? 'Active' : 'Inactive'}
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
    ...(user?.username && adminUsers.includes(user.username)
      ? [
          {
            title: 'Actions',
            key: 'actions',
            render: (agent: Agent) => (
              <Space>
                <Dropdown menu={getAgentActionMenu(agent)} trigger={['click']}>
                  <Button type="text" size="small" icon={<MoreOutlined />} />
                </Dropdown>
              </Space>
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
          <h1 className="text-2xl font-bold text-gray-900">Room & Agent Management</h1>
          <p className="text-gray-600">
            {stats.totalRooms} rooms • {stats.totalCapacity} total capacity • {stats.totalAgents} agents ({stats.workingAgents} working)
          </p>
        </div>
        {user?.username && adminUsers.includes(user.username) && (
          <div className="flex gap-2">
            <Button 
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateRoomModalVisible(true)}
            >
              Create Room
            </Button>
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
                {user?.username && adminUsers.includes(user.username) && (
                  <>
                    <Button 
                      icon={<SelectOutlined />}
                      onClick={() => setIsBulkSelectModalVisible(true)}
                    >
                      Bulk Select
                    </Button>
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
        >
          <TabPane 
            tab={
              <span>
                <HomeOutlined />
                Rooms Overview
                {loading && activeTab === 'overview' && <Spin size="small" className="ml-2" />}
              </span>
            } 
            key="overview"
          >
            {loading && activeTab === 'overview' ? (
              <div className="flex justify-center items-center h-64">
                <Spin size="large" tip="Loading rooms..." />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {rooms.map(renderRoomOverviewCard)}
              </div>
            )}
          </TabPane>

          {rooms.map(room => {
            const roomAgentCount = getRoomAgentCount(room._id.$oid);
            const isCurrentRoomLoading = loading && selectedRoom?._id.$oid === room._id.$oid;
            const isCurrentTab = activeTab === `room-${room._id.$oid}`;
            
            return (
              <TabPane 
                tab={
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
                } 
                key={`room-${room._id.$oid}`}
              >
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
                          icon={<SelectOutlined />}
                          onClick={() => setIsBulkSelectModalVisible(true)}
                        >
                          Bulk Select
                        </Button>
                        <Button 
                          size="small" 
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
                    loading={false} // Prevent table's internal loading since we handle it above
                  />
                )}
              </TabPane>
            );
          })}
        </Tabs>
      </Card>

      {/* Create Room Modal */}
      <Modal
        title="Create New Room"
        open={isCreateRoomModalVisible}
        onCancel={() => {
          setIsCreateRoomModalVisible(false);
          createRoomForm.resetFields();
        }}
        onOk={() => createRoomForm.submit()}
        confirmLoading={loading}
      >
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

      {/* Agent Configuration Modal */}
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
            <Col span={12}>
              <Form.Item
                name="DEEPGRAM_API_KEY"
                label="Deepgram API Key"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input.Password placeholder="Enter Deepgram API key" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="CARTESIA_API_KEY"
                label="Cartesia API Key"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input.Password placeholder="Enter Cartesia API key" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="GROQ_API_KEY"
                label="Groq API Key"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input.Password placeholder="Enter Groq API key" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="PLIVO_AUTH_ID"
                label="Plivo Auth ID"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input placeholder="Enter Plivo Auth ID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="PLIVO_AUTH_TOKEN"
                label="Plivo Auth Token"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input.Password placeholder="Enter Plivo Auth Token" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="TWILIO_ACCOUNT_SID"
                label="Twilio Account SID"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input placeholder="Enter Twilio Account SID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="TWILIO_AUTH_TOKEN"
                label="Twilio Auth Token"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input.Password placeholder="Enter Twilio Auth Token" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="AZURE_SPEECH_KEY"
                label="Azure Speech Key"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input.Password placeholder="Enter Azure Speech Key" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="AZURE_SPEECH_REGION"
                label="Azure Speech Region"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input placeholder="Enter Azure Speech Region" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="AZURE_VOICE_NAME"
                label="Azure Voice Name"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input placeholder="Enter Azure Voice Name" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Bulk Agent Configuration Modal */}
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
            <Col span={12}>
              <Form.Item
                name="DEEPGRAM_API_KEY"
                label="Deepgram API Key"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input.Password placeholder="Enter Deepgram API key" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="CARTESIA_API_KEY"
                label="Cartesia API Key"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input.Password placeholder="Enter Cartesia API key" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="GROQ_API_KEY"
                label="Groq API Key"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input.Password placeholder="Enter Groq API key" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="PLIVO_AUTH_ID"
                label="Plivo Auth ID"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input placeholder="Enter Plivo Auth ID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="PLIVO_AUTH_TOKEN"
                label="Plivo Auth Token"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input.Password placeholder="Enter Plivo Auth Token" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="TWILIO_ACCOUNT_SID"
                label="Twilio Account SID"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input placeholder="Enter Twilio Account SID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="TWILIO_AUTH_TOKEN"
                label="Twilio Auth Token"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input.Password placeholder="Enter Twilio Auth Token" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="AZURE_SPEECH_KEY"
                label="Azure Speech Key"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input.Password placeholder="Enter Azure Speech Key" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="AZURE_SPEECH_REGION"
                label="Azure Speech Region"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input placeholder="Enter Azure Speech Region" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="AZURE_VOICE_NAME"
                label="Azure Voice Name"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input placeholder="Enter Azure Voice Name" />
              </Form.Item>
            </Col>
          </Row>
          
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
    </div>
  );
};

export default RoomsAgentsDashboard;