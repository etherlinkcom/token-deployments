// SPDX-License-Identifier: MIT
pragma solidity 0.8.22;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { OFT } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/OFT.sol";
import { ERC20Permit } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title WXTZ
 * @dev This token contract aims to emulate the WETH9 contract on Ethereum mainnet.
 * Tokens can be bridged across EVM chains via LayerZero because of the OFT standard.
 * Separately calling `approve` when having a contract transfer funds is no longer necessary because of the ERC20Permit standard.
 * The contract ownership can be transferred because of the Ownable standard.
 */
contract WXTZ is ERC20Permit, OFT {
    string private constant _name = "Wrapped XTZ";
    string private constant _symbol = "WXTZ";

    uint256 public immutable etherlinkChainId;
    uint256 public constant TIMELOCK = 2 days;

    mapping (uint32 => uint256) _proposalTimestamps;

    event Deposit(address indexed dst, uint wad);
    event Withdrawal(address indexed src, uint wad);
    event ProposePeer(uint32 endpointID, bytes32 peer);

    /**
     * @dev This modifier can be applied to methods that should only be callable on Etherlink testnet or mainnet.
     */
    modifier onlyEtherlink() {
        require(block.chainid == etherlinkChainId, "You can only call this method on Etherlink.");
        _;
    }

    /**
     * @dev The contract constructor
     * @param _etherlinkChainId The chain ID of Etherlink mainnet or testnet.
     * @param _lzEndpoint The LayerZero endpoint address
     * @param _delegate The delegate capable of making OApp configurations inside of the LayerZero endpoint.
     */
    constructor(
        uint256 _etherlinkChainId,
        address _lzEndpoint,
        address _delegate
    ) OFT(_name, _symbol, _lzEndpoint, _delegate) ERC20Permit(_name) Ownable(_delegate) {
        etherlinkChainId = _etherlinkChainId;
    }

    /**
     * @dev Exchange XTZ for the same amount of WXTZ. This is only callable on Etherlink testnet or mainnet.
     * The amount of XTZ to exchange is defined in the 'value' parameter of the sendTransaction call
     */
    receive() external payable {
        deposit();
    }

    /**
     * @dev Exchange XTZ for the same amount of WXTZ. This is only callable on Etherlink testnet or mainnet.
     * The amount of XTZ to exchange is defined in the 'value' parameter of the sendTransaction call
     */
    function deposit() public payable onlyEtherlink {
        _mint(msg.sender, msg.value);
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @dev Exchange WXTZ for the same amount of XTZ. This is only callable on Etherlink testnet or mainnet.
     * @param wad The amount of WXTZ to exchange for XTZ
     */
    function withdraw(uint wad) public onlyEtherlink {
        require(balanceOf(msg.sender) >= wad, "There is not enough XTZ in the contract to fulfil the withdraw requested.");
        _burn(msg.sender, wad);
        (bool sent, ) = payable(msg.sender).call{ value: wad }("");
        require(sent, "Failed to send Ether");
        emit Withdrawal(msg.sender, wad);
    }

    /**
     * @dev Sets the peer address (OApp instance) for a corresponding endpoint.
     * Only the owner/admin of the OApp can call this function.
     * Indicates that the peer is trusted to send LayerZero messages to this OApp.
     * Set this to bytes32(0) to remove the peer address.
     * Peer is a bytes32 to accommodate non-evm chains.
     * A timelock is implemented such that the peer can only set after TIMELOCK blocks
     * have passed from the first call.
     * 
     * @param _eid The endpoint ID.
     * @param _peer The address of the peer to be associated with the corresponding endpoint.
     */
    function setPeer(uint32 _eid, bytes32 _peer) public virtual onlyOwner override {
        if (_proposalTimestamps[_eid] == 0 || block.timestamp > _proposalTimestamps[_eid] + TIMELOCK) {
            _proposalTimestamps[_eid] = block.timestamp;
        }
        else {
            _executeSetPeer(_eid, _peer);
        }
    }

    function _executeSetPeer(uint32 _eid, bytes32 _peer) internal onlyOwner {
        super.setPeer(_eid, _peer);
    }

    /**
     * @dev Override the _credit method to add protection in case the multisignature owner of the Oapp gets hacked,
     * and people can use the setPeer method to setPeer a malicious OFT on another chain.
     * Only the bridged OFTs are at risk.
     * @param _to The address to credit the tokens to.
     * @param _amountLD The amount of tokens to credit in local decimals.
     * @dev _srcEid The source chain ID.
     * @return amountReceivedLD The amount of tokens ACTUALLY received in local decimals.
     */
    function _credit(
        address _to,
        uint256 _amountLD,
        uint32 _srcEid
    ) internal override returns (uint256 amountReceivedLD) {
        if (block.chainid == etherlinkChainId) {
            require(_amountLD + totalSupply() <= address(this).balance, "The amount of WXTZ on Etherlink should not exceed the amount of XTZ locked in the Etherlink contract.");
        }
        return super._credit(_to, _amountLD, _srcEid);
    }
}
