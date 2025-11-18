import { getApiBaseUrl } from "./base";
import { post, _post } from "./tool";

export const getRoundInfo = (params) => post(getApiBaseUrl() + "/ori/round", params);




