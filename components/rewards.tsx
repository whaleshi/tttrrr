import React, { useState } from "react";
import { LogoIcon, BNBIcon, InfoIcon } from "@/components/icons";
import { Button, Divider, Popover, PopoverContent, PopoverTrigger, Progress } from "@heroui/react";
import { ethers } from "ethers";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useAuthStore } from "@/stores/auth";
import OreProtocolABI from "@/constant/OreProtocol.json";
import { CONTRACT_CONFIG } from "@/config/chains";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

export default function Rewards() {
	const [isClaimLoading, setIsClaimLoading] = useState(false);

	const { ready } = usePrivy();
	const { wallets } = useWallets();
	const { isLoggedIn, address } = useAuthStore();
	const wallet = address ? wallets.find((w) => w.address?.toLowerCase() === address.toLowerCase()) : null;
	const isConnected = ready && isLoggedIn && !!address;

	// 获取用户奖励的函数
	const fetchUserRewards = async () => {
		if (!wallet || !isConnected || !address || !CONTRACT_CONFIG.ORE_CONTRACT) {
			throw new Error('Wallet not connected or contract not available');
		}

		const ethereumProvider = await wallet.getEthereumProvider();
		const provider = new ethers.BrowserProvider(ethereumProvider);
		const signer = await provider.getSigner();

		const contract = new ethers.Contract(
			CONTRACT_CONFIG.ORE_CONTRACT,
			OreProtocolABI.abi,
			signer
		);
		// console.log(1111)
		// 调用 getUserRewards
		const rewards = await contract.getUserRewards(address);
		// console.log('原始奖励数据:', rewards);
		// const miner = await contract.getMinerRoundInfo(45, address);
		// console.log('矿工数据:', miner);
		const rewardsData = {
			ethAmount: ethers.formatEther(rewards.ethAmount),
			oriDirect: ethers.formatUnits(rewards.oriDirect),
			oriRefined: ethers.formatUnits(rewards.oriRefined)
		};

		// console.log('用户奖励:', rewardsData);
		return rewardsData;
	};

	const { data: rewardsData, isLoading, error } = useQuery({
		queryKey: ['userRewards', address],
		queryFn: fetchUserRewards,
		enabled: !!address,
		refetchInterval: 10000, // 每 10 秒刷新一次
		refetchIntervalInBackground: true, // 后台也继续刷新
		retry: 2,
		staleTime: 5000, // 5 秒内的数据被认为是新鲜的
	});

	// 领取奖励
	const handleClaim = async () => {
		if (!wallet || !isConnected || isClaimLoading) return;

		try {
			setIsClaimLoading(true);
			// 这里可以添加 claim 逻辑
			toast.success('领取功能待实现');
		} catch (error) {
			console.error('领取失败:', error);
			toast.error(`领取失败: ${error}`);
		} finally {
			setIsClaimLoading(false);
		}
	};

	return (
		<>
			<div className="text-[20px] text-[#fff] font-semibold flex items-center justify-between mb-[16px]">
				Rewards
			</div>
			<div className="border-dashed border-[1px] border-[#25262A] p-[12px] pb-[16px] rounded-[8px]">
				<div className="flex items-center text-[13px]">
					<div className="text-[#868789]">BNB</div>
					<div className="ml-[4px]">
						<Popover placement="top" showArrow={true}>
							<PopoverTrigger>
								<div><InfoIcon className="cursor-pointer" /></div>
							</PopoverTrigger>
							<PopoverContent>
								<div className="max-w-[270px] text-[12px] text-[#E6E6E6]">test test</div>
							</PopoverContent>
						</Popover>
					</div>
					<div className="flex-1"></div>
					<BNBIcon className="w-[16px] h-[16px]" />
					<div className="#fff ml-[4px]">
						{isLoading ? "..." : (rewardsData?.ethAmount || "0")}
					</div>
				</div>
				<div className="flex items-center text-[13px] my-[8px]">
					<div className="text-[#868789]">Unrefined ORI</div>
					<div className="ml-[4px]">
						<Popover placement="top" showArrow={true}>
							<PopoverTrigger>
								<div><InfoIcon className="cursor-pointer" /></div>
							</PopoverTrigger>
							<PopoverContent>
								<div className="max-w-[270px] text-[12px] text-[#E6E6E6]">Direct ORI rewards</div>
							</PopoverContent>
						</Popover>
					</div>
					<div className="flex-1"></div>
					<LogoIcon className="w-[16px] h-[16px]" />
					<div className="#fff ml-[4px]">
						{isLoading ? "..." : (rewardsData?.oriDirect || "0")}
					</div>
				</div>
				<div className="flex items-center text-[13px]">
					<div className="text-[#868789]">Refined ORI</div>
					<div className="ml-[4px]">
						<Popover placement="top" showArrow={true}>
							<PopoverTrigger>
								<div><InfoIcon className="cursor-pointer" /></div>
							</PopoverTrigger>
							<PopoverContent>
								<div className="max-w-[270px] text-[12px] text-[#E6E6E6]">Refined ORI rewards</div>
							</PopoverContent>
						</Popover>
					</div>
					<div className="flex-1"></div>
					<LogoIcon className="w-[16px] h-[16px]" />
					<div className="#fff ml-[4px]">
						{isLoading ? "..." : (rewardsData?.oriRefined || "0")}
					</div>
				</div>
				<Button
					fullWidth
					variant="bordered"
					className="h-[44px] border-[#EFC462] text-[15px] text-[#EFC462] mt-[15px]"
					radius="full"
					onPress={handleClaim}
					isLoading={isClaimLoading}
				>
					Claim
				</Button>
				<div className="text-[14px] text-[#868789] text-center mt-[16px] cursor-pointer">Claim only BNB</div>
			</div>
		</>
	)
}