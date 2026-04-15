"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Row, Col, Statistic, Progress, Spin, Alert, Tag, DatePicker, Select, Button, Space, Tabs, Badge, Dropdown } from 'antd';
import {
  PhoneOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SoundOutlined,
  CalendarOutlined,
  FilterOutlined,
  ClearOutlined,
  SearchOutlined,
  BarChartOutlined,
  UserOutlined,
  MessageOutlined,
  GlobalOutlined,
  SyncOutlined,
  LoadingOutlined,
  ThunderboltOutlined,
  CloseCircleOutlined,
  DownOutlined,
  ReloadOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  FiPhone,
  FiCheckCircle,
  FiXCircle,
  FiCalendar,
  FiBarChart,
  FiDollarSign,
  FiPhoneCall,
  FiPhoneOff,
  FiPhoneMissed,
  FiRotateCcw,
  FiClock,
  FiAlertCircle,
  FiAlertTriangle,
  FiAlertOctagon,
  FiThumbsDown,
  FiInfo,
  FiMessageCircle,
  FiMessageSquare,
  FiUserX,
  FiUsers,
  FiMeh,
  FiVolumeX,
  FiVolume2,
  FiFileText
} from "react-icons/fi";
import { IndianRupee } from 'lucide-react';
import StatCardValue from './NewSalesVoiceBotStatusDashv2/SalesBotStatusDash/StatCardValue';
import dayjs from 'dayjs';
import { API_BASE_URL, API_KEY } from "@/constants";
import { useRoomAPI, appendRoomParam } from '@/hooks/useRoomAPI';
import axiosInstance from '@/lib/axios';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

interface FilterState {
  filterType: 'monthly' | 'range';
  dateRange: [any | null, any | null] | null;
  month: string | null;
  executionIds: string[];
}

interface SectionData {
  [key: string]: any;
}

interface LoadingState {
  call_overview: boolean;
  disposition_analysis: boolean;
  conversation_analysis: boolean;
  user_behavior: boolean;
  information_tracking: boolean;
  language_distribution: boolean;
}

interface JobStatus {
  status: 'idle' | 'generating' | 'processing' | 'completed' | 'failed';
  jobId: string | null;
  message: string | null;
  error: string | null;
  progress: number;
  section: string | null;
  source?: 'cache' | 'new_job' | 'existing_job' | null;
}

interface GenerateResponse {
  status: 'success' | 'processing';
  source: 'cache' | 'new_job' | 'existing_job';
  message: string;
  job_id?: string;
  status_link?: string;
  days_included?: number;
  data?: any;
}

const LOCALSTORAGE_KEY = 'call_analytics_active_jobs';

const COLORS = ['#263978', '#4A90E2', '#7BB3F0', '#A8D0F0', '#D4E6F7'];
const MAIN_COLOR = '#263978';

