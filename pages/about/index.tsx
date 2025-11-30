import { AccorIcon, BackIcon } from "@/components/icons";
import DefaultLayout from "@/layouts/default";
import { useEffect, useState } from "react";
import { Accordion, AccordionItem } from "@heroui/react";
import { useTranslation, Trans } from "react-i18next";
import { usePrivy } from "@privy-io/react-auth";

export default function AboutPage() {
	const { t } = useTranslation();
	const { ready } = usePrivy();

	if (!ready) {
		return <div className="flex items-center justify-center h-screen w-screen bg-[#0D0F13]">
			<img src="/images/loading.gif" alt="Loading" className="w-[60px] h-[60px]" />
		</div>;
	}

	return (
		<DefaultLayout>
			<section className="flex flex-col items-center justify-center w-full px-[14px] max-w-[600px] mx-auto">
				<div className="text-[28px] font-bold text-[#fff] w-full pt-[24px]">{t('About.title')}</div>
				<div className="text-[14px] text-[#868789] w-full mt-[2px] pb-[24px] custom-dashed-border-bottom mb-[24px]">{t('About.subtitle')}</div>
				<div className="text-[20px] font-bold text-[#fff] w-full">{t('About.summaryTitle')}</div>
				<div className="text-[14px] text-[#868789] mt-[16px] w-full">
					<Trans
						i18nKey="About.summaryDescription"
						components={[
							<span className="text-[#fff]" />,
							<span className="text-[#fff]" />,
							<span className="text-[#fff]" />
						]}
					/>
				</div>
				<div className="text-[20px] font-bold text-[#fff] w-full mt-[32px]">{t('About.introTitle')}</div>
				<div className="text-[14px] text-[#868789] mt-[16px] w-full">{t('About.introContent1')}</div>
				<div className="text-[14px] text-[#868789] mt-[16px] w-full">
					<Trans
						i18nKey="About.introContent2Detail"
						components={[
							<span className="text-[#fff]" />,
							<br />,
							<span className="text-[#fff]" />,
							<br />,
							<span className="text-[#fff]" />
						]}
					/>
				</div>
				<div className="text-[14px] text-[#868789] mt-[16px] w-full">
					{t('About.consequenceContent')}
					<div className="mt-[8px]">{t('About.consequence1')}</div>
					<div className="mt-[8px]">{t('About.consequence2')}</div>
					<div className="mt-[8px]">{t('About.consequence3')}</div>
				</div>
				<div className="text-[20px] font-bold text-[#fff] w-full mt-[32px]">{t('About.problemTitle')}</div>
				<div className="w-full mt-[16px] border border-[#25262A] rounded-[8px] overflow-hidden">
					<div className="grid bg-[#191B1F]" style={{ gridTemplateColumns: '1fr 1.5fr 1.5fr' }}>
						<div className="py-[6px] border-r border-[#25262A] text-[14px] text-[#868789] px-[12px] flex items-center">{t('About.tableStep')}</div>
						<div className="py-[6px] border-r border-[#25262A] text-[14px] text-[#868789] px-[12px] flex items-center">{t('About.tableAction')}</div>
						<div className="py-[6px] text-[14px] text-[#868789] px-[12px] flex items-center">{t('About.tableResult')}</div>
					</div>

					<div className="grid border-t border-[#25262A]" style={{ gridTemplateColumns: '1fr 1.5fr 1.5fr' }}>
						<div className="py-[6px] border-r border-[#25262A] text-[14px] text-[#fff] px-[12px] flex items-center">{t('About.mining')}</div>
						<div className="py-[6px] border-r border-[#25262A] text-[14px] text-[#fff] px-[12px] flex items-center">{t('About.miningAction')}</div>
						<div className="py-[6px] text-[14px] text-[#fff] px-[12px] flex items-center">{t('About.miningResult')}</div>
					</div>

					<div className="grid border-t border-[#25262A]" style={{ gridTemplateColumns: '1fr 1.5fr 1.5fr' }}>
						<div className="py-[6px] border-r border-[#25262A] text-[14px] text-[#fff] px-[12px] flex items-center">{t('About.costSettlement')}</div>
						<div className="py-[6px] border-r border-[#25262A] text-[14px] text-[#fff] px-[12px] flex items-center">{t('About.costAction')}</div>
						<div className="py-[6px] text-[14px] text-[#fff] px-[12px] flex items-center">{t('About.costResult')}</div>
					</div>

					<div className="grid border-t border-[#25262A]" style={{ gridTemplateColumns: '1fr 1.5fr 1.5fr' }}>
						<div className="py-[6px] border-r border-[#25262A] text-[14px] text-[#fff] px-[12px] flex items-center">{t('About.valueFlow')}</div>
						<div className="py-[6px] border-r border-[#25262A] text-[14px] text-[#fff] px-[12px] flex items-center">{t('About.valueFlowAction')}</div>
						<div className="py-[6px] text-[14px] text-[#EF4444] px-[12px] flex items-center">{t('About.valueFlowResult')}</div>
					</div>
				</div>
				<div className="text-[14px] text-[#868789] mt-[16px] w-full">{t('About.conclusionLabel')}</div>
				<div className="text-[14px] text-[#868789] mt-[8px] w-full">
					<Trans
						i18nKey="About.conclusionContent"
						components={[
							<span className="text-[#fff]" />
						]}
					/>
				</div>
				<div className="text-[20px] font-bold text-[#fff] w-full mt-[32px]">{t('About.oriPhilosophyTitle')}</div>
				<div className="text-[14px] text-[#868789] mt-[16px] w-full">{t('About.oriInsight')}</div>
				<div className="text-[14px] text-[#fff] mt-[8px] w-full">{t('About.oriQuestion')}</div>
				<div className="text-[14px] text-[#868789] mt-[8px] w-full">
					<Trans
						i18nKey="About.oriAnswer"
						components={[
							<span className="text-[#EFC462]" />
						]}
					/>
				</div>
				<div className="text-[14px] text-[#868789] mt-[16px] w-full">
					{t('About.oriMechanismIntro')}
					<div className="mt-[8px]">
						<Trans
							i18nKey="About.oriMechanism1"
							components={[
								<span className="text-[#fff]" />
							]}
						/>
					</div>
					<div className="mt-[8px]">
						<Trans
							i18nKey="About.oriMechanism2"
							components={[
								<span className="text-[#fff]" />
							]}
						/>
					</div>
					<div className="mt-[8px]">
						<Trans
							i18nKey="About.oriMechanism3"
							components={[
								<span className="text-[#fff]" />
							]}
						/>
					</div>
				</div>
				<div className="text-[20px] font-bold text-[#fff] w-full mt-[32px]">{t('About.coreMechanismTitle')}</div>
				<div className="text-[16px] text-[#fff] w-full mt-[16px]">{t('About.zeroPremine')}</div>
				<div className="text-[14px] text-[#868789] w-full">
					<div className="mt-[8px]">
						<Trans
							i18nKey="About.zeropreminePoint1"
							components={[
								<span className="text-[#fff]" />
							]}
						/>
					</div>
					<div className="mt-[8px]">
						<Trans
							i18nKey="About.zeropreminePoint2"
							components={[
								<span className="text-[#fff]" />
							]}
						/>
					</div>
					<div className="mt-[8px]">
						<Trans
							i18nKey="About.zeropreminePoint3"
							components={[
								<span className="text-[#fff]" />
							]}
						/>
					</div>
				</div>
				<div className="text-[16px] text-[#fff] w-full mt-[16px]">{t('About.decentralizedMining')}</div>
				<div className="text-[14px] text-[#868789] w-full">
					<div className="mt-[8px]">
						<Trans
							i18nKey="About.decentralizedPoint1"
							components={[
								<span className="text-[#fff]" />
							]}
						/>
					</div>
					<div className="mt-[8px]">
						<Trans
							i18nKey="About.decentralizedPoint2"
							components={[
								<span className="text-[#fff]" />
							]}
						/>
					</div>
				</div>
				<div className="text-[16px] text-[#fff] w-full mt-[16px]">{t('About.reverseEngine')}</div>
				<div className="text-[14px] text-[#868789] w-full mt-[8px]">{t('About.traditionalPow')}</div>
				<div className="text-[14px] text-[#fff] w-full mt-[8px]">
					<Trans
						i18nKey="About.oriModel"
						components={[
							<span className="text-[#EFC462]" />
						]}
					/>
				</div>
				<div className="text-[20px] font-bold text-[#fff] w-full mt-[32px]">{t('About.economicModelTitle')}</div>
				<div className="w-full mt-[16px] border border-[#25262A] rounded-[8px] overflow-hidden">
					<div className="grid bg-[#191B1F]" style={{ gridTemplateColumns: '1fr 1.5fr 1.5fr' }}>
						<div className="py-[6px] border-r border-[#25262A] text-[14px] text-[#868789] px-[12px] flex items-center">{t('About.tableParticipant')}</div>
						<div className="py-[6px] border-r border-[#25262A] text-[14px] text-[#868789] px-[12px] flex items-center">{t('About.tableAction')}</div>
						<div className="py-[6px] text-[14px] text-[#868789] px-[12px] flex items-center">{t('About.tableResult')}</div>
					</div>

					<div className="grid border-t border-[#25262A]" style={{ gridTemplateColumns: '1fr 1.5fr 1.5fr' }}>
						<div className="py-[6px] border-r border-[#25262A] text-[14px] text-[#fff] px-[12px] flex items-center">{t('About.miner')}</div>
						<div className="py-[6px] border-r border-[#25262A] text-[14px] text-[#fff] px-[12px] flex items-center">{t('About.minerAction')}</div>
						<div className="py-[6px] text-[14px] text-[#fff] px-[12px] flex items-center">{t('About.minerReward')}</div>
					</div>

					<div className="grid border-t border-[#25262A]" style={{ gridTemplateColumns: '1fr 1.5fr 1.5fr' }}>
						<div className="py-[6px] border-r border-[#25262A] text-[14px] text-[#fff] px-[12px] flex items-center">{t('About.holder')}</div>
						<div className="py-[6px] border-r border-[#25262A] text-[14px] text-[#fff] px-[12px] flex items-center">{t('About.holderAction')}</div>
						<div className="py-[6px] text-[14px] text-[#fff] px-[12px] flex items-center">{t('About.holderReward')}</div>
					</div>

					<div className="grid border-t border-[#25262A]" style={{ gridTemplateColumns: '1fr 1.5fr 1.5fr' }}>
						<div className="py-[6px] border-r border-[#25262A] text-[14px] text-[#fff] px-[12px] flex items-center">{t('About.system')}</div>
						<div className="py-[6px] border-r border-[#25262A] text-[14px] text-[#fff] px-[12px] flex items-center">{t('About.systemAction')}</div>
						<div className="py-[6px] text-[14px] text-[#fff] px-[12px] flex items-center">{t('About.systemReward')}</div>
					</div>
				</div>
				<div className="text-[14px] text-[#868789] w-full mt-[16px]">{t('About.economicResult')}</div>
				<div className="text-[14px] text-[#868789] w-full mt-[8px]">{t('About.economicResultContent')}</div>
				<div className="text-[20px] font-bold text-[#fff] w-full mt-[32px]">{t('About.visionTitle')}</div>
				<div className="text-[14px] text-[#868789] w-full mt-[16px]">
					<Trans
						i18nKey="About.visionContent"
						components={[
							<span className="text-[#fff]" />,
							<br />,
							<br />
						]}
					/>
				</div>
				<div className="text-[14px] text-[#868789] w-full mt-[8px]">
					<Trans
						i18nKey="About.visionSummary"
						components={[
							<span className="text-[#EFC462]" />
						]}
					/>
				</div>
				<div className="text-[20px] font-bold text-[#fff] w-full mt-[32px]">{t('About.conclusionTitle')}</div>
				<div className="text-[14px] text-[#868789] w-full mt-[16px]">
					<Trans
						i18nKey="About.conclusionContent1"
						components={[
							<br />,
							<br />,
							<span className="text-[#fff]" />
						]}
					/>
				</div>
				<div className="text-[14px] text-[#868789] w-full mt-[32px] mb-[100px]">
					<Trans
						i18nKey="About.finalMessage"
						components={[
							<span className="text-[#fff]" />,
							<br />,
							<span className="text-[#fff]" />,
							<br />,
							<br />,
						]}
					/>
				</div>
			</section>
		</DefaultLayout>
	);
}

