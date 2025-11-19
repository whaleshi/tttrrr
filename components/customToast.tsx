'use client';

import React, { useEffect, useState } from 'react';
import { toast as sonnerToast } from 'sonner';
import { ToastErrorIcon, ToastLoadingIcon, ToastSuccessIcon, CloseIcon } from './icons';
import { Button } from "@heroui/react";

interface ToastProps {
  id: string | number;
  title: string;
  description?: string | React.ReactNode;
  type?: 'success' | 'error' | 'loading';
  button?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
  link?: {
    url: string;
    text: string;
  };
}

interface CustomToastOptions {
  title: string;
  description?: string | React.ReactNode;
  type?: 'success' | 'error' | 'loading';
  button?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
  link?: {
    url: string;
    text: string;
  };
}

/** A fully custom toast that still maintains the animations and interactions. */
function Toast(props: ToastProps) {
  const { title, description, type = 'success', id, persistent = false } = props;
  const [progress, setProgress] = useState(100);

  // 5秒倒计时效果 (仅在非持久化模式下)
  useEffect(() => {
    if (persistent) return; // 如果是持久化toast，不启动倒计时

    const duration = 5000; // 5秒
    const interval = 100; // 每100ms更新一次
    const totalSteps = duration / interval; // 总步数：50步
    const decrement = 100 / totalSteps; // 每步减少：2%

    const timer = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - decrement;
        if (newProgress <= 0) {
          clearInterval(timer);
          // 延迟一点再关闭，确保动画完成
          setTimeout(() => sonnerToast.dismiss(id), 100);
          return 0;
        }
        return newProgress;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [id, persistent]);

  // 根据类型设置样式
  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-[#263731] to-[#25262a] toast-success';
      case 'error':
        return 'bg-gradient-to-r from-[#3b2a2f] to-[#25262a] toast-error';
      case 'loading':
        return 'bg-[#25262a] toast-loading';
      default:
        return 'bg-gradient-to-r from-[#263731] to-[#25262a] toast-success';
    }
  };

  // 根据类型获取图标
  const getToastIcon = () => {
    switch (type) {
      case 'success':
        return <ToastSuccessIcon className="size-8 flex-shrink-0" />;
      case 'error':
        return <ToastErrorIcon className="size-8 flex-shrink-0" />;
      case 'loading':
        return <ToastLoadingIcon className="size-8 flex-shrink-0 toast-loading-icon" />;
      default:
        return <ToastSuccessIcon className="size-8 flex-shrink-0" />;
    }
  };

  return (
    <div className={`flex items-center justify-between rounded-[8px] w-full lg:w-[400px] text-white font-sans text-[16px] gap-[16px] py-[12px] px-[16px] ${getToastStyle()}`}>
      {/* Left side: Icon + Content */}
      <div className="flex items-center gap-[12px] flex-1">
        {getToastIcon()}
        <div className="flex-1">
          <p className="font-medium text-[16px]">{title}</p>
          {description && (
            <div className="text-[13px] text-[#868789] mt-[2px]">{description}</div>
          )}
        </div>
      </div>

      {/* Right side: Button + Close (hide for loading) */}
      {type !== 'loading' && (
        <div className="flex items-center gap-[8px] flex-shrink-0">
          <div className="relative w-[36px] h-[36px]">
            {/* 外圈倒计时 */}
            <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="#404040"
                strokeWidth="2"
                className="opacity-50"
              />
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="#868789"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={100.53} // 2 * π * 16 ≈ 100.53
                strokeDashoffset={100.53 * ((100 - progress) / 100)}
                className="transition-all duration-100 ease-linear"
              />
            </svg>
            {/* 关闭按钮 */}
            <Button
              onPress={() => sonnerToast.dismiss(id)}
              isIconOnly
              className="absolute top-[2px] left-[2px] w-[32px] h-[32px] min-w-[32px] bg-[#2A2A2A] border border-[#404040] rounded-full"
            >
              <CloseIcon className="w-[16px] h-[16px]" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Custom toast function that can be called throughout the app */
export function customToast(options: CustomToastOptions) {
  return sonnerToast.custom((id) => (
    <Toast
      id={id}
      title={options.title}
      description={options.description}
      type={options.type}
      button={options.button}
    />
  ), {
    duration: Infinity // 禁用 sonner 自动关闭，由我们自己控制
  });
}

/** Custom toast function that persists until manually dismissed */
export function customToastPersistent(options: CustomToastOptions) {
  return sonnerToast.custom((id) => (
    <Toast
      id={id}
      title={options.title}
      description={options.description}
      type={options.type}
      button={options.button}
      persistent={true}
    />
  ), {
    duration: Infinity // 完全禁用自动关闭
  });
}

/** Function to manually dismiss a toast */
export function dismissToast(toastId: string | number) {
  sonnerToast.dismiss(toastId);
}

export default Toast;