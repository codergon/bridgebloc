export const crossChainBridgeAbi = {
  abi: [
    {
      inputs: [
        {
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
        {
          internalType: "address",
          name: "sourceToken",
          type: "address",
        },
        {
          internalType: "address",
          name: "destinationToken",
          type: "address",
        },
        {
          internalType: "uint32",
          name: "destinationDomain",
          type: "uint32",
        },
        {
          internalType: "address",
          name: "recipient",
          type: "address",
        },
        {
          internalType: "address",
          name: "destinationContract",
          type: "address",
        },
      ],
      name: "deposit",
      outputs: [
        {
          internalType: "uint64",
          name: "",
          type: "uint64",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
  ],
} as const;
