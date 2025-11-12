import CreateForm from "@/components/form";
import { AccorIcon, BackIcon } from "@/components/icons";
import DefaultLayout from "@/layouts/default";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Accordion, AccordionItem } from "@heroui/react";

export default function AboutPage() {
	const router = useRouter();


	return (
		<DefaultLayout>
			<section className="flex flex-col items-center justify-center w-full px-[14px] max-w-[600px] mx-auto">
				<div className="text-[28px] font-bold text-[#fff] w-full pt-[24px]">About</div>
				<div className="text-[14px] text-[#868789] w-full mt-[2px]">Learn about the ORI</div>
				<style jsx global>{`
					[data-slot="title"] {
						font-size: 20px !important;
						font-weight: bold !important;
					}
					/* 隐藏HR分割线 */
					.px-0 hr {
						display: none !important;
					}
					.bg-divider {
						display: none !important;
					}
					/* 添加自定义虚线分割 */
					[data-slot="base"] {
						position: relative !important;
					}
					[data-slot="base"]:not(:last-child)::after {
						content: '' !important;
						position: absolute !important;
						bottom: 0 !important;
						left: 0 !important;
						right: 0 !important;
						height: 1px !important;
						background-image: repeating-linear-gradient(to right, #25262A 0px, #25262A 8px, transparent 8px, transparent 16px) !important;
					}
				`}</style>
				<Accordion className="px-0" defaultExpandedKeys={["1", "2"]}>
					<AccordionItem
						key="1"
						aria-label="1"
						title="Intro"
						indicator={<AccorIcon />}
					>
						<div className="text-[14px] text-[#868789] pb-[12px]"><span className="text-[#EFC462]">ORI</span> is a digital store of value on the <span className="text-[#EFC462]">Binance Chain</span></div>
					</AccordionItem>
					<AccordionItem
						key="2"
						aria-label="2"
						title="Mining"
						indicator={<AccorIcon />}
					>
						<div className="text-[14px] text-[#868789] pb-[12px]">Blockchains enable the creation of trustless digital currencies which do not depend on any central bank or issuing authority. As one of the fastest and most widely used blockchains in the world, Solana has become the ideal home for a new generation of digital assets and financial applications. While many other digital stores of value exist and provide immense value to their users, none are native to Solana, and thus rely on risky third-party intermediaries to use with protocols on Solana. BURY is designed from the ground up to serve as a Solana-native store of value with maximal freedom and minimal trust assumptions.</div>
					</AccordionItem>
					<AccordionItem
						key="3"
						aria-label="3"
						title="Staking"
						indicator={<AccorIcon />}
					>
						<div className="text-[14px] text-[#868789] pb-[12px]">Blockchains enable the creation of trustless digital currencies which do not depend on any central bank or issuing authority. As one of the fastest and most widely used blockchains in the world, Solana has become the ideal home for a new generation of digital assets and financial applications. While many other digital stores of value exist and provide immense value to their users, none are native to Solana, and thus rely on risky third-party intermediaries to use with protocols on Solana. BURY is designed from the ground up to serve as a Solana-native store of value with maximal freedom and minimal trust assumptions.</div>
					</AccordionItem>
					<AccordionItem
						key="4"
						aria-label="4"
						title="Tokenomics"
						indicator={<AccorIcon />}
					>
						<div className="text-[14px] text-[#868789] pb-[12px]">Blockchains enable the creation of trustless digital currencies which do not depend on any central bank or issuing authority. As one of the fastest and most widely used blockchains in the world, Solana has become the ideal home for a new generation of digital assets and financial applications. While many other digital stores of value exist and provide immense value to their users, none are native to Solana, and thus rely on risky third-party intermediaries to use with protocols on Solana. BURY is designed from the ground up to serve as a Solana-native store of value with maximal freedom and minimal trust assumptions.</div>
					</AccordionItem>
					<AccordionItem
						key="5"
						aria-label="5"
						title="Links"
						indicator={<AccorIcon />}
					>
						<div className="text-[14px] text-[#868789] pb-[12px]">Blockchains enable the creation of trustless digital currencies which do not depend on any central bank or issuing authority. As one of the fastest and most widely used blockchains in the world, Solana has become the ideal home for a new generation of digital assets and financial applications. While many other digital stores of value exist and provide immense value to their users, none are native to Solana, and thus rely on risky third-party intermediaries to use with protocols on Solana. BURY is designed from the ground up to serve as a Solana-native store of value with maximal freedom and minimal trust assumptions.</div>
					</AccordionItem>
				</Accordion>
			</section>
		</DefaultLayout>
	);
}
