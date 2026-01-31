declare module 'smiles-drawer' {
    export default class SmilesDrawer {
        static parse(smiles: string, successCallback: (tree: any) => void, errorCallback?: (err: any) => void): void;
        static SmiDrawer: any;
    }
}
