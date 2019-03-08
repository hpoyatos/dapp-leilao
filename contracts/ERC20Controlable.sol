pragma solidity 0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20Burnable.sol";
import "openzeppelin-solidity/contracts/access/roles/PauserRole.sol";
import "openzeppelin-solidity/contracts/access/roles/WhitelistAdminRole.sol";

/**
 * @title Controlable token
 * @dev ERC20 modified with pausable transfers and pre-approved transfer and burn operations.
 **/
contract ERC20Controlable is ERC20Burnable, PauserRole, WhitelistAdminRole {
    mapping (address => bool) private _controllers;


    event Paused(address account);
    event Unpaused(address account);
    event ControllerAdded(address account);

    bool private _paused;

    constructor () internal {
        _paused = false;
    }

    /**
     * @return true if the contract is paused, false otherwise.
     */
    function paused() public view returns (bool) {
        return _paused;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     */
    modifier whenNotPaused(address address1, address address2) {
        require(!_paused || _controllers[address1] || _controllers[address2]);
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     */
    modifier whenPaused() {
        require(_paused);
        _;
    }

    /**
     * @dev called by the owner to pause, triggers stopped state
     */
    function pause() public onlyPauser whenNotPaused(msg.sender, msg.sender) {
        _paused = true;
        emit Paused(msg.sender);
    }

    /**
     * @dev called by the owner to unpause, returns to normal state
     */
    function unpause() public onlyPauser whenPaused {
        _paused = false;
        emit Unpaused(msg.sender);
    }

    function transfer(address to, uint256 value) public whenNotPaused(msg.sender, to) returns (bool) {
        return super.transfer(to, value);
    }

    /**
     * @dev controllers can transfer withou allowance
     * @author Henrique Poyatos <hpoyatos@gmail.com>
     */
    function transferFrom(address from, address to, uint256 value) public whenNotPaused(from, to) returns (bool) {
      if (!_controllers[from] && !_controllers[to]) {
          return super.transferFrom(from, to, value);
      }
      _transfer(from, to, value);
      emit Approval(from, msg.sender, value);
      return true;
    }

    /**
     * @dev controllers can burn withou allowance
     * @author Henrique Poyatos <hpoyatos@gmail.com>
     */
    function burnFrom(address sender, address from, uint256 value) public {
        if (!_controllers[from] && sender != from){
            super.burnFrom(from, value);
        }
        _burn(from, value);
        //return true;
        //emit Approval(from, msg.sender, value);
    }

    function burn(uint256 value) public {
        _burn(msg.sender, value);
    }

    function approve(address spender, uint256 value) public whenNotPaused(msg.sender, spender) returns (bool) {
        return super.approve(spender, value);
    }

    function increaseAllowance(address spender, uint addedValue) public whenNotPaused(msg.sender, spender) returns (bool success) {
        return super.increaseAllowance(spender, addedValue);
    }

    function decreaseAllowance(address spender, uint subtractedValue) public whenNotPaused(msg.sender, spender) returns (bool success) {
        return super.decreaseAllowance(spender, subtractedValue);
    }

    /**
     * @dev adding controllers
     * @author Henrique Poyatos <hpoyatos@gmail.com>
     */
    function addController(address account) public onlyWhitelistAdmin {
        _addController(account);
    }

    function _addController(address account) internal {
        _controllers[account] = true;
        emit ControllerAdded(account);
    }

    function mint(address to, uint256 value) public onlyWhitelistAdmin returns (bool) {
        _mint(to, value);
        return true;
    }
}
