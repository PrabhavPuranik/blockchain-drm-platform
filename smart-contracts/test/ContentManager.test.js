const { expect } = require("chai");
const { ethers } = require("hardhat");

// 'describe' is a way to group related tests together.
describe("ContentManager Contract", function () {
  // These variables will be used across multiple tests.
  let ContentManager;
  let contentManager;
  let owner;
  let addr1;
  let addr2;

  // 'beforeEach' is a hook that runs before each 'it' test block.
  // This is perfect for setting up a fresh state for every test,
  // so the outcome of one test doesn't affect another.
  beforeEach(async function () {
    // Get the ContractFactory and Signers here. A Signer is an object
    // that represents an Ethereum account, used to send transactions.
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy a new instance of the ContentManager contract before each test.
    const ContentManagerFactory = await ethers.getContractFactory("ContentManager");
    contentManager = await ContentManagerFactory.deploy();
  });

  // Test case 1: Checks if the deployment was successful.
  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      // 'expect' is from the Chai library. We expect the contract's owner
      // to be the address of the deployer (our 'owner' signer).
      expect(await contentManager.owner()).to.equal(owner.address);
    });
  });

  // Test case 2: A group of tests for the content registration functionality.
  describe("Content Registration", function () {
    it("Should allow a user to register new content", async function () {
      const title = "My First Content";
      const price = ethers.parseEther("1.0"); // 1 ETH
      const encryptedKeyCID = "placeholder_cid_123";

      // Call the registerContent function from the 'owner' account.
      await contentManager.registerContent(title, price, encryptedKeyCID);

      // Check if the content was stored correctly.
      const content = await contentManager.contents(1);
      expect(content.id).to.equal(1);
      expect(content.title).to.equal(title);
      expect(content.owner).to.equal(owner.address);
      expect(content.price).to.equal(price);
    });

    it("Should increment the content ID counter", async function () {
      // Register first piece of content
      await contentManager.registerContent("Title 1", ethers.parseEther("1"), "cid1");
      // Register second piece of content
      await contentManager.registerContent("Title 2", ethers.parseEther("2"), "cid2");

      // Check the counter using our public getter function
      const count = await contentManager.getContentCount();
      expect(count).to.equal(2);
    });
  });

  // Test case 3: A group of tests for the purchasing functionality.
  describe("Content Purchase", function () {
    const price = ethers.parseEther("1.0");

    beforeEach(async function () {
      // Before each purchase test, we need some content to be registered.
      await contentManager.connect(owner).registerContent("Test Title", price, "cid_test");
    });

    it("Should allow a user to purchase content and transfer ownership", async function () {
      // The content (ID 1) is owned by 'owner'. 'addr1' will be the buyer.
      // We connect 'addr1' to the contract to send the transaction from their account.
      await contentManager.connect(addr1).purchaseContent(1, { value: price });

      const content = await contentManager.contents(1);
      // Assert that the owner has changed to the buyer's address.
      expect(content.owner).to.equal(addr1.address);
    });

    it("Should transfer the ETH to the previous owner", async function () {
      // Using Chai's 'changeEtherBalance' matcher to check balances.
      // We expect the 'owner's balance to increase by the price,
      // and the 'addr1's balance to decrease by the price (plus gas costs).
      await expect(
        await contentManager.connect(addr1).purchaseContent(1, { value: price })
      ).to.changeEtherBalance(owner, price);
    });

    it("Should fail if insufficient ETH is sent", async function () {
      const insufficientAmount = ethers.parseEther("0.5");

      // We expect this transaction to be 'reverted' (fail) with a specific error message.
      // This tests our 'require' statement in the contract.
      await expect(
        contentManager.connect(addr1).purchaseContent(1, { value: insufficientAmount })
      ).to.be.revertedWith("Insufficient Ether sent. Please send the exact price.");
    });

    it("Should not allow the owner to purchase their own content", async function () {
      await expect(
        contentManager.connect(owner).purchaseContent(1, { value: price })
      ).to.be.revertedWith("You already own this content.");
    });
  });
});