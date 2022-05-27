import React from 'react';
import WholeTable from './WholeTable';

export default function OrderBook(props) {
    const maxRows = props.tableData.maxRows;

    const initialPrice = props.tableData.initialPrice;
    const lastPrice = props.tableData.lastPrice;
    const decimals = props.tableData.decimals;
    const f = 10 ** decimals;

    const initialAsks = props.tableData.asks;
    const initialBids = props.tableData.bids;

    const maxDecimals = Math.max(
        ...initialAsks.map(
            (a) => (Number(a.quantity).toString().split('.')[1] || []).length
        )
    );

    const formatOrderBook = () => {
        const groupArray = (arr, type) => {
            if (arr.length === 0) return arr;

            const result = [];
            arr.reduce((acc, cur, index) => {
                const accPrice =
                    (type === 'asks'
                        ? Math.ceil(Number(acc.price) * f)
                        : Math.floor(Number(acc.price) * f)) / f;
                const curPrice =
                    (type === 'asks'
                        ? Math.ceil(Number(cur.price) * f)
                        : Math.floor(Number(cur.price) * f)) / f;

                if ((accPrice === curPrice) & (index !== arr.length - 1)) {
                    return {
                        ...acc,
                        quantity: Number(acc.quantity) + Number(cur.quantity),
                        maxId: Math.max(acc.maxId, cur.maxId),
                    };
                } else {
                    result.push({
                        ...acc,
                        price: accPrice.toFixed(Math.max(0, decimals)),
                        quantity: Number(acc.quantity).toFixed(maxDecimals),
                    });
                    return { ...cur };
                }
            });
            return result;
        };

        return {
            asks: groupArray(initialAsks, 'asks'),
            bids: groupArray(initialBids, 'bids'),
        };
    };

    const { asks, bids } = formatOrderBook();
    const price = typeof lastPrice === 'object' ? initialPrice : lastPrice;

    return (
        <div className='orderBook'>
            <h1 className='price'>{price}</h1>
            <div className='tables--container'>
                <WholeTable
                    arr={asks}
                    maxRows={maxRows}
                    type={'asks'}
                    width={150}
                    maxDecimals={maxDecimals}
                />
                <WholeTable
                    arr={bids}
                    maxRows={maxRows}
                    type={'bids'}
                    width={150}
                    maxDecimals={maxDecimals}
                />
            </div>
        </div>
    );
}
