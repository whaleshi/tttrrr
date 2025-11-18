import { customToast } from "@/components/customToast";

// 预定义的常用 toast 类型
export const showSuccessToast = (title: string, description?: string) => {
  return customToast({
    title,
    description: description || "操作成功完成",
    type: 'success',
  });
};

export const showErrorToast = (title: string, description?: string) => {
  return customToast({
    title,
    description: description || "操作失败，请重试",
    type: 'error',
  });
};

export const showLoadingToast = (title: string, description?: string) => {
  return customToast({
    title,
    description: description || "请稍候...",
    type: 'loading',
  });
};

export const showTransactionToast = (txHash: string) => {
  return customToast({
    title: 'Transaction Confirmed',
    description: `View on Bscscan >`,
    type: 'success',
    button: {
      label: 'View',
      onClick: () => window.open(`https://bscscan.com/tx/${txHash}`, '_blank'),
    },
  });
};

export const showDeploymentSuccessToast = (squares: number[], amount: string) => {
  return customToast({
    title: '部署成功',
    description: `成功部署 ${squares.length} 个格子，每格 ${amount} BNB`,
    type: 'success',
    button: {
      label: 'OK',
      onClick: () => {},
    },
  });
};