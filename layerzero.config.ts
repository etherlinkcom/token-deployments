import { EndpointId } from "@layerzerolabs/lz-definitions";
const baseContract = {
  eid: EndpointId.BASE_V2_MAINNET,

  contractName: "WXTZ"
};
const etherlinkContract = {
  eid: EndpointId.ETHERLINK_V2_MAINNET,

  contractName: "WXTZ"
};
export default {
  contracts:
    [{ contract: baseContract },

    { contract: etherlinkContract }],

  connections: [{
    from: baseContract,
    to: etherlinkContract,
    config: {
      sendLibrary: "0xB5320B0B3a13cC860893E2Bd79FCd7e13484Dda2",
      receiveLibraryConfig: {
        receiveLibrary: "0xc70AB6f32772f59fBfc23889Caf4Ba3376C84bAf",
        gracePeriod: 0
      },
      sendConfig: {
        executorConfig: {
          maxMessageSize: 10000,
          executor: "0x2CCA08ae69E0C44b18a57Ab2A87644234dAebaE4"
        },
        ulnConfig: {
          confirmations: 10,
          requiredDVNs: [
            "0x9e059a54699a285714207b43B055483E78FAac25",
            "0xcd37CA043f8479064e10635020c65FfC005d36f6"
          ],
          optionalDVNs: [],
          optionalDVNThreshold: 0
        }
      },
      receiveConfig: {
        ulnConfig: {
          confirmations: 5,
          requiredDVNs: [
            "0x9e059a54699a285714207b43B055483E78FAac25",
            "0xcd37CA043f8479064e10635020c65FfC005d36f6"
          ],
          optionalDVNs: [],
          optionalDVNThreshold: 0
        }
      }
    }
  },
  {
    from: etherlinkContract,
    to: baseContract,
    config: {
      sendLibrary: "0xc1B621b18187F74c8F6D52a6F709Dd2780C09821",
      receiveLibraryConfig: {
        receiveLibrary: "0x377530cdA84DFb2673bF4d145DCF0C4D7fdcB5b6",
        gracePeriod: 0
      },
      sendConfig: {
        executorConfig: {
          maxMessageSize: 10000,
          executor: "0xa20DB4Ffe74A31D17fc24BD32a7DD7555441058e"
        },
        ulnConfig: {
          confirmations: 5,
          requiredDVNs: [
            "0x7a23612f07d81f16b26cf0b5a4c3eca0e8668df2",
            "0xc097ab8CD7b053326DFe9fB3E3a31a0CCe3B526f"
          ],
          optionalDVNs: [],
          optionalDVNThreshold: 0
        }
      },
      receiveConfig: {
        ulnConfig: {
          confirmations: 10,
          requiredDVNs: [
            "0x7a23612f07d81f16b26cf0b5a4c3eca0e8668df2",
            "0xc097ab8CD7b053326DFe9fB3E3a31a0CCe3B526f"
          ],
          optionalDVNs: [],
          optionalDVNThreshold: 0
        }
      }
    }
  }]
};
