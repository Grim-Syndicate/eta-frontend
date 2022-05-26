import { FC, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
    LedgerWalletAdapter,
    PhantomWalletAdapter,
    SlopeWalletAdapter,
    SolflareWalletAdapter,
    SolletExtensionWalletAdapter,
    SolletWalletAdapter,
    TorusWalletAdapter,
    GlowWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import {
    WalletModalProvider,
} from '@solana/wallet-adapter-react-ui';

// Default styles that can be overridden by your app
require('@solana/wallet-adapter-react-ui/styles.css');

const WalletConnectionProvider = ({children}:any) => {
    // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK as WalletAdapterNetwork;
    const solanaRPC = process.env.NEXT_PUBLIC_SOLANA_RPC_HOST!;

    // const network = WalletAdapterNetwork.Devnet;

    // You can also provide a custom RPC endpoint.
    // const endpoint = useMemo(() => clusterApiUrl(network), [network]);
    const endpoint = useMemo(() => solanaRPC, undefined);

    // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
    // Only the wallets you configure here will be compiled into your application, and only the dependencies
    // of wallets that your users connect to will be loaded.
    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new GlowWalletAdapter(),
            new SolflareWalletAdapter(),
            new SlopeWalletAdapter(),
            new TorusWalletAdapter(),
            new LedgerWalletAdapter(),
            new SolletWalletAdapter({ network }),
            new SolletExtensionWalletAdapter({ network }),
        ],
        [network]
    );

    var result = (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );

    return result;
};

export default WalletConnectionProvider;