import { toast } from "sonner";

export interface ToastOptions {
  type: "success" | "error" | "warning" | "info";
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

export const showToast = ({
  type,
  message,
  actionLabel,
  onAction,
  duration = 5000,
}: ToastOptions) => {
  const options = {
    duration,
    action: actionLabel && onAction ? {
      label: actionLabel,
      onClick: onAction,
    } : undefined,
  };

  switch (type) {
    case "success":
      toast.success(message, options);
      break;
    case "error":
      toast.error(message, options);
      break;
    case "warning":
      toast.warning(message, options);
      break;
    case "info":
      toast.info(message, options);
      break;
    default:
      toast(message, options);
  }
};