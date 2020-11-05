import React, { useEffect, useReducer } from "react";
import {
  Heading,
  Text,
  VStack,
  Button,
  HStack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from "@chakra-ui/core";
// https://docs.ethers.io/v5/
import { ethers } from "ethers";
import { isConnected2MetaMask } from "../utils/eth-utils";

// send `transaction`, so ethers, from signer address
const sendTransaction = async (signer, provider, transaction) => {
  try {
    console.log("before");
    // send the transaction and return a transaction response
    const tx = await signer.sendTransaction(transaction);
    console.log("i am here");
    // wait for tx.hash to be mined with 3 block validation and a timeout of 120 seconds
    // if succeed returns a receipt of the transaction
    const receipt = await provider.waitForTransaction(tx.hash, 3, 120000);
    return receipt;
  } catch (e) {
    return null;
  }
};

const web3Reducer = (state, action) => {
  switch (action.type) {
    case "SET_isWeb3":
      return { ...state, isWeb3: action.isWeb3 };
    case "SET_isEnabled":
      return { ...state, isEnabled: action.isEnabled };
    case "SET_account":
      return { ...state, account: action.account };
    case "SET_provider":
      return { ...state, provider: action.provider };
    case "SET_network":
      return { ...state, network: action.network };
    case "SET_signer":
      return { ...state, signer: action.signer };
    case "SET_balance":
      return { ...state, balance: action.balance };
    default:
      throw new Error(`Unhandled action ${action.type} in web3Reducer`);
  }
};

const initialWeb3State = {
  isWeb3: false,
  isEnabled: false,
  account: ethers.constants.AddressZero,
  provider: null,
  signer: null,
  network: null,
  balance: "0",
};

const dappReducer = (state, action) => {
  switch (action.type) {
    case "SET_connecting":
      return { ...state, connecting: action.connecting };
    case "SET_donateValue":
      return { ...state, donateValue: action.donateValue };
    default:
      throw new Error(`Unhandled action ${action.type} in dappReducer`);
  }
};

const initialDappState = {
  donateValue: "0.0000",
  connecting: false,
  myAddr: "0x1f4fdad26cfe9636adb5595a3814a25e892a9326",
};

function Main() {
  const [web3State, web3Dispatch] = useReducer(web3Reducer, initialWeb3State);
  const [dappState, dappDispatch] = useReducer(dappReducer, initialDappState);

  const handleOnConnect = () => {
    if (!web3State.isEnabled)
      dappDispatch({ type: "SET_connecting", connecting: true });
  };

  const handleOnChange = (currentDonateValue) => {
    dappDispatch({
      type: "SET_donateValue",
      donateValue: currentDonateValue,
    });
  };

  // Check if Web3 is injected
  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      web3Dispatch({ type: "SET_isWeb3", isWeb3: true });
    } else {
      web3Dispatch({ type: "SET_isWeb3", isWeb3: false });
    }
  }, []);

  // Check if already connected to MetaMask
  useEffect(() => {
    const isConnected = async () => {
      const account = await isConnected2MetaMask();
      if (account) {
        web3Dispatch({ type: "SET_isEnabled", isEnabled: true });
        web3Dispatch({ type: "SET_account", account: account });
      } else {
        web3Dispatch({ type: "SET_isEnabled", isEnabled: false });
      }
    };
    isConnected();
  }, [web3State.isWeb3]);

  //If not connected to metamask can connect with button
  useEffect(() => {
    const connect2MetaMask = async () => {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        web3Dispatch({ type: "SET_isEnabled", isEnabled: true });
        web3Dispatch({ type: "SET_account", account: accounts[0] });
      } catch (e) {
        web3Dispatch({
          type: "SET_account",
          account: ethers.constants.AddressZero,
        });
        web3Dispatch({ type: "SET_isEnabled", isEnabled: false });
      } finally {
        dappDispatch({ type: "SET_connecting", connecting: false });
      }
    };

    if (web3State.isWeb3 && dappState.connecting && !web3State.isEnabled) {
      connect2MetaMask();
    }
  }, [web3State.isWeb3, dappState.connecting, web3State.isEnabled]);

  // Connect to provider
  useEffect(() => {
    const connect2Provider = async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        web3Dispatch({ type: "SET_provider", provider: provider });
        const signer = provider.getSigner();
        web3Dispatch({ type: "SET_signer", signer: signer });
        // https://docs.ethers.io/v5/api/providers/provider/#Provider-getBalance
        const network = await provider.getNetwork();
        web3Dispatch({ type: "SET_network", network: network });
        // https://docs.ethers.io/v5/api/providers/provider/#Provider-getBalance
        const _balance = await provider.getBalance(web3State.account);
        // https://docs.ethers.io/v5/api/utils/display-logic/#utils-formatEther
        const balance = ethers.utils.formatEther(_balance);
        web3Dispatch({ type: "SET_balance", balance: balance });
      } catch (e) {
        web3Dispatch({
          type: "SET_network",
          network: initialWeb3State.network,
        });
        web3Dispatch({
          type: "SET_balance",
          balance: initialWeb3State.balance,
        });
      }
    };

    if (
      web3State.isEnabled &&
      web3State.account !== ethers.constants.AddressZero
    ) {
      connect2Provider();
    }
  }, [web3State.isEnabled, web3State.account]);

  return (
    <>
      <VStack>
        <Heading>Web3 demo</Heading>
        <Heading mb={10} size="lg">
          Connection, transaction and smart contracts
        </Heading>

        {!web3State.isWeb3 && <Text>Please install MetaMask</Text>}

        {web3State.isEnabled ? (
          <Text color="green.500">MetaMask status: connected</Text>
        ) : (
          <Text color="red.500">MetaMask status: disconnected</Text>
        )}

        {web3State.isEnabled &&
          web3State.network !== null &&
          web3State.account !== ethers.constants.AddressZero && (
            <>
              <Text>Connected to : {web3State.network.name}</Text>
              <Text>Account : {web3State.account}</Text>

              <Text>Balance : {web3State.balance} ETH</Text>

              {web3State.network && (
                <>
                  <Text>Network name : {web3State.network.name}</Text>

                  <Text>Network ID : {web3State.network.chainId}</Text>
                </>
              )}
            </>
          )}
        <HStack>
          <NumberInput
            value={dappState.donateValue}
            defaultValue={initialDappState.donateValue}
            precision={3}
            step={0.02}
            min={0}
            max={web3State.balance}
            onChange={handleOnChange}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <Button
            onClick={async () =>
              await sendTransaction(web3State.signer, web3State.provider, {
                to: dappState.myAddr,
                value: ethers.utils.parseEther(dappState.donateValue),
              })
            }
          >
            SEND {dappState.donateValue} ETH
          </Button>
        </HStack>
        {!web3State.isEnabled && (
          <Button onClick={handleOnConnect}>Connect</Button>
        )}
      </VStack>
    </>
  );
}

export default Main;
