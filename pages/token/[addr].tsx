import { BackIcon, ShareIcon } from "@/components/icons";
import Share from "@/components/share";
import { TokenAbout } from "@/components/tokenAbout";
import { TokenEnd } from "@/components/tokenEnd";
import { TokenTradeBox } from "@/components/tradeBox";
import DefaultLayout from "@/layouts/default";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { getCoinDetails } from '@/service/api';
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import type { GetServerSideProps } from 'next';
import { siteConfig } from "@/config/site";
import Head from 'next/head';

interface SharePageProps {
	ogImageUrl: string;
	pageUrl: string;
	title: string;
	description: string;
}

export default function TokenPage({ ogImageUrl, pageUrl, title, description }: SharePageProps) {
	const router = useRouter();
	const { addr } = router.query;
	const [isShareOpen, setIsShareOpen] = useState(false);

	const { data, isLoading } = useQuery({
		queryKey: ["token-details", addr],
		queryFn: async () => await getCoinDetails({ mint: addr }),
		enabled: !!addr,
		staleTime: 2000, // 2秒内认为数据是新鲜的
		gcTime: 300000, // 5分钟缓存时间
		refetchInterval: 3000, // 3秒刷新一次
		refetchOnWindowFocus: true, // 窗口聚焦时刷新（详情页特性）
		refetchOnMount: false, // 组件挂载时不自动重新获取
		retry: 2, // 失败时重试2次
		retryDelay: 1000, // 重试延迟1秒
	});

	if (isLoading || !data) {
		return (
			<DefaultLayout>
				<Head>
					{/* Meta tags for social media sharing (SSR, absolute URLs) */}
					<meta name="description" content={description} />
					<meta name="keywords" content="meme token, fair launch, crypto, defi, token launch, okay.fun" />

					{/* Open Graph / Facebook */}
					<meta property="og:type" content="website" />
					<meta property="og:title" content={title} />
					<meta property="og:description" content={description} />
					<meta property="og:image" content={ogImageUrl} />
					<meta property="og:image:secure_url" content={ogImageUrl} />
					<meta property="og:image:width" content="1200" />
					<meta property="og:image:height" content="630" />
					<meta property="og:url" content={pageUrl} />
					<meta property="og:site_name" content={title} />

					{/* Twitter */}
					<meta name="twitter:card" content="summary_large_image" />
					<meta name="twitter:title" content={title} />
					<meta name="twitter:description" content={description} />
					<meta name="twitter:image" content={ogImageUrl} />
					<meta name="twitter:image:src" content={ogImageUrl} />
					<meta name="twitter:site" content="@nihaocrypto" />
					<meta name="twitter:creator" content="@nihaocrypto" />
					<link rel="canonical" href={pageUrl} />
				</Head>
				<div className="w-full h-full flex flex-col items-center justify-center">
					<Image src="/images/loading.gif" width={90} height={90} alt="Loading..." />
				</div>
			</DefaultLayout>
		);
	}

	return (
		<DefaultLayout>
			<Head>
				{/* Meta tags for social media sharing (SSR, absolute URLs) */}
				<meta name="description" content={description} />
				<meta name="keywords" content="meme token, fair launch, crypto, defi, token launch, okay.fun" />

				{/* Open Graph / Facebook */}
				<meta property="og:type" content="website" />
				<meta property="og:title" content={title} />
				<meta property="og:description" content={description} />
				<meta property="og:image" content={ogImageUrl} />
				<meta property="og:image:secure_url" content={ogImageUrl} />
				<meta property="og:image:width" content="1200" />
				<meta property="og:image:height" content="630" />
				<meta property="og:url" content={pageUrl} />
				<meta property="og:site_name" content={title} />

				{/* Twitter */}
				<meta name="twitter:card" content="summary_large_image" />
				<meta name="twitter:title" content={title} />
				<meta name="twitter:description" content={description} />
				<meta name="twitter:image" content={ogImageUrl} />
				<meta name="twitter:image:src" content={ogImageUrl} />
				<meta name="twitter:site" content="@nihaocrypto" />
				<meta name="twitter:creator" content="@nihaocrypto" />
				<link rel="canonical" href={pageUrl} />
			</Head>
			<section className="h-full flex flex-col items-center justify-center w-full relative">
				<div className="h-[48px] w-full flex items-center justify-between md:hidden px-[16px] relative z-1">
					<BackIcon className="cursor-pointer" onClick={() => router.push('/')} />
					<ShareIcon className="cursor-pointer" onClick={() => setIsShareOpen(true)} />
				</div>
				<div className="w-full h-[200px] md:h-[500px] absolute top-0 left-0"
					style={{ background: "linear-gradient(180deg, rgba(255, 233, 0, 0.15) 0%, rgba(255, 233, 0, 0.00) 100%)" }}
				></div>
				<div className="w-full flex-1 flex flex-col md:flex-row md:max-w-[800px] md:gap-[24px] relative md:pt-[80px]">
					{
						data?.data?.is_on_x === 1 ? <TokenEnd info={data?.data} /> : <>
							<TokenAbout info={data?.data} />
							<TokenTradeBox info={data?.data} />
						</>
					}
				</div>
			</section>
			<Share isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} info={data?.data} />
		</DefaultLayout>
	);
}


export const getServerSideProps: GetServerSideProps = async (context) => {
	const res = context.res;
	res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=120');
	const id = context.params?.addr as string;

	try {
		// 简化API调用，避免复杂的导入
		const response = await fetch(`https://gate.game.com/v1/nihao/coin_show`, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: `mint=${encodeURIComponent(id)}`,
		});

		if (!response.ok) throw new Error("API Error");
		const data = await response.json();

		const coinInfo = data?.data?.site_info_obj || {};
		const symbol = (coinInfo?.symbol || "TOKEN").toUpperCase();
		const name = coinInfo?.name || "Token";
		const imgUrl = coinInfo?.image || "";
		// 计算绝对站点地址（优先使用代理头）
		const proto = (context.req.headers["x-forwarded-proto"] as string) || "https";
		const host = (context.req.headers["x-forwarded-host"] as string) || (context.req.headers.host as string);
		const baseUrl = `${proto}://${host}`;
		const pageUrl = `${baseUrl}${context.resolvedUrl}`;

		const queryParams = new URLSearchParams({
			...(name ? { name } : {}),
			...(imgUrl ? { imgUrl } : {}),
			...(symbol ? { symbol } : {}),
		});

		const ogImageUrl = `${baseUrl}/api/og?${queryParams.toString()}`;
		return {
			props: {
				ogImageUrl,
				pageUrl,
				title: siteConfig.name,
				description: siteConfig.description,
			},
		};
	} catch (error) {
		// 如果API失败，使用默认值
		const proto = (context.req.headers["x-forwarded-proto"] as string) || "https";
		const host = (context.req.headers["x-forwarded-host"] as string) || (context.req.headers.host as string);
		const baseUrl = `${proto}://${host}`;
		const pageUrl = `${baseUrl}${context.resolvedUrl}`;
		const ogImageUrl = `${baseUrl}/api/og?symbol=TOKEN&name=Token&imgUrl=}`;
		return {
			props: {
				ogImageUrl,
				pageUrl,
				title: siteConfig.name,
				description: siteConfig.description,
			},
		};
	}
};