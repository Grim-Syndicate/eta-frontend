import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Grid from '@mui/material/Grid';
import WalletConnectionProvider from '../components/WalletConnectionProvider'
import { GrimsProvider } from '../components/GrimsProvider'
import Nav from '../components/Nav'

function MyApp({ Component, pageProps }: AppProps) {
  return <WalletConnectionProvider>
      <GrimsProvider>
        <Nav />
        <Grid container columns={24} flex={1} className="app-content">
          <Grid item xs={24}>
            <Component {...pageProps} />
          </Grid>
        </Grid>
      </GrimsProvider>
    </WalletConnectionProvider>
}

export default MyApp
