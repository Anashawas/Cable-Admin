import type { TFunction } from "i18next";
import {
	EvStation as EvStationIcon,
	People as PeopleIcon,
	Settings as SettingsIcon,
	ListAlt as ListAltIcon,
	LocalHospital as LocalHospitalIcon,
	NotificationsActive as NotificationsActiveIcon,
	ReportProblem as ReportProblemIcon,
	Store as StoreIcon,
	Category as CategoryIcon,
	LocalOffer as LocalOfferIcon,
	MonetizationOn as MonetizationOnIcon,
	AccountBalance as AccountBalanceIcon,
	Handshake as HandshakeIcon,
	ReceiptLong as ReceiptLongIcon,
	CardGiftcard as CardGiftcardIcon,
	ManageAccounts as ManageAccountsIcon,
	Redeem as RedeemIcon,
	AccountBalanceWallet as AccountBalanceWalletIcon,
	QueryStats as QueryStatsIcon,
	Insights as InsightsIcon,
	Block as BlockIcon,
	Share as ShareIcon,
	PersonAddAlt1 as PersonAddAlt1Icon,
	Bolt as BoltIcon,
	EmojiEvents as EmojiEventsIcon,
	Gavel as GavelIcon,
	Campaign as CampaignIcon,
	Image as ImageIcon,
} from "@mui/icons-material";
import { PrivilegeCode } from "../../../constants/privileges-constants";

export interface NavigationItem {
	label: string;
	path: string;
	icon: React.ReactElement;
	requiredPrivileges?: PrivilegeCode[];
}

export interface NavigationGroup {
	id: string;
	label: string;
	icon: React.ReactElement;
	items: NavigationItem[];
}

/** The single source of truth for the admin navigation — used by both the
 *  desktop collapsible sidebar and the mobile drawer so they never drift. */
export function getNavigationGroups(t: TFunction): NavigationGroup[] {
	return [
		{
			id: "chargeManagement",
			label: t("chargeManagement"),
			icon: <EvStationIcon />,
			items: [
				{ label: t("chargeManagement"), path: "/charge-management", icon: <EvStationIcon /> },
				{ label: t("chargerBrands"), path: "/charger-brands", icon: <BoltIcon /> },
				{ label: t("stationStatistics"), path: "/station-statistics", icon: <QueryStatsIcon /> },
				{ label: t("stationsRequest"), path: "/stations-request", icon: <ListAltIcon /> },
				{ label: t("userComplaints"), path: "/complaints", icon: <ReportProblemIcon /> },
				{ label: t("nearestPreview"), path: "/nearest-preview", icon: <QueryStatsIcon /> },
			],
		},
		{
			id: "userManagement",
			label: t("userManagement"),
			icon: <PeopleIcon />,
			items: [
				{ label: t("userAnalytics"), path: "/user-analytics", icon: <InsightsIcon /> },
				{ label: t("manageUsers"), path: "/users", icon: <PeopleIcon /> },
			],
		},
		{
			id: "providerManagement",
			label: t("providerManagement"),
			icon: <StoreIcon />,
			items: [
				{ label: t("serviceCategories"), path: "/service-categories", icon: <CategoryIcon /> },
				{ label: t("serviceProviders"), path: "/service-providers", icon: <StoreIcon /> },
				{ label: t("offersManagement"), path: "/offers", icon: <LocalOfferIcon /> },
				{ label: t("offerTransactions"), path: "/transactions", icon: <ReceiptLongIcon /> },
				{ label: t("settlements"), path: "/settlements", icon: <AccountBalanceIcon /> },
			],
		},
		{
			id: "partnerManagement",
			label: t("partnerManagement"),
			icon: <HandshakeIcon />,
			items: [
				{ label: t("partners"), path: "/partners", icon: <HandshakeIcon /> },
				{ label: t("addNewPartner"), path: "/add-partner", icon: <PersonAddAlt1Icon /> },
			],
		},
		{
			id: "loyaltySystem",
			label: t("loyaltySystem"),
			icon: <CardGiftcardIcon />,
			items: [
				{ label: t("loyaltyDashboard"), path: "/loyalty-dashboard", icon: <AccountBalanceIcon /> },
				{ label: t("conversionRates"), path: "/conversion-rates", icon: <MonetizationOnIcon /> },
				{ label: t("loyaltyManagement"), path: "/loyalty-management", icon: <ManageAccountsIcon /> },
				{ label: t("loyalty@boosts.navTitle"), path: "/loyalty-boosts", icon: <BoltIcon /> },
				{ label: t("leaderboard"), path: "/loyalty-leaderboard", icon: <EmojiEventsIcon /> },
				{ label: t("redemptions"), path: "/redemptions", icon: <RedeemIcon /> },
				{ label: t("pointAdjustments"), path: "/point-adjustments", icon: <AccountBalanceWalletIcon /> },
				{ label: t("pointsLedger"), path: "/loyalty-ledger", icon: <ReceiptLongIcon /> },
				{ label: t("bulkAward"), path: "/loyalty-bulk-award", icon: <CardGiftcardIcon /> },
				{ label: t("flaggedActivity"), path: "/loyalty-flagged", icon: <ReportProblemIcon /> },
				{ label: t("blockUsers"), path: "/block-users", icon: <BlockIcon /> },
			],
		},
		{
			id: "ads",
			label: t("ads"),
			icon: <CampaignIcon />,
			items: [
				{ label: t("banners"), path: "/banners", icon: <CampaignIcon /> },
				{ label: t("welcomeMessages"), path: "/welcome-messages", icon: <NotificationsActiveIcon /> },
				{ label: t("stationAdImages"), path: "/view-image-review", icon: <ImageIcon /> },
				{ label: t("campaigns"), path: "/campaigns", icon: <InsightsIcon /> },
			],
		},
		{
			id: "systemData",
			label: t("systemData"),
			icon: <SettingsIcon />,
			items: [
				{ label: t("carManagement"), path: "/car-management", icon: <SettingsIcon /> },
				{ label: t("socialMediaPlatforms"), path: "/social-media-platforms", icon: <ShareIcon /> },
				{ label: t("appVersions"), path: "/app-versions", icon: <SettingsIcon /> },
				{ label: t("emergencyServices"), path: "/emergency-services", icon: <LocalHospitalIcon /> },
				{ label: t("sendNotification"), path: "/send-notification", icon: <NotificationsActiveIcon /> },
				{ label: t("notificationTemplates"), path: "/notification-templates", icon: <NotificationsActiveIcon /> },
				{ label: t("generateReceipt"), path: "/receipts", icon: <ReceiptLongIcon /> },
				{ label: t("termsConditions"), path: "/terms-conditions", icon: <GavelIcon /> },
			],
		},
	];
}
