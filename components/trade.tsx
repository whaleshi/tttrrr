import { Button, Input } from "@heroui/react"
import React, { useEffect, useState } from "react";
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
import { customToast, customToastPersistent, dismissToast } from "./customToast";
import { useTranslation } from "react-i18next";
import usePrivyLogin from "@/hooks/usePrivyLogin";

type TradeType = 'manual' | 'auto';

interface TradeProps {
	selectedCells?: number[];
	roundInfo?: any;
}

export const Trade = ({ selectedCells = [], roundInfo }: TradeProps) => {
	const { t } = useTranslation();
	const { toLogin } = usePrivyLogin();
	const [selectedTab, setSelectedTab] = useState('manual');
	const [isLoading, setIsLoading] = useState(false);
	const [blockAmount, setBlockAmount] = useState('');
	const [roundAmount, setRoundAmount] = useState('');
	const [inputAmount, setInputAmount] = useState('');

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
		setInputAmount('');
	};


	const buyAmounts = [
		{ label: "0.2", value: 0.2 },
		{ label: "0.5", value: 0.5 },
		{ label: "1", value: 1 }
	];

	const handleAmountSelect = (amount: { label: string; value: number }) => {
		setInputAmount(amount.value.toString());
	};



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
		const totalRequired = totalDeploy;

		// 检查余额是否足够
		const totalRequiredFormatted = ethers.formatEther(totalRequired);
		if (_bignumber(totalRequiredFormatted).gt(balance)) {
			customToast({
				title: t('Home.insufficientBalance'),
				type: 'error'
			});
			setIsLoading(false);
			return;
		}

		let loadingToastId: any = null;

		try {
			// 显示loading提示
			loadingToastId = customToastPersistent({
				title: t('Common.waitingForSignature'),
				type: 'loading'
			});

			console.log('选择的格子:', selectedSquares);
			console.log('Mask:', mask);
			console.log('每格金额:', amountPerSquare, 'ETH');
			console.log('总部署金额:', ethers.formatEther(totalDeploy), 'ETH');
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

			// 关闭loading toast
			if (loadingToastId) {
				dismissToast(loadingToastId);
			}

			// 显示成功提示
			customToast({
				title: t('Common.transactionConfirmed'),
				description: <span onClick={() => window.open(`https://bscscan.com/tx/${tx.hash}`, '_blank')} className="cursor-pointer hover:underline">{t('Common.viewOnBscscan')}</span>,
				type: 'success'
			});

			// 异步等待交易确认（不阻塞UI）
			tx.wait().then((receipt: any) => {
				console.log('交易确认:', receipt);
			}).catch((waitError: any) => {
				console.error('交易确认失败:', waitError);
			});

		} catch (error) {
			console.error('部署格子失败:', error);

			// 关闭loading toast
			if (loadingToastId) {
				dismissToast(loadingToastId);
			}

			// 显示错误提示
			customToast({
				title: t('Common.transactionFailed'),
				description: <span onClick={() => deploySquares(selectedSquares, amountPerSquare)} className="cursor-pointer hover:underline">{t('Common.pleaseTryAgain')}</span>,
				type: 'error'
			});
		} finally {
			setIsLoading(false);
		}
	};

	// 注册自动化投注的函数
	const registerAutomation = async (selectedSquares: number[], amountPerSquare: string, rounds: string, blockCount?: string) => {

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
			const executorFee = config.executorFee || 0;

			const automation = {
				owner: address,
				balance: 0, // 会自动加上 msg.value
				botFee: 0,
				mask: mask,
				amountPerSquare: amountPerSquareWei,
				randomizeMask: randomizeMask,
				active: true
			};
			const roundsToFund = parseInt(rounds);
			const actualSquareCount = selectedSquares.length > 0 ? selectedSquares.length : (blockCount ? parseInt(blockCount) : 0);
			const costPerRound = automation.amountPerSquare * BigInt(actualSquareCount) + BigInt(executorFee);
			const totalFunding = costPerRound * BigInt(roundsToFund);
			// 检查余额是否足够
			const totalRequiredFormatted = ethers.formatEther(totalFunding);
			if (_bignumber(totalRequiredFormatted).gt(balance)) {
				customToast({
					title: t('Home.insufficientBalance'),
					type: 'error'
				});
				return;
			}

			setIsLoading(true);

			// 显示开始注册的loading提示
			loadingToastId = customToastPersistent({
				title: t('Common.waitingForSignature'),
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

			// 等待交易确认
			await tx.wait();
			if (loadingToastId) {
				dismissToast(loadingToastId);
			}

			customToast({
				title: t('Common.transactionConfirmed'),
				description: <span onClick={() => window.open(`https://bscscan.com/tx/${tx.hash}`, '_blank')} className="cursor-pointer hover:underline">{t('Common.viewOnBscscan')}</span>,
				type: 'success'
			});
			queryClient.invalidateQueries({ queryKey: ['automation'] });
			console.log('自动化注册确认');

		} catch (error) {
			console.error('注册自动化失败:', error);

			// 关闭 loading toast (如果已创建)
			if (loadingToastId) {
				dismissToast(loadingToastId);
			}

			customToast({
				title: t('Common.transactionFailed'),
				description: <span onClick={() => registerAutomation(selectedSquares, amountPerSquare, rounds, blockCount)} className="cursor-pointer hover:underline">{t('Common.pleaseTryAgain')}</span>,
				type: 'error'
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleClick = async (amount: string) => {

		// setIsLoading(true);
		if (!amount || parseFloat(amount) <= 0) {
			customToast({
				title: t('Home.amount'),
				type: 'error'
			});
			return;
		}

		// Auto模式下可以通过blockAmount输入数量，Manual模式下必须选择格子
		if (selectedTab === 'manual' && selectedCells.length === 0) {
			customToast({
				title: t('Home.noTerritorySelected'),
				type: 'error'
			});
			return;
		}

		if (selectedTab === 'auto' && selectedCells.length === 0 && (parseInt(blockAmount) || 0) === 0) {
			customToast({
				title: t('Home.noTerritorySelected'),
				type: 'error'
			});
			return;
		}

		if (selectedTab === 'auto' && (parseInt(roundAmount) || 0) === 0) {
			customToast({
				title: t('Home.roundsRequired'),
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
			await registerAutomation(selectedCells, amount, roundAmount, blockAmount);
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
						{t('Home.manual')}
					</div>
					<div
						className={`flex-1 rounded-[8px] text-[13px] flex items-center justify-center cursor-pointer transition-all duration-200 ${selectedTab === 'auto'
							? 'bg-[#303135] text-[#fff]'
							: 'bg-[#25262A] text-[#868789] hover:bg-[#303135]'
							}`}
						onClick={() => handleTabClick('auto')}
					>
						{t('Home.auto')}
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
						// 只允许数字和小数点，最多8位小数
						if (value === '' || /^\d*\.?\d{0,6}$/.test(value)) {
							// 确保不以小数点开头，如果是则添加0
							const formattedValue = value.startsWith('.') ? '0' + value : value;
							setInputAmount(formattedValue);
						}
					}}
					startContent={<div className="shrink-0 flex items-center gap-[4px] pl-[4px]">
						<BNBIcon className="w-[20px] h-[20px]" />
						<div className="text-[16px] text-[#fff]">BNB</div>
					</div>}
				/>
				<div className="h-[48px] flex items-center justify-between border-dashed border-b-[1px] border-[#25262A]">
					<div className="text-[12px] text-[#868789] flex items-center gap-[3px]">
						<span className="text-[#94989F]">{t('Home.balance')}:</span>
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
							<span className="text-[14px] text-[#fff]">{t('Home.blocks')}</span>
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
							<span className="text-[14px] text-[#fff]">{t('Home.rounds')}</span>
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
						{t('Home.blocks')}
						<div className="w-[70%] text-right">
							{selectedTab === 'auto' ? (
								<span className="text-[#FFF]">
									{selectedCells.length > 0
										? selectedCells.sort((a, b) => a - b).map(cellIndex => `#${cellIndex + 1}`).join(', ')
										: (parseInt(blockAmount) || 0) === 0 ? t('Home.random') : `${t('Home.random')} x${parseInt(blockAmount)}`
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
								{t('Home.totalPerRound')}<span className="text-[#FFF]">{inputAmount ? BigNumber(inputAmount).multipliedBy(selectedCells.length > 0 ? selectedCells.length : parseInt(blockAmount) || 0).dp(6).toFixed() : '0'} BNB</span>
							</div>
							<div className="flex items-center justify-between mt-[8px]">
								{t('Home.totalDeployed')}<span className="text-[#FFF]">{inputAmount && roundAmount ? BigNumber(inputAmount).multipliedBy(selectedCells.length > 0 ? selectedCells.length : parseInt(blockAmount) || 0).multipliedBy(parseInt(roundAmount) || 1).dp(6).toFixed() : '0'} BNB</span>
							</div>
						</>
					)}
					{selectedTab === 'manual' && (
						<div className="flex items-center justify-between mt-[8px]">
							{t('Home.totalDeployed')}<span className="text-[#FFF]">{inputAmount ? BigNumber(inputAmount).multipliedBy(selectedCells.length).dp(6).toFixed() : '0'} BNB</span>
						</div>
					)}
				</div>
				{!isConnected ? (
					<Button
						fullWidth
						className="h-[44px] text-[15px] text-[#0D0F13] bg-[#fff] rounded-[22px]"
						onPress={toLogin}
					>
						{t('Header.connectWallet')}
					</Button>
				) : (
					<Button
						fullWidth
						className={`h-[44px] text-[15px] text-[#0D0F13] bg-[#fff] rounded-[22px]`}
						onPress={() => { handleClick(inputAmount) }}
						isLoading={isLoading}
						isDisabled={isLoading || !inputAmount || parseFloat(inputAmount) <= 0 || (selectedTab === 'manual' && roundInfo?.gameState !== 1)}
					>
						{(selectedTab === 'manual' && roundInfo?.gameState !== 1) ? (
							t('Home.waitingForRound')
						) : (
							<>{t('Home.deploy')} {
								selectedTab === 'auto'
									? (inputAmount && roundAmount ?
										BigNumber(inputAmount)
											.multipliedBy(selectedCells.length > 0 ? selectedCells.length : parseInt(blockAmount) || 0)
											.multipliedBy(parseInt(roundAmount) || 1)
											.dp(6).toFixed()
										: '0')
									: (inputAmount ?
										BigNumber(inputAmount)
											.multipliedBy(selectedCells.length)
											.dp(6).toFixed()
										: '0')
							} BNB</>
						)}
					</Button>
				)}
			</div>
		</div>
	)
}