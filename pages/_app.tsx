import type { AppProps } from "next/app";
import Head from "next/head";
import { useEffect } from "react";

import { HeroUIProvider } from "@heroui/system";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useRouter } from "next/router";
import QueryProvider from '@/providers/queryProvider'
import PrivyProviders from '@/providers/privyProvider'
import { BalanceProvider } from '@/providers/balanceProvider'
import { Toaster } from 'sonner';
import NProgress from 'nprogress';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/wagmiConfig';

import { fontSans } from "@/config/fonts";
import "@/styles/globals.css";
import "nprogress/nprogress.css";
import { ToastErrorIcon, ToastLoadingIcon, ToastSuccessIcon } from "@/components/icons";

export default function App({ Component, pageProps }: AppProps) {
	const router = useRouter();

	// 配置nprogress
	useEffect(() => {
		NProgress.configure({
			showSpinner: false, // 隐藏加载圆圈
			minimum: 0.3, // 最小进度
			easing: 'ease', // 动画效果
			speed: 200 // 动画速度
		});
	}, []);

	// 监听路由变化
	useEffect(() => {
		const handleStart = () => {
			NProgress.start();
		};

		const handleStop = () => {
			NProgress.done();
		};

		router.events.on('routeChangeStart', handleStart);
		router.events.on('routeChangeComplete', handleStop);
		router.events.on('routeChangeError', handleStop);

		return () => {
			router.events.off('routeChangeStart', handleStart);
			router.events.off('routeChangeComplete', handleStop);
			router.events.off('routeChangeError', handleStop);
		};
	}, [router]);

	// 预加载关键页面
	useEffect(() => {
		// 延迟预加载，避免影响初始页面加载性能
		const timer = setTimeout(async () => {
			try {
				// 预加载关键页面
				await Promise.all([
					router.prefetch('/points'),
					router.prefetch('/stake'),
					router.prefetch('/explore'),
					router.prefetch('/about')
				]);
				console.log('页面预加载完成');
			} catch (error) {
				console.warn('页面预加载失败:', error);
			}
		}, 1000); // 1秒后开始预加载

		return () => clearTimeout(timer);
	}, [router]);

	return (
		<>
			<Head>
				{/* 预加载关键图片 */}
				<link rel="preload" href="/images/loading.gif" as="image" />
			</Head>
			<WagmiProvider config={config}>
				<PrivyProviders>
					<QueryProvider>
						<BalanceProvider>
							<HeroUIProvider navigate={router.push}>
								<Toaster
									richColors
									position="top-center"
									// icons={{
									// 	success: <ToastSuccessIcon className="w-[30px] h-[30px]" />,
									// 	error: <ToastErrorIcon className="w-[30px] h-[30px]" />,
									// 	loading: <ToastLoadingIcon className="w-[30px] h-[30px]" />
									// }}
									toastOptions={{
										classNames: {
											success: 'toast-success',
											error: 'toast-error',
											loading: 'toast-loading',
										}
									}}
								/>
								<NextThemesProvider attribute="class" defaultTheme="dark">
									<Component {...pageProps} />
								</NextThemesProvider>
							</HeroUIProvider>
						</BalanceProvider>
					</QueryProvider>
				</PrivyProviders>
			</WagmiProvider>
		</>
	);
}

export const fonts = {
	sans: fontSans.style.fontFamily
};
