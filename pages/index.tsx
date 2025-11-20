import { Image, Button } from "@heroui/react"
import DefaultLayout from "@/layouts/default";
import { useRouter } from "next/router";
import NextImage from "next/image"
import { useState, useEffect, useCallback } from "react"
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
import ReadOreProtocolABI from "@/constant/OreProtocolView.json";
import { CONTRACT_CONFIG, MULTICALL3_ADDRESS, MULTICALL3_ABI } from "@/config/chains";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useReadContracts } from 'wagmi';
import { useEchoChannel } from "@/hooks/useEchoChannel";
import { getEventInfo } from "@/service/api";

export default function IndexPage() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [selectedCells, setSelectedCells] = useState<number[]>([]);
	const [inputAmount, setInputAmount] = useState('');
	const [cellAmounts, setCellAmounts] = useState<{ [key: number]: number }>({});
	const [winningCell, setWinningCell] = useState<number | null>(null);
	const [isDrawing, setIsDrawing] = useState(false);
	const [showWinner, setShowWinner] = useState(false);
	const [roundId, setRoundId] = useState<number | null>(null);
	const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
	const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
	const [oreProtocolContract, setOreProtocolContract] = useState<ethers.Contract | null>(null);
	const [readOreProtocolContract, setReadOreProtocolContract] = useState<ethers.Contract | null>(null);
	const [multicallContract, setMulticallContract] = useState<ethers.Contract | null>(null);
	const [isGameActive, setIsGameActive] = useState(false);
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

					// 创建只读合约实例用于查询
					const readOreContract = new ethers.Contract(
						CONTRACT_CONFIG.READ_ORE_CONTRACT,
						ReadOreProtocolABI.abi,
						ethersProvider
					);
					setReadOreProtocolContract(readOreContract);

					// 创建 MULTICALL3 合约实例
					const multicall3Contract = new ethers.Contract(
						MULTICALL3_ADDRESS,
						MULTICALL3_ABI,
						ethersProvider
					);
					setMulticallContract(multicall3Contract);
					// console.log('合约对象:', oreContract);

				} catch (error) {
					console.error("Failed to initialize provider:", error);
				}
			}
		};

		if (isConnected && wallet) {
			initializeProvider();
		}
	}, [wallet, isConnected]);

	// 获取轮次信息 - 每1秒请求一次 (使用 wagmi useReadContracts)
	const { data: roundInfo, error: roundInfoError } = useReadContracts({
		contracts: [
			{
				address: CONTRACT_CONFIG.READ_ORE_CONTRACT as `0x${string}`,
				abi: ReadOreProtocolABI.abi,
				functionName: 'getTreasuryState',
			},
			{
				address: CONTRACT_CONFIG.READ_ORE_CONTRACT as `0x${string}`,
				abi: ReadOreProtocolABI.abi,
				functionName: 'getGameState',
			},
			{
				address: CONTRACT_CONFIG.READ_ORE_CONTRACT as `0x${string}`,
				abi: ReadOreProtocolABI.abi,
				functionName: 'getCurrentRoundInfo',
			},
		],
		query: {
			refetchInterval: 1000, // 每1秒刷新一次
			refetchIntervalInBackground: true,
			select: (data) => {
				if (!data || data.length < 3) return null;

				const [treasuryResult, gameStateResult, currentRoundResult] = data;

				return {
					treasuryOre: treasuryResult.status === 'success' && treasuryResult.result
						? ethers.formatUnits((treasuryResult.result as any)[5])
						: null,
					gameState: gameStateResult.status === 'success' && gameStateResult.result
						? Number((gameStateResult.result as any)[0])
						: null,
					currentRoundId: currentRoundResult.status === 'success' && currentRoundResult.result
						? Number((currentRoundResult.result as any)[0])
						: null
				};
			}
		}
	});
	// 处理 wagmi 返回的数据并打印日志
	useEffect(() => {
		if (roundInfo) {
			console.log('处理后的数据:', roundInfo);
			console.log('getTreasuryState:', roundInfo.treasuryOre);
			console.log('getGameState:', roundInfo.gameState);
			console.log('getCurrentRoundInfo:', roundInfo.currentRoundId);
		}

		if (roundInfoError) {
			console.error('获取合约信息失败:', roundInfoError);
		}
	}, [roundInfo, roundInfoError]);

	// 获取矿工方格信息 - 当有 currentRoundId 和用户地址时调用
	// const { data: minerSquares } = useReadContracts({
	// 	contracts: roundInfo?.currentRoundId && address ? [{
	// 		address: CONTRACT_CONFIG.READ_ORE_CONTRACT as `0x${string}`,
	// 		abi: ReadOreProtocolABI.abi,
	// 		functionName: 'getMinerSquares',
	// 		args: [roundInfo.currentRoundId, address],
	// 	}] : [],
	// 	query: {
	// 		enabled: !!roundInfo?.currentRoundId && !!address,
	// 		refetchInterval: 1000,
	// 		refetchIntervalInBackground: true,
	// 		select: (data) => {
	// 			if (!data || data.length === 0) return null;
	// 			const result = data[0];
	// 			if (result.status === 'success' && result.result) {
	// 				console.log('getMinerSquares:', result.result);
	// 				return result.result;
	// 			}
	// 			return null;
	// 		}
	// 	}
	// });
	// console.log(minerSquares)
	// 获取事件信息 - 有 gameState 后每3秒请求一次
	const { data: eventInfoData } = useQuery({
		queryKey: ['eventInfo', roundInfo?.gameState],
		queryFn: async () => {
			const result = await getEventInfo();
			const data = result?.data;


			// if (data) { setRoundId(roundInfo?.gameState === 1 ? data?.reset_event_round_id + 1 : data?.reset_event_round_id); console.log('设置roundId为:', roundInfo?.gameState === 1 ? data?.reset_event_round_id + 1 : data?.reset_event_round_id); }

			// 在接口请求里计算是否游戏中并设置状态
			if (data) {
				// 如果 round_id 和 reset_event_round_id 一样，取 reset_event_round_id；不一样取最大的
				let targetRoundId;
				if (data?.round_id === data?.reset_event_round_id) {
					targetRoundId = data?.reset_event_round_id + 1;
				} else {
					targetRoundId = Math.max(data?.round_id || 0, data?.reset_event_round_id || 0);
				}

				setRoundId(targetRoundId);
				console.log('round_id:', data?.round_id, 'reset_event_round_id:', data?.reset_event_round_id, '最终设置roundId为:', targetRoundId);
			}

			return data;
		},
		refetchInterval: 3000,
		staleTime: 0, // 数据立即过期
		refetchOnMount: true, // 挂载时重新请求
		refetchOnWindowFocus: true, // 窗口获得焦点时重新请求
		refetchOnReconnect: true // 重新连接时重新请求
	});



	// 开奖事件处理函数
	const onResetMessage = useCallback((eventData: any) => {
		const time = new Date().toLocaleTimeString();
		console.log('🎯', time, '收到轮次重置事件（开奖）:', eventData);

		try {
			// 解析 JSON 数据
			const parsedData = typeof eventData.data === 'string'
				? JSON.parse(eventData.data)
				: eventData.data;

			console.log('解析后的开奖数据:', parsedData);

			// 处理开奖逻辑
			if (parsedData?.winning_square !== undefined) {
				queryClient.invalidateQueries({ queryKey: ['roundWinInfo'] });
				const winningSquare = Number(parsedData.winning_square);
				console.log('实时开奖事件 - 中奖格子:', winningSquare);

				// 立即触发eventInfo重新获取
				console.log('🔄 开奖事件，重新获取eventInfo');
				queryClient.invalidateQueries({ queryKey: ['eventInfo'] });


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
						setCellAmounts({}); // 清空投注金额

						// 再次触发eventInfo重新获取，确保获取最新轮次信息
						console.log('🔄 准备新轮次，重新获取eventInfo');
						queryClient.invalidateQueries({ queryKey: ['eventInfo'] });
					}, 5000);
				}, 3600); // 24个格子 * 150ms
			}
		} catch (error) {
			console.error('解析开奖事件数据失败:', error);
		}
	}, [queryClient]);


	// 监听轮次重置事件（开奖事件）
	useEchoChannel('round.reset', '.round.data.reset', onResetMessage);

	// 轮次开始事件处理函数
	const onStartedMessage = useCallback((eventData: any) => {
		const time = new Date().toLocaleTimeString();
		console.log('🚀', time, '收到轮次开始事件（倒计时开始）:', eventData);

		try {
			// 解析 JSON 数据
			const parsedData = typeof eventData.data === 'string'
				? JSON.parse(eventData.data)
				: eventData.data;

			console.log('解析后的轮次开始数据:', parsedData);
			// setIsGameActive(true);
			// 处理轮次开始逻辑 - 根据实际数据结构
			if (parsedData?.timestamp) {
				const startTimestamp = Number(parsedData.timestamp);
				console.log('轮次开始时间戳:', startTimestamp);
				// 触发eventInfo重新获取
				console.log('🔄 轮次开始，重新获取eventInfo');
				queryClient.invalidateQueries({ queryKey: ['eventInfo'] });
			}

		} catch (error) {
			console.error('解析轮次开始事件数据失败:', error);
		}
	}, [queryClient]);

	// 监听轮次开始事件（倒计时开始）
	useEchoChannel('round.new_round', '.round.data.started', onStartedMessage);

	return (
		<DefaultLayout>
			<div className="flex flex-col h-full bg-[#0D0F13]">
				<section className="flex flex-col items-center justify-center gap-4 px-[14px]">
					<div className="w-full max-w-[640px] lg:max-w-[1200px] flex flex-col lg:flex-row pt-[16px] lg:pt-[40px]">
						<div className="block lg:hidden"><Overview roundInfo={roundInfo} timestamp={eventInfoData?.timestamp} shouldShowCountdown={isGameActive} /></div>
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
							<div className="hidden lg:block"><Overview roundInfo={roundInfo} timestamp={eventInfoData?.timestamp} shouldShowCountdown={isGameActive} /></div>
							<div className="mt-[24px]">
								<Trade
									selectedCells={selectedCells}
									inputAmount={inputAmount}
									setInputAmount={setInputAmount}
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
								<Rank roundId={roundId as number} />
							</div>
						</div>
					</div>
				</section>
			</div>
		</DefaultLayout>
	);
}