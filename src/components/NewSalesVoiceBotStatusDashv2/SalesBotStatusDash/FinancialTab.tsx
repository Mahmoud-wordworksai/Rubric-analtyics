/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { motion } from "framer-motion";
import { FiPhone, FiDollarSign } from "react-icons/fi";
import { BsCalculator, BsClockHistory, BsHourglassSplit } from "react-icons/bs";
import { Card, Row, Col } from "antd";
import StatCard from "./StatCard";

interface FinancialTabProps {
  callstats: any;
}

const FinancialTab: React.FC<FinancialTabProps> = ({ callstats }) => {
  console.log("FinancialTab callstats:", callstats);
  
  const formatSecondsToMMSS = (seconds: any) => {
    if (!seconds || isNaN(seconds)) {
      return '0:00';
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const formattedSeconds = remainingSeconds.toString().padStart(2, '0');
    
    return `${minutes}:${formattedSeconds}`;
  };

  // Get data from new structure
  const financialOverview = callstats?.financial_overview || {};
  const pricingStructure = callstats?.pricing_structure || [];
  const callDurationDistribution = callstats?.call_duration_distribution || [];
  const insights = callstats?.key_insights || {};
  const currency = callstats?.currency || '₹';

  return (
    <div className="space-y-6 bg-white">
      {/* Financial Overview Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-[#263978]">Financial Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <StatCard
            title="Total Calls"
            value={financialOverview?.total_calls || 0}
            icon={<FiPhone size={18} className="sm:w-5 sm:h-5" />}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
            percentage="5.2"
            trend="up"
          />

          <StatCard
            title="Total Spend"
            value={`${currency.split(' ')[0]}${financialOverview?.total_calculated_spend?.toFixed(2) || '0.00'}`}
            icon={<FiDollarSign size={18} className="sm:w-5 sm:h-5" />}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
            percentage="3.7"
            trend="up"
          />

          <StatCard
            title="Avg Call Cost"
            value={`${currency.split(' ')[0]}${financialOverview?.average_call_cost?.toFixed(3) || '0.00'}`}
            icon={<BsCalculator size={18} className="sm:w-5 sm:h-5" />}
            iconBgColor="bg-orange-100"
            iconColor="text-orange-600"
            percentage="1.2"
            trend="down"
          />

          <StatCard
            title="Total Duration (Minutes)"
            value={formatSecondsToMMSS(financialOverview?.total_actual_duration || 0)}
            icon={<BsClockHistory size={18} className="sm:w-5 sm:h-5" />}
            iconBgColor="bg-purple-100"
            iconColor="text-purple-600"
            percentage="6.5"
            trend="up"
          />

          <StatCard
            title="Avg Duration (Minutes)"
            value={formatSecondsToMMSS(financialOverview?.average_call_duration || 0)}
            icon={<BsHourglassSplit size={18} className="sm:w-5 sm:h-5" />}
            iconBgColor="bg-red-100"
            iconColor="text-red-600"
            percentage="2.1"
            trend="neutral"
          />

          <StatCard
            title="Total Execution Duration (Minutes)"
            value={(() => {
              // 200 calls per minute => total_calls / 200 = minutes
              const totalCalls = financialOverview?.total_calls || 0;
              const executionMinutes = totalCalls / 200;
              // Convert minutes to seconds for formatSecondsToMMSS
              return formatSecondsToMMSS(executionMinutes * 60);
            })()}
            icon={<BsClockHistory size={18} className="sm:w-5 sm:h-5" />}
            iconBgColor="bg-indigo-100"
            iconColor="text-indigo-600"
            percentage="6.5"
            trend="up"
          />
        </div>
      </motion.div>

      {/* Pricing Structure */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-[#263978]">Pricing Structure</h3>
        <Card className="shadow-md border border-gray-200 rounded-xl">
          <Row gutter={[12, 12]}>
            {pricingStructure.map((pricing: any, index: number) => {
              const colorSchemes = [
                { bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-600', accent: 'text-green-500' },
                { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600', accent: 'text-blue-500' },
                { bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-600', accent: 'text-purple-500' },
                { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-600', accent: 'text-orange-500' },
                { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-600', accent: 'text-red-500' },
                { bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-600', accent: 'text-indigo-500' },
                { bg: 'bg-pink-50', border: 'border-pink-100', text: 'text-pink-600', accent: 'text-pink-500' },
                { bg: 'bg-yellow-50', border: 'border-yellow-100', text: 'text-yellow-600', accent: 'text-yellow-500' },
                { bg: 'bg-teal-50', border: 'border-teal-100', text: 'text-teal-600', accent: 'text-teal-500' },
                { bg: 'bg-cyan-50', border: 'border-cyan-100', text: 'text-cyan-600', accent: 'text-cyan-500' },
                { bg: 'bg-lime-50', border: 'border-lime-100', text: 'text-lime-600', accent: 'text-lime-500' },
                { bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-600', accent: 'text-rose-500' }
              ];
              const colors = colorSchemes[index % colorSchemes.length];
              
              return (
                <Col xs={24} sm={12} lg={8} xl={6} key={index}>
                  <div className={`text-center p-3 sm:p-4 ${colors.bg} rounded-lg border ${colors.border} hover:shadow-md transition-all w-full`}>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2 font-medium">{pricing.duration_range}</p>
                    <p className={`text-xl sm:text-2xl font-bold ${colors.text} mb-1`}>
                      {currency.split(' ')[0]}{pricing.cost_per_call}
                    </p>
                    <p className={`text-xs ${colors.accent} font-medium`}>
                      {pricing.cost_per_call === 0 ? 'FREE' : 'per call'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {pricing.min_seconds}-{pricing.max_seconds === 999999 ? '∞' : pricing.max_seconds}s
                    </p>
                  </div>
                </Col>
              );
            })}
          </Row>
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <p className="text-xs sm:text-sm text-[#263978] mb-2">
              <span className="font-semibold">Total Ranges Used:</span>{' '}
              {insights?.total_ranges_used || pricingStructure.length} pricing tiers
            </p>
            <p className="text-xs sm:text-sm text-[#263978] mb-2">
              <span className="font-semibold">Most Common Duration:</span>{' '}
              {insights?.most_common_duration_range || 'N/A'}
            </p>
            <p className="text-xs sm:text-sm text-[#263978]">
              <span className="font-semibold">Cost Efficiency:</span>{' '}
              {insights?.cost_efficiency || 'N/A'}
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Call Duration Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-[#263978]">Call Duration Distribution</h3>
        <Card className="shadow-md border border-gray-200 rounded-xl">
          <Row gutter={[12, 12]}>
            {callDurationDistribution.map((distribution: any, index: number) => {
              const colorSchemes = [
                { bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-600', accent: 'text-green-500' },
                { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600', accent: 'text-blue-500' },
                { bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-600', accent: 'text-purple-500' },
                { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-600', accent: 'text-orange-500' },
                { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-600', accent: 'text-red-500' },
                { bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-600', accent: 'text-indigo-500' },
                { bg: 'bg-pink-50', border: 'border-pink-100', text: 'text-pink-600', accent: 'text-pink-500' },
                { bg: 'bg-yellow-50', border: 'border-yellow-100', text: 'text-yellow-600', accent: 'text-yellow-500' },
                { bg: 'bg-teal-50', border: 'border-teal-100', text: 'text-teal-600', accent: 'text-teal-500' },
                { bg: 'bg-cyan-50', border: 'border-cyan-100', text: 'text-cyan-600', accent: 'text-cyan-500' }
              ];
              const colors = colorSchemes[index % colorSchemes.length];
              
              return (
                <Col xs={24} sm={12} lg={8} xl={6} key={index}>
                  <div className={`text-center p-3 sm:p-4 ${colors.bg} rounded-lg border ${colors.border} hover:shadow-md transition-all w-full`}>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2 font-medium">{distribution.duration_range} Sec</p>
                    <p className={`text-xl sm:text-2xl font-bold ${colors.text} mb-1`}>
                      {distribution.call_count}
                    </p>
                    <p className={`text-xs ${colors.accent} font-medium mb-1`}>
                      {distribution.percentage_of_total}% of total
                    </p>
                    {/* <p className="text-xs text-gray-500">
                      Avg: {formatSecondsToMMSS(distribution.average_duration)}
                    </p> */}
                    <p className="text-xs text-gray-500">
                      Cost: {currency.split(' ')[0]}{distribution.calculated_total_cost?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </Col>
              );
            })}
          </Row>
          <div className="mt-4 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs sm:text-sm">
              <div className="flex flex-col">
                <span className="text-gray-600 font-medium">Most Common Duration:</span>
                <span className="font-semibold text-[#263978]">
                  {insights?.most_common_duration_range || 'N/A'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-600 font-medium">Highest Cost Range:</span>
                <span className="font-semibold text-[#263978]">
                  {insights?.highest_cost_range || 'N/A'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-600 font-medium">Free Calls:</span>
                <span className="font-semibold text-[#263978]">
                  {insights?.free_calls_count || 0} 
                  ({insights?.free_calls_percentage || 0}%)
                </span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Additional Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-[#263978]">Key Insights</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="text-center p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all">
            <p className="text-2xl font-bold text-green-600 mb-2">
              {insights?.free_calls_percentage || 0}%
            </p>
            <p className="text-sm text-gray-600">Free Calls</p>
          </Card>
          
          <Card className="text-center p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all">
            <p className="text-2xl font-bold text-blue-600 mb-2">
              {currency.split(' ')[0]}{(financialOverview?.total_calculated_spend / (financialOverview?.total_calls || 1)).toFixed(3)}
            </p>
            <p className="text-sm text-gray-600">Cost Per Call</p>
          </Card>
          
          <Card className="text-center p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all">
            <p className="text-2xl font-bold text-purple-600 mb-2">
              {((financialOverview?.total_bill_duration - financialOverview?.total_actual_duration) / 60).toFixed(0)}m
            </p>
            <p className="text-sm text-gray-600">Extra Bill Time</p>
          </Card>
          
          <Card className="text-center p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all">
            <p className="text-2xl font-bold text-orange-600 mb-2">
              {financialOverview?.total_calls > 0 ? ((financialOverview?.total_calculated_spend / financialOverview?.total_calls) * 1000).toFixed(0) : 0}
            </p>
            <p className="text-sm text-gray-600">Cost per 1K calls</p>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default FinancialTab;