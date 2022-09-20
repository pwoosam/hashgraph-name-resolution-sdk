import { SecondLevelDomain } from "./types/SecondLevelDomain";
import { TopLevelDomain } from "./types/TopLevelDomain";

export const domainCache = {
  tld: new Map<string, TopLevelDomain>(),
  slds: new Map<string, Map<string, SecondLevelDomain>>(),
};
