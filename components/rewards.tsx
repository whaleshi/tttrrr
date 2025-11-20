import React, { useState } from "react";
import { LogoIcon, BNBIcon, InfoIcon } from "@/components/icons";
import { Button, Divider, Popover, PopoverContent, PopoverTrigger, Progress, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/react";

// 自定义关闭图标组件
const CloseIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		className={className}
		{...props}
	>
		<path
			d="M18.0137 6.70023C18.2089 6.8955 18.2089 7.21208 18.0137 7.40734L13.7677 11.6534C13.5724 11.8486 13.5724 12.1652 13.7677 12.3605L18.0068 16.5996C18.2021 16.7949 18.2021 17.1115 18.0068 17.3068L17.2999 18.0137C17.1046 18.209 16.788 18.209 16.5928 18.0137L12.3536 13.7745C12.1583 13.5793 11.8418 13.5793 11.6465 13.7745L7.40731 18.0137C7.21205 18.209 6.89547 18.209 6.7002 18.0137L5.99325 17.3068C5.79799 17.1115 5.79799 16.7949 5.99325 16.5996L10.2324 12.3605C10.4277 12.1652 10.4277 11.8486 10.2324 11.6534L5.98641 7.40734C5.79115 7.21208 5.79115 6.8955 5.98641 6.70023L6.69337 5.99328C6.88863 5.79802 7.20521 5.79802 7.40047 5.99328L11.6465 10.2393C11.8418 10.4346 12.1583 10.4346 12.3536 10.2393L16.5996 5.99328C16.7949 5.79802 17.1115 5.79802 17.3067 5.99328L18.0137 6.70023Z"
			fill="#4A4B4E"
		/>
	</svg>
);

// 可复用的奖励行组件
interface RewardItemProps {
	label: string;
	value: string;
	icon: React.ReactNode;
	infoText: string;
	isLoading?: boolean;
	className?: string;
}

const RewardItem = ({ label, value, icon, infoText, isLoading = false, className = "" }: RewardItemProps) => (
	<div className={`flex items-center text-[13px] ${className}`}>
		<div className="text-[#868789]">{label}</div>
		<div className="ml-[4px]">
			<Popover placement="top" showArrow={true}>
				<PopoverTrigger>
					<div><InfoIcon className="cursor-pointer" /></div>
				</PopoverTrigger>
				<PopoverContent>
					<div className="max-w-[270px] text-[12px] text-[#E6E6E6]">{infoText}</div>
				</PopoverContent>
			</Popover>
		</div>
		<div className="flex-1"></div>
		{icon}
		<div className="#fff ml-[4px]">
			{isLoading ? "..." : value}
		</div>
	</div>
);
import { ethers } from "ethers";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useAuthStore } from "@/stores/auth";
import OreProtocolABI from "@/constant/OreProtocol.json";
import { CONTRACT_CONFIG } from "@/config/chains";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

