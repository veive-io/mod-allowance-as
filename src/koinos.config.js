const path = require("path");
const { HDKoinos } = require("@koinosbox/hdkoinos");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const hdKoinosMainnet = process.env.MAINNET_MNEMONIC
  ? new HDKoinos(process.env.MAINNET_MNEMONIC)
  : undefined;

const hdKoinosHarbinger = process.env.HARBINGER_MNEMONIC
  ? new HDKoinos(process.env.HARBINGER_MNEMONIC)
  : undefined;

function keysMainnet(index) {
  if (!hdKoinosMainnet) return { privateKeyWif: "", address: "" };
  return hdKoinosMainnet.deriveKeyAccount(index);
}

function keysHarbinger(index) {
  if (!hdKoinosHarbinger) return { privateKeyWif: "", address: "" };
  return hdKoinosHarbinger.deriveKeyAccount(index);
}

module.exports = {
  class: "ModAllowance",
  proto: ["./proto/modallowance.proto"],
  files: ["./ModAllowance.ts"],
  supportAbi1: true,
  sourceDir: "./assembly",
  buildDir: "../build",
  filesImport: [
    {
      dependency: "@veive-io/mod-validation-as",
      path: "../node_modules/@veive-io/mod-validation-as/dist/ModValidation.ts",
    }
  ],
  protoImport: [
    {
      name: "@veive-io/mod-validation-as",
      path: "../node_modules/@veive-io/mod-validation-as/dist/proto/modvalidation",
    },
    {
      name: "@koinosbox/contracts",
      path: "../node_modules/@koinosbox/contracts/koinosbox-proto",
    },
    {
      name: "@koinos/sdk-as",
      path: "../node_modules/koinos-precompiler-as/koinos-proto/koinos",
    },
    {
      name: "__",
      path: "../node_modules/koinos-precompiler-as/koinos-proto/google",
    }
  ],
  networks: {
    harbinger: {
      rpcNodes: ["https://harbinger-api.koinos.io"],
      accounts: {
        freeManaSharer: { id: "1K6oESWG87m3cB3M2WVkzxdTr38po8WToN" },
        manaSharer: {
          privateKeyWif: process.env.HARBINGER_MANA_SHARER_PRIVATE_KEY,
        },
        contract: {
          privateKeyWif: process.env.HARBINGER_CONTRACT_PRIVATE_KEY,
        },
        /**
         * you can also derive the private keys from the seed:
         *
         * contract: keysHarbinger(0),
         */
      },
    },
    mainnet: {
      rpcNodes: ["https://api.koinos.io"],
      accounts: {
        freeManaSharer: {
          id: "1KyZyhNwiDo6a93f3FvK8pxspKdgEtQDwa", // @kondor-nft
        },
        manaSharer: {
          privateKeyWif: process.env.MAINNET_MANA_SHARER_PRIVATE_KEY,
        },
        contract: {
          privateKeyWif: process.env.MAINNET_CONTRACT_PRIVATE_KEY,
        },
        /**
         * you can also derive the private keys from the seed:
         *
         * contract: keysMainnet(0),
         */
      },
    },
  },
};
