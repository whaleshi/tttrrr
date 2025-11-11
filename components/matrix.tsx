import { useState, useEffect } from "react";
import { PeopleIcon } from "./icons";

interface MatrixProps {
	selectedCells: number[];
	setSelectedCells: React.Dispatch<React.SetStateAction<number[]>>;
	cellAmounts: { [key: number]: number };
	winningCell: number | null;
	isDrawing: boolean;
	showWinner: boolean;
}

export default function Matrix({ selectedCells, setSelectedCells, cellAmounts, winningCell, isDrawing, showWinner }: MatrixProps) {
	const [fadingCells, setFadingCells] = useState<number[]>([]);
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
		setSelectedCells((prev: number[]) =>
			prev.includes(index)
				? prev.filter((i: number) => i !== index)
				: [...prev, index]
		);
	};

	// 监听抽奖状态变化，处理动画
	useEffect(() => {
		if (isDrawing && winningCell !== null) {
			// 重置淡化状态
			setFadingCells([]);
			
			// 创建其他24个格子的随机顺序（排除中奖格子）
			const otherCells = Array.from({ length: 25 }, (_, i) => i).filter(i => i !== winningCell);
			const shuffledCells = [...otherCells].sort(() => Math.random() - 0.5);

			// 逐个淡化24个格子
			shuffledCells.forEach((cellIndex, i) => {
				setTimeout(() => {
					setFadingCells(prev => [...prev, cellIndex]);
				}, i * 150); // 每150ms淡化一个格子
			});
		}
	}, [isDrawing, winningCell]);

	// 监听showWinner变化，重置格子数字
	useEffect(() => {
		if (!showWinner && !isDrawing && winningCell === null) {
			// 新一轮开始，重置格子数字
			const resetCounts: { [key: number]: number } = {};
			for (let j = 0; j < 25; j++) {
				resetCounts[j] = 0;
			}
			setCellCounts(resetCounts);
			setFadingCells([]);
		}
	}, [showWinner, isDrawing, winningCell]);



	// 获取格子样式
	const getCellStyle = (index: number) => {
		// 中奖格子且显示中奖效果
		if (winningCell === index && showWinner) {
			return 'bg-[#23211C] border-[#EFC462]';
		}

		// 中奖格子但还没显示中奖效果 - 保持正常样式
		if (winningCell === index && !showWinner) {
			// 如果有投注金额，保持绿色边框
			if (cellAmounts[index] && cellAmounts[index] > 0) {
				return 'bg-[#191B1F] border-[#2ED075]';
			}
			// 如果只是选中但没投注，保持白色边框
			return selectedCells.includes(index)
				? 'bg-[#191B1F] border-[#FFF]'
				: 'bg-[#0D0F13] border-[#25262A] hover:bg-[#161820] hover:border-[#999]';
		}

		// 已淘汰的格子
		if (fadingCells.includes(index)) {
			return 'bg-[#0D0F13] border-[#25262A] scale-90 opacity-20 blur-[1px]';
		}

		// 有投注金额的格子
		if (cellAmounts[index] && cellAmounts[index] > 0) {
			return 'bg-[#191B1F] border-[#2ED075]';
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
			<div className="w-full grid grid-cols-5 gap-[6px] lg:gap-[8px]">
				{Array.from({ length: 25 }, (_, i) => (
					<div
						key={i}
						onClick={() => toggleCell(i)}
						className={`aspect-square border-[2px] rounded-[8px] px-[6px] py-[6px] lg:p-[8px] flex flex-col justify-between cursor-pointer transition-all duration-500 ease-out ${getCellStyle(i)}`}
					>
						<div className="flex items-center justify-between">
							<div className="text-[10px] lg:text-[15px] text-[#D4BB81]">#{i + 1}</div>
							<div className="flex items-center gap-[1px] lg:gap-[4px]">
								<div className="text-[10px] lg:text-[15px] text-[#868789]">{cellCounts[i] || 0}</div>
								<PeopleIcon className="w-[8px] h-[8px] lg:h-[14px] lg:w-[14px]" />
							</div>
						</div>
						{cellAmounts[i] && cellAmounts[i] > 0 && (
							<div className="text-[10px] lg:text-[16px] text-[#2ED075] text-right pr-[2px]">
								{cellAmounts[i].toFixed(2)}
							</div>
						)}
						<div className="text-[11px] lg:text-[17px] text-[#fff] text-right">{(cellCounts[i] * 0.00012).toFixed(4)}</div>
					</div>
				))}
			</div>
		</>
	)
}