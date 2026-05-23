export const chipnet = 'chipnet';

export const network = chipnet;

export const electrumClientHostnames = {
    [chipnet]: [
        'chipnet.bch.ninja'
    ],
};

export const electrumClientHostname = electrumClientHostnames[network][0];

export const tokenExplorerRoute = 'https://tokenexplorer.cash/?tokenId=';

export const chaingraphUrl = 'https://gql.chaingraph.pat.mn/v1/graphql';

export const paytacaIndexerUrl = 'https://bcmr-chipnet.paytaca.com/api/tokens/';

export const showDevUI = localStorage.getItem('fund-tokens:dev-ui');