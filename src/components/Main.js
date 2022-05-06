import React, { useRef, useState, useEffect } from 'react';
import Binance from 'binance-api-node';

import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

import { useNavigate, Routes, Route } from 'react-router-dom';
import OrderBook from './OrderBook';
import history from '../auxiliary_functions/BrowserHistory';
// import { Socket } from 'net';

export default function Main() {
    // State Variables
    const [symbols, setSymbols] = useState([]);
    const [defaultPair, setDefaultPair] = useState('BTCUSDT');
    const path = history.location.pathname;
    const pair = ['', 'preview/', 'BinanceOrderBook'].includes(path.slice(1))
        ? defaultPair
        : path.slice(1);
    const [selection, setSelection] = useState(pair);
    const [tableData, setTableData] = useState({
        pair: selection,
        lastUpdateId: 0,
        asks: [],
        bids: [],
    });

    // Clients (WebSockets, Binance, Navigate)
    const socket = useRef(null);
    const client = Binance(); // useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        setDefaultPair(pair);

        const getExchangeInfo = async () => {
            const respSymbols = await client.exchangeInfo().then((data) =>
                data.symbols.map((pair) => {
                    // console.log(pair.status, pair.symbol);
                    return pair.status === 'TRADING' ? pair.symbol : '';
                })
            );
            setSymbols(respSymbols.filter((item) => item !== '').sort());
        };
        getExchangeInfo().then(console.log('Symbols updated!'));
    }, []);

    useEffect(() => {
        if (symbols.length === 0) return;

        if (symbols.includes(pair)) {
            setSelection(pair);
        } else {
            navigate('/' + defaultPair);
            setSelection(defaultPair);
        }
    }, [symbols]);

    useEffect(() => {
        // if (!symbols.includes(selection)) return;

        socket.current = new WebSocket(
            'wss://stream.binance.com:9443/ws/' +
                selection.toLowerCase() +
                '@depth@100ms'
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
    }, [selection]);

    useEffect(() => {
        if (!client) return;
        if (!socket.current) return;
        const pair = history.location.pathname.slice(1);
        if ((pair !== selection) & (typeof selection !== 'undefined'))
            navigate('/' + selection);

        const getOrderBookInfo = async () => {
            const respBook = await client
                .book({ symbol: selection })
                .then((data) => {
                    return {
                        pair: selection,
                        lastUpdateId: data.lastUpdateId,
                        asks: data.asks.reverse(),
                        bids: data.bids,
                    };
                });
            setTableData(respBook);
        };
        getOrderBookInfo();
    }, [selection]);

    useEffect(() => {
        if (!socket) return;

        socket.current.onmessage = (event) => {
            const updates = JSON.parse(event.data);
            const name = updates.e;
            const symbol = updates.s;
            if (
                (name === 'depthUpdate') &
                (symbol === tableData.pair) // &
                // (updates.u > tableData.lastUpdateId) &
                // (updates.U < tableData.lastUpdateId)
            ) {
                setTableData((dt) => {
                    const dt_asks = dt.asks;
                    const dt_bids = dt.bids;

                    for (let i = 0; i < updates.a.length; i++) {
                        const index = dt_asks.findIndex(
                            (el) => el.price === updates.a[i][0]
                        );

                        if (index >= 0) {
                            if (updates.a[i][1] > 0) {
                                dt_asks[index].quantity = updates.a[i][1];
                            } else {
                                dt_asks.splice(index, 1);
                            }
                        } else {
                            if (updates.a[i][1] > 0) {
                                // console.log(updates.a[i]);
                                dt_asks.push({
                                    price: updates.a[i][0],
                                    quantity: updates.a[i][1],
                                });
                            }
                        }
                    }
                    for (let j = 0; j < updates.b.length; j++) {
                        const index = dt_bids.findIndex(
                            (el) => el.price === updates.b[j][0]
                        );

                        if (index >= 0) {
                            if (updates.b[j][1] > 0) {
                                dt_bids[index].quantity = updates.b[j][1];
                            } else {
                                dt_bids.splice(index, 1);
                            }
                        } else {
                            if (updates.b[j][1] > 0) {
                                // console.log(
                                //     'AQUI',
                                //     [updates.b[j][0], updates.b[j][1]],
                                //     dt_bids[j]
                                // );

                                dt_bids.push({
                                    price: updates.b[j][0],
                                    quantity: updates.b[j][1],
                                });
                            }
                        }
                    }

                    function comparePrice(a, b) {
                        if (parseFloat(a.price) < parseFloat(b.price)) return 1;
                        if (parseFloat(a.price) > parseFloat(b.price))
                            return -1;
                        return 0;
                    }

                    return {
                        ...dt,
                        lastUpdateId: updates.u,
                        asks: dt_asks.sort(comparePrice),
                        bids: dt_bids.sort(comparePrice),
                    };
                });
            }

            // if (m < 50) {
            //     console.log('M', m);
            //     console.log('e', updates.e, updates.e === 'depthUpdate');
            //     console.log(
            //         's',
            //         updates.s,
            //         tableData.pair,
            //         updates.s === tableData.pair
            //     );
            //     console.log('n', n, n === 0);
            //     console.log(
            //         'U',
            //         updates.U,
            //         tableData.lastUpdateId,
            //         updates.U < tableData.lastUpdateId
            //     );
            //     console.log(
            //         'u',
            //         updates.u,
            //         tableData.lastUpdateId,
            //         updates.u > tableData.lastUpdateId
            //     );
            //     console.log('----------------------');
            //     m += 1;
            // }
        };
    }, [tableData]);

    const handleChange = (_, v) => {
        if (symbols.includes(v)) {
            navigate('/' + v /*, { replace: true } */);
            setSelection(v);
        } else {
            setSelection(defaultPair);
            navigate('/' + defaultPair /*, { replace: true } */);
        }
    };

    return (
        <div className='Main'>
            <Autocomplete
                id='clear-on-escape'
                options={symbols}
                value={symbols.includes(selection) ? selection : defaultPair}
                sx={{ width: 300 }}
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
            <div className='Router'>
                <Routes>
                    <Route
                        path={'/'}
                        element={<OrderBook tableData={tableData} />}
                    />
                    <Route
                        path={'/preview/'}
                        element={<OrderBook tableData={tableData} />}
                    />
                    <Route
                        path={'/' + selection}
                        element={<OrderBook tableData={tableData} />}
                    />
                </Routes>
            </div>
        </div>
    );
}
