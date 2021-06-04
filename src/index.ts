import Web3Modal, { ICoreOptions } from 'web3modal';
import { Network, Web3Provider } from '@ethersproject/providers';
import create from 'zustand';
import { useRef } from 'react';

type State = {
  provider?: Web3Provider;
  account?: Account;
  network?: Network;
  web3Modal?: Web3Modal;
};

const useStore = create<State>(_set => ({}));

type Account = string;
type ConnectWallet = (opts?: Partial<ICoreOptions>) => void;

type UseWallet = () => State & {
  connect: ConnectWallet;
  disconnect: () => void;
};

const NETWORK_NAME_OVERRIDES: Record<number, string> = {
  1: 'ethereum',
  137: 'matic',
  80001: 'mumbai',
};

export const useWallet: UseWallet = () => {
  const account = useStore(state => state.account);
  const network = useStore(state => state.network);
  const provider = useStore(state => state.provider);
  const web3ModalRef = useRef<Web3Modal>();
  const connect: ConnectWallet = async opts => {
    const web3Modal = new Web3Modal(opts);
    const web3ModalProvider = await web3Modal.connect();
    //@ts-ignore
    web3ModalRef.current = web3Modal;
    const getNetwork = async () => {
      const network = await initialProvider.getNetwork();
      if (NETWORK_NAME_OVERRIDES[network.chainId])
        network.name = NETWORK_NAME_OVERRIDES[network.chainId];
      return network;
    };

    const initialProvider = new Web3Provider(web3ModalProvider, 'any');
    const initialAccounts = await initialProvider.listAccounts();
    const initialNetwork = await getNetwork();

    useStore.setState({
      provider: initialProvider,
      network: initialNetwork,
      account: initialAccounts[0],
    });

    web3ModalProvider.on('accountsChanged', (accounts: string[]) => {
      useStore.setState({ account: accounts[0] });
    });

    web3ModalProvider.on('chainChanged', async (_chainId: string) => {
      const network = await getNetwork();
      useStore.setState({ network });
    });

    web3ModalProvider.on('disconnect', () => {
      web3Modal.clearCachedProvider();
    });
  };

  const disconnect = async () => {
    useStore.setState({
      provider: undefined,
      network: undefined,
      account: undefined,
    });
  };

  return {
    connect,
    provider,
    account,
    network,
    disconnect,
    web3Modal: web3ModalRef.current,
  };
};
