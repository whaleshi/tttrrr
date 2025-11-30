import { useState, useEffect } from 'react';
import _bignumber from 'bignumber.js';
import { ethers } from 'ethers';
import { useTranslation } from "react-i18next";
import { useBalanceContext } from "@/providers/balanceProvider";
import { useQuery } from '@tanstack/react-query';
import { userAssetEvents } from '@/service/api';
import { useAuthStore } from '@/stores/auth';

const BigNumber = _bignumber;

interface AssetEvent {
	timestamp?: number;
	bet_amount?: string;
	points_reward?: string;
	round_id?: number;
}

interface PointsRecordsProps {
	// 保留原有的props但不使用，保证接口兼容性
	data?: any[];
	isLoading?: boolean;
}

export const PointsRecords = ({ }: PointsRecordsProps) => {
	const { t } = useTranslation();
	const { price } = useBalanceContext();
	const [hasData, setHasData] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const pageSize = 20;
	const { address } = useAuthStore();

	// 使用 userAssetEvents 接口获取数据
	const { data: assetEventsData, isLoading } = useQuery({
		queryKey: ['userAssetEvents310001', address, currentPage, pageSize],
		queryFn: async () => {
			const result = await userAssetEvents({
				event_type: '310001',
				user_addr: address,
				page: currentPage.toString(),
				page_size: pageSize.toString(),
			});
			return result?.data;
		},
		enabled: !!address,
		refetchInterval: 10000,
		refetchIntervalInBackground: true,
		staleTime: 5000,
	});

	// 只在第一次获取到数据或数据清空时更新状态
	useEffect(() => {
		if (assetEventsData?.list && assetEventsData.list.length > 0) {
			setHasData(true);
		} else if (!assetEventsData?.list) {
			setHasData(false);
		}
	}, [assetEventsData?.list]);

	// 只在没有数据且正在加载时显示loading
	const shouldShowLoading = isLoading && !hasData;

	return (
		<div className="w-full">
			<div className="text-[20px] font-semibold text-[#fff] mb-[8px]">起源币中奖记录</div>
			<div className="text-[12px] text-[#868789] mb-[12px]">失败用户奖励起源币，50% 概率 1 人获得，50% 概率根据失败投入数量按占比瓜分奖励</div>

			{/* Table Header */}
			<div className="grid gap-[8px] border-b border-dashed border-[#25262A] h-[38px] items-center" style={{ gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr' }}>
				<div className="text-[12px] text-[#868789]">{t('Points.time')}</div>
				<div className="text-[12px] text-[#868789]">{t('Points.inputAmount')}</div>
				<div className="text-[12px] text-[#868789]">轮次</div>
				<div className="text-[12px] text-[#868789] text-right">{t('Points.earnPoint')}</div>
			</div>

			{/* Table Rows */}
			<div>
				{shouldShowLoading ? (
					<div className="flex h-[300px] items-center justify-center text-[14px] text-[#868789]">
						<div className="flex flex-col items-center gap-[12px]">
							<img src="/images/loading.gif" alt="Loading" className="w-[40px] h-[40px]" />
						</div>
					</div>
				) : assetEventsData?.list && assetEventsData.list.length > 0 ? (
					assetEventsData.list.map((record: AssetEvent, index: number) => (
						<div key={index} className="grid gap-[8px] h-[38px] items-center" style={{ gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr' }}>
							{/* 时间列 */}
							<div className="text-[12px] text-[#fff] truncate">
								{record?.timestamp ? new Date(record.timestamp * 1000).toLocaleString() : '-'}
							</div>
							{/* 投入金额列 */}
							<div className="text-[12px] text-[#fff] truncate">
								{record?.bet_amount ?
									BigNumber(ethers.formatUnits(BigInt(record.bet_amount), 8))
										.dp(6, BigNumber.ROUND_DOWN)
										.toString() + ' BNB'
									: '-'
								}
							</div>
							{/* 轮次列 */}
							<div className="text-[12px] text-[#fff] truncate">
								{record?.round_id ? `#${record.round_id}` : '-'}
							</div>
							{/* 积分列 - 右对齐 */}
							<div className="text-[12px] text-[#fff] text-right">
								{record?.points_reward ?
									BigNumber(record.points_reward).dp(2).toString()
									: '0'
								}
							</div>
						</div>
					))
				) : (
					<div className="flex h-[300px] items-center justify-center text-[14px] text-[#868789]">
						<div className="flex flex-col items-center gap-[12px]">
							<img src="/images/nothing.png" alt="No data" className="w-[80px] h-[80px] opacity-50" />
							<span>{t('Explore.noRecordsFound')}</span>
						</div>
					</div>
				)}
			</div>

			{/* Pagination */}
			{Math.ceil((assetEventsData?.total || 0) / pageSize) > 1 && (
				<div className="flex justify-center gap-[8px] mt-[16px] mb-[20px] w-full">
					<div
						className={`w-[32px] h-[32px] rounded-full border border-[#25262A] flex items-center justify-center cursor-pointer hover:bg-[#25262A] transition-colors ${currentPage <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
						onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
					>
						<svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#868789]">
							<path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
						</svg>
					</div>
					<div className="flex items-center px-3 text-[12px] text-[#868789]">
						{currentPage} / {Math.ceil((assetEventsData?.total || 0) / pageSize)}
					</div>
					<div
						className={`w-[32px] h-[32px] rounded-full border border-[#25262A] flex items-center justify-center cursor-pointer hover:bg-[#25262A] transition-colors ${currentPage >= Math.ceil((assetEventsData?.total || 0) / pageSize) ? 'opacity-50 cursor-not-allowed' : ''}`}
						onClick={() => currentPage < Math.ceil((assetEventsData?.total || 0) / pageSize) && setCurrentPage(currentPage + 1)}
					>
						<svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#868789]">
							<path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
						</svg>
					</div>
				</div>
			)}
		</div>
	);
};