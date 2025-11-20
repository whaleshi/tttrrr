import { Button, Input } from "@heroui/react"
import React, { useEffect, useState } from "react";
import MyAvatar from "@/components/avatarImage";
import { BNBIcon, SetIcon, BlockIcon, RoundIcon } from "./icons";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import OreProtocolABI from "@/constant/OreProtocol.json";
import { DEFAULT_CHAIN_CONFIG, CONTRACT_CONFIG } from "@/config/chains";
import { ethers } from "ethers";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useAuthStore } from "@/stores/auth";
import { formatBigNumber } from "@/utils/formatBigNumber";
import { useBalanceContext } from "@/providers/balanceProvider";
import _bignumber from "bignumber.js";
const BigNumber = _bignumber;
import { useSlippageStore } from "@/stores/slippage";
import { customToast, customToastPersistent, dismissToast } from "./customToast";

type TradeType = 'manual' | 'auto';


interface TradeProps {
	selectedCells?: number[];
	inputAmount?: string;
	setInputAmount?: (amount: string) => void;
	onDeploy?: (amount: string) => void;
	tokenBalance?: any;
	initialTab?: string;
	roundId?: number | null;
}

export const Trade = ({ selectedCells = [], inputAmount = '', setInputAmount = () => { }, onDeploy, tokenBalance, initialTab = 'manual', roundId }: TradeProps) => {
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

	// 部署格子的函数
	const deploySquares = async (selectedSquares: number[], amountPerSquare: string) => {
		if (!signer || !provider) {
			customToast({
				title: '钱包未连接',
				description: '请先连接您的钱包',
				type: 'error'
			});
			return;
		}
		setIsLoading(true);
		// 创建合约实例
		const oreProtocolContract = new ethers.Contract(
			CONTRACT_CONFIG.ORE_CONTRACT,
			OreProtocolABI.abi,
			signer
		);

		// 计算 mask
		let mask = 0;
		selectedSquares.forEach(index => {
			mask |= (1 << index);
		});

		const amountPerSquareWei = ethers.parseEther(amountPerSquare);

		// 计算总费用
		const squareCount = selectedSquares.length;
		const totalDeploy = amountPerSquareWei * BigInt(squareCount);

		let loadingToastId: any = null;

		try {
			// 获取检查点费用
			const config = await oreProtocolContract.config();
			const checkpointFee = config.checkpointFee || 0;
			console.log(checkpointFee, '---')
			const totalRequired = totalDeploy + BigInt(checkpointFee);

			// 检查余额是否足够
			const totalRequiredFormatted = ethers.formatEther(totalRequired);
			if (_bignumber(totalRequiredFormatted).gt(balance)) {
				customToast({
					title: '余额不足',
					description: `需要 ${totalRequiredFormatted} BNB，当前余额 ${formatBigNumber(balance)} BNB`,
					type: 'error'
				});
				setIsLoading(false);
				return;
			}



			// 显示开始部署的loading提示
			loadingToastId = customToastPersistent({
				title: 'Waiting for signature...',
				type: 'loading'
			});

			console.log('选择的格子:', selectedSquares);
			console.log('Mask:', mask);
			console.log('每格金额:', amountPerSquare, 'ETH');
			console.log('总部署金额:', ethers.formatEther(totalDeploy), 'ETH');
			console.log('检查点费用:', ethers.formatEther(checkpointFee), 'ETH');
			console.log('总需要金额:', ethers.formatEther(totalRequired), 'ETH');

			// 估算 gas
			const estimatedGas = await oreProtocolContract.deployManual.estimateGas(
				mask,
				amountPerSquareWei,
				{
					value: totalRequired
				}
			);

			// 增加 20% 的 gas buffer
			const gasLimit = (estimatedGas * BigInt(120)) / BigInt(100);

			console.log('估算 gas:', estimatedGas.toString());
			console.log('设置 gas limit:', gasLimit.toString());

			// 调用合约
			const tx = await oreProtocolContract.deployManual(mask, amountPerSquareWei, {
				value: totalRequired,
				gasLimit: gasLimit
			});

			// 关闭 loading toast (如果已创建)
			if (loadingToastId) {
				dismissToast(loadingToastId);
			}

			customToast({
				title: 'Transaction confirmed',
				description: <span onClick={() => window.open(`https://bscscan.com/tx/${tx.hash}`, '_blank')} className="cursor-pointer hover:underline">View on Bscscan {">"}</span>,
				type: 'success'
			});

			tx.wait().then((receipt: any) => {
				console.log(receipt);
			}).catch((error: any) => {
				console.error(error);
			});



		} catch (error) {
			console.error('部署格子失败:', error);

			// 关闭 loading toast (如果已创建)
			if (loadingToastId) {
				dismissToast(loadingToastId);
			}

			customToast({
				title: '部署失败',
				description: `错误详情: ${error}`,
				type: 'error'
			});
		} finally {
			setIsLoading(false);
		}
	};

	// 注册自动化投注的函数
	const registerAutomation = async (selectedSquares: number[], amountPerSquare: string, rounds: string, blockCount?: string) => {
		if (!signer || !provider) {
			customToast({
				title: '钱包未连接',
				description: '请先连接您的钱包',
				type: 'error'
			});
			return;
		}

		// 创建合约实例
		const oreProtocolContract = new ethers.Contract(
			CONTRACT_CONFIG.ORE_CONTRACT,
			OreProtocolABI.abi,
			signer
		);

		// 计算 mask 和 randomizeMask
		let mask = 0;
		let randomizeMask = false;

		if (selectedSquares.length > 0) {
			// 有选中的格子，计算具体的mask
			selectedSquares.forEach(index => {
				mask |= (1 << index);
			});
			randomizeMask = false;
		} else if (blockCount && parseInt(blockCount) > 0) {
			// 没有选中格子但有blockAmount，mask传数量，设置随机模式
			mask = parseInt(blockCount);
			randomizeMask = true;
		}

		const amountPerSquareWei = ethers.parseEther(amountPerSquare);

		let loadingToastId: any = null;

		try {
			// 获取检查点费用
			const config = await oreProtocolContract.config();
			const checkpointFee = config.checkpointFee || 0;

			const automation = {
				owner: address,
				balance: 0, // 会自动加上 msg.value
				mask: mask,
				amountPerSquare: amountPerSquareWei,
				feePerCall: ethers.parseEther("0.001"), // 给 Bot 的费用
				randomizeMask: randomizeMask,
				active: true
			};

			// 预存轮次费用
			const roundsToFund = parseInt(rounds);
			// 计算实际的格子数量
			const actualSquareCount = selectedSquares.length > 0 ? selectedSquares.length : (blockCount ? parseInt(blockCount) : 0);
			const costPerRound =
				automation.amountPerSquare * BigInt(actualSquareCount) + // 总投注
				BigInt(checkpointFee) +                     // checkpoint 费用
				automation.feePerCall;              // Bot 费用
			const totalFunding = costPerRound * BigInt(roundsToFund);

			// 检查余额是否足够
			const totalRequiredFormatted = ethers.formatEther(totalFunding);
			if (_bignumber(totalRequiredFormatted).gt(balance)) {
				customToast({
					title: '余额不足',
					description: `需要 ${totalRequiredFormatted} BNB，当前余额 ${formatBigNumber(balance)} BNB`,
					type: 'error'
				});
				return;
			}

			setIsLoading(true);

			// 显示开始注册的loading提示
			loadingToastId = customToastPersistent({
				title: 'Waiting for signature...',
				type: 'loading'
			});

			console.log('注册自动化参数:', automation);
			console.log('总预存金额:', ethers.formatEther(totalFunding), 'BNB');

			// 估算 gas
			const estimatedGas = await oreProtocolContract.registerAutomation.estimateGas(
				automation,
				{
					value: totalFunding
				}
			);

			// 增加 20% 的 gas buffer
			const gasLimit = (estimatedGas * BigInt(120)) / BigInt(100);

			console.log('估算 gas:', estimatedGas.toString());
			console.log('设置 gas limit:', gasLimit.toString());

			// 调用合约
			const tx = await oreProtocolContract.registerAutomation(automation, {
				value: totalFunding,
				gasLimit: gasLimit
			});

			// 关闭 loading toast (如果已创建)
			if (loadingToastId) {
				dismissToast(loadingToastId);
			}

			customToast({
				title: 'Automation registered',
				description: <span onClick={() => window.open(`https://bscscan.com/tx/${tx.hash}`, '_blank')} className="cursor-pointer hover:underline">View on Bscscan {">"}</span>,
				type: 'success'
			});

			tx.wait().then((receipt: any) => {
				queryClient.invalidateQueries({ queryKey: ['automation'] });
				console.log(receipt);
			}).catch((error: any) => {
				console.error(error);
			});

		} catch (error) {
			console.error('注册自动化失败:', error);

			// 关闭 loading toast (如果已创建)
			if (loadingToastId) {
				dismissToast(loadingToastId);
			}

			customToast({
				title: '注册失败',
				description: `错误详情: ${error}`,
				type: 'error'
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleClick = async (amount: string) => {
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
			customToast({
				title: '输入错误',
				description: '请输入有效金额',
				type: 'error'
			});
			return;
		}

		// Auto模式下可以通过blockAmount输入数量，Manual模式下必须选择格子
		if (selectedTab === 'manual' && selectedCells.length === 0) {
			customToast({
				title: '选择错误',
				description: '请选择至少一个格子',
				type: 'error'
			});
			return;
		}

		if (selectedTab === 'auto' && selectedCells.length === 0 && (parseInt(blockAmount) || 0) === 0) {
			customToast({
				title: '操作错误',
				description: '请选择格子或输入块数量',
				type: 'error'
			});
			return;
		}

		// 根据选择的模式调用不同的方法
		if (selectedTab === 'manual') {
			// 手动模式：部署格子到合约
			await deploySquares(selectedCells, amount);
		} else if (selectedTab === 'auto') {
			// 自动模式：注册自动化投注
			await registerAutomation(selectedCells, amount, roundAmount || '1', blockAmount);
		}
		// onDeploy?.(amount);
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
								Total per round<span className="text-[#FFF]">{inputAmount ? BigNumber(inputAmount).multipliedBy(selectedCells.length > 0 ? selectedCells.length : parseInt(blockAmount) || 0).dp(8).toString() : '0'} BNB</span>
							</div>
							<div className="flex items-center justify-between mt-[8px]">
								Total<span className="text-[#FFF]">{inputAmount && roundAmount ? BigNumber(inputAmount).multipliedBy(selectedCells.length > 0 ? selectedCells.length : parseInt(blockAmount) || 0).multipliedBy(parseInt(roundAmount) || 1).dp(8).toString() : '0'} BNB</span>
							</div>
						</>
					)}
					{selectedTab === 'manual' && (
						<div className="flex items-center justify-between mt-[8px]">
							Total<span className="text-[#FFF]">{inputAmount ? BigNumber(inputAmount).multipliedBy(selectedCells.length).dp(8).toString() : '0'} BNB</span>
						</div>
					)}
				</div>
				<Button
					fullWidth
					className={`h-[44px] text-[15px] text-[#0D0F13] bg-[#fff] rounded-[22px]`}
					onPress={() => { handleClick(inputAmount) }}
					isLoading={isLoading}
					isDisabled={isLoading || !inputAmount || parseFloat(inputAmount) <= 0}
				>
					Deploy {
						selectedTab === 'auto'
							? (inputAmount && roundAmount ?
								BigNumber(inputAmount)
									.multipliedBy(selectedCells.length > 0 ? selectedCells.length : parseInt(blockAmount) || 0)
									.multipliedBy(parseInt(roundAmount) || 1)
									.dp(8).toString()
								: '0')
							: (inputAmount ?
								BigNumber(inputAmount)
									.multipliedBy(selectedCells.length)
									.dp(8).toString()
								: '0')
					} BNB
				</Button>
			</div>
		</div>
	)
}