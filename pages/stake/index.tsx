import { InfoIcon } from "@/components/icons";
import DefaultLayout from "@/layouts/default";
import { Button, Input, Popover, PopoverTrigger, PopoverContent } from "@heroui/react";
import { useState } from "react";
import { useReadContracts } from 'wagmi';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useAuthStore } from "@/stores/auth";
import { DEFAULT_CHAIN_CONFIG, CONTRACT_CONFIG } from "@/config/chains";
import { ethers } from "ethers";
import _bignumber from "bignumber.js";
import OreProtocolABI from "@/constant/OreProtocol.json";
import ReadOreProtocolABI from "@/constant/OreProtocolView.json";
import OreTokenABI from "@/constant/OreToken.json";
import { customToast, customToastPersistent, dismissToast } from "@/components/customToast";
import { useTranslation } from "react-i18next";
import usePrivyLogin from "@/hooks/usePrivyLogin";
const BigNumber = _bignumber;
import { getSummary } from "@/service/api";
import { Image } from "@heroui/react";


export default function StakePage() {
	const { t } = useTranslation();
	const { toLogin } = usePrivyLogin();
	const [selectedTab, setSelectedTab] = useState('deposit');
	const [inputAmount, setInputAmount] = useState('');
	const [isStaking, setIsStaking] = useState(false);

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
				abi: OreTokenABI.abi,
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

	// 单独获取 Treasury State (不需要地址)
	const { data: treasuryData } = useReadContracts({
		contracts: [
			{
				address: CONTRACT_CONFIG.READ_ORE_CONTRACT as `0x${string}`,
				abi: ReadOreProtocolABI.abi,
				functionName: 'getTreasuryState',
			},
		],
		query: {
			enabled: !!CONTRACT_CONFIG.READ_ORE_CONTRACT,
			refetchInterval: 10000, // 每10秒刷新一次
		},
	});

	// 获取summary数据，进页面请求一次，失败重试2次
	const { data: summaryData } = useQuery({
		queryKey: ['summary'],
		queryFn: () => getSummary({}),
		retry: 2, // 失败重试2次
		refetchOnWindowFocus: false, // 避免窗口聚焦时重新请求
		refetchOnMount: true, // 组件挂载时请求
	});
	// 提取数据
	const oriBalance = contractData?.[0]?.status === 'success' ? contractData[0].result : null;
	const userRewards = contractData?.[1]?.status === 'success' ? contractData[1].result : null;
	const treasuryState = treasuryData?.[0]?.status === 'success' ? treasuryData[0].result : null;
	// 格式化ORI余额
	const formattedOriBalance = oriBalance
		? BigNumber(ethers.formatUnits(BigInt(oriBalance.toString()), 18)).dp(8).toString()
		: '0';

	// 格式化质押数据
	const formattedStakeInfo = userRewards && Array.isArray(userRewards) ? {
		stakedAmount: BigNumber(ethers.formatUnits(BigInt((userRewards as any[])[0]?.toString() || '0'), 18)).dp(8).toString(),
		pendingRewards: BigNumber(ethers.formatUnits(BigInt((userRewards as any[])[1]?.toString() || '0'), 18)).dp(8).toString(),
		rewardDebt: BigNumber(ethers.formatUnits(BigInt((userRewards as any[])[2]?.toString() || '0'), 18)).dp(8).toString(),
		updatedAt: (userRewards as any[])[3]?.toString() || '0'
	} : { stakedAmount: '0', pendingRewards: '0', rewardDebt: '0', updatedAt: '0' };

	// 格式化Treasury数据
	const formattedTreasuryData = treasuryState && Array.isArray(treasuryState) ? {
		totalStaked: BigNumber(ethers.formatUnits(BigInt((treasuryState as any[])[0]?.toString() || '0'), 18)).dp(8).toString(),
		accRewardPerShare: BigNumber(ethers.formatUnits(BigInt((treasuryState as any[])[1]?.toString() || '0'), 18)).dp(8).toString(),
	} : { totalStaked: '0', accRewardPerShare: '0' };

	const percentageButtons = [
		{ label: "25%", value: 25 },
		{ label: "50%", value: 50 },
		{ label: "100%", value: 100 }
	];

	const handlePercentageClick = (percentage: number) => {
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
		setInputAmount('');
	};

	// 质押函数
	const handleStake = async () => {
		if (!wallet || !isConnected) {
			return;
		}
		if (!inputAmount || parseFloat(inputAmount) <= 0) {
			customToast({
				title: t('Home.insufficientBalance'),
				type: 'error'
			});
			return;
		}

		// 检查ORI余额是否足够
		if (!oriBalance) {
			customToast({
				title: t('Home.insufficientBalance'),
				type: 'error'
			});
			return;
		}

		const stakeAmount = ethers.parseUnits(inputAmount, 18);
		if (BigInt(oriBalance.toString()) < BigInt(stakeAmount.toString())) {
			customToast({
				title: t('Home.insufficientBalance'),
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

			// 1. 检查当前授权额度
			const oriToken = new ethers.Contract(
				DEFAULT_CHAIN_CONFIG.ori,
				OreTokenABI.abi,
				signer
			);

			const currentAllowance = await oriToken.allowance(address, CONTRACT_CONFIG.ORE_CONTRACT);

			// 2. 如果授权额度不足，先进行授权
			if (BigInt(currentAllowance.toString()) < BigInt(stakeAmount.toString())) {
				loadingToastId = customToastPersistent({
					title: t('Common.waitingForSignature'),
					type: 'loading'
				});

				const approveTx = await oriToken.approve(CONTRACT_CONFIG.ORE_CONTRACT, stakeAmount);
				await approveTx.wait();

				// 更新loading提示
				dismissToast(loadingToastId);
			}

			// 3. 进行质押操作
			if (loadingToastId) {
				dismissToast(loadingToastId);
			}
			loadingToastId = customToastPersistent({
				title: t('Common.waitingForSignature'),
				type: 'loading'
			});

			// 4. 存入质押
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
				title: t('Common.transactionConfirmed'),
				description: <span onClick={() => window.open(`https://bscscan.com/tx/${stakeTx.hash}`, '_blank')} className="cursor-pointer hover:underline">View on Bscscan {">"}</span>,
				type: 'success'
			});

			// 立即刷新合约数据
			refetchContractData();

			// 清空输入
			setInputAmount('');

		} catch (error) {
			console.error('质押失败:', error);

			if (loadingToastId) {
				dismissToast(loadingToastId);
			}

			customToast({
				title: t('Common.transactionFailed'),
				description: <span onClick={() => handleStake()} className="cursor-pointer hover:underline">{t('Common.pleaseTryAgain')}</span>,
				type: 'error'
			});
		} finally {
			setIsStaking(false);
		}
	};

	// 提取质押函数
	const handleWithdraw = async () => {
		if (!wallet || !isConnected) {
			return;
		}
		if (!inputAmount || parseFloat(inputAmount) <= 0) {
			customToast({
				title: t('Home.insufficientBalance'),
				type: 'error'
			});
			return;
		}

		// 检查质押余额是否足够
		const withdrawAmount = ethers.parseUnits(inputAmount, 18);
		if (!userRewards || !Array.isArray(userRewards)) {
			customToast({
				title: t('Home.insufficientBalance'),
				type: 'error'
			});
			return;
		}

		const stakedAmountRaw = (userRewards as any[])[0]?.toString() || '0';
		if (BigInt(stakedAmountRaw) < BigInt(withdrawAmount.toString())) {
			customToast({
				title: t('Home.insufficientBalance'),
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

			loadingToastId = customToastPersistent({
				title: t('Common.waitingForSignature'),
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
				title: t('Common.transactionConfirmed'),
				description: <span onClick={() => window.open(`https://bscscan.com/tx/${withdrawTx.hash}`, '_blank')} className="cursor-pointer hover:underline">View on Bscscan {">"}</span>,
				type: 'success'
			});

			// 立即刷新合约数据
			refetchContractData();

			// 清空输入
			setInputAmount('');

		} catch (error) {

			if (loadingToastId) {
				dismissToast(loadingToastId);
			}

			customToast({
				title: t('Common.transactionFailed'),
				description: <span onClick={() => handleWithdraw()} className="cursor-pointer hover:underline">{t('Common.pleaseTryAgain')}</span>,
				type: 'error'
			});
		} finally {
			setIsStaking(false);
		}
	};

	if (!ready) {
		return <div className="flex items-center justify-center h-screen w-screen bg-[#0D0F13]">
			<img src="/images/loading.gif" alt="Loading" className="w-[60px] h-[60px]" />
		</div>;
	}

	return (
		<DefaultLayout>
			<section className="flex flex-col items-center justify-center w-full px-[14px] max-w-[600px] mx-auto">
				<div className="text-[28px] font-bold text-[#fff] w-full pt-[24px]">{t('Stake.title')}</div>
				<div className="text-[14px] text-[#868789] w-full mt-[2px] mb-[24px]">{t('Stake.subtitle')}</div>

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
							{t('Stake.deposit')}
						</div>
						<div
							className={`flex-1 rounded-[8px] text-[13px] flex items-center justify-center cursor-pointer transition-all duration-200 ${selectedTab === 'withdraw'
								? 'bg-[#303135] text-[#fff]'
								: 'bg-[#25262A] text-[#868789] hover:bg-[#303135]'
								}`}
							onClick={() => handleTabClick('withdraw')}
						>
							{t('Stake.withdraw')}
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
							// 只允许数字和小数点，最大8位小数
							if (value === '' || /^\d*\.?\d{0,8}$/.test(value)) {
								// 确保不以小数点开头，如果是则添加0
								const formattedValue = value.startsWith('.') ? '0' + value : value;
								setInputAmount(formattedValue);
							}
						}}
						startContent={<div className="shrink-0 flex items-center gap-[4px] pl-[4px]">
							<Image src="/images/logo.png" alt="logo" className="w-[20px] h-[20px] shrink-0" disableSkeleton disableAnimation radius="none" />
							<div className="text-[16px] text-[#fff]">ORI</div>
						</div>}
					/>

					{/* Balance and Percentage Buttons */}
					<div className="flex items-center justify-between mb-[16px] mt-[12px]">
						<div className="text-[12px] text-[#868789]">
							<span className="text-[#868789]">
								{t('Stake.balance')}:
							</span> {
								isLoadingData
									? '0'
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
					{!isConnected ? (
						<Button
							fullWidth
							className="h-[44px] text-[15px] text-[#0D0F13] bg-[#fff] rounded-[22px] font-medium"
							onPress={toLogin}
						>
							{t('Header.connectWallet')}
						</Button>
					) : (
						<Button
							fullWidth
							className="h-[44px] text-[15px] text-[#0D0F13] bg-[#fff] rounded-[22px] font-medium"
							onPress={selectedTab === 'deposit' ? handleStake : handleWithdraw}
							isLoading={isStaking}
							isDisabled={isStaking || !inputAmount || parseFloat(inputAmount) <= 0}
						>
							{selectedTab === 'deposit' ? t('Stake.deposit') : t('Stake.withdraw')}
						</Button>
					)}
				</div>

				{
					Number(formattedStakeInfo?.pendingRewards) > 0 && <div className="w-full mb-[32px]">
						<div className="text-[20px] font-bold text-[#fff] mb-[16px]">{t('Stake.account')}</div>
						<div className="bg-[#0D0F13] border-[2px] border-[#25262A] rounded-[8px] p-[12px]">
							<div className="flex items-center justify-between mb-[16px]">
								<div className="flex items-center gap-[8px] text-[13px] text-[#868789]">
									<span>{t('Stake.yield')}</span>
									<Popover placement="top" showArrow={true}>
										<PopoverTrigger>
											<div><InfoIcon className="w-[14px] h-[14px] cursor-pointer" /></div>
										</PopoverTrigger>
										<PopoverContent>
											<div className="max-w-[270px] text-[12px] text-[#E6E6E6]">{t('Stake.yieldDesc')}</div>
										</PopoverContent>
									</Popover>
								</div>
								<div className="flex items-center gap-[4px]">
									<Image src="/images/logo.png" alt="logo" className="w-[16px] h-[16px] shrink-0" disableSkeleton disableAnimation radius="none" />
									<span className="text-[14px] text-[#EFC462]">{formattedStakeInfo?.pendingRewards}</span>
								</div>
							</div>

							<Button
								fullWidth
								variant="bordered"
								className="h-[44px] border-[#EFC462] text-[15px] text-[#EFC462] rounded-[22px] font-medium"
							>
								{t('Stake.claim')}
							</Button>
						</div>
					</div>
				}

				{/* Summary Section */}
				<div className="w-full mb-[30px]">
					<div className="text-[20px] font-bold text-[#fff] mb-[16px]">{t('Stake.summary')}</div>
					<div className="space-y-[12px]">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-[8px] text-[13px] text-[#868789]">
								<span>{t('Stake.totalDeposit')}</span>
								<Popover placement="top" showArrow={true}>
									<PopoverTrigger>
										<div><InfoIcon className="w-[14px] h-[14px] cursor-pointer" /></div>
									</PopoverTrigger>
									<PopoverContent>
										<div className="max-w-[270px] text-[12px] text-[#E6E6E6]">{t('Stake.totalDepositDesc')}</div>
									</PopoverContent>
								</Popover>
							</div>
							<div className="flex items-center gap-[4px]">
								<Image src="/images/logo.png" alt="logo" className="w-[16px] h-[16px] shrink-0" disableSkeleton disableAnimation radius="none" />
								<span className="text-[14px] text-[#fff]">{formattedTreasuryData.totalStaked}</span>
							</div>
						</div>

						<div className="flex items-center justify-between">
							<div className="flex items-center gap-[8px] text-[13px] text-[#868789]">
								<span>{t('Stake.apr')}</span>
								<Popover placement="top" showArrow={true}>
									<PopoverTrigger>
										<div><InfoIcon className="w-[14px] h-[14px] cursor-pointer" /></div>
									</PopoverTrigger>
									<PopoverContent>
										<div className="max-w-[270px] text-[12px] text-[#E6E6E6]">{t('Stake.aprDesc')}</div>
									</PopoverContent>
								</Popover>
							</div>
							<span className="text-[14px] text-[#fff]">{summaryData?.data?.staking_annual_yield?.value || '0'}%</span>
						</div>

						<div className="flex items-center justify-between">
							<div className="flex items-center gap-[8px] text-[13px] text-[#868789]">
								<span>{t('Stake.tvl')}</span>
								<Popover placement="top" showArrow={true}>
									<PopoverTrigger>
										<div><InfoIcon className="w-[14px] h-[14px] cursor-pointer" /></div>
									</PopoverTrigger>
									<PopoverContent>
										<div className="max-w-[270px] text-[12px] text-[#E6E6E6]">{t('Stake.tvlDesc')}</div>
									</PopoverContent>
								</Popover>
							</div>
							<span className="text-[14px] text-[#fff]">$0</span>
						</div>
					</div>
				</div>
			</section>
		</DefaultLayout>
	);
}