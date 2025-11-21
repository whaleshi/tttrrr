import { LogoIcon, BNBIcon } from "@/components/icons";
import DefaultLayout from "@/layouts/default";
import { useQuery } from '@tanstack/react-query';
import { getExploreInfo } from '@/service/api';
import _bignumber from 'bignumber.js';
import { MiningTable } from '@/components/miningTable';
import { MotherlodesTable } from '@/components/motherlodesTable';
import { BuybacksTable } from '@/components/buybacksTable';
const BigNumber = _bignumber;

export default function ExplorePage() {
	const { data: exploreInfoData } = useQuery({
		queryKey: ['exploreInfo'],
		queryFn: async () => {
			const result = await getExploreInfo({});
			return result?.data;
		},
		refetchInterval: 30000,
	});

	return (
		<DefaultLayout>
			<section className="flex flex-col items-center justify-center w-full px-[14px] max-w-[1200px] mx-auto">
				<div className="text-[28px] font-bold text-[#fff] w-full pt-[24px]">Explore</div>
				<div className="text-[14px] text-[#868789] w-full mt-[2px] mb-[24px]">Earn a share of protocol revenue.</div>

				{/* Stats Grid */}
				<div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-2 mb-[32px]">
					{/* Max Supply */}
					<div className="bg-[#191B1F] border-[1px] border-[#25262A] rounded-[8px] backdrop-blur-[8px] h-[60px] flex flex-col items-center justify-center">
						<div className="flex items-center gap-[4px] font-semibold">
							<LogoIcon className="w-[16px] h-[16px]" />
							<div className="text-[16px] text-[#fff]">{(Number(exploreInfoData?.max_supply?.value) || 0).toLocaleString()}</div>
						</div>
						<div className="text-[#868789] text-[12px]">Max Supply</div>
					</div>

					{/* Circulating Supply */}
					<div className="bg-[#191B1F] border-[1px] border-[#25262A] rounded-[8px] backdrop-blur-[8px] h-[60px] flex flex-col items-center justify-center">
						<div className="flex items-center gap-[4px] font-semibold">
							<div className="text-[16px] text-[#fff]">{(Number(exploreInfoData?.circulating_supply?.value) || 0).toLocaleString()}</div>
						</div>
						<div className="text-[#868789] text-[12px]">Circulating Supply</div>
					</div>

					{/* Buried (7d) */}
					<div className="bg-[#191B1F] border-[1px] border-[#25262A] rounded-[8px] backdrop-blur-[8px] h-[60px] flex flex-col items-center justify-center">
						<div className="flex items-center gap-[4px] font-semibold">
							<BNBIcon className="w-[16px] h-[16px]" />
							<div className="text-[16px] text-[#fff]">{(Number(exploreInfoData?.buried_7d?.value) || 0).toLocaleString()}</div>
						</div>
						<div className="text-[#868789] text-[12px]">Buried (7d)</div>
					</div>

					{/* Protocol Rev(7d) */}
					<div className="bg-[#191B1F] border-[1px] border-[#25262A] rounded-[8px] backdrop-blur-[8px] h-[60px] flex flex-col items-center justify-center">
						<div className="flex items-center gap-[4px] font-semibold">
							<BNBIcon className="w-[16px] h-[16px]" />
							<div className="text-[16px] text-[#fff]">{(Number(exploreInfoData?.protocol_rev_7d?.value) || 0).toLocaleString()}</div>
						</div>
						<div className="text-[#868789] text-[12px]">Protocol Rev(7d)</div>
					</div>
				</div>

				{/* Mining Section */}
				<MiningTable />

				{/* Motherlodes Section */}
				<MotherlodesTable />

				{/* Buybacks Section */}
				<BuybacksTable />
			</section>
		</DefaultLayout>
	);
}