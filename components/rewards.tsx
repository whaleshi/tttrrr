import React, { useEffect, useState } from "react";
import { LogoIcon, BNBIcon, InfoIcon } from "@/components/icons";
import { Button, Divider, Popover, PopoverContent, PopoverTrigger, Progress } from "@heroui/react";

export default function Rewards() {
	const [isPopoverOpen, setIsPopoverOpen] = useState(false);
	return (
		<>
			<div className="text-[20px] text-[#fff] font-semibold flex items-center justify-between mb-[16px]">
				Rewards
			</div>
			<div className="border-dashed border-[1px] border-[#25262A] p-[12px] pb-[16px] rounded-[8px]">
				<div className="flex items-center text-[13px]">
					<div className="text-[#868789]">BNB</div>
					<div className="ml-[4px]">
						<Popover placement="top" showArrow={true}>
							<PopoverTrigger>
								<div><InfoIcon className="cursor-pointer" /></div>
							</PopoverTrigger>
							<PopoverContent>
								<div className="max-w-[270px] text-[12px] text-[#E6E6E6]">test test</div>
							</PopoverContent>
						</Popover>
					</div>
					<div className="flex-1"></div>
					<BNBIcon className="w-[16px] h-[16px]" />
					<div className="#fff ml-[4px]">0.213</div>
				</div>
				<div className="flex items-center text-[13px] my-[8px]">
					<div className="text-[#868789]">Unrefined ORI</div>
					<div className="ml-[4px]">
						<Popover placement="top" showArrow={true}>
							<PopoverTrigger>
								<div><InfoIcon className="cursor-pointer" /></div>
							</PopoverTrigger>
							<PopoverContent>
								<div className="max-w-[270px] text-[12px] text-[#E6E6E6]">test test</div>
							</PopoverContent>
						</Popover>
					</div>
					<div className="flex-1"></div>
					<LogoIcon className="w-[16px] h-[16px]" />
					<div className="#fff ml-[4px]">0.213</div>
				</div>
				<div className="flex items-center text-[13px]">
					<div className="text-[#868789]">Refined ORI</div>
					<div className="ml-[4px]">
						<Popover placement="top" showArrow={true}>
							<PopoverTrigger>
								<div><InfoIcon className="cursor-pointer" /></div>
							</PopoverTrigger>
							<PopoverContent>
								<div className="max-w-[270px] text-[12px] text-[#E6E6E6]">test test</div>
							</PopoverContent>
						</Popover>
					</div>
					<div className="flex-1"></div>
					<LogoIcon className="w-[16px] h-[16px]" />
					<div className="#fff ml-[4px]">0.213</div>
				</div>
				<Button fullWidth variant="bordered" className="h-[44px] border-[#EFC462] text-[15px] text-[#EFC462] mt-[15px]" radius="full">Claim</Button>
				<div className="text-[14px] text-[#868789] text-center mt-[16px] cursor-pointer">Claim only BNB</div>
			</div>
		</>
	)
}