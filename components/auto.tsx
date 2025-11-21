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


interface AutoProps {
	info?: any;
}

export const Auto = ({ info }: AutoProps) => {
	const [isLoading, setIsLoading] = useState(false);


	const { balance } = useBalanceContext();
	const queryClient = useQueryClient();

	const { ready } = usePrivy();
	const { wallets } = useWallets();
	const { isLoggedIn, address } = useAuthStore();
	const isConnected = ready && isLoggedIn && !!address;
	const wallet = address ? wallets.find((w) => w.address?.toLowerCase() === address.toLowerCase()) : null;




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

	// 停止自动化挖矿功能
	const stopAutomation = async () => {
		if (!signer || !provider) {
			customToast({
				title: '钱包未连接',
				description: '请先连接您的钱包',
				type: 'error'
			});
			return;
		}

		setIsLoading(true);
		let loadingToastId: any = null;

		try {
			// 创建合约实例
			const oreProtocolContract = new ethers.Contract(
				CONTRACT_CONFIG.ORE_CONTRACT,
				OreProtocolABI.abi,
				signer
			);

			// 显示loading提示
			loadingToastId = customToastPersistent({
				title: 'Stopping automation...',
				type: 'loading'
			});

			// 估算gas
			const estimatedGas = await oreProtocolContract.stopAutomation.estimateGas();
			
			// 增加20%的gas buffer
			const gasLimit = (estimatedGas * BigInt(120)) / BigInt(100);
			
			console.log('stopAutomation 估算 gas:', estimatedGas.toString());
			console.log('stopAutomation 设置 gas limit:', gasLimit.toString());

			// 调用stopAutomation方法
			const tx = await oreProtocolContract.stopAutomation({ gasLimit: gasLimit });
			await tx.wait();

			// 关闭loading toast
			if (loadingToastId) {
				dismissToast(loadingToastId);
			}

			customToast({
				title: '自动化已停止！',
				description: <span onClick={() => window.open(`https://bscscan.com/tx/${tx.hash}`, '_blank')} className="cursor-pointer hover:underline">View on Bscscan {">"}</span>,
				type: 'success'
			});

			// 立即刷新自动化配置数据
			queryClient.invalidateQueries({ queryKey: ['automation'] });

		} catch (error) {
			console.error('停止自动化失败:', error);

			// 关闭loading toast
			if (loadingToastId) {
				dismissToast(loadingToastId);
			}

			customToast({
				title: '停止失败',
				description: `错误详情: ${error}`,
				type: 'error'
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="w-full bg-[#191B1F] rounded-[8px] p-[12px]">
			<div className="w-full">
				<div className="h-[40px] bg-[#25262A] rounded-[8px] flex mb-[16px]">
					<div className={`flex-1 rounded-[8px] text-[13px] flex items-center justify-center cursor-pointer transition-all duration-200 bg-[#303135] text-[#fff]`}>
						Autominer
					</div>
				</div>
				<div className="pt-[12px] pb-[16px] text-[13px] text-[#868789]">
					<div className="flex items-center justify-between">
						Blocks
						<div className="w-[70%] text-right">
							<span className="text-[#FFF]">x 0</span>
						</div>
					</div>
					<div className="flex items-center justify-between mt-[8px]">
						Round remaining<span className="text-[#FFF]">1</span>
					</div>
					<div className="flex items-center justify-between mt-[8px]">
						Total per round<span className="text-[#FFF]">1 BNB</span>
					</div>
				</div>
				<Button
					fullWidth
					className={`h-[44px] text-[15px] text-[#0D0F13] bg-[#fff] rounded-[22px]`}
					onPress={stopAutomation}
					isLoading={isLoading}
					isDisabled={isLoading}
				>
					Stop autominer
				</Button>
			</div>
		</div>
	)
}