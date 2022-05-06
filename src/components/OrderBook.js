import React from 'react';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

// const client = Binance();

export default function OrderBook(props) {
    const asks = props.tableData.asks;
    const bids = props.tableData.bids;

    return (
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
                    ASKS
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
                            <TableCell align='center'>{row.price}</TableCell>
                            <TableCell align='center'>{row.quantity}</TableCell>
                        </TableRow>
                    ))}
                    BIDS
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
                            <TableCell align='center'>{row.price}</TableCell>
                            <TableCell align='center'>{row.quantity}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
