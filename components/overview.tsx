import { LogoIcon, BNBIcon } from "@/components/icons";

interface OverviewProps {
	countdown: number;
	isPaused: boolean;
}

export default function Overview({ countdown, isPaused }: OverviewProps) {
	return (
		<div className="grid grid-cols-2 gap-2">
			<div className="bg-[rgba(239,196,98,0.10)] border-[2px] border-[#EFC462] rounded-[8px] backdrop-blur-[8px] h-[60px] flex flex-col items-center justify-center">
				<div className="flex items-center gap-[4px] font-semibold">
					<LogoIcon className="w-[16px] h-[16px]" />
					<div className="text-[16px]">256.3</div>
				</div>
				<div className="text-[#868789] text-[12px]">Motherlode</div>
			</div>
			<div className="bg-[#191B1F] border-[1px] border-[#25262A] rounded-[8px] backdrop-blur-[8px] h-[60px] flex flex-col items-center justify-center">
				<div className="flex items-center gap-[4px] font-semibold">
					<LogoIcon className="w-[16px] h-[16px]" />
					<div className="text-[16px]">{isPaused ? '00:00' : `00:${countdown.toString().padStart(2, '0')}`}</div>
				</div>
				<div className="text-[#868789] text-[12px]">Time remaining</div>
			</div>
			<div className="bg-[#191B1F] border-[1px] border-[#25262A] rounded-[8px] backdrop-blur-[8px] h-[60px] flex flex-col items-center justify-center">
				<div className="flex items-center gap-[4px] font-semibold">
					<BNBIcon className="w-[16px] h-[16px]" />
					<div className="text-[16px]">2896.32</div>
				</div>
				<div className="text-[#868789] text-[12px]">Total deployed</div>
			</div>
			<div className="bg-[#191B1F] border-[1px] border-[#25262A] rounded-[8px] backdrop-blur-[8px] h-[60px] flex flex-col items-center justify-center">
				<div className="flex items-center gap-[4px] font-semibold">
					<BNBIcon className="w-[16px] h-[16px]" />
					<div className="text-[16px]">12.32</div>
				</div>
				<div className="text-[#868789] text-[12px]">You deployed</div>
			</div>
		</div>
	);
}
