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
import Rewards from "@/components/rewards";
import { ethers } from "ethers";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useAuthStore } from "@/stores/auth";
import OreProtocolABI from "@/constant/OreProtocol.json";
import { CONTRACT_CONFIG } from "@/config/chains";
import { useQuery } from "@tanstack/react-query";

export default function IndexPage() {
	const router = useRouter();
	const [selectedCells, setSelectedCells] = useState<number[]>([]);
	const [inputAmount, setInputAmount] = useState('');
	const [cellAmounts, setCellAmounts] = useState<{ [key: number]: number }>({});
	const [countdown, setCountdown] = useState(0);
	const [isCheckingResults, setIsCheckingResults] = useState(false);
	const [hasDrawn, setHasDrawn] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	const [winningCell, setWinningCell] = useState<number | null>(null);
	const [isDrawing, setIsDrawing] = useState(false);
	const [showWinner, setShowWinner] = useState(false);
	const [roundId, setRoundId] = useState<number | null>(null);
	const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
	const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
	const [oreProtocolContract, setOreProtocolContract] = useState<ethers.Contract | null>(null);
	const { ready, authenticated, user } = usePrivy();
	const { wallets } = useWallets();
	// 使用自定义认证状态的地址，并找到对应的钱包对象
	const { isLoggedIn, address } = useAuthStore();
	const wallet = address ? wallets.find((w) => w.address?.toLowerCase() === address.toLowerCase()) : null;
	const isConnected = ready && isLoggedIn && !!address;

	// 初始化 provider 和 signer
	useEffect(() => {
		const initializeProvider = async () => {
			if (wallet) {
				try {
					const ethereumProvider = await wallet.getEthereumProvider();
					const ethersProvider = new ethers.BrowserProvider(ethereumProvider);
					const ethersSigner = await ethersProvider.getSigner();

					setProvider(ethersProvider);
					setSigner(ethersSigner);

					// 初始化 OreProtocol 合约
					const oreContract = new ethers.Contract(
						CONTRACT_CONFIG.ORE_CONTRACT,
						OreProtocolABI.abi,
						ethersSigner
					);
					setOreProtocolContract(oreContract);
					console.log('合约对象:', oreContract);

				} catch (error) {
					console.error("Failed to initialize provider:", error);
				}
			}
		};

		if (isConnected && wallet) {
			initializeProvider();
		}
	}, [wallet, isConnected]);

	// 获取轮次信息
	const fetchRoundInfo = async () => {
		if (!oreProtocolContract || !provider) return;

		try {
			// 获取当前区块号
			const blockNumber = await provider.getBlockNumber();

			const board = await oreProtocolContract.board();
			const currentRoundId = board.currentRoundId;
			const round = await oreProtocolContract.rounds(currentRoundId);


			// 获取轮次数据
			const roundData = await oreProtocolContract.getRoundData(currentRoundId);
			console.log('getRoundData:', roundData);

			// 获取国库状态
			const treasuryState = await oreProtocolContract.getTreasuryState();
			console.log('getTreasuryState:', ethers.formatUnits(treasuryState.motherlodeOre, 11));

			// 从 board 获取配置信息
			const roundLength = Number(board.roundLength);        // 轮次长度（区块数）
			const intermission = Number(board.intermission);      // 间歇期（区块数）
			const checkpointGrace = Number(board.checkpointGrace); // Checkpoint 宽限期（区块数）
			const BLOCK_TIME = 0.75; // BSC 区块时间约0.75秒

			console.log('轮次长度:', roundLength, '区块');
			console.log('间歇期:', intermission, '区块');
			console.log('Checkpoint宽限期:', checkpointGrace, '区块');

			// 计算倒计时
			let secondsRemaining = 0;
			let countdownType = '';

			if (blockNumber >= Number(round.startBlock) && blockNumber <= Number(round.endBlock)) {
				// 下注倒计时
				const blocksRemaining = Number(round.endBlock) - blockNumber;
				secondsRemaining = blocksRemaining * BLOCK_TIME;
				countdownType = '下注倒计时';
			} else if (blockNumber > Number(round.endBlock) && blockNumber < (Number(round.endBlock) + intermission)) {
				// Reset 倒计时
				const resetBlock = Number(round.endBlock) + intermission;
				const blocksRemaining = resetBlock - blockNumber;
				secondsRemaining = blocksRemaining * BLOCK_TIME;
				countdownType = '等待 Reset';
			}
			// checkpoint 中奖之后执行
			console.log('当前轮:', currentRoundId);
			console.log('当前区块:', blockNumber);
			console.log('开始区块:', Number(round.startBlock));
			console.log('结束区块:', Number(round.endBlock));
			console.log('倒计时类型:', countdownType);
			console.log('剩余秒数:', secondsRemaining);

			// 更新倒计时状态 - 确保倒计时是整数
			setRoundId(currentRoundId);
			setCountdown(secondsRemaining > 0 ? Math.ceil(secondsRemaining) : 0);

		} catch (error) {
			console.error('获取合约信息失败:', error);
		}
	};


	// 父组件也可以获取 Matrix 组件的 roundInfo 数据
	const { data: roundInfoData } = useQuery({
		queryKey: ['roundInfo', roundId, address], // 使用和 Matrix 组件相同的 queryKey
		queryFn: () => null, // 提供一个空的 queryFn
		enabled: false // 父组件不主动查询，只获取 Matrix 组件查询的结果
	});

	// 根据条件决定是否需要调用 fetchRoundInfo
	const hasValidData = roundInfoData && (roundInfoData as any)?.total_amount > 0;
	const shouldUseFetchRoundInfo = !hasValidData && countdown <= 0;

	// 使用 useQuery 每秒调用 fetchRoundInfo（当没有有效数据且倒计时结束时）
	const { data: fetchRoundData } = useQuery({
		queryKey: ['fetchRoundInfo', oreProtocolContract?.target],
		queryFn: async () => {
			if (!oreProtocolContract) return null;
			await fetchRoundInfo();
			return { timestamp: Date.now() }; // 返回一个标识，表示已执行
		},
		refetchInterval: shouldUseFetchRoundInfo ? 1000 : false, // 只在需要时每1秒查询一次
		enabled: !!oreProtocolContract && shouldUseFetchRoundInfo
	});

	// 初始化时获取轮次信息
	useEffect(() => {
		if (!oreProtocolContract) return;

		// 立即调用一次
		fetchRoundInfo();
	}, [oreProtocolContract]);

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

	// 动态倒计时逻辑 - 每秒递减，倒计时结束后开始检查开奖结果
	useEffect(() => {
		if (countdown <= 0) return;

		const timer = setInterval(() => {
			setCountdown((prev: number) => {
				if (prev <= 1) {
					// 倒计时结束，延迟一点再开始检查开奖结果，确保倒计时完全结束
					setTimeout(() => {
						setIsCheckingResults(true);
					}, 500);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [countdown]);

	// 使用 useQuery 检查开奖结果 - 每1秒查询一次
	const { data: drawResult } = useQuery({
		queryKey: ['checkDrawResults', roundId],
		queryFn: async () => {
			if (!oreProtocolContract || !roundId) return null;

			try {
				const roundData = await oreProtocolContract.getRoundData(roundId);
				console.log('检查开奖结果:', roundData);

				if (roundData.randomnessFulfilled) {
					const winningSquare = Number(roundData.winningSquare);
					console.log('开奖了！合约返回的中奖格子:', winningSquare);

					// 标记已开奖，停止所有查询
					setHasDrawn(true);


					// 开始抽奖动画
					setWinningCell(winningSquare);
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
							setIsCheckingResults(false);
							setHasDrawn(false); // 重置开奖状态
							setCellAmounts({}); // 清空投注金额
							fetchRoundInfo(); // 获取新轮次信息
						}, 5000);
					}, 3600); // 24个格子 * 150ms

					return { drawn: true, winningSquare };
				}

				return { drawn: false };
			} catch (error) {
				console.error('检查开奖结果失败:', error);
				return null;
			}
		},
		refetchInterval: isCheckingResults && hasValidData ? 1000 : false, // 只在检查状态且有有效数据时每1秒查询一次
		enabled: !!isCheckingResults && !!roundId && !!oreProtocolContract && !hasDrawn
	});

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
								roundId={roundId}
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
									roundId={roundId}
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
								<Rewards />
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