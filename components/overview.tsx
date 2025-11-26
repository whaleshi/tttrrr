import { BNBIcon } from "@/components/icons";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import { ethers } from "ethers";
import { useTranslation } from "react-i18next";
import { useBalanceContext } from "@/providers/balanceProvider";
import _bignumber from "bignumber.js";
const BigNumber = _bignumber;
import { Image } from "@heroui/react";

interface OverviewProps {
	roundInfo: any;
	roundId?: number;
	timestamp?: any;
}

export default function Overview({ roundInfo, roundId, timestamp }: OverviewProps) {
	const { t } = useTranslation();
	const [realTimeCountdown, setRealTimeCountdown] = useState(0);
	const [showPrice, setShowPrice] = useState(false);
	const [showTotalPrice, setShowTotalPrice] = useState(false);
	const [showUserPrice, setShowUserPrice] = useState(false);
	const [showRound, setShowRound] = useState(false);
	const [isMobile, setIsMobile] = useState(false);
	const queryClient = useQueryClient();
	const { address } = useAuthStore();
	const { price } = useBalanceContext();

	// 检测是否为移动设备
	useEffect(() => {
		const checkIsMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};

		checkIsMobile();
		window.addEventListener('resize', checkIsMobile);

		return () => window.removeEventListener('resize', checkIsMobile);
	}, []);

	// 计算实时倒计时
	useEffect(() => {
		const updateCountdown = () => {
			const baseTimestamp = timestamp;

			if (baseTimestamp) {
				const targetTimestamp = baseTimestamp + 60; // 在timestamp基础上加60秒
				const currentTimestamp = Math.floor(Date.now() / 1000); // 当前时间戳（秒）
				const timeDiff = targetTimestamp - currentTimestamp;

				const newCountdown = timeDiff > 0 ? timeDiff : 0;

				// 如果倒计时刚好结束（从>0变为0），触发重新获取eventInfo
				if (realTimeCountdown > 0 && newCountdown === 0) {
					queryClient.invalidateQueries({ queryKey: ['eventInfo'] });
				}
				setRealTimeCountdown(newCountdown);
			} else {
				setRealTimeCountdown(0);
			}
		};

		// 立即执行一次
		updateCountdown();

		// 每秒更新一次
		const timer = setInterval(updateCountdown, 1000);

		return () => clearInterval(timer);
	}, [timestamp, realTimeCountdown, queryClient]);

	// 格式化倒计时显示
	const formatCountdown = (seconds: number) => {
		if (seconds <= 0) return '00:00';

		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
	};

	const { data: roundInfoData } = useQuery<any>({
		queryKey: ['roundInfo', roundId, address],
		queryFn: () => null,
		enabled: false
	});
	return (
		<div className="grid grid-cols-2 gap-2">
			<div
				className="bg-[rgba(239,196,98,0.10)] border-[2px] border-[#EFC462] rounded-[8px] backdrop-blur-[8px] h-[60px] flex flex-col items-center justify-center cursor-pointer"
				onClick={() => isMobile && setShowPrice(!showPrice)}
				onMouseEnter={() => !isMobile && setShowPrice(true)}
				onMouseLeave={() => !isMobile && setShowPrice(false)}
			>
				<div className="flex items-center gap-[4px] font-semibold">
					<Image src="/images/logo.png" alt="logo" className="w-[16px] h-[16px] shrink-0" disableSkeleton disableAnimation radius="none" />
					<div className="text-[16px]">{roundInfo?.treasuryOre || '0'}</div>
				</div>
				<div className="text-[#868789] text-[12px]">
					{!showPrice ? (
						t('Common.motherlode')
					) : (
						price && roundInfo?.treasuryOre ? (
							<div>
								≈ ${BigNumber(price).multipliedBy(roundInfo.treasuryOre).dp(2).toString()}
							</div>
						) : (
							t('Common.motherlode')
						)
					)}
				</div>
			</div>
			<div
				className="bg-[#191B1F] border-[1px] border-[#25262A] rounded-[8px] backdrop-blur-[8px] h-[60px] flex flex-col items-center justify-center cursor-pointer"
				onClick={() => isMobile && setShowRound(!showRound)}
				onMouseEnter={() => !isMobile && setShowRound(true)}
				onMouseLeave={() => !isMobile && setShowRound(false)}
			>
				<div className="flex items-center gap-[4px] font-semibold">
					<div className="text-[16px]">{roundInfo?.gameState === 1 ? formatCountdown(realTimeCountdown) : (roundInfo?.gameState === 3 || roundInfo?.gameState === 4) ? t('Common.drawing') : t('Common.waiting')}</div>
				</div>
				<div className="text-[#868789] text-[12px]">
					{!showRound ? (
						t('Common.timeRemaining')
					) : (
						<div>
							{t('Home.rounds')} #{roundId}
						</div>
					)}
				</div>
			</div>
			<div
				className="bg-[#191B1F] border-[1px] border-[#25262A] rounded-[8px] backdrop-blur-[8px] h-[60px] flex flex-col items-center justify-center cursor-pointer"
				onClick={() => isMobile && setShowTotalPrice(!showTotalPrice)}
				onMouseEnter={() => !isMobile && setShowTotalPrice(true)}
				onMouseLeave={() => !isMobile && setShowTotalPrice(false)}
			>
				<div className="flex items-center gap-[4px] font-semibold">
					<BNBIcon className="w-[16px] h-[16px]" />
					<div className="text-[16px]">
						{roundInfoData?.global?.total_amount && Number(roundInfoData?.global?.total_amount) > 0
							? (ethers.formatUnits(BigInt(roundInfoData?.global?.total_amount || "0"), 8))
							: '0.00'
						}
					</div>
				</div>
				<div className="text-[#868789] text-[12px]">
					{!showTotalPrice ? (
						t('Common.totalDeployed')
					) : (
						price ? (
							<div>
								≈ ${BigNumber(ethers.formatUnits(BigInt(roundInfoData?.global?.total_amount || "0"), 8)).multipliedBy(price).dp(2).toString()}
							</div>
						) : (
							t('Common.totalDeployed')
						)
					)}
				</div>
			</div>
			<div
				className="bg-[#191B1F] border-[1px] border-[#25262A] rounded-[8px] backdrop-blur-[8px] h-[60px] flex flex-col items-center justify-center cursor-pointer"
				onClick={() => isMobile && setShowUserPrice(!showUserPrice)}
				onMouseEnter={() => !isMobile && setShowUserPrice(true)}
				onMouseLeave={() => !isMobile && setShowUserPrice(false)}
			>
				<div className="flex items-center gap-[4px] font-semibold">
					<BNBIcon className="w-[16px] h-[16px]" />
					<div className="text-[16px]">
						{roundInfoData?.user?.total_amount && Number(roundInfoData?.user?.total_amount) > 0
							? (ethers.formatUnits(BigInt(roundInfoData?.user?.total_amount || "0"), 8))
							: '0.00'
						}
					</div>
				</div>
				<div className="text-[#868789] text-[12px]">
					{!showUserPrice ? (
						t('Common.youDeployed')
					) : (
						price ? (
							<div>
								≈ ${BigNumber(ethers.formatUnits(BigInt(roundInfoData?.user?.total_amount || "0"), 8)).multipliedBy(price).dp(2).toString()}
							</div>
						) : (
							t('Common.youDeployed')
						)
					)}
				</div>
			</div>
		</div>
	);
}
