// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.22;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { OFT } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/OFT.sol";

/**
 * @title tzBTC Dummy
 * @dev This contract allows tzBTC to be natively used across EVM chains as an OFT.
 * This should be deployed on any EVM chains that aren't Etherlink.
 */
contract tzBTCDummy is OFT {
    string private constant _name = "Tezos Bitcoin";
    string private constant _symbol = "tzBTC";

    /**
     * @dev The contract constructor
     * @param _lzEndpoint The LayerZero endpoint address
     * @param _delegate The delegate capable of making OApp configurations inside of the LayerZero endpoint.
     */
    constructor(
        address _lzEndpoint,
        address _delegate
    ) OFT(_name, _symbol, _lzEndpoint, _delegate) Ownable(_delegate) {}
}