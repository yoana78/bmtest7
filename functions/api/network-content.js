import defaultContent from "../../content/network.json";
import { makeContentApi } from "../_lib/content-api.js";

const api = makeContentApi("network-content", defaultContent);
export const onRequestGet = api.onRequestGet;
export const onRequestPut = api.onRequestPut;
