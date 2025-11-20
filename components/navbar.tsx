import { Navbar as HeroUINavbar, NavbarContent, Button, useDisclosure, Drawer, DrawerContent, DrawerHeader, DrawerBody } from "@heroui/react";
import NextLink from "next/link";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router"
import { Image, Input } from "@heroui/react"
import NextImage from "next/image"
import { usePrivy } from "@privy-io/react-auth";
import usePrivyLogin from "@/hooks/usePrivyLogin";
import { useAuthStore } from "@/stores/auth";
import { shortenAddress, useIsMobile } from "@/utils";

import { CloseIcon, LogoIcon, LogoTextIcon, MenuCloseIcon, MenuIcon, SearchInputIcon, WalletIcon } from "@/components/icons";
import { WalletBox } from "./wallet";
import { siteConfig } from "@/config/site";
import { customToast } from "./customToast";


export const Navbar = () => {
	const router = useRouter();
	const { isOpen: isWalletDrawerOpen, onOpen: onWalletDrawerOpen, onOpenChange: onWalletDrawerOpenChange } = useDisclosure();
	const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
	const walletRef = useRef<HTMLDivElement>(null);

	const { authenticated, logout } = usePrivy();
	const { toLogin } = usePrivyLogin();
	const { isLoggedIn, address, clearAuthState, loginAccount } = useAuthStore();
	const isMobile = useIsMobile();

	const newLogin = async () => {
		if (authenticated) {
			clearAuthState();
			await logout();
		}
		toLogin();
	}

	// 监听路由变化，关闭弹窗
	useEffect(() => {
		const handleRouteChange = () => {
			// 同时关闭钱包抽屉
			if (isWalletDrawerOpen) {
				onWalletDrawerOpenChange();
			}
			// 关闭钱包下拉菜单
			setIsWalletDropdownOpen(false);
		};

		router.events.on('routeChangeStart', handleRouteChange);

		return () => {
			router.events.off('routeChangeStart', handleRouteChange);
		};
	}, [router.events, isWalletDrawerOpen, onWalletDrawerOpenChange]);

	// 监听登录状态变化，重置下拉菜单状态
	useEffect(() => {
		setIsWalletDropdownOpen(false);
	}, [isLoggedIn]);


	// 处理点击外部关闭下拉框
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (walletRef.current && !walletRef.current.contains(event.target as Node)) {
				setIsWalletDropdownOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);


	const handleWalletClick = () => {
		// 使用hook检查屏幕尺寸，PC上打开下拉菜单，H5上打开抽屉
		if (isMobile) {
			onWalletDrawerOpen();
		} else {
			setIsWalletDropdownOpen(!isWalletDropdownOpen);
		}
	};

	const test = () => {
		// 使用封装的 customToast
		customToast({
			title: 'Transaction Confirmed',
			// description: <span onClick={() => console.log('Description clicked!')} className="cursor-pointer hover:underline">View on Bscscan {">"}</span>,
			type: 'success'
		});
	}

	return (
		<>
			<HeroUINavbar maxWidth="full" position="static" className="fixed top-0 left-0 right-0 z-50 bg-[#0D0F13] border-b-[1px] border-[#25262A]" classNames={{ wrapper: "px-4 h-[56px] md:h-[64px]" }}>
				<NextLink className="flex justify-start items-center gap-[8px] logo-container" href="/">
					<LogoIcon className="w-[36px]" />
					<LogoTextIcon />
				</NextLink>
				<div className="text-[16px] hidden md:flex items-center gap-[16px] pl-[24px] font-semibold">
					<NextLink href="/" className={`hover:opacity-80 transition-opacity ${router.pathname === '/' ? 'text-[#fff]' : 'text-[#868789]'}`}>Home</NextLink>
					<NextLink href="/points" className={`hover:opacity-80 transition-opacity ${router.pathname === '/points' ? 'text-[#fff]' : 'text-[#868789]'}`}>Points</NextLink>
					<NextLink href="/stake" className={`hover:opacity-80 transition-opacity ${router.pathname === '/stake' ? 'text-[#fff]' : 'text-[#868789]'}`}>Stake</NextLink>
					<NextLink href="/explore" className={`hover:opacity-80 transition-opacity ${router.pathname === '/explore' ? 'text-[#fff]' : 'text-[#868789]'}`}>Explore</NextLink>
					<NextLink href="/about" className={`hover:opacity-80 transition-opacity ${router.pathname === '/about' ? 'text-[#fff]' : 'text-[#868789]'}`}>About</NextLink>
				</div>

				<NavbarContent justify="end" className="gap-[12px]">
					<Button className="h-[36px] bg-[#0D0F13] px-[12px] text-[13px] text-[#fff] rounded-[18px] border-[1px] border-[#25262A] gap-[4px] hidden lg:flex min-h-[36px]" variant="flat" onPress={test}>
						<LogoIcon className="w-[18px] h-[18px]" />ORI<span className="text-[#868789]">$268.32</span>
					</Button>
					{
						isLoggedIn ? (
							<div className="relative" ref={walletRef}>
								<Button className="h-[36px] bg-[#191B1F] px-[12px] text-[13px] text-[#fff] rounded-[18px] border-[1px] border-[#25262A] gap-[4px] min-h-[36px]" variant="flat" onPress={handleWalletClick}>
									<WalletIcon />{shortenAddress(address!)}
								</Button>
								{isWalletDropdownOpen && (
									<div className="absolute top-full right-0 mt-[8px] w-[375px] bg-[#191B1F] border border-[#25262A] rounded-[12px] p-[16px] z-50">
										<div className="text-[16px] text-[#fff] font-semibold mb-[16px]">My Wallet</div>
										<WalletBox />
									</div>
								)}
							</div>
						) : <Button className="h-[36px] bg-[#FFF] px-[12px] text-[13px] text-[#0D0F13] rounded-[18px] border-[1px] border-[#FFF] gap-[4px] min-h-[36px]" variant="flat" onPress={newLogin}>
							Connect
						</Button>
					}
				</NavbarContent>
			</HeroUINavbar>
			<Drawer isOpen={isWalletDrawerOpen} onOpenChange={onWalletDrawerOpenChange} placement="bottom" hideCloseButton>
				<DrawerContent>
					{(onClose) => (
						<>
							<DrawerHeader className="text-center relative p-0 pt-[8px]">
								<div className="h-[48px] flex items-center justify-center w-full text-[#fff]">My Wallet</div>
								<CloseIcon className="absolute right-[16px] top-[20px] cursor-pointer" onClick={onClose} />
							</DrawerHeader>
							<DrawerBody className="px-[16px] pb-[50px]">
								<WalletBox />
							</DrawerBody>
						</>
					)}
				</DrawerContent>
			</Drawer>
		</>
	);
};
