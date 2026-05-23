import { ChaingraphClient, graphql } from "chaingraph-ts";
import { hexToBin, binToHex } from "@bitauth/libauth";
import { chaingraphUrl } from '../config'

const chaingraphClient = new ChaingraphClient(chaingraphUrl);

export async function getFunds() {
    const result = await chaingraphClient.query(graphql(
        `query GetFunds{  
    search_output_prefix(  
        args: { locking_bytecode_prefix_hex: "6a0466756e640102"}   
        where: {   
            _and: [  
                { transaction_hash: { _neq: "\\\\xc33e09266fb4a94220dd8a4edd818382c0230ae8d85c4719fa82facaccaa2842" } },  
                { transaction_hash: { _neq: "\\\\xaae11412881641de118e83680f68914d0255c11e8d997e4ef251035bd57b97fc" } },
                { transaction_hash: { _neq: "\\\\x64eff2b3013639a68269749ed3ada89109842f8e8594af9f6cd95b4e8b9c1746" } },
                { transaction_hash: { _neq: "\\\\x2e338779b4800ea3d0ed8a64b30a425472895a58602f70bbf74463927c141849" } },
                { transaction_hash: { _neq: "\\\\x46ceea5c1be8474a79d97fd5375dd6180479de229594be1b1ab064f77cb81bb0" } },
                { transaction_hash: { _neq: "\\\\xe3b9a18a8fe8de5e74da68aea2892336dca04d268d224fce34f5145a5e5f6349" } },
                { transaction_hash: { _neq: "\\\\x46ceea5c1be8474a79d97fd5375dd6180479de229594be1b1ab064f77cb81bb0" } },
                { transaction_hash: { _neq: "\\\\x9c8b55b853d4ddd0e03d7e2a3f61957591afd5b9cff39c735abcc109550e6b01" } },
                { transaction_hash: { _neq: "\\\\x72df2d96e2f4ab570b90b3c410227c1c8171086f16235b4b38c60fe90afc6ab9" } },
                { transaction_hash: { _neq: "\\\\x8dd78066cfc8c41ba7a7dc5dc3e0205647b3b673e51615f1817562d7a1c9f255" } },
                { transaction_hash: { _neq: "\\\\xcf6e0b92c1cd6013c3e52df72b298df76ada30e2e28071037f1c6f0feb778de9" } },
                { transaction_hash: { _neq: "\\\\x67b6ca7e95a38ad2aae897985f21a714b107ca5bcc439550d166d6cedc5d57f3" } },
                { transaction_hash: { _neq: "\\\\xd489a254cfeca1c43a9905a9c4c4565adc4be93aef5922facfdea7887be9f30b" } },
                { transaction_hash: { _neq: "\\\\x6a765dc3cbf6604e382c5c8ab9eebf2963dba662a099806709f5e4fc9bb2a1a9" } },
                { transaction_hash: { _neq: "\\\\x013641cca18d99dfacd224164ca03dd98debf89ef1d3dd5dd07e826e41887307" } },
                { transaction_hash: { _neq: "\\\\xcf530ff8644fbddbe0b68cfbc7fd57743b631b20b827dde3aa27229e7590d5d3" } },
                { transaction_hash: { _neq: "\\\\x28925f5e882ab5fa7cd598669b26209f2b8808e6fc3db99ca98caa0fbc6b0a7f" } },
                { transaction_hash: { _neq: "\\\\xc9b7452ebc150cd1d4c7d0fc2f5579c1e8a0e678354cbcd8669ae916dd31f994" } },
                { transaction_hash: { _neq: "\\\\xe9668e7f6b987f58d9e0ca485ea7359ed1b07ff80f3378464b97f39c98d89f01" } },
                { transaction_hash: { _neq: "\\\\x66f19261b365ac9f27dda8f80daed0eee161a74c8e2e28c6b8afe9801ebdd11e" } },
                { transaction_hash: { _neq: "\\\\x8f39bce594015a024bcf89c22ad4e44781063f3b6fb6e19198d802ff34522fe3" } },
                { transaction_hash: { _neq: "\\\\xd489a254cfeca1c43a9905a9c4c4565adc4be93aef5922facfdea7887be9f30b" } },
                { transaction_hash: { _neq: "\\\\x013641cca18d99dfacd224164ca03dd98debf89ef1d3dd5dd07e826e41887307" } },
                { transaction_hash: { _neq: "\\\\x55f3c82b49f03e9b144d7c507b4bf638dcc71bd7b1bd143e8d0f589c393b0808" } },
                { transaction_hash: { _neq: "\\\\xa2eb3d1c4885964c49b1762f6a3622af11c538753d136f102cff6763ebb8875b" } },
                { transaction_hash: { _neq: "\\\\x4fe2040de9e516aa58f783f04aeedc4a55bee0382b3108fd5b656d51ce5d297f" } },
                { transaction_hash: { _neq: "\\\\x61d8f565aabed2995637c28cba2a7bf7442756f69bf7d4a6b44c036dea41412b" } },
                { transaction_hash: { _neq: "\\\\x08426079c19e2137ba5d9668172236f7bec1b605e97609a52271c7b2535851ba" } },
                { transaction_hash: { _neq: "\\\\x63ee9f5f8a32979d124994c420dc7527714b738da575062e82c867c06234d6a4" } },
                { transaction_hash: { _neq: "\\\\x363ee243a6349e6a81f1e5b5663d890a4cc01103f192f9d1e61fec8a15673de2" } },
                { transaction_hash: { _neq: "\\\\xee58f068e89af2355eaf7a1e17fcde307a368522a9e51ae429160246e6ffa059" } },
                { transaction_hash: { _neq: "\\\\x66f19261b365ac9f27dda8f80daed0eee161a74c8e2e28c6b8afe9801ebdd11e" } },
                { transaction_hash: { _neq: "\\\\xefc4ea4f35525871a790b46cbf021ecff01bfa5c85faf386a11afe0057121274" } },
                { transaction_hash: { _neq: "\\\\x27df2ad9a1eb3c818e63e2779a61b9374418642667049c4a2850b8a3415177a6" } },
                { transaction_hash: { _neq: "\\\\xfa919775299d9a008ffaae4a59d6746b102a2ed34901fe4e8184d9e042c38d31" } },
                { transaction_hash: { _neq: "\\\\x8e54be750f533d62aa0ec0673fbb5eff18c717488bbb6fd4e3748f6de4eaead4" } },
                { transaction_hash: { _neq: "\\\\x08426079c19e2137ba5d9668172236f7bec1b605e97609a52271c7b2535851ba" } },
                { transaction_hash: { _neq: "\\\\xf03fa6e9e30c8d93015af59bfe27ef7a00c82fec0376dec559221c9dfa2e09f9" } },
                { transaction_hash: { _neq: "\\\\x3acdb065cc1e97dd99f9f81d5041d8d04dd154abc10289077d702f19621eecdd" } },
                { transaction_hash: { _neq: "\\\\x17ea2df6a3cb3da7eca4718b909f508b2497483763f43fbfc7cec5e3d5d98271" } }
            ]  
        }  
    ){  
        transaction_hash  
        locking_bytecode  
        transaction{  
            outputs{  
                locking_bytecode  
                value_satoshis  
                spent_by{  
                    outpoint_transaction_hash  
                }  
            }  
        }  
    }  
}`))
    return result.data.search_output_prefix
}
export async function getFundsAssets(hash) {
    const result = await chaingraphClient.query(graphql(
        `query GetFundsAssets{
            search_output_prefix(
                args: {locking_bytecode_prefix_hex: "6a20${hash.slice(0, 46)}"}
                where: { transaction_hash: { _neq: "574581f4087fd66d35a81a7cd59d0aaea8a64c0d9a1b367ee8f4be81377eb9f0" } }
            ){
                transaction_hash
                locking_bytecode
                transaction{
                    outputs{
                        locking_bytecode
                        value_satoshis
                        spent_by{
                            outpoint_transaction_hash
                        }
                    }
                }
            }
        }`))
    return result.data.search_output_prefix[0]
}

