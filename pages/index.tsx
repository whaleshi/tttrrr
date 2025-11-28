import DefaultLayout from "@/layouts/default";
import { useState, useEffect, useCallback } from "react"
import Matrix from "@/components/matrix";
import Overview from "@/components/overview";
import { Trade } from "@/components/trade";
import { Auto } from "@/components/auto";
import Rank from "@/components/rank";
import Rewards from "@/components/rewards";
import { ethers } from "ethers";
import { usePrivy } from "@privy-io/react-auth";
import { useAuthStore } from "@/stores/auth";
import ReadOreProtocolABI from "@/constant/OreProtocolView.json";
import { CONTRACT_CONFIG } from "@/config/chains";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useReadContracts } from 'wagmi';
import { useEchoChannel } from "@/hooks/useEchoChannel";
import { getEventInfo, getAutomation } from "@/service/api";

export default function IndexPage() {
	const queryClient = useQueryClient();
	const [selectedCells, setSelectedCells] = useState<number[]>([]);
	const [cellAmounts, setCellAmounts] = useState<{ [key: number]: number }>({});
	const [winningCell, setWinningCell] = useState<number | null>(null);
	const [isDrawing, setIsDrawing] = useState(false);
	const [showWinner, setShowWinner] = useState(false);
	const [roundId, setRoundId] = useState<number | null>(null);
	const { ready } = usePrivy();
	// 使用自定义认证状态的地址，并找到对应的钱包对象
	const { address } = useAuthStore();


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
	console.log(roundInfo)
	const { data: eventInfoData } = useQuery({
		queryKey: ['eventInfo', roundInfo?.gameState],
		queryFn: async () => {
			const result = await getEventInfo();
			const data = result?.data;
			if (data) {
				// 如果 round_id 和 reset_event_round_id 一样，取 reset_event_round_id；不一样取最大的
				let targetRoundId;
				if (data?.round_id === data?.reset_event_round_id) {
					targetRoundId = roundInfo?.gameState != 4 ? data?.reset_event_round_id + 1 : data?.reset_event_round_id;
				} else {
					targetRoundId = Math.max(data?.round_id || 0, data?.reset_event_round_id || 0);
				}

				setRoundId(targetRoundId);
				// console.log('round_id:', data?.round_id, 'reset_event_round_id:', data?.reset_event_round_id, '最终设置roundId为:', targetRoundId);
			}

			return data;
		},
		refetchInterval: 3000,
		staleTime: 0, // 数据立即过期
		refetchOnMount: true, // 挂载时重新请求
		refetchOnWindowFocus: true, // 窗口获得焦点时重新请求
		refetchOnReconnect: true // 重新连接时重新请求
	});

	// 获取自动化配置信息 - 每10秒刷新一次
	const { data: automationData } = useQuery({
		queryKey: ['automation', address],
		queryFn: async () => {
			const result = await getAutomation({
				user: address
			});
			return result?.data;
		},
		enabled: !!address, // 只有地址存在时才执行
		refetchInterval: 10000, // 每 10 秒刷新一次
		refetchIntervalInBackground: true, // 后台也继续刷新
		retry: 2,
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


			// 处理开奖逻辑
			if (parsedData?.winning_square !== undefined) {
				queryClient.invalidateQueries({ queryKey: ['roundWinInfo'] });
				const winningSquare = Number(parsedData.winning_square);

				// 立即触发eventInfo重新获取
				queryClient.invalidateQueries({ queryKey: ['eventInfo'] });

				// 立即触发自动化配置重新获取
				queryClient.invalidateQueries({ queryKey: ['automation'] });


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
						queryClient.invalidateQueries({ queryKey: ['eventInfo'] });

						// 再次触发自动化配置重新获取
						queryClient.invalidateQueries({ queryKey: ['automation'] });
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
			// 处理轮次开始逻辑 - 根据实际数据结构
			if (parsedData?.timestamp) {
				const startTimestamp = Number(parsedData.timestamp);
				// 触发eventInfo重新获取
				setShowWinner(false);
				setWinningCell(null);
				setCellAmounts({}); // 清空投注金额

				// 再次触发eventInfo重新获取，确保获取最新轮次信息
				queryClient.invalidateQueries({ queryKey: ['eventInfo'] });

				// 再次触发自动化配置重新获取
				queryClient.invalidateQueries({ queryKey: ['automation'] });
			}

		} catch (error) {
			console.error('解析轮次开始事件数据失败:', error);
		}
	}, [queryClient]);

	// 监听轮次开始事件（倒计时开始）
	useEchoChannel('round.new_round', '.round.data.started', onStartedMessage);

	if (!ready) {
		return <div className="flex items-center justify-center h-screen w-screen bg-[#0D0F13]">
			<img src="/images/loading.gif" alt="Loading" className="w-[60px] h-[60px]" />
		</div>;
	}

	return (
		<DefaultLayout>
			<div className="flex flex-col h-full bg-[#0D0F13]">
				<section className="flex flex-col items-center justify-center gap-4 px-[14px]">
					<div className="w-full max-w-[640px] lg:max-w-[1200px] flex flex-col lg:flex-row pt-[16px] lg:pt-[40px]">
						<div className="block lg:hidden"><Overview roundInfo={roundInfo} roundId={roundId as number} timestamp={eventInfoData?.timestamp} /></div>
						<div className="lg:w-[calc(632/1200*100%)] mt-[24px] lg:mt-0">
							<Matrix
								selectedCells={selectedCells}
								setSelectedCells={setSelectedCells}
								cellAmounts={cellAmounts}
								winningCell={winningCell}
								isDrawing={isDrawing}
								showWinner={showWinner}
								roundId={roundId}
								isShow={automationData?.id ? false : true}
							/>
						</div>
						<div className="w-0 lg:w-[calc(32/1200*100%)]"></div>
						<div className="flex-1">
							<div className="hidden lg:block"><Overview roundInfo={roundInfo} roundId={roundId as number} timestamp={eventInfoData?.timestamp} /></div>
							<div className="mt-[24px]">
								{
									automationData?.id ? <Auto info={automationData} /> : <Trade
										selectedCells={selectedCells}
										roundInfo={roundInfo}
										roundId={roundId as number}
									/>
								}

							</div>
							<div className="mt-[24px]">
								<Rewards />
							</div>
							<div className="my-[24px]">
								{
									roundInfo?.gameState === 4 && <Rank roundId={roundId as number} />
								}
							</div>
						</div>
					</div>
				</section>
			</div>
		</DefaultLayout>
	);
}