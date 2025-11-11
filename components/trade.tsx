import { Button, Input } from "@heroui/react"
import React, { useEffect, useState } from "react";
import MyAvatar from "@/components/avatarImage";
import { BNBIcon, SetIcon } from "./icons";
import Slippage from "./slippage";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from 'sonner';
import FactoryABI from "@/constant/TokenManager.abi.json";
import { DEFAULT_CHAIN_CONFIG, CONTRACT_CONFIG } from "@/config/chains";
import { ethers } from "ethers";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useAuthStore } from "@/stores/auth";
import { formatBigNumber } from "@/utils/formatBigNumber";
import { useBalanceContext } from "@/providers/balanceProvider";
import _bignumber from "bignumber.js";
import { useSlippageStore } from "@/stores/slippage";

type TradeType = 'buy' | 'sell';


interface TradeProps {
	selectedCells?: number[];
	inputAmount?: string;
	setInputAmount?: (amount: string) => void;
	onDeploy?: (amount: string) => void;
	isPaused?: boolean;
	info?: any;
	tokenBalance?: any;
	initialTab?: string;
}

export const Trade = ({ selectedCells = [], inputAmount = '', setInputAmount = () => {}, onDeploy, isPaused = false, info, tokenBalance, initialTab = 'buy' }: TradeProps) => {
	const [isBuy, setIsBuy] = useState(initialTab === 'buy');
	const [selectedTab, setSelectedTab] = useState(initialTab);
	const [isSlippageOpen, setIsSlippageOpen] = useState(false);
	const [outputAmount, setOutputAmount] = useState("");
	const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const { balance } = useBalanceContext();
	const { slippage } = useSlippageStore();
	const queryClient = useQueryClient();

	const { ready } = usePrivy();
	const { wallets } = useWallets();
	const { isLoggedIn, address } = useAuthStore();
	const isConnected = ready && isLoggedIn && !!address;
	const wallet = address ? wallets.find((w) => w.address?.toLowerCase() === address.toLowerCase()) : null;

	const handleTabClick = (tab: TradeType) => {
		setSelectedTab(tab as TradeType);
		setIsBuy(tab === 'buy');
		setInputAmount('');
		setSelectedAmount(null);
	};

	// 验证输入
	const validateInput = (): string | null => {
		if (!isConnected) {
			return '请先连接钱包';
		}

		if (!inputAmount || inputAmount.trim() === '') {
			return '请输入交易金额';
		}

		const amount = parseFloat(inputAmount);
		if (isNaN(amount) || amount <= 0) {
			return '请输入有效的数字金额';
		}

		if (selectedTab === 'buy') {
			// 买入验证
			if (!balance || balance === 0) {
				return 'BNB余额不足';
			}

			if (_bignumber(inputAmount).gt(balance)) {
				return `BNB余额不足，当前余额: ${formatBigNumber(balance)} BNB`;
			}

			// 预留gas费用检查
			const gasReserve = 0.001;
			if (_bignumber(inputAmount).plus(gasReserve).gt(balance)) {
				return '请预留足够的BNB作为手续费';
			}
		} else {
			// 卖出验证
			if (!tokenBalance || parseFloat(tokenBalance) === 0) {
				return '代币余额不足';
			}

			if (_bignumber(inputAmount).gt(tokenBalance)) {
				return `代币余额不足，当前余额: ${formatBigNumber(tokenBalance)} ${info?.symbol?.toUpperCase() || 'Token'}`;
			}
		}

		return null;
	};

	const buyAmounts = [
		{ label: "0.2", value: 0.2 },
		{ label: "0.5", value: 0.5 },
		{ label: "1", value: 1 }
	];

	const handleAmountSelect = (amount: { label: string; value: number }) => {
		setSelectedAmount(amount.value);
		if (selectedTab === 'buy') {
			setInputAmount(amount.value.toString());
		} else {
			if (tokenBalance && _bignumber(tokenBalance).gt(0)) {
				try {
					const userBalance = _bignumber(tokenBalance);
					const percentage = _bignumber(amount.value);
					const sellAmount = userBalance.times(percentage);
					console.log('用户余额:', userBalance.toString());
					// 格式化结果，正确处理小数点后的尾随零
					const formattedAmount = sellAmount.dp(18, _bignumber.ROUND_DOWN).toFixed();
					console.log('计算卖出金额:', formattedAmount);

					// 只有当包含小数点时才去除尾随零，避免删除整数末尾的有意义零
					const finalAmount = formattedAmount.includes('.') ?
						formattedAmount.replace(/\.?0+$/, '') :
						formattedAmount;

					setInputAmount(finalAmount);
				} catch (error) {
					console.error('計算賣出金額失敗:', error);
					setInputAmount('0');
				}
			} else {
				// 如果没有余额，设置为0
				setInputAmount('0');
			}
		}
	};

	const { data: estimatedOutput } = useQuery({
		queryKey: ['estimateOutput', info?.mint, inputAmount, isBuy],
		queryFn: async () => {
			if (!inputAmount || !info?.mint || parseFloat(inputAmount) <= 0) {
				return '0';
			}

			try {
				const provider = new ethers.JsonRpcProvider(DEFAULT_CHAIN_CONFIG.rpcUrl);
				const readOnlyContract = new ethers.Contract(CONTRACT_CONFIG.FACTORY_CONTRACT, FactoryABI, provider);

				if (isBuy) {
					// 调用 tryBuy 获取预期代币输出
					const result = await readOnlyContract.tryBuy(info?.mint, ethers.parseEther(inputAmount));
					const tokenAmountOut = result[0];
					return ethers.formatEther(tokenAmountOut);
				} else {
					// 调用 trySell 获取预期ETH输出
					const sellAmount = ethers.parseEther(inputAmount);
					const result = await readOnlyContract.trySell(info?.mint, sellAmount);
					return ethers.formatEther(result);
				}
			} catch (error) {
				console.error('预估输出失败:', error);
				return '0';
			}
		},
		enabled: !!(inputAmount && info?.mint && parseFloat(inputAmount) > 0),
		refetchInterval: 3000, // 每3秒刷新一次
		staleTime: 2000,
		retry: 1,
	});

	useEffect(() => {
		setInputAmount("");
		setOutputAmount("");
	}, [isBuy]);

	// 当initialTab改变时，更新选中的tab
	useEffect(() => {
		if (initialTab) {
			setSelectedTab(initialTab as TradeType);
			setIsBuy(initialTab === 'buy');
		}
	}, [initialTab]);

	useEffect(() => {
		if (estimatedOutput) {
			// 格式化输出，去除多余的小数位
			const formatted = formatBigNumber(estimatedOutput);
			setOutputAmount(formatted);
		} else {
			setOutputAmount("");
		}
	}, [estimatedOutput]);

	const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
	const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

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
				} catch (error) {
					console.error("Failed to initialize provider:", error);
				}
			}
		};

		if (isConnected && wallet) {
			initializeProvider();
		}
	}, [wallet, isConnected]);

	const handleClick = async (tokenAddress: string, amount: string) => {
		// 验证输入
		// const validationError = validateInput();
		// if (validationError) {
		// 	toast.error(validationError);
		// 	return;
		// }

		// if (!signer || !provider) {
		// 	toast.error("钱包未连接");
		// 	return;
		// }

		// setIsLoading(true);
		if (!amount || parseFloat(amount) <= 0) {
			toast.error("请输入有效金额");
			return;
		}

		if (selectedCells.length === 0) {
			toast.error("请选择至少一个格子");
			return;
		}

		// 调用部署回调
		onDeploy?.(amount);
	};

	return (
		<div className="w-full bg-[#191B1F] rounded-[8px] p-[12px]">
			<div className="w-full">
				<div className="h-[40px] bg-[#25262A] rounded-[8px] flex mb-[16px]">
					<div
						className={`flex-1 rounded-[8px] text-[13px] flex items-center justify-center cursor-pointer transition-all duration-200 ${selectedTab === 'buy'
							? 'bg-[#303135] text-[#fff]'
							: 'bg-[#25262A] text-[#868789] hover:bg-[#303135]'
							}`}
						onClick={() => handleTabClick('buy')}
					>
						Manual
					</div>
					<div
						className={`flex-1 rounded-[8px] text-[13px] flex items-center justify-center cursor-pointer transition-all duration-200 ${selectedTab === 'sell'
							? 'bg-[#303135] text-[#fff]'
							: 'bg-[#25262A] text-[#868789] hover:bg-[#303135]'
							}`}
						onClick={() => handleTabClick('sell')}
					>
						Auto
					</div>
				</div>
				<Input
					classNames={{
						inputWrapper: "h-[56px] !border-[#25262A] bg-[rgba(13,15,19,0.65)] !border-[1.5px] rounded-[8px] hover:!border-[#25262A] focus-within:!border-[#25262A]",
						input: "text-[22px] text-[#FFF] font-semibold placeholder:text-[#94989F] uppercase tracking-[-0.07px] text-right",
					}}
					name="amount"
					placeholder="0"
					variant="bordered"
					value={inputAmount}
					isDisabled={isPaused}
					onChange={(e) => {
						const value = e.target.value;
						// 只允许数字和小数点
						if (value === '' || /^\d*\.?\d*$/.test(value)) {
							// 确保不以小数点开头，如果是则添加0
							const formattedValue = value.startsWith('.') ? '0' + value : value;
							setInputAmount(formattedValue);
							setSelectedAmount(null);
						}
					}}
					startContent={<div className="shrink-0 flex items-center gap-[4px] pl-[4px]">
						<BNBIcon className="w-[20px] h-[20px]" />
						<div className="text-[16px] text-[#fff]">BNB</div>
					</div>}
				/>
				<div className="h-[48px] flex items-center justify-between border-dashed border-b-[1px] border-[#25262A]">
					<div className="text-[12px] text-[#868789] flex items-center gap-[3px]">
						<span className="text-[#94989F]">Bal:</span>
						<>{formatBigNumber(balance)} BNB</>
					</div>
					<div className="flex items-center justify-end gap-[8px] flex-1">
						{buyAmounts.map((amount) => (
							<div
								key={amount.label}
								className={`h-[24px] w-[52px] flex items-center justify-center text-[12px] rounded-[8px] transition-colors ${
									isPaused 
										? 'bg-[#25262A] text-[#868789] cursor-not-allowed' 
										: 'bg-[#303135] text-[#FFF] hover:bg-[#3A3B40] cursor-pointer'
								}`}
								onClick={() => !isPaused && handleAmountSelect(amount)}
							>
								+ {amount.label}
							</div>
						))}
					</div>
				</div>

				<div className="pt-[12px] pb-[16px] text-[13px] text-[#868789]">
					<div className="flex items-center justify-between">
						Blocks
						<div>
							<span className="text-[#FFF]">x {selectedCells.length}</span>
						</div>
					</div>
					<div className="flex items-center justify-between mt-[8px]">
						Total<span className="text-[#FFF]">{inputAmount ? (parseFloat(inputAmount) * selectedCells.length).toFixed(2) : 0} ORE</span>
					</div>
				</div>
				<Button
					fullWidth
					className={`h-[44px] text-[15px] text-[#0D0F13] bg-[#fff] rounded-[22px]`}
					onPress={() => { handleClick(info?.mint, inputAmount) }}
					isLoading={isLoading}
					isDisabled={isLoading || !inputAmount || parseFloat(inputAmount) <= 0 || isPaused}
				>
					Deploy {inputAmount ? inputAmount : 0} ORE
				</Button>
			</div>
		</div>
	)
}