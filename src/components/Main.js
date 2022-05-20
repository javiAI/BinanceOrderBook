import React, { useRef, useState, useEffect } from 'react';
import Binance from 'binance-api-node';

import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

import { useNavigate, Routes, Route } from 'react-router-dom';
import OrderBook from './OrderBook';
import history from '../auxiliary_functions/BrowserHistory';

export default function Main() {
    // State Variables
    const defaultPair = 'BTCUSDT';

    const path = useRef(history.location.pathname);
    const symbols = useRef([]);
    const currentPair = useRef(
        path.current.slice(1) === '' ? defaultPair : path.current.slice(1)
    );
    const lastPrice = useRef('---');
    const lastPriceUpdateId = useRef(0);

    // Clients (WebSockets, Binance, Navigate)
    const socket = useRef(null);
    const client = useRef(null);
    const navigate = useRef(useNavigate());

    const [tableData, setTableData] = useState({
        pair: symbols.current.includes(path.current.slice(1))
            ? path.current.slice(1)
            : currentPair.current,
        precision: { precision: '', decimals: '' },
        initialPrice: lastPrice.current,
        lastPrice: lastPrice.current,
        lastUpdateId: lastPriceUpdateId,
        asks: [],
        bids: [],
    });

    useEffect(() => {
        console.log('1');
        client.current = Binance();
        const getExchangeInfo = async () => {
            symbols.current = await client.current
                .exchangeInfo()
                .then((data) => {
                    const updatedSymbols = data.symbols
                        .map((s) => {
                            return s.status === 'TRADING' ? s.symbol : '';
                        })
                        .filter((item) => item !== '');

                    const symbol = path.current.slice(1);

                    if (updatedSymbols.includes(symbol)) {
                        currentPair.current = symbol;
                    } else {
                        currentPair.current = defaultPair;
                        navigate.current('/' + currentPair.current);
                    }
                    setTableData((prev) => {
                        return {
                            ...prev,
                            pair: currentPair.current,
                        };
                    });
                    return updatedSymbols;
                });
        };
        getExchangeInfo().then(console.log('Symbols updated!'));
        console.log('1e');
    }, []);

    useEffect(() => {
        console.log('2');
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
        console.log('2e');
        return () => {
            socketCurrent.close();
        };
    }, [tableData.pair]);

    useEffect(() => {
        console.log('3');
        if (!client.current) return;
        if (!socket.current) return;

        const getOrderBookInfo = async () => {
            const respBook = await client.current
                .book({ symbol: tableData.pair, limit: 5000 })
                .then((data) => {
                    lastPriceUpdateId.current = data.lastUpdateId;
                    return {
                        lastUpdateId: data.lastUpdateId,
                        asks: data.asks.reverse().map((v) => {
                            return {
                                ...v,
                                maxId: data.lastUpdateId,
                            };
                        }),
                        bids: data.bids.map((v) => {
                            return {
                                ...v,
                                maxId: data.lastUpdateId,
                            };
                        }),
                    };
                });

            const lastPrice = await client.current
                .prices({ symbol: tableData.pair })
                .then((lastPrice) => {
                    return lastPrice[tableData.pair];
                });

            const digits = (value) => {
                const res = Number(value).toString().split('.');
                if (res.length === 1) {
                    return {
                        precision: res[0].length,
                        decimals:
                            (res[0].length -
                                Number('0.' + res[0])
                                    .toString()
                                    .split('.')[1].length) *
                            -1,
                    };
                }
                if (res.length === 2) {
                    return {
                        precision:
                            res[0] === '0'
                                ? Number(res[1]).toString().length
                                : res[0].length + res[1].length,
                        decimals: res[1].length,
                    };
                }
            };

            const getPrecision = () => {
                if (!respBook.asks.length | !respBook.bids.length) {
                    return null;
                }
                const relevantPrices = [
                    digits(respBook.asks.at(-1).price),
                    digits(lastPrice),
                    digits(respBook.bids.at(0).price),
                ];
                return {
                    precision: Math.max(
                        relevantPrices[0].precision,
                        relevantPrices[1].precision,
                        relevantPrices[2].precision
                    ),
                    decimals: Math.max(
                        relevantPrices[0].decimals,
                        relevantPrices[1].decimals,
                        relevantPrices[2].decimals
                    ),
                };
            };

            setTableData((prev) => {
                return {
                    ...prev,
                    ...respBook,
                    precision: getPrecision(),
                    initialPrice: lastPrice,
                    lastPrice: lastPrice,
                };
            });
            return lastPrice;
        };

        lastPrice.current = getOrderBookInfo();
        console.log('3e');
    }, [tableData.pair]);

    useEffect(() => {
        // console.log('4');
        if (!socket) return;

        socket.current.onmessage = (event) => {
            const updates = JSON.parse(event.data);
            const name = updates.e;

            if (name === 'depthUpdate') {
                lastPriceUpdateId.current = updates.u;
                setTableData((dt) => {
                    const currentPrice =
                        typeof dt.lastPrice === 'object'
                            ? dt.initialPrice
                            : dt.lastPrice;

                    const comparePrice = (a, b) => {
                        if (parseFloat(a.price) < parseFloat(b.price)) return 1;
                        if (parseFloat(a.price) > parseFloat(b.price))
                            return -1;
                        return 0;
                    };

                    const updateRows = (updates, arr, type) => {
                        for (let i = 0; i < updates.length; i++) {
                            const index = arr.findIndex(
                                (el) => el.price === updates[i][0]
                            );

                            if (index >= 0) {
                                if (updates[i][1] > 0) {
                                    arr[index].quantity = updates[i][1];
                                    arr[index].maxId = updates.u;
                                } else {
                                    arr.splice(index, 1);
                                }
                            } else {
                                if (updates[i][1] > 0) {
                                    arr.push({
                                        price: updates[i][0],
                                        quantity: updates[i][1],
                                        maxId: updates.u,
                                    });
                                }
                            }
                        }

                        return arr
                            .filter((item) =>
                                type === 'asks'
                                    ? (item.price >= currentPrice) |
                                      (item.lastUpdateId >
                                          lastPriceUpdateId.current)
                                    : (item.price <= currentPrice) |
                                      (item.lastUpdateId >
                                          lastPriceUpdateId.current)
                            )
                            .sort(comparePrice);
                    };

                    const dt_asks = updateRows(updates.a, dt.asks, 'asks');
                    const dt_bids = updateRows(updates.b, dt.bids, 'bids');

                    return {
                        ...dt,
                        lastUpdateId: updates.u,
                        lastPrice: lastPrice.current,
                        asks: dt_asks,
                        bids: dt_bids,
                    };
                });
            }

            if (name === 'trade') {
                lastPrice.current = updates.p;
            }
        };
        // console.log('4e');
    }, [tableData]);

    const handleChange = (_, v) => {
        currentPair.current = v;
        setTableData((prev) => {
            return {
                ...prev,
                pair: v,
            };
        });
        navigate.current('/' + v);
    };

    const handlePrecision = (v) => {
        setTableData((prev) => {
            const value = isNaN(v.target.valueAsNumber)
                ? prev.precision.decimals
                : v.target.valueAsNumber;
            const decimals = Math.min(
                Math.max(
                    prev.precision.decimals - prev.precision.precision + 1,
                    value
                ),
                18
            );
            const precision =
                prev.precision.precision + decimals - prev.precision.decimals;
            return {
                ...prev,
                precision: {
                    precision: precision,
                    decimals: decimals,
                },
            };
        });
    };

    return (
        <div className='Main'>
            <Autocomplete
                id='clear-on-escape'
                options={symbols.current}
                value={currentPair.current}
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
            <div className='selectors'>
                <TextField
                    id='precision'
                    value={Math.max(
                        tableData.precision.decimals -
                            tableData.precision.precision +
                            1,
                        tableData.precision.decimals
                    )}
                    label='Decimals'
                    type='number'
                    onChange={handlePrecision}
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
            </div>
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
                        path={'/' + tableData.pair}
                        element={<OrderBook tableData={tableData} />}
                    />
                </Routes>
            </div>
        </div>
    );
}
