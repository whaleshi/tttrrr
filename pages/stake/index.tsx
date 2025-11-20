import { LogoIcon, InfoIcon, BNBIcon } from "@/components/icons";
import DefaultLayout from "@/layouts/default";
import { Button, Input } from "@heroui/react";
import { useState } from "react";
import { useReadContracts } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useAuthStore } from "@/stores/auth";
import { DEFAULT_CHAIN_CONFIG, CONTRACT_CONFIG } from "@/config/chains";
import { ethers } from "ethers";
import _bignumber from "bignumber.js";
import OreProtocolABI from "@/constant/OreProtocol.json";
import ReadOreProtocolABI from "@/constant/OreProtocolView.json";
import { customToast, customToastPersistent, dismissToast } from "@/components/customToast";
const BigNumber = _bignumber;

// ERC20 ABI - balanceOf 和 approve 函数
const ERC20_ABI = [
	{
		"constant": true,
		"inputs": [{ "name": "_owner", "type": "address" }],
		"name": "balanceOf",
		"outputs": [{ "name": "balance", "type": "uint256" }],
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{ "name": "_spender", "type": "address" },
			{ "name": "_value", "type": "uint256" }
		],
		"name": "approve",
		"outputs": [{ "name": "", "type": "bool" }],
		"type": "function"
	}
] as const;

