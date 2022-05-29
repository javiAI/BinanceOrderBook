import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import Binance from 'binance-api-node';

import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

import OrderBook from './OrderBook';
import history from '../auxiliary_functions/BrowserHistory';
import getDecimals from '../auxiliary_functions/GetDecimals';
import updateTable from '../auxiliary_functions/UpdateTable';

export default function Main() {
    /* Clients (WebSockets, Binance, Navigate) */
    const socket = useRef(null);
    const client = useRef(null);
    const navigate = useRef(useNavigate());

    /* Constant variables */
    const defaultPair = { symbol: 'BTCUSDT', decimals: 2 };

    /* State Variables */
    const symbols = useRef({ symbols: [], decimals: [] }); // IMPROVE!
    const path = useRef(history.location.pathname);
    const currentPair = useRef(path.current.slice(1));

    const lastPrice = useRef(NaN);
    const lastPriceUpdateId = useRef(0);

    const symbolIndex = symbols.current.symbols.indexOf(currentPair.current);
    const symbolDecimals = useRef(
        symbols.current.symbols.includes(currentPair.current)
            ? symbols.current.decimals[symbolIndex].max
            : defaultPair.decimals
    );

    // Order Book data and metadata
    const [tableData, setTableData] = useState({
        pair: symbols.current.symbols.includes(currentPair.current)
            ? currentPair.current
            : defaultPair.symbol,
        maxRows: 10, // only affects rows to display on frontend.
        decimals: symbolDecimals.current,
        initialPrice: lastPrice.current, // First price obtained from API
        lastPrice: lastPrice.current, // Last price obtained from WebSocket
        lastUpdateId: lastPriceUpdateId.current,
        asks: [],
        bids: [],
    });

    /* HOOKS */
    useEffect(() => {
        /* 
        Calls binance API-> https://github.com/binance-exchange/binance-api-node
            Triggers at:
                - Start/refresh (defaultPair.symbol is set at start/refresh).
            Actions:
                - Retrieve and set/update all current active pair symbols on Binance and their max. and min. number of decimals (min. value by default).
                - Check if currentPair is in retrieved symbols, otherwise set/update to defaultPair. 
                - Navigate to currentPair if not already there.
        */

        client.current = Binance();
        const getExchangeInfo = async () => {
            symbols.current = await client.current
                .exchangeInfo()
                .then((data) => {
                    const updatedSymbols = data.symbols.reduce(
                        (acc, cur) => {
                            // checks if cur.symbol is active (status='TRADING')
                            if (cur.status === 'TRADING') {
                                acc.symbols.push(cur.symbol);
                                acc.decimals.push({
                                    // Min and max orders allowed. "max" (minPrice) is used to set initial decimals.
                                    max: getDecimals(cur.filters[0].minPrice),
                                    min: getDecimals(cur.filters[0].maxPrice),
                                });
                            }
                            return acc;
                        },
                        { symbols: [], decimals: [] }
                    );
                    return updatedSymbols;
                });

            // if currentPair not in symbols, go back to defaultPair
            if (!symbols.current.symbols.includes(currentPair.current))
                currentPair.current = defaultPair.symbol;

            // Set/Update OrderBook metadata
            setTableData((prev) => ({
                ...prev,
                pair: currentPair.current,
            }));
        };
        getExchangeInfo().then(console.log('Symbols updated!'));
        //eslint-disable-next-line
    }, [defaultPair.symbol]);

    useEffect(() => {
        /* 
        Starts Binance WebSocket -> https://github.com/binance/binance-spot-api-docs/blob/master/web-socket-streams.md
            Triggers when:
                - DataTable.pair is updated. The current selection from explorer bar or dropdown.
            Actions:
                - Open Order Book stream, '@depth@100ms'.
                - Open stream last trade stream. Used to get price, '@trade'.
        */

        const streams = [
            tableData.pair.toLowerCase() + '@depth@100ms',
            tableData.pair.toLowerCase() + '@trade',
        ];

        socket.current = new WebSocket(
            'wss://stream.binance.com:9443/ws/' + streams.join('/')
        );
        socket.current.onopen = () => {
            console.log('Opening');
        };
        socket.current.onclose = () => {
            console.log('Closing');
        };

        const socketCurrent = socket.current;
        return () => {
            socketCurrent.close();
        };
    }, [tableData.pair]);

    useEffect(() => {
        /* 
        Calls binance API-> https://github.com/binance-exchange/binance-api-node
            Triggers when:
                - currentPair.current is updated. The current selection from explorer bar or dropdown.
            Actions:
                - Retrieve and set order book data (bids / asks) and price for the selected symbol (currentPair.current).
                - Retrieve and set default number of decimals for the selected symbol.
        */

        const getOrderBookInfo = async () => {
            const respBook = await client.current
                .book({ symbol: currentPair.current, limit: 5000 })
                .then((data) => {
                    const lastId = data.lastUpdateId;
                    lastPriceUpdateId.current = lastId;
                    return {
                        lastUpdateId: data.lastUpdateId,
                        asks: data.asks.map((v) => ({ ...v, maxId: lastId })),
                        bids: data.bids.map((v) => ({ ...v, maxId: lastId })),
                    };
                });

            lastPrice.current = await client.current
                .prices({ symbol: currentPair.current })
                .then((lastPrice) => Number(lastPrice[currentPair.current]));

            const index = symbols.current.symbols.indexOf(currentPair.current);
            symbolDecimals.current = symbols.current.decimals[index].max;

            // Set/Update OrderBook metadata
            setTableData((prev) => ({
                ...prev,
                ...respBook,
                decimals: symbolDecimals.current,
                initialPrice: lastPrice.current.toFixed(symbolDecimals.current),
                lastPrice: lastPrice.current.toFixed(symbolDecimals.current),
            }));
        };

        getOrderBookInfo();
        // If currentPair and bar address do not match, navigate to currentPair
        if (path.current.slice(1) !== currentPair.current)
            navigate.current('/' + currentPair.current);

        //eslint-disable-next-line
    }, [currentPair.current]);

    useEffect(() => {
        /* 
        Listens binance websocket messages. Receives info from two streams, "trade" and "depthUpdate", "price" and "new orders" respectively. 
        They are both set only during "depthUpdate" so they are set synchronously, during "trade" it just saves its price value for later.
            Triggers when:
            - tableData.lastUpdateId is updated. Indicates there is new data to process.
            Actions:
            - Checks type of message.
                - If "trade", retrieves and saves last symbol price.
                - If "depthUpdate", updates/sets price, asks and bids. Asks and bids go through three steps before. Rows removal/addition/swap -> rows grouping -> rows sorting.
        */

        socket.current.onmessage = (event) => {
            const updates = JSON.parse(event.data);

            // Price is not set to tableData yet but is recorded.
            if (updates.e === 'trade') lastPrice.current = Number(updates.p);

            if (updates.e === 'depthUpdate') {
                lastPriceUpdateId.current = updates.u;
                setTableData((dt) => {
                    // It reads "is x convertible to Number then x, else y"
                    const p = +dt.lastPrice || dt.initialPrice;
                    const u = updates.u;
                    return {
                        ...dt,
                        lastUpdateId: u,
                        lastPrice: lastPrice.current.toFixed(
                            symbolDecimals.current
                        ),
                        asks: updateTable(updates.a, dt.asks, 'asks', p, u),
                        bids: updateTable(updates.b, dt.bids, 'bids', p, u),
                    };
                });
            }
        };
        //eslint-disable-next-line
    }, [tableData.lastUpdateId]);

    const handleChange = (_, v) => {
        // Autocomplete "onChange". Sets pair and navigates to it.
        currentPair.current = v;
        setTableData((prev) => ({ ...prev, pair: v }));
        navigate.current('/' + v);
    };

    const handlePrecision = (v) => {
        // TextField "onChange". Receives decimals input, checks if it is within its allowed range of decimals and sets its value.

        const i = symbols.current.symbols.indexOf(currentPair.current); // index
        const max_d = symbols.current.decimals[i].max;
        const d = (v.target.valueAsNumber ??= max_d);

        let priceRef;
        if (isNaN(lastPrice.current)) {
            const minA = +tableData.asks.at(-1).price.toString();
            const maxB = +tableData.bids.at(0).price.toString();
            priceRef = (minA.length > maxB.length ? minA : maxB).split('.');
        } else priceRef = lastPrice.current.toString().split('.');

        const min_d =
            priceRef[0] === '0'
                ? priceRef[1].length - Number(priceRef[1]).toString().length + 1
                : getDecimals(priceRef[0]) + 1;

        const decimals = Math.min(Math.max(min_d, d), max_d);

        setTableData((prev) => ({ ...prev, decimals: decimals }));
    };

    const handleMaxRowsChange = (e) => {
        // LabelInput "onChange". Updates/sets the number of rows to display.
        setTableData((prev) => ({ ...prev, maxRows: e.target.value }));
    };

    return (
        <div className='main'>
            <div className='selectors'>
                <div className='autocomplete'>
                    <Autocomplete
                        id='clear-on-escape'
                        options={symbols.current.symbols}
                        value={currentPair.current}
                        sx={{ width: 500 }}
                        autoHighlight={true}
                        clearOnEscape
                        disableClearable
                        onChange={handleChange}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label='Select trading pair'
                                variant='standard'
                            />
                        )}
                    />
                </div>
                <div className='textfield'>
                    <TextField
                        id='precision'
                        value={tableData.decimals}
                        label='Decimals'
                        type='number'
                        onChange={handlePrecision}
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />
                </div>
                <div className='inputLabel'>
                    <InputLabel id='maxRowsLabel'>Max. rows</InputLabel>
                    <Select
                        labelId='maxRowsLabel'
                        id='max-rows-select'
                        value={tableData.maxRows}
                        label='Max. Rows'
                        onChange={handleMaxRowsChange}
                    >
                        <MenuItem value={10}>10</MenuItem>
                        <MenuItem value={25}>25</MenuItem>
                        <MenuItem value={50}>50</MenuItem>
                        <MenuItem value={75}>75</MenuItem>
                        <MenuItem value={100}>100</MenuItem>
                    </Select>
                </div>
            </div>
            <Routes>
                <Route
                    path={'/' + currentPair.current}
                    element={
                        <OrderBook
                            tableData={tableData}
                            priceDecimals={symbolDecimals.current}
                        />
                    }
                />
                <Route
                    path={'/BinanaceOrderBook' + currentPair.current}
                    element={
                        <OrderBook
                            tableData={tableData}
                            priceDecimals={symbolDecimals.current}
                        />
                    }
                />
            </Routes>
        </div>
    );
}
