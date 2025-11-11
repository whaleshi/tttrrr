import { LogoIcon, BNBIcon } from "@/components/icons";
export default function Rank() {
	return (
		<>
			<div className="text-[20px] text-[#fff] font-semibold flex items-center justify-between mb-[12px]">
				Miners<span className="text-[12px] text-[#868789]">Round: #32,578</span>
			</div>
			<div>
				{Array.from({ length: 20 }, (_, index) => (
					<div key={index} className="flex items-center justify-between h-[30px]">
						<span className="text-[12px] text-[#868789]">0xAB...CDEF</span>
						<div className="flex items-center gap-[4px] text-[12px] text-[#fff]">
							{
								index === 3 && <>
									<LogoIcon className="w-[14px] h-[14px]" />
									<span>1000</span>
									<span className="text-[#868789]">+</span>
								</>
							}
							<BNBIcon className="w-[14px] h-[14px]" />
							<span>2.3635</span>
						</div>
					</div>
				))}
			</div>
		</>
	)
}