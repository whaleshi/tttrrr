import { Head } from "./head";

import Footer from "@/components/footer";

export default function DefaultLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			<Head />
			{children}
			<Footer />
		</>
	);
}
