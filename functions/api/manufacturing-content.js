import defaultContent from "../../content/manufacturing.json";
import { makeContentApi } from "../_lib/content-api.js";

const api = makeContentApi("manufacturing-content", defaultContent);
export const onRequestGet = api.onRequestGet;
export const onRequestPut = api.onRequestPut;
