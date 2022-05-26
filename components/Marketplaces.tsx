import React from "react";

const Marketplaces = () => { 
  return <div className="box-light p-md has-border-radius-md">
    <div className="m-b-md"><strong>Don't have any Grims?</strong> Get one in any of these marketplaces:</div>
    <div className="marketplace-wrapper">
      <div className="marketplace-item-wrapper has-border-radius-md p-md has-text-centered">
        <a target="_blank" rel="noreferrer" href="https://magiceden.io/marketplace/grim_syndicate">
        <div className="markerplace-img-wrapper"><img src="/img/marketplace_logo_magiceden.svg" alt="Magic Eden logo" /></div>
        <div className="marketplace-label">Magic Eden</div></a>
      </div>
      <div className="marketplace-item-wrapper has-border-radius-md p-md has-text-centered">
        <a target="_blank" rel="noreferrer" href="https://opensea.io/collection/grim-syndicate">
          <div className="markerplace-img-wrapper"><img src="/img/marketplace_logo_opensea.svg" alt="OpenSea logo" /></div>
          <div className="marketplace-label">OpenSea</div>
        </a>
      </div>
      <div className="marketplace-item-wrapper has-border-radius-md p-md has-text-centered">
        <a target="_blank" rel="noreferrer" href="https://ftx.us/nfts/collection/Grim%20Syndicate/25/1">
          <div className="markerplace-img-wrapper"><img src="/img/marketplace_logo_ftx.svg" alt="FTX logo" /></div>
          <div className="marketplace-label">FTX</div>
        </a>
      </div>
      <div className="marketplace-item-wrapper has-border-radius-md p-md has-text-centered">
        <a target="_blank" rel="noreferrer" href="https://solanart.io/collections/grimsyndicate">
          <div className="markerplace-img-wrapper"><img src="/img/marketplace_logo_solanart.svg" alt="Solanart logo" /></div>
          <div className="marketplace-label">Solanart</div>
        </a>
      </div>
      <div className="marketplace-item-wrapper has-border-radius-md p-md has-text-centered">
        <a target="_blank" rel="noreferrer" href="https://alpha.art/collection/grim-syndicate/">
          <div className="markerplace-img-wrapper"><img src="/img/marketplace_logo_alphaart.svg" alt="AlphaArt logo" /></div>
          <div className="marketplace-label">Alpha Art</div>
        </a>
      </div>
      <div className="marketplace-item-wrapper has-border-radius-md p-md has-text-centered">
        <a target="_blank" rel="noreferrer" href="https://digitaleyes.market/collections/Grim%20Syndicate">
          <div className="markerplace-img-wrapper"><img src="/img/marketplace_logo_digitaleyes.svg" alt="Digital Eyes logo" /></div>
          <div className="marketplace-label">DigitalEyes</div>
        </a>
      </div>
    </div>
  </div>
}

export default Marketplaces;