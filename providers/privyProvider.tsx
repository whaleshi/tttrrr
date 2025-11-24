"use client";
import { PrivyProvider } from '@privy-io/react-auth';
import { CHAINS_CONFIG } from '@/config/chains';

export default function PrivyProviders({ children }: { children: React.ReactNode }) {
	const privyId = process.env.NEXT_PUBLIC_PRIVY_ID;
	return (
		<PrivyProvider
			appId={privyId as string}
			config={{
				"appearance": {
					accentColor: "#EFC462",
					theme: "#0D0F13",
					"showWalletLoginFirst": true,
					logo: "https://newgame.mypinata.cloud/ipfs/bafkreieh5d3r77jblc6hqycuhwaa6b3blefrfi6soqwwlhufy6w5sea2jm",
					walletChainType: "ethereum-only",
					"walletList": [
						"binance",
						"okx_wallet",
						"metamask",
						// "detected_wallets",
					]
				},
				"loginMethods": ["wallet"],
				defaultChain: CHAINS_CONFIG.DEFAULT_CHAIN,
				// 将只读数组转换为可变数组以满足类型要求
				supportedChains: [...CHAINS_CONFIG.SUPPORTED_CHAINS] as any,
				"fundingMethodConfig": {
					"moonpay": {
						"useSandbox": true
					}
				},
				"embeddedWallets": {
					"showWalletUIs": false,
					"ethereum": {
						"createOnLogin": "off"
					},
					"solana": {
						"createOnLogin": "off"
					}
				},
				"mfa": {
					"noPromptOnMfaRequired": false
				},
				"externalWallets": {}
			}}
		>
			{children}
		</PrivyProvider>
	);
}