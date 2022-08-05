//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@fractal-framework/core-contracts/contracts/ModuleBase.sol";

contract Treasury is ModuleBase {
    using SafeERC20 for IERC20;
    address public Token;


    /// @notice Function for initializing the contract that can only be called once
    /// @param _accessControl The address of the access control contract
    function initialize(address _accessControl, address _Token)
        external
        initializer
    {
        __initBase(_accessControl, msg.sender, "Treasury");
        Token = _Token;
    }

    function depositERC20Tokens(uint256 amount) external {
        IERC20(Token).safeTransferFrom(msg.sender, address(this), amount);
    }

    function withdrawERC20Tokens(
        address recipient,
        uint256 amount
    ) external authorized {
        IERC20(Token).safeTransfer(
            recipient,
            amount
        );
    }
}
