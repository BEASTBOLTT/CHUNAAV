
pragma solidity ^0.8.0;

contract Voting {
    address public admin;

    struct Candidate {
        string name;
        string electionId;
        uint256 voteCount;
    }

    Candidate[] public candidates;

    // electionId => voterHash => voted?
    mapping(string => mapping(bytes32 => bool)) public hasVoted;

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function addCandidate(
        string memory _name,
        string memory _electionId
    ) public onlyAdmin {
        candidates.push(
            Candidate({
                name: _name,
                electionId: _electionId,
                voteCount: 0
            })
        );
    }

    function vote(
        uint256 candidateIndex,
        string memory electionId,
        bytes32 voterHash
    ) public {
        require(candidateIndex < candidates.length, "Invalid candidate");

        Candidate storage c = candidates[candidateIndex];

        require(
            keccak256(bytes(c.electionId)) ==
                keccak256(bytes(electionId)),
            "Wrong election"
        );

        require(
            !hasVoted[electionId][voterHash],
            "Already voted"
        );

        c.voteCount += 1;
        hasVoted[electionId][voterHash] = true;
    }

    function getCandidate(uint256 index)
        public
        view
        returns (
            string memory,
            string memory,
            uint256
        )
    {
        Candidate memory c = candidates[index];
        return (c.name, c.electionId, c.voteCount);
    }

    function getCandidateCount()
        public
        view
        returns (uint256)
    {
        return candidates.length;
    }
}
