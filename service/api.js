import { getApiBaseUrl } from "./base";
import { post, _post } from "./tool";

export const getRoundInfo = (params) => post(getApiBaseUrl() + "/ori/round", params);

export const getEventInfo = (params) => post(getApiBaseUrl() + "/ori/latest/events", params);

export const getRoundWinInfo = (params) => post(getApiBaseUrl() + "/ori/round_winners/round", params);

export const getAutomation = (params) => post(getApiBaseUrl() + "/ori/automation/user", params);

export const getExploreInfo = (params) => post(getApiBaseUrl() + "/ori/explore", params);

export const resetEventList = (params) => post(getApiBaseUrl() + "/ori/reset_event/list", params);