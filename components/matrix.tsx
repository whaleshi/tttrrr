import { useState, useEffect } from "react";
import { PeopleIcon } from "./icons";

export default function Matrix() {
	const [selectedCells, setSelectedCells] = useState<number[]>([]);
	const [countdown, setCountdown] = useState(10);
	const [winningCell, setWinningCell] = useState<number | null>(null);
	const [fadingCells, setFadingCells] = useState<number[]>([]);
	const [isDrawing, setIsDrawing] = useState(false);
	const [showWinner, setShowWinner] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	const [cellCounts, setCellCounts] = useState<{ [key: number]: number }>({});

	// 初始化格子数字
	useEffect(() => {
		const initialCounts: { [key: number]: number } = {};
		for (let i = 0; i < 25; i++) {
			initialCounts[i] = 0;
		}
		setCellCounts(initialCounts);
	}, []);

	// 每秒随机增加格子数字
	useEffect(() => {
		const timer = setInterval(() => {
			if (!isDrawing && !showWinner) {
				setCellCounts(prev => {
					const newCounts = { ...prev };
					for (let i = 0; i < 25; i++) {
						newCounts[i] += Math.floor(Math.random() * 10);
					}
					return newCounts;
				});
			}
		}, 1000);

		return () => clearInterval(timer);
	}, [isDrawing, showWinner]);

	const toggleCell = (index: number) => {
		setSelectedCells(prev =>
			prev.includes(index)
				? prev.filter(i => i !== index)
				: [...prev, index]
		);
	};

	// 开始抽奖动画
	const startLottery = () => {
		setIsDrawing(true);
		setShowWinner(false);
		setFadingCells([]);
		setIsPaused(true); // 暂停倒计时

		// 选择最终中奖者并立即设置（但不显示金色效果）
		const finalWinner = Math.floor(Math.random() * 25);
		setWinningCell(finalWinner);

		// 创建其他24个格子的随机顺序（排除中奖格子）
		const otherCells = Array.from({ length: 25 }, (_, i) => i).filter(i => i !== finalWinner);
		const shuffledCells = [...otherCells].sort(() => Math.random() - 0.5);

		// 逐个淡化24个格子
		shuffledCells.forEach((cellIndex, i) => {
			setTimeout(() => {
				setFadingCells(prev => [...prev, cellIndex]);
				
				// 如果是最后一个格子淡化，立即显示中奖效果
				if (i === shuffledCells.length - 1) {
					setShowWinner(true);
					setIsDrawing(false);
					
					// 2秒后重置状态并开始新一轮
					setTimeout(() => {
						setShowWinner(false);
						setWinningCell(null);
						setFadingCells([]);
						setIsPaused(false);
						setCountdown(10);
						
						// 重置所有格子数字为0
						const resetCounts: { [key: number]: number } = {};
						for (let j = 0; j < 25; j++) {
							resetCounts[j] = 0;
						}
						setCellCounts(resetCounts);
					}, 2000);
				}
			}, i * 150); // 每150ms淡化一个格子
		});
	};

	// 倒计时逻辑
	useEffect(() => {
		const timer = setInterval(() => {
			if (!isPaused) {
				setCountdown(prev => {
					if (prev <= 1) {
						startLottery();
						return 10; // 重置倒计时
					}
					return prev - 1;
				});
			}
		}, 1000);

		return () => clearInterval(timer);
	}, [isPaused]);

	// 获取格子样式
	const getCellStyle = (index: number) => {
		// 中奖格子且显示中奖效果
		if (winningCell === index && showWinner) {
			return 'bg-[#23211C] border-[#EFC462]';
		}

		// 中奖格子但还没显示中奖效果 - 保持正常样式
		if (winningCell === index && !showWinner) {
			return selectedCells.includes(index) 
				? 'bg-[#191B1F] border-[#FFF]' 
				: 'bg-[#0D0F13] border-[#25262A] hover:bg-[#161820] hover:border-[#999]';
		}

		// 已淘汰的格子
		if (fadingCells.includes(index)) {
			return 'bg-[#0D0F13] border-[#25262A] scale-90 opacity-20 blur-[1px]';
		}

		// 选中的格子
		if (selectedCells.includes(index)) {
			return 'bg-[#191B1F] border-[#FFF]';
		}

		// 默认样式
		return 'bg-[#0D0F13] border-[#25262A] hover:bg-[#161820] hover:border-[#999]';
	};

	return (
		<>
			<div className="mb-4 text-center">
				<div className="text-[20px] text-[#FFF]">倒计时: {countdown}s</div>
			</div>
			<div className="w-full grid grid-cols-5 gap-[6px] md:gap-[8px] pt-[20px]">
				{Array.from({ length: 25 }, (_, i) => (
					<div
						key={i}
						onClick={() => toggleCell(i)}
						className={`aspect-square border-[2px] rounded-[8px] px-[6px] py-[6px] md:px-[12px] md:py-[12px] cursor-pointer transition-all duration-500 ease-out ${getCellStyle(i)}`}
					>
						<div className="flex items-center justify-between">
							<div className="text-[10px] md:text-[15px] text-[#D4BB81]">#{i + 1}</div>
							<div className="flex items-center gap-[4px]">
								<div className="text-[10px] md:text-[15px] text-[#868789]">{cellCounts[i] || 0}</div>
								<PeopleIcon className="w-[8px] h-[8px] md:h-[14px] md:w-[14px]" />
							</div>
						</div>
					</div>
				))}
			</div>
		</>
	)
}