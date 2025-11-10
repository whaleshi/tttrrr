import { Image, Button } from "@heroui/react"
import DefaultLayout from "@/layouts/default";
import { useRouter } from "next/router";
import NextImage from "next/image"
import { useState, useEffect } from "react"
import { siteConfig } from "@/config/site";
import Matrix from "@/components/matrix";

export default function IndexPage() {
	const router = useRouter();
	const [currentBanner, setCurrentBanner] = useState(0);

	// 3秒切换banner图片
	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentBanner(prev => prev === 0 ? 1 : 0);
		}, 3000);

		return () => clearInterval(interval);
	}, []);
	return (
		<DefaultLayout>
			<div className="flex flex-col h-full bg-[#0D0F13]">
				<section className="flex flex-col items-center justify-center gap-4 px-[14px] md:px-[120px]">
					<div className="w-full md:w-[500px]">
						<Matrix />
					</div>
				</section>
			</div>
		</DefaultLayout>
	);
}