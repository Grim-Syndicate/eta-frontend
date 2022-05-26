import Head from 'next/head'

const HeadElement = (props:any) => {
    return <>
        <Head>
            <meta charSet="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <link rel="shortcut icon" href="/favicon.png" type="image/x-icon" />    
            <title>{props.title}</title>
            <script async src="https://www.googletagmanager.com/gtag/js?id=G-9C5614PCKX"></script>
            <script
                dangerouslySetInnerHTML={{
                __html: `window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
            
                gtag('config', 'G-9C5614PCKX');`
                }}
            />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:site" content="@Grim__Syndicate" />
            <meta name="twitter:creator" content="@Grim__Syndicate" />
            <meta property="og:title" content={props.ogTitle} />
            <meta property="og:url" content={props.ogUrl} />
            <meta property="og:type" content="website" />
            <meta property="og:image" content={props.ogImage} />
            <meta property="og:description" content={props.ogDescription} />
        </Head>
    </>
}


HeadElement.defaultProps = {
    title:"Ethereal Transit Authority",
    ogTitle:"Ethereal Transit Authority",
    ogUrl:"https://eta.grimsyndicate.com/",
    ogImage:"https://gsmedia.nyc3.cdn.digitaloceanspaces.com/share/eta.jpg",
    ogDescription:"The Ethereal Transit Authority, or the ETA as we call it around here, is solely responsible for one very specific, but universally critical task: the transportation of recently severed Souls from their native universe to their new eternal home in the Ethereal Plane.\n\nThe Grims that work at the ETA are the Reaper Agents of the Infinitum that are paid in $ASTRA, the currency of the Knownverse. So go get those Grims to work and we'll see ya around!"
}

export default HeadElement;
