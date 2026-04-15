/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiClock,
  FiPhone,
  FiCheckCircle,
  FiXCircle,
  FiThumbsDown,
  FiAlertCircle,
  FiAlertTriangle,
  FiAlertOctagon,
  FiVoicemail,
  FiUsers,
  FiUserX,
  FiMessageCircle,
  FiMessageSquare,
  FiCalendar,
  FiBarChart,
  FiDollarSign,
  FiPhoneCall,
  FiPhoneOff,
  FiPhoneMissed,
  FiRotateCcw,
  FiInfo,
  FiMeh,
  FiVolumeX,
  FiVolume2,
  FiFileText
} from "react-icons/fi";
import { Spin, Tabs } from "antd";
import StatCard from "./StatCard";
import StatCardValue from "./StatCardValue";
import { useRoomAPI } from "@/hooks/useRoomAPI";
import { API_BASE_URL, API_KEY } from "@/constants";
import axiosInstance from "@/lib/axios";

interface CallStatsTabProps {
  executionId?: string;
}

// Section configuration
const SECTIONS = [
  { key: "call_distribution", label: "Call Distribution" },
  { key: "disposition_codes", label: "Disposition Codes" },
  { key: "conversation_stages", label: "Conversation Stages" },
  { key: "user_cooperation_levels", label: "Cooperation Levels" },
  { key: "information_status", label: "Information Status" },
  { key: "language_distribution", label: "Language Distribution" },
  { key: "interruption_patterns", label: "Interruption Patterns" },
  { key: "conversation_strategies", label: "Strategies" },
  { key: "interruption_statistics", label: "Interruption Stats" },
  { key: "commitment_statistics", label: "Commitment Stats" },
];

