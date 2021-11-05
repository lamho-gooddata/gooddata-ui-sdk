// (C) 2021 GoodData Corporation

import { OptionValues } from "commander";

export type ActionOptions = {
    programOpts: OptionValues;
    commandOpts: OptionValues;
};

export type TargetBackendType = "bear" | "tiger";
export type TargetAppLanguage = "ts" | "js";
export type SupportedPackageManager = "npm" | "yarn";