export function parseOpReturn(opReturn) {
    const bin = hexToBin(opReturn);
    const decoded = {}
    const chunks = []
    let index = 1
    if (bin[index] !== 106) return
    index++
    while (index < bin.length) {
        const byte = bin[index]

        const start = index + 1
        const end = start + byte

        const chunk = bin.subarray(start, end)
        chunks.push(chunk)
        index = end
    }
    return chunks
}

export function parseFund(fundChunks) {
    const decoder = new TextDecoder()
    const fund = {
        categoryId: binToHex(fundChunks[2]),
        amount: parseInt(decoder.decode(fundChunks[3])),
        inflowCategory: binToHex(fundChunks[4]),
        outflowCategory: binToHex(fundChunks[5]),
        assets: binToHex(fundChunks[6])
    }
    return fund
}

export function parseFundAssets(fundAssetsChunks) {
    const decoder = new TextDecoder()
    const assets = []
    const asset1 = {
        categoryId: binToHex(fundAssetsChunks[1]),
        amount: parseInt(decoder.decode(fundAssetsChunks[2]))
    }
    const asset2 = {
        categoryId: binToHex(fundAssetsChunks[3]),
        amount: parseInt(decoder.decode(fundAssetsChunks[4]))
    }
    assets.push(asset1)
    assets.push(asset2)
    return assets
}