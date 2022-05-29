
Live Demo! -> https://javiai.github.io/BinanceOrderBook/

# Binance Order Book

This project was done for Infomedia Informational Technologies

A replica of the Binance Order Book. 
  - Opens Binance websockets https://github.com/binance/binance-spot-api-docs/blob/master/web-socket-streams.md. Starts listening to messages from two streams, "trade" for last price updates and "depthUpdate" for asks/bids updates.
  - Calls Binance API https://github.com/binance-exchange/binance-api-node and extracts all active symbols available and a snapshot of the Binance Order Book for the selected symbol ('BTCUSDT' at start).  
  - Updates Order Book snapshot from websockets updates 

# Usage

Check the live demo here https://javiai.github.io/BinanceOrderBook/

To install locally:
Clone the repository

```
git clone https://github.com/javiAI/BinanceOrderBook.git
```

Move to your project location and install dependencies

```
cd BinanceOrderBook
npm install
```

Start!

```
npm start
```

