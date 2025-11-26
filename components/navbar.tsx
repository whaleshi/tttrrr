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
import { useTranslation } from 'react-i18next';
import { useBalanceContext } from "@/providers/balanceProvider";

import { CloseIcon, LogoIcon, LogoTextIcon, MenuCloseIcon, MenuIcon, SearchInputIcon, WalletIcon, LangIcon } from "@/components/icons";
import { WalletBox } from "./wallet";
import { siteConfig } from "@/config/site";


export const Navbar = () => {
	const router = useRouter();
	const { t, i18n } = useTranslation();
	const { isOpen: isWalletDrawerOpen, onOpen: onWalletDrawerOpen, onOpenChange: onWalletDrawerOpenChange } = useDisclosure();
	const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
	const [lang, setLang] = useState('zh');
	const walletRef = useRef<HTMLDivElement>(null);
	const { price } = useBalanceContext();

	const { authenticated, logout } = usePrivy();
	const { toLogin } = usePrivyLogin();
	const { isLoggedIn, address, clearAuthState } = useAuthStore();
	const isMobile = useIsMobile();

	// 语言切换效果
	useEffect(() => {
		if (typeof window !== "undefined") {
			const currentLang = i18n?.language || 'zh';
			const html = document.documentElement;
			html.lang = currentLang;
			html.classList.remove("lang-en", "lang-zh");
			html.classList.add(`lang-${currentLang}`);
			setLang(currentLang);
		}
	}, [i18n.language]);

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

	const handleLangSwitch = () => {
		const newLang = lang === 'en' ? 'zh' : 'en';
		i18n.changeLanguage(newLang);
	};

	return (
		<>
			<HeroUINavbar maxWidth="full" position="static" className="fixed top-0 left-0 right-0 z-50 bg-[#0D0F13] border-b-[1px] border-[#25262A]" classNames={{ wrapper: "gap-[6px] px-4 h-[56px] lg:h-[64px]" }}>
				<NextLink className="flex justify-start items-center gap-[4px] logo-container" href="/">
					<LogoIcon className="w-[36px] h-[36px]" />
					<LogoTextIcon />
				</NextLink>
				<div className="text-[#4A4B4E] text-[12px] pt-[4px] block lg:hidden">${price.toFixed(2) || 0}</div>
				<div className="text-[16px] hidden lg:flex items-center gap-[16px] pl-[24px] font-semibold">
					{[
						{ href: '/', label: t('Header.home') },
						{ href: '/points', label: t('Header.points') },
						{ href: '/stake', label: t('Header.stake') },
						{ href: '/explore', label: t('Header.explore') },
						{ href: '/about', label: t('Header.about') }
					].map(({ href, label }) => (
						<NextLink
							key={href}
							href={href}
							className={`hover:opacity-80 transition-opacity ${router.pathname === href ? 'text-[#fff]' : 'text-[#868789]'}`}
						>
							{label}
						</NextLink>
					))}
				</div>

				<NavbarContent justify="end" className="gap-[12px]">
					<Button className="h-[36px] bg-[#0D0F13] px-[12px] text-[13px] text-[#fff] rounded-[18px] border-[1px] border-[#25262A] gap-[4px] hidden lg:flex min-h-[36px]" variant="flat">
						<LogoIcon className="w-[18px] h-[18px]" />ORI<span className="text-[#868789]">${price.toFixed(2) || 0}</span>
					</Button>
					{
						isLoggedIn ? (
							<div className="relative" ref={walletRef}>
								<Button className="h-[36px] bg-[#191B1F] px-[12px] text-[13px] text-[#fff] rounded-[18px] border-[1px] border-[#25262A] gap-[4px] min-h-[36px]" variant="flat" onPress={handleWalletClick}>
									<WalletIcon />{shortenAddress(address!)}
								</Button>
								{isWalletDropdownOpen && (
									<div className="absolute top-full right-0 mt-[8px] w-[375px] bg-[#191B1F] border border-[#25262A] rounded-[12px] p-[16px] z-50">
										<div className="text-[16px] text-[#fff] font-semibold mb-[16px]">{t('Common.myWallet')}</div>
										<WalletBox />
									</div>
								)}
							</div>
						) : <Button className="h-[36px] bg-[#FFF] px-[12px] text-[13px] text-[#0D0F13] rounded-[18px] border-[1px] border-[#FFF] gap-[4px] min-h-[36px]" variant="flat" onPress={newLogin}>
							{t('Header.connectWallet')}
						</Button>
					}
					<LangIcon
						lang={lang as 'zh' | 'en'}
						className="cursor-pointer hover:opacity-80 transition-opacity"
						onClick={handleLangSwitch}
					/>
				</NavbarContent>
			</HeroUINavbar>
			<Drawer isOpen={isWalletDrawerOpen} onOpenChange={onWalletDrawerOpenChange} placement="bottom" hideCloseButton>
				<DrawerContent>
					{(onClose) => (
						<>
							<DrawerHeader className="text-center relative p-0 pt-[8px]">
								<div className="h-[48px] flex items-center justify-center w-full text-[#fff]">{t('Common.myWallet')}</div>
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
