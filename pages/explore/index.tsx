import { BNBIcon } from "@/components/icons";
import DefaultLayout from "@/layouts/default";
import { useQuery } from '@tanstack/react-query';
import { getExploreInfo } from '@/service/api';
import _bignumber from 'bignumber.js';
import { MiningTable } from '@/components/miningTable';
import { MotherlodesTable } from '@/components/motherlodesTable';
import { BuybacksTable } from '@/components/buybacksTable';
import { ethers } from 'ethers';
import { useTranslation } from "react-i18next";
import { usePrivy } from "@privy-io/react-auth";
import { useReadContracts } from "wagmi";
import { CONTRACT_CONFIG, DEFAULT_CHAIN_CONFIG } from "@/config/chains";
import ReadOreProtocolABI from "@/constant/OreProtocolView.json";
import OreTokenABI from "@/constant/OreToken.json";
import { Image } from "@heroui/react";
const BigNumber = _bignumber;

export default function ExplorePage() {
	const { t } = useTranslation();
	const { ready } = usePrivy();
	const { data: exploreInfoData } = useQuery({
		queryKey: ['exploreInfo'],
		queryFn: async () => {
			const result = await getExploreInfo({});
			return result?.data;
		},
		refetchInterval: 30000,
	});

	const { data: treasuryData } = useReadContracts({
		contracts: [
			{
				address: CONTRACT_CONFIG.READ_ORE_CONTRACT as `0x${string}`,
				abi: ReadOreProtocolABI.abi,
				functionName: 'getTreasuryState',
			},
			{
				address: DEFAULT_CHAIN_CONFIG.ori as `0x${string}`,
				abi: OreTokenABI.abi,
				functionName: 'totalSupply',
			},
		],
		query: {
			enabled: !!CONTRACT_CONFIG.READ_ORE_CONTRACT && !!DEFAULT_CHAIN_CONFIG.ori,
			refetchInterval: 10000, // 每10秒刷新一次
		},
	});

	// 提取数据
	const treasuryState = treasuryData?.[0]?.status === 'success' ? treasuryData[0].result : null;
	const totalSupply = treasuryData?.[1]?.status === 'success' ? treasuryData[1].result : null;

	// 格式化Treasury数据
	const formattedTreasuryData = treasuryState && Array.isArray(treasuryState) ? {
		totalStaked: BigNumber(ethers.formatUnits(BigInt((treasuryState as any[])[0]?.toString() || '0'), 18)).dp(2).toString(),
		stakeRewardsFactor: BigNumber(ethers.formatUnits(BigInt((treasuryState as any[])[1]?.toString() || '0'), 18)).dp(2).toString(),
		totalOreShares: BigNumber(ethers.formatUnits(BigInt((treasuryState as any[])[2]?.toString() || '0'), 18)).dp(2).toString(),
		minerRewardsFactor: BigNumber(ethers.formatUnits(BigInt((treasuryState as any[])[3]?.toString() || '0'), 18)).dp(2).toString(),
		vaultEth: BigNumber(ethers.formatUnits(BigInt((treasuryState as any[])[4]?.toString() || '0'), 18)).dp(2).toString(),
		motherlodeOre: BigNumber(ethers.formatUnits(BigInt((treasuryState as any[])[5]?.toString() || '0'), 18)).dp(2).toString(),
	} : { totalStaked: '0', stakeRewardsFactor: '0', totalOreShares: '0', minerRewardsFactor: '0', vaultEth: '0', motherlodeOre: '0' };

	// 格式化totalSupply
	const formattedTotalSupply = totalSupply
		? BigNumber(ethers.formatUnits(BigInt(totalSupply.toString()), 18)).dp(2).toString()
		: '0';
	if (!ready) {
		return <div className="flex items-center justify-center h-screen w-screen bg-[#0D0F13]">
			<img src="/images/loading.gif" alt="Loading" className="w-[60px] h-[60px]" />
		</div>;
	}

	return (
		<DefaultLayout>
			<section className="flex flex-col items-center justify-center w-full px-[14px] max-w-[1200px] mx-auto">
				<div className="text-[28px] font-bold text-[#fff] w-full pt-[24px]">{t('Explore.title')}</div>
				<div className="text-[14px] text-[#868789] w-full mt-[2px] mb-[24px]">{t('Explore.subtitle')}</div>

				{/* Stats Grid */}
				<div className="w-full grid grid-cols-2 lg:grid-cols-5 gap-2 mb-[32px]">
					{/* Max Supply */}
					<div className="bg-[#191B1F] border-[1px] border-[#25262A] rounded-[8px] backdrop-blur-[8px] h-[60px] flex flex-col items-center justify-center">
						<div className="flex items-center gap-[4px] font-semibold">
							<Image src="/images/logo.png" alt="logo" className="w-[16px] h-[16px] shrink-0" disableSkeleton disableAnimation radius="none" />
							<div className="text-[16px] text-[#fff]">{(Number(exploreInfoData?.max_supply?.value) || 0).toLocaleString()}</div>
						</div>
						<div className="text-[#868789] text-[12px]">{t('Explore.maxSupply')}</div>
					</div>

					{/* Circulating Supply */}
					<div className="bg-[#191B1F] border-[1px] border-[#25262A] rounded-[8px] backdrop-blur-[8px] h-[60px] flex flex-col items-center justify-center">
						<div className="flex items-center gap-[4px] font-semibold">
							<Image src="/images/logo.png" alt="logo" className="w-[16px] h-[16px] shrink-0" disableSkeleton disableAnimation radius="none" />
							<div className="text-[16px] text-[#fff]">{(Number(formattedTotalSupply) || 0).toLocaleString()}</div>
						</div>
						<div className="text-[#868789] text-[12px]">{t('Explore.circulatingSupply')}</div>
					</div>

					{/* Buried (7d) */}
					<div className="bg-[#191B1F] border-[1px] border-[#25262A] rounded-[8px] backdrop-blur-[8px] h-[60px] flex flex-col items-center justify-center">
						<div className="flex items-center gap-[4px] font-semibold">
							<Image src="/images/logo.png" alt="logo" className="w-[16px] h-[16px] shrink-0" disableSkeleton disableAnimation radius="none" />
							<div className="text-[16px] text-[#fff]">{exploreInfoData?.buried_7d?.value ? (() => {
								const formatted = BigNumber(ethers.formatEther(BigInt(exploreInfoData.buried_7d.value))).dp(6, BigNumber.ROUND_DOWN);
								return formatted.gte(1) ? formatted.toNumber().toLocaleString() : formatted.toString();
							})() : '0'}</div>
						</div>
						<div className="text-[#868789] text-[12px]">{t('Explore.buried7d')}</div>
					</div>

					{/* Protocol Rev(7d) */}
					<div className="bg-[#191B1F] border-[1px] border-[#25262A] rounded-[8px] backdrop-blur-[8px] h-[60px] flex flex-col items-center justify-center">
						<div className="flex items-center gap-[4px] font-semibold">
							<BNBIcon className="w-[16px] h-[16px]" />
							<div className="text-[16px] text-[#fff]">{exploreInfoData?.protocol_rev_7d?.value ? (() => {
								const formatted = BigNumber(ethers.formatUnits(BigInt(exploreInfoData.protocol_rev_7d.value), 8)).dp(6, BigNumber.ROUND_DOWN);
								return formatted.gte(1) ? formatted.toNumber().toLocaleString() : formatted.toString();
							})() : '0'}</div>
						</div>
						<div className="text-[#868789] text-[12px]">{t('Explore.protocolRev7d')}</div>
					</div>

					{/* Unrefined BURY */}
					<div className="bg-[#191B1F] border-[1px] border-[#25262A] rounded-[8px] backdrop-blur-[8px] h-[60px] flex flex-col items-center justify-center col-span-2 lg:col-span-1">
						<div className="flex items-center gap-[4px] font-semibold">
							<Image src="/images/logos.png" alt="logo" className="w-[16px] h-[16px]" disableSkeleton disableAnimation radius="none" />
							<div className="text-[16px] text-[#fff]">{(Number(formattedTreasuryData?.totalOreShares) || 0).toLocaleString()}</div>
						</div>
						<div className="text-[#868789] text-[12px]">{t('Explore.unrefinedOri')}</div>
					</div>
				</div>
				<div className="mb-[20px] w-full">
					<MiningTable />
				</div>
				<div className="mb-[20px] w-full">
					<MotherlodesTable />
				</div>
				<div className="mb-[20px] w-full">
					<BuybacksTable />
				</div>
			</section>
		</DefaultLayout>
	);
}