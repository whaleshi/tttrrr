import { BNBIcon } from "@/components/icons";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { buryEventList } from '@/service/api';
import { ethers } from 'ethers';
import _bignumber from 'bignumber.js';
import { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
const BigNumber = _bignumber;
import { Image } from "@heroui/react";

interface BuybacksTableProps {
	title?: string;
	description?: string;
}

export const BuybacksTable = ({ title = "Buybacks", description = "Recent buybacks transactions" }: BuybacksTableProps) => {
	const { t } = useTranslation();
	const [currentPage, setCurrentPage] = useState(1);
	const pageSize = 10;
	const queryClient = useQueryClient();

	const { data: eventListInfo, isLoading } = useQuery({
		queryKey: ['buybacksInfo', currentPage],
		queryFn: async () => {
			const result = await buryEventList(
				{
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
					queryKey: ['buybacksInfo', nextPage],
					queryFn: async () => {
						const result = await buryEventList({
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
			<div className="text-[28px] font-bold text-[#fff] mb-[8px]">{t('Explore.buybacks')}</div>
			<div className="text-[14px] text-[#868789] mb-[16px]">{t('Explore.buybacksTransactions')}</div>

			{/* Horizontal Scrollable Table */}
			<div className="w-full overflow-x-auto lg:overflow-x-visible">
				<div className="min-w-[500px] lg:min-w-full">
					{/* Table Header */}
					<div className="flex border-b border-dashed border-[#25262A] h-[38px] items-center text-[12px] text-[#868789] px-[12px]">
						<div className="flex-1 text-left">{t('Explore.time')}</div>
						<div className="flex-1 text-right">{t('Explore.bnbSpent')}</div>
						<div className="flex-1 text-right">{t('Explore.oriBuried')}</div>
						<div className="flex-1 text-right">{t('Explore.stakingYield')}</div>
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
							<div className="h-[380px]">
								{
									eventListInfo.list.map((row: any, index: any) => (
										<div key={index} className="flex min-h-[38px] items-center text-[12px] hover:bg-[#191B1F] transition-colors cursor-pointer px-[12px] rounded-[8px] py-[2px]">
											<div className="flex-1 text-[#fff] text-[11px] leading-tight text-left">{row?.timestamp ? new Date(row.timestamp * 1000).toLocaleString() : '-'}</div>
											<div className="flex-1 flex items-center justify-end gap-[4px] min-w-0">
												<BNBIcon className="w-[14px] h-[14px] shrink-0" />
												<span className="text-[#fff] truncate">{row?.amount_in ? BigNumber(ethers.formatUnits(BigInt(row.amount_in), 8)).dp(8).toString() : '0'}</span>
											</div>
											<div className="flex-1 flex items-center justify-end gap-[4px] min-w-0">
												<Image src="/images/logo.png" alt="logo" className="w-[16px] h-[16px]" disableSkeleton disableAnimation radius="none" />
												<span className="text-[#fff] truncate">{row?.burned ? BigNumber(ethers.formatUnits(BigInt(row.burned), 8)).dp(8).toString() : '0'}</span>
											</div>
											<div className="flex-1 text-[#fff] text-right break-words">{row?.staker_share ? BigNumber(ethers.formatUnits(BigInt(row.staker_share), 8)).dp(8).toString() + '%' : '-'}</div>
										</div>
									))
								}
							</div>
						) : (
							<div className="flex h-[380px] items-center justify-center text-[14px] text-[#868789]">
								<div className="flex flex-col items-center gap-[12px]">
									<img src="/images/nothing.png" alt="No data" className="w-[80px] h-[80px] opacity-50" />
									<span>{t('Explore.noRecordsFound')}</span>
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