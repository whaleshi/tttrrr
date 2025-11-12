import { LogoIcon, InfoIcon, BNBIcon } from "@/components/icons";
import DefaultLayout from "@/layouts/default";
import { Button, Input } from "@heroui/react";
import { useState } from "react";

export default function StakePage() {
	const [selectedTab, setSelectedTab] = useState('deposit');
	const [selectedPercentage, setSelectedPercentage] = useState<number | null>(null);
	const [inputAmount, setInputAmount] = useState('');
	const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

	const percentageButtons = [
		{ label: "25%", value: 25 },
		{ label: "50%", value: 50 },
		{ label: "100%", value: 100 }
	];

	const handlePercentageClick = (percentage: number) => {
		setSelectedPercentage(percentage);
		setSelectedAmount(percentage);
		// 根据余额计算实际金额
		const balance = 2.3056;
		const calculatedAmount = (balance * percentage / 100).toFixed(4);
		setInputAmount(calculatedAmount);
	};

	const handleTabClick = (tab: string) => {
		setSelectedTab(tab);
		setSelectedPercentage(null);
		setInputAmount('');
		setSelectedAmount(null);
	};

	return (
		<DefaultLayout>
			<section className="flex flex-col items-center justify-center w-full px-[14px] max-w-[600px] mx-auto">
				<div className="text-[28px] font-bold text-[#fff] w-full pt-[24px]">Stake</div>
				<div className="text-[14px] text-[#868789] w-full mt-[2px] mb-[24px]">Earn a share of protocol revenue.</div>

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
							Deposit
						</div>
						<div
							className={`flex-1 rounded-[8px] text-[13px] flex items-center justify-center cursor-pointer transition-all duration-200 ${selectedTab === 'withdraw'
								? 'bg-[#303135] text-[#fff]'
								: 'bg-[#25262A] text-[#868789] hover:bg-[#303135]'
								}`}
							onClick={() => handleTabClick('withdraw')}
						>
							Withdraw
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
							// 只允许数字和小数点
							if (value === '' || /^\d*\.?\d*$/.test(value)) {
								// 确保不以小数点开头，如果是则添加0
								const formattedValue = value.startsWith('.') ? '0' + value : value;
								setInputAmount(formattedValue);
								setSelectedPercentage(null);
							}
						}}
						startContent={<div className="shrink-0 flex items-center gap-[4px] pl-[4px]">
							<LogoIcon className="w-[20px] h-[20px]" />
							<div className="text-[16px] text-[#fff]">ORI</div>
						</div>}
					/>

					{/* Balance and Percentage Buttons */}
					<div className="flex items-center justify-between mb-[16px] mt-[12px]">
						<div className="text-[12px] text-[#868789]">
							<span className="text-[#868789]">Bal:</span> 2.3056 ORI
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
					<Button
						fullWidth
						className="h-[44px] text-[15px] text-[#0D0F13] bg-[#fff] rounded-[22px] font-medium"
					>
						{selectedTab === 'deposit' ? 'Deposit' : 'Withdraw'}
					</Button>
				</div>

				{/* Account Section */}
				<div className="w-full mb-[32px]">
					<div className="text-[20px] font-bold text-[#fff] mb-[16px]">Account</div>
					<div className="bg-[#0D0F13] border-[2px] border-[#25262A] rounded-[8px] p-[12px]">
						<div className="flex items-center justify-between mb-[12px]">
							<div className="flex items-center gap-[8px] text-[13px] text-[#868789]">
								<span>Balance</span>
								<InfoIcon className="w-[14px] h-[14px] cursor-pointer" />
							</div>
							<div className="flex items-center gap-[4px]">
								<LogoIcon className="w-[16px] h-[16px]" />
								<span className="text-[14px] text-[#fff]">1,560,253</span>
							</div>
						</div>

						<div className="flex items-center justify-between mb-[16px]">
							<div className="flex items-center gap-[8px] text-[13px] text-[#868789]">
								<span>Yield</span>
								<InfoIcon className="w-[14px] h-[14px] cursor-pointer" />
							</div>
							<div className="flex items-center gap-[4px]">
								<LogoIcon className="w-[16px] h-[16px]" />
								<span className="text-[14px] text-[#EFC462]">12.560000</span>
							</div>
						</div>

						<Button
							fullWidth
							variant="bordered"
							className="h-[44px] border-[#EFC462] text-[15px] text-[#EFC462] rounded-[22px] font-medium mb-[16px]"
						>
							Claim
						</Button>

						<div className="text-[12px] text-[#868789] text-center">Claim and deposit</div>
					</div>
				</div>

				{/* Summary Section */}
				<div className="w-full mb-[30px]">
					<div className="text-[20px] font-bold text-[#fff] mb-[16px]">Summary</div>
					<div className="space-y-[12px]">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-[8px] text-[13px] text-[#868789]">
								<span>Total deposite</span>
								<InfoIcon className="w-[14px] h-[14px] cursor-pointer" />
							</div>
							<div className="flex items-center gap-[4px]">
								<LogoIcon className="w-[16px] h-[16px]" />
								<span className="text-[14px] text-[#fff]">1,560,253</span>
							</div>
						</div>

						<div className="flex items-center justify-between">
							<div className="flex items-center gap-[8px] text-[13px] text-[#868789]">
								<span>APR</span>
								<InfoIcon className="w-[14px] h-[14px] cursor-pointer" />
							</div>
							<span className="text-[14px] text-[#fff]">12.56%</span>
						</div>

						<div className="flex items-center justify-between">
							<div className="flex items-center gap-[8px] text-[13px] text-[#868789]">
								<span>TVL</span>
								<InfoIcon className="w-[14px] h-[14px] cursor-pointer" />
							</div>
							<span className="text-[14px] text-[#fff]">$560,253.29</span>
						</div>
					</div>
				</div>
			</section>
		</DefaultLayout>
	);
}