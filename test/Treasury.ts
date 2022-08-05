import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  AccessControlDAO,
  AccessControlDAO__factory,
  DAO,
  DAO__factory,
  VotesTokenWithSupply,
  VotesTokenWithSupply__factory,
  Treasury,
  Treasury__factory,
} from "../typechain-types";
import chai from "chai";
import { ethers } from "hardhat";

const expect = chai.expect;

describe("Treasury", function () {
  let dao: DAO;
  let accessControl: AccessControlDAO;
  let treasury: Treasury;

  // eslint-disable-next-line camelcase
  let erc20TokenAlpha: VotesTokenWithSupply;
  let deployer: SignerWithAddress;
  let withdrawer: SignerWithAddress;
  let userA: SignerWithAddress;

  // Roles
  const daoRoleString = "DAO_ROLE";
  const withdrawerRoleString = "WITHDRAWER_ROLE";

  describe("Treasury supports ERC-20 tokens", function () {
    beforeEach(async function () {
      [deployer, withdrawer, userA] = await ethers.getSigners();

      dao = await new DAO__factory(deployer).deploy();
      accessControl = await new AccessControlDAO__factory(deployer).deploy();
      treasury = await new Treasury__factory(deployer).deploy();

      await accessControl
        .connect(deployer)
        .initialize(
          dao.address,
          [withdrawerRoleString],
          [daoRoleString],
          [[withdrawer.address]],
          [treasury.address],
          ["withdrawERC20Tokens(address,uint256)"],
          [[withdrawerRoleString]]
        );

      erc20TokenAlpha = await new VotesTokenWithSupply__factory(
        deployer
      ).deploy(
        "ALPHA",
        "ALPHA",
        [treasury.address, userA.address],
        [
          ethers.utils.parseUnits("100.0", 18),
          ethers.utils.parseUnits("100.0", 18),
        ],
        ethers.utils.parseUnits("200", 18),
        treasury.address
      );
      await treasury
        .connect(deployer)
        .initialize(accessControl.address, erc20TokenAlpha.address);

      await erc20TokenAlpha
        .connect(userA)
        .approve(treasury.address, ethers.utils.parseUnits("100.0", 18));
    });

    it("Receives ERC-20 tokens using the deposit function", async () => {
      await treasury
        .connect(userA)
        .depositERC20Tokens(ethers.utils.parseUnits("50.0", 18));

      expect(await erc20TokenAlpha.balanceOf(userA.address)).to.equal(
        ethers.utils.parseUnits("50.0", 18)
      );
      expect(await erc20TokenAlpha.balanceOf(treasury.address)).to.equal(
        ethers.utils.parseUnits("150.0", 18)
      );
    });

    it("Sends ERC-20 tokens using the withdraw function", async () => {
      await treasury
        .connect(withdrawer)
        .withdrawERC20Tokens(
          withdrawer.address,
          ethers.utils.parseUnits("100.0", 18)
        );

      expect(await erc20TokenAlpha.balanceOf(withdrawer.address)).to.equal(
        ethers.utils.parseUnits("100.0", 18)
      );
      expect(await erc20TokenAlpha.balanceOf(treasury.address)).to.equal(
        ethers.utils.parseUnits("0", 18)
      );
    });

    it("Reverts when a non authorized user attempts to withdraw ERC-20 tokens", async () => {
      await expect(
        treasury
          .connect(userA)
          .withdrawERC20Tokens(
            withdrawer.address,
            ethers.utils.parseUnits("50.0", 18)
          )
      ).to.be.revertedWith("NotAuthorized()");
    });
  });
});
