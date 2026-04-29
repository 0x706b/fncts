import { makeRolldownConfig } from "@fncts/config/makeRolldownConfig";
import { defineConfig } from "rolldown";

export default defineConfig(makeRolldownConfig(import.meta.url));
