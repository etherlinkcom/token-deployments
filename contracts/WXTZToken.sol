// SPDX-License-Identifier: MIT
pragma solidity 0.8.22;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { OFT } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/OFT.sol";

/**
* @title WXTZ Token
* @dev This token contract aims to emulate the WETH9 contract on Ethereum mainnet.
* It inherits from the OFT standard to allow for briding across EVM chains.
*/
contract WXTZToken is OFT {
    string private _name        = "Wrapped XTZ";
    string private _symbol      = "WXTZ";

    event Deposit(address indexed dst, uint wad);
    event Withdrawal(address indexed src, uint wad);

    /**
    * @dev The contract constructor
    * @param _owner The owner address of the contract
    * @param _lzEndpoint The LayerZero endpoint address
    */
    constructor(
      address _owner,
      address _lzEndpoint
    ) OFT(_name, _symbol, _lzEndpoint, _owner) Ownable(_owner) {}

  /**
   * @dev Exchange XTZ for WXTZ by appending XTZ in the 'value' parameter of the sendTransaction call
   */
    receive() external payable {
        deposit();
    }

    /**
    * @dev Exchange XTZ for WXTZ by appending XTZ in the 'value' parameter of the sendTransaction call
    */
    function deposit() public payable {
        _mint(msg.sender, msg.value);
        emit Deposit(msg.sender, msg.value);
    }

    /**
    * @dev Exchange WXTZ for XTZ
    * @param wad The amount of WXTZ to exchange
    */
    function withdraw(uint wad) public {
        require(balanceOf(msg.sender) >= wad);
        _burn(msg.sender, wad);
        payable(msg.sender).transfer(wad);
        emit Withdrawal(msg.sender, wad);
    }
}
