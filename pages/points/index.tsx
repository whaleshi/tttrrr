import { PointsIcon } from "@/components/icons";
import DefaultLayout from "@/layouts/default";
import { useQuery } from '@tanstack/react-query';
import { getPointsList, getUserPoints } from '@/service/api';
import { useState } from 'react';
import _bignumber from 'bignumber.js';
import { useAuthStore } from '@/stores/auth';
import { ethers } from 'ethers';
const BigNumber = _bignumber;

export default function PointsPage() {
	const [currentPage, setCurrentPage] = useState(1);
	const pageSize = 20;
	const { address } = useAuthStore();

	// 获取用户积分总数
	const { data: userPointsData } = useQuery({
		queryKey: ['userPoints', address],
		queryFn: async () => {
			if (!address) return null;
			const result = await getUserPoints({ miner: address });
			return result?.data;
		},
		refetchInterval: 30000,
		enabled: !!address,
	});

	// 获取积分记录列表
	const { data: pointsListData, isLoading } = useQuery({
		queryKey: ['pointsList', currentPage, address],
		queryFn: async () => {
			if (!address) return null;
			const result = await getPointsList({
				"miner": address,
				"page": currentPage.toString(),
				"page_size": pageSize.toString(),
			});
			return result?.data;
		},
		refetchInterval: 30000,
		enabled: !!address,
	});

	return (
		<DefaultLayout>
			<section className="flex flex-col items-center justify-center w-full px-[14px] max-w-[600px] mx-auto">
				<div className="text-[28px] font-bold text-[#fff] w-full pt-[24px]">Points</div>
				<div className="text-[14px] text-[#868789] w-full mt-[2px] mb-[24px]">Earn points, get first-release Memes!</div>

				{/* My Points Card */}
				<div className="w-full border-[2px] border-[#25262A] rounded-[16px] h-[88px] mb-[24px] flex items-center px-[16px]">
					<div className="flex items-center gap-[12px]">
						<PointsIcon className="w-[40px] h-[40px]" />
						<div>
							<div className="text-[12px] text-[#868789] mb-[4px]">My Points</div>
							<div className="text-[24px] font-bold text-[#fff]">{userPointsData?.total_points ? BigNumber(userPointsData.total_points).dp(2).toString() : '0.00'}</div>
						</div>
					</div>
				</div>

				{/* Records Section */}
				<div className="w-full">
					<div className="text-[20px] font-semibold text-[#fff] mb-[8px]">Records</div>
					<div className="text-[12px] text-[#868789] mb-[12px]">Earn 1 point for every 1 USD bet.</div>

					{/* Table Header */}
					<div className="grid grid-cols-4 gap-[12px] border-b border-dashed border-[#25262A] h-[38px] items-center">
						<div className="text-[14px] text-[#868789]">Time</div>
						<div className="text-[14px] text-[#868789]">Stake</div>
						<div className="text-[14px] text-[#868789]">Value</div>
						<div className="text-[14px] text-[#868789] text-right">Earn point</div>
					</div>

					{/* Table Rows */}
					<div className="">
						{isLoading ? (
							<div className="flex h-[300px] items-center justify-center text-[14px] text-[#868789]">
								<div className="flex flex-col items-center gap-[12px]">
									<img src="/images/loading.gif" alt="Loading" className="w-[40px] h-[40px]" />
								</div>
							</div>
						) : pointsListData?.list?.length > 0 ? (
							pointsListData.list.map((record: any, index: any) => (
								<div key={index} className="grid grid-cols-4 gap-[12px] h-[38px] items-center">
									{/* BigNumber(ethers.formatEther(BigInt(record?.bet_amount))).dp(4).toString() */}
									<div className="text-[14px] text-[#fff]">{record?.timestamp ? new Date(record.timestamp * 1000).toLocaleDateString() : '-'}</div>
									<div className="text-[14px] text-[#fff]">{record?.bet_amount ? 1 + ' BNB' : '-'}</div>
									<div className="text-[14px] text-[#fff]">{record?.usd_value ? '$' + BigNumber(record.usd_value).dp(2).toString() : '-'}</div>
									<div className="text-[14px] text-[#fff] text-right">{record?.points_reward ? BigNumber(record.points_reward).dp(2).toString() : '0.00'}</div>
								</div>
							))
						) : (
							<div className="flex h-[300px] items-center justify-center text-[14px] text-[#868789]">
								<div className="flex flex-col items-center gap-[12px]">
									<img src="/images/nothing.png" alt="No data" className="w-[80px] h-[80px] opacity-50" />
									<span>No records available</span>
								</div>
							</div>
						)}
					</div>

					{/* Pagination */}
					{Math.ceil((pointsListData?.total || 0) / pageSize) > 1 && (
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
								{currentPage} / {Math.ceil((pointsListData?.total || 0) / pageSize)}
							</div>
							<div
								className={`w-[32px] h-[32px] rounded-full border border-[#25262A] flex items-center justify-center cursor-pointer hover:bg-[#25262A] transition-colors ${currentPage >= Math.ceil((pointsListData?.total || 0) / pageSize) ? 'opacity-50 cursor-not-allowed' : ''}`}
								onClick={() => currentPage < Math.ceil((pointsListData?.total || 0) / pageSize) && setCurrentPage(currentPage + 1)}
							>
								<svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#868789]">
									<path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							</div>
						</div>
					)}
				</div>
			</section>
		</DefaultLayout>
	);
}