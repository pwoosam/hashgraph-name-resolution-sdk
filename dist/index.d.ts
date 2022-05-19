export declare class HashgraphNames {
    text: string;
    constructor(text: string);
    printMsg: () => void;
    static printBalance: () => Promise<{
        nft: number;
        hbar: number;
    }>;
}
