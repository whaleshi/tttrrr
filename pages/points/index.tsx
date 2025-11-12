import { PointsIcon } from "@/components/icons";
import DefaultLayout from "@/layouts/default";

export default function PointsPage() {
	const recordsData = [
		{ time: "Oct 22, 2:35", stake: "2.3456 ORE", value: "$388.26", earnPoint: "388.26" },
		{ time: "Oct 22, 2:35", stake: "2.3456 ORE", value: "$388.26", earnPoint: "388.26" },
		{ time: "Oct 22, 2:35", stake: "2.3456 ORE", value: "$388.26", earnPoint: "388.26" },
		{ time: "Oct 22, 2:35", stake: "2.3456 ORE", value: "$388.26", earnPoint: "388.26" },
		{ time: "Oct 22, 2:35", stake: "2.3456 ORE", value: "$388.26", earnPoint: "388.26" },
		{ time: "Oct 22, 2:35", stake: "2.3456 ORE", value: "$388.26", earnPoint: "388.26" },
		{ time: "Oct 22, 2:35", stake: "2.3456 ORE", value: "$388.26", earnPoint: "388.26" },
		{ time: "Oct 22, 2:35", stake: "2.3456 ORE", value: "$388.26", earnPoint: "388.26" },
		{ time: "Oct 22, 2:35", stake: "2.3456 ORE", value: "$388.26", earnPoint: "388.26" },
		{ time: "Oct 22, 2:35", stake: "2.3456 ORE", value: "$388.26", earnPoint: "388.26" },
		{ time: "Oct 22, 2:35", stake: "2.3456 ORE", value: "$388.26", earnPoint: "388.26" },
		{ time: "Oct 22, 2:35", stake: "2.3456 ORE", value: "$388.26", earnPoint: "388.26" },
		{ time: "Oct 22, 2:35", stake: "2.3456 ORE", value: "$388.26", earnPoint: "388.26" },
		{ time: "Oct 22, 2:35", stake: "2.3456 ORE", value: "$388.26", earnPoint: "388.26" },
		{ time: "Oct 22, 2:35", stake: "2.3456 ORE", value: "$388.26", earnPoint: "388.26" },
		{ time: "Oct 22, 2:35", stake: "2.3456 ORE", value: "$388.26", earnPoint: "388.26" },
		{ time: "Oct 22, 2:35", stake: "2.3456 ORE", value: "$388.26", earnPoint: "388.26" },
		{ time: "Oct 22, 2:35", stake: "2.3456 ORE", value: "$388.26", earnPoint: "388.26" },
	];

	return (
		<DefaultLayout>
			<section className="flex flex-col items-center justify-center w-full px-[14px] max-w-[600px] mx-auto">
				<div className="text-[28px] font-bold text-[#fff] w-full pt-[24px]">Points</div>
				<div className="text-[14px] text-[#868789] w-full mt-[2px] mb-[24px]">Earn points, get first-release Memes!</div>

				{/* My Points Card */}
				<div className="w-full border-[2px] border-[#25262A] rounded-[16px] h-[88px] mb-[24px] flex items-center px-[16px]">
					<div className="flex items-center gap-[12px]">
						<PointsIcon className="w-[40px] h-[40px]" />
						<div>
							<div className="text-[12px] text-[#868789] mb-[4px]">My Points</div>
							<div className="text-[24px] font-bold text-[#fff]">32,308.56</div>
						</div>
					</div>
				</div>

				{/* Records Section */}
				<div className="w-full">
					<div className="text-[20px] font-semibold text-[#fff] mb-[8px]">Records</div>
					<div className="text-[12px] text-[#868789] mb-[12px]">Earn 1 point for every 1 USD bet.</div>

					{/* Table Header */}
					<div className="grid grid-cols-4 gap-[12px] border-b border-dashed border-[#25262A] h-[38px] items-center">
						<div className="text-[14px] text-[#868789]">Time</div>
						<div className="text-[14px] text-[#868789]">Stake</div>
						<div className="text-[14px] text-[#868789]">Value</div>
						<div className="text-[14px] text-[#868789] text-right">Earn point</div>
					</div>

					{/* Table Rows */}
					<div className="">
						{recordsData.map((record, index) => (
							<div key={index} className="grid grid-cols-4 gap-[12px] h-[38px] items-center">
								<div className="text-[14px] text-[#fff]">{record.time}</div>
								<div className="text-[14px] text-[#fff]">{record.stake}</div>
								<div className="text-[14px] text-[#fff]">{record.value}</div>
								<div className="text-[14px] text-[#fff] text-right">{record.earnPoint}</div>
							</div>
						))}
					</div>
				</div>
			</section>
		</DefaultLayout>
	);
}