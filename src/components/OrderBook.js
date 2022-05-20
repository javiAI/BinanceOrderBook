import React from 'react';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

export default function OrderBook(props) {
    const initialPrice = props.tableData.initialPrice;
    const lastPrice = props.tableData.lastPrice;
    const precision = props.tableData.precision.precision;
    const decimals = props.tableData.precision.decimals;
    const f = 10 ** decimals;
    // console.log(f, decimals);

    const initialAsks = props.tableData.asks;
    const initialBids = props.tableData.bids;

    const formatOrderBook = () => {
        const groupArray = (arr, type) => {
            const result = [];
            arr.reduce((acc, cur) => {
                // if (type === 'asks') {
                //     console.log(acc.price, Math.ceil(Number(acc.price) * f) / f);
                // }
                const accPrice =
                    (type === 'asks'
                        ? Math.floor(Number(acc.price) * f)
                        : Math.floor(Number(acc.price) * f)) / f;
                const curPrice =
                    (type === 'asks'
                        ? Math.floor(Number(cur.price) * f)
                        : Math.floor(Number(cur.price) * f)) / f;

                // if (type === 'asks') {
                //     accPrice = Math.ceil(accPrice) / f;
                //     curPrice = Math.ceil(curPrice) / f;
                // }
                // if (type === 'bids') {
                //     accPrice = Math.floor(accPrice) / f;
                //     curPrice = Math.floor(curPrice) / f;
                // }
                // const accPrice = Math.floor(Number(acc.price) * f) / f;
                // const curPrice = Math.floor(Number(cur.price) * f) / f;

                // if (accPrice !== curPrice) {
                //     console.log('!!', accPrice, curPrice);
                // }
                // console.log(typeof curPrice === 'number' ?);
                if (accPrice === curPrice) {
                    return {
                        ...acc,
                        quantity: Number(acc.quantity) + Number(cur.quantity),
                        maxId: Math.max(acc.maxId, cur.maxId),
                    };
                } else {
                    const accQuantity = Number(acc.quantity).toFixed(
                        Number(initialAsks[0].quantity) % 1 !== 0
                            ? initialAsks[0].quantity.split('.')[1].length
                            : 0
                    );

                    result.push({
                        ...acc,
                        price:
                            decimals >= 0
                                ? accPrice.toFixed(decimals)
                                : accPrice,
                        quantity: accQuantity,
                    });
                    return { ...cur };
                }
            });
            return result;
        };

        if (Math.min(initialAsks.length, initialBids.length, precision) > 0) {
            return {
                asks: groupArray(initialAsks, 'asks'),
                bids: groupArray(initialBids, 'bids'),
            };
        } else {
            return {
                asks: initialAsks,
                bids: initialBids,
            };
        }
    };

    const { asks, bids } = formatOrderBook();

    return (
        <div>
            ASKS
            <TableContainer component={Paper} sx={{ maxHeight: 1100 }}>
                <Table
                    sx={{ minWidth: 650 }}
                    size='small'
                    aria-label='simple table'
                >
                    <TableHead>
                        <TableRow>
                            <TableCell align='center'>Price</TableCell>
                            <TableCell align='center'>Size</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {asks.slice(-10).map((row, index) => (
                            <TableRow
                                key={'asks_' + index}
                                sx={{
                                    height: '1rem',
                                    '&:last-child td, &:last-child th': {
                                        border: 0,
                                    },
                                }}
                            >
                                <TableCell align='center'>
                                    {row.price}
                                </TableCell>
                                <TableCell align='center'>
                                    {row.quantity}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            {typeof lastPrice === 'object' ? initialPrice : lastPrice}
            <TableContainer component={Paper} sx={{ maxHeight: 1100 }}>
                <Table
                    sx={{ minWidth: 650 }}
                    size='small'
                    aria-label='simple table'
                >
                    <TableBody>
                        {bids.slice(0, 10).map((row, index) => (
                            <TableRow
                                key={'asks_' + index}
                                sx={{
                                    height: '1rem',
                                    '&:last-child td, &:last-child th': {
                                        border: 0,
                                    },
                                }}
                            >
                                <TableCell align='center'>
                                    {row.price}
                                </TableCell>
                                <TableCell align='center'>
                                    {row.quantity}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            BIDS
        </div>
    );
}
