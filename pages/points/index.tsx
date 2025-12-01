import { CopyIcon, PointsIcon } from "@/components/icons";
import DefaultLayout from "@/layouts/default";
import { useQuery } from '@tanstack/react-query';
import { getOriginInfo } from '@/service/api';
import _bignumber from 'bignumber.js';
import { ethers } from 'ethers';
import { useAuthStore } from '@/stores/auth';
import { useTranslation, Trans } from "react-i18next";
import { usePrivy } from "@privy-io/react-auth";
const BigNumber = _bignumber;
import { PointsRecords } from "@/components/PointsRecords";
import { PointsRecords2 } from "@/components/PointsRecords2";
import useClipboard from '@/hooks/useCopyToClipboard';

export default function PointsPage() {
	const { t } = useTranslation();
	const { ready } = usePrivy();
	const { address } = useAuthStore();
	const { copy } = useClipboard();

	const { data: originInfoData } = useQuery({
		queryKey: ['originInfo', address],
		queryFn: async () => {
			const result = await getOriginInfo({
				user_addr: address,
			});
			return result?.data;
		},
		enabled: !!address,
		refetchInterval: 10000,
		refetchIntervalInBackground: true,
		staleTime: 5000, // 5秒内不会重新请求
	});

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
				<div className="w-full border-[2px] border-[#25262A] rounded-[16px] h-[48px] mb-[8px] flex items-center px-[16px]">
					<div className="flex items-center w-full">
						<PointsIcon className="w-[24px] h-[24px]" />
						<div className="flex items-center flex-1">
							<div className="text-[16px] text-[#fff] mx-[4px]">{t('Points.origin')}</div>
							<div className="text-[12px] text-[#4A4B4E]">${originInfoData?.chain_asset_config?.price ? BigNumber(originInfoData?.chain_asset_config?.price).dp(2).toString() : '0.00'}</div>
						</div>
						<CopyIcon className="cursor-pointer" onClick={() => copy(originInfoData?.ori_config?.mint_address)} />
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
				<div className="w-full border-[2px] border-[#25262A] rounded-[16px] h-[88px] mb-[12px] flex items-center px-[16px] justify-between">
					<div className="flex items-center gap-[12px]">
						<PointsIcon className="w-[40px] h-[40px]" />
						<div>
							<div className="text-[12px] text-[#868789] mb-[4px]">{t('Points.claimableReward')}</div>
							<div className="text-[24px] font-bold text-[#fff]">{originInfoData?.user?.amount ? (() => {
								const formatted = BigNumber(ethers.formatUnits(BigInt(originInfoData.user.amount), 8)).dp(6, BigNumber.ROUND_DOWN);
								if (formatted.gte(1)) {
									const num = formatted.toNumber();
									return num % 1 === 0 ? num.toLocaleString() : num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
								}
								return formatted.toString();
							})() : '0'}</div>
						</div>
					</div>
					<button
						className={`px-[20px] py-[8px] rounded-[20px] text-[14px] font-medium transition-colors ${originInfoData?.user?.amount && BigNumber(ethers.formatUnits(BigInt(originInfoData.user.amount), 8)).gt(0)
							? 'bg-[#fff] text-[#000] hover:bg-[#f0f0f0]'
							: 'bg-[#3A3B3F] text-[#868789] cursor-not-allowed'
							}`}
						disabled={!originInfoData?.user?.amount || BigNumber(ethers.formatUnits(BigInt(originInfoData.user.amount), 8)).lte(0)}
					>
						{t('Points.claim')}
					</button>
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