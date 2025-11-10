import { Link } from "@heroui/link";

import { Head } from "./head";

import { Navbar } from "@/components/navbar";

export default function DefaultLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="relative flex flex-col h-screen bg-[#0D0F13]">
			<Head />
			<Navbar />
			<main className="mx-auto w-full flex-grow pt-[56px] md:pt-[64px]">
				{children}
			</main>
		</div>
	);
}