export default function StakePage() {
	const [selectedTab, setSelectedTab] = useState('deposit');
	const [selectedPercentage, setSelectedPercentage] = useState<number | null>(null);
	const [inputAmount, setInputAmount] = useState('');
	const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
	const [isStaking, setIsStaking] = useState(false);

	const queryClient = useQueryClient();
	const { ready } = usePrivy();
	const { wallets } = useWallets();
	const { isLoggedIn, address } = useAuthStore();
	const isConnected = ready && isLoggedIn && !!address;
	const wallet = address ? wallets.find((w) => w.address?.toLowerCase() === address.toLowerCase()) : null;

	// 同时获取ORI代币余额和用户奖励
	const { data: contractData, isLoading: isLoadingData, refetch: refetchContractData } = useReadContracts({
		contracts: [
			{
				address: DEFAULT_CHAIN_CONFIG.ori as `0x${string}`,
				abi: ERC20_ABI,
				functionName: 'balanceOf',
				args: [address as `0x${string}`],
			},
			{
				address: CONTRACT_CONFIG.READ_ORE_CONTRACT as `0x${string}`,
				abi: ReadOreProtocolABI.abi,
				functionName: 'getStakeInfo',
				args: [address as `0x${string}`],
			},
		],
		query: {
			enabled: !!address && !!DEFAULT_CHAIN_CONFIG.ori && !!CONTRACT_CONFIG.READ_ORE_CONTRACT,
			refetchInterval: 10000, // 每10秒刷新一次
		},
	});

	// 提取数据
	const oriBalance = contractData?.[0]?.status === 'success' ? contractData[0].result : null;
	const userRewards = contractData?.[1]?.status === 'success' ? contractData[1].result : null;
	console.log(userRewards)
	// 格式化ORI余额
	const formattedOriBalance = oriBalance
		? BigNumber(ethers.formatUnits(BigInt(oriBalance.toString()), 18)).dp(6).toString()
		: '0';

	// 格式化质押数据
	const formattedStakeInfo = userRewards && Array.isArray(userRewards) ? {
		stakedAmount: BigNumber(ethers.formatUnits(BigInt((userRewards as any[])[0]?.toString() || '0'), 18)).dp(6).toString(),
		pendingRewards: BigNumber(ethers.formatUnits(BigInt((userRewards as any[])[1]?.toString() || '0'), 18)).dp(6).toString(),
		rewardDebt: BigNumber(ethers.formatUnits(BigInt((userRewards as any[])[2]?.toString() || '0'), 18)).dp(6).toString(),
		updatedAt: (userRewards as any[])[3]?.toString() || '0'
	} : { stakedAmount: '0', pendingRewards: '0', rewardDebt: '0', updatedAt: '0' };
	console.log(formattedStakeInfo?.pendingRewards)
	const percentageButtons = [
		{ label: "25%", value: 25 },
		{ label: "50%", value: 50 },
		{ label: "100%", value: 100 }
	];

	const handlePercentageClick = (percentage: number) => {
		setSelectedPercentage(percentage);
		setSelectedAmount(percentage);
		
		if (selectedTab === 'deposit') {
			// Deposit模式：使用原始oriBalance进行精确计算
			if (oriBalance) {
				const calculatedAmount = BigNumber(ethers.formatUnits(BigInt(oriBalance.toString()), 18))
					.multipliedBy(percentage)
					.dividedBy(100)
					.dp(6)
					.toString();
				setInputAmount(calculatedAmount);
			}
		} else {
			// Withdraw模式：使用已质押金额进行计算
			if (userRewards && Array.isArray(userRewards)) {
				const stakedAmountRaw = (userRewards as any[])[0]?.toString() || '0';
				const calculatedAmount = BigNumber(ethers.formatUnits(BigInt(stakedAmountRaw), 18))
					.multipliedBy(percentage)
					.dividedBy(100)
					.dp(6)
					.toString();
				setInputAmount(calculatedAmount);
			}
		}
	};

	const handleTabClick = (tab: string) => {
		setSelectedTab(tab);
		setSelectedPercentage(null);
		setInputAmount('');
		setSelectedAmount(null);
	};

	// 质押函数
	const handleStake = async () => {
		if (!wallet || !isConnected || !inputAmount || parseFloat(inputAmount) <= 0) {
			customToast({
				title: '输入错误',
				description: '请先连接钱包并输入有效金额',
				type: 'error'
			});
			return;
		}

		setIsStaking(true);
		let loadingToastId: any = null;

		try {
			const ethereumProvider = await wallet.getEthereumProvider();
			const provider = new ethers.BrowserProvider(ethereumProvider);
			const signer = await provider.getSigner();

			// 质押金额（注意ORI是18位小数）
			const stakeAmount = ethers.parseUnits(inputAmount, 18);

			loadingToastId = customToastPersistent({
				title: 'Step 1: Approving ORI tokens...',
				type: 'loading'
			});

			// 1. 先授权 ORI 代币
			const oriToken = new ethers.Contract(
				DEFAULT_CHAIN_CONFIG.ori,
				ERC20_ABI,
				signer
			);

			const approveTx = await oriToken.approve(CONTRACT_CONFIG.ORE_CONTRACT, stakeAmount);
			await approveTx.wait();

			// 更新loading提示
			dismissToast(loadingToastId);
			loadingToastId = customToastPersistent({
				title: 'Step 2: Depositing stake...',
				type: 'loading'
			});

			// 2. 存入质押
			const oreProtocolContract = new ethers.Contract(
				CONTRACT_CONFIG.ORE_CONTRACT,
				OreProtocolABI.abi,
				signer
			);

			const stakeTx = await oreProtocolContract.depositStake(stakeAmount);
			await stakeTx.wait();

			// 关闭loading toast
			if (loadingToastId) {
				dismissToast(loadingToastId);
			}

			customToast({
				title: '质押成功！',
				description: <span onClick={() => window.open(`https://bscscan.com/tx/${stakeTx.hash}`, '_blank')} className="cursor-pointer hover:underline">View on Bscscan {">"}</span>,
				type: 'success'
			});

			// 立即刷新合约数据
			refetchContractData();

			// 清空输入
			setInputAmount('');
			setSelectedPercentage(null);

		} catch (error) {
			console.error('质押失败:', error);

			if (loadingToastId) {
				dismissToast(loadingToastId);
			}

			customToast({
				title: '质押失败',
				description: `错误详情: ${error}`,
				type: 'error'
			});
		} finally {
			setIsStaking(false);
		}
	};

	// 提取质押函数
	const handleWithdraw = async () => {
		if (!wallet || !isConnected || !inputAmount || parseFloat(inputAmount) <= 0) {
			customToast({
				title: '输入错误',
				description: '请先连接钱包并输入有效金额',
				type: 'error'
			});
			return;
		}

		setIsStaking(true);
		let loadingToastId: any = null;

		try {
			const ethereumProvider = await wallet.getEthereumProvider();
			const provider = new ethers.BrowserProvider(ethereumProvider);
			const signer = await provider.getSigner();

			// 提取金额（注意ORI是18位小数）
			const withdrawAmount = ethers.parseUnits(inputAmount, 18);

			loadingToastId = customToastPersistent({
				title: 'Withdrawing stake...',
				type: 'loading'
			});

			// 调用withdrawStake方法
			const oreProtocolContract = new ethers.Contract(
				CONTRACT_CONFIG.ORE_CONTRACT,
				OreProtocolABI.abi,
				signer
			);

			const withdrawTx = await oreProtocolContract.withdrawStake(withdrawAmount, address);
			await withdrawTx.wait();

			// 关闭loading toast
			if (loadingToastId) {
				dismissToast(loadingToastId);
			}

			customToast({
				title: '提取成功！',
				description: <span onClick={() => window.open(`https://bscscan.com/tx/${withdrawTx.hash}`, '_blank')} className="cursor-pointer hover:underline">View on Bscscan {">"}</span>,
				type: 'success'
			});

			// 立即刷新合约数据
			refetchContractData();

			// 清空输入
			setInputAmount('');
			setSelectedPercentage(null);

		} catch (error) {
			console.error('提取失败:', error);

			if (loadingToastId) {
				dismissToast(loadingToastId);
			}

			customToast({
				title: '提取失败',
				description: `错误详情: ${error}`,
				type: 'error'
			});
		} finally {
			setIsStaking(false);
		}
	};

	return (
		<DefaultLayout>
			<section className="flex flex-col items-center justify-center w-full px-[14px] max-w-[600px] mx-auto">
				<div className="text-[28px] font-bold text-[#fff] w-full pt-[24px]">Stake</div>
				<div className="text-[14px] text-[#868789] w-full mt-[2px] mb-[24px]">Earn a share of protocol revenue.</div>

				{/* Main Stake Card */}
				<div className="w-full bg-[#191B1F] rounded-[8px] p-[12px] mb-[32px]">
					{/* Tab Switcher */}
					<div className="h-[36px] bg-[#25262A] rounded-[8px] flex mb-[12px]">
						<div
							className={`flex-1 rounded-[8px] text-[13px] flex items-center justify-center cursor-pointer transition-all duration-200 ${selectedTab === 'deposit'
								? 'bg-[#303135] text-[#fff]'
								: 'bg-[#25262A] text-[#868789] hover:bg-[#303135]'
								}`}
							onClick={() => handleTabClick('deposit')}
						>
							Deposit
						</div>
						<div
							className={`flex-1 rounded-[8px] text-[13px] flex items-center justify-center cursor-pointer transition-all duration-200 ${selectedTab === 'withdraw'
								? 'bg-[#303135] text-[#fff]'
								: 'bg-[#25262A] text-[#868789] hover:bg-[#303135]'
								}`}
							onClick={() => handleTabClick('withdraw')}
						>
							Withdraw
						</div>
					</div>

					{/* Token Display */}
					<Input
						classNames={{
							inputWrapper: "h-[56px] !border-[#25262A] bg-[rgba(13,15,19,0.65)] !border-[1.5px] rounded-[8px] hover:!border-[#25262A] focus-within:!border-[#25262A]",
							input: "text-[22px] text-[#FFF] font-semibold placeholder:text-[#868789] uppercase tracking-[-0.07px] text-right",
						}}
						name="amount"
						placeholder="0"
						variant="bordered"
						value={inputAmount}
						isDisabled={false}
						onChange={(e) => {
							const value = e.target.value;
							// 只允许数字和小数点
							if (value === '' || /^\d*\.?\d*$/.test(value)) {
								// 确保不以小数点开头，如果是则添加0
								const formattedValue = value.startsWith('.') ? '0' + value : value;
								setInputAmount(formattedValue);
								setSelectedPercentage(null);
							}
						}}
						startContent={<div className="shrink-0 flex items-center gap-[4px] pl-[4px]">
							<LogoIcon className="w-[20px] h-[20px]" />
							<div className="text-[16px] text-[#fff]">ORI</div>
						</div>}
					/>

					{/* Balance and Percentage Buttons */}
					<div className="flex items-center justify-between mb-[16px] mt-[12px]">
						<div className="text-[12px] text-[#868789]">
							<span className="text-[#868789]">
								{selectedTab === 'deposit' ? 'Bal:' : 'Staked:'}
							</span> {
								isLoadingData 
									? 'Loading...' 
									: selectedTab === 'deposit' 
										? formattedOriBalance 
										: formattedStakeInfo.stakedAmount
							} ORI
						</div>
						<div className="flex gap-[8px]">
							{percentageButtons.map((btn) => (
								<div
									key={btn.label}
									className={`h-[24px] w-[52px] flex items-center justify-center text-[12px] rounded-[8px] cursor-pointer transition-colors bg-[#25262A] text-[#868789]`}
									onClick={() => handlePercentageClick(btn.value)}
								>
									{btn.label}
								</div>
							))}
						</div>
					</div>

					{/* Deposit Button */}
					<Button
						fullWidth
						className="h-[44px] text-[15px] text-[#0D0F13] bg-[#fff] rounded-[22px] font-medium"
						onPress={selectedTab === 'deposit' ? handleStake : handleWithdraw}
						isLoading={isStaking}
						isDisabled={isStaking || !inputAmount || parseFloat(inputAmount) <= 0 || !isConnected}
					>
						{selectedTab === 'deposit' ? 'Deposit' : 'Withdraw'}
					</Button>
				</div>

				{
					Number(formattedStakeInfo?.pendingRewards) > 0 && <div className="w-full mb-[32px]">
						<div className="text-[20px] font-bold text-[#fff] mb-[16px]">Account</div>
						<div className="bg-[#0D0F13] border-[2px] border-[#25262A] rounded-[8px] p-[12px]">
							<div className="flex items-center justify-between mb-[16px]">
								<div className="flex items-center gap-[8px] text-[13px] text-[#868789]">
									<span>Yield</span>
									<InfoIcon className="w-[14px] h-[14px] cursor-pointer" />
								</div>
								<div className="flex items-center gap-[4px]">
									<LogoIcon className="w-[16px] h-[16px]" />
									<span className="text-[14px] text-[#EFC462]">{formattedStakeInfo?.pendingRewards}</span>
								</div>
							</div>

							<Button
								fullWidth
								variant="bordered"
								className="h-[44px] border-[#EFC462] text-[15px] text-[#EFC462] rounded-[22px] font-medium"
							>
								Claim
							</Button>
						</div>
					</div>
				}

				{/* Summary Section */}
				<div className="w-full mb-[30px]">
					<div className="text-[20px] font-bold text-[#fff] mb-[16px]">Summary</div>
					<div className="space-y-[12px]">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-[8px] text-[13px] text-[#868789]">
								<span>Total deposite</span>
								<InfoIcon className="w-[14px] h-[14px] cursor-pointer" />
							</div>
							<div className="flex items-center gap-[4px]">
								<LogoIcon className="w-[16px] h-[16px]" />
								<span className="text-[14px] text-[#fff]">1,560,253</span>
							</div>
						</div>

						<div className="flex items-center justify-between">
							<div className="flex items-center gap-[8px] text-[13px] text-[#868789]">
								<span>APR</span>
								<InfoIcon className="w-[14px] h-[14px] cursor-pointer" />
							</div>
							<span className="text-[14px] text-[#fff]">12.56%</span>
						</div>

						<div className="flex items-center justify-between">
							<div className="flex items-center gap-[8px] text-[13px] text-[#868789]">
								<span>TVL</span>
								<InfoIcon className="w-[14px] h-[14px] cursor-pointer" />
							</div>
							<span className="text-[14px] text-[#fff]">$560,253.29</span>
						</div>
					</div>
				</div>
			</section>
		</DefaultLayout>
	);
}