export default function Rewards() {
	const [isClaimLoading, setIsClaimLoading] = useState(false);
	const { isOpen, onOpen, onOpenChange } = useDisclosure();

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

	// 打开确认弹窗
	const handleClaimClick = () => {
		if (!wallet || !isConnected || isClaimLoading) return;
		onOpen();
	};

	// 确认领取奖励
	const handleConfirmClaim = async () => {
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

	// 检查是否所有奖励值都大于0
	const hasRewards = rewardsData && 
		parseFloat(rewardsData.ethAmount || '0') > 0 &&
		parseFloat(rewardsData.oriDirect || '0') > 0 &&
		parseFloat(rewardsData.oriRefined || '0') > 0;

	// 如果没有奖励或正在加载，返回空
	if (isLoading || !hasRewards) {
		return null;
	}

	return (
		<>
			<div className="text-[20px] text-[#fff] font-semibold flex items-center justify-between mb-[16px]">
				Rewards
			</div>
			<div className="border-dashed border-[1px] border-[#25262A] p-[12px] pb-[16px] rounded-[8px]">
				{parseFloat(rewardsData?.ethAmount || '0') > 0 && (
					<RewardItem
						label="BNB"
						value={rewardsData?.ethAmount || "0"}
						icon={<BNBIcon className="w-[16px] h-[16px]" />}
						infoText="test test"
						isLoading={isLoading}
					/>
				)}
				{parseFloat(rewardsData?.oriDirect || '0') > 0 && (
					<RewardItem
						label="Unrefined ORI"
						value={rewardsData?.oriDirect || "0"}
						icon={<LogoIcon className="w-[16px] h-[16px]" />}
						infoText="Direct ORI rewards"
						isLoading={isLoading}
						className="my-[8px]"
					/>
				)}
				{parseFloat(rewardsData?.oriRefined || '0') > 0 && (
					<RewardItem
						label="Refined ORI"
						value={rewardsData?.oriRefined || "0"}
						icon={<LogoIcon className="w-[16px] h-[16px]" />}
						infoText="Refined ORI rewards"
						isLoading={isLoading}
					/>
				)}
				<Button
					fullWidth
					variant="bordered"
					className="h-[44px] border-[#EFC462] text-[15px] text-[#EFC462] mt-[15px]"
					radius="full"
					onPress={handleClaimClick}
					isLoading={isClaimLoading}
				>
					Claim
				</Button>
				<div className="text-[14px] text-[#868789] text-center mt-[16px] cursor-pointer">Claim only BNB</div>
			</div>

			{/* Claim Rewards 确认弹窗 */}
			<Modal
				isOpen={isOpen}
				onOpenChange={onOpenChange}
				classNames={{
					base: "bg-[#191B1F] border border-[#25262A]",
					body: "p-4",
					header: "border-b-0 pb-0 p-0",
				}}
				backdrop="blur"
				size="md"
				hideCloseButton
			>
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className="relative flex justify-center items-center pt-[16px] pb-4">
								<h2 className="text-white text-[17px] font-semibold">Claim Rewards</h2>
								<button
									onClick={onClose}
									className="absolute right-[12px] top-[12px] p-2 hover:bg-[#25262A] rounded-lg transition-colors cursor-pointer"
								>
									<CloseIcon className="w-6 h-6" />
								</button>
							</ModalHeader>
							<ModalBody className="pt-0">
								<p className="text-white text-[14px] mb-4">
									Are you sure you want to claim all your mining rewards, including refined and unrefined ORI?
								</p>
								<div className="space-y-[12px] border-[1px] border-dashed border-[#303135] p-[12px] rounded-[8px]">
									{parseFloat(rewardsData?.ethAmount || '0') > 0 && (
										<RewardItem
											label="BNB"
											value={rewardsData?.ethAmount || "0"}
											icon={<BNBIcon className="w-[16px] h-[16px]" />}
											infoText="test test"
											isLoading={isLoading}
										/>
									)}
									{parseFloat(rewardsData?.oriDirect || '0') > 0 && (
										<RewardItem
											label="Unrefined ORI"
											value={rewardsData?.oriDirect || "0"}
											icon={<LogoIcon className="w-[16px] h-[16px]" />}
											infoText="Direct ORI rewards"
											isLoading={isLoading}
										/>
									)}
									{parseFloat(rewardsData?.oriRefined || '0') > 0 && (
										<RewardItem
											label="Refined ORI"
											value={rewardsData?.oriRefined || "0"}
											icon={<LogoIcon className="w-[16px] h-[16px]" />}
											infoText="Refined ORI rewards"
											isLoading={isLoading}
										/>
									)}
								</div>
								<Button
									fullWidth
									className="h-[44px] text-[15px] text-[#0D0F13] bg-[#fff] rounded-[22px] mt-6"
									onPress={() => {
										handleConfirmClaim();
										onClose();
									}}
									isLoading={isClaimLoading}
								>
									Confirm
								</Button>
							</ModalBody>
						</>
					)}
				</ModalContent>
			</Modal>
		</>
	)
}