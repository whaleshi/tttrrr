import { bsc, bscTestnet } from "wagmi/chains";
const isProd = process.env.NEXT_PUBLIC_APP_ENV === "production";
export const CHAINS_CONFIG = {
    // 默认链 - 修改这里即可切换整个应用的默认网络
    DEFAULT_CHAIN: isProd ? bsc : bscTestnet,

    // 支持的链列表 - 按优先级排序
    SUPPORTED_CHAINS: [bsc, bscTestnet],

    // 链相关配置
    CHAIN_CONFIG: {
        [97]: {
            name: "BNB Smart Chain Testnet",
            symbol: "tBNB",
            explorerUrl: "https://testnet.bscscan.com",
            rpcUrl: "https://delicate-old-breeze.bsc-testnet.quiknode.pro/4e8edc72f64856f8e8fa3377a81c9f3a1f6b5dee/",
            // rpcUrl: "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
            readOreContract: "0x08280ae8d23016f907ECAdAC9CB154b232dE2Ff2",
            oreContract: "0x8Ba8B7d54a6be64c43aA4D335C868Def77073504",
            ori: "0xfb7148534c76ecfc4ccd1d004a4689194466c1c6",
        },
        [56]: {
            name: "BNB Smart Chain",
            symbol: "BNB",
            explorerUrl: "https://bscscan.com",
            rpcUrl: "https://silent-few-meme.bsc.quiknode.pro/ee75800d48bd6244538a996a18a836a986e0add9/",
            readOreContract: "0x2e611CCBc67B007a894b4276De89663df442fE56",
            oreContract: "",
            ori: "",
        },
    },
} as const;

// 导出常用的配置
export const DEFAULT_CHAIN_ID = CHAINS_CONFIG.DEFAULT_CHAIN.id;
export const DEFAULT_CHAIN_CONFIG = CHAINS_CONFIG.CHAIN_CONFIG[DEFAULT_CHAIN_ID as keyof typeof CHAINS_CONFIG.CHAIN_CONFIG];

// 合约地址配置
export const CONTRACT_CONFIG = {
    // 工厂合约地址 - 用于创建新代币
    READ_ORE_CONTRACT: CHAINS_CONFIG.CHAIN_CONFIG[DEFAULT_CHAIN_ID as keyof typeof CHAINS_CONFIG.CHAIN_CONFIG].readOreContract,
    ORE_CONTRACT: CHAINS_CONFIG.CHAIN_CONFIG[DEFAULT_CHAIN_ID as keyof typeof CHAINS_CONFIG.CHAIN_CONFIG].oreContract,
} as const;

// Mint/Refund 相关配置
export const TRANSACTION_CONFIG = {
    MINT_FEE: "0.12", // ETH/BNB/OKB 等
    REFUND_FEE: "0.02",
    MINT_TARGET: 800, // 目标mint次数
} as const;

// Multicall3 合约地址 (通用地址，大多数链都支持)
export const MULTICALL3_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";

// Multicall3 ABI
export const MULTICALL3_ABI = [
    {
        inputs: [
            {
                components: [
                    { internalType: "address", name: "target", type: "address" },
                    { internalType: "bool", name: "allowFailure", type: "bool" },
                    { internalType: "bytes", name: "callData", type: "bytes" },
                ],
                internalType: "struct Multicall3.Call3[]",
                name: "calls",
                type: "tuple[]",
            },
        ],
        name: "aggregate3",
        outputs: [
            {
                components: [
                    { internalType: "bool", name: "success", type: "bool" },
                    { internalType: "bytes", name: "returnData", type: "bytes" },
                ],
                internalType: "struct Multicall3.Result[]",
                name: "returnData",
                type: "tuple[]",
            },
        ],
        stateMutability: "payable",
        type: "function",
    },
];
