import { BianIcon, PointsIcon, InfoIcon, PointsIcons } from "@/components/icons";
import DefaultLayout from "@/layouts/default";
import { useQuery } from '@tanstack/react-query';
import { getOriginInfo } from '@/service/api';
import _bignumber from 'bignumber.js';
import { ethers } from 'ethers';
import { useAuthStore } from '@/stores/auth';
import { useTranslation, Trans } from "react-i18next";
import { usePrivy, useWallets } from "@privy-io/react-auth";
const BigNumber = _bignumber;
import { PointsRecords } from "@/components/PointsRecords";
import { PointsRecords2 } from "@/components/PointsRecords2";
import { CONTRACT_CONFIG } from "@/config/chains";
import AssetManagerABI from "@/constant/AssetManager.json";
import { customToast, customToastPersistent, dismissToast } from "@/components/customToast";
import { useState } from 'react';
import { Button, Popover, PopoverTrigger, PopoverContent } from "@heroui/react";

export default function PointsPage() {
	const { t } = useTranslation();
	const { ready } = usePrivy();
	const { wallets } = useWallets();
	const { address, isLoggedIn } = useAuthStore();
	const [isClaiming, setIsClaiming] = useState(false);

	const isConnected = ready && isLoggedIn && !!address;
	const wallet = address ? wallets.find((w) => w.address?.toLowerCase() === address.toLowerCase()) : null;

	const { data: originInfoData, refetch: refetchOriginData } = useQuery({
		queryKey: ['originInfo', address],
		queryFn: async () => {
			const result = await getOriginInfo({
				user_addr: address,
			});
			return result?.data;
		},
		refetchInterval: 5000,
		refetchIntervalInBackground: true,
		staleTime: 3000, // 5秒内不会重新请求
	});

	// Claim functionality
	const handleClaim = async () => {
		if (!wallet || !isConnected) {
			return;
		}

		// Check if user has claimable amount
		const userAmount = originInfoData?.user?.amount;
		if (!userAmount || BigNumber(ethers.formatUnits(BigInt(userAmount), 8)).lte(0)) {
			return;
		}

		setIsClaiming(true);
		let loadingToastId: any = null;

		try {
			const ethereumProvider = await wallet.getEthereumProvider();
			const provider = new ethers.BrowserProvider(ethereumProvider);
			const signer = await provider.getSigner();

			loadingToastId = customToastPersistent({
				title: t('Common.waitingForSignature'),
				type: 'loading'
			});

			// Create contract instance
			const assetManagerContract = new ethers.Contract(
				CONTRACT_CONFIG.CLAIM_CONTRACT,
				AssetManagerABI.abi,
				signer
			);

			// Generate order_id (you might want to get this from API or generate uniquely)
			const orderId = Date.now().toString();
			const amount = ethers.parseUnits((originInfoData?.ori_config?.limit_amount || 0).toString(), 10).toString();
			// Prepare transaction parameters
			const txParams = [
				orderId, // order_id
				'claim', // command
				'', // extra_info
				ethers.ZeroAddress, // token address
				amount
			];
			console.log('Transaction parameters:', txParams);
			// Estimate gas first
			const gasEstimate = await assetManagerContract.deposit.estimateGas(...txParams, { value: amount });
			console.log('Estimated gas:', gasEstimate.toString());

			// Add 20% buffer to gas estimate
			const gasLimit = gasEstimate * BigInt(120) / BigInt(100);

			// Call the deposit function for claim
			const claimTx = await assetManagerContract.deposit(...txParams, {
				value: amount,
				gasLimit: gasLimit
			});

			// Close loading toast
			if (loadingToastId) {
				dismissToast(loadingToastId);
			}

			customToast({
				title: t('Common.transactionConfirmed'),
				description: <span onClick={() => window.open(`https://bscscan.com/tx/${claimTx.hash}`, '_blank')} className="cursor-pointer hover:underline">{t('Common.viewOnBscscan')}</span>,
				type: 'success'
			});

			// Wait for transaction confirmation
			try {
				const receipt = await claimTx.wait();
				console.log('Claim transaction confirmed:', receipt);
				// Refetch data after confirmation
				refetchOriginData();
			} catch (waitError) {
				console.error('Claim transaction confirmation failed:', waitError);
				// Still refetch data even if wait fails, the transaction might have been successful
				refetchOriginData();
			}

		} catch (error) {
			if (loadingToastId) {
				dismissToast(loadingToastId);
			}

			customToast({
				title: t('Common.transactionFailed'),
				description: <span onClick={() => handleClaim()} className="cursor-pointer hover:underline">{t('Common.pleaseTryAgain')}</span>,
				type: 'error'
			});
		} finally {
			setIsClaiming(false);
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
				<div className="text-[28px] font-bold text-[#fff] w-full pt-[24px]">{t('Points.originPool')}</div>
				<div className="text-[14px] text-[#868789] w-full mt-[2px] mb-[24px]">
					<Trans
						i18nKey="Points.originPoolDescription"
						values={{
							rewardAmount: originInfoData?.ori_config?.mining ?
								BigNumber(ethers.formatUnits(BigInt(originInfoData.ori_config.mining), 8)).dp(6, BigNumber.ROUND_DOWN).toString() : '200',
							motherLodeAmount: originInfoData?.ori_config?.motherlodes ?
								BigNumber(ethers.formatUnits(BigInt(originInfoData.ori_config.motherlodes), 8)).dp(6, BigNumber.ROUND_DOWN).toString() : '40'
						}}
						components={[
							<span className="text-[#EFC462]"></span>,
							<br />,
							<span className="text-[#fff]"></span>,
							<span className="text-[#EFC462]"></span>,
							<br />,
							<span className="text-[#fff]"></span>,
							<span className="text-[#EFC462]"></span>
						]}
					/>
				</div>
				<div className="w-full border-[1px] border-[#25262A] rounded-[8px] h-[48px] mb-[8px] flex items-center px-[16px]">
					<div className="flex items-center w-full">
						<PointsIcon className="w-[24px] h-[24px]" />
						<div className="flex items-center flex-1">
							<div className="text-[16px] text-[#fff] mx-[4px]">{t('Points.origin')}</div>
							<div className="text-[12px] text-[#4A4B4E]">${originInfoData?.chain_asset_config?.price ? BigNumber(originInfoData?.chain_asset_config?.price).dp(2).toString() : '0.00'}</div>
						</div>
						<BianIcon className="cursor-pointer" onClick={() => { window.open(`https://web3.binance.com/token/bsc/${originInfoData?.ori_config?.mint_address}`, '_blank'); }} />
					</div>
				</div>
				<div className="w-full grid grid-cols-2 gap-2 mb-[32px]">
					<div className="bg-[#191B1F] border-[1px] border-[#25262A] rounded-[8px] backdrop-blur-[8px] h-[60px] flex flex-col items-center justify-center">
						<div className="flex items-center gap-[4px] font-semibold">
							<PointsIcon className="w-[16px] h-[16px]" />
							<div className="text-[16px] text-[#fff]">{originInfoData?.global?.total_amount ? (() => {
								const formatted = BigNumber(ethers.formatUnits(BigInt(originInfoData.global.total_amount), 8)).dp(6, BigNumber.ROUND_DOWN);
								if (formatted.gte(1)) {
									const num = formatted.toNumber();
									return num % 1 === 0 ? num.toLocaleString() : num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
								}
								return formatted.toString();
							})() : '0'}</div>
						</div>
						<div className="text-[#868789] text-[12px]">{t('Points.totalDistributed')}</div>
					</div>
					<div className="bg-[#191B1F] border-[1px] border-[#25262A] rounded-[8px] backdrop-blur-[8px] h-[60px] flex flex-col items-center justify-center">
						<div className="flex items-center gap-[4px] font-semibold">
							<PointsIcon className="w-[16px] h-[16px]" />
							<div className="text-[16px] text-[#fff]">{originInfoData?.global?.current_mother_reward ? (() => {
								const formatted = BigNumber(ethers.formatUnits(BigInt(originInfoData.global.current_mother_reward), 8)).dp(6, BigNumber.ROUND_DOWN);
								if (formatted.gte(1)) {
									const num = formatted.toNumber();
									return num % 1 === 0 ? num.toLocaleString() : num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
								}
								return formatted.toString();
							})() : '0'}</div>
						</div>
						<div className="text-[#868789] text-[12px]">{t('Points.currentMotherLodePool')}</div>
					</div>
				</div>
				<div className="text-[20px] text-[#fff] w-full mb-[12px]">{t('Points.myRewards')}</div>
				{/* My Points Card */}
				<div className="w-full border-[1px] border-[#25262A] rounded-[8px] py-[16px] px-[12px] mb-[12px]">
					<div className="flex items-center justify-between mb-[12px]">
						<div className="flex items-center gap-[8px]">
							<span className="text-[13px] text-[#868789]">{t('Points.unrefinedOri')}</span>
							<Popover placement="top" showArrow={true}>
								<PopoverTrigger>
									<div><InfoIcon className="cursor-pointer w-[12px] h-[12px]" /></div>
								</PopoverTrigger>
								<PopoverContent>
									<div className="max-w-[270px] text-[12px] text-[#E6E6E6]">
										{t('Points.unrefinedOriDesc')}
									</div>
								</PopoverContent>
							</Popover>
						</div>
						<div className="text-[13px] font-bold text-[#fff] flex items-center gap-[4px]">
							<PointsIcons className="w-[16px] h-[16px]" />
							{originInfoData?.user?.amount ? (() => {
								const formatted = BigNumber(ethers.formatUnits(BigInt(originInfoData.user.amount), 8)).dp(6, BigNumber.ROUND_DOWN);
								if (formatted.gte(1)) {
									const num = formatted.toNumber();
									return num % 1 === 0 ? num.toLocaleString() : num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
								}
								return formatted.toString();
							})() : '0'}
						</div>
					</div>

					<div className="flex items-center justify-between mb-[16px]">
						<div className="flex items-center gap-[8px]">
							<span className="text-[13px] text-[#868789]">{t('Points.refinedOri')}</span>
							<Popover placement="top" showArrow={true}>
								<PopoverTrigger>
									<div><InfoIcon className="cursor-pointer w-[12px] h-[12px]" /></div>
								</PopoverTrigger>
								<PopoverContent>
									<div className="max-w-[270px] text-[12px] text-[#E6E6E6]">
										{t('Points.refinedOriDesc')}
									</div>
								</PopoverContent>
							</Popover>
						</div>
						<div className="text-[13px] font-bold text-[#fff] flex items-center gap-[4px]">
							<PointsIcon className="w-[16px] h-[16px]" />
							{originInfoData?.user?.native_amount ? (() => {
								const formatted = BigNumber(ethers.formatUnits(BigInt(originInfoData.user.native_amount), 8)).dp(6, BigNumber.ROUND_DOWN);
								if (formatted.gte(1)) {
									const num = formatted.toNumber();
									return num % 1 === 0 ? num.toLocaleString() : num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
								}
								return formatted.toString();
							})() : '0'}
						</div>
					</div>

					{/* Claim Button */}
					<Button
						className={`w-full h-[44px] rounded-[22px] text-[16px] font-medium ${originInfoData?.user?.amount && BigNumber(ethers.formatUnits(BigInt(originInfoData.user.amount), 8)).gt(0)
							? 'bg-transparent border-[1px] border-[#EFC462] text-[#EFC462]'
							: 'bg-[transparent] border-[1px] border-[#36383B] text-[#868789] cursor-not-allowed'
							}`}
						isDisabled={!originInfoData?.user?.amount || BigNumber(ethers.formatUnits(BigInt(originInfoData.user.amount), 8)).lte(0) || isClaiming}
						isLoading={isClaiming}
						onPress={handleClaim}
					>
						{t('Points.claim')}
					</Button>
				</div>
				<div className="w-full text-[12px] text-[#868789] mb-[24px]">{t('Points.totalClaimed')}：<span className="text-[#fff]">{originInfoData?.user?.accumulated_amount ? (() => {
					const formatted = BigNumber(ethers.formatUnits(BigInt(originInfoData.user.accumulated_amount), 8)).dp(6, BigNumber.ROUND_DOWN);
					if (formatted.gte(1)) {
						const num = formatted.toNumber();
						return num % 1 === 0 ? num.toLocaleString() : num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
					}
					return formatted.toString();
				})() : '0'} {t('Points.origin')}</span></div>

				{/* Records Section */}
				<PointsRecords />

				{/* Second Records Section */}
				<div className="my-[32px] w-full">
					<PointsRecords2 />
				</div>
			</section>
		</DefaultLayout>
	);
}