import { SecondLevelDomain } from "./types/SecondLevelDomain";
import { TopLevelDomain } from "./types/TopLevelDomain";
export declare const domainCache: {
    tld: Map<string, TopLevelDomain>;
    slds: Map<string, Map<string, SecondLevelDomain>>;
};
