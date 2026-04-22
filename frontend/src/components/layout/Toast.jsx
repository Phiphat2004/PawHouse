// Author note
import { useEffect } from "react";
import {
  CheckCircleFilled,
  CloseCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CloseOutlined,
} from "@ant-design/icons";

const Toast = ({ type = "success", title, message, onClose, index = 0 }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: {
      bg: "bg-green-50 border-green-300",
      text: "text-green-800",
      icon: <CheckCircleFilled className="w-5 h-5 text-green-600" />,
    },
    error: {
      bg: "bg-red-50 border-red-300",
      text: "text-red-800",
      icon: <CloseCircleOutlined className="w-5 h-5 text-red-600" />,
    },
    warning: {
      bg: "bg-yellow-50 border-yellow-300",
      text: "text-yellow-800",
      icon: <WarningOutlined className="w-5 h-5 text-yellow-600" />,
    },
    info: {
      bg: "bg-blue-50 border-blue-300",
      text: "text-blue-800",
      icon: <InfoCircleOutlined className="w-5 h-5 text-blue-600" />,
    },
  };

  const style = styles[type] || styles.info;

  return (
    <div
      className={`fixed right-5 z-[999] transition-all duration-300 ease-in-out animate-slide-in`}
      style={{
        top: `${20 + index * 80}px`, // keep stacked toasts separated
      }}
    >
      <div
        className={`flex items-start gap-3 border-l-4 rounded-md shadow-md px-5 py-3 w-[340px] ${style.bg} ${style.text}`}
      >
        {style.icon}
        <div className="flex-1">
          <div className="font-semibold">{title}</div>
          <div className="text-sm text-gray-600">{message}</div>
        </div>
        <button
          onClick={onClose}
          className={`${style.close} transition`}
          aria-label="Close notification"
        >
          <CloseOutlined className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
