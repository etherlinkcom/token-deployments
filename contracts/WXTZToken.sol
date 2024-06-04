// SPDX-License-Identifier: MIT
pragma solidity 0.8.22;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { OFT } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/OFT.sol";
import { ERC20Permit } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title WXTZ Token
 * @dev This token contract aims to emulate the WETH9 contract on Ethereum mainnet.
 * Tokens can be bridged across EVM chains via LayerZero because of the OFT standard.
 * Separately calling `approve` when having a contract transfer funds is no longer necessary because of the ERC20Permit standard.
 * The contract ownership can be transferred because of the Ownable standard.
 */
contract WXTZToken is ERC20Permit, OFT {
    string private constant _name = "Wrapped XTZ";
    string private constant _symbol = "WXTZ";

    event Deposit(address indexed dst, uint wad);
    event Withdrawal(address indexed src, uint wad);

    /**
     * @dev This modifier can be applied to methods that should only be callable on Etherlink testnet or mainnet.
     */
    modifier onlyEtherlink() {
        require(block.chainid == 128123 || block.chainid == 42793);
        _;
    }

    /**
     * @dev The contract constructor
     * @param _lzEndpoint The LayerZero endpoint address
     * @param _delegate The delegate capable of making OApp configurations inside of the LayerZero endpoint.
     */
    constructor(
        address _lzEndpoint,
        address _delegate
    ) OFT(_name, _symbol, _lzEndpoint, _delegate) ERC20Permit(_name) Ownable(msg.sender) {
        _transferOwnership(_delegate);
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
        require(balanceOf(msg.sender) >= wad);
        _burn(msg.sender, wad);
        (bool sent, ) = payable(msg.sender).call{ value: wad }("");
        require(sent, "Failed to send Ether");
        emit Withdrawal(msg.sender, wad);
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
        if (block.chainid == 128123 || block.chainid == 42793) {
            require(_amountLD + totalSupply() <= address(this).balance);
        }
        return super._credit(_to, _amountLD, _srcEid);
    }
}
