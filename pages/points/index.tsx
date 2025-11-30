import { CopyIcon, PointsIcon } from "@/components/icons";
import DefaultLayout from "@/layouts/default";
import { useQuery } from '@tanstack/react-query';
import { getPointsList } from '@/service/api';
import { useState } from 'react';
import _bignumber from 'bignumber.js';
import { useAuthStore } from '@/stores/auth';
import { useTranslation } from "react-i18next";
import { usePrivy } from "@privy-io/react-auth";
const BigNumber = _bignumber;
import { Image } from "@heroui/react";
import { PointsRecords } from "@/components/PointsRecords";
import { PointsRecords2 } from "@/components/PointsRecords2";

export default function PointsPage() {
	const { t } = useTranslation();
	const { ready } = usePrivy();
	const [currentPage, setCurrentPage] = useState(1);
	const pageSize = 20;
	const { address } = useAuthStore();

	const { data: pointsListData, isLoading, isFetching } = useQuery({
		queryKey: ['pointsList', address, currentPage, pageSize],
		queryFn: async () => {
			const result = await getPointsList({
				user: address,
				page: currentPage,
				limit: pageSize
			});
			return result?.data;
		},
		enabled: !!address,
		refetchInterval: 10000,
		refetchIntervalInBackground: true,
		staleTime: 5000, // 5秒内不会重新请求
	});

	// 只在初次加载或分页变化时显示loading，不在后台刷新时显示
	const showLoading = isLoading && !pointsListData;

	if (!ready) {
		return <div className="flex items-center justify-center h-screen w-screen bg-[#0D0F13]">
			<img src="/images/loading.gif" alt="Loading" className="w-[60px] h-[60px]" />
		</div>;
	}

	return (
		<DefaultLayout>
			<section className="flex flex-col items-center justify-center w-full px-[14px] max-w-[600px] mx-auto">
				<div className="text-[28px] font-bold text-[#fff] w-full pt-[24px]">起源矿池</div>
				<div className="text-[14px] text-[#868789] w-full mt-[2px] mb-[24px]">
					投入后未中奖的用户将获得 <span className="text-[#EFC462]">起源</span> 奖励 <br />
					每轮固定发放 <span className="text-[#fff]">200</span> <span className="text-[#EFC462]">起源</span> 奖励 <br />
					母矿奖池每轮累积 <span className="text-[#fff]">40</span> <span className="text-[#EFC462]">起源</span>，母矿开奖后一次性发放
				</div>
				<div className="w-full border-[2px] border-[#25262A] rounded-[16px] h-[48px] mb-[8px] flex items-center px-[16px]">
					<div className="flex items-center w-full">
						<PointsIcon className="w-[24px] h-[24px]" />
						<div className="flex items-center flex-1">
							<div className="text-[16px] text-[#fff] mx-[4px]">起源</div>
							<div className="text-[12px] text-[#4A4B4E]">${pointsListData?.user_points?.total_points ? BigNumber(pointsListData?.user_points?.total_points).dp(2).toString() : '0.00'}</div>
						</div>
						<CopyIcon className="cursor-pointer" />
					</div>
				</div>
				<div className="w-full grid grid-cols-2 gap-2 mb-[32px]">
					<div className="bg-[#191B1F] border-[1px] border-[#25262A] rounded-[8px] backdrop-blur-[8px] h-[60px] flex flex-col items-center justify-center">
						<div className="flex items-center gap-[4px] font-semibold">
							<Image src="/images/logo.png" alt="logo" className="w-[16px] h-[16px] shrink-0" disableSkeleton disableAnimation radius="none" />
							<div className="text-[16px] text-[#fff]">{(28000000).toLocaleString()}</div>
						</div>
						<div className="text-[#868789] text-[12px]">累计发放</div>
					</div>
					<div className="bg-[#191B1F] border-[1px] border-[#25262A] rounded-[8px] backdrop-blur-[8px] h-[60px] flex flex-col items-center justify-center">
						<div className="flex items-center gap-[4px] font-semibold">
							<Image src="/images/logo.png" alt="logo" className="w-[16px] h-[16px] shrink-0" disableSkeleton disableAnimation radius="none" />
							<div className="text-[16px] text-[#fff]">{(28000000).toLocaleString()}</div>
						</div>
						<div className="text-[#868789] text-[12px]">当前母矿奖池</div>
					</div>
				</div>
				<div className="text-[20px] text-[#fff] w-full mb-[12px]">我的奖励</div>
				{/* My Points Card */}
				<div className="w-full border-[2px] border-[#25262A] rounded-[16px] h-[88px] mb-[12px] flex items-center px-[16px]">
					<div className="flex items-center gap-[12px]">
						<PointsIcon className="w-[40px] h-[40px]" />
						<div>
							<div className="text-[12px] text-[#868789] mb-[4px]">{t('Points.myPoints')}</div>
							<div className="text-[24px] font-bold text-[#fff]">{pointsListData?.user_points?.total_points ? BigNumber(pointsListData?.user_points?.total_points).dp(2).toString() : '0.00'}</div>
						</div>
					</div>
				</div>
				<div className="w-full text-[12px] text-[#868789] mb-[24px]">已累计领取：<span className="text-[#fff]">{pointsListData?.system_total_points ? BigNumber(pointsListData.system_total_points).dp(2).toFormat() : '0'} 起源</span></div>

				{/* Records Section */}
				<PointsRecords
					data={pointsListData?.list}
					isLoading={isLoading}
				/>

				{/* Second Records Section */}
				<div className="mt-[32px] w-full">
					<PointsRecords2
						data={pointsListData?.list}
						isLoading={isLoading}
					/>
				</div>
			</section>
		</DefaultLayout>
	);
}