import { LogoIcon, BNBIcon } from "@/components/icons";
import { useQuery } from "@tanstack/react-query";
import { getRoundWinInfo } from "@/service/api";
import { shortenAddress } from "@/utils";
import { ethers } from "ethers";
import _bignumber from "bignumber.js";
import { useAuthStore } from "@/stores/auth";
const BigNumber = _bignumber;
interface RankProps {
	roundId: number;
}

export default function Rank({ roundId }: RankProps) {
	const { address } = useAuthStore();
	// 获取轮次获胜信息
	const { data: roundWinData, isLoading, error } = useQuery({
		queryKey: ['roundWinInfo', roundId],
		queryFn: async () => {
			const result = await getRoundWinInfo({
				round_id: roundId - 1, // roundId - 1
				winner_address: address // 可选参数，留空获取所有获胜者
			});
			return result?.data;
		},
		refetchInterval: 10000, // 每 10 秒刷新一次
		refetchIntervalInBackground: true, // 后台也继续刷新
		retry: 2,
		staleTime: 0, // 数据立即过期
		refetchOnMount: true, // 挂载时重新请求
		refetchOnWindowFocus: true, // 窗口获得焦点时重新请求
		refetchOnReconnect: true // 重新连接时重新请求
	});
	console.log('轮次获胜信息:', roundWinData?.list);

	// 如果没有获胜者数据或列表为空，不显示组件
	if (!roundWinData?.list || roundWinData.list.length === 0) {
		return null;
	}

	return (
		<>
			<div className="text-[20px] text-[#fff] font-semibold flex items-center justify-between mb-[12px]">
				Miners<span className="text-[12px] text-[#868789]">Round: #{roundId}</span>
			</div>
			<div>
				{roundWinData?.list.map((item: any, index: number) => (
					<div
						key={index}
						className={`flex items-center justify-between h-[30px] ${index === 0 && item?.winner_address?.toLowerCase() === address?.toLowerCase()
							? 'border-b border-[#303135] border-dashed'
							: ''
							}`}
					>
						<span className={`text-[12px] ${index === 0 && item?.winner_address?.toLowerCase() === address?.toLowerCase()
							? 'text-[#fff]'
							: 'text-[#868789]'
							}`}>
							{index === 0 && item?.winner_address?.toLowerCase() === address?.toLowerCase()
								? 'You'
								: shortenAddress(item?.winner_address)
							}
						</span>
						<div className="flex items-center gap-[4px] text-[12px] text-[#fff]">
							{Number(item?.ore_reward) > 0 && (
								<>
									<LogoIcon className="w-[14px] h-[14px]" />
									<span>{BigNumber(ethers.formatEther(BigInt(item?.ore_reward || 0))).dp(6).toString()}</span>
									<span className="text-[#868789]">+</span>
								</>
							)}
							<BNBIcon className="w-[14px] h-[14px]" />
							<span>{BigNumber(ethers.formatEther(BigInt(item?.eth_reward || 0))).dp(6).toString()}</span>
						</div>
					</div>
				))}
			</div>
		</>
	)
}