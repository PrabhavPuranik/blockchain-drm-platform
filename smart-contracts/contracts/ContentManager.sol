// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Import the Ownable contract from the OpenZeppelin library
import "@openzeppelin/contracts/access/Ownable.sol";

// Update our contract to inherit from Ownable.
// This gives us an 'owner()' function and a 'transferOwnership' modifier.
contract ContentManager is Ownable {

  // The rest of your contract's code (struct, mapping, events, functions)
  // remains EXACTLY the same. Just add "is Ownable" above.

  // ... (struct Content) ...
  struct Content {
      uint256 id;
      string title;
      address payable creator;
      address payable owner;
      uint256 price;
      bool isForSale;
      string encryptedKeyCID;
  }

  // ... (mapping, counter, events) ...
  mapping(uint256 => Content) public contents;
  uint256 private _contentIdCounter;
  event ContentRegistered(uint256 id, string title, address creator, uint256 price);
  event ContentSold(uint256 id, address newOwner, uint256 price);

  // We add a constructor to set the initial owner when the contract is deployed.
  // Ownable's constructor will set msg.sender as the owner.
  constructor() Ownable(msg.sender) {}

  // ... (registerContent, purchaseContent, getContentCount functions) ...
  function registerContent(
      string memory _title, 
      uint256 _price, 
      string memory _encryptedKeyCID
  ) external {
      _contentIdCounter++;
      uint256 newId = _contentIdCounter;
      contents[newId] = Content({
          id: newId,
          title: _title,
          creator: payable(msg.sender),
          owner: payable(msg.sender),
          price: _price,
          isForSale: true,
          encryptedKeyCID: _encryptedKeyCID
      });
      emit ContentRegistered(newId, _title, msg.sender, _price);
  }

  function purchaseContent(uint256 _id) external payable {
      Content storage contentToBuy = contents[_id];
      require(contentToBuy.id != 0, "Content does not exist.");
      require(contentToBuy.isForSale, "Content is not for sale.");
      require(msg.value >= contentToBuy.price, "Insufficient Ether sent. Please send the exact price.");
      require(msg.sender != contentToBuy.owner, "You already own this content.");
      address payable previousOwner = contentToBuy.owner;
      contentToBuy.owner = payable(msg.sender);
      contentToBuy.isForSale = false;
      previousOwner.transfer(contentToBuy.price);
      emit ContentSold(_id, msg.sender, contentToBuy.price);
  }

  function getContentCount() external view returns (uint256) {
      return _contentIdCounter;
  }
}