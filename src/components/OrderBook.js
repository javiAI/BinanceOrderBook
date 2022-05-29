import React from 'react';
import WholeTable from './WholeTable';

export default function OrderBook(props) {
    /*
    Gives format to Order Book. 
    Groups data depending on decimals selection
    */
    const maxRows = props.tableData.maxRows;
    const initialPrice = props.tableData.initialPrice;
    const lastPrice = props.tableData.lastPrice;
    const currentDecimals = props.tableData.decimals;
    const f = 10 ** currentDecimals;

    const initialAsks = props.tableData.asks;
    const initialBids = props.tableData.bids;

    const qtyDecimals = Math.max(
        ...initialAsks.map(
            (a) => (Number(a.quantity).toString().split('.')[1] || []).length
        )
    );

    const formatOrderBook = () => {
        const groupArray = (arr, type) => {
            if (arr.length === 0) return arr;

            const result = [];
            arr.reduce((acc, cur, index) => {
                /*
                Grouping by rounded price, adding quantities.
                    - if accumulator price is the same as the current (once rounded to decimals), sum acc and cur quantities up.
                    - When acc Price and cur Price are different, add to result and reset acc with cur.

                This works because arr is already sorted by price.
                 */
                const accPrice =
                    (type === 'asks'
                        ? Math.ceil(+acc.price * f)
                        : Math.floor(+acc.price * f)) / f;
                const curPrice =
                    (type === 'asks'
                        ? Math.ceil(+cur.price * f)
                        : Math.floor(+cur.price * f)) / f;

                if ((accPrice === curPrice) & (index !== arr.length - 1)) {
                    return {
                        ...acc,
                        quantity: +acc.quantity + +cur.quantity,
                        maxId: Math.max(acc.maxId, cur.maxId),
                    };
                } else {
                    result.push({
                        ...acc,
                        price: accPrice.toFixed(Math.max(0, currentDecimals)),
                        quantity: Number(acc.quantity).toFixed(qtyDecimals),
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

    const price = +lastPrice ? lastPrice : initialPrice;

    return (
        <div className='orderBook'>
            <h1 className='price'>{!isNaN(price) ? price : '---'}</h1>
            <div className='tables--container'>
                <WholeTable
                    arr={asks}
                    maxRows={maxRows}
                    type={'asks'}
                    qtyDecimals={qtyDecimals}
                />
                <WholeTable
                    arr={bids}
                    maxRows={maxRows}
                    type={'bids'}
                    qtyDecimals={qtyDecimals}
                />
            </div>
        </div>
    );
}
