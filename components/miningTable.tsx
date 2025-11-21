import { BNBIcon } from "@/components/icons";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { resetEventList } from '@/service/api';
import { shortenAddress } from '@/utils/index';
import { ethers } from 'ethers';
import _bignumber from 'bignumber.js';
import { useState, useEffect } from 'react';
const BigNumber = _bignumber;

interface MiningTableProps {
	title?: string;
	description?: string;
}

export const MiningTable = ({ title = "Mining", description = "Recent mining activity" }: MiningTableProps) => {
	const [currentPage, setCurrentPage] = useState(1);
	const pageSize = 10;
	const queryClient = useQueryClient();

	const { data: eventListInfo, isLoading } = useQuery({
		queryKey: ['eventListInfo', currentPage],
		queryFn: async () => {
			const result = await resetEventList(
				{
					"motherlode": "", // 是否命中母矿 motherlode  0-否 1-是
					"page": currentPage.toString(),
					"page_size": pageSize.toString(),
				}
			);
			return result?.data;
		},
		refetchInterval: 10000, // 10秒一次
	});

	// 预加载下一页数据
	useEffect(() => {
		if (eventListInfo?.total) {
			const totalPages = Math.ceil(eventListInfo.total / pageSize);
			const nextPage = currentPage + 1;

			if (nextPage <= totalPages) {
				queryClient.prefetchQuery({
					queryKey: ['eventListInfo', nextPage],
					queryFn: async () => {
						const result = await resetEventList({
							"motherlode": "",
							"page": nextPage.toString(),
							"page_size": pageSize.toString(),
						});
						return result?.data;
					},
				});
			}
		}
	}, [currentPage, eventListInfo?.total, queryClient, pageSize]);

	return (
		<div className="w-full">
			<div className="text-[28px] font-bold text-[#fff] mb-[8px]">{title}</div>
			<div className="text-[14px] text-[#868789] mb-[16px]">{description}</div>

			{/* Horizontal Scrollable Table */}
			<div className="w-full overflow-x-auto lg:overflow-x-visible">
				<div className="min-w-[936px] lg:min-w-full">
					{/* Table Header */}
					<div className="flex border-b border-dashed border-[#25262A] h-[38px] items-center text-[12px] text-[#868789] px-[12px]">
						<div className="w-[70px] lg:flex-[0.8] shrink-0 text-left">Round</div>
						<div className="w-[60px] lg:flex-[0.7] shrink-0 text-right">Block</div>
						<div className="w-[140px] lg:flex-[1.8] shrink-0 text-right">BURY Winner</div>
						<div className="w-[70px] lg:flex-[0.8] shrink-0 text-right">Winners</div>
						<div className="w-[110px] lg:flex-[1.3] shrink-0 text-right">Deployed</div>
						<div className="w-[110px] lg:flex-[1.3] shrink-0 text-right">Vaulted</div>
						<div className="w-[110px] lg:flex-[1.3] shrink-0 text-right">Winnings</div>
						<div className="w-[110px] lg:flex-[1.3] shrink-0 text-right">Motherlode</div>
						<div className="w-[140px] lg:flex-[1.8] shrink-0 text-right">Time</div>
					</div>

					{/* Table Rows */}
					<div className="">
						{isLoading ? (
							<div className="flex h-[380px] items-center justify-center text-[14px] text-[#868789]">
								<div className="flex flex-col items-center gap-[12px]">
									<img src="/images/loading.gif" alt="Loading" className="w-[40px] h-[40px]" />
								</div>
							</div>
						) : eventListInfo?.list?.length > 0 ? (
							eventListInfo.list.map((row: any, index: any) => (
								<div key={index} className="flex min-h-[38px] items-center text-[12px] hover:bg-[#191B1F] transition-colors cursor-pointer px-[12px] rounded-[8px] py-[2px]">
									<div className="w-[70px] lg:flex-[0.8] shrink-0 text-[#fff] break-words text-left">#{row?.round_id}</div>
									<div className="w-[60px] lg:flex-[0.7] shrink-0 text-[#fff] break-words text-right">#{row?.winning_square}</div>
									<div className="w-[140px] lg:flex-[1.8] shrink-0 text-[#fff] break-words overflow-hidden text-right">{row?.num_winners > 0 ? (row?.motherlode ? 'Split' : shortenAddress(row?.top_miner)) : 'NoWinner'}</div>
									<div className="w-[70px] lg:flex-[0.8] shrink-0 text-[#fff] break-words text-right">{row?.num_winners}</div>
									<div className="w-[110px] lg:flex-[1.3] shrink-0 flex items-center justify-end gap-[4px] min-w-0">
										<BNBIcon className="w-[14px] h-[14px] shrink-0" />
										<span className="text-[#fff] truncate">{row?.total_ore_mined ? BigNumber(ethers.formatEther(BigInt(row.total_ore_mined))).dp(6).toString() : '0'}</span>
									</div>
									<div className="w-[110px] lg:flex-[1.3] shrink-0 flex items-center justify-end gap-[4px] min-w-0">
										<BNBIcon className="w-[14px] h-[14px] shrink-0" />
										<span className="text-[#fff] truncate">{row?.vault_share ? BigNumber(ethers.formatEther(BigInt(row.vault_share))).dp(6).toString() : '0'}</span>
									</div>
									<div className="w-[110px] lg:flex-[1.3] shrink-0 flex items-center justify-end gap-[4px] min-w-0">
										<BNBIcon className="w-[14px] h-[14px] shrink-0" />
										<span className="text-[#fff] truncate">{row?.winnings ? BigNumber(ethers.formatEther(BigInt(row.winnings))).dp(6).toString() : '0'}</span>
									</div>
									<div className="w-[110px] lg:flex-[1.3] shrink-0 text-[#fff] break-words text-right">{row?.motherlode ? BigNumber(ethers.formatEther(BigInt(row.motherlode_payout))).dp(6).toString() : '-'}</div>
									<div className="w-[140px] lg:flex-[1.8] shrink-0 text-[#fff] text-right text-[11px] leading-tight">{row?.timestamp ? new Date(row.timestamp * 1000).toLocaleString() : '-'}</div>
								</div>
							))
						) : (
							<div className="flex h-[380px] items-center justify-center text-[14px] text-[#868789]">
								<div className="flex flex-col items-center gap-[12px]">
									<img src="/images/nothing.png" alt="No data" className="w-[80px] h-[80px] opacity-50" />
									<span>No data available</span>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Navigation Arrows */}
			{Math.ceil((eventListInfo?.total || 0) / pageSize) > 1 && (
				<div className="flex justify-end gap-[8px] mt-[16px] mb-[20px] w-full">
					<div
						className={`w-[32px] h-[32px] rounded-full border border-[#25262A] flex items-center justify-center cursor-pointer hover:bg-[#25262A] transition-colors ${currentPage <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
						onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
					>
						<svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#868789]">
							<path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
						</svg>
					</div>
					<div className="flex items-center px-3 text-[12px] text-[#868789]">
						{currentPage} / {Math.ceil((eventListInfo?.total || 0) / pageSize)}
					</div>
					<div
						className={`w-[32px] h-[32px] rounded-full border border-[#25262A] flex items-center justify-center cursor-pointer hover:bg-[#25262A] transition-colors ${currentPage >= Math.ceil((eventListInfo?.total || 0) / pageSize) ? 'opacity-50 cursor-not-allowed' : ''}`}
						onClick={() => currentPage < Math.ceil((eventListInfo?.total || 0) / pageSize) && setCurrentPage(currentPage + 1)}
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