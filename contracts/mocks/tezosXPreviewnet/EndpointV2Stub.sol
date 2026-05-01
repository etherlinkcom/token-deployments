// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title EndpointV2Stub (tezosXPreviewnet ONLY — DO NOT DEPLOY ELSEWHERE)
/// @notice Stand-in for `ILayerZeroEndpointV2` so OFT-based contracts can be
///         deployed on the ephemeral tezosXPreviewnet chain, which has no real
///         LayerZero infrastructure.
/// @dev    Implements only `setDelegate(address)` — the single endpoint method
///         invoked from `OAppCore`'s constructor. Cross-chain send/receive,
///         quoting, and config flows are intentionally absent and will not
///         work. Delete this contract and its deployment when previewnet is
///         decommissioned.
contract EndpointV2Stub {
    event DelegateSet(address indexed oapp, address indexed delegate);

    mapping(address oapp => address delegate) public delegates;

    function setDelegate(address _delegate) external {
        delegates[msg.sender] = _delegate;
        emit DelegateSet(msg.sender, _delegate);
    }
}
