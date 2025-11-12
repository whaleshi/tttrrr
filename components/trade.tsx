import { Button, Input } from "@heroui/react"
import React, { useEffect, useState } from "react";
import MyAvatar from "@/components/avatarImage";
import { BNBIcon, SetIcon, BlockIcon, RoundIcon } from "./icons";
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

type TradeType = 'manual' | 'auto';


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

export const Trade = ({ selectedCells = [], inputAmount = '', setInputAmount = () => { }, onDeploy, isPaused = false, info, tokenBalance, initialTab = 'manual' }: TradeProps) => {
	const [isBuy, setIsBuy] = useState(initialTab === 'manual');
	const [selectedTab, setSelectedTab] = useState(initialTab);
	const [isSlippageOpen, setIsSlippageOpen] = useState(false);
	const [outputAmount, setOutputAmount] = useState("");
	const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [blockAmount, setBlockAmount] = useState('');
	const [roundAmount, setRoundAmount] = useState('');

	// 同步blockAmount与selectedCells数量
	useEffect(() => {
		if (selectedCells.length > 0) {
			setBlockAmount(selectedCells.length.toString());
		}
	}, [selectedCells.length]);

	// 计算输入框宽度
	const getInputWidth = (value: string) => {
		const length = value.length || 1; // 至少1个字符宽度
		return Math.max(30, length * 12); // 每个字符约12px，初始最小宽度30px
	};
	const { balance } = useBalanceContext();
	const queryClient = useQueryClient();

	const { ready } = usePrivy();
	const { wallets } = useWallets();
	const { isLoggedIn, address } = useAuthStore();
	const isConnected = ready && isLoggedIn && !!address;
	const wallet = address ? wallets.find((w) => w.address?.toLowerCase() === address.toLowerCase()) : null;

	const handleTabClick = (tab: TradeType) => {
		setSelectedTab(tab as TradeType);
		setIsBuy(tab === 'manual');
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
		setInputAmount(amount.value.toString());
	};


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

		// Auto模式下可以通过blockAmount输入数量，Manual模式下必须选择格子
		if (selectedTab === 'manual' && selectedCells.length === 0) {
			toast.error("请选择至少一个格子");
			return;
		}

		if (selectedTab === 'auto' && selectedCells.length === 0 && (parseInt(blockAmount) || 0) === 0) {
			toast.error("请选择格子或输入块数量");
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
						className={`flex-1 rounded-[8px] text-[13px] flex items-center justify-center cursor-pointer transition-all duration-200 ${selectedTab === 'manual'
							? 'bg-[#303135] text-[#fff]'
							: 'bg-[#25262A] text-[#868789] hover:bg-[#303135]'
							}`}
						onClick={() => handleTabClick('manual')}
					>
						Manual
					</div>
					<div
						className={`flex-1 rounded-[8px] text-[13px] flex items-center justify-center cursor-pointer transition-all duration-200 ${selectedTab === 'auto'
							? 'bg-[#303135] text-[#fff]'
							: 'bg-[#25262A] text-[#868789] hover:bg-[#303135]'
							}`}
						onClick={() => handleTabClick('auto')}
					>
						Auto
					</div>
				</div>
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
								className={`h-[24px] w-[52px] flex items-center justify-center text-[12px] rounded-[8px] transition-colors bg-[#303135] text-[#FFF] hover:bg-[#3A3B40] cursor-pointer`}
								onClick={() => handleAmountSelect(amount)}
							>
								+ {amount.label}
							</div>
						))}
					</div>
				</div>
				{selectedTab === 'auto' && (
					<div className="border-dashed border-b-[1px] border-[#25262A]">
						<div className="flex items-center gap-[6px] mt-[12px] mb-[12px]">
							<BlockIcon />
							<span className="text-[14px] text-[#fff]">Blocks</span>
							<div className="flex-1 w-full"></div>
							<Input
								style={{
									width: `${getInputWidth(blockAmount)}px`,
									maxWidth: `${getInputWidth(blockAmount)}px`,
									minWidth: '30px'
								}}
								classNames={{
									base: "!w-auto",
									mainWrapper: "!w-auto",
									inputWrapper: "min-h-[30px] h-[30px] !border-[#25262A] bg-[rgba(13,15,19,0.65)] !border-[1.5px] rounded-[8px] hover:!border-[#25262A] focus-within:!border-[#25262A]",
									input: "text-[16px] text-[#FFF] text-center font-semibold placeholder:text-[#868789] uppercase tracking-[-0.07px]",
								}}
								name="blockAmount"
								placeholder="0"
								variant="bordered"
								value={blockAmount}
								isDisabled={selectedCells.length > 0}
								onChange={(e) => {
									const value = e.target.value;
									// 只允许数字，最大25
									if (value === '' || (/^\d+$/.test(value) && parseInt(value) >= 0 && parseInt(value) <= 25)) {
										setBlockAmount(value);
									}
								}}
							/>
						</div>
						<div className="flex items-center gap-[6px] mb-[12px]">
							<RoundIcon />
							<span className="text-[14px] text-[#fff]">Rounds</span>
							<div className="flex-1"></div>
							<Input
								style={{
									width: `${getInputWidth(roundAmount)}px`,
									maxWidth: `${getInputWidth(roundAmount)}px`,
									minWidth: '30px'
								}}
								classNames={{
									base: "!w-auto",
									mainWrapper: "!w-auto",
									inputWrapper: "min-h-[30px] h-[30px] !border-[#25262A] bg-[rgba(13,15,19,0.65)] !border-[1.5px] rounded-[8px] hover:!border-[#25262A] focus-within:!border-[#25262A]",
									input: "text-[16px] text-[#FFF] text-center font-semibold placeholder:text-[#868789] uppercase tracking-[-0.07px]",
								}}
								name="roundAmount"
								placeholder="0"
								variant="bordered"
								value={roundAmount}
								isDisabled={false}
								onChange={(e) => {
									const value = e.target.value;
									// 只允许数字，最大9999
									if (value === '' || (/^\d+$/.test(value) && parseInt(value) >= 0 && parseInt(value) <= 9999)) {
										setRoundAmount(value);
									}
								}}
							/>
						</div>
					</div>
				)}
				<div className="pt-[12px] pb-[16px] text-[13px] text-[#868789]">
					<div className="flex items-center justify-between">
						Blocks
						<div className="w-[70%] text-right">
							{selectedTab === 'auto' ? (
								<span className="text-[#FFF]">
									{selectedCells.length > 0
										? selectedCells.sort((a, b) => a - b).map(cellIndex => `#${cellIndex + 1}`).join(', ')
										: (parseInt(blockAmount) || 0) === 0 ? 'Random' : `Random x${parseInt(blockAmount)}`
									}
								</span>
							) : (
								<span className="text-[#FFF]">x {selectedCells.length}</span>
							)}
						</div>
					</div>
					{selectedTab === 'auto' && (
						<>
							<div className="flex items-center justify-between mt-[8px]">
								Total per round<span className="text-[#FFF]">{inputAmount ? (parseFloat(inputAmount) * (selectedCells.length > 0 ? selectedCells.length : parseInt(blockAmount) || 0)).toFixed(2) : 0} BNB</span>
							</div>
							<div className="flex items-center justify-between mt-[8px]">
								Total<span className="text-[#FFF]">{inputAmount && roundAmount ? (parseFloat(inputAmount) * (selectedCells.length > 0 ? selectedCells.length : parseInt(blockAmount) || 0) * parseInt(roundAmount || '1')).toFixed(2) : 0} BNB</span>
							</div>
						</>
					)}
					{selectedTab === 'manual' && (
						<div className="flex items-center justify-between mt-[8px]">
							Total<span className="text-[#FFF]">{inputAmount ? (parseFloat(inputAmount) * selectedCells.length).toFixed(2) : 0} BNB</span>
						</div>
					)}
				</div>
				<Button
					fullWidth
					className={`h-[44px] text-[15px] text-[#0D0F13] bg-[#fff] rounded-[22px]`}
					onPress={() => { handleClick(info?.mint, inputAmount) }}
					isLoading={isLoading}
					isDisabled={isLoading || !inputAmount || parseFloat(inputAmount) <= 0 || isPaused}
				>
					Deploy {
						selectedTab === 'auto'
							? (inputAmount && roundAmount ? (parseFloat(inputAmount) * (selectedCells.length > 0 ? selectedCells.length : parseInt(blockAmount) || 0) * parseInt(roundAmount || '1')).toFixed(2) : 0)
							: (inputAmount ? (parseFloat(inputAmount) * selectedCells.length).toFixed(2) : 0)
					} BNB
				</Button>
			</div>
		</div>
	)
}