const CallAnalyticsDashboard = () => {
  const { selectedRoom } = useRoomAPI();
  const [sectionData, setSectionData] = useState<SectionData>({});
  const [loading, setLoading] = useState<LoadingState>({
    call_overview: false,
    disposition_analysis: false,
    conversation_analysis: false,
    user_behavior: false,
    information_tracking: false,
    language_distribution: false
  });
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('call_overview');
  const [filters, setFilters] = useState<FilterState>({
    filterType: 'monthly',
    dateRange: null,
    month: dayjs().format('YYYY-MM'),
    executionIds: []
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const prevFiltersRef = useRef<string>('');
  const [jobStatus, setJobStatus] = useState<JobStatus>({
    status: 'idle',
    jobId: null,
    message: null,
    error: null,
    progress: 0,
    section: null
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [dataSource, setDataSource] = useState<'cache' | 'generated' | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper functions for localStorage
  const saveJobToStorage = useCallback((jobId: string, section: string) => {
    if (typeof window !== 'undefined') {
      const jobs = JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY) || '{}');
      jobs[jobId] = { section, startedAt: Date.now() };
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(jobs));
    }
  }, []);

  const removeJobFromStorage = useCallback((jobId: string) => {
    if (typeof window !== 'undefined') {
      const jobs = JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY) || '{}');
      delete jobs[jobId];
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(jobs));
    }
  }, []);

  const getJobsFromStorage = useCallback((): Record<string, { section: string; startedAt: number }> => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY) || '{}');
    }
    return {};
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsInitialized(true);
    }
  }, []);

  // Build common filter params for API calls
  const buildFilterParams = useCallback((section?: string) => {
    const params = new URLSearchParams();
    params.append('api_key', API_KEY);

    if (section) {
      params.append('section', section);
    }

    if (filters.filterType === 'range') {
      if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
        params.append('start_date', filters.dateRange[0].format('YYYY-MM-DD'));
        params.append('end_date', filters.dateRange[1].format('YYYY-MM-DD'));
      }
    } else if (filters.filterType === 'monthly') {
      if (filters.month) {
        params.append('month', filters.month);
      }
    }

    if (filters.executionIds.length > 0) {
      params.append('execution_ids', filters.executionIds.join(','));
    }

    if (selectedRoom && selectedRoom !== 'main') {
      params.append('room', selectedRoom);
    }

    return params;
  }, [filters, selectedRoom]);

  // POST /dashboard/all-call-metrics/generate - Combined endpoint (cache check + job start)
  // Returns cached data immediately if available, otherwise starts a background job
  const generateMetrics = useCallback(async (forceRegenerate: boolean = false): Promise<GenerateResponse | null> => {
    const params = buildFilterParams();

    // Add combine and force_regenerate parameters
    params.append('combine', 'true');
    if (forceRegenerate) {
      params.append('force_regenerate', 'true');
    }

    const url = appendRoomParam(`${API_BASE_URL}/dashboard/all-call-metrics/generate?${params.toString()}`);

    try {
      const response = await axiosInstance.post(url);
      const result: GenerateResponse = response.data;
      return result;
    } catch (err) {
      console.error('Error generating metrics:', err);
      return null;
    }
  }, [buildFilterParams]);

  // GET /dashboard/all-call-metrics/status/{job_id} - Check job status
  const checkJobStatus = useCallback(async (jobId: string): Promise<{ status: string; error?: string; progress?: number }> => {
    const url = appendRoomParam(`${API_BASE_URL}/dashboard/all-call-metrics/status/${jobId}?api_key=${API_KEY}`);

    try {
      const response = await axiosInstance.get(url);
      const result = response.data;
      return {
        status: result.job_status || result.status,
        error: result.error,
        progress: result.progress || 0
      };
    } catch (err) {
      console.error('Error checking job status:', err);
      return { status: 'failed', error: 'Failed to check job status', progress: 0 };
    }
  }, []);

  // GET /dashboard/all-call-metrics/search - Retrieve stored metrics
  const searchMetrics = useCallback(async (section?: string): Promise<any> => {
    const params = buildFilterParams(section);
    const url = appendRoomParam(`${API_BASE_URL}/dashboard/all-call-metrics/search?${params.toString()}`);

    try {
      const response = await axiosInstance.get(url);
      const result = response.data;

      // Response structure: { status: "success", data: { call_overview: {...}, disposition_analysis: {...}, ... } }
      if (result.status === 'success' && result.data) {
        // If section is specified, return just that section's data
        if (section && result.data[section]) {
          return result.data[section];
        }
        // Otherwise return all data
        return result.data;
      }

      return null;
    } catch (err) {
      console.error('Error searching metrics:', err);
      return null;
    }
  }, [buildFilterParams]);

  // Poll job status until completed or failed
  const pollJobStatus = useCallback(async (jobId: string, section: string): Promise<boolean> => {
    return new Promise((resolve) => {
      // Clear any existing polling interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      const poll = async () => {
        const result = await checkJobStatus(jobId);
        const progress = result.progress || 0;

        if (result.status === 'completed') {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          // Remove from localStorage immediately on completion
          removeJobFromStorage(jobId);
          // Reset job status immediately (remove from UI)
          setJobStatus({ status: 'idle', jobId: null, message: null, error: null, progress: 0, section: null });
          setIsGenerating(false);
          resolve(true);
        } else if (result.status === 'failed') {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          // Remove from localStorage on failure
          removeJobFromStorage(jobId);
          setJobStatus({ status: 'failed', jobId, message: null, error: result.error || 'Job failed', progress: 0, section });
          resolve(false);
        } else {
          // Still processing - update progress
          setJobStatus({ status: 'processing', jobId, message: `Processing... ${progress}%`, error: null, progress, section });
        }
      };

      // Initial check
      poll();

      // Poll every 2 seconds
      pollingIntervalRef.current = setInterval(poll, 2000);

      // Timeout after 5 minutes
      setTimeout(() => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
          removeJobFromStorage(jobId);
          setJobStatus({ status: 'failed', jobId, message: null, error: 'Job timed out', progress: 0, section });
          resolve(false);
        }
      }, 300000);
    });
  }, [checkJobStatus, removeJobFromStorage]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Fetch all metrics from search endpoint (API returns all sections at once)
  const fetchAllSectionData = useCallback(async () => {
    try {
      // Set loading for all sections
      setLoading({
        call_overview: true,
        disposition_analysis: true,
        conversation_analysis: true,
        user_behavior: true,
        information_tracking: true,
        language_distribution: true
      });

      const allData = await searchMetrics();

      if (allData) {
        setSectionData(allData);
        setError(null);
      } else {
        // No data found, set empty structures for all sections
        setSectionData({
          call_overview: getEmptyDataForSection('call_overview'),
          disposition_analysis: getEmptyDataForSection('disposition_analysis'),
          conversation_analysis: getEmptyDataForSection('conversation_analysis'),
          user_behavior: getEmptyDataForSection('user_behavior'),
          information_tracking: getEmptyDataForSection('information_tracking'),
          language_distribution: getEmptyDataForSection('language_distribution')
        });
      }
    } catch (err: any) {
      setError(`Failed to load data: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading({
        call_overview: false,
        disposition_analysis: false,
        conversation_analysis: false,
        user_behavior: false,
        information_tracking: false,
        language_distribution: false
      });
    }
  }, [searchMetrics]);

  // Alias for backward compatibility
  const fetchSectionData = fetchAllSectionData;

  // Generate new metrics and then fetch (triggered by Generate button)
  // Now uses the combined endpoint that checks cache first
  const generateAndFetchData = useCallback(async (forceRegenerate: boolean = false) => {
    try {
      // Don't set loading - keep showing existing data while generating
      setIsGenerating(true);
      setJobStatus({ status: 'generating', jobId: null, message: 'Checking cache and starting generation...', error: null, progress: 0, section: 'all', source: null });

      // Step 1: Call the combined generate endpoint
      const result = await generateMetrics(forceRegenerate);

      if (!result) {
        throw new Error('Failed to start metrics generation');
      }

      // Handle different response scenarios
      if (result.status === 'success' && result.source === 'cache') {
        // Cached data found - use it directly
        console.log(`Using cached data (${result.days_included} days included)`);
        setSectionData(result.data || {});
        setDataSource('cache');
        setError(null);
        setJobStatus({ status: 'idle', jobId: null, message: null, error: null, progress: 0, section: null, source: 'cache' });
        setIsGenerating(false);
        return;
      }

      // Job is processing (either new_job or existing_job)
      const jobId = result.job_id;
      if (!jobId) {
        throw new Error('No job ID returned from server');
      }

      const isExistingJob = result.source === 'existing_job';
      console.log(`${isExistingJob ? 'Resuming existing' : 'Starting new'} job: ${jobId}`);

      // Save job to localStorage for persistence (only for new jobs)
      if (!isExistingJob) {
        saveJobToStorage(jobId, 'all');
      }

      setJobStatus({
        status: 'processing',
        jobId,
        message: isExistingJob ? 'Resuming existing job... 0%' : 'Processing... 0%',
        error: null,
        progress: 0,
        section: 'all',
        source: result.source
      });

      // Step 2: Poll until job completes
      const success = await pollJobStatus(jobId, 'all');

      if (!success) {
        throw new Error('Metrics generation failed');
      }

      // Step 3: Auto-fetch the generated metrics (search) after completion
      // Job status is already reset to idle by pollJobStatus on completion
      await fetchSectionData();
      setDataSource('generated');
      setError(null);

    } catch (err: any) {
      setError(`Failed to generate data: ${err.message || 'Unknown error'}`);
      setJobStatus({ status: 'failed', jobId: null, message: null, error: err.message || 'Generation failed', progress: 0, section: 'all', source: null });
    } finally {
      setIsGenerating(false);
    }
  }, [generateMetrics, pollJobStatus, saveJobToStorage, fetchSectionData]);

  // Resume polling from localStorage on page load
  useEffect(() => {
    const resumeStoredJobs = async () => {
      const storedJobs = getJobsFromStorage();
      const jobEntries = Object.entries(storedJobs);

      if (jobEntries.length > 0) {
        // Resume the first stored job (only one job at a time)
        const [jobId, { section }] = jobEntries[0];

        // Check if job is still valid (not older than 5 minutes)
        const jobAge = Date.now() - storedJobs[jobId].startedAt;
        if (jobAge < 300000) { // 5 minutes
          setIsGenerating(true);
          setJobStatus({ status: 'processing', jobId, message: 'Resuming job...', error: null, progress: 0, section });

          // Resume polling
          const success = await pollJobStatus(jobId, section);

          if (success) {
            // Auto-fetch search results after completion
            await fetchSectionData();
          }

          setIsGenerating(false);
        } else {
          // Job is too old, remove from storage
          removeJobFromStorage(jobId);
        }
      }
    };

    if (isInitialized) {
      resumeStoredJobs();
    }
  }, [isInitialized, getJobsFromStorage, pollJobStatus, fetchSectionData, removeJobFromStorage]);

  const getEmptyDataForSection = (section: string) => {
    switch (section) {
      case 'call_overview':
        return {
          call_distribution: {
            total_calls: 0,
            answered_calls: 0,
            busy_calls: 0,
            not_answered_calls: 0,
            failed_calls: 0,
            ongoing_calls: 0,
            voicemail: 0,
            execution_count: 0,
            total_emi_amount: 0
          },
          execution_summary: []
        };
      case 'disposition_analysis':
        return { disposition_codes: {} };
      case 'conversation_analysis':
        return { conversation_stages: {}, conversation_strategies: {} };
      case 'user_behavior':
        return {
          user_cooperation_levels: {},
          interruption_patterns: {},
          interruption_statistics: { avg_interruptions: 0, max_interruptions: 0, min_interruptions: 0 }
        };
      case 'information_tracking':
        return {
          information_status: {},
          commitment_statistics: { commitment_date_set: 0, no_commitment_date: 0 }
        };
      case 'language_distribution':
        return { language_distribution: {} };
      default:
        return {};
    }
  };

  // Clear cached data and refetch when room or filters change
  useEffect(() => {
    if (!isInitialized) return;

    const currentFilters = JSON.stringify({ filters, selectedRoom });
    if (prevFiltersRef.current !== currentFilters) {
      prevFiltersRef.current = currentFilters;
      setSectionData({});
      fetchSectionData();
    }
  }, [selectedRoom, filters, isInitialized, fetchSectionData]);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const applyFilters = () => {
    // Clear cached data and reload all sections
    setSectionData({});
    fetchSectionData();
  };

  const clearFilters = () => {
    setFilters({
      filterType: 'monthly',
      dateRange: null,
      month: dayjs().format('YYYY-MM'),
      executionIds: []
    });
    setTimeout(() => {
      setSectionData({});
      fetchSectionData();
    }, 100);
  };

  const hasActiveFilters = () => {
    return filters.dateRange || filters.month || filters.executionIds.length > 0;
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  const getDispositionColors = (code: string) => {
    switch (code.toUpperCase()) {
      // POSITIVE OUTCOMES (green/blue tones)
      case 'PTP':
        return { bgColor: "bg-blue-100", iconColor: "text-blue-600" };
      case 'PAID':
        return { bgColor: "bg-green-100", iconColor: "text-green-600" };
      case 'PAYNOW':
        return { bgColor: "bg-emerald-100", iconColor: "text-emerald-600" };

      // NEGATIVE/REFUSAL (red/rose tones)
      case 'RTP':
        return { bgColor: "bg-red-100", iconColor: "text-red-600" };
      case 'RTPF':
        return { bgColor: "bg-orange-100", iconColor: "text-orange-600" };
      case 'RTP_DISPUTE':
        return { bgColor: "bg-rose-100", iconColor: "text-rose-600" };
      case 'NI':
        return { bgColor: "bg-red-100", iconColor: "text-red-600" };
      case 'DND':
        return { bgColor: "bg-red-100", iconColor: "text-red-600" };

      // FOLLOW-UP NEEDED (cyan/yellow/amber tones)
      case 'CLBK':
        return { bgColor: "bg-cyan-100", iconColor: "text-cyan-600" };
      case 'CLBK_BUSY':
        return { bgColor: "bg-yellow-100", iconColor: "text-yellow-600" };
      case 'CLBK_DATE':
        return { bgColor: "bg-sky-100", iconColor: "text-sky-600" };
      case 'DISPUTE':
        return { bgColor: "bg-amber-100", iconColor: "text-amber-600" };

      // INCOMPLETE ENGAGEMENT (orange/slate tones)
      case 'EARLY_DISCONNECT':
        return { bgColor: "bg-orange-100", iconColor: "text-orange-600" };
      case 'INFO_GIVEN_NO_RESPONSE':
        return { bgColor: "bg-slate-100", iconColor: "text-slate-600" };
      case 'MINIMAL_ENGAGEMENT':
        return { bgColor: "bg-zinc-100", iconColor: "text-zinc-600" };
      case 'CUT_MID_CONVERSATION':
        return { bgColor: "bg-orange-100", iconColor: "text-orange-600" };

      // WRONG CONTACT (pink/purple/indigo tones)
      case 'WRONG_NUMBER':
        return { bgColor: "bg-pink-100", iconColor: "text-pink-600" };
      case 'THIRD_PARTY':
        return { bgColor: "bg-purple-100", iconColor: "text-purple-600" };
      case 'LANGUAGE_BARRIER':
        return { bgColor: "bg-indigo-100", iconColor: "text-indigo-600" };

      // HOSTILE/NEGATIVE (red/rose tones)
      case 'HOSTILE':
        return { bgColor: "bg-red-100", iconColor: "text-red-600" };
      case 'ANNOYED':
        return { bgColor: "bg-rose-100", iconColor: "text-rose-600" };

      // NO CUSTOMER RESPONSE (gray/neutral tones)
      case 'SILENT_CALL':
        return { bgColor: "bg-gray-100", iconColor: "text-gray-600" };
      case 'GREETING_ONLY':
        return { bgColor: "bg-neutral-100", iconColor: "text-neutral-600" };
      case 'DNP':
        return { bgColor: "bg-stone-100", iconColor: "text-stone-600" };
      case 'NONE':
        return { bgColor: "bg-slate-100", iconColor: "text-slate-600" };

      default:
        return { bgColor: "bg-gray-100", iconColor: "text-gray-600" };
    }
  };

  const getDispositionIcon = (code: string) => {
    switch (code.toUpperCase()) {
      // POSITIVE OUTCOMES
      case 'PTP':
        return <FiCalendar size={18} />;
      case 'PAID':
        return <FiCheckCircle size={18} />;
      case 'PAYNOW':
        return <FiDollarSign size={18} />;

      // NEGATIVE/REFUSAL
      case 'RTP':
        return <FiXCircle size={18} />;
      case 'RTPF':
        return <FiRotateCcw size={18} />;
      case 'RTP_DISPUTE':
        return <FiAlertTriangle size={18} />;
      case 'NI':
        return <FiThumbsDown size={18} />;
      case 'DND':
        return <FiPhoneOff size={18} />;

      // FOLLOW-UP NEEDED
      case 'CLBK':
        return <FiPhoneCall size={18} />;
      case 'CLBK_BUSY':
        return <FiClock size={18} />;
      case 'CLBK_DATE':
        return <FiCalendar size={18} />;
      case 'DISPUTE':
        return <FiAlertCircle size={18} />;

      // INCOMPLETE ENGAGEMENT
      case 'EARLY_DISCONNECT':
        return <FiPhoneMissed size={18} />;
      case 'INFO_GIVEN_NO_RESPONSE':
        return <FiInfo size={18} />;
      case 'MINIMAL_ENGAGEMENT':
        return <FiMessageCircle size={18} />;
      case 'CUT_MID_CONVERSATION':
        return <FiPhoneOff size={18} />;

      // WRONG CONTACT
      case 'WRONG_NUMBER':
        return <FiUserX size={18} />;
      case 'THIRD_PARTY':
        return <FiUsers size={18} />;
      case 'LANGUAGE_BARRIER':
        return <FiMessageSquare size={18} />;

      // HOSTILE/NEGATIVE
      case 'HOSTILE':
        return <FiAlertOctagon size={18} />;
      case 'ANNOYED':
        return <FiMeh size={18} />;

      // NO CUSTOMER RESPONSE
      case 'SILENT_CALL':
        return <FiVolumeX size={18} />;
      case 'GREETING_ONLY':
        return <FiVolume2 size={18} />;
      case 'DNP':
        return <FiFileText size={18} />;
      case 'NONE':
        return <FiInfo size={18} />;

      default:
        return <FiBarChart size={18} />;
    }
  };

  const getDispositionDescription = (code: string): string => {
    switch (code.toUpperCase()) {
      // POSITIVE OUTCOMES
      case 'PTP':
        return 'Customer has promised to pay';
      case 'PAID':
        return 'Customer has already paid';
      case 'PAYNOW':
        return 'Customer wants to pay now';

      // NEGATIVE/REFUSAL
      case 'RTP':
        return 'Customer has refused to pay';
      case 'RTPF':
        return 'Refused due to fund issue';
      case 'RTP_DISPUTE':
        return 'Refuses claiming dispute/wrong amount';
      case 'NI':
        return 'Not interested in paying';
      case 'DND':
        return 'Asks to stop calling';

      // FOLLOW-UP NEEDED
      case 'CLBK':
        return 'Customer asks for callback';
      case 'CLBK_BUSY':
        return 'Busy now, call later';
      case 'CLBK_DATE':
        return 'Gave specific callback date/time';
      case 'DISPUTE':
        return 'Raises dispute about loan/amount';

      // INCOMPLETE ENGAGEMENT
      case 'EARLY_DISCONNECT':
        return 'Call ends during intro/greeting';
      case 'INFO_GIVEN_NO_RESPONSE':
        return 'Listened but no commitment';
      case 'MINIMAL_ENGAGEMENT':
        return 'Only minimal responses';
      case 'CUT_MID_CONVERSATION':
        return 'Disconnects abruptly mid-call';

      // WRONG CONTACT
      case 'WRONG_NUMBER':
        return 'Wrong person contacted';
      case 'THIRD_PARTY':
        return 'Someone else answered';
      case 'LANGUAGE_BARRIER':
        return 'Language not understood';

      // HOSTILE/NEGATIVE
      case 'HOSTILE':
        return 'Aggressive or abusive';
      case 'ANNOYED':
        return 'Shows clear annoyance';

      // NO CUSTOMER RESPONSE
      case 'SILENT_CALL':
        return 'No customer speech detected';
      case 'GREETING_ONLY':
        return 'Only hello then nothing';
      case 'DNP':
        return 'No transcript at all';
      case 'NONE':
        return 'No outcome determined';

      default:
        return '';
    }
  };

  // Priority order for disposition codes
  const dispositionOrder = [
    'PTP', 'CLBK', 'PAYNOW', 'PAID', 'RTP', 'RTPF',
    'CLBK_BUSY', 'CLBK_DATE', 'DISPUTE', 'RTP_DISPUTE', 'NI', 'DND',
    'EARLY_DISCONNECT', 'MINIMAL_ENGAGEMENT', 'CUT_MID_CONVERSATION',
    'WRONG_NUMBER', 'THIRD_PARTY', 'LANGUAGE_BARRIER',
    'HOSTILE', 'ANNOYED',
    'SILENT_CALL', 'GREETING_ONLY',
    'INFO_GIVEN_NO_RESPONSE'
  ];

  // Sort disposition codes by priority
  const getSortedDispositionCodes = (codes: string[]): string[] => {
    return codes
      .filter(code => code !== 'DNP')
      .sort((a, b) => {
        const indexA = dispositionOrder.indexOf(a.toUpperCase());
        const indexB = dispositionOrder.indexOf(b.toUpperCase());
        const orderA = indexA === -1 ? dispositionOrder.length - 1 : indexA;
        const orderB = indexB === -1 ? dispositionOrder.length - 1 : indexB;
        return orderA - orderB;
      });
  };

  const renderCallOverview = () => {
    const data = sectionData.call_overview;
    if (!data) return null;

    const { call_distribution } = data;
    const answerRate = (((call_distribution?.answered_calls || 0) / (call_distribution?.total_calls || 1)) * 100).toFixed(1);

    const callDistributionData = [
      { name: 'Answered', value: call_distribution?.answered_calls || 0, color: COLORS[0] },
      { name: 'Busy', value: call_distribution?.busy_calls || 0, color: COLORS[1] },
      { name: 'Not Answered', value: call_distribution?.not_answered_calls || 0, color: COLORS[2] },
      { name: 'Failed', value: call_distribution?.failed_calls || 0, color: COLORS[3] },
      { name: 'Voicemail', value: call_distribution?.voicemail || 0, color: COLORS[4] }
    ];

    return (
      <div>
        <Row gutter={[16, 16]} className="mb-8">
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Calls"
                value={call_distribution?.total_calls || 0}
                prefix={<PhoneOutlined style={{ color: MAIN_COLOR }} />}
                valueStyle={{ color: MAIN_COLOR }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Amount"
                value={call_distribution?.total_emi_amount || 0}
                prefix={<IndianRupee style={{ color: MAIN_COLOR }} />}
                valueStyle={{ color: MAIN_COLOR }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Answered Calls"
                value={call_distribution?.answered_calls || 0}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Answer Rate"
                value={parseFloat(answerRate)}
                precision={1}
                suffix="%"
                prefix={<SoundOutlined style={{ color: MAIN_COLOR }} />}
                valueStyle={{ color: MAIN_COLOR }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="mb-8">
          <Col xs={24} lg={12}>
            <Card title="Call Distribution" className="h-full">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={callDistributionData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {callDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Call Status Overview" className="h-full">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Answered Calls</span>
                    <span>{call_distribution?.answered_calls || 0}</span>
                  </div>
                  <Progress 
                    percent={(call_distribution?.answered_calls || 0) / (call_distribution?.total_calls || 1) * 100} 
                    strokeColor={MAIN_COLOR}
                    showInfo={false}
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Busy Calls</span>
                    <span>{call_distribution?.busy_calls || 0}</span>
                  </div>
                  <Progress 
                    percent={(call_distribution?.busy_calls || 0) / (call_distribution?.total_calls || 1) * 100} 
                    strokeColor={COLORS[1]}
                    showInfo={false}
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Not Answered</span>
                    <span>{call_distribution?.not_answered_calls || 0}</span>
                  </div>
                  <Progress 
                    percent={(call_distribution?.not_answered_calls || 0) / (call_distribution?.total_calls || 1) * 100} 
                    strokeColor={COLORS[2]}
                    showInfo={false}
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Failed Calls</span>
                    <span>{call_distribution?.failed_calls || 0}</span>
                  </div>
                  <Progress 
                    percent={(call_distribution?.failed_calls || 0) / (call_distribution?.total_calls || 1) * 100} 
                    strokeColor={COLORS[3]}
                    showInfo={false}
                  />
                </div>
              </div>
            </Card>
          </Col>
        </Row>

      </div>
    );
  };

  const renderDispositionAnalysis = () => {
    const data = sectionData.disposition_analysis;
    if (!data) return null;

    const { disposition_codes } = data;

    return (
      <div>
        <h3 className="text-lg font-semibold mb-4 text-[#263978]">Disposition Codes</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {getSortedDispositionCodes(Object.keys(disposition_codes || {})).map((code) => {
            const count: any = disposition_codes?.[code] || { count: 0, amount: 0.0 };
            const colors = getDispositionColors(code);
            return (
               <StatCardValue
                  key={code}
                  title={code.toUpperCase() === 'NONE' ? 'NO OUTCOME' : code.toUpperCase()}
                  subtitle={getDispositionDescription(code)}
                  data={count}
                  icon={getDispositionIcon(code)}
                  iconBgColor={colors.bgColor}
                  iconColor={colors.iconColor}
                  displayType="both"
              />
            );
          })}
        </div>
      </div>
    );
  };

  const renderConversationAnalysis = () => {
    const data = sectionData.conversation_analysis;
    if (!data) return null;

    const { conversation_stages, conversation_strategies } = data;

    const conversationStagesData = Object.entries(conversation_stages || {}).map(([key, value]) => ({
      name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: value as number
    }));

    const strategyData = Object.entries(conversation_strategies || {}).map(([key, value]) => ({
      name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: value as number
    }));

    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Conversation Stages">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conversationStagesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={10}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill={MAIN_COLOR} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Conversation Strategies">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={strategyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={10}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS[1]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    );
  };

  const renderUserBehavior = () => {
    const data = sectionData.user_behavior;
    if (!data) return null;

    const { user_cooperation_levels, interruption_patterns, interruption_statistics } = data;

    const cooperationData = Object.entries(user_cooperation_levels || {})
      .filter(([_, value]) => (value as number) > 0)
      .map(([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: value as number
      }));

    const interruptionData = Object.entries(interruption_patterns || {})
      .filter(([_, value]) => (value as number) > 0)
      .map(([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: value as number
      }));

    return (
      <div>
        <Row gutter={[16, 16]} className="mb-8">
          <Col xs={24} lg={12}>
            <Card title="User Cooperation Levels">
              {cooperationData.length > 1 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={cooperationData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {cooperationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] bg-gray-50 rounded">
                  <div className="text-center">
                    <ExclamationCircleOutlined className="text-4xl text-gray-400 mb-4" />
                    <p className="text-gray-500">All cooperation data is inconclusive</p>
                    <p className="text-sm text-gray-400">Total: {cooperationData[0]?.value || 0} records</p>
                  </div>
                </div>
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Interruption Patterns">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={interruptionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill={MAIN_COLOR} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Avg Interruptions"
                value={interruption_statistics?.avg_interruptions?.toFixed(1) || 0}
                prefix={<MessageOutlined style={{ color: MAIN_COLOR }} />}
                valueStyle={{ color: MAIN_COLOR }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Max Interruptions"
                value={interruption_statistics?.max_interruptions === -1 ? 'N/A' : interruption_statistics?.max_interruptions ?? 0}
                prefix={<ExclamationCircleOutlined style={{ color: interruption_statistics?.max_interruptions === -1 ? '#999' : '#ff4d4f' }} />}
                valueStyle={{ color: interruption_statistics?.max_interruptions === -1 ? '#999' : '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Min Interruptions"
                value={interruption_statistics?.min_interruptions ?? 0}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  const renderInformationTracking = () => {
    const data = sectionData.information_tracking;
    if (!data) return null;

    const { information_status, commitment_statistics } = data;

    const infoStatusData = Object.entries(information_status || {}).map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: value as number
    }));

    const totalCalls = sectionData.call_overview?.call_distribution?.total_calls || 1;
    const commitmentRate = ((commitment_statistics?.commitment_date_set || 0) / totalCalls * 100).toFixed(1);

    return (
      <div>
        <Row gutter={[16, 16]} className="mb-8">
          <Col xs={24} lg={12}>
            <Card title="Information Status">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={infoStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {infoStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Commitment Statistics">
              <div className="space-y-6 p-4">
                <Statistic
                  title="Commitment Date Set"
                  value={commitment_statistics?.commitment_date_set || 0}
                  prefix={<CalendarOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a' }}
                />
                <Statistic
                  title="No Commitment Date"
                  value={commitment_statistics?.no_commitment_date || 0}
                  prefix={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
                  valueStyle={{ color: '#ff4d4f' }}
                />
                <Statistic
                  title="Commitment Rate"
                  value={commitmentRate}
                  suffix="%"
                  prefix={<CheckCircleOutlined style={{ color: MAIN_COLOR }} />}
                  valueStyle={{ color: MAIN_COLOR }}
                />
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  const renderLanguageDistribution = () => {
    const data = sectionData.language_distribution;
    if (!data) return null;

    const { language_distribution } = data;

    const languageData = Object.entries(language_distribution || {}).map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: value as number
    }));

    return (
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Language Distribution">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={languageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill={MAIN_COLOR} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    );
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: MAIN_COLOR }}>
            Dashboard
          </h1>
          <p className="text-gray-600">Comprehensive overview of performance and metrics</p>
          {error && (
            <Alert 
              message={error} 
              type="warning" 
              className="mt-4"
              showIcon 
            />
          )}
        </div>

        {/* Filter Section */}
        <Card className="mb-6" title={
          <div className="flex items-center">
            <FilterOutlined className="mr-2" style={{ color: MAIN_COLOR }} />
            <span>Filters</span>
            {hasActiveFilters() && (
              <Tag color={MAIN_COLOR} className="ml-2">Active</Tag>
            )}
          </div>
        }>
          <Row gutter={[16, 16]} className="mb-4">
            <Col xs={24} sm={12} lg={8}>
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium">Filter Type</label>
                <Select
                  value={filters.filterType}
                  onChange={(value) => handleFilterChange('filterType', value)}
                  className="w-full"
                >
                  <Option value="monthly">Monthly</Option>
                  <Option value="range">Date Range</Option>
                </Select>
              </div>
            </Col>

            {filters.filterType === 'monthly' ? (
              <Col xs={24} sm={12} lg={8}>
                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-medium">Month</label>
                  <DatePicker
                    picker="month"
                    value={filters.month ? dayjs(filters.month) : null}
                    onChange={(date) => handleFilterChange('month', date ? date.format('YYYY-MM') : dayjs().format('YYYY-MM'))}
                    className="w-full"
                    placeholder="Select Month"
                  />
                </div>
              </Col>
            ) : (
              <Col xs={24} sm={12} lg={8}>
                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-medium">Date Range</label>
                  <RangePicker
                    value={filters.dateRange}
                    onChange={(dates) => handleFilterChange('dateRange', dates)}
                    format="YYYY-MM-DD"
                    className="w-full"
                    placeholder={['Start Date', 'End Date']}
                  />
                </div>
              </Col>
            )}
          </Row>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Data Source Indicator - show when we have data */}
            {dataSource && !isGenerating && Object.keys(sectionData).length > 0 && (
              <div className="flex items-center gap-2">
                <Tag
                  icon={dataSource === 'cache' ? <DatabaseOutlined /> : <CheckCircleOutlined />}
                  color={dataSource === 'cache' ? 'blue' : 'green'}
                >
                  {dataSource === 'cache' ? 'Data from Cache' : 'Freshly Generated'}
                </Tag>
              </div>
            )}

            {/* Job Status Display - only show when generating, processing, or failed */}
            {(jobStatus.status === 'generating' || jobStatus.status === 'processing' || jobStatus.status === 'failed') && (
              <div className="flex items-center gap-3 flex-1">
                {jobStatus.status === 'generating' && (
                  <Alert
                    message={
                      <span className="flex items-center gap-2">
                        <LoadingOutlined spin />
                        Starting job...
                      </span>
                    }
                    type="info"
                    showIcon={false}
                    className="py-1"
                  />
                )}
                {jobStatus.status === 'processing' && (
                  <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2 min-w-[300px]">
                    <SyncOutlined spin className="text-yellow-600" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-yellow-700">
                          {jobStatus.source === 'existing_job' ? 'Resuming existing job...' : 'Processing...'}
                        </span>
                        <span className="text-sm font-medium text-yellow-700">{jobStatus.progress}%</span>
                      </div>
                      <Progress
                        percent={jobStatus.progress}
                        size="small"
                        strokeColor="#faad14"
                        showInfo={false}
                      />
                      {jobStatus.jobId && (
                        <div className="mt-1 flex items-center gap-2">
                          <Tag color="blue" className="text-xs">{jobStatus.jobId.slice(-8)}</Tag>
                          {jobStatus.source === 'existing_job' && (
                            <Tag color="orange" className="text-xs">Existing Job</Tag>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {jobStatus.status === 'failed' && (
                  <Alert
                    message={
                      <span className="flex items-center gap-2">
                        <CloseCircleOutlined />
                        {jobStatus.error || 'Generation failed'}
                      </span>
                    }
                    type="error"
                    showIcon={false}
                    className="py-1"
                    closable
                    onClose={() => setJobStatus({ status: 'idle', jobId: null, message: null, error: null, progress: 0, section: null })}
                  />
                )}
              </div>
            )}

            <Space className="ml-auto">
              <Button
                onClick={clearFilters}
                disabled={!hasActiveFilters()}
                icon={<ClearOutlined />}
              >
                Clear Filters
              </Button>
              <Button
                type="primary"
                onClick={applyFilters}
                loading={Object.values(loading).some(l => l)}
                icon={<SearchOutlined />}
                style={{ backgroundColor: MAIN_COLOR, borderColor: MAIN_COLOR }}
              >
                Search
              </Button>
              <Badge dot={isGenerating} offset={[-5, 5]}>
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: 'generate',
                        label: 'Generate (Check Cache First)',
                        icon: <DatabaseOutlined />,
                        onClick: () => generateAndFetchData(false)
                      },
                      {
                        key: 'force',
                        label: 'Force Regenerate (Skip Cache)',
                        icon: <ReloadOutlined />,
                        onClick: () => generateAndFetchData(true)
                      }
                    ]
                  }}
                  disabled={isGenerating}
                >
                  <Button
                    type="primary"
                    onClick={() => generateAndFetchData(false)}
                    disabled={isGenerating}
                    icon={isGenerating ? <LoadingOutlined /> : <ThunderboltOutlined />}
                    style={{
                      backgroundColor: isGenerating ? '#faad14' : '#52c41a',
                      borderColor: isGenerating ? '#faad14' : '#52c41a'
                    }}
                  >
                    {isGenerating ? 'Generating...' : 'Generate'} <DownOutlined />
                  </Button>
                </Dropdown>
              </Badge>
            </Space>
          </div>
        </Card>

        {/* Tabs Section */}
        <Card>
          <Tabs 
            activeKey={activeTab} 
            onChange={handleTabChange}
            type="card"
          >
            <TabPane 
              tab={
                <span>
                  <PhoneOutlined />
                  Call Overview
                </span>
              } 
              key="call_overview"
            >
              {loading.call_overview ? (
                <div className="flex flex-col justify-center items-center py-20">
                  <Spin size="large" />
                  {jobStatus.message && (
                    <p className="mt-4 text-gray-500">{jobStatus.message}</p>
                  )}
                  {jobStatus.jobId && (
                    <p className="mt-1 text-xs text-gray-400">Job ID: {jobStatus.jobId.slice(-8)}</p>
                  )}
                </div>
              ) : (
                renderCallOverview()
              )}
            </TabPane>

            <TabPane 
              tab={
                <span>
                  <BarChartOutlined />
                  Disposition Analysis
                </span>
              } 
              key="disposition_analysis"
            >
              {loading.disposition_analysis ? (
                <div className="flex flex-col justify-center items-center py-20">
                  <Spin size="large" />
                  {jobStatus.message && (
                    <p className="mt-4 text-gray-500">{jobStatus.message}</p>
                  )}
                  {jobStatus.jobId && (
                    <p className="mt-1 text-xs text-gray-400">Job ID: {jobStatus.jobId.slice(-8)}</p>
                  )}
                </div>
              ) : (
                renderDispositionAnalysis()
              )}
            </TabPane>

            <TabPane 
              tab={
                <span>
                  <MessageOutlined />
                  Conversation Analysis
                </span>
              } 
              key="conversation_analysis"
            >
              {loading.conversation_analysis ? (
                <div className="flex flex-col justify-center items-center py-20">
                  <Spin size="large" />
                  {jobStatus.message && (
                    <p className="mt-4 text-gray-500">{jobStatus.message}</p>
                  )}
                  {jobStatus.jobId && (
                    <p className="mt-1 text-xs text-gray-400">Job ID: {jobStatus.jobId.slice(-8)}</p>
                  )}
                </div>
              ) : (
                renderConversationAnalysis()
              )}
            </TabPane>

            <TabPane 
              tab={
                <span>
                  <UserOutlined />
                  User Behavior
                </span>
              } 
              key="user_behavior"
            >
              {loading.user_behavior ? (
                <div className="flex flex-col justify-center items-center py-20">
                  <Spin size="large" />
                  {jobStatus.message && (
                    <p className="mt-4 text-gray-500">{jobStatus.message}</p>
                  )}
                  {jobStatus.jobId && (
                    <p className="mt-1 text-xs text-gray-400">Job ID: {jobStatus.jobId.slice(-8)}</p>
                  )}
                </div>
              ) : (
                renderUserBehavior()
              )}
            </TabPane>

            <TabPane 
              tab={
                <span>
                  <CalendarOutlined />
                  Information Tracking
                </span>
              } 
              key="information_tracking"
            >
              {loading.information_tracking ? (
                <div className="flex flex-col justify-center items-center py-20">
                  <Spin size="large" />
                  {jobStatus.message && (
                    <p className="mt-4 text-gray-500">{jobStatus.message}</p>
                  )}
                  {jobStatus.jobId && (
                    <p className="mt-1 text-xs text-gray-400">Job ID: {jobStatus.jobId.slice(-8)}</p>
                  )}
                </div>
              ) : (
                renderInformationTracking()
              )}
            </TabPane>

            <TabPane 
              tab={
                <span>
                  <GlobalOutlined />
                  Language Distribution
                </span>
              } 
              key="language_distribution"
            >
              {loading.language_distribution ? (
                <div className="flex flex-col justify-center items-center py-20">
                  <Spin size="large" />
                  {jobStatus.message && (
                    <p className="mt-4 text-gray-500">{jobStatus.message}</p>
                  )}
                  {jobStatus.jobId && (
                    <p className="mt-1 text-xs text-gray-400">Job ID: {jobStatus.jobId.slice(-8)}</p>
                  )}
                </div>
              ) : (
                renderLanguageDistribution()
              )}
            </TabPane>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default CallAnalyticsDashboard;