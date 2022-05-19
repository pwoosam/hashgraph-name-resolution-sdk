export declare class HashgraphNames {
    text: string;
    constructor(text: string);
    printMsg: () => void;
}
export declare const printBalance: () => Promise<{
    nft: number;
    hbar: number;
}>;
