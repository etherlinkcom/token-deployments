// SPDX-License-Identifier: MIT
pragma solidity 0.8.22;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { OFT } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/OFT.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
* @title WXTZ Token
* @dev This token contract aims to emulate the WETH9 contract on Ethereum mainnet.
* It inherits from the OFT standard to allow for briding across EVM chains via LayerZero.
*/
contract WXTZToken is Ownable, ERC20Permit, OFT {
    string private _name        = "Wrapped XTZ";
    string private _symbol      = "WXTZ";

    event Deposit(address indexed dst, uint wad);
    event Withdrawal(address indexed src, uint wad);

    /**
    * @dev The contract constructor
    * @param _lzEndpoint The LayerZero endpoint address
    */
    constructor(
      address _lzEndpoint
    ) Ownable(msg.sender) ERC20Permit(_name) OFT(_name, _symbol, _lzEndpoint, msg.sender) {}

  /**
   * @dev Exchange XTZ for the same amount of WXTZ
   * The amount of XTZ to exchange is defined in the 'value' parameter of the sendTransaction call
   */
    receive() external payable {
        deposit();
    }

    /**
    * @dev Exchange XTZ for the same amount of WXTZ
    * The amount of XTZ to exchange is defined in the 'value' parameter of the sendTransaction call
    */
    function deposit() public payable {
        _mint(msg.sender, msg.value);
        emit Deposit(msg.sender, msg.value);
    }

    /**
    * @dev Exchange WXTZ for the same amount of XTZ
    * @param wad The amount of WXTZ to exchange for XTZ
    */
    function withdraw(uint wad) public {
        require(balanceOf(msg.sender) >= wad);
        _burn(msg.sender, wad);
        (bool sent,) = payable(msg.sender).call{value: wad}("");
        require(sent, "Failed to send Ether");
        emit Withdrawal(msg.sender, wad);
    }
}
