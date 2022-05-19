/* eslint-disable node/no-missing-import */
import { expect } from "chai";
import { ethers } from "hardhat";
import { Ballot } from "../../typechain";
import { PROPOSALS } from "../../scripts/utils/Proposals";

function convertStringArrayToBytes32(array: string[]) {
  const bytes32Array = [];
  for (let index = 0; index < array.length; index++) {
    bytes32Array.push(ethers.utils.formatBytes32String(array[index]));
  }
  return bytes32Array;
}

async function giveRightToVote(ballotContract: Ballot, voterAddress: any) {
  const tx = await ballotContract.giveRightToVote(voterAddress);
  await tx.wait();
}

describe("Ballot", function () {
  let ballotContract: Ballot;
  let accounts: any[];

  this.beforeEach(async function () {
    accounts = await ethers.getSigners();
    const ballotFactory = await ethers.getContractFactory("Ballot");
    ballotContract = await ballotFactory.deploy(
      convertStringArrayToBytes32(PROPOSALS)
    );
    await ballotContract.deployed();
  });

  describe("when the contract is deployed", function () {
    it("has the provided proposals", async function () {
      for (let index = 0; index < PROPOSALS.length; index++) {
        const proposal = await ballotContract.proposals(index);
        expect(ethers.utils.parseBytes32String(proposal.name)).to.eq(
          PROPOSALS[index]
        );
      }
    });

    it("has zero votes for all proposals", async function () {
      for (let index = 0; index < PROPOSALS.length; index++) {
        const proposal = await ballotContract.proposals(index);
        expect(proposal.voteCount.toNumber()).to.eq(0);
      }
    });

    it("sets the deployer address as chairperson", async function () {
      const chairperson = await ballotContract.chairperson();
      expect(chairperson).to.eq(accounts[0].address);
    });

    it("sets the voting weight for the chairperson as 1", async function () {
      const chairpersonVoter = await ballotContract.voters(accounts[0].address);
      expect(chairpersonVoter.weight.toNumber()).to.eq(1);
    });
  });

  describe("when the chairperson interacts with the giveRightToVote function in the contract", function () {
    let voterAddress: any;

    this.beforeEach(async function () {
      voterAddress = accounts[1].address;
    });

    describe("does not have right to vote", async function () {
      it("triggers the NewVoter event with the address of the new voter", async function () {
        await expect(ballotContract.giveRightToVote(voterAddress))
          .to.emit(ballotContract, "NewVoter")
          .withArgs(voterAddress);
      });
    });

    describe("has right to vote", async function () {
      this.beforeEach(async function () {
        await giveRightToVote(ballotContract, voterAddress);
      });

      it("gives right to vote for another address", async function () {
        const voter = await ballotContract.voters(voterAddress);
        expect(voter.weight.toNumber()).to.eq(1);
      });

      it("can not give right to vote for someone that has voted", async function () {
        await ballotContract.connect(accounts[1]).vote(0);
        await expect(
          giveRightToVote(ballotContract, voterAddress)
        ).to.be.revertedWith("The voter already voted.");
      });

      it("can not give right to vote for someone that has already voting rights", async function () {
        await expect(
          giveRightToVote(ballotContract, voterAddress)
        ).to.be.revertedWith("");
      });
    });
  });

  describe("when the voter interact with the vote function in the contract", function () {
    let voter: any;

    beforeEach(async function () {
      voter = voter = accounts[1];
    });

    describe("when the voter does not have voting rights", function () {
      it("should revert if the voter has not been given right to vote", async function () {
        await expect(ballotContract.connect(voter).vote(0)).to.be.revertedWith(
          "Has no right to vote"
        );
      });
    });

    describe("when the voter has voting rights but has not voted)", function () {
      this.beforeEach(async function () {
        await giveRightToVote(ballotContract, voter.address);
      });

      it("triggers the Voted event", async function () {
        await expect(ballotContract.connect(voter).vote(1))
          .to.emit(ballotContract, "Voted")
          .withArgs(voter.address, 1, 1);
      });
    });

    describe("when the voter has voting rights and has voted for proposal 2(index 1)", function () {
      this.beforeEach(async function () {
        await giveRightToVote(ballotContract, voter.address);
        await ballotContract.connect(voter).vote(1);
      });

      it("should revert if the voter has already voted", async function () {
        await expect(ballotContract.connect(voter).vote(1)).to.be.revertedWith(
          "Already voted."
        );
      });

      it("should set the voted property to true", async function () {
        const voterData = await ballotContract.voters(accounts[1].address);
        expect(voterData.voted).to.eq(true);
      });

      it("should set vote property to proposal of choice", async function () {
        const voterData = await ballotContract.voters(accounts[1].address);
        expect(voterData.vote).to.eq(1);
      });

      it("should increment the proposal's vote count with the sender weight", async function () {
        // Vote as chairperson as well
        await ballotContract.vote(1);
        const proposalData = await ballotContract.proposals(1);
        expect(proposalData.voteCount).to.eq(2);
      });
    });
  });

  describe("when the voter interact with the delegate function in the contract", function () {
    let voter: any, delegatee: any, finalDelegatee: any;

    beforeEach(async function () {
      voter = accounts[1];
      delegatee = accounts[2];
      finalDelegatee = accounts[3];
    });

    describe("when the voter does not have voting rights", function () {
      it("should not allow delegation to wallets that cannot vote", async function () {
        await expect(ballotContract.connect(voter).delegate(delegatee.address))
          .to.be.reverted;
      });
    });

    describe("when the voter has voting rights", function () {
      this.beforeEach(async function () {
        await giveRightToVote(ballotContract, voter.address);
        await giveRightToVote(ballotContract, delegatee.address);
        await giveRightToVote(ballotContract, finalDelegatee.address);
      });

      it("should not allow self delegation", async function () {
        await expect(
          ballotContract.connect(voter).delegate(voter.address)
        ).to.be.revertedWith("Self-delegation is disallowed.");
      });

      it("should revert if msg.sender is found in the delegation loop", async function () {
        await ballotContract.connect(voter).delegate(delegatee.address);
        await expect(
          ballotContract.connect(delegatee).delegate(voter.address)
        ).to.be.revertedWith("Found loop in delegation.");
      });

      it("should delegate to other address(delegatee's delegate) if delegatee has delegated", async function () {
        // Delegatee has delegated to another address before voter delegates
        await ballotContract
          .connect(delegatee)
          .delegate(finalDelegatee.address);
        await ballotContract.connect(voter).delegate(delegatee.address);
        const voterData = await ballotContract.voters(voter.address);
        expect(voterData.delegate).to.eq(finalDelegatee.address);
      });

      it("should not allow delegation if you have voted", async function () {
        await ballotContract.connect(voter).vote(1);
        await expect(
          ballotContract.connect(voter).delegate(accounts[2].address)
        ).to.be.revertedWith("You already voted.");
      });

      it("should set the voted property to true after delegation", async function () {
        await ballotContract.connect(voter).delegate(delegatee.address);
        const voterData = await ballotContract.voters(voter.address);
        expect(voterData.voted).to.eq(true);
      });

      it("should set delegate property to the required account", async function () {
        await ballotContract.connect(voter).delegate(delegatee.address);
        const voterData = await ballotContract.voters(voter.address);
        expect(voterData.delegate).to.eq(delegatee.address);
      });

      it("should add direct to proposal votes if delegatee has already voted", async function () {
        await ballotContract.connect(delegatee).vote(1);
        expect((await ballotContract.proposals(1)).voteCount).to.be.eq(1);
        await ballotContract.connect(voter).delegate(delegatee.address);
        expect((await ballotContract.proposals(1)).voteCount).to.be.eq(2);
      });

      it("should add to the delegatee weight if the delegetee has not voted", async function () {
        expect((await ballotContract.voters(delegatee.address)).weight).to.eq(
          1
        );
        await ballotContract.connect(voter).delegate(delegatee.address);
        expect((await ballotContract.voters(delegatee.address)).weight).to.eq(
          2
        );
      });

      it("triggers the Delegated event", async function () {
        await expect(ballotContract.connect(voter).delegate(delegatee.address))
          .to.emit(ballotContract, "Delegated")
          .withArgs(voter.address, delegatee.address, 2, false, 0, 0);
      });
    });
  });

  describe("when the an attacker interact with the giveRightToVote function in the contract", function () {
    it("should be reverted since the attacker is not the chairperson", async function () {
      await expect(
        ballotContract.connect(accounts[1]).giveRightToVote(accounts[1].address)
      ).to.be.revertedWith("Only chairperson can give right to vote.");
    });
  });

  describe("when the an attacker interact with the vote function in the contract", function () {
    it("should be reverted since the attacker has not been given rights to vote by chairperson", async function () {
      await expect(
        ballotContract.connect(accounts[1]).vote(0)
      ).to.be.revertedWith("Has no right to vote");
    });
  });

  describe("when the an attacker interact with the delegate function in the contract", function () {
    let attacker: any, delegatee: any;

    this.beforeEach(async function () {
      attacker = accounts[1];
      delegatee = accounts[2];
    });

    it("should be reverted if delegatee has no weight", async function () {
      await expect(ballotContract.connect(attacker).delegate(delegatee.address))
        .to.be.reverted;
    });

    it("should delegate with a weight of 0 if the delegatee has the rights to vote", async function () {
      await giveRightToVote(ballotContract, delegatee.address);
      await ballotContract.connect(attacker).delegate(delegatee.address);
      const delegateeData = await ballotContract.voters(delegatee.address);
      expect(delegateeData.weight).to.eq(1);
    });
  });

  describe("when someone interact with the winningProposal function before any votes are cast", function () {
    it("should expect winningProposal to return as default variable(0)", async function () {
      expect(await ballotContract.winningProposal()).to.be.eq(0);
    });
  });

  describe("when someone interact with the winningProposal function after one vote is cast for the first proposal", function () {
    it("should return the correct index to the winningProposal", async function () {
      await ballotContract.vote(0);
      expect(await ballotContract.winningProposal()).to.be.eq(0);
    });
  });

  describe("when someone interact with the winnerName function before any votes are cast", function () {
    it("should return the name of the proposal belonging to the default index(0)", async function () {
      const winningName = await ballotContract.winnerName();
      expect(ethers.utils.parseBytes32String(winningName)).to.be.eq(
        "Proposal 1"
      );
    });
  });

  describe("when someone interact with the winnerName function after one vote is cast for the first proposal", function () {
    it("should return the name of the voted for proposal(Proposal 1)", async function () {
      ballotContract.vote(0);
      const winningName = await ballotContract.winnerName();
      expect(ethers.utils.parseBytes32String(winningName)).to.be.eq(
        "Proposal 1"
      );
    });
  });

  describe("when someone interact with the winningProposal function and winnerName after 5 random votes are cast for the proposals", function () {
    this.beforeEach(async function () {
      for (let i = 1; i < 5; i++) {
        await ballotContract.giveRightToVote(accounts[i].address);
      }

      await ballotContract.vote(2);
      await ballotContract.connect(accounts[1]).vote(1);
      await ballotContract.connect(accounts[2]).vote(2);
      await ballotContract.connect(accounts[3]).vote(0);
      await ballotContract.connect(accounts[4]).vote(2);
    });

    it("(winningProposal) should return the index of the most voted for proposal", async function () {
      expect(await ballotContract.winningProposal()).to.be.eq(2);
    });

    it("(winnerName) should return the name of the most voted for proposal", async function () {
      const winningName = await ballotContract.winnerName();
      expect(ethers.utils.parseBytes32String(winningName)).to.be.eq(
        "Proposal 3"
      );
    });
  });
});
