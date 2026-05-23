import { upload } from 'thirdweb/storage';
import { createThirdwebClient } from 'thirdweb'

const thirdwebClient = createThirdwebClient({ clientId: '52d68856b2bf9405f9ac3e0eeeac1dd7' });

export async function uploadFile(file) {
    const uri = upload({ client: thirdwebClient, files: [file] })
    return uri
}

export function CreateBCMR(category, name, description, symbol, decimals, icon) {
    const bcmr = {
        $schema: "https://cashtokens.org/bcmr-v2.schema.json",
        version: { major: 1, minor: 0, patch: 0 },
        latestRevision: new Date().toISOString(),
        registryIdentity: {
            name: "example bcmr",
            description: "example bcmr for tokens on chipnet"
        },
        identities: {
            [category]: {
                [new Date().toISOString()]: {
                    name: name,
                    description: description,
                    token: {
                        category: category,
                        symbol: symbol,
                        decimals: decimals
                    },
                    uris: {
                        icon: icon
                    }
                }
            }
        }
    };

    return bcmr

}

export async function uploadBCMR(bcmr) {
    const uri = upload({ client: thirdwebClient, files: [bcmr] })
    return uri
}