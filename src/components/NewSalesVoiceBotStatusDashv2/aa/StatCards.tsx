import React from "react";
import { motion } from "framer-motion";
import { 
  PhoneOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  DatabaseOutlined,
  MailOutlined,
  LikeOutlined,
  DislikeOutlined,
  MinusCircleOutlined,
  StopOutlined,
  QuestionCircleOutlined,
  DollarOutlined,
  CalculatorOutlined,
  HourglassOutlined
} from "@ant-design/icons";

// Animation variants
const cardVariants = {
  hidden: { y: 10, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100
    }
  },
  hover: {
    y: -5,
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
    transition: {
      type: "spring" as const,
      stiffness: 300
    }
  }
};

interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  bgColor: string;
  textColor: string;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  bgColor, 
  textColor 
}) => {
  // Get the appropriate icon component
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "phone":
        return <PhoneOutlined />;
      case "check-circle":
        return <CheckCircleOutlined />;
      case "clock":
        return <ClockCircleOutlined />;
      case "close-circle":
        return <CloseCircleOutlined />;
      case "warning":
        return <WarningOutlined />;
      case "database":
        return <DatabaseOutlined />;
      case "mail":
        return <MailOutlined />;
      case "like":
        return <LikeOutlined />;
      case "dislike":
        return <DislikeOutlined />;
      case "minus":
        return <MinusCircleOutlined />;
      case "stop":
        return <StopOutlined />;
      case "question":
        return <QuestionCircleOutlined />;
      case "dollar":
        return <DollarOutlined />;
      case "calculator":
        return <CalculatorOutlined />;
      case "hourglass":
        return <HourglassOutlined />;
      default:
        return <DatabaseOutlined />;
    }
  };

  return (
    <motion.div
      className="backdrop-blur-sm bg-white/60 rounded-xl shadow-md border border-white/80 p-4 flex items-center gap-4 w-full"
      variants={cardVariants}
      whileHover="hover"
    >
      <div className={`p-3 rounded-full ${bgColor} bg-opacity-20`}>
        <span className={`text-xl ${textColor}`}>{getIcon(icon)}</span>
      </div>
      
      <div className="flex flex-col">
        <h4 className="text-xs sm:text-sm font-medium text-gray-600">{title}</h4>
        <p className="text-base sm:text-lg font-bold text-gray-900">{value ?? "0"}</p>
      </div>
    </motion.div>
  );
};

interface StatsContainerProps {
  children: React.ReactNode;
}

export const StatsContainer: React.FC<StatsContainerProps> = ({ children }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {children}
    </div>
  );
};