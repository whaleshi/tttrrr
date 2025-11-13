import { formatBigNumber } from "@/utils/formatBigNumber";
import { CopyIcon, LogoutIcon, WalletIcon } from "./icons"
import { useBalanceContext } from "@/providers/balanceProvider";
import { useAuthStore } from "@/stores/auth";
import { usePrivy } from "@privy-io/react-auth";
import { shortenAddress } from "@/utils";
import useClipboard from '@/hooks/useCopyToClipboard';
import router from "next/router";


export const WalletBox = () => {
	const { balance, symbol } = useBalanceContext();
	const { logout } = usePrivy();
	const { address, clearAuthState } = useAuthStore();
	const { copy } = useClipboard();

	const toLogout = async () => {
		clearAuthState();
		try { await logout(); } catch { }
		router.replace('/');
	}

	return (
		<div className="w-full relative border-[1.5px] border-[#303135] rounded-[12px] bg-[#191B1F]">
			<div className="w-full p-[16px] bg-[#25262A] rounded-t-[12px] border-b-[1px] border-[#303135]">
				<div className="text-[13px] text-[#717075]">Balance</div>
				<div className="text-[24px] text-[#fff] font-bold mt-[6px]">{formatBigNumber(balance)} {symbol}</div>
			</div>
			<div className="h-[44px] flex items-center justify-between px-[16px]">
				<div className="text-[13px] text-[#868789] flex items-center gap-[8px]">
					<WalletIcon className="" />
					<span>{shortenAddress(address!)}</span>
					<CopyIcon className="cursor-pointer" onClick={() => copy(address!)} />
				</div>
				<LogoutIcon className="cursor-pointer" onClick={() => { toLogout() }} />
			</div>
		</div>
	)
}