const CallStatsTab: React.FC<CallStatsTabProps> = ({ executionId }) => {
  const { selectedRoom, appendRoomParam } = useRoomAPI();
  const [activeSection, setActiveSection] = useState<string>("call_distribution");
  const [sectionData, setSectionData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch section data
  const fetchSectionData = async (section: string) => {
    if (!executionId || !section) {
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.get(
        appendRoomParam(
          `${API_BASE_URL}/dashboard/call-metrics/${executionId}?api_key=${API_KEY}&section=${section}`
        )
      );
      setSectionData(res.data.data?.[section] || res.data.data || null);
    } catch (error) {
      console.error("Error fetching section data:", error);
      setSectionData(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch default section on mount
  useEffect(() => {
    if (executionId && activeSection) {
      fetchSectionData(activeSection);
    }
  }, [executionId, selectedRoom]);

  // Handle tab change
  const handleTabChange = (section: string) => {
    setActiveSection(section);
    fetchSectionData(section);
  };

  // Helper function to format numbers to max 2 decimal places
  const formatNumber = (value: any): number => {
    const num = typeof value === 'number' ? value : parseFloat(value) || 0;
    return Math.round(num * 100) / 100;
  };
  // Helper function to get object entries count
  // const getObjectCount = (obj: Record<string, any>) => {
  //   const total = Object.values(obj).reduce((sum: number, value: any) => sum + (typeof value === 'number' ? value : 0), 0);
  //   return formatNumber(total);
  // };

  // Helper function to get disposition code icon
  const getDispositionIcon = (code: string) => {
    switch (code.toUpperCase()) {
      // POSITIVE OUTCOMES
      case 'PTP':
        return <FiCalendar size={18} className="sm:w-5 sm:h-5" />;
      case 'PAID':
        return <FiCheckCircle size={18} className="sm:w-5 sm:h-5" />;
      case 'PAYNOW':
        return <FiDollarSign size={18} className="sm:w-5 sm:h-5" />;

      // NEGATIVE/REFUSAL
      case 'RTP':
        return <FiXCircle size={18} className="sm:w-5 sm:h-5" />;
      case 'RTPF':
        return <FiRotateCcw size={18} className="sm:w-5 sm:h-5" />;
      case 'RTP_DISPUTE':
        return <FiAlertTriangle size={18} className="sm:w-5 sm:h-5" />;
      case 'NI':
        return <FiThumbsDown size={18} className="sm:w-5 sm:h-5" />;
      case 'DND':
        return <FiPhoneOff size={18} className="sm:w-5 sm:h-5" />;

      // FOLLOW-UP NEEDED
      case 'CLBK':
        return <FiPhoneCall size={18} className="sm:w-5 sm:h-5" />;
      case 'CLBK_BUSY':
        return <FiClock size={18} className="sm:w-5 sm:h-5" />;
      case 'CLBK_DATE':
        return <FiCalendar size={18} className="sm:w-5 sm:h-5" />;
      case 'DISPUTE':
        return <FiAlertCircle size={18} className="sm:w-5 sm:h-5" />;

      // INCOMPLETE ENGAGEMENT
      case 'EARLY_DISCONNECT':
        return <FiPhoneMissed size={18} className="sm:w-5 sm:h-5" />;
      case 'INFO_GIVEN_NO_RESPONSE':
        return <FiInfo size={18} className="sm:w-5 sm:h-5" />;
      case 'MINIMAL_ENGAGEMENT':
        return <FiMessageCircle size={18} className="sm:w-5 sm:h-5" />;
      case 'CUT_MID_CONVERSATION':
        return <FiPhoneOff size={18} className="sm:w-5 sm:h-5" />;

      // WRONG CONTACT
      case 'WRONG_NUMBER':
        return <FiUserX size={18} className="sm:w-5 sm:h-5" />;
      case 'THIRD_PARTY':
        return <FiUsers size={18} className="sm:w-5 sm:h-5" />;
      case 'LANGUAGE_BARRIER':
        return <FiMessageSquare size={18} className="sm:w-5 sm:h-5" />;

      // HOSTILE/NEGATIVE
      case 'HOSTILE':
        return <FiAlertOctagon size={18} className="sm:w-5 sm:h-5" />;
      case 'ANNOYED':
        return <FiMeh size={18} className="sm:w-5 sm:h-5" />;

      // NO CUSTOMER RESPONSE
      case 'SILENT_CALL':
        return <FiVolumeX size={18} className="sm:w-5 sm:h-5" />;
      case 'GREETING_ONLY':
        return <FiVolume2 size={18} className="sm:w-5 sm:h-5" />;
      case 'DNP':
        return <FiFileText size={18} className="sm:w-5 sm:h-5" />;

      case 'None':
        return <FiInfo size={18} className="sm:w-5 sm:h-5" />;

      default:
        return <FiBarChart size={18} className="sm:w-5 sm:h-5" />;
    }
  };

  // Helper function to get disposition code colors
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

  // Helper function to get disposition code description
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
    'INFO_GIVEN_NO_RESPONSE' // Always last
  ];

  // Sort disposition codes by priority
  const getSortedDispositionCodes = (codes: string[]): string[] => {
    return codes
      .filter(code => code !== 'DNP')
      .sort((a, b) => {
        const indexA = dispositionOrder.indexOf(a.toUpperCase());
        const indexB = dispositionOrder.indexOf(b.toUpperCase());
        // If not in order list, put before INFO_GIVEN_NO_RESPONSE but after known codes
        const orderA = indexA === -1 ? dispositionOrder.length - 1 : indexA;
        const orderB = indexB === -1 ? dispositionOrder.length - 1 : indexB;
        return orderA - orderB;
      });
  };

  const formatValueWithoutCurrency = (value: number | undefined | null): string => {
    const safeValue = value ?? 0;
    return safeValue.toLocaleString();
  };

  function formatString(text: string): string {
    return text
      .split(",")
      .map(part => part.trim())                // remove extra spaces
      .filter(part => part.length > 0)         // remove empty
      .map(part => {
        const cleaned = part.replace(/_/g, " ").toLowerCase();
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      })
      .join(", ");
  }


  const [ongoingCalls, setOngoingCalls] = useState<number>(0);

  useEffect(() => {
    const fetchActiveSessions = async () => {
      try {
        const response = await axiosInstance.get(
          appendRoomParam(`${API_BASE_URL}/agents/active-sessions/${selectedRoom}?api_key=${API_KEY}`)
        );

        setOngoingCalls(response.data.total_active_sessions || 0);
      } catch (error) {
        console.error("Error fetching active sessions:", error);
      }
    };

    if (selectedRoom === "main") {
      setOngoingCalls(0);
    } else {
       fetchActiveSessions();
       const interval = setInterval(fetchActiveSessions, 30000); // Poll every 30 seconds
       return () => clearInterval(interval);
    }
  }, [selectedRoom, executionId]);

  // Render section content based on active section
  const renderSectionContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Spin size="large" tip="Loading section data..." />
        </div>
      );
    }

    if (!sectionData) {
      return (
        <div className="text-sm text-gray-500 text-center py-8">
          No data available for this section
        </div>
      );
    }

    switch (activeSection) {
      case "call_distribution":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <StatCard
                title="Total Calls"
                value={formatNumber(sectionData.total_calls || 0)}
                icon={<FiPhone size={18} className="sm:w-5 sm:h-5" />}
                iconBgColor="bg-indigo-100"
                iconColor="text-indigo-600"
              />
              <StatCard
                title="Ongoing Calls"
                value={formatNumber(ongoingCalls)}
                icon={<FiPhone size={18} className="sm:w-5 sm:h-5" />}
                iconBgColor="bg-blue-100"
                iconColor="text-blue-600"
              />
              <StatCard
                title="Answered"
                value={formatNumber(sectionData.answered_calls || 0)}
                icon={<FiCheckCircle size={18} className="sm:w-5 sm:h-5" />}
                iconBgColor="bg-green-100"
                iconColor="text-green-600"
              />
              <StatCard
                title="Not Answered"
                value={formatNumber(sectionData.not_answered_calls || 0)}
                icon={<FiXCircle size={18} className="sm:w-5 sm:h-5" />}
                iconBgColor="bg-orange-100"
                iconColor="text-orange-600"
              />
              <StatCard
                title="Busy"
                value={formatNumber(sectionData.busy_calls || 0)}
                icon={<FiClock size={18} className="sm:w-5 sm:h-5" />}
                iconBgColor="bg-yellow-100"
                iconColor="text-yellow-600"
              />
              <StatCard
                title="Failed"
                value={formatNumber(sectionData.failed_calls || 0)}
                icon={<FiXCircle size={18} className="sm:w-5 sm:h-5" />}
                iconBgColor="bg-red-100"
                iconColor="text-red-600"
              />
              <StatCard
                title="Voicemail"
                value={formatNumber(sectionData.voicemail || 0)}
                icon={<FiVoicemail size={18} className="sm:w-5 sm:h-5" />}
                iconBgColor="bg-purple-100"
                iconColor="text-purple-600"
              />
              <StatCard
                title="Answer Rate"
                value={`${sectionData.total_calls ? Math.round((sectionData.answered_calls / sectionData.total_calls) * 100) : 0}%`}
                icon={<FiCheckCircle size={18} className="sm:w-5 sm:h-5" />}
                iconBgColor="bg-teal-100"
                iconColor="text-teal-600"
              />
            </div>
            {sectionData.total_emi_amount && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total EMI Amount:</span>
                  <span className="text-lg font-medium text-emerald-600">₹</span>
                  <span className="text-xl font-bold text-emerald-600">
                    {formatValueWithoutCurrency(sectionData.total_emi_amount || 0)}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        );

      case "disposition_codes":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {getSortedDispositionCodes(Object.keys(sectionData || {})).map((code) => {
                const count: any = sectionData?.[code] || { count: 0, amount: 0.0 };
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
          </motion.div>
        );

      case "conversation_stages":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 sm:p-6"
          >
            <div className="space-y-2">
              {Object.entries(sectionData || {}).length > 0 ? (
                Object.entries(sectionData).map(([stage, count]) => (
                  <div key={stage} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700 font-medium truncate pr-2">{formatString(stage)}</span>
                    <span className="font-bold text-gray-900 text-sm flex-shrink-0">{formatNumber(count as number)}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 text-center py-4">No conversation stage data available</div>
              )}
            </div>
          </motion.div>
        );

      case "user_cooperation_levels":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 sm:p-6"
          >
            <div className="space-y-2">
              {Object.entries(sectionData || {}).length > 0 ? (
                Object.entries(sectionData).map(([level, count]) => (
                  <div key={level} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700 font-medium truncate pr-2">{formatString(level)}</span>
                    <span className="font-bold text-gray-900 text-sm flex-shrink-0">{formatNumber(count as number)}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 text-center py-4">No cooperation level data available</div>
              )}
            </div>
          </motion.div>
        );

      case "information_status":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 sm:p-6"
          >
            <div className="space-y-2">
              {Object.entries(sectionData || {}).length > 0 ? (
                Object.entries(sectionData).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700 font-medium truncate pr-2">{formatString(status)}</span>
                    <span className="font-bold text-gray-900 text-sm flex-shrink-0">{formatNumber(count as number)}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 text-center py-4">No information status data available</div>
              )}
            </div>
          </motion.div>
        );

      case "language_distribution":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 sm:p-6"
          >
            <div className="space-y-2">
              {Object.entries(sectionData || {}).length > 0 ? (
                Object.entries(sectionData).map(([language, count]) => (
                  <div key={language} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700 font-medium truncate pr-2">{formatString(language)}</span>
                    <span className="font-bold text-gray-900 text-sm flex-shrink-0">{formatNumber(count as number)}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 text-center py-4">No language data available</div>
              )}
            </div>
          </motion.div>
        );

      case "interruption_patterns":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 sm:p-6"
          >
            <div className="space-y-2">
              {Object.entries(sectionData || {}).length > 0 ? (
                Object.entries(sectionData).map(([pattern, count]) => (
                  <div key={pattern} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700 font-medium truncate pr-2">{formatString(pattern)}</span>
                    <span className="font-bold text-gray-900 text-sm flex-shrink-0">{formatNumber(count as number)}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 text-center py-4">No interruption pattern data available</div>
              )}
            </div>
          </motion.div>
        );

      case "conversation_strategies":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 sm:p-6"
          >
            <div className="space-y-2">
              {Object.entries(sectionData || {}).length > 0 ? (
                Object.entries(sectionData).map(([strategy, count]) => (
                  <div key={strategy} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700 font-medium truncate pr-2">{formatString(strategy)}</span>
                    <span className="font-bold text-gray-900 text-sm flex-shrink-0">{formatNumber(count as number)}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 text-center py-4">No conversation strategy data available</div>
              )}
            </div>
          </motion.div>
        );

      case "interruption_statistics":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <StatCard
                title="Avg Interruptions"
                value={formatNumber(sectionData?.avg_interruptions || 0)}
                icon={<FiAlertCircle size={18} className="sm:w-5 sm:h-5" />}
                iconBgColor="bg-orange-100"
                iconColor="text-orange-600"
              />
              <StatCard
                title="Max Interruptions"
                value={formatNumber(sectionData?.max_interruptions || 0)}
                icon={<FiBarChart size={18} className="sm:w-5 sm:h-5" />}
                iconBgColor="bg-red-100"
                iconColor="text-red-600"
              />
              <StatCard
                title="Min Interruptions"
                value={formatNumber(sectionData?.min_interruptions || 0)}
                icon={<FiCheckCircle size={18} className="sm:w-5 sm:h-5" />}
                iconBgColor="bg-green-100"
                iconColor="text-green-600"
              />
            </div>
          </motion.div>
        );

      case "commitment_statistics":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <StatCard
                title="Commitment Date Set"
                value={formatNumber(sectionData?.commitment_date_set || 0)}
                icon={<FiCalendar size={18} className="sm:w-5 sm:h-5" />}
                iconBgColor="bg-blue-100"
                iconColor="text-blue-600"
              />
              <StatCard
                title="No Commitment Date"
                value={formatNumber(sectionData?.no_commitment_date || 0)}
                icon={<FiXCircle size={18} className="sm:w-5 sm:h-5" />}
                iconBgColor="bg-gray-100"
                iconColor="text-gray-600"
              />
            </div>
          </motion.div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <FiBarChart size={48} className="mb-4 text-gray-300" />
            <p className="text-sm font-medium">Select a section tab above to view data</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 bg-white">
      {/* Section Tabs */}
      <Tabs
        activeKey={activeSection || undefined}
        onChange={handleTabChange}
        type="card"
        size="small"
        tabBarGutter={4}
        items={SECTIONS.map((section) => ({
          key: section.key,
          label: <span className="text-xs sm:text-sm font-medium">{section.label}</span>,
        }))}
      />

      {/* Section Content */}
      <div className="mt-4">
        {renderSectionContent()}
      </div>
    </div>
  );
};

export default CallStatsTab;