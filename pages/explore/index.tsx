import { LogoIcon, BNBIcon } from "@/components/icons";
import DefaultLayout from "@/layouts/default";

export default function ExplorePage() {
	const miningData = [
		{ round: "#35,683", block: "#12", buryWinner: "0xAB...CDEF", winners: "688", deployed: "24,520,466", vaulted: "60,466", winnings: "260,466", motherlode: "-", time: "1 min ago" },
		{ round: "#35,683", block: "#12", buryWinner: "0xAB...CDEF", winners: "688", deployed: "24,520,466", vaulted: "60,466", winnings: "260,466", motherlode: "-", time: "1 min ago" },
		{ round: "#35,683", block: "#12", buryWinner: "0xAB...CDEF", winners: "688", deployed: "24,520,466", vaulted: "60,466", winnings: "260,466", motherlode: "-", time: "1 min ago" },
		{ round: "#35,683", block: "#12", buryWinner: "0xAB...CDEF", winners: "688", deployed: "24,520,466", vaulted: "60,466", winnings: "260,466", motherlode: "-", time: "1 min ago" },
		{ round: "#35,683", block: "#12", buryWinner: "0xAB...CDEF", winners: "688", deployed: "24,520,466", vaulted: "60,466", winnings: "260,466", motherlode: "-", time: "1 min ago" },
		{ round: "#35,683", block: "#12", buryWinner: "0xAB...CDEF", winners: "688", deployed: "24,520,466", vaulted: "60,466", winnings: "260,466", motherlode: "-", time: "1 min ago" },
		{ round: "#35,683", block: "#12", buryWinner: "0xAB...CDEF", winners: "688", deployed: "24,520,466", vaulted: "60,466", winnings: "260,466", motherlode: "-", time: "1 min ago" },
		{ round: "#35,683", block: "#12", buryWinner: "0xAB...CDEF", winners: "688", deployed: "24,520,466", vaulted: "60,466", winnings: "260,466", motherlode: "-", time: "1 min ago" },
		{ round: "#35,683", block: "#12", buryWinner: "0xAB...CDEF", winners: "688", deployed: "24,520,466", vaulted: "60,466", winnings: "260,466", motherlode: "-", time: "1 min ago" },
		{ round: "#35,683", block: "#12", buryWinner: "0xAB...CDEF", winners: "688", deployed: "24,520,466", vaulted: "60,466", winnings: "260,466", motherlode: "-", time: "1 min ago" },
	];

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
							<div className="text-[16px] text-[#fff]">28,000,000</div>
						</div>
						<div className="text-[#868789] text-[12px]">Max Supply</div>
					</div>

					{/* Circulating Supply */}
					<div className="bg-[#191B1F] border-[1px] border-[#25262A] rounded-[8px] backdrop-blur-[8px] h-[60px] flex flex-col items-center justify-center">
						<div className="flex items-center gap-[4px] font-semibold">
							<div className="text-[16px] text-[#fff]">827,239</div>
						</div>
						<div className="text-[#868789] text-[12px]">Circulating Supply</div>
					</div>

					{/* Buried (7d) */}
					<div className="bg-[#191B1F] border-[1px] border-[#25262A] rounded-[8px] backdrop-blur-[8px] h-[60px] flex flex-col items-center justify-center">
						<div className="flex items-center gap-[4px] font-semibold">
							<BNBIcon className="w-[16px] h-[16px]" />
							<div className="text-[16px] text-[#fff]">2,896</div>
						</div>
						<div className="text-[#868789] text-[12px]">Buried (7d)</div>
					</div>

					{/* Protocol Rev(7d) */}
					<div className="bg-[#191B1F] border-[1px] border-[#25262A] rounded-[8px] backdrop-blur-[8px] h-[60px] flex flex-col items-center justify-center">
						<div className="flex items-center gap-[4px] font-semibold">
							<BNBIcon className="w-[16px] h-[16px]" />
							<div className="text-[16px] text-[#fff]">16,327</div>
						</div>
						<div className="text-[#868789] text-[12px]">Protocol Rev(7d)</div>
					</div>
				</div>

				{/* Mining Section */}
				<div className="w-full">
					<div className="text-[28px] font-bold text-[#fff] mb-[8px]">Mining</div>
					<div className="text-[14px] text-[#868789] mb-[16px]">Recent mining activity</div>

					{/* Horizontal Scrollable Table */}
					<div className="w-full overflow-x-auto lg:overflow-x-visible">
						<div className="min-w-[800px] lg:min-w-full">
							{/* Table Header */}
							<div className="flex border-b border-dashed border-[#25262A] h-[38px] items-center text-[12px] text-[#868789]">
								<div className="w-[80px] lg:flex-1 shrink-0">Round</div>
								<div className="w-[60px] lg:flex-1 shrink-0">Block</div>
								<div className="w-[120px] lg:flex-[1.5] shrink-0">BURY Winner</div>
								<div className="w-[70px] lg:flex-1 shrink-0">Winners</div>
								<div className="w-[100px] lg:flex-[1.2] shrink-0">Deployed</div>
								<div className="w-[80px] lg:flex-1 shrink-0">Vaulted</div>
								<div className="w-[90px] lg:flex-[1.2] shrink-0">Winnings</div>
								<div className="w-[100px] lg:flex-1 shrink-0">Motherlode</div>
								<div className="w-[100px] lg:flex-[1.2] shrink-0 text-right">Time</div>
							</div>

							{/* Table Rows */}
							<div className="">
								{miningData.map((row, index) => (
									<div key={index} className="flex h-[38px] items-center text-[12px]">
										<div className="w-[80px] lg:flex-1 shrink-0 text-[#fff]">{row.round}</div>
										<div className="w-[60px] lg:flex-1 shrink-0 text-[#fff]">{row.block}</div>
										<div className="w-[120px] lg:flex-[1.5] shrink-0 text-[#fff]">{row.buryWinner}</div>
										<div className="w-[70px] lg:flex-1 shrink-0 text-[#fff]">{row.winners}</div>
										<div className="w-[100px] lg:flex-[1.2] shrink-0 flex items-center gap-[4px]">
											<LogoIcon className="w-[14px] h-[14px]" />
											<span className="text-[#fff]">{row.deployed}</span>
										</div>
										<div className="w-[80px] lg:flex-1 shrink-0 flex items-center gap-[4px]">
											<LogoIcon className="w-[14px] h-[14px]" />
											<span className="text-[#fff]">{row.vaulted}</span>
										</div>
										<div className="w-[90px] lg:flex-[1.2] shrink-0 flex items-center gap-[4px]">
											<LogoIcon className="w-[14px] h-[14px]" />
											<span className="text-[#fff]">{row.winnings}</span>
										</div>
										<div className="w-[100px] lg:flex-1 shrink-0 text-[#fff]">{row.motherlode}</div>
										<div className="w-[100px] lg:flex-[1.2] shrink-0 text-[#fff] text-right">{row.time}</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>

				{/* Navigation Arrows */}
				<div className="flex justify-end gap-[8px] mt-[16px] mb-[20px] w-full">
					<div className="w-[32px] h-[32px] rounded-full border border-[#25262A] flex items-center justify-center cursor-pointer hover:bg-[#25262A] transition-colors">
						<svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#868789]">
							<path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
						</svg>
					</div>
					<div className="w-[32px] h-[32px] rounded-full border border-[#25262A] flex items-center justify-center cursor-pointer hover:bg-[#25262A] transition-colors">
						<svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#868789]">
							<path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
						</svg>
					</div>
				</div>
			</section>
		</DefaultLayout>
	);
}