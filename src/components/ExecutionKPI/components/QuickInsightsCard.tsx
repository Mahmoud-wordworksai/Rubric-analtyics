"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { FiAlertCircle, FiInfo, FiCheckCircle, FiXCircle, FiZap } from "react-icons/fi";
import { QuickInsight, DispositionDistributionItem } from "../types";

interface QuickInsightsCardProps {
  insights: QuickInsight[];
  dispositionDistribution?: DispositionDistributionItem[];
  connectedCalls?: number;
}

type InsightType = "warning" | "info" | "success" | "error";

const getInsightStyles = (type: InsightType) => {
  switch (type) {
    case "warning":
      return {
        bg: "bg-orange-50",
        border: "border-orange-200",
        icon: <FiAlertCircle className="w-5 h-5 text-orange-600" />,
        text: "text-orange-800",
      };
    case "error":
      return {
        bg: "bg-red-50",
        border: "border-red-200",
        icon: <FiXCircle className="w-5 h-5 text-red-600" />,
        text: "text-red-800",
      };
    case "success":
      return {
        bg: "bg-green-50",
        border: "border-green-200",
        icon: <FiCheckCircle className="w-5 h-5 text-green-600" />,
        text: "text-green-800",
      };
    case "info":
    default:
      return {
        bg: "bg-blue-50",
        border: "border-blue-200",
        icon: <FiInfo className="w-5 h-5 text-blue-600" />,
        text: "text-blue-800",
      };
  }
};

const QuickInsightsCard: React.FC<QuickInsightsCardProps> = ({
  insights,
  dispositionDistribution = [],
  connectedCalls = 0,
}) => {
  // Generate insights from disposition distribution
  const generatedInsights = useMemo(() => {
    const result: Array<{ type: InsightType; category: string; message: string; recommendation: string | null }> = [];

    // Get PTP and Paid from disposition distribution
    const ptpData = dispositionDistribution.find(
      (item) => item.disposition?.toLowerCase() === "ptp"
    );
    const paidData = dispositionDistribution.find(
      (item) => item.disposition?.toLowerCase() === "paid"
    );

    const ptpCount = ptpData?.count || 0;
    const paidCount = paidData?.count || 0;

    const ptpRate = connectedCalls > 0 ? (ptpCount / connectedCalls) * 100 : 0;
    const paidRate = connectedCalls > 0 ? (paidCount / connectedCalls) * 100 : 0;

    // PTP insights
    if (ptpCount > 0) {
      if (ptpRate >= 20) {
        result.push({
          type: "success",
          category: "PTP",
          message: `Strong PTP conversion: ${ptpCount.toLocaleString()} customers (${ptpRate.toFixed(1)}% of connected)`,
          recommendation: "Follow up on PTP commitments to maximize collection.",
        });
      } else if (ptpRate >= 10) {
        result.push({
          type: "info",
          category: "PTP",
          message: `${ptpCount.toLocaleString()} PTP commitments received (${ptpRate.toFixed(1)}% of connected)`,
          recommendation: null,
        });
      } else if (ptpRate < 5 && connectedCalls > 50) {
        result.push({
          type: "warning",
          category: "PTP",
          message: `Low PTP rate: Only ${ptpCount.toLocaleString()} commitments (${ptpRate.toFixed(1)}%)`,
          recommendation: "Consider reviewing call scripts to improve PTP conversion.",
        });
      }
    }

    // Paid insights
    if (paidCount > 0) {
      if (paidRate >= 10) {
        result.push({
          type: "success",
          category: "Collection",
          message: `Excellent payment collection: ${paidCount.toLocaleString()} paid (${paidRate.toFixed(1)}% of connected)`,
          recommendation: null,
        });
      } else if (paidRate >= 5) {
        result.push({
          type: "info",
          category: "Collection",
          message: `${paidCount.toLocaleString()} payments collected (${paidRate.toFixed(1)}% of connected)`,
          recommendation: null,
        });
      }
    } else if (connectedCalls > 50) {
      result.push({
        type: "warning",
        category: "Collection",
        message: "No payments collected in this execution",
        recommendation: "Review payment facilitation process.",
      });
    }

    return result;
  }, [dispositionDistribution, connectedCalls]);

  // Combine API insights with generated insights
  const allInsights = [...insights, ...generatedInsights];

  if (allInsights.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
        <div className="p-2 rounded-lg bg-yellow-100">
          <FiZap className="w-4 h-4 text-yellow-600" />
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-[#263978]">
          Quick Insights
        </h3>
      </div>

      {/* Insights List */}
      <div className="space-y-3">
        {allInsights.map((insight, index) => {
          const styles = getInsightStyles(insight.type);

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className={`p-3 rounded-lg border ${styles.bg} ${styles.border}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">{styles.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-500 uppercase">
                      {insight.category}
                    </span>
                  </div>
                  <p className={`text-sm font-medium ${styles.text}`}>
                    {insight.message}
                  </p>
                  {insight.recommendation && (
                    <p className="text-xs text-gray-600 mt-1">
                      {insight.recommendation}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default QuickInsightsCard;
