import { Image, Button } from "@heroui/react"
import DefaultLayout from "@/layouts/default";
import { useRouter } from "next/router";
import NextImage from "next/image"
import { useState, useEffect } from "react"
import { siteConfig } from "@/config/site";
import Matrix from "@/components/matrix";
import Overview from "@/components/overview";
import { Trade } from "@/components/trade";
import Rank from "@/components/rank";

export default function IndexPage() {
	const router = useRouter();
	const [selectedCells, setSelectedCells] = useState<number[]>([]);
	const [inputAmount, setInputAmount] = useState('');
	const [cellAmounts, setCellAmounts] = useState<{ [key: number]: number }>({});
	const [countdown, setCountdown] = useState(30);
	const [isPaused, setIsPaused] = useState(false);
	const [winningCell, setWinningCell] = useState<number | null>(null);
	const [isDrawing, setIsDrawing] = useState(false);
	const [showWinner, setShowWinner] = useState(false);

	const handleLotteryStart = () => {
		// 选择最终中奖者并开始抽奖动画
		const finalWinner = Math.floor(Math.random() * 25);
		setWinningCell(finalWinner);
		setIsPaused(true); // 暂停倒计时
		setCountdown(30);
		setIsDrawing(true);
		setShowWinner(false);
		
		// 模拟抽奖动画时间，然后显示中奖者
		setTimeout(() => {
			setShowWinner(true);
			setIsDrawing(false);
			
			// 5秒后开始新一轮
			setTimeout(() => {
				setShowWinner(false);
				setWinningCell(null);
				setIsPaused(false); // 恢复倒计时
				setCellAmounts({}); // 清空投注金额
			}, 5000);
		}, 3600); // 24个格子 * 150ms
	};

	// 倒计时逻辑
	useEffect(() => {
		const timer = setInterval(() => {
			if (!isPaused) {
				setCountdown((prev: number) => {
					if (prev <= 1 && !isDrawing && !showWinner) {
						handleLotteryStart();
						return 30; // 重置倒计时
					}
					return prev - 1;
				});
			}
		}, 1000);

		return () => clearInterval(timer);
	}, [isPaused]);
	
	return (
		<DefaultLayout>
			<div className="flex flex-col h-full bg-[#0D0F13]">
				<section className="flex flex-col items-center justify-center gap-4 px-[14px]">
					<div className="w-full max-w-[640px] lg:max-w-[1200px] flex flex-col lg:flex-row pt-[16px] lg:pt-[40px]">
						<div className="block lg:hidden"><Overview countdown={countdown} isPaused={isPaused} /></div>
						<div className="lg:w-[calc(632/1200*100%)] mt-[24px] lg:mt-0">
							<Matrix 
								selectedCells={selectedCells} 
								setSelectedCells={setSelectedCells}
								cellAmounts={cellAmounts}
								winningCell={winningCell}
								isDrawing={isDrawing}
								showWinner={showWinner}
							/>
						</div>
						<div className="w-0 lg:w-[calc(32/1200*100%)]"></div>
						<div className="flex-1">
							<div className="hidden lg:block"><Overview countdown={countdown} isPaused={isPaused} /></div>
							<div className="mt-[24px]">
								<Trade 
									selectedCells={selectedCells} 
									inputAmount={inputAmount} 
									setInputAmount={setInputAmount}
									isPaused={isPaused}
									onDeploy={(amount) => {
										// 给每个选中的格子都加上输入的金额
										const inputAmount = parseFloat(amount);
										const newAmounts = { ...cellAmounts };
										selectedCells.forEach(cellIndex => {
											newAmounts[cellIndex] = (newAmounts[cellIndex] || 0) + inputAmount;
										});
										setCellAmounts(newAmounts);
										setInputAmount(''); // 清空输入
									}}
								/>
							</div>
							<div className="mt-[24px]">
								<Rank />
							</div>
						</div>
					</div>
				</section>
			</div>
		</DefaultLayout>
	);
}