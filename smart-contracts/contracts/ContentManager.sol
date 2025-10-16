// Specifies the version of the Solidity compiler this code should use.
// The '^' means it's compatible with any version from 0.8.24 up to (but not including) 0.9.0.
pragma solidity ^0.8.24;

// A contract in Solidity is like a class in other programming languages.
// It's a collection of data and functions.
contract ContentManager {

    // A 'struct' is a custom data type that can group several variables.
    // We use it to represent a single piece of digital content.
    struct Content {
        uint256 id;                 // A unique identifier for the content
        string title;               // The title of the content
        address payable creator;    // The wallet address of the person who uploaded it. 'payable' means this address can receive Ether.
        address payable owner;      // The wallet address of the current owner
        uint256 price;              // The price of the content in Wei (the smallest unit of Ether)
        bool isForSale;             // A flag to check if the content is currently for sale
        string encryptedKeyCID;     // A pointer (like a URL) to where the encrypted decryption key is stored. For now, we'll store a placeholder.
    }

    // A 'mapping' is like a hash table or dictionary.
    // This one maps a content ID (a number) to its Content struct.
    // 'public' means anyone can read the data in this mapping.
    mapping(uint256 => Content) public contents;

    // A counter to ensure every new piece of content gets a unique ID.
    // It's a state variable, so its value is permanently stored on the blockchain.
    uint256 private _contentIdCounter;

    // An 'event' is a way for a smart contract to log that something important happened.
    // Our frontend application can listen for these events to update the UI.
    event ContentRegistered(
        uint256 id,
        string title,
        address creator,
        uint256 price
    );

    event ContentSold(
        uint256 id,
        address newOwner,
        uint256 price
    );

    // A function to register a new piece of content.
    // 'external' means this function can only be called from outside the contract (e.g., from a user's wallet).
    function registerContent(
        string memory _title, 
        uint256 _price, 
        string memory _encryptedKeyCID
    ) external {
        // Increment the counter to get a new, unique ID for this content.
        _contentIdCounter++;
        uint256 newId = _contentIdCounter;

        // Create a new Content struct in memory.
        // 'msg.sender' is a global variable in Solidity that always holds the address of the wallet that called the function.
        contents[newId] = Content({
            id: newId,
            title: _title,
            creator: payable(msg.sender),
            owner: payable(msg.sender), // The creator is the first owner.
            price: _price,
            isForSale: true, // It's for sale by default upon registration.
            encryptedKeyCID: _encryptedKeyCID
        });

        // Emit the event to notify the outside world that a new content was registered.
        emit ContentRegistered(newId, _title, msg.sender, _price);
    }

    // A function for a user to purchase content.
    // 'payable' is a special keyword that allows this function to receive Ether.
    function purchaseContent(uint256 _id) external payable {
        // Retrieve the content from our mapping.
        Content storage contentToBuy = contents[_id];

        // 'require' is a check. If the condition inside is false, the entire transaction fails and is reverted.
        // This prevents common errors and attacks.
        require(contentToBuy.id != 0, "Content does not exist.");
        require(contentToBuy.isForSale, "Content is not for sale.");
        require(msg.value >= contentToBuy.price, "Insufficient Ether sent. Please send the exact price.");
        require(msg.sender != contentToBuy.owner, "You already own this content.");

        // Store the previous owner's address.
        address payable previousOwner = contentToBuy.owner;

        // Transfer ownership to the buyer.
        contentToBuy.owner = payable(msg.sender);
        contentToBuy.isForSale = false; // The content is no longer for sale after purchase.

        // Send the Ether to the previous owner.
        // .transfer() is a safe way to send Ether.
        previousOwner.transfer(contentToBuy.price);

        // Emit the event to log the sale.
        emit ContentSold(_id, msg.sender, contentToBuy.price);
    }
}