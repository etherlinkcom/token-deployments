// SPDX-License-Identifier: MIT
pragma solidity 0.8.22;

import { OFTAdapter } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/OFTAdapter.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title tzBTC Adapter
 * @dev This contract connects to the underlying tzBTCToken token on Etherlink to make it
 * natively bridgeable across EVM chains as an OFT.
 */
contract tzBTCAdapter is OFTAdapter {
    /**
     * @dev The contract constructor
     * @param _token The deployed, already existing ERC20 token address 
     * @param _layerZeroEndpoint The LayerZero endpoint address
     * @param _owner The token owner used as a delegate in LayerZero Endpoint
     */
    constructor(
        address _token,
        address _layerZeroEndpoint,
        address _owner
    ) OFTAdapter(_token, _layerZeroEndpoint, _owner) Ownable(_owner) {}
}