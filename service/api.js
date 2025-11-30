import { getApiBaseUrl } from "./base";
import { post } from "./tool";

export const getRoundInfo = (params) => post(getApiBaseUrl() + "/ori/round", params);

export const getEventInfo = (params) => post(getApiBaseUrl() + "/ori/latest/events", params);

export const getRoundWinInfo = (params) => post(getApiBaseUrl() + "/ori/round_winners/round", params);

export const getAutomation = (params) => post(getApiBaseUrl() + "/ori/automation/user", params);

export const getExploreInfo = (params) => post(getApiBaseUrl() + "/ori/explore", params);

export const resetEventList = (params) => post(getApiBaseUrl() + "/ori/reset_event/list", params);

export const getPointsList = (params) => post(getApiBaseUrl() + "/ori/points/list", params);

export const getUserPoints = (params) => post(getApiBaseUrl() + "/ori/points/user", params);

export const getSummary = (params) => post(getApiBaseUrl() + "/ori/summary", params);

export const getPrice = (params) => post(getApiBaseUrl() + "/ori/query/chain_asset_config", params);

export const buryEventList = (params) => post(getApiBaseUrl() + "/ori/bury_event/list", params);

export const userAssetEvents = (params) => post(getApiBaseUrl() + "/ori/activity/user_asset_events", params);

export const getOriginInfo = (params) => post(getApiBaseUrl() + "/ori/activity/origin_info", params);