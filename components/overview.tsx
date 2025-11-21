import { LogoIcon, BNBIcon } from "@/components/icons";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import { ethers } from "ethers";

interface OverviewProps {
	roundInfo: any;
	roundId?: number;
	timestamp?: any;
	shouldShowCountdown?: boolean;
}

export default function Overview({ roundInfo, roundId, timestamp, shouldShowCountdown }: OverviewProps) {
	const [realTimeCountdown, setRealTimeCountdown] = useState(0);
	const queryClient = useQueryClient();
	const { address } = useAuthStore();

	// 计算实时倒计时
	useEffect(() => {
		const updateCountdown = () => {
			// if (shouldShowCountdown) {
			// 需要显示倒计时
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
			// } else {
			// 	// 不需要倒计时，显示00:00
			// 	setRealTimeCountdown(0);
			// }
		};

		// 立即执行一次
		updateCountdown();

		// 每秒更新一次
		const timer = setInterval(updateCountdown, 1000);

		return () => clearInterval(timer);
	}, [timestamp, shouldShowCountdown, realTimeCountdown, queryClient]);

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
			<div className="bg-[rgba(239,196,98,0.10)] border-[2px] border-[#EFC462] rounded-[8px] backdrop-blur-[8px] h-[60px] flex flex-col items-center justify-center">
				<div className="flex items-center gap-[4px] font-semibold">
					<LogoIcon className="w-[16px] h-[16px]" />
					<div className="text-[16px]">{roundInfo?.treasuryOre || '0'}</div>
				</div>
				<div className="text-[#868789] text-[12px]">Motherlode</div>
			</div>
			<div className="bg-[#191B1F] border-[1px] border-[#25262A] rounded-[8px] backdrop-blur-[8px] h-[60px] flex flex-col items-center justify-center">
				<div className="flex items-center gap-[4px] font-semibold">
					<div className="text-[16px]">{formatCountdown(realTimeCountdown)}</div>
				</div>
				<div className="text-[#868789] text-[12px]">
					{shouldShowCountdown ? 'Time remaining' : 'Waiting...'}
				</div>
			</div>
			<div className="bg-[#191B1F] border-[1px] border-[#25262A] rounded-[8px] backdrop-blur-[8px] h-[60px] flex flex-col items-center justify-center">
				<div className="flex items-center gap-[4px] font-semibold">
					<BNBIcon className="w-[16px] h-[16px]" />
					<div className="text-[16px]">
						{roundInfoData?.global?.total_amount && Number(roundInfoData?.global?.total_amount) > 0
							? (ethers.formatEther(BigInt(roundInfoData?.global?.total_amount || "0")))
							: '0.00'
						}
					</div>
				</div>
				<div className="text-[#868789] text-[12px]">Total deployed</div>
			</div>
			<div className="bg-[#191B1F] border-[1px] border-[#25262A] rounded-[8px] backdrop-blur-[8px] h-[60px] flex flex-col items-center justify-center">
				<div className="flex items-center gap-[4px] font-semibold">
					<BNBIcon className="w-[16px] h-[16px]" />
					<div className="text-[16px]">
						{roundInfoData?.user?.total_amount && Number(roundInfoData?.user?.total_amount) > 0
							? (ethers.formatEther(BigInt(roundInfoData?.user?.total_amount || "0")))
							: '0.00'
						}
					</div>
				</div>
				<div className="text-[#868789] text-[12px]">You deployed</div>
			</div>
		</div>
	);
}
