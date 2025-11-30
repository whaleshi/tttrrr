import { CopyIcon, PointsIcon } from "@/components/icons";
import DefaultLayout from "@/layouts/default";
import { useQuery } from '@tanstack/react-query';
import { getOriginInfo } from '@/service/api';
import { useState } from 'react';
import _bignumber from 'bignumber.js';
import { useAuthStore } from '@/stores/auth';
import { useTranslation, Trans } from "react-i18next";
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
		queryKey: ['originInfo', address],
		queryFn: async () => {
			const result = await getOriginInfo({
				user_addr: address,
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
				<div className="text-[28px] font-bold text-[#fff] w-full pt-[24px]">{t('Points.originPool')}</div>
				<div className="text-[14px] text-[#868789] w-full mt-[2px] mb-[24px]">
					<Trans
						i18nKey="Points.originPoolDescription"
						components={[
							<span className="text-[#EFC462]" />,
							<br />,
							<span className="text-[#fff]" />,
							<span className="text-[#EFC462]" />,
							<br />,
							<span className="text-[#fff]" />,
							<span className="text-[#EFC462]" />
						]}
					/>
				</div>
				<div className="w-full border-[2px] border-[#25262A] rounded-[16px] h-[48px] mb-[8px] flex items-center px-[16px]">
					<div className="flex items-center w-full">
						<PointsIcon className="w-[24px] h-[24px]" />
						<div className="flex items-center flex-1">
							<div className="text-[16px] text-[#fff] mx-[4px]">{t('Points.origin')}</div>
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
						<div className="text-[#868789] text-[12px]">{t('Points.totalDistributed')}</div>
					</div>
					<div className="bg-[#191B1F] border-[1px] border-[#25262A] rounded-[8px] backdrop-blur-[8px] h-[60px] flex flex-col items-center justify-center">
						<div className="flex items-center gap-[4px] font-semibold">
							<Image src="/images/logo.png" alt="logo" className="w-[16px] h-[16px] shrink-0" disableSkeleton disableAnimation radius="none" />
							<div className="text-[16px] text-[#fff]">{(28000000).toLocaleString()}</div>
						</div>
						<div className="text-[#868789] text-[12px]">{t('Points.currentMotherLodePool')}</div>
					</div>
				</div>
				<div className="text-[20px] text-[#fff] w-full mb-[12px]">{t('Points.myRewards')}</div>
				{/* My Points Card */}
				<div className="w-full border-[2px] border-[#25262A] rounded-[16px] h-[88px] mb-[12px] flex items-center px-[16px] justify-between">
					<div className="flex items-center gap-[12px]">
						<PointsIcon className="w-[40px] h-[40px]" />
						<div>
							<div className="text-[12px] text-[#868789] mb-[4px]">{t('Points.claimableReward')}</div>
							<div className="text-[24px] font-bold text-[#fff]">{pointsListData?.user_points?.total_points ? BigNumber(pointsListData?.user_points?.total_points).dp(2).toString() : '0.00'}</div>
						</div>
					</div>
					<button 
						className={`px-[20px] py-[8px] rounded-[20px] text-[14px] font-medium transition-colors ${
							pointsListData?.user_points?.total_points && BigNumber(pointsListData.user_points.total_points).gt(0)
								? 'bg-[#fff] text-[#000] hover:bg-[#f0f0f0]'
								: 'bg-[#3A3B3F] text-[#868789] cursor-not-allowed'
						}`}
						disabled={!pointsListData?.user_points?.total_points || BigNumber(pointsListData.user_points.total_points).lte(0)}
					>
						{t('Points.claim')}
					</button>
				</div>
				<div className="w-full text-[12px] text-[#868789] mb-[24px]">{t('Points.totalClaimed')}：<span className="text-[#fff]">{pointsListData?.system_total_points ? BigNumber(pointsListData.system_total_points).dp(2).toFormat() : '0'} {t('Points.origin')}</span></div>

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